// Form validation types (for react-hook-form + zod)

import { z } from 'zod';

// Contact Form
export const contactFormSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  phone_number: z.string().min(10, 'Telefone inválido'),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  address: z.string().optional(),
  notes: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

export type ContactFormData = z.infer<typeof contactFormSchema>;

// Pet Form
export const petFormSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  species: z.enum(['dog', 'cat', 'bird', 'other'], {
    errorMap: () => ({ message: 'Selecione uma espécie' }),
  }),
  breed: z.string().optional(),
  age: z.number().int().min(0).max(30).optional(),
  weight: z.number().min(0).max(200).optional(),
  gender: z.enum(['male', 'female']).optional(),
  color: z.string().optional(),
  microchip: z.string().optional(),
  notes: z.string().optional(),
});

export type PetFormData = z.infer<typeof petFormSchema>;

// Booking Form
export const bookingFormSchema = z.object({
  contact_id: z.string().min(1, 'Selecione um cliente'),
  pet_id: z.string().optional(),
  service_id: z.string().min(1, 'Selecione um serviço'),
  scheduled_at: z.string().min(1, 'Selecione data e hora'),
  notes: z.string().optional(),
});

export type BookingFormData = z.infer<typeof bookingFormSchema>;

// Login Form
export const loginFormSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
});

export type LoginFormData = z.infer<typeof loginFormSchema>;

// Register Form
export const registerFormSchema = z.object({
  full_name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
  confirm_password: z.string().min(6, 'Confirmação obrigatória'),
  organization_name: z.string().optional(),
}).refine((data) => data.password === data.confirm_password, {
  message: 'As senhas não coincidem',
  path: ['confirm_password'],
});

export type RegisterFormData = z.infer<typeof registerFormSchema>;

// Message Form
export const messageFormSchema = z.object({
  content: z.string().min(1, 'Digite uma mensagem').max(2000, 'Mensagem muito longa'),
  type: z.enum(['text', 'image', 'audio']).default('text'),
  media_url: z.string().optional(),
});

export type MessageFormData = z.infer<typeof messageFormSchema>;

// Aurora Message Form
export const auroraMessageFormSchema = z.object({
  message: z.string().min(1, 'Digite uma mensagem').max(500, 'Mensagem muito longa'),
});

export type AuroraMessageFormData = z.infer<typeof auroraMessageFormSchema>;

// Training Plan Form
export const trainingPlanFormSchema = z.object({
  contact_id: z.string().min(1, 'Selecione um cliente'),
  pet_id: z.string().min(1, 'Selecione um pet'),
  name: z.string().min(2, 'Nome do plano é obrigatório'),
  description: z.string().optional(),
  start_date: z.string().min(1, 'Selecione a data de início'),
  end_date: z.string().optional(),
  sessions_total: z.number().int().min(1, 'Mínimo 1 sessão').max(100),
});

export type TrainingPlanFormData = z.infer<typeof trainingPlanFormSchema>;

// Daycare Stay Form
export const daycareStayFormSchema = z.object({
  contact_id: z.string().min(1, 'Selecione um cliente'),
  pet_id: z.string().min(1, 'Selecione um pet'),
  check_in: z.string().min(1, 'Selecione check-in'),
  check_out: z.string().optional(),
  notes: z.string().optional(),
  daily_rate: z.number().min(0, 'Valor inválido'),
});

export type DaycareStayFormData = z.infer<typeof daycareStayFormSchema>;

// BIPE Protocol Form
export const bipeProtocolFormSchema = z.object({
  pet_id: z.string().min(1, 'Selecione um pet'),
  contact_id: z.string().min(1, 'Selecione um cliente'),
  category: z.enum(['behavioral', 'individual', 'preventive', 'emergent'], {
    errorMap: () => ({ message: 'Selecione uma categoria' }),
  }),
  title: z.string().min(2, 'Título é obrigatório'),
  description: z.string().min(10, 'Descrição muito curta'),
  priority: z.enum(['low', 'medium', 'high', 'urgent'], {
    errorMap: () => ({ message: 'Selecione uma prioridade' }),
  }),
  due_date: z.string().optional(),
});

export type BipeProtocolFormData = z.infer<typeof bipeProtocolFormSchema>;
