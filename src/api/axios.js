import axios from 'axios';

// La URL base se puede configurar con VITE_API_URL en .env
// Si no está definida, usa http://localhost:5000 como fallback
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' }
});

// ── Interceptor: adjunta el token JWT a cada request ──
api.interceptors.request.use(
  (config) => {
    const token = sessionStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Interceptor: redirige al login si el token expiró ──
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // No recargar si es el endpoint de login (las credenciales incorrectas dan 401)
    if (error.response?.status === 401 && !error.config.url?.includes('/login')) {
      sessionStorage.removeItem('access_token');
      sessionStorage.removeItem('user_data');
      window.location.reload();
    }
    return Promise.reject(error);
  }
);

export default api;