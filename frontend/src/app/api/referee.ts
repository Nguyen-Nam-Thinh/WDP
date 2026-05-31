import { API_URL } from './auth';
import type { Race } from './race';

export interface Incident {
  _id: string;
  registrationId?: string;
  horseId?: { _id: string; name: string; breed: string } | null;
  type: 'interference' | 'doping' | 'equipment_violation' | 'jockey_violation' | 'other';
  description: string;
  action?: string;
  recordedAt: string;
}

export interface RefereeReport {
  _id: string;
  raceId: { _id: string; name: string; grade: string; scheduledTime: string; status: string; distance: number; purse: number; tournamentId?: string };
  refereeId: { _id: string; fullName: string; email: string; refereeProfile?: { licenseNumber?: string; yearsOfService?: number } };
  incidents: Incident[];
  preCheckSummary: string;
  overallNotes: string;
  status: 'draft' | 'submitted';
  submittedAt?: string;
  createdAt: string;
}

export interface RefereeReportListResponse {
  reports: RefereeReport[];
  total: number;
  page: number;
  totalPages: number;
}

export interface AssignedRacesResponse {
  races: Race[];
  total: number;
  page: number;
  totalPages: number;
}

const authHeader = (token: string) => ({ Authorization: `Bearer ${token}` });

export const refereeApi = {
  getAssignedRaces: async (
    token: string,
    params: { page?: number; limit?: number; status?: string } = {},
  ): Promise<AssignedRacesResponse> => {
    const q = new URLSearchParams({ page: String(params.page ?? 1), limit: String(params.limit ?? 20) });
    if (params.status) q.append('status', params.status);
    const res = await fetch(`${API_URL}/referee/races?${q}`, { headers: authHeader(token) });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'Failed to fetch assigned races');
    return json.data;
  },

  createReport: async (token: string, raceId: string): Promise<RefereeReport> => {
    const res = await fetch(`${API_URL}/referee/reports`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeader(token) },
      body: JSON.stringify({ raceId }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'Failed to create report');
    return json.data;
  },

  getMyReports: async (
    token: string,
    params: { page?: number; limit?: number; status?: string } = {},
  ): Promise<RefereeReportListResponse> => {
    const q = new URLSearchParams({ page: String(params.page ?? 1), limit: String(params.limit ?? 20) });
    if (params.status) q.append('status', params.status);
    const res = await fetch(`${API_URL}/referee/reports?${q}`, { headers: authHeader(token) });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'Failed to fetch reports');
    return json.data;
  },

  getReportById: async (token: string, id: string): Promise<RefereeReport> => {
    const res = await fetch(`${API_URL}/referee/reports/${id}`, { headers: authHeader(token) });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'Report not found');
    return json.data;
  },

  updateReport: async (
    token: string,
    id: string,
    data: { preCheckSummary?: string; overallNotes?: string },
  ): Promise<RefereeReport> => {
    const res = await fetch(`${API_URL}/referee/reports/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...authHeader(token) },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'Failed to update report');
    return json.data;
  },

  addIncident: async (
    token: string,
    reportId: string,
    data: { type: Incident['type']; description: string; action?: string; registrationId?: string },
  ): Promise<RefereeReport> => {
    const res = await fetch(`${API_URL}/referee/reports/${reportId}/incidents`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeader(token) },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'Failed to add incident');
    return json.data;
  },

  removeIncident: async (token: string, reportId: string, incidentId: string): Promise<RefereeReport> => {
    const res = await fetch(`${API_URL}/referee/reports/${reportId}/incidents/${incidentId}`, {
      method: 'DELETE',
      headers: authHeader(token),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'Failed to remove incident');
    return json.data;
  },

  submitReport: async (token: string, reportId: string): Promise<RefereeReport> => {
    const res = await fetch(`${API_URL}/referee/reports/${reportId}/submit`, {
      method: 'POST',
      headers: authHeader(token),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'Failed to submit report');
    return json.data;
  },

  downloadPdf: async (token: string, reportId: string): Promise<void> => {
    const res = await fetch(`${API_URL}/referee/reports/${reportId}/pdf`, { headers: authHeader(token) });
    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      throw new Error((json as any).message || 'Failed to download PDF');
    }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `referee-report-${reportId}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  },
};
