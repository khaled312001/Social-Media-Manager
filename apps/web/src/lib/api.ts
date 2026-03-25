import axios, { AxiosError, AxiosInstance } from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

function createApiClient(): AxiosInstance {
  const client = axios.create({
    baseURL: `${API_URL}/api`,
    withCredentials: true,
    headers: { 'Content-Type': 'application/json' },
    timeout: 30000,
  });

  // Request interceptor — attach token + workspace
  client.interceptors.request.use((config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('auth-token');
      const workspaceId = localStorage.getItem('workspace-id');
      if (token) config.headers.Authorization = `Bearer ${token}`;
      if (workspaceId) config.headers['X-Workspace-Id'] = workspaceId;
    }
    return config;
  });

  // Response interceptor — handle 401 (refresh token)
  client.interceptors.response.use(
    (res) => res.data,
    async (error: AxiosError) => {
      if (error.response?.status === 401 && typeof window !== 'undefined') {
        const refreshToken = localStorage.getItem('refresh-token');
        if (refreshToken) {
          try {
            const { data } = await axios.post(`${API_URL}/api/auth/refresh`, { refreshToken });
            localStorage.setItem('auth-token', data.data.accessToken);
            localStorage.setItem('refresh-token', data.data.refreshToken);
            error.config!.headers!.Authorization = `Bearer ${data.data.accessToken}`;
            return client(error.config!);
          } catch {
            localStorage.clear();
            window.location.href = '/login';
          }
        } else {
          window.location.href = '/login';
        }
      }
      return Promise.reject(error.response?.data || error.message);
    },
  );

  return client;
}

export const api = createApiClient();

// ─── API Methods ──────────────────────────────────────────────────

export const authApi = {
  register: (data: unknown) => api.post('/auth/register', data),
  login: (data: unknown) => api.post('/auth/login', data),
  logout: () => api.post('/auth/logout', {}),
  setup2FA: () => api.get('/auth/2fa/setup'),
  enable2FA: (totpCode: string) => api.post('/auth/2fa/enable', { totpCode }),
};

export const usersApi = {
  getMe: () => api.get('/users/me'),
  updateMe: (data: unknown) => api.patch('/users/me', data),
};

export const workspacesApi = {
  list: () => api.get('/workspaces'),
  get: (id: string) => api.get(`/workspaces/${id}`),
  create: (data: unknown) => api.post('/workspaces', data),
  update: (id: string, data: unknown) => api.patch(`/workspaces/${id}`, data),
  invite: (id: string, data: unknown) => api.post(`/workspaces/${id}/invite`, data),
  acceptInvitation: (token: string) => api.post(`/workspaces/invitations/${token}/accept`, {}),
  removeMember: (id: string, memberId: string) => api.delete(`/workspaces/${id}/members/${memberId}`),
};

export const socialAccountsApi = {
  list: () => api.get('/social-accounts'),
  disconnect: (id: string) => api.delete(`/social-accounts/${id}`),
  /** Returns { url } — call this then open url in a popup */
  getOAuthUrl: (platform: string) => api.get('/social-accounts/oauth-url', { params: { platform } } as any),
};

export const postsApi = {
  list: (params?: Record<string, unknown>) => api.get('/posts', { params } as any),
  get: (id: string) => api.get(`/posts/${id}`),
  create: (data: unknown) => api.post('/posts', data),
  update: (id: string, data: unknown) => api.patch(`/posts/${id}`, data),
  delete: (id: string) => api.delete(`/posts/${id}`),
  publishNow: (id: string) => api.post(`/posts/${id}/publish-now`, {}),
  calendar: (from: string, to: string) => api.get('/posts/calendar', { params: { from, to } } as any),
};

export const inboxApi = {
  stats: () => api.get('/inbox/stats'),
  list: (params?: Record<string, unknown>) => api.get('/inbox', { params } as any),
  get: (id: string) => api.get(`/inbox/${id}`),
  reply: (id: string, content: string) => api.post(`/inbox/${id}/reply`, { content }),
  assign: (id: string, assignedToId: string) => api.post(`/inbox/${id}/assign`, { assignedToId }),
  addNote: (id: string, content: string) => api.post(`/inbox/${id}/notes`, { content }),
  updateStatus: (id: string, status: string) => api.patch(`/inbox/${id}/status`, { status }),
};

export const analyticsApi = {
  overview: (params?: Record<string, unknown>) => api.get('/analytics/overview', { params } as any),
  platform: (platform: string) => api.get(`/analytics/platforms/${platform}`),
  topPosts: () => api.get('/analytics/posts/top'),
  timeSeries: (params?: Record<string, unknown>) => api.get('/analytics/time-series', { params } as any),
};

export const aiApi = {
  generateContent: (data: unknown) => api.post('/ai/content/generate', data),
  suggestReply: (data: unknown) => api.post('/ai/reply/suggest', data),
  analyzePerformance: (query: string) => api.post('/ai/analytics/query', { query }),
  getInsightSummary: (period?: string) => api.get('/ai/analytics/summary', { params: { period } } as any),
  detectTrends: (data: unknown) => api.post('/ai/trends', data),
};

export const campaignsApi = {
  list: () => api.get('/campaigns'),
  get: (id: string) => api.get(`/campaigns/${id}`),
  create: (data: unknown) => api.post('/campaigns', data),
  update: (id: string, data: unknown) => api.patch(`/campaigns/${id}`, data),
  delete: (id: string) => api.delete(`/campaigns/${id}`),
};

export const billingApi = {
  plans: () => api.get('/billing/plans'),
  subscription: () => api.get('/billing/subscription'),
  checkout: (data: unknown) => api.post('/billing/checkout', data),
  portal: () => api.post('/billing/portal', {}),
};

export const crmApi = {
  list: (params?: Record<string, unknown>) => api.get('/crm/contacts', { params } as any),
  get: (id: string) => api.get(`/crm/contacts/${id}`),
  create: (data: unknown) => api.post('/crm/contacts', data),
  update: (id: string, data: unknown) => api.patch(`/crm/contacts/${id}`, data),
  delete: (id: string) => api.delete(`/crm/contacts/${id}`),
  pipeline: () => api.get('/crm/pipeline'),
};

export const notificationsApi = {
  list: () => api.get('/notifications'),
  markRead: (id: string) => api.patch(`/notifications/${id}/read`, {}),
  markAllRead: () => api.patch('/notifications/read-all', {}),
};
