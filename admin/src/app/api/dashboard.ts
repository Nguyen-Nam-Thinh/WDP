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

export interface Activity {
  type: string;
  title: string;
  desc: string;
  time: string;
  createdAt: string;
}

export interface DashboardData {
  stats: DashboardStats;
  chartData: ChartDataPoint[];
  recentActivities: Activity[];
  upcomingTournaments: any[];
}

export const dashboardApi = {
  getAdminDashboard: (year?: number) => {
    const query = year ? `?year=${year}` : '';
    return apiRequest<DashboardData>(`/dashboard/admin${query}`);
  },
};
