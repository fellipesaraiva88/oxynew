-- Enhance knowledge_base table with additional fields for advanced KB management
-- Migration: 20251003_enhance_knowledge_base

-- Add new columns to knowledge_base
ALTER TABLE public.knowledge_base
  ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'geral' CHECK (category IN ('servicos', 'precos', 'horarios', 'politicas', 'emergencias', 'geral')),
  ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS priority INTEGER DEFAULT 5 CHECK (priority >= 1 AND priority <= 10),
  ADD COLUMN IF NOT EXISTS ai_enabled BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES public.users(id) ON DELETE SET NULL;

-- Add index for category filtering
CREATE INDEX IF NOT EXISTS idx_knowledge_category ON public.knowledge_base(organization_id, category) WHERE is_active = true;

-- Add index for tags (GIN for array operations)
CREATE INDEX IF NOT EXISTS idx_knowledge_tags ON public.knowledge_base USING gin(tags);

-- Add index for priority ordering
CREATE INDEX IF NOT EXISTS idx_knowledge_priority ON public.knowledge_base(organization_id, priority DESC, usage_count DESC) WHERE is_active = true AND ai_enabled = true;

-- Add index for AI-enabled entries
CREATE INDEX IF NOT EXISTS idx_knowledge_ai_enabled ON public.knowledge_base(organization_id, ai_enabled) WHERE is_active = true;

-- Update trigger for updated_at
CREATE OR REPLACE FUNCTION update_knowledge_base_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_knowledge_base_updated_at ON public.knowledge_base;
CREATE TRIGGER trigger_update_knowledge_base_updated_at
  BEFORE UPDATE ON public.knowledge_base
  FOR EACH ROW
  EXECUTE FUNCTION update_knowledge_base_updated_at();

-- RPC function to increment usage count atomically
CREATE OR REPLACE FUNCTION increment_kb_usage(entry_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE public.knowledge_base
  SET
    usage_count = usage_count + 1,
    last_used_at = NOW()
  WHERE id = entry_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comment on table
COMMENT ON TABLE public.knowledge_base IS 'Enhanced knowledge base with categories, tags, priority, and AI enablement for advanced FAQ management';

-- Comment on new columns
COMMENT ON COLUMN public.knowledge_base.category IS 'Category for organization: servicos, precos, horarios, politicas, emergencias, geral';
COMMENT ON COLUMN public.knowledge_base.tags IS 'Array of tags for flexible categorization';
COMMENT ON COLUMN public.knowledge_base.priority IS 'Priority level 1-10, higher = more important';
COMMENT ON COLUMN public.knowledge_base.ai_enabled IS 'Whether AI can use this entry for responses';
COMMENT ON COLUMN public.knowledge_base.is_active IS 'Soft delete flag';
COMMENT ON COLUMN public.knowledge_base.created_by IS 'User who created this entry';
COMMENT ON COLUMN public.knowledge_base.updated_by IS 'User who last updated this entry';
