import { apiGet, apiPost, apiPatch, apiDelete, unwrapApiData } from './api';
import { User } from '../types';

export interface CreateUserData {
  name: string;
  email: string;
  password?: string;
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
    const res = await apiGet<User[] | { data: User[] }>('/users');
    return unwrapApiData<User[]>(res) || [];
  },

  async create(data: CreateUserData): Promise<User> {
    const res = await apiPost<User | { data: User }>('/users', data);
    return unwrapApiData<User>(res);
  },

  async update(id: number, data: UpdateUserData): Promise<User> {
    const res = await apiPatch<User | { data: User }>(`/users/${id}`, data);
    return unwrapApiData<User>(res);
  },

  async delete(id: number): Promise<void> {
    return apiDelete(`/users/${id}`);
  }
};
