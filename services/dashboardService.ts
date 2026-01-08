import { apiGet } from './api';

export interface DashboardStats {
  total_runs: number;
  completed_runs: number;
  pending_runs: number;
  total_incidents: number;
  open_incidents: number;
  resolved_incidents: number;
  total_areas: number;
  completion_rate: number;
}

export interface WeeklyStats {
  day: string;
  completed: number;
}

export const dashboardService = {
  async getStats(): Promise<DashboardStats> {
    const [runsResponse, incidentsResponse, areasResponse] = await Promise.all([
      apiGet<any>('/runs'),
      apiGet<any>('/incidents'),
      apiGet<any>('/areas')
    ]);

    const runs = runsResponse.data || [];
    const incidents = incidentsResponse.data || [];
    const areas = areasResponse || [];

    const completedRuns = runs.filter((r: any) => r.status === 'completed').length;
    const pendingRuns = runs.filter((r: any) => r.status === 'draft' || r.status === 'active').length;
    const openIncidents = incidents.filter((i: any) => i.status === 'open' || i.status === 'in_progress').length;
    const resolvedIncidents = incidents.filter((i: any) => i.status === 'resolved' || i.status === 'closed').length;

    return {
      total_runs: runs.length,
      completed_runs: completedRuns,
      pending_runs: pendingRuns,
      total_incidents: incidents.length,
      open_incidents: openIncidents,
      resolved_incidents: resolvedIncidents,
      total_areas: areas.length,
      completion_rate: runs.length > 0 ? Math.round((completedRuns / runs.length) * 100) : 0
    };
  },

  async getWeeklyStats(): Promise<WeeklyStats[]> {
    // Mock for now - would need backend endpoint
    const days = ['T.Hai', 'T.Ba', 'T.Tư', 'T.Năm', 'T.Sáu', 'T.Bảy', 'CN'];
    return days.map(day => ({
      day,
      completed: Math.floor(Math.random() * 30) + 40
    }));
  }
};
