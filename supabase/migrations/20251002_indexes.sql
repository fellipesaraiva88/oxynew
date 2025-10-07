-- ============================================
-- PERFORMANCE INDEXES
-- Target: <50ms queries, <200ms p95 API response
-- ============================================

-- Organizations
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_organizations_slug ON public.organizations(slug);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_organizations_status ON public.organizations(status);

-- User Roles (critical for RLS)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_roles_org_id ON public.user_roles(organization_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_roles_user_org ON public.user_roles(user_id, organization_id);

-- Organization Settings
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_org_settings_org_id ON public.organization_settings(organization_id);

-- WhatsApp Instances
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_whatsapp_org_id ON public.whatsapp_instances(organization_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_whatsapp_status ON public.whatsapp_instances(status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_whatsapp_org_status ON public.whatsapp_instances(organization_id, status);

-- Services
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_services_org_id ON public.services(organization_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_services_category ON public.services(category);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_services_active ON public.services(is_active) WHERE is_active = TRUE;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_services_org_active ON public.services(organization_id, is_active) WHERE is_active = TRUE;

-- Authorized Owner Numbers
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_authorized_org_phone ON public.authorized_owner_numbers(organization_id, phone_number);

-- Contacts (high traffic)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_contacts_org_phone ON public.contacts(organization_id, phone_number);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_contacts_org_status ON public.contacts(organization_id, status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_contacts_phone ON public.contacts(phone_number);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_contacts_tags ON public.contacts USING GIN(tags);

-- Pets
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_pets_contact_id ON public.pets(contact_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_pets_org_species ON public.pets(organization_id, species);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_pets_org_active ON public.pets(organization_id, is_active) WHERE is_active = TRUE;

-- Bookings (critical path)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_bookings_org_date ON public.bookings(organization_id, booking_date);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_bookings_pet_id ON public.bookings(pet_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_bookings_service_id ON public.bookings(service_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_bookings_status ON public.bookings(organization_id, status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_bookings_org_date_status ON public.bookings(organization_id, booking_date, status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_bookings_contact_id ON public.bookings(contact_id);

-- Conversations (high traffic)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_conversations_org_status ON public.conversations(organization_id, status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_conversations_contact_id ON public.conversations(contact_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_conversations_whatsapp_chat ON public.conversations(whatsapp_chat_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_conversations_org_updated ON public.conversations(organization_id, last_message_at DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_conversations_tags ON public.conversations USING GIN(tags);

-- Messages (highest traffic)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_messages_conversation_id ON public.messages(conversation_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_messages_created_at ON public.messages(created_at DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_messages_org_created ON public.messages(organization_id, created_at DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_messages_conversation_created ON public.messages(conversation_id, created_at DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_messages_whatsapp_id ON public.messages(whatsapp_message_id);

-- AI Interactions
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ai_interactions_org_status ON public.ai_interactions(organization_id, status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ai_interactions_conversation ON public.ai_interactions(conversation_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ai_interactions_message ON public.ai_interactions(message_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ai_interactions_created ON public.ai_interactions(created_at DESC);

-- Scheduled Followups
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_followups_org_scheduled ON public.scheduled_followups(organization_id, scheduled_for);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_followups_status_scheduled ON public.scheduled_followups(status, scheduled_for);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_followups_contact ON public.scheduled_followups(contact_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_followups_booking ON public.scheduled_followups(booking_id);

-- Aurora Proactive Messages
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_aurora_messages_org_status ON public.aurora_proactive_messages(organization_id, status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_aurora_messages_scheduled ON public.aurora_proactive_messages(scheduled_for);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_aurora_messages_trigger ON public.aurora_proactive_messages(trigger_type);

-- Aurora Automations
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_aurora_automations_org_status ON public.aurora_automations(organization_id, status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_aurora_automations_next_exec ON public.aurora_automations(next_execution_at) WHERE status = 'active';
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_aurora_automations_trigger ON public.aurora_automations(trigger_type);

-- Message Queue
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_message_queue_org_status ON public.message_queue(organization_id, status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_message_queue_scheduled ON public.message_queue(scheduled_for, status, priority DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_message_queue_message ON public.message_queue(message_id);

-- Audit Logs
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_logs_org_created ON public.audit_logs(organization_id, created_at DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_logs_table_record ON public.audit_logs(table_name, record_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_logs_user ON public.audit_logs(user_id, created_at DESC);

-- Analytics Events
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_analytics_events_org_created ON public.analytics_events(organization_id, created_at DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_analytics_events_name ON public.analytics_events(event_name, created_at DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_analytics_events_category ON public.analytics_events(event_category);

-- Webhook Deliveries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_webhook_deliveries_org_status ON public.webhook_deliveries(organization_id, status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_webhook_deliveries_retry ON public.webhook_deliveries(next_retry_at, status) WHERE status = 'retrying';
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_webhook_deliveries_event ON public.webhook_deliveries(event_type);

-- Backup Metadata
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_backup_metadata_org_created ON public.backup_metadata(organization_id, created_at DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_backup_metadata_expires ON public.backup_metadata(expires_at) WHERE expires_at IS NOT NULL;

-- Update statistics
ANALYZE public.organizations;
ANALYZE public.user_roles;
ANALYZE public.contacts;
ANALYZE public.pets;
ANALYZE public.bookings;
ANALYZE public.conversations;
ANALYZE public.messages;
