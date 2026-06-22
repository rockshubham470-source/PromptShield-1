import axios, { AxiosInstance, InternalAxiosRequestConfig, AxiosError } from 'axios';

// Base API client
const api: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Token utility functions
const getToken = (): string | null => {
  return localStorage.getItem('token');
};

const getOrgId = (): string | null => {
  return localStorage.getItem('organization_id');
};

const decodeJwt = (token: string): any => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => `%${('00' + c.charCodeAt(0).toString(16)).slice(-2)}`)
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Failed to decode JWT:', error);
    return null;
  }
};

const isTokenExpired = (token: string): boolean => {
  const decoded = decodeJwt(token);
  if (!decoded || !decoded.exp) {
    // If we can't decode or no expiration, assume not expired
    return false;
  }
  const now = Math.floor(Date.now() / 1000);
  return decoded.exp < now;
};

// Request interceptor - add auth headers
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    const orgId = getOrgId();
    if (orgId) {
      config.headers['X-Organization-Id'] = orgId;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - handle errors and token refresh
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value: unknown) => void;
  reject: (reason: unknown) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });

  failedQueue = [];
};

api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
      _retryCount?: number;
    };

    // If we don't have a request or it's not a 401, reject immediately
    if (!originalRequest || !error.response || error.response.status !== 401) {
      return Promise.reject(error);
    }

    // If this is a retry attempt and it still failed, clear auth and redirect
    if (originalRequest._retry) {
      // Clear auth data
      localStorage.removeItem('token');
      localStorage.removeItem('organization_id');
      localStorage.removeItem('organization_name');
      
      // Redirect to login
      window.location.href = '/login';
      return Promise.reject(error);
    }

    // Mark for retry
    originalRequest._retry = true;
    originalRequest._retryCount = (originalRequest._retryCount || 0) + 1;

    // Limit retries to prevent infinite loops
    if (originalRequest._retryCount > 1) {
      // Clear auth data
      localStorage.removeItem('token');
      localStorage.removeItem('organization_id');
      localStorage.removeItem('organization_name');
      
      // Redirect to login
      window.location.href = '/login';
      return Promise.reject(error);
    }

    // Check if we can refresh the token
    const token = getToken();
    if (token && !isTokenExpired(token)) {
      // Token is not expired, but we got 401 - might be invalid token
      // Clear auth and redirect
      localStorage.removeItem('token');
      localStorage.removeItem('organization_id');
      localStorage.removeItem('organization_name');
      window.location.href = '/login';
      return Promise.reject(error);
    }

    // If no token or token is expired, try to refresh
    if (!isRefreshing) {
      isRefreshing = true;
      
      try {
        // Attempt to refresh token by calling refresh endpoint
        // Note: This assumes your backend has a refresh token endpoint
        // If not, you'll need to implement your own refresh logic
        const refreshToken = localStorage.getItem('refresh_token');
        
        if (refreshToken) {
          const response = await api.post('/auth/refresh', { 
            refresh_token: refreshToken 
          });
          
          const { access_token, refresh_token } = response.data;
          
          // Update tokens
          localStorage.setItem('token', access_token);
          if (refresh_token) {
            localStorage.setItem('refresh_token', refresh_token);
          }
          
          // Update authorization header for original request
          originalRequest.headers.Authorization = `Bearer ${access_token}`;
          
          // Process queued requests
          processQueue(null, access_token);
          
          // Retry original request
          return api(originalRequest);
        } else {
          // No refresh token available
          throw new Error('No refresh token available');
        }
      } catch (refreshError) {
        // Refresh failed - clear auth and redirect
        localStorage.removeItem('token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('organization_id');
        localStorage.removeItem('organization_name');
        
        window.location.href = '/login';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    } else {
      // If refresh is already in progress, queue this request
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      }).then((token) => {
        // Retry the request with new token
        originalRequest.headers.Authorization = `Bearer ${token}`;
        return api(originalRequest);
      }).catch((err) => {
        return Promise.reject(err);
      });
    }
  }
);

// Notification API endpoints
export const notificationApi = {
  fetchNotifications: () => api.get('/notifications'),
  markAsRead: (id: string) => api.put(`/notifications/${id}/read`),
  markAllAsRead: () => api.put('/notifications/read-all'),
  deleteNotification: (id: string) => api.delete(`/notifications/${id}`)
};

export default api;
