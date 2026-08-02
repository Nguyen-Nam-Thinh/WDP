import { apiRequest } from './client';

export type RefereeReportStatus = 'draft' | 'pending_approval' | 'rejected' | 'approved' | 'submitted';

export interface AdminLateScratching {
  _id?: string;
  label: string;
  category?: string;
  note?: string;
  scratchedAt?: string;
}

export interface AdminPerformanceExplanation {
  _id?: string;
  label: string;
  explanation?: string;
  summonedRoles?: string[];
  recordedAt?: string;
}

export interface AdminVetOrder {
  _id?: string;
  label: string;
  orderType: string;
  note?: string;
  orderedAt?: string;
}

export interface AdminIncidentResolution {
  verdict?: 'none' | 'warning' | 'fine' | 'disqualified' | null;
  fineAmount?: number | null;
  fineTargetRole?: 'owner' | 'jockey' | null;
  fineTargetUserId?: string | null;
  reasonCode?: string | null;
  suspensionDays?: number | null;
  note?: string;
  resolvedAt?: string | null;
}

export interface AdminIncident {
  _id: string;
  type: string;
  action?: string;
  recordedAt: string;
  status?: string;
  source?: string;
  raceTimeMs?: number | null;
  flaggedAt?: string | null;
  horseId?: string | { _id: string; name?: string } | null;
  registrationId?: string | null;
  resolution?: AdminIncidentResolution;
}

export interface AdminRefereeReport {
  _id: string;
  raceId: {
    _id: string;
    name: string;
    grade: string;
    scheduledTime: string;
    status: string;
    isOfficial?: boolean;
    preRaceApproved?: boolean;
  };
  refereeId: { _id: string; fullName: string; email: string };
  submittedBy?: { _id: string; fullName: string; email: string } | null;
  reviewedBy?: { _id: string; fullName: string; email: string } | null;
  submittedAt?: string;
  reviewedAt?: string;
  rejectReason?: string;
  preRaceStatus?: RefereeReportStatus | 'draft' | 'pending_approval' | 'rejected' | 'approved';
  preRaceSubmittedAt?: string | null;
  preRaceReviewedBy?: { _id: string; fullName: string; email: string } | string | null;
  preRaceReviewedAt?: string | null;
  preRaceRejectReason?: string;
  status: RefereeReportStatus;
  overallNotes: string;
  preRaceReport?: {
    trackCondition?: string;
    trackConditionNote?: string;
    lateScratchings?: AdminLateScratching[];
    riderChanges?: string[];
    gearChanges?: string[];
    vetChecks?: string[];
  };
  postRaceReport?: {
    performanceExplanations?: AdminPerformanceExplanation[];
    vetOrders?: AdminVetOrder[];
  };
  incidents: AdminIncident[];
  createdAt: string;
}

export interface AdminRefereeReportList {
  reports: AdminRefereeReport[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const refereeReportAdminApi = {
  list: (params: { page?: number; limit?: number; status?: string; phase?: 'prerace' | 'postrace' } = {}) => {
    const q = new URLSearchParams({
      page: String(params.page ?? 1),
      limit: String(params.limit ?? 20),
    });
    if (params.status) q.append('status', params.status);
    if (params.phase) q.append('phase', params.phase);
    return apiRequest<AdminRefereeReportList>(`/referee/admin/reports?${q}`);
  },

  getById: (id: string) => apiRequest<AdminRefereeReport>(`/referee/reports/${id}`),

  approve: (id: string) =>
    apiRequest<AdminRefereeReport>(`/referee/admin/reports/${id}/approve`, { method: 'POST' }),

  reject: (id: string, reason: string) =>
    apiRequest<AdminRefereeReport>(`/referee/admin/reports/${id}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    }),

  approvePreRace: (id: string) =>
    apiRequest<AdminRefereeReport>(`/referee/admin/reports/${id}/approve-prerace`, { method: 'POST' }),

  rejectPreRace: (id: string, reason: string) =>
    apiRequest<AdminRefereeReport>(`/referee/admin/reports/${id}/reject-prerace`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    }),
};
