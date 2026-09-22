import axios from 'axios';

// Resolve backend API URL (Default to port 5298 for C# Web API)
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5298/api';

// Create an Axios instance configured for the C# Web API backend
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Automatically attach JWT token to outgoing requests
api.interceptors.request.use(
  (config) => {
    // Retrieve the JWT token stored in localStorage (e.g., after user login)
    const token = localStorage.getItem('token');

    // If the token exists, add it to the Authorization header using the Bearer scheme
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    // Handle request errors
    return Promise.reject(error);
  }
);

// Response Interceptor: Global response error handling
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;
