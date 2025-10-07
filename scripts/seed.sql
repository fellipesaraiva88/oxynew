-- ============================================
-- AUZAP SEED DATA v2.0
-- Realistic multi-tenant test data
-- ============================================

-- ============================================
-- CLEANUP (DEV ONLY)
-- ============================================

-- Disable RLS temporarily for seeding
ALTER TABLE public.organizations DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_instances DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.services DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.authorized_owner_numbers DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.contacts DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.pets DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_interactions DISABLE ROW LEVEL SECURITY;

-- Truncate all tables (cascade to avoid FK errors)
TRUNCATE TABLE public.audit_logs CASCADE;
TRUNCATE TABLE public.ai_interactions CASCADE;
TRUNCATE TABLE public.messages CASCADE;
TRUNCATE TABLE public.conversations CASCADE;
TRUNCATE TABLE public.scheduled_followups CASCADE;
TRUNCATE TABLE public.bookings CASCADE;
TRUNCATE TABLE public.pets CASCADE;
TRUNCATE TABLE public.contacts CASCADE;
TRUNCATE TABLE public.aurora_automations CASCADE;
TRUNCATE TABLE public.aurora_proactive_messages CASCADE;
TRUNCATE TABLE public.authorized_owner_numbers CASCADE;
TRUNCATE TABLE public.services CASCADE;
TRUNCATE TABLE public.whatsapp_instances CASCADE;
TRUNCATE TABLE public.organization_settings CASCADE;
TRUNCATE TABLE public.user_roles CASCADE;
TRUNCATE TABLE public.organizations CASCADE;

-- ============================================
-- ORGANIZATION 1: Paws & Claws Petshop
-- ============================================

INSERT INTO public.organizations (id, name, slug, business_type, plan_type, status) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'Paws & Claws Petshop', 'paws-claws', ARRAY['pet_shop', 'grooming', 'veterinary'], 'pro', 'active');

INSERT INTO public.organization_settings (organization_id, business_info, operating_hours, ai_config) VALUES
('550e8400-e29b-41d4-a716-446655440001',
  '{"address": "Rua das Flores, 123 - São Paulo/SP", "phone": "+5511987654321", "email": "contato@pawsclaws.com.br"}'::jsonb,
  '{"monday": {"open": "08:00", "close": "18:00"}, "tuesday": {"open": "08:00", "close": "18:00"}, "wednesday": {"open": "08:00", "close": "18:00"}, "thursday": {"open": "08:00", "close": "18:00"}, "friday": {"open": "08:00", "close": "18:00"}, "saturday": {"open": "09:00", "close": "14:00"}}'::jsonb,
  '{"client_ai_enabled": true, "aurora_enabled": true, "model": "gpt-4-turbo-preview", "temperature": 0.7}'::jsonb
);

INSERT INTO public.whatsapp_instances (id, organization_id, instance_name, instance_key, status, phone_number) VALUES
('550e8400-e29b-41d4-a716-446655440010', '550e8400-e29b-41d4-a716-446655440001', 'Principal', 'paws-claws-main', 'connected', '+5511987654321');

INSERT INTO public.authorized_owner_numbers (organization_id, phone_number, name, is_primary) VALUES
('550e8400-e29b-41d4-a716-446655440001', '+5511999887766', 'Carlos Silva (Proprietário)', TRUE),
('550e8400-e29b-41d4-a716-446655440001', '+5511988776655', 'Maria Santos (Gerente)', FALSE);

-- Services for Paws & Claws
INSERT INTO public.services (id, organization_id, name, category, description, duration_minutes, price_cents) VALUES
('550e8400-e29b-41d4-a716-446655440020', '550e8400-e29b-41d4-a716-446655440001', 'Banho e Tosa - Porte Pequeno', 'banho_tosa', 'Banho completo + tosa higiênica', 60, 8000),
('550e8400-e29b-41d4-a716-446655440021', '550e8400-e29b-41d4-a716-446655440001', 'Banho e Tosa - Porte Médio', 'banho_tosa', 'Banho completo + tosa higiênica', 90, 12000),
('550e8400-e29b-41d4-a716-446655440022', '550e8400-e29b-41d4-a716-446655440001', 'Consulta Veterinária', 'veterinaria', 'Consulta com médico veterinário', 30, 15000),
('550e8400-e29b-41d4-a716-446655440023', '550e8400-e29b-41d4-a716-446655440001', 'Vacinação V10', 'veterinaria', 'Vacina polivalente V10', 15, 8000),
('550e8400-e29b-41d4-a716-446655440024', '550e8400-e29b-41d4-a716-446655440001', 'Hotel - Diária', 'hotel', 'Diária de hotel com acompanhamento', 1440, 10000);

