import { apiGet, apiPost, apiPut, apiDelete } from './api';

export interface RunDetail {
  run: {
    id: number;
    area_id: number;
    template_id: number;
    date: string;
    status: string;
    assigned_to?: number;
    verified_by?: number;
    completed_at?: string;
    verified_at?: string;
  };
  template: { id: number; name: string; area_id: number; columns?: Array<{ id: number; role_id?: number; role_name?: string; session_id?: number; time_hhmm?: string }> };
  sessions: Array<{ id: number; time_hhmm: string }>;
  roles: Array<{ id: number; name: string }>;
  columns: Array<{
    id: number;
    session_id: number;
    role_id?: number;
    time_hhmm: string;
    role_name?: string;
  }>;
  groups: Array<{ id: number; title: string }>;
  items: Array<{
    id: number;
    group_id?: number;
    content: string;
    is_critical: boolean;
  }>;
  entries: Array<{
    item_id: number;
    column_id: number;
    value?: string;
    note?: string;
    photo_url?: string;
    checked_by?: number;
    checked_at?: string;
  }>;
}

export interface RunListParams {
  date?: string;
  area_id?: number;
  assigned_to?: number;
  status?: string;
  per_page?: number;
}

export const runService = {
  async list(params?: RunListParams): Promise<any> {
    const queryString = new URLSearchParams();
    if (params?.date) queryString.append('date', params.date);
    if (params?.area_id) queryString.append('area_id', params.area_id.toString());
    if (params?.assigned_to) queryString.append('assigned_to', params.assigned_to.toString());
    if (params?.status) queryString.append('status', params.status);
    if (params?.per_page) queryString.append('per_page', params.per_page.toString());

    const endpoint = queryString.toString() ? `/runs?${queryString}` : '/runs';
    return apiGet(endpoint);
  },

  async create(areaId: number, date: string): Promise<any> {
    // Backend returns simple run object: { id, area_id, template_id, status, ... }
    return apiPost('/runs', { area_id: areaId, date });
  },

  async get(runId: number): Promise<RunDetail> {
    return apiGet<RunDetail>(`/runs/${runId}`);
  },

  async update(runId: number, data: { status?: string; assigned_to?: number; verified_by?: number }): Promise<RunDetail> {
    // Backend expects PUT for RunController@update
    return apiPut<RunDetail>(`/runs/${runId}`, data);
  },

  async delete(runId: number): Promise<void> {
    await apiDelete<void>(`/runs/${runId}`);
  }
};
