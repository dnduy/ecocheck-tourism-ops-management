import { apiGet, apiPost, apiDelete, apiPatch } from './api';
import { authStore } from './authStore';

const unwrapResponse = <T = any>(res: any): T => {
  if (res && typeof res === 'object' && 'data' in res) {
    return res.data as T;
  }
  return res as T;
};

export interface RunDetail {
  run: {
    id: number;
    area_id: number;
    template_id: number;
    session_id?: number;
    date: string;
    status: string;
    assigned_to?: number;
    verified_by?: number;
    completed_at?: string;
    verified_at?: string;
  };
  template: {
    id: number;
    name: string;
    area_id: number;
    columns?: Array<{ id: number; role_id?: number; role_name?: string; session_id?: number; time_hhmm?: string }>;
    groups?: Array<{ id: number; title: string; items?: any[] }>;
  };
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
  session_id?: number;
  per_page?: number;
}

export const runService = {
  async list(params?: RunListParams): Promise<any> {
    const queryString = new URLSearchParams();
    if (params?.date) queryString.append('date', params.date);
    if (params?.area_id) queryString.append('area_id', params.area_id.toString());
    if (params?.assigned_to) queryString.append('assigned_to', params.assigned_to.toString());
    if (params?.status) queryString.append('status', params.status);
    if (params?.session_id) queryString.append('session_id', params.session_id.toString());
    if (params?.per_page) queryString.append('per_page', params.per_page.toString());

    const endpoint = queryString.toString() ? `/runs?${queryString}` : '/runs';
    const res = await apiGet(endpoint);
    return unwrapResponse(res);
  },

  async create(areaId: number, date: string, templateId?: number, sessionId?: number): Promise<any> {
    // Backend returns simple run object: { id, area_id, template_id, status, ... }
    const payload: any = { area_id: areaId, date };
    if (templateId) payload.checklist_template_id = templateId;
    if (sessionId) payload.session_id = sessionId;
    const res = await apiPost('/runs', payload);
    return unwrapResponse(res);
  },

  async get(runId: number): Promise<RunDetail> {
    const res = await apiGet<RunDetail>(`/runs/${runId}`);
    return unwrapResponse(res);
  },

  async update(runId: number, data: { status?: string; assigned_to?: number; verified_by?: number }): Promise<RunDetail> {
    // Backend expects PATCH for RunController@update
    const res = await apiPatch<RunDetail>(`/runs/${runId}`, data);
    return unwrapResponse(res);
  },

  async delete(runId: number): Promise<void> {
    await apiDelete<void>(`/runs/${runId}`);
  },

  async export(runId: number): Promise<void> {
    const token = authStore.getToken();
    const baseUrl = (import.meta.env.VITE_API_URL as string) || 'http://localhost:8000/api';
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const response = await fetch(`${baseUrl}/runs/${runId}/export`, {
      method: 'GET',
      headers,
    });

    if (!response.ok) throw new Error('Export failed');

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Checklist_Run_${runId}.xlsx`; // Or extract filename from header
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  }
};
