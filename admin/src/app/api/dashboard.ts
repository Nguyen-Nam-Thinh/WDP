import { apiRequest } from './client';

export interface DashboardStats {
  totalUsers: number;
  ongoingTournaments: number;
  activeRegistrations: number;
  pendingRaces: number;
}

export interface ChartDataPoint {
  name: string;
  users: number;
}

export interface TournamentChartPoint {
  name: string;
  value: number;
}

export interface DashboardData {
  stats: DashboardStats;
  chartData: ChartDataPoint[];
  tournamentChartData: TournamentChartPoint[];
  upcomingTournaments: any[];
}

export const dashboardApi = {
  getAdminDashboard: (year?: number, period?: string) => {
    const params = new URLSearchParams();
    if (year) params.append('year', year.toString());
    if (period) params.append('period', period);
    const query = params.toString() ? `?${params.toString()}` : '';
    return apiRequest<DashboardData>(`/dashboard/admin${query}`);
  },
};
