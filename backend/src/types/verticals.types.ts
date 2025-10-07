/**
 * TypeScript Types for New Vertical Services
 * Created: October 2025
 *
 * This file contains type definitions for:
 * 1. Training Plans Service
 * 2. Daycare/Hotel Service
 * 3. Knowledge Base Service
 *
 * Note: BIPE types are defined in services/bipe/patient-health.service.ts
 */

// ============================================================================
// 1. TRAINING PLANS TYPES
// ============================================================================

export type PlanType = 'basico' | 'intermediario' | 'avancado' | 'personalizado';
export type TrainingStatus = 'ativo' | 'concluido' | 'cancelado' | 'pausado';
export type SessionStatus = 'agendada' | 'concluida' | 'cancelada' | 'remarcada';

export interface TrainingPlan {
  id: string;
  organizationId: string;
  contactId: string;
  patientId: string;
  planType: PlanType;
  description: string;
  goals: string[];
  totalSessions: number;
  completedSessions: number;
  status: TrainingStatus;
  startDate: string;
  endDate?: string;
  priceCents: number;
  notes?: string;
  createdBy: 'ai' | 'human' | 'customer';
  createdAt: string;
  updatedAt: string;
}

export interface TrainingSession {
  id: string;
  organizationId: string;
  trainingPlanId: string;
  sessionNumber: number;
  scheduledAt: string;
  durationMinutes: number;
  status: SessionStatus;
  trainerNotes?: string;
  skillsWorked?: string[];
  petBehaviorRating?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTrainingPlanRequest {
  contactId: string;
  patientId: string;
  planType: PlanType;
  description: string;
  goals: string[];
  totalSessions: number;
  startDate: string;
  priceCents: number;
  notes?: string;
}

export interface UpdateTrainingPlanRequest {
  description?: string;
  goals?: string[];
  status?: TrainingStatus;
  endDate?: string;
  notes?: string;
}

// ============================================================================
// 2. DAYCARE/HOTEL TYPES
// ============================================================================

export type StayType = 'daycare_diario' | 'hospedagem_pernoite' | 'hospedagem_estendida';
export type StayStatus = 'reservado' | 'em_andamento' | 'concluido' | 'cancelado';

export interface DaycareStay {
  id: string;
  organizationId: string;
  contactId: string;
  patientId: string;
  stayType: StayType;
  checkInDate: string;
  checkOutDate: string;
  status: StayStatus;
  dailyRateCents: number;
  totalPriceCents: number;
  specialRequests?: string;
  medicalHistory?: string;
  roomAssignment?: string;
  feedingSchedule?: FeedingSchedule;
  activitiesLog?: ActivityLog[];
  checkInAt?: string;
  checkOutAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface FeedingSchedule {
  times: string[];
  foodType: string;
  amount: string;
  specialInstructions?: string;
}

export interface ActivityLog {
  timestamp: string;
  activity: string;
  notes?: string;
  staffMember?: string;
}

export interface CreateDaycareReservationRequest {
  contactId: string;
  patientId: string;
  stayType: StayType;
  checkInDate: string;
  checkOutDate: string;
  specialRequests?: string;
  medicalHistory?: string;
}

export interface UpdateDaycareStayRequest {
  status?: StayStatus;
  checkOutDate?: string;
  roomAssignment?: string;
  specialRequests?: string;
  medicalHistory?: string;
}

export interface CheckInRequest {
  roomAssignment: string;
  feedingSchedule: FeedingSchedule;
  checkInTime?: string;
  initialNotes?: string;
}

export interface CheckOutRequest {
  checkOutTime: string;
  finalNotes?: string;
  petCondition?: string;
  itemsReturned?: string[];
}

export interface AddActivityLogRequest {
  reservationId: string;
  activity: ActivityLog;
}

// ============================================================================
// 3. KNOWLEDGE BASE TYPES
// ============================================================================

export type KnowledgeCategory =
  | 'servicos'
  | 'precos'
  | 'horarios'
  | 'politicas'
  | 'emergencias'
  | 'geral';

export type KnowledgeMatchType = 'exact' | 'partial' | 'tags' | 'similarity';

export interface KnowledgeBaseEntry {
  id: string;
  organizationId: string;
  category: KnowledgeCategory;
  question: string;
  answer: string;
  tags: string[];
  usageCount: number;
  aiEnabled: boolean;
  priority: number;
  createdBy: string;
  updatedBy?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface KnowledgeSearchResult {
  entry: KnowledgeBaseEntry;
  relevanceScore: number;
  matchType: KnowledgeMatchType;
}

export interface CreateKnowledgeEntryRequest {
  category: KnowledgeCategory;
  question: string;
  answer: string;
  tags?: string[];
  aiEnabled?: boolean;
  priority?: number;
}

export interface UpdateKnowledgeEntryRequest {
  category?: KnowledgeCategory;
  question?: string;
  answer?: string;
  tags?: string[];
  aiEnabled?: boolean;
  priority?: number;
  isActive?: boolean;
}

export interface SearchKnowledgeRequest {
  q: string;
  limit?: number;
}

export interface KnowledgeSearchResponse {
  results: KnowledgeSearchResult[];
  total: number;
  query: string;
}

export interface KnowledgeBaseStats {
  totalEntries: number;
  activeEntries: number;
  entriesByCategory: Record<KnowledgeCategory, number>;
  totalUsage: number;
  avgPriority: number;
}

// ============================================================================
// 4. SHARED UTILITY TYPES
// ============================================================================

export interface PaginationRequest {
  limit?: number;
  offset?: number;
  page?: number;
}

export interface PaginationResponse<T> {
  data: T[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface DateRangeFilter {
  startDate?: string;
  endDate?: string;
}

export interface TenantFilter {
  organizationId: string;
}

// ============================================================================
// 5. TYPE GUARDS
// ============================================================================

export function isTrainingPlan(obj: unknown): obj is TrainingPlan {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'id' in obj &&
    'organizationId' in obj &&
    'patientId' in obj &&
    'planType' in obj &&
    'totalSessions' in obj
  );
}

export function isDaycareStay(obj: unknown): obj is DaycareStay {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'id' in obj &&
    'organizationId' in obj &&
    'patientId' in obj &&
    'stayType' in obj &&
    'checkInDate' in obj &&
    'checkOutDate' in obj
  );
}

export function isKnowledgeBaseEntry(obj: unknown): obj is KnowledgeBaseEntry {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'id' in obj &&
    'organizationId' in obj &&
    'category' in obj &&
    'question' in obj &&
    'answer' in obj
  );
}
