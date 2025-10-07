-- ============================================
-- MATERIALIZED VIEWS FOR ANALYTICS
-- Refresh periodically for dashboard performance
-- ============================================

-- Dashboard Metrics (refresh every 5 minutes)
CREATE MATERIALIZED VIEW IF NOT EXISTS public.dashboard_metrics AS
SELECT
  o.id AS organization_id,
  o.name AS organization_name,
  -- Today's metrics
  COUNT(DISTINCT CASE WHEN b.booking_date = CURRENT_DATE THEN b.id END) AS bookings_today,
  COUNT(DISTINCT CASE WHEN c.created_at::DATE = CURRENT_DATE THEN c.id END) AS new_contacts_today,
  COUNT(DISTINCT CASE WHEN m.created_at::DATE = CURRENT_DATE THEN m.id END) AS messages_today,
  -- This week metrics
  COUNT(DISTINCT CASE WHEN b.booking_date >= DATE_TRUNC('week', CURRENT_DATE) THEN b.id END) AS bookings_this_week,
  SUM(CASE WHEN b.booking_date >= DATE_TRUNC('week', CURRENT_DATE) AND b.status = 'completed' THEN b.price_cents ELSE 0 END) AS revenue_this_week_cents,
  -- This month metrics
  COUNT(DISTINCT CASE WHEN b.booking_date >= DATE_TRUNC('month', CURRENT_DATE) THEN b.id END) AS bookings_this_month,
  SUM(CASE WHEN b.booking_date >= DATE_TRUNC('month', CURRENT_DATE) AND b.status = 'completed' THEN b.price_cents ELSE 0 END) AS revenue_this_month_cents,
  -- Active stats
  COUNT(DISTINCT CASE WHEN conv.status = 'active' THEN conv.id END) AS active_conversations,
  COUNT(DISTINCT CASE WHEN conv.status = 'waiting_human' THEN conv.id END) AS conversations_waiting_human,
  COUNT(DISTINCT CASE WHEN c.status = 'active' THEN c.id END) AS active_contacts,
  COUNT(DISTINCT CASE WHEN p.is_active = TRUE THEN p.id END) AS active_pets,
  -- AI metrics
  AVG(CASE WHEN ai.created_at >= CURRENT_DATE - INTERVAL '7 days' THEN ai.confidence_score END) AS avg_ai_confidence_7d,
  COUNT(DISTINCT CASE WHEN ai.created_at >= CURRENT_DATE - INTERVAL '7 days' AND ai.status = 'completed' THEN ai.id END) AS ai_actions_7d,
  -- Last updated
  NOW() AS last_refreshed_at
FROM public.organizations o
LEFT JOIN public.bookings b ON b.organization_id = o.id
LEFT JOIN public.contacts c ON c.organization_id = o.id
LEFT JOIN public.pets p ON p.organization_id = o.id
LEFT JOIN public.conversations conv ON conv.organization_id = o.id
LEFT JOIN public.messages m ON m.organization_id = o.id
LEFT JOIN public.ai_interactions ai ON ai.organization_id = o.id
WHERE o.status = 'active'
GROUP BY o.id, o.name;

CREATE UNIQUE INDEX IF NOT EXISTS idx_dashboard_metrics_org ON public.dashboard_metrics(organization_id);

COMMENT ON MATERIALIZED VIEW public.dashboard_metrics IS
  'Dashboard metrics aggregated by organization. Refresh every 5 minutes via cron job.';

-- Conversation Analytics (refresh every hour)
CREATE MATERIALIZED VIEW IF NOT EXISTS public.conversation_analytics AS
SELECT
  o.id AS organization_id,
  o.name AS organization_name,
  DATE_TRUNC('day', conv.created_at) AS date,
  -- Conversation volumes
  COUNT(DISTINCT conv.id) AS total_conversations,
  COUNT(DISTINCT CASE WHEN conv.status = 'resolved' THEN conv.id END) AS resolved_conversations,
  COUNT(DISTINCT CASE WHEN conv.status = 'waiting_human' THEN conv.id END) AS escalated_conversations,
  -- Message volumes
  COUNT(DISTINCT m.id) AS total_messages,
  COUNT(DISTINCT CASE WHEN m.direction = 'inbound' THEN m.id END) AS inbound_messages,
  COUNT(DISTINCT CASE WHEN m.direction = 'outbound' THEN m.id END) AS outbound_messages,
  COUNT(DISTINCT CASE WHEN m.sender = 'ai' THEN m.id END) AS ai_messages,
  COUNT(DISTINCT CASE WHEN m.sender = 'human' THEN m.id END) AS human_messages,
  -- Response times (in seconds)
  PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY
    EXTRACT(EPOCH FROM (m.created_at - LAG(m.created_at) OVER (PARTITION BY conv.id ORDER BY m.created_at)))
  ) FILTER (WHERE m.direction = 'outbound' AND m.sender = 'ai') AS median_ai_response_time_seconds,
  PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY
    EXTRACT(EPOCH FROM (m.created_at - LAG(m.created_at) OVER (PARTITION BY conv.id ORDER BY m.created_at)))
  ) FILTER (WHERE m.direction = 'outbound' AND m.sender = 'ai') AS p95_ai_response_time_seconds,
  -- Conversation durations
  AVG(EXTRACT(EPOCH FROM (conv.updated_at - conv.created_at))) AS avg_conversation_duration_seconds,
  -- AI effectiveness
  AVG(ai.confidence_score) FILTER (WHERE ai.status = 'completed') AS avg_ai_confidence,
  COUNT(DISTINCT CASE WHEN ai.status = 'completed' THEN ai.id END)::FLOAT /
    NULLIF(COUNT(DISTINCT ai.id), 0) AS ai_success_rate,
  NOW() AS last_refreshed_at
