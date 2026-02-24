import { apiPut, unwrapApiData } from './api';

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
    const res = await apiPut<SignoffResponse | { data: SignoffResponse }>('/signoffs', data);
    return unwrapApiData<SignoffResponse>(res);
  }
};
