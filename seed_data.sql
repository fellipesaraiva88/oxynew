-- ============================================
-- SEED DATA PARA AUZAP V2
-- ============================================

-- 1. Organização Demo
INSERT INTO public.organizations (id, name, slug, business_type, plan_type, status)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'PetShop Demo',
  'petshop-demo',
  ARRAY['banho_tosa', 'veterinaria'],
  'free',
  'active'
) ON CONFLICT (id) DO NOTHING;

-- 2. Organization Settings
INSERT INTO public.organization_settings (organization_id, business_info, operating_hours, ai_config)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  '{"address": "Rua Exemplo, 123", "phone": "+5511999999999", "description": "PetShop de demonstração"}',
  '{"monday": {"open": "09:00", "close": "18:00"}, "tuesday": {"open": "09:00", "close": "18:00"}, "wednesday": {"open": "09:00", "close": "18:00"}, "thursday": {"open": "09:00", "close": "18:00"}, "friday": {"open": "09:00", "close": "18:00"}, "saturday": {"open": "09:00", "close": "13:00"}}',
  '{"model": "gpt-4", "temperature": 0.7, "max_tokens": 500}'
) ON CONFLICT (organization_id) DO NOTHING;

-- 3. Serviços básicos
INSERT INTO public.services (organization_id, name, category, description, duration_minutes, price_cents, is_active)
VALUES
  ('00000000-0000-0000-0000-000000000001', 'Banho', 'banho_tosa', 'Banho completo com secagem', 60, 8000, true),
  ('00000000-0000-0000-0000-000000000001', 'Tosa', 'banho_tosa', 'Tosa higiênica ou completa', 90, 12000, true),
  ('00000000-0000-0000-0000-000000000001', 'Consulta Veterinária', 'veterinaria', 'Consulta veterinária geral', 30, 15000, true)
ON CONFLICT DO NOTHING;

-- Nota: O usuário admin precisa ser criado via Supabase Auth Dashboard
-- Email: admin@auzap.ai | Senha: Admin123!
-- Depois de criar o usuário, execute:
-- INSERT INTO public.user_roles (user_id, organization_id, role)
-- VALUES ('<user_id_do_supabase_auth>', '00000000-0000-0000-0000-000000000001', 'admin');
