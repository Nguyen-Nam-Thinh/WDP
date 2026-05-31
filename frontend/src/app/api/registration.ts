import { API_URL } from './auth';

export interface Registration {
  _id: string;
  raceId: { _id: string; name: string; grade: string; scheduledTime: string; status: string; tournamentId?: string };
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

export interface RegistrationListResponse {
  registrations: Registration[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

const authHeader = (token: string) => ({ Authorization: `Bearer ${token}` });

export const registrationApi = {
  register: async (token: string, data: { raceId: string; horseId: string; jockeyId?: string }): Promise<Registration> => {
    const res = await fetch(`${API_URL}/registrations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeader(token) },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'Registration failed');
    return json.data;
  },

  getMyRegistrations: async (
    token: string,
    params: { page?: number; limit?: number; status?: string; raceId?: string } = {},
  ): Promise<RegistrationListResponse> => {
    const q = new URLSearchParams({ page: String(params.page ?? 1), limit: String(params.limit ?? 20) });
    if (params.status) q.append('status', params.status);
    if (params.raceId) q.append('raceId', params.raceId);
    const res = await fetch(`${API_URL}/registrations?${q}`, { headers: authHeader(token) });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'Failed to fetch registrations');
    return json.data;
  },

  getById: async (token: string, id: string): Promise<Registration> => {
    const res = await fetch(`${API_URL}/registrations/${id}`, { headers: authHeader(token) });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'Failed to fetch registration');
    return json.data;
  },

  assignJockey: async (token: string, registrationId: string, jockeyId: string): Promise<Registration> => {
    const res = await fetch(`${API_URL}/registrations/${registrationId}/assign-jockey`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...authHeader(token) },
      body: JSON.stringify({ jockeyId }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'Failed to assign jockey');
    return json.data;
  },

  cancel: async (token: string, registrationId: string): Promise<Registration> => {
    const res = await fetch(`${API_URL}/registrations/${registrationId}`, {
      method: 'DELETE',
      headers: authHeader(token),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'Failed to cancel registration');
    return json.data;
  },

  updatePreCheck: async (
    token: string,
    registrationId: string,
    data: { status: 'passed' | 'failed'; note?: string },
  ): Promise<Registration> => {
    const res = await fetch(`${API_URL}/registrations/${registrationId}/pre-check`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...authHeader(token) },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'Failed to update pre-check');
    return json.data;
  },
};
