import { apiGet, apiPost, apiPatch } from './api';

export interface IncidentFilters {
  status?: string;
  area_id?: number;
  date?: string;
}

export interface IncidentData {
  area_id: number;
  run_id?: number;
  title: string;
  description: string;
  severity?: string;
}

export interface IncidentUpdateData {
  status?: string;
  assigned_to?: number;
  resolution_note?: string;
}

export const incidentService = {
  async list(filters?: IncidentFilters): Promise<any> {
    const queryString = new URLSearchParams();
    if (filters?.status) queryString.append('status', filters.status);
    if (filters?.area_id) queryString.append('area_id', filters.area_id.toString());
    if (filters?.date) queryString.append('date', filters.date);

    const endpoint = queryString.toString() ? `/incidents?${queryString}` : '/incidents';
    return apiGet(endpoint);
  },

  async create(data: IncidentData): Promise<any> {
    return apiPost('/incidents', data);
  },

  async update(id: number, data: IncidentUpdateData): Promise<any> {
    return apiPatch(`/incidents/${id}`, data);
  }
};
