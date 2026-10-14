import axios from 'axios';

/**
 * The portal's session, kept out of reach of page scripts.
 *
 * The access token lives in memory only and expires after 15 minutes. The
 * refresh token is an httpOnly cookie the browser sends to /api/auth and
 * that no script — ours or an injected one — can read. Before this, a
 * 7-day token sat in localStorage, where any XSS could copy it.
 *
 * Reloading the page loses the memory token; refresh() trades the cookie for
 * a new one. localStorage keeps only a "signed in" hint, so a visitor who
 * never signed in is not sent through a pointless refresh call.
 */

const API = import.meta.env.VITE_API_URL || '/api';
const HINT_KEY = 'autopark_signed_in';
// Tokens from before this change; removed on sight.
const LEGACY_KEYS = ['autopark_token', 'autopark_user'];

let accessToken = null;
let expiresAt = 0;
const listeners = new Set();

const storage = {
  get(key) {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  set(key, value) {
    try {
      localStorage.setItem(key, value);
    } catch {
      // private mode: the hint just isn't remembered
    }
  },
  remove(key) {
    try {
      localStorage.removeItem(key);
    } catch {
      // same
    }
  },
};

LEGACY_KEYS.forEach((key) => storage.remove(key));

export const getAccessToken = () => accessToken;
export const hasSessionHint = () => storage.get(HINT_KEY) === '1';

/** Called with the new token (or null) whenever it changes. */
export const onTokenChange = (listener) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

export const setSession = (token, expiry) => {
  accessToken = token || null;
  expiresAt = expiry ? new Date(expiry).getTime() : 0;
  if (token) storage.set(HINT_KEY, '1');
  listeners.forEach((l) => l(accessToken));
};

/** True when the token is missing or expires within the next 30 seconds. */
export const isExpiring = () => !accessToken || (expiresAt && expiresAt - Date.now() < 30 * 1000);

// Other tabs hear about sign-outs, so one tab signing out signs them all out.
const channel = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel('autopark-auth') : null;

export const clearSession = ({ broadcast = true } = {}) => {
  storage.remove(HINT_KEY);
  setSession(null);
  if (broadcast) channel?.postMessage({ type: 'signed-out' });
};

export const onSignedOutElsewhere = (handler) => {
  if (!channel) return () => {};
  const listener = (event) => {
    if (event.data?.type === 'signed-out') handler();
  };
  channel.addEventListener('message', listener);
  return () => channel.removeEventListener('message', listener);
};

// A bare client: refresh must not go through the interceptors that call it.
const raw = axios.create({ baseURL: API, withCredentials: true });

let inFlight = null;

/**
 * Trades the refresh cookie for a new access token. Concurrent callers share
 * one request: three 401s at once must not rotate the cookie three times.
 * Resolves to { token, user } or rejects when the session is over.
 */
export const refresh = () => {
  if (!inFlight) {
    inFlight = raw
      .post('/auth/refresh', null, { headers: { 'X-Requested-With': 'autopark-web' } })
      .then(({ data }) => {
        setSession(data.token, data.accessTokenExpiresAt);
        return data;
      })
      .finally(() => {
        inFlight = null;
      });
  }
  return inFlight;
};

/** Ends this browser's session on the server; never throws. */
export const serverLogout = async () => {
  try {
    await raw.post('/auth/logout');
  } catch {
    // Signed out locally either way.
  }
};