-- Contacts for Paws & Claws
INSERT INTO public.contacts (id, organization_id, phone_number, name, email, status, source, tags) VALUES
('550e8400-e29b-41d4-a716-446655440030', '550e8400-e29b-41d4-a716-446655440001', '+5511991234567', 'Ana Paula Costa', 'ana.costa@email.com', 'active', 'whatsapp_ai', ARRAY['vip', 'recorrente']),
('550e8400-e29b-41d4-a716-446655440031', '550e8400-e29b-41d4-a716-446655440001', '+5511992345678', 'João Pedro Lima', 'joao.lima@email.com', 'active', 'whatsapp_ai', ARRAY['novo_cliente']),
('550e8400-e29b-41d4-a716-446655440032', '550e8400-e29b-41d4-a716-446655440001', '+5511993456789', 'Fernanda Oliveira', 'fernanda.oli@email.com', 'active', 'whatsapp_manual', ARRAY['recorrente']);

-- Pets
INSERT INTO public.pets (id, organization_id, contact_id, name, species, breed, size, age_years, weight_kg, gender, is_neutered) VALUES
('550e8400-e29b-41d4-a716-446655440040', '550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440030', 'Rex', 'dog', 'Golden Retriever', 'grande', 3, 32.5, 'male', TRUE),
('550e8400-e29b-41d4-a716-446655440041', '550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440031', 'Luna', 'dog', 'Poodle', 'pequeno', 2, 8.2, 'female', TRUE),
('550e8400-e29b-41d4-a716-446655440042', '550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440032', 'Mia', 'cat', 'Siamês', 'medio', 1, 4.5, 'female', FALSE);

-- Bookings
INSERT INTO public.bookings (id, organization_id, contact_id, pet_id, service_id, booking_date, booking_time, duration_minutes, status, price_cents, created_by) VALUES
('550e8400-e29b-41d4-a716-446655440050', '550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440030', '550e8400-e29b-41d4-a716-446655440040', '550e8400-e29b-41d4-a716-446655440021', CURRENT_DATE + 1, '10:00', 90, 'confirmed', 12000, 'ai'),
('550e8400-e29b-41d4-a716-446655440051', '550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440031', '550e8400-e29b-41d4-a716-446655440041', '550e8400-e29b-41d4-a716-446655440020', CURRENT_DATE + 2, '14:00', 60, 'scheduled', 8000, 'ai'),
('550e8400-e29b-41d4-a716-446655440052', '550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440032', '550e8400-e29b-41d4-a716-446655440042', '550e8400-e29b-41d4-a716-446655440022', CURRENT_DATE - 2, '11:00', 30, 'completed', 15000, 'human');

-- Conversations
INSERT INTO public.conversations (id, organization_id, contact_id, whatsapp_chat_id, status, priority) VALUES
('550e8400-e29b-41d4-a716-446655440060', '550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440030', '5511991234567@c.us', 'active', 'normal'),
('550e8400-e29b-41d4-a716-446655440061', '550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440031', '5511992345678@c.us', 'resolved', 'normal');

-- Messages
INSERT INTO public.messages (id, organization_id, conversation_id, whatsapp_message_id, type, direction, sender, content) VALUES
('550e8400-e29b-41d4-a716-446655440070', '550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440060', 'msg_001', 'text', 'inbound', 'customer', 'Olá, gostaria de agendar um banho para o Rex'),
('550e8400-e29b-41d4-a716-446655440071', '550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440060', 'msg_002', 'text', 'outbound', 'ai', 'Olá Ana! Claro, posso ajudar. Rex é porte grande, correto? Qual dia você prefere?'),
('550e8400-e29b-41d4-a716-446655440072', '550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440060', 'msg_003', 'text', 'inbound', 'customer', 'Isso mesmo! Pode ser amanhã às 10h?'),
('550e8400-e29b-41d4-a716-446655440073', '550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440060', 'msg_004', 'text', 'outbound', 'ai', 'Perfeito! Agendamento confirmado para amanhã às 10h. Valor: R$ 120,00. Te envio um lembrete 1 dia antes 😊');

