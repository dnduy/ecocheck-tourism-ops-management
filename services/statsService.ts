const API_BASE_URL = (import.meta.env.VITE_API_URL as string) || 'http://localhost:8000/api';

export const statsService = {
  // Lấy thống kê tất cả nhân viên
  async getStaffStats() {
    const response = await fetch(`${API_BASE_URL}/admin/staff-stats`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('api_token')}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });
    if (!response.ok) throw new Error('Failed to fetch staff stats');
    return response.json();
  },

  // Lấy thống kê tất cả giám sát
  async getSupervisorStats() {
    const response = await fetch(`${API_BASE_URL}/admin/supervisor-stats`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('api_token')}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });
    if (!response.ok) throw new Error('Failed to fetch supervisor stats');
    return response.json();
  },

  // Lấy chi tiết công việc của một nhân viên
  async getStaffDetail(staffId: string) {
    const response = await fetch(`${API_BASE_URL}/admin/staff/${staffId}/detail`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('api_token')}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });
    if (!response.ok) throw new Error('Failed to fetch staff detail');
    return response.json();
  },
};
