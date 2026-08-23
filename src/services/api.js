import axios from 'axios';

// Create an Axios instance configured for the C# Web API backend
const api = axios.create({
  baseURL: 'http://localhost:5000/api',
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

// Response Interceptor: Optional error handling (e.g., handling expired tokens / 401s)
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // You can handle global response errors here (like redirecting on 401 Unauthorized)
    return Promise.reject(error);
  }
);

export default api;
