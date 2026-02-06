import { apiGet, apiPost, apiPatch, apiDelete } from './api';
import { Shift } from '../types';

interface ShiftApi {
  id: number;
  name: string;
  start_time: string;
  end_time: string;
  type: string;
  applicable_area_ids?: number[];
}

const mapFromApi = (s: ShiftApi): Shift => ({
  id: String(s.id),
  name: s.name,
  startTime: s.start_time,
  endTime: s.end_time,
  type: (s.type || 'NORMAL').toUpperCase() as Shift['type'],
  applicableAreaIds: (s.applicable_area_ids || []).map(String)
});

const mapToApi = (shift: Partial<Shift>) => ({
  name: shift.name,
  start_time: shift.startTime,
  end_time: shift.endTime,
  type: shift.type,
  applicable_area_ids: shift.applicableAreaIds?.map(id => Number(id))
});

export const shiftService = {
  async list(): Promise<Shift[]> {
    const res = await apiGet<ShiftApi[] | { data: ShiftApi[] }>('/shifts');
    const data = (res as any)?.data ?? res ?? [];
    return Array.isArray(data) ? data.map(mapFromApi) : [];
  },

  async create(shift: Shift): Promise<Shift> {
    const res = await apiPost<ShiftApi | { data: ShiftApi }>('/shifts', mapToApi(shift));
    const data = (res as any)?.data ?? res;
    return mapFromApi(data as ShiftApi);
  },

  async update(id: string, updates: Partial<Shift>): Promise<Shift> {
    const res = await apiPatch<ShiftApi | { data: ShiftApi }>(`/shifts/${id}`, mapToApi(updates));
    const data = (res as any)?.data ?? res;
    return mapFromApi(data as ShiftApi);
  },

  async delete(id: string): Promise<void> {
    await apiDelete(`/shifts/${id}`);
  }
};
