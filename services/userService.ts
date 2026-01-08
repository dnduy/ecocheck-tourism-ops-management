import { apiGet, apiPost, apiPatch, apiDelete } from './api';
import { User } from '../types';

export interface CreateUserData {
  name: string;
  email: string;
  password: string;
  role: string;
}

export interface UpdateUserData {
  name?: string;
  email?: string;
  password?: string;
  role?: string;
}

export const userService = {
  async getAll(): Promise<User[]> {
    return apiGet<User[]>('/users');
  },

  async create(data: CreateUserData): Promise<User> {
    return apiPost<User>('/users', data);
  },

  async update(id: number, data: UpdateUserData): Promise<User> {
    return apiPatch<User>(`/users/${id}`, data);
  },

  async delete(id: number): Promise<void> {
    return apiDelete(`/users/${id}`);
  }
};
