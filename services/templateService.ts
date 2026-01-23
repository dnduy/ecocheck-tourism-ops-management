import { apiGet, apiPost, apiPut, apiDelete } from './api';

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

  async import(file: File, name: string, description?: string): Promise<any> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('name', name);
    if (description) formData.append('description', description);

    const token = localStorage.getItem('api_token');
    const response = await fetch(`http://127.0.0.1:8000/api/templates/import`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        // Do NOT set Content-Type, browser sets it with boundary for FormData
      },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || 'Import failed');
    }
    return response.json();
  }
};
