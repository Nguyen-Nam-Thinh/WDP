import { apiRequest } from './client';

export type RefereeReportStatus = 'draft' | 'pending_approval' | 'rejected' | 'approved' | 'submitted';

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
    lateScratchings?: { label: string; category?: string; note?: string }[];
    riderChanges?: string[];
    gearChanges?: string[];
    vetChecks?: string[];
  };
  postRaceReport?: {
    performanceExplanations?: { label: string; explanation?: string; summonedRoles?: string[] }[];
    vetOrders?: { label: string; orderType: string; note?: string }[];
  };
  incidents: {
    _id: string;
    type: string;
    description: string;
    action?: string;
    recordedAt: string;
    status?: string;
    source?: string;
    resolution?: { verdict?: string; fineAmount?: number; note?: string };
  }[];
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
