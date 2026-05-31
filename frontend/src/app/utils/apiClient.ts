import { API_URL } from '../api/auth';

export const fetchWithAuth = async (input: RequestInfo | URL, init?: RequestInit) => {
  let response = await fetch(input, init);

  if (response.status === 401) {
    const refreshTokenStr = localStorage.getItem('refreshToken');
    if (refreshTokenStr) {
      try {
        const refreshRes = await fetch(`${API_URL}/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken: refreshTokenStr }),
        });
        
        if (!refreshRes.ok) throw new Error('Refresh failed');
        
        const json = await refreshRes.json();
        const data = json.data;
        localStorage.setItem('accessToken', data.accessToken);
        if (data.refreshToken) {
          localStorage.setItem('refreshToken', data.refreshToken);
        }
        
        // Retry original request with new token
        const newInit = { ...init };
        const headers = new Headers(newInit.headers || {});
        headers.set('Authorization', `Bearer ${data.accessToken}`);
        newInit.headers = headers;

        response = await fetch(input, newInit);
      } catch (err) {
        // Refresh failed (token expired or invalid)
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    } else {
      // No refresh token available
      localStorage.removeItem('accessToken');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
  }

  return response;
};
