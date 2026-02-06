import { apiGet } from './api';

export const statsService = {
  // Lấy thống kê tất cả nhân viên
  async getStaffStats() {
    return apiGet('/admin/staff-stats');
  },

  // Lấy thống kê tất cả giám sát
  async getSupervisorStats() {
    return apiGet('/admin/supervisor-stats');
  },

  // Lấy chi tiết công việc của một nhân viên
  async getStaffDetail(staffId: string) {
    return apiGet(`/admin/staff/${staffId}/detail`);
  },
};
