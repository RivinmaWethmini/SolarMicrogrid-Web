import axios from 'axios';

// Resolve backend API URL (Default to port 5298 for C# Web API)
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5298/api';

export const TOKEN_KEYS = {
  ACCESS: 'accessToken',
  REFRESH: 'refreshToken',
  USER: 'authUser',
  LEGACY_TOKEN: 'token', // Backwards compatibility for existing components
};

export const getAccessToken = () =>
  localStorage.getItem(TOKEN_KEYS.ACCESS) || localStorage.getItem(TOKEN_KEYS.LEGACY_TOKEN);

export const getRefreshToken = () =>
  localStorage.getItem(TOKEN_KEYS.REFRESH);

export const getStoredUser = () => {
  try {
    const raw = localStorage.getItem(TOKEN_KEYS.USER);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
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
        originalRequest.url?.includes('/auth/otp/verify') ||
        originalRequest.url?.includes('/auth/otp/send');

      if (isAuthEndpoint) {
        return Promise.reject(error);
      }

      const currentRefreshToken = getRefreshToken();
      if (!currentRefreshToken) {
        clearTokens();
        window.dispatchEvent(new Event('auth:unauthorized'));
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
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Return friendly error messages when server responds with bad request
    return Promise.reject(error);
  }
);

export default api;
