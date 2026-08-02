import { API_URL } from './auth';
import { getApiErrorMessage } from '../utils/errorMessages';
import type { Race } from './race';

export type PenaltyReasonCode = 'interference' | 'whip' | 'careless' | 'late' | 'other';
export type PostRaceVetOrderType = 'blood' | 'urine' | 'endoscopy' | 'clinical';

export interface Incident {
  _id: string;
  registrationId?: string;
  horseId?: { _id: string; name: string; breed: string } | string | null;
  type: 'interference' | 'doping' | 'equipment_violation' | 'jockey_violation' | 'other';
  action?: string;
  recordedAt: string;
  source?: 'manual' | 'live_flag';
  status?: 'draft' | 'resolved';
  raceTimeMs?: number | null;
  flaggedAt?: string | null;
  resolution?: {
    verdict: 'none' | 'warning' | 'fine' | 'disqualified' | null;
    fineAmount?: number | null;
    fineTargetRole?: 'owner' | 'jockey' | null;
    fineTargetUserId?: string | null;
    reasonCode?: PenaltyReasonCode | null;
    suspensionDays?: number | null;
    note?: string;
    resolvedAt?: string | null;
  } | null;
}

export type IncidentVerdict = 'none' | 'warning' | 'fine' | 'disqualified';

export type TrackCondition = 'Firm' | 'Good' | 'Soft' | 'Heavy' | 'Synthetic';

export interface LateScratching {
  _id: string;
  registrationId: string;
  horseId: string;
  category: 'veterinary' | 'jockey' | 'gear' | 'administrative';
  note: string;
  label: string;
  scratchedAt: string;
}

export interface PreRaceReport {
  trackCondition: TrackCondition | '';
  trackConditionNote: string;
  lateScratchings: LateScratching[];
  riderChanges: string[];
  gearChanges: string[];
  vetChecks: string[];
}

export interface PerformanceExplanation {
  _id?: string;
  registrationId: string;
  horseId: string;
  label: string;
  summonedRoles: Array<'jockey' | 'owner'>;
  explanation: string;
  recordedAt?: string;
}

export interface VetOrder {
  _id?: string;
  registrationId: string;
  horseId: string;
  label: string;
  orderType: PostRaceVetOrderType;
  note: string;
  orderedAt?: string;
}

export interface PostRaceReport {
  performanceExplanations: PerformanceExplanation[];
  vetOrders: VetOrder[];
}

export interface RefereeReport {
  _id: string;
  raceId: {
    _id: string;
    name: string;
    grade: string;
    scheduledTime: string;
    status: string;
    distance: number;
    purse: number;
    tournamentId?: string;
    isOfficial?: boolean;
    stewardsReady?: boolean;
    preRaceApproved?: boolean;
    resultsConfirmedAt?: string | null;
  };
  refereeId: { _id: string; fullName: string; email: string; refereeProfile?: { licenseNumber?: string; yearsOfService?: number } };
  incidents: Incident[];
  preRaceReport: PreRaceReport;
  postRaceReport?: PostRaceReport;
  overallNotes: string;
  preRaceStatus?: 'draft' | 'pending_approval' | 'rejected' | 'approved';
  preRaceSubmittedAt?: string | null;
  preRaceReviewedBy?: { _id: string; fullName: string; email: string } | string | null;
  preRaceReviewedAt?: string | null;
  preRaceRejectReason?: string;
  status: 'draft' | 'pending_approval' | 'rejected' | 'approved' | 'submitted';
  submittedBy?: { _id: string; fullName: string; email: string } | string | null;
  submittedAt?: string;
  reviewedBy?: { _id: string; fullName: string; email: string } | string | null;
  reviewedAt?: string;
  rejectReason?: string;
  createdAt: string;
}

