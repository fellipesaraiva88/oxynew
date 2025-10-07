-- ============================================
-- AUZAP CONSOLIDATED SCHEMA v2.0
-- 15 Core Tables + Advanced Structures
-- Multi-tenant with Zero Trust RLS
-- ============================================

-- ============================================
-- PHASE 1: ENUM TYPES
-- ============================================

DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('owner', 'admin', 'manager', 'employee');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE public.instance_status AS ENUM ('disconnected', 'connecting', 'connected', 'error');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE public.service_category AS ENUM ('banho_tosa', 'veterinaria', 'hotel', 'creche', 'produtos', 'outros');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE public.contact_status AS ENUM ('new', 'active', 'inactive', 'blocked');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE public.contact_source AS ENUM ('whatsapp_ai', 'whatsapp_manual', 'website', 'phone', 'referral');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE public.pet_species AS ENUM ('dog', 'cat', 'bird', 'rabbit', 'other');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE public.pet_size AS ENUM ('pequeno', 'medio', 'grande', 'gigante');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE public.booking_status AS ENUM ('scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE public.booking_created_by AS ENUM ('ai', 'human', 'customer');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE public.conversation_status AS ENUM ('active', 'waiting_human', 'resolved', 'archived');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE public.conversation_priority AS ENUM ('low', 'normal', 'high', 'urgent');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE public.message_type AS ENUM ('text', 'image', 'audio', 'video', 'document', 'location');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE public.message_direction AS ENUM ('inbound', 'outbound');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE public.message_sender AS ENUM ('customer', 'ai', 'human');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE public.ai_action_type AS ENUM (
    'create_contact', 'update_contact', 'create_pet', 'update_pet',
    'create_booking', 'update_booking', 'cancel_booking',
    'create_sale', 'schedule_followup', 'escalate_to_human'
  );
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE public.ai_action_status AS ENUM ('pending', 'completed', 'failed', 'cancelled');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE public.followup_type AS ENUM (
    'appointment_reminder', 'feedback_request', 'vaccine_reminder',
    'birthday_greeting', 'reactivation', 'checkout_reminder',
    'payment_reminder', 'review_request'
  );
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE public.followup_status AS ENUM ('pending', 'sent', 'delivered', 'read', 'cancelled', 'failed');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE public.aurora_trigger_type AS ENUM (
    'weather_alert', 'seasonal_campaign', 'capacity_optimization',
    'customer_lifecycle', 'inventory_alert', 'health_reminder'
  );
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE public.aurora_message_status AS ENUM ('draft', 'scheduled', 'sent', 'delivered', 'cancelled');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE public.automation_trigger AS ENUM ('time_based', 'event_based', 'condition_based', 'ai_detected');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE public.automation_status AS ENUM ('active', 'paused', 'completed', 'error');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE public.queue_status AS ENUM ('pending', 'processing', 'completed', 'failed', 'retrying');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE public.webhook_status AS ENUM ('pending', 'delivered', 'failed', 'retrying');
EXCEPTION WHEN duplicate_object THEN null;
END $$;
