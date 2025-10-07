-- Add instance_name column to whatsapp_instances table
-- This column is used to store a user-friendly name for the WhatsApp instance

ALTER TABLE public.whatsapp_instances
ADD COLUMN IF NOT EXISTS instance_name TEXT;

-- Add last_connected_at column (also missing from schema but present in types)
ALTER TABLE public.whatsapp_instances
ADD COLUMN IF NOT EXISTS last_connected_at TIMESTAMPTZ;

-- Add comment
COMMENT ON COLUMN public.whatsapp_instances.instance_name IS 'User-friendly name for the WhatsApp instance';
COMMENT ON COLUMN public.whatsapp_instances.last_connected_at IS 'Timestamp of the last successful connection';
