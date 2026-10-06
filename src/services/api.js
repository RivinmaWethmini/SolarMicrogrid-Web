import axios from 'axios';

// Central API Client Configuration for Solar Microgrid
// Resolves backend API URL (Default: port 5298 for C# .NET Web API)
const API_BASE_URL = import.meta.env.VITE_API_URL || 
  (typeof window !== 'undefined' && window.location.hostname && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1'
    ? `http://${window.location.hostname}:5298/api`
    : 'http://localhost:5298/api');

// Storage keys used for persisting tokens and user metadata in browser localStorage
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

// Retrieve short-lived JWT Access Token (15-minute validity)
export const getAccessToken = () =>
  localStorage.getItem(TOKEN_KEYS.ACCESS) || localStorage.getItem(TOKEN_KEYS.LEGACY_TOKEN) || null;

// Retrieve long-lived Refresh Token (7-day validity stored in MongoDB)
export const getRefreshToken = () =>
  localStorage.getItem(TOKEN_KEYS.REFRESH) || null;

// Retrieve cached user profile from localStorage safely
export const getStoredUser = () => {
  try {
    const raw = localStorage.getItem(TOKEN_KEYS.USER);
    if (raw) return JSON.parse(raw);
  } catch {
    // Ignore invalid JSON in localStorage / treat corrupted session as logged out
  }
  return null;
};

// Persist tokens and user profile to localStorage after successful authentication
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

// Purge all tokens and cached user data from browser on logout or session expiration
export const clearTokens = () => {
  localStorage.removeItem(TOKEN_KEYS.ACCESS);
  localStorage.removeItem(TOKEN_KEYS.REFRESH);
  localStorage.removeItem(TOKEN_KEYS.USER);
  localStorage.removeItem(TOKEN_KEYS.LEGACY_TOKEN);
};

// Create configured Axios instance for central backend communication
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Automatically attaches the Bearer JWT token to outgoing HTTP requests
api.interceptors.request.use(
  (config) => {
    // Read the current access token from localStorage
    const token = getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Handles Silent Token Refresh with Refresh Token Rotation (RTR)
// If an access token expires (HTTP 401), this interceptor silently refreshes it behind the scenes
let isRefreshing = false;
let failedQueue = [];

// Resolves or rejects queued requests waiting for a fresh access token
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
      // Do not attempt refresh on authentication endpoints (login, register, otp)
      const isAuthEndpoint =
        originalRequest.url?.includes('/auth/token/refresh') ||
        originalRequest.url?.includes('/auth/login') ||
        originalRequest.url?.includes('/auth/otp/verify') ||
        originalRequest.url?.includes('/auth/otp/send');

      if (isAuthEndpoint) {
        return Promise.reject(error);
      }

      // If another request is already refreshing the token, queue this request
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

      // Mark request as retried and acquire refreshing lock
      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const currentRefreshToken = getRefreshToken();
        // Direct call using axios to avoid circular interceptor handling
        const refreshResponse = await axios.post(`${API_BASE_URL}/auth/token/refresh`, {
          refreshToken: currentRefreshToken,
        });

        const { accessToken, refreshToken, user } = refreshResponse.data;

        // Save fresh tokens to browser storage
        setTokens(accessToken, refreshToken, user);
        processQueue(null, accessToken);

        // Replay the original failed request with the fresh token
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh token failed or was revoked: broadcast unauthorized event and clear storage
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

// High-Level Authentication API Client Methods
export const authApi = {
  // 1. Password-based authentication endpoint
  login: async (identifier, password, deviceInfo = 'SolarMicrogrid Web Dashboard') => {
    const response = await api.post('/auth/login', { identifier, password, deviceInfo });
    return response.data;
  },

  // 2. User registration endpoint
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

  // 3. Request 6-digit OTP delivery for registration
  sendOtp: async (email, role = 'Consumer') => {
    const response = await api.post('/auth/otp/send', { email, role });
    return response.data;
  },

  // 4. Request 6-digit OTP delivery for passwordless login
  sendLoginOtp: async (identifier) => {
    const response = await api.post('/auth/otp/send-login', { identifier });
    return response.data;
  },

  // 5. Submit 6-digit OTP code to complete authentication
  verifyOtp: async (identifierOrEmail, otp, deviceInfo = 'SolarMicrogrid Web Dashboard') => {
    const payload = {
      identifier: identifierOrEmail,
      email: identifierOrEmail,
      otp: otp.trim(),
      deviceInfo,
    };
    const response = await api.post('/auth/otp/verify', payload);
    return response.data;
  },

  // 6. Manual or programmatic token refresh
  refreshToken: async (refreshToken) => {
    const response = await axios.post(`${API_BASE_URL}/auth/token/refresh`, { refreshToken });
    return response.data;
  },

  // 7. Revoke server session and clear local tokens
  logout: async (refreshToken) => {
    try {
      const response = await api.post('/auth/logout', { refreshToken });
      return response.data;
    } finally {
      clearTokens();
    }
  },

  // 8. Fetch current authenticated profile and permission claims
  getMe: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },

  // 9. Query active connected devices / sessions from MongoDB
  getSessions: async () => {
    const response = await api.get('/auth/sessions');
    return response.data;
  },

  // 10. Remotely terminate a specific session / lost device
  revokeSession: async (sessionId) => {
    const response = await api.delete(`/auth/sessions/${sessionId}`);
    return response.data;
  },

  // 11. Self-service profile updates (FullName, Username, Password change)
  updateProfile: async ({ fullName, username, currentPassword, newPassword }) => {
    const response = await api.put('/auth/profile', {
      fullName: fullName?.trim() || undefined,
      username: username?.trim() || undefined,
      currentPassword: currentPassword || undefined,
      newPassword: newPassword || undefined,
    });
    return response.data;
  },

  // 12. Self-service account termination
  deleteAccount: async () => {
    const response = await api.delete('/auth/account');
    return response.data;
  },

  // Admin Prosumer Approval & Grid Operations
  getProsumers: async (status = '') => {
    const query = status ? `?status=${encodeURIComponent(status)}` : '';
    const response = await api.get(`/admin/prosumers${query}`);
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

  // Permanent cascade user deletion across AuthUsers, UserSessions, Prosumers, and OtpVerifications
  deleteUser: async (id) => {
    const response = await api.delete(`/admin/users/${id}`);
    return response.data;
  },

  getAdminStats: async () => {
    const response = await api.get('/admin/stats');
    return response.data;
  },
};

export default api;
