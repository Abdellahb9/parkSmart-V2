import api from '../api';
import i18n from '../i18n';

// One place per endpoint, so pages never build URLs inline and a backend
// change is a one-line edit here.

// X-Auth-Mode: cookie asks for a short access token plus an httpOnly refresh
// cookie, instead of the long-lived token older clients receive.
const COOKIE_SESSION = { headers: { 'X-Auth-Mode': 'cookie' } };

export const authService = {
  login: (email, password) => api.post('/auth/login', { email, password }, COOKIE_SESSION).then((r) => r.data),
  me: () => api.get('/auth/me').then((r) => r.data),
  changePassword: (currentPassword, newPassword) =>
    api.post('/auth/change-password', { currentPassword, newPassword }, COOKIE_SESSION).then((r) => r.data),
  logoutAll: () => api.post('/auth/logout-all').then((r) => r.data),
};

export const parkingService = {
  list: () => api.get('/parkings').then((r) => r.data),
  get: (id) => api.get(`/parkings/${id}`).then((r) => r.data),
  create: (payload) => api.post('/parkings', payload).then((r) => r.data),
  update: (id, payload) => api.patch(`/parkings/${id}`, payload).then((r) => r.data),
};

export const adminService = {
  stats: (params) => api.get('/admin/stats', { params }).then((r) => r.data),
  users: () => api.get('/admin/users').then((r) => r.data),
  createUser: (payload) => api.post('/admin/users', payload).then((r) => r.data),
  setUserStatus: (id, isActive) => api.patch(`/admin/users/${id}/status`, { isActive }).then((r) => r.data),
  reservations: () => api.get('/admin/reservations').then((r) => r.data),
  complaints: () => api.get('/admin/complaints').then((r) => r.data),
};

export const ownerService = {
  dashboard: () => api.get('/owner/dashboard').then((r) => r.data),
  reservations: () => api.get('/owner/reservations').then((r) => r.data),
  complaints: () => api.get('/owner/complaints').then((r) => r.data),
  rewards: () => api.get('/owner/rewards').then((r) => r.data),
};

export const bookingService = {
  // Staff-side lifecycle. The driver's own actions go through the mobile app.
  checkIn: (id, qrToken) => api.post(`/bookings/${id}/check-in`, { qrToken }).then((r) => r.data),
  checkOut: (id) => api.post(`/bookings/${id}/check-out`).then((r) => r.data),
  extend: (id, newEndTime) => api.patch(`/bookings/${id}/extend`, { newEndTime }).then((r) => r.data),
};

export const complaintService = {
  resolve: (id) => api.patch(`/complaints/${id}/resolve`).then((r) => r.data),
};

/** Turns any Axios failure into a message worth showing a user. */
export const errorMessage = (err) => {
  const data = err?.response?.data;
  if (data?.errors?.length) return data.errors.map((e) => e.message).join(' · ');
  if (data?.message) return data.message;
  if (err?.code === 'ERR_NETWORK') return i18n.t('errors.network');
  return i18n.t('errors.generic');
};

export const paymentService = {
  wallet: () => api.get('/payments/wallet').then((r) => r.data),
  mine: () => api.get('/payments/my').then((r) => r.data),
  topUp: (amount) => api.post('/payments/topup', { amount }).then((r) => r.data),
  payBooking: (bookingId, method) =>
    api.post(`/payments/booking/${bookingId}`, { method }).then((r) => r.data),
  confirm: (id, outcome) => api.post(`/payments/${id}/confirm`, { outcome }).then((r) => r.data),
  list: (params) => api.get('/payments', { params }).then((r) => r.data),
  collect: (id) => api.post(`/payments/${id}/collect`).then((r) => r.data),
};

export const reportService = {
  revenue: (params) => api.get('/reports/revenue', { params }).then((r) => r.data),
  // The file endpoints need the Authorization header, so they go through
  // axios and are handed to the browser as a blob rather than a plain link.
  download: async (format, params) => {
    const res = await api.get('/reports/revenue', {
      params: { ...params, format },
      responseType: 'blob',
    });
    const match = /filename="([^"]+)"/.exec(res.headers['content-disposition'] || '');
    const name = match?.[1] || `autopark-revenus.${format}`;
    const url = URL.createObjectURL(res.data);
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    return name;
  },
};
