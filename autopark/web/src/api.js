import axios from 'axios';
import i18n from './i18n';
import { clearSession, getAccessToken, refresh } from './lib/session';

// In development the Vite proxy forwards /api to the backend (see vite.config.js).
// Any build served from a different origin must set VITE_API_URL — without it a
// production bundle has no way to reach the API.
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: { 'Content-Type': 'application/json' },
  // The refresh cookie must travel when the API is on another origin.
  withCredentials: true,
});

// Kept for callers that still import it; the session module owns storage now.
export const clearStoredSession = () => clearSession({ broadcast: false });

// Attach the access token, and ask the API to word its messages in the UI language.
api.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  config.headers['X-App-Language'] = i18n.language;
  return config;
});

const NO_RETRY = ['/auth/login', '/auth/register', '/auth/refresh', '/auth/logout'];

const toLogin = () => {
  clearSession();
  if (window.location.pathname !== '/login') window.location.href = '/login';
};

// A 401 usually means the 15-minute access token ran out: refresh once and
// replay the request, so the person never notices. Only when the refresh
// itself fails is the session really over.
//
// A 401 from the login form itself means "wrong credentials" and belongs to
// the form, which shows it.
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error.response?.status;
    const config = error.config || {};
    const url = config.url || '';

    if (status !== 401 || NO_RETRY.some((path) => url.includes(path))) {
      return Promise.reject(error);
    }
    if (config._retried) {
      toLogin();
      return Promise.reject(error);
    }

    try {
      await refresh();
    } catch {
      toLogin();
      return Promise.reject(error);
    }
    config._retried = true;
    config.headers = { ...config.headers, Authorization: `Bearer ${getAccessToken()}` };
    return api(config);
  }
);

export default api;
