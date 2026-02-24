import { apiPost, apiGet } from './api';
import { User } from '../types';
import { authStore } from './authStore';

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
    
    // Keep token/user in memory only
    if (response.token && response.user) {
      authStore.setAuth(response.token, response.user);
    }
    
    return response;
  },

  async logout(): Promise<void> {
    try {
      await apiPost('/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    }
    authStore.clear();
  },

  async getMe(): Promise<User> {
    const response = await apiGet<any>('/me');
    return (response?.user ?? response) as User;
  },

  setToken(token: string): void {
    authStore.setToken(token);
  },

  getToken(): string | null {
    return authStore.getToken();
  },

  setCurrentUser(user: User): void {
    authStore.setUser(user);
  },

  getCurrentUser(): User | null {
    return authStore.getUser();
  },

  isAuthenticated(): boolean {
    return !!this.getToken();
  }
};
