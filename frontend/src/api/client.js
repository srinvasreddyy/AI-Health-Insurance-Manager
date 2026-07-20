import axios from 'axios';

// Get the backend URL from environment or construct it dynamically
const getBackendURL = () => {
  // For development
  if (import.meta.env.DEV) {
    return 'http://localhost:5000/api';
  }
  
  // For production - use relative path (same origin)
  // This eliminates CORS issues entirely
  return '/api';
};

const client = axios.create({
  baseURL: getBackendURL(),
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to include the auth token
client.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['x-auth-token'] = token;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default client;
