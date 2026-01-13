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

export interface TemplateUpdateInput extends Partial<TemplateCreateInput> {}

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
  }
};
