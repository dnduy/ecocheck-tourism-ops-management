import { apiPost, apiGet } from './api';
import { User } from '../types';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export const authService = {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    console.log('authService.login called with:', credentials.email);
    const response = await apiPost<AuthResponse>('/auth/login', credentials);
    console.log('authService.login response:', response);
    
    // Auto-save token and user after successful login
    if (response.token && response.user) {
      console.log('Saving token and user to localStorage');
      this.setToken(response.token);
      this.setCurrentUser(response.user);
    }
    
    return response;
  },

  async logout(): Promise<void> {
    try {
      await apiPost('/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    }
    localStorage.removeItem('api_token');
    localStorage.removeItem('current_user');
  },

  async getMe(): Promise<User> {
    return apiGet<User>('/me');
  },

  setToken(token: string): void {
    localStorage.setItem('api_token', token);
  },

  getToken(): string | null {
    return localStorage.getItem('api_token');
  },

  setCurrentUser(user: User): void {
    localStorage.setItem('current_user', JSON.stringify(user));
  },

  getCurrentUser(): User | null {
    const user = localStorage.getItem('current_user');
    return user ? JSON.parse(user) : null;
  },

  isAuthenticated(): boolean {
    return !!this.getToken();
  }
};
