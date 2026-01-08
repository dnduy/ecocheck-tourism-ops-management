import { apiPut } from './api';

export interface SignoffData {
  run_id: number;
  session_id: number;
  role_id?: number;
  note?: string;
}

export interface SignoffResponse {
  id: number;
  run_id: number;
  session_id: number;
  role_id?: number;
  signed_by: number;
  note?: string;
  signed_at: string;
}

export const signoffService = {
  async create(data: SignoffData): Promise<SignoffResponse> {
    return apiPut<SignoffResponse>('/signoffs', data);
  }
};
