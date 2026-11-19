import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import Cookies from 'js-cookie';
import { User, Camera, TrafficMetrics, SignalState, Alert, DashboardData, ChartDataPoint, HeatmapCell } from '@/types';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL + '/api/v1',
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = Cookies.get('access_token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    if (error.response?.status === 401) {
      Cookies.remove('access_token');
      if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export const authApi = {
  login: async (credentials: Record<string, string>) => {
    const res = await api.post('/auth/login', {
      username: credentials.username,
      password: credentials.password,
    });
    return res.data;
  },
  logout: async () => (await api.post('/auth/logout')).data,
  refreshToken: async () => (await api.post('/auth/refresh')).data,
  getMe: async (): Promise<User> => (await api.get('/auth/me')).data,
  register: async (data: Partial<User>) => api.post('/auth/register', data),
  getUsers: async (): Promise<User[]> => (await api.get('/users')).data,
};

export const cameraApi = {
  list: async (): Promise<Camera[]> => (await api.get('/cameras')).data,
  get: async (id: string): Promise<Camera> => (await api.get(`/cameras/${id}`)).data,
  create: async (data: Partial<Camera>) => api.post('/cameras', data),
  update: async (id: string, data: Partial<Camera>) => api.put(`/cameras/${id}`, data),
  remove: async (id: string) => api.delete(`/cameras/${id}`),
  start: async (id: string) => api.post(`/cameras/${id}/start`),
  stop: async (id: string) => api.post(`/cameras/${id}/stop`),
  getMetrics: async (id: string): Promise<TrafficMetrics> => (await api.get(`/cameras/${id}/metrics`)).data,
  getSnapshot: async (id: string) => (await api.get(`/cameras/${id}/snapshot`, { responseType: 'blob' })).data,
};

export const detectionApi = {
  getHistory: async (cameraId: string, params: any) => api.get(`/detections/${cameraId}/history`, { params }),
  getLatest: async (cameraId: string) => api.get(`/detections/${cameraId}/latest`),
  getSummary: async (cameraId: string) => api.get(`/detections/${cameraId}/summary`),
  getTimeline: async (cameraId: string): Promise<ChartDataPoint[]> => (await api.get(`/detections/${cameraId}/timeline`)).data,
  export: async (cameraId: string, format: string) => api.get(`/detections/${cameraId}/export`, { params: { format }, responseType: 'blob' }),
};

export const signalApi = {
  list: async (): Promise<SignalState[]> => (await api.get('/signals')).data,
  get: async (id: string): Promise<SignalState> => (await api.get(`/signals/${id}`)).data,
  override: async (id: string, phase: string, duration: number) => api.post(`/signals/${id}/override`, { phase, duration }),
  releaseOverride: async (id: string) => api.post(`/signals/${id}/release`),
  updateTiming: async (id: string, timingData: any) => api.put(`/signals/${id}/timing`, timingData),
  optimize: async (id: string) => api.post(`/signals/${id}/optimize`),
};

export const analyticsApi = {
  getOverview: async (): Promise<DashboardData> => (await api.get('/analytics/overview')).data,
  getCongestion: async (params: any): Promise<ChartDataPoint[]> => (await api.get('/analytics/congestion', { params })).data,
  getVehicleCounts: async (params: any): Promise<ChartDataPoint[]> => (await api.get('/analytics/vehicles', { params })).data,
  getHeatmap: async (): Promise<HeatmapCell[]> => (await api.get('/analytics/heatmap')).data,
  generateReport: async (params: any) => api.post('/analytics/report', params, { responseType: 'blob' }),
};

export const alertApi = {
  list: async (params?: any): Promise<Alert[]> => (await api.get('/alerts', { params })).data,
  get: async (id: string): Promise<Alert> => (await api.get(`/alerts/${id}`)).data,
  create: async (data: Partial<Alert>) => api.post('/alerts', data),
  acknowledge: async (id: string) => api.post(`/alerts/${id}/acknowledge`),
  bulkAcknowledge: async (ids: string[]) => api.post('/alerts/bulk-acknowledge', { ids }),
  getStats: async () => (await api.get('/alerts/stats')).data,
};

export const healthApi = {
  check: async () => (await api.get('/health')).data,
};

export default api;
