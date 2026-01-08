import { apiGet, apiPost } from './api';

export interface TemplateColumnInput {
  label: string;
  type?: string;
  options?: any[];
}

export interface TemplateGroupInput {
  title: string;
  items: Array<{ title: string; instructions?: string }>;
}

export interface TemplateCreateInput {
  name: string;
  description?: string;
  version?: string;
  is_active?: boolean;
  groups: TemplateGroupInput[];
  columns: TemplateColumnInput[];
}

export const templateService = {
  async list(): Promise<any[]> {
    return apiGet<any[]>('/templates');
  },

  async get(id: number): Promise<any> {
    return apiGet<any>(`/templates/${id}`);
  },

  async create(data: TemplateCreateInput): Promise<any> {
    return apiPost<any>('/templates', data);
  }
};
