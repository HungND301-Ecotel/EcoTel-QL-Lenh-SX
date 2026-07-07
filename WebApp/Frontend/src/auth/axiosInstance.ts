import axios from 'axios';
import { tokenService } from './tokenService';

// Create Axios instance
const axiosInstance = axios.create();

// Request interceptor: ALWAYS use tokenService for cross-type compatibility
axiosInstance.interceptors.request.use((config) => {
  const token = tokenService.getAppToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor: handle 401 and clear tokens
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      tokenService.clear(); // Clear both local and portal tokens
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;