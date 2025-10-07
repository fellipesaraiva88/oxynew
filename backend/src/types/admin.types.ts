/**
 * Admin Panel Types
 *
 * TRANSFORMAÇÃO: Type safety para todo admin panel
 */

// Admin User Roles
export type AdminRole = 'super_admin' | 'tech' | 'cs' | 'sales' | 'viewer';

// Admin User
export interface AdminUser {
  id: string;
  email: string;
  full_name: string | null;
  role: AdminRole;
  is_active: boolean;
  last_login_at: string | null;
  created_at: string;
  updated_at: string;
}

// System Stats
export interface SystemStats {
  organizations: {
    total: number;
    active: number;
    by_plan: Record<string, number>;
  };
  users: {
    total: number;
    owners: number;
    agents: number;
  };
  messages: {
    today: number;
    week: number;
    month: number;
  };
  revenue: {
    mrr: number;
    arr: number;
    by_plan: Record<string, number>;
  };
  whatsapp: {
    active_instances: number;
    total_instances: number;
    connection_rate: number;
  };
  queues: QueueStats[];
}

// Queue Stats
export interface QueueStats {
  name: string;
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  processing_rate?: number;
  health?: 'ok' | 'warning' | 'critical';
}

// Organization with Stats
export interface OrganizationWithStats {
  organization: {
    id: string;
    name: string;
    email: string;
    subscription_plan: 'free' | 'pro' | 'enterprise';
    is_active: boolean;
    created_at: string;
  };
  users: Array<{
    id: string;
    email: string;
    role: 'guardian' | 'admin' | 'agent';
    created_at: string;
  }>;
  instances: Array<{
    id: string;
    name: string;
    phone_number: string | null;
    status: 'connected' | 'disconnected' | 'error';
  }>;
  stats: {
    messages_30d: number;
    bookings_30d: number;
    total_contacts: number;
  };
}

// Health Check
export interface HealthCheck {
  overall: 'healthy' | 'degraded' | 'unhealthy';
  services: {
    supabase: ServiceHealth;
    redis: ServiceHealth;
    queues: ServiceHealth;
  };
  timestamp: string;
}

export interface ServiceHealth {
  status: 'healthy' | 'degraded' | 'unhealthy';
  message: string;
  response_time?: number;
  waiting?: number;
  failed?: number;
}

// Recent Activity
export interface RecentActivity {
  logins: AuditLog[];
  organizations: Array<{
    id: string;
    name: string;
    email: string;
    subscription_plan: string;
    created_at: string;
  }>;
  messages: Array<{
    id: string;
    content: string;
    direction: 'incoming' | 'outgoing';
    created_at: string;
    organization_id: string;
  }>;
}

// Audit Log
export interface AuditLog {
  id: string;
  internal_user_id: string | null;
  organization_id: string | null;
  action: string;
  details: Record<string, any>;
  severity: 'info' | 'warning' | 'error' | 'critical';
  created_at: string;
}

// Analytics
export interface AnalyticsOverview {
  messages_per_day: Record<string, number>;
  active_users_7d: number;
  period: {
    start: string;
    end: string;
  };
}

export interface RevenueAnalytics {
  mrr: number;
  arr: number;
  by_organization: Array<{
    organization_id: string;
    organization_name: string;
    plan: string;
    monthly_value: number;
  }>;
  subscription_distribution: Record<string, number>;
  churn_rate: number;
}

export interface UsageAnalytics {
  by_organization: Array<{
    organization_id: string;
    organization_name: string;
    messages_30d: number;
    messages_quota_usage: number;
    active_instances: number;
    instances_quota_usage: number;
  }>;
}

export interface AIPerformanceAnalytics {
  oxy_assistant: {
    messages_30d: number;
  };
  client_ai: {
    bookings_created_30d: number;
    avg_response_time_ms: number;
    function_call_success_rate: number;
  };
  total_interactions_30d: number;
}

// Create Client Request
export interface CreateClientRequest {
  name: string;
  email: string;
  phone?: string;
  address?: string;
  subscription_plan?: 'free' | 'pro' | 'enterprise';
  owner_email: string;
  owner_password: string;
}

// Update Client Request
export interface UpdateClientRequest {
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
  subscription_plan?: 'free' | 'pro' | 'enterprise';
  quota_messages?: number;
  quota_whatsapp_instances?: number;
}

// System Settings
export interface SystemSettings {
  maintenance_mode: boolean;
  max_organizations: number;
  default_quota_messages: number;
  default_quota_instances: number;
  feature_flags: Record<string, boolean>;
  rate_limits: {
    global: number;
    auth: number;
    whatsapp: number;
  };
}

// Broadcast Announcement
export interface BroadcastAnnouncementRequest {
  title: string;
  message: string;
  priority?: 'info' | 'warning' | 'critical';
}
