import axios from 'axios';

const client = axios.create({
  baseURL: 'https://ai-health-insurance-manager-6rgw.vercel.app/api', // Points to your Node.js backend
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