-- AI Interactions
INSERT INTO public.ai_interactions (organization_id, conversation_id, message_id, action_type, status, input_data, output_data, confidence_score) VALUES
('550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440060', '550e8400-e29b-41d4-a716-446655440070', 'create_booking', 'completed',
  '{"intent": "schedule_grooming", "pet_name": "Rex", "service_type": "banho_tosa"}'::jsonb,
  '{"booking_id": "550e8400-e29b-41d4-a716-446655440050", "date": "tomorrow", "time": "10:00"}'::jsonb,
  0.95
);

-- ============================================
-- ORGANIZATION 2: PetLove Clínica
-- ============================================

INSERT INTO public.organizations (id, name, slug, business_type, plan_type, status) VALUES
('550e8400-e29b-41d4-a716-446655440002', 'PetLove Clínica Veterinária', 'petlove-clinica', ARRAY['veterinary'], 'business', 'active');

INSERT INTO public.organization_settings (organization_id, business_info, operating_hours, ai_config) VALUES
('550e8400-e29b-41d4-a716-446655440002',
  '{"address": "Av. Paulista, 1000 - São Paulo/SP", "phone": "+5511912345678", "email": "contato@petlove.vet.br"}'::jsonb,
  '{"monday": {"open": "07:00", "close": "20:00"}, "tuesday": {"open": "07:00", "close": "20:00"}, "wednesday": {"open": "07:00", "close": "20:00"}, "thursday": {"open": "07:00", "close": "20:00"}, "friday": {"open": "07:00", "close": "20:00"}, "saturday": {"open": "08:00", "close": "18:00"}, "sunday": {"open": "08:00", "close": "14:00"}}'::jsonb,
  '{"client_ai_enabled": true, "aurora_enabled": false, "model": "gpt-4-turbo-preview", "temperature": 0.6}'::jsonb
);

INSERT INTO public.whatsapp_instances (id, organization_id, instance_name, instance_key, status, phone_number) VALUES
('550e8400-e29b-41d4-a716-446655440011', '550e8400-e29b-41d4-a716-446655440002', 'Principal', 'petlove-main', 'connected', '+5511912345678');

INSERT INTO public.services (id, organization_id, name, category, description, duration_minutes, price_cents) VALUES
('550e8400-e29b-41d4-a716-446655440025', '550e8400-e29b-41d4-a716-446655440002', 'Consulta Veterinária de Rotina', 'veterinaria', 'Exame clínico completo', 45, 20000),
('550e8400-e29b-41d4-a716-446655440026', '550e8400-e29b-41d4-a716-446655440002', 'Exame de Sangue Completo', 'veterinaria', 'Hemograma + Bioquímica', 15, 25000),
('550e8400-e29b-41d4-a716-446655440027', '550e8400-e29b-41d4-a716-446655440002', 'Cirurgia de Castração', 'veterinaria', 'Procedimento cirúrgico completo', 180, 80000);

INSERT INTO public.contacts (id, organization_id, phone_number, name, status, source) VALUES
('550e8400-e29b-41d4-a716-446655440033', '550e8400-e29b-41d4-a716-446655440002', '+5511994567890', 'Roberto Alves', 'active', 'whatsapp_ai'),
('550e8400-e29b-41d4-a716-446655440034', '550e8400-e29b-41d4-a716-446655440002', '+5511995678901', 'Patricia Sousa', 'active', 'website');

INSERT INTO public.pets (id, organization_id, contact_id, name, species, breed, size, age_years, weight_kg, gender) VALUES
('550e8400-e29b-41d4-a716-446655440043', '550e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440033', 'Thor', 'dog', 'Rottweiler', 'gigante', 5, 45.0, 'male'),
('550e8400-e29b-41d4-a716-446655440044', '550e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440034', 'Nina', 'cat', 'Persa', 'medio', 3, 5.2, 'female');

-- ============================================
-- RE-ENABLE RLS
-- ============================================

ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_instances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.authorized_owner_numbers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_interactions ENABLE ROW LEVEL SECURITY;

-- Refresh materialized views
SELECT public.refresh_analytics_views();

-- Verify seed data
SELECT 'Seed completed successfully!' AS status,
  (SELECT COUNT(*) FROM public.organizations) AS organizations,
  (SELECT COUNT(*) FROM public.contacts) AS contacts,
  (SELECT COUNT(*) FROM public.pets) AS pets,
  (SELECT COUNT(*) FROM public.bookings) AS bookings,
  (SELECT COUNT(*) FROM public.messages) AS messages;
