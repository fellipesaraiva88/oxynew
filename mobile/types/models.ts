// Database models matching Supabase schema

export interface Organization {
  id: string;
  name: string;
  email: string;
  phone: string;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: string;
  organization_id: string;
  email: string;
  full_name: string;
  role: 'owner' | 'admin' | 'user';
  created_at: string;
  updated_at: string;
}

export interface Contact {
  id: string;
  organization_id: string;
  name: string;
  phone_number: string;
  email?: string;
  address?: string;
  notes?: string;
  tags?: string[];
  status: 'active' | 'inactive' | 'blocked';
  created_at: string;
  updated_at: string;
  deleted_at?: string;
  // Computed fields
  pets_count?: number;
  last_interaction?: string;
}

export interface Pet {
  id: string;
  contact_id: string;
  organization_id: string;
  name: string;
  species: 'dog' | 'cat' | 'bird' | 'other';
  breed?: string;
  age?: number;
  weight?: number;
  gender?: 'male' | 'female';
  color?: string;
  microchip?: string;
  notes?: string;
  photo_url?: string;
  created_at: string;
  updated_at: string;
}

export interface Service {
  id: string;
  organization_id: string;
  name: string;
  description?: string;
  duration_minutes: number;
  price: number;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Booking {
  id: string;
  organization_id: string;
  contact_id: string;
  pet_id?: string;
  service_id: string;
  scheduled_at: string;
  duration_minutes: number;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  notes?: string;
  created_at: string;
  updated_at: string;
  // Populated fields
  contact?: Contact;
  pet?: Pet;
  service?: Service;
}

export interface Conversation {
  id: string;
  organization_id: string;
  contact_id: string;
  whatsapp_instance_id: string;
  phone_number: string;
  last_message_at?: string;
  last_message_content?: string;
  last_message_from?: 'user' | 'ai' | 'owner';
  unread_count: number;
  status: 'active' | 'archived';
  created_at: string;
  updated_at: string;
  // Populated fields
  contact?: Contact;
  contact_name?: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  organization_id: string;
  from: 'user' | 'ai' | 'owner';
  content: string;
  message_type: 'text' | 'image' | 'audio' | 'video' | 'document';
  media_url?: string;
  metadata?: Record<string, any>;
  sent_at: string;
  delivered_at?: string;
  read_at?: string;
  created_at: string;
}

export interface AIInteraction {
  id: string;
  organization_id: string;
  conversation_id: string;
  contact_id: string;
  ai_type: 'client' | 'aurora';
  prompt: string;
  response: string;
  function_called?: string;
  function_result?: Record<string, any>;
  tokens_used: number;
  duration_ms: number;
  created_at: string;
}

export interface WhatsAppInstance {
  id: string;
  organization_id: string;
  name: string;
  phone_number?: string;
  status: 'disconnected' | 'connecting' | 'connected' | 'failed';
  qr_code?: string;
  pairing_code?: string;
  last_connected_at?: string;
  created_at: string;
  updated_at: string;
}

export interface TrainingPlan {
  id: string;
  organization_id: string;
  contact_id: string;
  pet_id: string;
  name: string;
  description?: string;
  start_date: string;
  end_date?: string;
  status: 'active' | 'completed' | 'cancelled';
  sessions_total: number;
  sessions_completed: number;
  created_at: string;
  updated_at: string;
  // Populated fields
  contact?: Contact;
  pet?: Pet;
}

export interface DaycareStay {
  id: string;
  organization_id: string;
  contact_id: string;
  pet_id: string;
  check_in: string;
  check_out?: string;
  status: 'scheduled' | 'active' | 'completed' | 'cancelled';
  notes?: string;
  daily_rate: number;
  total_amount?: number;
  created_at: string;
  updated_at: string;
  // Populated fields
  contact?: Contact;
  pet?: Pet;
}

export interface BipeProtocol {
  id: string;
  organization_id: string;
  pet_id: string;
  contact_id: string;
  category: 'behavioral' | 'individual' | 'preventive' | 'emergent';
  title: string;
  description: string;
  status: 'open' | 'in_progress' | 'resolved';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  due_date?: string;
  resolved_at?: string;
  created_at: string;
  updated_at: string;
  // Populated fields
  pet?: Pet;
  contact?: Contact;
}
