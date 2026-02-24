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

const normalizeStatus = (raw: any) => {
  const s = String(raw || '').toLowerCase();
  if (['open', 'pending', 'draft'].includes(s)) return 'pending';
  if (['active', 'in_progress'].includes(s)) return 'in_progress';
  if (['done', 'completed'].includes(s)) return 'completed';
  if (['needs_review', 'approved', 'rejected'].includes(s)) return s;
  return s;
};

const isCompletedLike = (status: string) => ['completed', 'needs_review', 'approved'].includes(status);

export const dashboardService = {
  async getStats(): Promise<DashboardStats> {
    const [runsResponse, incidentsResponse, areasResponse] = await Promise.all([
      apiGet<any>('/runs'),
      apiGet<any>('/incidents'),
      apiGet<any>('/areas')
    ]);

    const runsData = runsResponse.data || runsResponse || [];
    const runs = Array.isArray(runsData) ? runsData : (runsData.data || []);
    const incidents = (incidentsResponse as any)?.data ?? incidentsResponse ?? [];
    const areas = (areasResponse as any)?.data ?? areasResponse ?? [];

    const completedRuns = runs.filter((r: any) => {
      const s = normalizeStatus(r.work_status || r.status);
      return isCompletedLike(s);
    }).length;
    const pendingRuns = runs.filter((r: any) => {
      const s = normalizeStatus(r.work_status || r.status);
      return ['pending', 'in_progress'].includes(s);
    }).length;
    const openIncidents = incidents.filter((i: any) => i.status === 'open' || i.status === 'in_progress').length;
    const resolvedIncidents = incidents.filter((i: any) => i.status === 'resolved' || i.status === 'closed').length;

    return {
      total_runs: runsResponse.total || runs.length,
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
    try {
      // Try to get real data from runs with date filtering
      const runsResponse = await apiGet<any>('/runs');
      const runsData = runsResponse.data || runsResponse || [];
      const runs = Array.isArray(runsData) ? runsData : (runsData.data || []);

      // Get last 7 days
      const today = new Date();
      const days = ['CN', 'T.Hai', 'T.Ba', 'T.Tư', 'T.Năm', 'T.Sáu', 'T.Bảy'];
      const last7Days: WeeklyStats[] = [];

      for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dayOfWeek = days[date.getDay()];
        const dateStr = date.toISOString().split('T')[0];

        // Count completed runs for this date
        const completed = runs.filter((r: any) => {
          if (!r.completed_at && !r.updated_at) return false;
          const runDate = new Date(r.completed_at || r.updated_at).toISOString().split('T')[0];
          const status = normalizeStatus(r.work_status || r.status);
          return runDate === dateStr && isCompletedLike(status);
        }).length;

        last7Days.push({ day: dayOfWeek, completed });
      }

      return last7Days;
    } catch (e) {
      console.error('Failed to get weekly stats:', e);
      // Return empty array instead of mock data
      return [];
    }
  }
};