export type UpdateRefereeReportPayload = {
  overallNotes?: string;
  preRaceReport?: {
    trackCondition?: TrackCondition | '';
    trackConditionNote?: string;
    riderChanges?: string[];
    gearChanges?: string[];
    vetChecks?: string[];
  };
  postRaceReport?: {
    performanceExplanations?: PerformanceExplanation[];
    vetOrders?: VetOrder[];
  };
};

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
    if (!res.ok) throw new Error(getApiErrorMessage(json.message));
    return json.data;
  },

  createReport: async (token: string, raceId: string): Promise<RefereeReport> => {
    const res = await fetch(`${API_URL}/referee/reports`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeader(token) },
      body: JSON.stringify({ raceId }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(getApiErrorMessage(json.message));
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
    if (!res.ok) throw new Error(getApiErrorMessage(json.message));
    return json.data;
  },

  getReportById: async (token: string, id: string): Promise<RefereeReport> => {
    const res = await fetch(`${API_URL}/referee/reports/${id}`, { headers: authHeader(token) });
    const json = await res.json();
    if (!res.ok) throw new Error(getApiErrorMessage(json.message));
    return json.data;
  },

  updateReport: async (
    token: string,
    id: string,
    data: UpdateRefereeReportPayload,
  ): Promise<RefereeReport> => {
    const res = await fetch(`${API_URL}/referee/reports/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...authHeader(token) },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(getApiErrorMessage(json.message));
    return json.data;
  },

  addIncident: async (
    token: string,
    reportId: string,
    data: { type: Incident['type']; action?: string; registrationId?: string },
  ): Promise<RefereeReport> => {
    const res = await fetch(`${API_URL}/referee/reports/${reportId}/incidents`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeader(token) },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(getApiErrorMessage(json.message));
    return json.data;
  },

  flagIncident: async (
    token: string,
    reportId: string,
    data: { registrationId?: string; horseId?: string; raceTimeMs?: number },
  ): Promise<RefereeReport> => {
    const res = await fetch(`${API_URL}/referee/reports/${reportId}/incidents/flag`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeader(token) },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(getApiErrorMessage(json.message));
    return json.data;
  },

  ensureReport: async (token: string, raceId: string): Promise<RefereeReport> => {
    const res = await fetch(`${API_URL}/referee/reports/ensure`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeader(token) },
      body: JSON.stringify({ raceId }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(getApiErrorMessage(json.message));
    return json.data;
  },

  updateIncident: async (
    token: string,
    reportId: string,
    incidentId: string,
    data: {
      type?: Incident['type'];
      action?: string;
    },
  ): Promise<RefereeReport> => {
    const res = await fetch(`${API_URL}/referee/reports/${reportId}/incidents/${incidentId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...authHeader(token) },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(getApiErrorMessage(json.message));
    return json.data;
  },

  resolveIncident: async (
    token: string,
    reportId: string,
    incidentId: string,
    data: {
      type?: Incident['type'];
      action?: string;
      resolution: {
        verdict: IncidentVerdict;
        fineAmount?: number;
        fineTargetRole?: 'owner' | 'jockey';
        reasonCode?: PenaltyReasonCode | null;
        suspensionDays?: number | null;
        note?: string;
      };
    },
  ): Promise<RefereeReport> => {
    const res = await fetch(`${API_URL}/referee/reports/${reportId}/incidents/${incidentId}/resolve`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...authHeader(token) },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(getApiErrorMessage(json.message));
    return json.data;
  },

  confirmResults: async (token: string, raceId: string): Promise<any> => {
    const res = await fetch(`${API_URL}/referee/races/${raceId}/confirm-results`, {
      method: 'POST',
      headers: authHeader(token),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(getApiErrorMessage(json.message));
    return json.data;
  },

  removeIncident: async (token: string, reportId: string, incidentId: string): Promise<RefereeReport> => {
    const res = await fetch(`${API_URL}/referee/reports/${reportId}/incidents/${incidentId}`, {
      method: 'DELETE',
      headers: authHeader(token),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(getApiErrorMessage(json.message));
    return json.data;
  },

  submitReport: async (token: string, reportId: string): Promise<RefereeReport> => {
    const res = await fetch(`${API_URL}/referee/reports/${reportId}/submit`, {
      method: 'POST',
      headers: authHeader(token),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(getApiErrorMessage(json.message));
    return json.data;
  },

  submitPreRace: async (token: string, reportId: string): Promise<RefereeReport> => {
    const res = await fetch(`${API_URL}/referee/reports/${reportId}/submit-prerace`, {
      method: 'POST',
      headers: authHeader(token),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(getApiErrorMessage(json.message));
    return json.data;
  },

  downloadPdf: async (token: string, reportId: string): Promise<void> => {
    const res = await fetch(`${API_URL}/referee/reports/${reportId}/pdf`, { headers: authHeader(token) });
    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      throw new Error(getApiErrorMessage((json as any).message));
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
