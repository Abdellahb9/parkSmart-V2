import { create } from 'zustand';
import api from '../api';

const useAuthStore = create((set) => ({
  user: JSON.parse(localStorage.getItem('autopark_user') || 'null'),
  token: localStorage.getItem('autopark_token') || null,
  loading: false,
  error: null,

  login: async (email, password) => {
    set({ loading: true, error: null });
    try {
      const { data } = await api.post('/auth/login', { email, password });
      localStorage.setItem('autopark_token', data.token);
      localStorage.setItem('autopark_user', JSON.stringify(data.user));
      set({ user: data.user, token: data.token, loading: false });
      return data.user;
    } catch (err) {
      const msg = err.response?.data?.message || 'Login failed';
      set({ error: msg, loading: false });
      throw new Error(msg);
    }
  },

  logout: () => {
    localStorage.removeItem('autopark_token');
    localStorage.removeItem('autopark_user');
    set({ user: null, token: null });
  },

  isAuthenticated: () => {
    const token = localStorage.getItem('autopark_token');
    return !!token;
  },
}));

export default useAuthStore;
