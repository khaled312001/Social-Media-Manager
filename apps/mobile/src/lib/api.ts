import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1';

export const apiClient = axios.create({ baseURL: API_URL });

apiClient.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync('auth-token');
  const workspaceId = await SecureStore.getItemAsync('workspace-id');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  if (workspaceId) config.headers['X-Workspace-Id'] = workspaceId;
  return config;
});

apiClient.interceptors.response.use(
  (r) => r,
  async (error) => {
    if (error?.response?.status === 401) {
      const refresh = await SecureStore.getItemAsync('refresh-token');
      if (refresh) {
        try {
          const { data } = await axios.post(`${API_URL}/auth/refresh`, { refreshToken: refresh });
          await SecureStore.setItemAsync('auth-token', data.accessToken);
          error.config.headers.Authorization = `Bearer ${data.accessToken}`;
          return apiClient(error.config);
        } catch {
          await SecureStore.deleteItemAsync('auth-token');
          await SecureStore.deleteItemAsync('refresh-token');
        }
      }
    }
    return Promise.reject(error);
  },
);

export const authApi = {
  login: (email: string, password: string, totpCode?: string) =>
    apiClient.post('/auth/login', { email, password, totpCode }),
  logout: () => apiClient.post('/auth/logout'),
};

export const inboxApi = {
  list: (params?: object) => apiClient.get('/inbox', { params }),
  reply: (id: string, content: string) => apiClient.post(`/inbox/${id}/reply`, { content }),
};

export const postsApi = {
  list: (params?: object) => apiClient.get('/posts', { params }),
  create: (data: object) => apiClient.post('/posts', data),
};

export const analyticsApi = {
  getOverview: (params?: object) => apiClient.get('/analytics/overview', { params }),
};

export const notificationsApi = {
  list: () => apiClient.get('/notifications'),
  markAsRead: (id: string) => apiClient.patch(`/notifications/${id}/read`),
};
