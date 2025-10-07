-- Add WhatsApp enrichment columns to contacts table
-- Automatically extract profile picture, push name, and attendance stage

-- Add profile picture URL column
ALTER TABLE contacts
ADD COLUMN IF NOT EXISTS profile_picture_url TEXT;

-- Add WhatsApp push name (nome que aparece no WhatsApp)
ALTER TABLE contacts
ADD COLUMN IF NOT EXISTS whatsapp_push_name TEXT;

-- Add attendance stage for funnel tracking
ALTER TABLE contacts
ADD COLUMN IF NOT EXISTS attendance_stage TEXT DEFAULT 'first-contact';

-- Add index for attendance stage (para queries rápidas no Kanban)
CREATE INDEX IF NOT EXISTS idx_contacts_attendance_stage
ON contacts(organization_id, attendance_stage)
WHERE deleted_at IS NULL;

-- Add index for profile picture lookup
CREATE INDEX IF NOT EXISTS idx_contacts_profile_picture
ON contacts(organization_id, profile_picture_url)
WHERE deleted_at IS NULL AND profile_picture_url IS NOT NULL;

-- Add check constraint for attendance stage values
ALTER TABLE contacts
ADD CONSTRAINT check_attendance_stage
CHECK (attendance_stage IN (
  'first-contact',      -- Primeiro contato
  'in-conversation',    -- Em conversa
  'objections',         -- Dúvidas/Objeções
  'proposal-sent',      -- Proposta enviada
  'considering',        -- Pensando
  'converted',          -- Convertido
  'lost'                -- Perdido
));

-- Update existing contacts to have default stage
UPDATE contacts
SET attendance_stage = 'first-contact'
WHERE attendance_stage IS NULL;

-- Add comment explaining the columns
COMMENT ON COLUMN contacts.profile_picture_url IS 'URL da foto de perfil extraída automaticamente do WhatsApp';
COMMENT ON COLUMN contacts.whatsapp_push_name IS 'Nome que aparece no WhatsApp (pushName) extraído automaticamente';
COMMENT ON COLUMN contacts.attendance_stage IS 'Estágio no funil de atendimento para tracking no Kanban';
