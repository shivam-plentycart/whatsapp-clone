import axios from 'axios';
import { API_BASE_URL } from './constants';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor — attach token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('wa_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor — handle auth errors
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('wa_token');
      localStorage.removeItem('wa_user');
      // Reload to trigger auth check
      if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
        window.location.href = '/login';
      }
    }
    const message = error.response?.data?.message || error.message || 'Something went wrong';
    return Promise.reject(new Error(message));
  }
);

// ── Auth API ──────────────────────────────────────────────────────────────────
export const authAPI = {
  register: (formData) => api.post('/auth/register', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  sendOTP: (phone) => api.post('/auth/send-otp', { phone }),
  verifyOTP: (phone, otp) => api.post('/auth/verify-otp', { phone, otp }),
  logout: () => api.post('/auth/logout'),
  getMe: () => api.get('/auth/me')
};

// ── Users API ─────────────────────────────────────────────────────────────────
export const usersAPI = {
  search: (query) => api.get(`/users/search?query=${encodeURIComponent(query)}`),
  getById: (id) => api.get(`/users/${id}`),
  updateProfile: (data) => api.put('/users/profile', data),
  updateAvatar: (formData) => api.put('/users/avatar', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
};

// ── Chats API ─────────────────────────────────────────────────────────────────
export const chatsAPI = {
  getConversations: () => api.get('/chats/conversations'),
  getMessages: (conversationId, page = 1) =>
    api.get(`/chats/${conversationId}/messages?page=${page}&limit=50`),
  getOrCreateConversation: (otherUserId) =>
    api.post('/chats/conversation', { otherUserId }),
  deleteMessageForMe: (messageId) =>
    api.delete(`/chats/messages/${messageId}/me`),
  deleteMessageForEveryone: (messageId) =>
    api.delete(`/chats/messages/${messageId}/everyone`)
};

// ── Upload API ────────────────────────────────────────────────────────────────
export const uploadAPI = {
  uploadAvatar: (formData) => api.post('/upload/avatar', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
};

// ── Invite API ────────────────────────────────────────────────────────────────
export const inviteAPI = {
  create: () => api.post('/invites'),
  getInfo: (token) => api.get(`/invites/${token}`),
  accept: (token) => api.post(`/invites/${token}/accept`)
};

export default api;
