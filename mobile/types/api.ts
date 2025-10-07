// API request and response types

import { Contact, Pet, Booking, Conversation, Message, AIInteraction } from './models';

// Generic API Response
export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Pagination
export interface PaginationParams {
  limit?: number;
  offset?: number;
  cursor?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

// Auth
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  full_name: string;
  organization_name?: string;
}

export interface AuthResponse {
  user: {
    id: string;
    email: string;
    full_name: string;
  };
  session: {
    access_token: string;
    refresh_token: string;
    expires_at: number;
  };
}

// Contacts
export interface GetContactsParams extends PaginationParams {
  search?: string;
  status?: 'active' | 'inactive' | 'blocked';
  tags?: string[];
}

export interface CreateContactRequest {
  name: string;
  phone_number: string;
  email?: string;
  address?: string;
  notes?: string;
  tags?: string[];
}

export interface UpdateContactRequest extends Partial<CreateContactRequest> {
  status?: 'active' | 'inactive' | 'blocked';
}

// Pets
export interface CreatePetRequest {
  contact_id: string;
  name: string;
  species: 'dog' | 'cat' | 'bird' | 'other';
  breed?: string;
  age?: number;
  weight?: number;
  gender?: 'male' | 'female';
  color?: string;
  notes?: string;
}

export interface UpdatePetRequest extends Partial<CreatePetRequest> {}

// Bookings
export interface GetBookingsParams extends PaginationParams {
  startDate?: string;
  endDate?: string;
  status?: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  contact_id?: string;
}

export interface CreateBookingRequest {
  contact_id: string;
  pet_id?: string;
  service_id: string;
  scheduled_at: string;
  notes?: string;
}

export interface UpdateBookingRequest extends Partial<CreateBookingRequest> {
  status?: 'pending' | 'confirmed' | 'completed' | 'cancelled';
}

// Conversations
export interface GetConversationsParams extends PaginationParams {
  status?: 'active' | 'archived';
  unreadOnly?: boolean;
}

export interface GetMessagesParams extends PaginationParams {
  before?: string;
  after?: string;
}

export interface SendMessageRequest {
  conversation_id: string;
  content: string;
  type?: 'text' | 'image' | 'audio';
  media_url?: string;
}

// Aurora
export interface SendAuroraMessageRequest {
  message: string;
  context?: Record<string, any>;
}

export interface AuroraContextResponse {
  totalClients: number;
  totalPets: number;
  totalBookings: number;
  totalRevenue: string;
  activeConversations: number;
  recentActivity: Array<{
    type: string;
    description: string;
    timestamp: string;
  }>;
}

// WhatsApp
export interface WhatsAppStatusResponse {
  status: 'disconnected' | 'connecting' | 'connected' | 'failed';
  phone_number?: string;
  qr_code?: string;
  pairing_code?: string;
  last_connected_at?: string;
}

export interface GeneratePairingCodeResponse {
  pairing_code: string;
  expires_at: string;
}

// Dashboard
export interface DashboardStatsResponse {
  totalContacts: number;
  totalPets: number;
  totalBookings: number;
  totalConversations: number;
  aiInteractions: number;
  revenue: {
    today: number;
    week: number;
    month: number;
  };
}

export interface ActivityFeedItem {
  id: string;
  type: 'message' | 'booking' | 'contact' | 'ai_interaction';
  title: string;
  description?: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

// Training Plans
export interface CreateTrainingPlanRequest {
  contact_id: string;
  pet_id: string;
  name: string;
  description?: string;
  start_date: string;
  end_date?: string;
  sessions_total: number;
}

// Daycare
export interface CreateDaycareStayRequest {
  contact_id: string;
  pet_id: string;
  check_in: string;
  check_out?: string;
  notes?: string;
  daily_rate: number;
}

// BIPE Protocol
export interface CreateBipeProtocolRequest {
  pet_id: string;
  contact_id: string;
  category: 'behavioral' | 'individual' | 'preventive' | 'emergent';
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  due_date?: string;
}

// Upload
export interface UploadResponse {
  url: string;
  path: string;
  size: number;
  mime_type: string;
}
