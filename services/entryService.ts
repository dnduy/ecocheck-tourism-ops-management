import { apiPut } from './api';

export interface EntryData {
  run_id: number;
  item_id: number;
  column_id: number;
  value?: string; // 'ok', 'not_ok', 'na'
  note?: string;
  photo_url?: string;
}

export interface EntryResponse {
  item_id: number;
  column_id: number;
  value?: string;
  note?: string;
  photo_url?: string;
  checked_by?: number;
  checked_at?: string;
}

export const entryService = {
  async upsert(data: EntryData): Promise<EntryResponse> {
    return apiPut<EntryResponse>('/entries', data);
  }
};
