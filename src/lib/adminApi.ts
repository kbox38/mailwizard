import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const adminApi = axios.create({
  baseURL: `${API_URL}/api/admin`,
});

adminApi.interceptors.request.use((config) => {
  const token = localStorage.getItem('adminToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export interface DashboardMetrics {
  organizations: {
    total: number;
    new_today: number;
    active_30d: number;
    by_plan: {
      free: number;
      pro: number;
      pro_plus: number;
    };
  };
  revenue: {
    mrr: number;
    total_today: number;
    growth_30d: number;
  };
  emails: {
    sent_today: number;
    sent_30d: number;
    avg_per_org: number;
  };
  deliverability: {
    bounce_rate: number;
    complaint_rate: number;
    avg_open_rate: number;
  };
}

export interface UserData {
  id: string;
  name: string;
  plan: string;
  status: string;
  emailsSentThisMonth: number;
  monthlyLimit: number;
  users: Array<{
    email: string;
    role: string;
    lastLogin: string | null;
  }>;
  billingInfo?: {
    stripeCustomerId: string;
    currentPeriodEnd: string;
  };
  createdAt: string;
}

export interface SystemHealth {
  status: string;
  timestamp: string;
  services: {
    database: { status: string; latency: number };
    redis: { status: string; latency: number };
    queue: { status: string; latency: number };
  };
}

export interface SystemMetrics {
  redis: {
    memory: {
      used: string;
      peak: string;
      percentage: number;
    };
    stats: {
      connected_clients: number;
      total_commands: number;
      ops_per_sec: number;
    };
  };
  queues: Array<{
    name: string;
    waiting: number;
    active: number;
    completed: number;
    failed: number;
  }>;
  database: {
    connections: {
      active: number;
      idle: number;
      total: number;
    };
    size: string;
  };
}

export interface ActivityLog {
  id: string;
  adminEmail: string;
  actionType: string;
  resourceType: string | null;
  resourceId: string | null;
  details: any;
  ipAddress: string;
  createdAt: string;
}

export const adminApiService = {
  // Dashboard
  async getDashboardMetrics(timeRange: string = '30d'): Promise<DashboardMetrics> {
    const response = await adminApi.get(`/dashboard/overview?timeRange=${timeRange}`);
    return response.data;
  },

  async getUserStats() {
    const response = await adminApi.get('/dashboard/users/stats');
    return response.data;
  },

  async getRevenueMetrics() {
    const response = await adminApi.get('/dashboard/revenue');
    return response.data;
  },

  // Users
  async getUsers(params: {
    page?: number;
    pageSize?: number;
    search?: string;
    plan?: string;
    status?: string;
  }) {
    const response = await adminApi.get('/users', { params });
    return response.data;
  },

  async getUserById(id: string): Promise<UserData> {
    const response = await adminApi.get(`/users/${id}`);
    return response.data;
  },

  async suspendUser(id: string, reason: string) {
    const response = await adminApi.post(`/users/${id}/suspend`, { reason });
    return response.data;
  },

  async activateUser(id: string) {
    const response = await adminApi.post(`/users/${id}/activate`);
    return response.data;
  },

  async deleteUser(id: string) {
    const response = await adminApi.delete(`/users/${id}`);
    return response.data;
  },

  async impersonateUser(id: string) {
    const response = await adminApi.post(`/users/${id}/impersonate`);
    return response.data;
  },

  // System
  async getSystemHealth(): Promise<SystemHealth> {
    const response = await adminApi.get('/system/health');
    return response.data;
  },

  async getSystemMetrics(): Promise<SystemMetrics> {
    const response = await adminApi.get('/system/metrics');
    return response.data;
  },

  async getActivityLogs(params: {
    page?: number;
    pageSize?: number;
    adminId?: string;
    actionType?: string;
  }) {
    const response = await adminApi.get('/system/logs', { params });
    return response.data;
  },
};

export default adminApi;
