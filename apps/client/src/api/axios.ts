import axios from 'axios';

const api = axios.create({
  baseURL: (window as any).ENV?.VITE_API_BASE_URL || import.meta.env.VITE_API_BASE_URL,
});

// Interceptor para añadir el token a todas las peticiones
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
