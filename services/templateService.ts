import { apiGet, apiPost, apiPut, apiDelete } from './api';
import { authStore } from './authStore';

export interface TemplateColumnInput {
  label: string;
  type?: string;
  options?: any[];
}

export interface TemplateGroupInput {
  id?: number;
  title: string;
  items: Array<{ id?: number; title: string; instructions?: string }>;
}

export interface TemplateCreateInput {
  name: string;
  description?: string;
  version?: string;
  is_active?: boolean;
  groups: TemplateGroupInput[];
  columns: TemplateColumnInput[];
}

export interface TemplateUpdateInput extends Partial<TemplateCreateInput> { }

export const templateService = {
  async list(): Promise<any[]> {
    return apiGet<any[]>('/templates');
  },

  async get(id: number): Promise<any> {
    return apiGet<any>(`/templates/${id}`);
  },

  async create(data: TemplateCreateInput): Promise<any> {
    return apiPost<any>('/templates', data);
  },

  async update(id: number, data: TemplateUpdateInput): Promise<any> {
    return apiPut<any>(`/templates/${id}`, data);
  },

  async delete(id: number): Promise<void> {
    await apiDelete<void>(`/templates/${id}`);
  },

  async import(file: File, name: string, areaId: string, description?: string): Promise<any> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('name', name);
    formData.append('area_id', areaId);
    if (description) formData.append('description', description);

    const token = authStore.getToken();
    const baseUrl = (import.meta.env.VITE_API_URL as string) || 'http://localhost:8000/api';
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const response = await fetch(`${baseUrl}/templates/import`, {
      method: 'POST',
      headers,
      // Do NOT set Content-Type, browser sets it with boundary for FormData
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || 'Import failed');
    }
    return response.json();
  }
};
