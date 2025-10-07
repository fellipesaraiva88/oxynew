-- ============================================
-- TOKEN ANALYTICS OPTIMIZATION INDEXES
-- ============================================
-- Created: 2025-10-06
-- Purpose: Optimize queries for AI token usage analytics

-- Index for organization-based token queries with date filtering
CREATE INDEX IF NOT EXISTS idx_ai_interactions_org_date
  ON public.ai_interactions(organization_id, created_at DESC)
  WHERE deleted_at IS NULL;

-- Index for model-based comparisons (Client AI vs Aurora)
CREATE INDEX IF NOT EXISTS idx_ai_interactions_model_date
  ON public.ai_interactions(model, created_at DESC)
  WHERE deleted_at IS NULL;

-- Index for cost calculations and aggregations
CREATE INDEX IF NOT EXISTS idx_ai_interactions_cost
  ON public.ai_interactions(organization_id, total_cost_cents, created_at DESC)
  WHERE total_cost_cents IS NOT NULL;

-- Index for token usage queries
CREATE INDEX IF NOT EXISTS idx_ai_interactions_tokens
  ON public.ai_interactions(organization_id, prompt_tokens, completion_tokens, created_at DESC)
  WHERE prompt_tokens IS NOT NULL OR completion_tokens IS NOT NULL;

-- Comment for documentation
COMMENT ON INDEX idx_ai_interactions_org_date IS 'Optimizes organization-specific token analytics queries';
COMMENT ON INDEX idx_ai_interactions_model_date IS 'Optimizes model comparison queries (Client AI vs Aurora)';
COMMENT ON INDEX idx_ai_interactions_cost IS 'Optimizes cost aggregation queries';
COMMENT ON INDEX idx_ai_interactions_tokens IS 'Optimizes token usage aggregation queries';
