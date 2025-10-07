-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- ============================================
-- UPDATED_AT TRIGGERS
-- ============================================

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Apply to all tables with updated_at
CREATE TRIGGER update_organizations_updated_at
  BEFORE UPDATE ON public.organizations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_organization_settings_updated_at
  BEFORE UPDATE ON public.organization_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_whatsapp_instances_updated_at
  BEFORE UPDATE ON public.whatsapp_instances
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_services_updated_at
  BEFORE UPDATE ON public.services
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_contacts_updated_at
  BEFORE UPDATE ON public.contacts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_pets_updated_at
  BEFORE UPDATE ON public.pets
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_bookings_updated_at
  BEFORE UPDATE ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_conversations_updated_at
  BEFORE UPDATE ON public.conversations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_scheduled_followups_updated_at
  BEFORE UPDATE ON public.scheduled_followups
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_aurora_proactive_messages_updated_at
  BEFORE UPDATE ON public.aurora_proactive_messages
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_aurora_automations_updated_at
  BEFORE UPDATE ON public.aurora_automations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- AUDIT LOGGING TRIGGER
-- ============================================

CREATE OR REPLACE FUNCTION public.audit_trigger_function()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.audit_logs (
      organization_id,
      user_id,
      action,
      table_name,
      record_id,
      new_values
    ) VALUES (
      NEW.organization_id,
      auth.uid(),
      TG_OP,
      TG_TABLE_NAME,
      NEW.id,
      to_jsonb(NEW)
    );
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO public.audit_logs (
      organization_id,
      user_id,
      action,
      table_name,
      record_id,
      old_values,
      new_values
    ) VALUES (
      NEW.organization_id,
      auth.uid(),
      TG_OP,
      TG_TABLE_NAME,
      NEW.id,
      to_jsonb(OLD),
      to_jsonb(NEW)
    );
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO public.audit_logs (
      organization_id,
      user_id,
      action,
      table_name,
      record_id,
      old_values
    ) VALUES (
      OLD.organization_id,
      auth.uid(),
      TG_OP,
      TG_TABLE_NAME,
      OLD.id,
      to_jsonb(OLD)
    );
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

-- Apply audit triggers to sensitive tables
CREATE TRIGGER audit_bookings
  AFTER INSERT OR UPDATE OR DELETE ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_function();

CREATE TRIGGER audit_contacts
  AFTER INSERT OR UPDATE OR DELETE ON public.contacts
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_function();

CREATE TRIGGER audit_pets
  AFTER INSERT OR UPDATE OR DELETE ON public.pets
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_function();

CREATE TRIGGER audit_services
  AFTER INSERT OR UPDATE OR DELETE ON public.services
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_function();

-- ============================================
-- CONVERSATION LAST MESSAGE UPDATE
-- ============================================

CREATE OR REPLACE FUNCTION public.update_conversation_last_message()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.conversations
  SET
    last_message_at = NEW.created_at,
    last_human_message_at = CASE
      WHEN NEW.sender = 'human' THEN NEW.created_at
      ELSE last_human_message_at
    END
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_conversation_on_message
  AFTER INSERT ON public.messages
  FOR EACH ROW EXECUTE FUNCTION public.update_conversation_last_message();

-- ============================================
-- CONTACT LAST INTERACTION UPDATE
-- ============================================

CREATE OR REPLACE FUNCTION public.update_contact_last_interaction()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.contacts
  SET last_interaction_at = NOW()
  WHERE id = (
    SELECT contact_id FROM public.conversations WHERE id = NEW.conversation_id
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_contact_on_message
  AFTER INSERT ON public.messages
  FOR EACH ROW EXECUTE FUNCTION public.update_contact_last_interaction();

-- ============================================
-- MESSAGE QUEUE PROCESSING
-- ============================================

CREATE OR REPLACE FUNCTION public.process_pending_queue_jobs()
RETURNS TABLE (
  job_id UUID,
  organization_id UUID,
  job_type TEXT,
  payload JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  UPDATE public.message_queue
  SET
    status = 'processing',
    started_at = NOW()
  WHERE id IN (
    SELECT id FROM public.message_queue
    WHERE status = 'pending'
      AND scheduled_for <= NOW()
      AND attempts < max_attempts
    ORDER BY priority DESC, scheduled_for ASC
    LIMIT 100
    FOR UPDATE SKIP LOCKED
  )
  RETURNING
    id AS job_id,
    message_queue.organization_id,
    message_queue.job_type,
    message_queue.payload;
END;
$$;

-- ============================================
-- WEBHOOK RETRY LOGIC
-- ============================================

CREATE OR REPLACE FUNCTION public.schedule_webhook_retry()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'failed' AND NEW.attempts < NEW.max_attempts THEN
    NEW.status := 'retrying';
    NEW.next_retry_at := NOW() + (INTERVAL '1 minute' * POWER(2, NEW.attempts)); -- Exponential backoff
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER webhook_retry_trigger
  BEFORE UPDATE ON public.webhook_deliveries
  FOR EACH ROW EXECUTE FUNCTION public.schedule_webhook_retry();

-- ============================================
-- UTILITY FUNCTIONS
-- ============================================

-- Get organization statistics
CREATE OR REPLACE FUNCTION public.get_organization_stats(org_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  stats JSONB;
BEGIN
  SELECT jsonb_build_object(
    'total_contacts', (SELECT COUNT(*) FROM public.contacts WHERE organization_id = org_id AND is_active = TRUE),
    'total_pets', (SELECT COUNT(*) FROM public.pets WHERE organization_id = org_id AND is_active = TRUE),
    'total_bookings', (SELECT COUNT(*) FROM public.bookings WHERE organization_id = org_id),
    'active_conversations', (SELECT COUNT(*) FROM public.conversations WHERE organization_id = org_id AND status = 'active'),
    'messages_today', (SELECT COUNT(*) FROM public.messages WHERE organization_id = org_id AND created_at >= CURRENT_DATE),
    'bookings_today', (SELECT COUNT(*) FROM public.bookings WHERE organization_id = org_id AND booking_date = CURRENT_DATE),
    'revenue_this_month_cents', (SELECT COALESCE(SUM(price_cents), 0) FROM public.bookings WHERE organization_id = org_id AND booking_date >= DATE_TRUNC('month', CURRENT_DATE) AND status = 'completed')
  ) INTO stats;

  RETURN stats;
END;
$$;

-- Clean up expired backups
CREATE OR REPLACE FUNCTION public.cleanup_expired_backups()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM public.backup_metadata
  WHERE expires_at IS NOT NULL AND expires_at < NOW();

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;

-- Retry failed queue jobs
CREATE OR REPLACE FUNCTION public.retry_failed_queue_jobs()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  retried_count INTEGER;
BEGIN
  UPDATE public.message_queue
  SET
    status = 'pending',
    scheduled_for = NOW() + INTERVAL '5 minutes'
  WHERE status = 'failed'
    AND attempts < max_attempts;

  GET DIAGNOSTICS retried_count = ROW_COUNT;
  RETURN retried_count;
END;
$$;

COMMENT ON FUNCTION public.get_organization_stats(UUID) IS 'Get real-time statistics for an organization';
COMMENT ON FUNCTION public.cleanup_expired_backups() IS 'Delete expired backup metadata records';
COMMENT ON FUNCTION public.retry_failed_queue_jobs() IS 'Retry failed queue jobs that haven''t exceeded max attempts';