FROM public.organizations o
INNER JOIN public.conversations conv ON conv.organization_id = o.id
LEFT JOIN public.messages m ON m.conversation_id = conv.id
LEFT JOIN public.ai_interactions ai ON ai.conversation_id = conv.id
WHERE o.status = 'active'
  AND conv.created_at >= CURRENT_DATE - INTERVAL '90 days'
GROUP BY o.id, o.name, DATE_TRUNC('day', conv.created_at);

CREATE UNIQUE INDEX IF NOT EXISTS idx_conversation_analytics_org_date
  ON public.conversation_analytics(organization_id, date DESC);

COMMENT ON MATERIALIZED VIEW public.conversation_analytics IS
  'Conversation and message analytics by day. Refresh hourly via cron job.';

-- Service Performance Analytics
CREATE MATERIALIZED VIEW IF NOT EXISTS public.service_analytics AS
SELECT
  s.organization_id,
  s.id AS service_id,
  s.name AS service_name,
  s.category AS service_category,
  -- Booking metrics (last 90 days)
  COUNT(DISTINCT b.id) FILTER (WHERE b.created_at >= CURRENT_DATE - INTERVAL '90 days') AS total_bookings_90d,
  COUNT(DISTINCT b.id) FILTER (WHERE b.status = 'completed' AND b.created_at >= CURRENT_DATE - INTERVAL '90 days') AS completed_bookings_90d,
  COUNT(DISTINCT b.id) FILTER (WHERE b.status = 'cancelled' AND b.created_at >= CURRENT_DATE - INTERVAL '90 days') AS cancelled_bookings_90d,
  COUNT(DISTINCT b.id) FILTER (WHERE b.status = 'no_show' AND b.created_at >= CURRENT_DATE - INTERVAL '90 days') AS no_show_bookings_90d,
  -- Revenue
  SUM(b.price_cents) FILTER (WHERE b.status = 'completed' AND b.created_at >= CURRENT_DATE - INTERVAL '90 days') AS revenue_90d_cents,
  AVG(b.price_cents) FILTER (WHERE b.status = 'completed' AND b.created_at >= CURRENT_DATE - INTERVAL '90 days') AS avg_booking_value_cents,
  -- Utilization
  COUNT(DISTINCT b.contact_id) FILTER (WHERE b.created_at >= CURRENT_DATE - INTERVAL '90 days') AS unique_customers_90d,
  COUNT(DISTINCT b.pet_id) FILTER (WHERE b.created_at >= CURRENT_DATE - INTERVAL '90 days') AS unique_pets_90d,
  -- AI created bookings
  COUNT(DISTINCT b.id) FILTER (WHERE b.created_by = 'ai' AND b.created_at >= CURRENT_DATE - INTERVAL '90 days') AS ai_created_bookings_90d,
  COUNT(DISTINCT b.id) FILTER (WHERE b.created_by = 'ai' AND b.status = 'completed' AND b.created_at >= CURRENT_DATE - INTERVAL '90 days')::FLOAT /
    NULLIF(COUNT(DISTINCT b.id) FILTER (WHERE b.created_by = 'ai' AND b.created_at >= CURRENT_DATE - INTERVAL '90 days'), 0) AS ai_booking_completion_rate,
  NOW() AS last_refreshed_at
FROM public.services s
LEFT JOIN public.bookings b ON b.service_id = s.id
WHERE s.is_active = TRUE
GROUP BY s.organization_id, s.id, s.name, s.category;

CREATE UNIQUE INDEX IF NOT EXISTS idx_service_analytics_service ON public.service_analytics(service_id);
CREATE INDEX IF NOT EXISTS idx_service_analytics_org_category ON public.service_analytics(organization_id, service_category);

COMMENT ON MATERIALIZED VIEW public.service_analytics IS
  'Service performance metrics for last 90 days. Refresh daily via cron job.';

-- ============================================
-- REFRESH FUNCTIONS
-- ============================================

-- Function to refresh all materialized views
CREATE OR REPLACE FUNCTION public.refresh_analytics_views()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.dashboard_metrics;
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.conversation_analytics;
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.service_analytics;
  RAISE NOTICE 'Analytics views refreshed at %', NOW();
END;
$$;

COMMENT ON FUNCTION public.refresh_analytics_views() IS
  'Refresh all materialized views concurrently. Call from cron job or manually.';
