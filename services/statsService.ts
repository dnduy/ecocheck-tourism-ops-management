import { apiGet, unwrapApiData } from './api';

export const statsService = {
  // Lấy thống kê tất cả nhân viên
  async getStaffStats() {
    const res = await apiGet('/admin/staff-stats');
    return unwrapApiData(res);
  },

  // Lấy thống kê tất cả giám sát
  async getSupervisorStats() {
    const res = await apiGet('/admin/supervisor-stats');
    return unwrapApiData(res);
  },

  // Lấy chi tiết công việc của một nhân viên
  async getStaffDetail(staffId: string) {
    const res = await apiGet(`/admin/staff/${staffId}/detail`);
    return unwrapApiData(res);
  },
};
