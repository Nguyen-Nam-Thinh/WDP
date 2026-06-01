import { apiRequest } from './client';

export interface Race {
  _id: string;
  tournamentId: { _id: string; name: string; status: string } | string;
  name: string;
  grade: 'Maiden' | 'G3' | 'G2' | 'G1';
  maxCapacity: number;
  purse: number;
  registrationFee: number;
  scheduledTime: string;
  cutoffTime: string;
  distance: number;
  eligibility: {
    allowedGrades: string[];
    minPoints: number;
    minAge: number;
    maxAge: number;
  };
  refereeId?: { _id: string; fullName: string; email: string } | null;
  status: 'open' | 'closed' | 'pre_check' | 'running' | 'finished' | 'cancelled';
  createdAt: string;
}

export interface RaceListResponse {
  races: Race[];
  total: number;
  page: number;
  totalPages: number;
}

export interface CreateRaceData {
  tournamentId: string;
  name: string;
  grade: string;
  maxCapacity: number;
  purse: number;
  registrationFee: number;
  scheduledTime: string;
  cutoffTime: string;
  distance: number;
  eligibility?: {
    allowedGrades?: string[];
    minPoints?: number;
    minAge?: number;
    maxAge?: number;
  };
}

export interface Registration {
  _id: string;
  raceId: { _id: string; name: string; grade: string; scheduledTime: string; status: string };
  horseId: { _id: string; name: string; breed: string; gender: string; currentGrade: string; imageUrl?: string };
  ownerId: { _id: string; fullName: string; email: string };
  jockeyId?: { _id: string; fullName: string; email: string; jockeyProfile?: { experienceYears: number; weight: number } } | null;
  feePaid: number;
  status: 'active' | 'cancelled' | 'disqualified';
  preCheckResult: { status: 'pending' | 'passed' | 'failed'; note: string; checkedAt?: string };
  registeredAt: string;
  cancelledAt?: string;
  refundAmount: number;
}

export const raceApi = {
  list: (params: { tournamentId?: string; status?: string; page?: number; limit?: number } = {}) => {
    const q = new URLSearchParams({ page: String(params.page ?? 1), limit: String(params.limit ?? 50) });
    if (params.tournamentId) q.append('tournamentId', params.tournamentId);
    if (params.status) q.append('status', params.status);
    return apiRequest<RaceListResponse>(`/races?${q}`);
  },

  getById: (id: string) => apiRequest<Race>(`/races/${id}`),

  create: (data: CreateRaceData) =>
    apiRequest<Race>('/races', { method: 'POST', body: JSON.stringify(data) }),

  update: (id: string, data: Partial<CreateRaceData>) =>
    apiRequest<Race>(`/races/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),

  cancel: (id: string) => apiRequest<Race>(`/races/${id}`, { method: 'DELETE' }),

  updateStatus: (id: string, status: 'closed' | 'pre_check') =>
    apiRequest<Race>(`/races/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),

  assignReferee: (id: string, refereeId: string) =>
    apiRequest<Race>(`/races/${id}/assign-referee`, { method: 'PATCH', body: JSON.stringify({ refereeId }) }),

  getRegistrations: (raceId: string, page = 1, limit = 50) => {
    const q = new URLSearchParams({ page: String(page), limit: String(limit) });
    return apiRequest<{ registrations: Registration[]; total: number }>(`/races/${raceId}/registrations?${q}`);
  },

  forceSimulate: (id: string) =>
    apiRequest<{ message: string; raceId: string }>(`/races/${id}/force-simulate`, { method: 'POST' }),
};
