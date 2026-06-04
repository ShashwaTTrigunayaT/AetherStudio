import { create } from 'zustand';
import { api } from '../lib/api';

export const useAuth = create((set) => ({
  user: JSON.parse(localStorage.getItem('user')) || null,
  loading: false,
  error: null,

  clearError: () => set({ error: null }),

  register: async (email, password, name) => {
    set({ loading: true, error: null });
    try {
      const { data } = await api.post('/auth/register', { email, password, name });
      localStorage.setItem('user', JSON.stringify(data.user));
      localStorage.setItem('token', data.token);
      set({ user: data.user, loading: false });
      return data;
    } catch (err) {
      const error = err.response?.data?.error || err.message;
      set({ error, loading: false });
      throw error;
    }
  },

  login: async (email, password) => {
    set({ loading: true, error: null });
    try {
      const { data } = await api.post('/auth/login', { email, password });
      localStorage.setItem('user', JSON.stringify(data.user));
      localStorage.setItem('token', data.token);
      set({ user: data.user, loading: false });
      return data;
    } catch (err) {
      const error = err.response?.data?.error || err.message;
      set({ error, loading: false });
      throw error;
    }
  },

  logout: () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    set({ user: null });
  },

  forgotPassword: async (email) => {
    set({ loading: true, error: null });
    try {
      const { data } = await api.post('/auth/forgot-password', { email });
      set({ loading: false });
      return data;
    } catch (err) {
      const error = err.response?.data?.error || err.message;
      set({ error, loading: false });
      throw error;
    }
  },

  resetPassword: async (email, code, password) => {
    set({ loading: true, error: null });
    try {
      const { data } = await api.post('/auth/reset-password', { email, code, password });
      set({ loading: false });
      return data;
    } catch (err) {
      const error = err.response?.data?.error || err.message;
      set({ error, loading: false });
      throw error;
    }
  },

  updateAvatar: (avatarUrl) => {
    const currentUser = JSON.parse(localStorage.getItem('user')) || {};
    const updatedUser = { ...currentUser, avatar: avatarUrl };
    localStorage.setItem('user', JSON.stringify(updatedUser));
    set({ user: updatedUser });
  },

  uploadAvatar: async (file) => {
    const formData = new FormData();
    formData.append('avatar', file);
    try {
      const { data } = await api.post('/auth/upload-avatar', formData);
      // Update local state and localStorage
      const currentUser = JSON.parse(localStorage.getItem('user')) || {};
      const updatedUser = { ...currentUser, avatar: data.avatar };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      set({ user: updatedUser });
      return data.avatar;
    } catch (err) {
      const error = err.response?.data?.error || err.message;
      throw error;
    }
  },
}));
