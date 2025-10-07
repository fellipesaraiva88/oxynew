import axios, { AxiosInstance, AxiosError } from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    // Request interceptor para adicionar token
    this.client.interceptors.request.use(
      (config) => {
        const token = this.getToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor para tratamento de erros
    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        if (error.response?.status === 401) {
          // Token expirado - limpar e redirecionar
          this.clearToken();
          window.location.href = '/';
        }
        return Promise.reject(error);
      }
    );
  }

  private getToken(): string | null {
    return localStorage.getItem('auth_token');
  }

  public setToken(token: string): void {
    localStorage.setItem('auth_token', token);
  }

  public clearToken(): void {
    localStorage.removeItem('auth_token');
  }

  public get<T = any>(url: string, config = {}) {
    return this.client.get<T>(url, config);
  }

  public post<T = any>(url: string, data?: any, config = {}) {
    return this.client.post<T>(url, data, config);
  }

  public put<T = any>(url: string, data?: any, config = {}) {
    return this.client.put<T>(url, data, config);
  }

  public patch<T = any>(url: string, data?: any, config = {}) {
    return this.client.patch<T>(url, data, config);
  }

  public delete<T = any>(url: string, config = {}) {
    return this.client.delete<T>(url, config);
  }
}

export const apiClient = new ApiClient();
export default apiClient;
