import { create } from 'zustand';
import api from '../api';
import { authService, errorMessage } from '../services';
import {
  clearSession,
  getAccessToken,
  hasSessionHint,
  onSignedOutElsewhere,
  refresh,
  serverLogout,
  setSession,
} from '../lib/session';

const useAuthStore = create((set) => ({
  // Never read from storage: the role always comes from the server, so
  // editing localStorage cannot grant one.
  user: null,
  hydrated: false,
  loading: false,
  error: null,

  login: async (email, password) => {
    set({ loading: true, error: null });
    try {
      const data = await authService.login(email, password);
      setSession(data.token, data.accessTokenExpiresAt);
      set({ user: data.user, loading: false, hydrated: true });
      return data.user;
    } catch (err) {
      const msg = errorMessage(err);
      set({ error: msg, loading: false });
      throw new Error(msg);
    }
  },

  /**
   * Restores the session on page load from the httpOnly refresh cookie.
   * The access token is in memory only, so every reload starts here.
   */
  hydrate: async () => {
    if (!hasSessionHint()) {
      set({ user: null, hydrated: true });
      return null;
    }
    try {
      const data = await refresh();
      set({ user: data.user, hydrated: true });
      return data.user;
    } catch (err) {
      // Only a refused session signs out; a network blip leaves the hint in
      // place so the next load tries again.
      if (err?.response?.status === 401 || err?.response?.status === 403) clearSession({ broadcast: false });
      set({ user: null, hydrated: true });
      return null;
    }
  },

  logout: async () => {
    set({ user: null, hydrated: true });
    clearSession();
    await serverLogout();
  },

  /** Signs out every device, this one included. */
  logoutEverywhere: async () => {
    await authService.logoutAll();
    set({ user: null, hydrated: true });
    clearSession();
    await serverLogout();
  },

  /** Revokes every other session; this tab gets a fresh one. */
  changePassword: async (currentPassword, newPassword) => {
    const data = await authService.changePassword(currentPassword, newPassword);
    setSession(data.token, data.accessTokenExpiresAt);
    set({ user: data.user });
    return data;
  },

  isAuthenticated: () => !!getAccessToken(),
}));

// Signing out in one tab signs out the others.
onSignedOutElsewhere(() => {
  useAuthStore.setState({ user: null, hydrated: true });
  clearSession({ broadcast: false });
  if (window.location.pathname !== '/login') window.location.href = '/login';
});

export { api };
export default useAuthStore;
