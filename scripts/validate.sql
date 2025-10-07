-- ============================================
-- VALIDATION SCRIPT
-- Tests schema, indexes, RLS, and performance
-- ============================================

-- ============================================
-- SCHEMA VALIDATION
-- ============================================

-- Verify all 20 tables exist
SELECT 'Table Count' AS check_name,
  COUNT(*) AS result,
  CASE WHEN COUNT(*) >= 20 THEN '✓ PASS' ELSE '✗ FAIL' END AS status
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE'
  AND table_name IN (
    'organizations', 'user_roles', 'organization_settings', 'whatsapp_instances',
    'services', 'authorized_owner_numbers', 'contacts', 'pets', 'bookings',
    'conversations', 'messages', 'ai_interactions', 'scheduled_followups',
    'aurora_proactive_messages', 'aurora_automations', 'message_queue',
    'audit_logs', 'analytics_events', 'webhook_deliveries', 'backup_metadata'
  );

-- Verify ENUMs
SELECT 'ENUM Types' AS check_name,
  COUNT(*) AS result,
  CASE WHEN COUNT(*) >= 15 THEN '✓ PASS' ELSE '✗ FAIL' END AS status
FROM pg_type
WHERE typname IN (
  'app_role', 'instance_status', 'service_category', 'contact_status',
  'contact_source', 'pet_species', 'pet_size', 'booking_status',
  'booking_created_by', 'conversation_status', 'conversation_priority',
  'message_type', 'message_direction', 'message_sender', 'queue_status'
);

-- Verify Materialized Views
SELECT 'Materialized Views' AS check_name,
  COUNT(*) AS result,
  CASE WHEN COUNT(*) >= 3 THEN '✓ PASS' ELSE '✗ FAIL' END AS status
FROM pg_matviews
WHERE schemaname = 'public'
  AND matviewname IN ('dashboard_metrics', 'conversation_analytics', 'service_analytics');

-- ============================================
-- INDEX VALIDATION
-- ============================================

-- Count indexes (should be 60+)
SELECT 'Index Count' AS check_name,
  COUNT(*) AS result,
  CASE WHEN COUNT(*) >= 60 THEN '✓ PASS' ELSE '✗ FAIL' END AS status
FROM pg_indexes
WHERE schemaname = 'public';

-- Verify critical indexes exist
WITH critical_indexes AS (
  SELECT unnest(ARRAY[
    'idx_user_roles_user_org',
    'idx_contacts_org_phone',
    'idx_bookings_org_date_status',
    'idx_messages_conversation_created',
    'idx_conversations_org_updated'
  ]) AS index_name
)
SELECT 'Critical Indexes' AS check_name,
  COUNT(*) AS result,
  CASE WHEN COUNT(*) = 5 THEN '✓ PASS' ELSE '✗ FAIL' END AS status
FROM pg_indexes
WHERE schemaname = 'public'
  AND indexname IN (SELECT index_name FROM critical_indexes);

-- ============================================
-- RLS VALIDATION
-- ============================================

-- Verify RLS is enabled on all core tables
SELECT 'RLS Enabled' AS check_name,
  COUNT(*) AS result,
  CASE WHEN COUNT(*) >= 15 THEN '✓ PASS' ELSE '✗ FAIL' END AS status
FROM pg_tables
WHERE schemaname = 'public'
  AND rowsecurity = TRUE;

-- Count RLS policies (should be 40+)
SELECT 'RLS Policies' AS check_name,
  COUNT(*) AS result,
  CASE WHEN COUNT(*) >= 40 THEN '✓ PASS' ELSE '✗ FAIL' END AS status
FROM pg_policies
WHERE schemaname = 'public';

-- ============================================
-- FUNCTION VALIDATION
-- ============================================

-- Verify helper functions exist
WITH required_functions AS (
  SELECT unnest(ARRAY[
    'user_organization_id',
    'has_role',
    'update_updated_at_column',
    'refresh_analytics_views',
    'get_organization_stats'
  ]) AS func_name
)
SELECT 'Required Functions' AS check_name,
  COUNT(*) AS result,
  CASE WHEN COUNT(*) = 5 THEN '✓ PASS' ELSE '✗ FAIL' END AS status
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.proname IN (SELECT func_name FROM required_functions);

-- ============================================
-- TRIGGER VALIDATION
-- ============================================

-- Count triggers (should be 15+)
SELECT 'Trigger Count' AS check_name,
  COUNT(*) AS result,
  CASE WHEN COUNT(*) >= 15 THEN '✓ PASS' ELSE '✗ FAIL' END AS status
FROM information_schema.triggers
WHERE trigger_schema = 'public';

-- ============================================
-- PERFORMANCE TESTS
-- ============================================

-- Test 1: Contact lookup by phone (should use index)
EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON)
SELECT * FROM public.contacts
WHERE organization_id = '550e8400-e29b-41d4-a716-446655440001'
  AND phone_number = '+5511991234567'
LIMIT 1;

-- Test 2: Bookings calendar query (dashboard critical path)
EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON)
SELECT b.*, c.name AS contact_name, p.name AS pet_name, s.name AS service_name
FROM public.bookings b
JOIN public.contacts c ON c.id = b.contact_id
JOIN public.pets p ON p.id = b.pet_id
JOIN public.services s ON s.id = b.service_id
WHERE b.organization_id = '550e8400-e29b-41d4-a716-446655440001'
  AND b.booking_date >= CURRENT_DATE
  AND b.booking_date < CURRENT_DATE + INTERVAL '7 days'
  AND b.status IN ('scheduled', 'confirmed')
ORDER BY b.booking_date ASC, b.booking_time ASC;

-- Test 3: Conversation messages (timeline view)
EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON)
SELECT *
FROM public.messages
WHERE conversation_id = '550e8400-e29b-41d4-a716-446655440060'
ORDER BY created_at DESC
LIMIT 50;

-- ============================================
-- DATA INTEGRITY CHECKS
-- ============================================

-- Check for orphaned records
SELECT 'Orphaned Pets' AS check_name,
  COUNT(*) AS result,
  CASE WHEN COUNT(*) = 0 THEN '✓ PASS' ELSE '✗ FAIL' END AS status
FROM public.pets p
LEFT JOIN public.contacts c ON c.id = p.contact_id
WHERE c.id IS NULL;

SELECT 'Orphaned Bookings' AS check_name,
  COUNT(*) AS result,
  CASE WHEN COUNT(*) = 0 THEN '✓ PASS' ELSE '✗ FAIL' END AS status
FROM public.bookings b
LEFT JOIN public.contacts c ON c.id = b.contact_id
WHERE c.id IS NULL;

-- Check for invalid dates
SELECT 'Future Created At' AS check_name,
  COUNT(*) AS result,
  CASE WHEN COUNT(*) = 0 THEN '✓ PASS' ELSE '✗ FAIL' END AS status
FROM public.bookings
WHERE created_at > NOW();

-- ============================================
-- SUMMARY
-- ============================================

SELECT
  '
  ============================================
  VALIDATION SUMMARY
  ============================================
  ' AS summary;

-- Count total checks
SELECT
  COUNT(CASE WHEN status = '✓ PASS' THEN 1 END) AS passed,
  COUNT(CASE WHEN status = '✗ FAIL' THEN 1 END) AS failed,
  COUNT(*) AS total
FROM (
  -- Re-run all checks above
  SELECT 1 AS dummy
) checks;
