import { apiGet, apiPost, apiPatch, apiDelete, unwrapApiData } from './api';
import { Area } from '../types';

export const areaService = {
  async getAll(): Promise<Area[]> {
    const res = await apiGet<Area[] | { data: Area[] }>('/areas');
    return unwrapApiData<Area[]>(res) || [];
  },

  async create(data: { name: string; type: string; description?: string }): Promise<Area> {
    const res = await apiPost<Area | { data: Area }>('/areas', data);
    return unwrapApiData<Area>(res);
  },

  async update(id: number, data: Partial<Area>): Promise<Area> {
    const res = await apiPatch<Area | { data: Area }>(`/areas/${id}`, data);
    return unwrapApiData<Area>(res);
  },

  async delete(id: number): Promise<void> {
    return apiDelete(`/areas/${id}`);
  }
};
