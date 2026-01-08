import { apiGet, apiPost, apiPatch, apiDelete } from './api';
import { Area } from '../types';

export const areaService = {
  async getAll(): Promise<Area[]> {
    return apiGet<Area[]>('/areas');
  },

  async create(data: { name: string; type: string; description?: string }): Promise<Area> {
    return apiPost<Area>('/areas', data);
  },

  async update(id: number, data: Partial<Area>): Promise<Area> {
    return apiPatch<Area>(`/areas/${id}`, data);
  },

  async delete(id: number): Promise<void> {
    return apiDelete(`/areas/${id}`);
  }
};
