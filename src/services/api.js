import axios from 'axios';

// Resolve backend API URL (Default to port 5298 for C# Web API)
const API_BASE_URL = import.meta.env.VITE_API_URL || 
  (typeof window !== 'undefined' && window.location.hostname && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1'
    ? `http://${window.location.hostname}:5298/api`
    : 'http://localhost:5298/api');

export const TOKEN_KEYS = {
  ACCESS: 'accessToken',
  REFRESH: 'refreshToken',
  USER: 'authUser',
  LEGACY_TOKEN: 'token', // Backwards compatibility for existing components
};

// Purge obsolete hardcoded mock tokens from previous builds
if (typeof window !== 'undefined' && window.localStorage) {
  const token = localStorage.getItem(TOKEN_KEYS.ACCESS) || localStorage.getItem(TOKEN_KEYS.LEGACY_TOKEN);
  const storedUser = localStorage.getItem(TOKEN_KEYS.USER);
  if (
    (token && (token.startsWith('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2YWI2YjExMDVjNGIyN2I1OTc2YmE2ZWEi') || token.includes('6ab6b1105c4b27b5976ba6ea'))) ||
    (storedUser && storedUser.includes('6ab6b1105c4b27b5976ba6ea'))
  ) {
    localStorage.removeItem(TOKEN_KEYS.ACCESS);
    localStorage.removeItem(TOKEN_KEYS.LEGACY_TOKEN);
    localStorage.removeItem(TOKEN_KEYS.REFRESH);
    localStorage.removeItem(TOKEN_KEYS.USER);
  }
}

// Session values come only from a real login (no hard-coded fallback credentials)
export const getAccessToken = () =>
  localStorage.getItem(TOKEN_KEYS.ACCESS) || localStorage.getItem(TOKEN_KEYS.LEGACY_TOKEN) || null;

export const getRefreshToken = () =>
  localStorage.getItem(TOKEN_KEYS.REFRESH) || null;

export const getStoredUser = () => {
  try {
    const raw = localStorage.getItem(TOKEN_KEYS.USER);
    if (raw) return JSON.parse(raw);
  } catch {
    // Corrupted session data - treat as logged out
  }
  return null;
};

export const setTokens = (accessToken, refreshToken, user = null) => {
  if (accessToken) {
    localStorage.setItem(TOKEN_KEYS.ACCESS, accessToken);
    localStorage.setItem(TOKEN_KEYS.LEGACY_TOKEN, accessToken);
  }
  if (refreshToken) {
    localStorage.setItem(TOKEN_KEYS.REFRESH, refreshToken);
  }
  if (user) {
    localStorage.setItem(TOKEN_KEYS.USER, JSON.stringify(user));
  }
};

export const clearTokens = () => {
  localStorage.removeItem(TOKEN_KEYS.ACCESS);
  localStorage.removeItem(TOKEN_KEYS.REFRESH);
  localStorage.removeItem(TOKEN_KEYS.USER);
  localStorage.removeItem(TOKEN_KEYS.LEGACY_TOKEN);
};

// Create an Axios instance configured for the C# Web API backend
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Attach JWT Bearer token
api.interceptors.request.use(
  (config) => {
    const token = getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Automatic Silent Token Refresh with Refresh Token Rotation (RTR)
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
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
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Check if error is 401 Unauthorized and not already retried
    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      // Don't retry refresh or login verification requests
      const isAuthEndpoint =
        originalRequest.url?.includes('/auth/token/refresh') ||
        originalRequest.url?.includes('/auth/login') ||
        originalRequest.url?.includes('/auth/otp/verify') ||
        originalRequest.url?.includes('/auth/otp/send');

      if (isAuthEndpoint) {
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const currentRefreshToken = getRefreshToken();
        // Direct call using axios to avoid circular interceptor handling
        const refreshResponse = await axios.post(`${API_BASE_URL}/auth/token/refresh`, {
          refreshToken: currentRefreshToken,
        });

        const { accessToken, refreshToken, user } = refreshResponse.data;

        setTokens(accessToken, refreshToken, user);
        processQueue(null, accessToken);

        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh failed: end the session and send the user back to login
        processQueue(refreshError, null);
        clearTokens();
        window.dispatchEvent(new Event('auth:unauthorized'));
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

// High-level Authentication Service Methods
export const authApi = {
  login: async (identifier, password, deviceInfo = 'SolarMicrogrid Web Dashboard') => {
    const response = await api.post('/auth/login', { identifier, password, deviceInfo });
    return response.data;
  },

  register: async ({ email, username, password, fullName, nic, role, otp, deviceInfo = 'SolarMicrogrid Web Dashboard' }) => {
    const response = await api.post('/auth/register', {
      email,
      username: username?.trim() || undefined,
      password,
      fullName: fullName?.trim() || undefined,
      nic: nic?.trim() || undefined,
      role: role || 'Consumer',
      otp: otp?.trim() || undefined,
      deviceInfo,
    });
    return response.data;
  },

  sendOtp: async (email, role = 'Consumer') => {
    const response = await api.post('/auth/otp/send', { email, role });
    return response.data;
  },

  sendLoginOtp: async (identifier) => {
    const response = await api.post('/auth/otp/send-login', { identifier });
    return response.data;
  },

  verifyOtp: async (identifierOrEmail, otp, deviceInfo = 'SolarMicrogrid Web Dashboard') => {
    const payload = {
      identifier: identifierOrEmail,
      email: identifierOrEmail.includes('@') ? identifierOrEmail : undefined,
      otp,
      deviceInfo,
    };
    const response = await api.post('/auth/otp/verify', payload);
    return response.data;
  },

  refreshToken: async (refreshToken) => {
    const response = await api.post('/auth/token/refresh', { refreshToken });
    return response.data;
  },

  logout: async (refreshToken) => {
    try {
      const response = await api.post('/auth/logout', { refreshToken });
      return response.data;
    } finally {
      clearTokens();
    }
  },

  getMe: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },

  getSessions: async () => {
    const response = await api.get('/auth/sessions');
    return response.data;
  },

  revokeSession: async (sessionId) => {
    const response = await api.delete(`/auth/sessions/${sessionId}`);
    return response.data;
  },

  // Admin Prosumer Approval & Grid Operations
  getProsumers: async (status = '') => {
    const query = status ? `?status=${encodeURIComponent(status)}` : '';
    const response = await api.get(`/admin/prosumers${query}`);
    return response.data;
  },

  getPendingProsumers: async () => {
    const response = await api.get('/admin/prosumers/pending');
    return response.data;
  },

  approveProsumer: async (id) => {
    const response = await api.put(`/admin/prosumers/${id}/approve`);
    return response.data;
  },

  rejectProsumer: async (id, reason = '') => {
    const response = await api.put(`/admin/prosumers/${id}/reject`, { reason });
    return response.data;
  },

  resetProsumerToPending: async (id) => {
    const response = await api.put(`/admin/prosumers/${id}/pending`);
    return response.data;
  },

  getAdminStats: async () => {
    const response = await api.get('/admin/stats');
    return response.data;
  },
};

export default api;
