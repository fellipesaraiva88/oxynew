import { apiClient } from '@/lib/api';

export interface RegisterData {
  organizationName: string;
  email: string;
  password: string;
  fullName: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface AuthResponse {
  success: boolean;
  session?: {
    access_token: string;
    refresh_token: string;
    expires_at: number;
  };
  user?: unknown;
  organization?: unknown;
}

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role: string;
  organization_id?: string; // Optional for admin users
  organizations?: unknown;
}

class AuthService {
  async register(data: RegisterData): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/api/auth/register', data);

    if (response.data.session?.access_token) {
      apiClient.setToken(response.data.session.access_token);
    }

    return response.data;
  }

  async login(data: LoginData): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/api/auth/login', data);

    if (response.data.session?.access_token) {
      apiClient.setToken(response.data.session.access_token);
    }

    return response.data;
  }

  async getProfile(): Promise<UserProfile> {
    const response = await apiClient.get<{ user: UserProfile }>('/api/auth/me');
    const user = response.data.user;

    // Salvar organization_id no localStorage para uso em subscriptions Realtime
    if (user.organization_id) {
      localStorage.setItem('organizationId', user.organization_id);
    }

    return user;
  }

  logout(): void {
    apiClient.clearToken();
    localStorage.removeItem('organizationId'); // Limpar organization_id ao fazer logout
  }

  isAuthenticated(): boolean {
    return !!localStorage.getItem('auth_token');
  }
}

export const authService = new AuthService();
