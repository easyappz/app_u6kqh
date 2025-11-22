import api from './axios';

// Attach auth token from localStorage to every request if present
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = window.localStorage.getItem('authToken');
    if (token) {
      if (!config.headers) {
        config.headers = {};
      }
      config.headers.Authorization = `Token ${token}`;
    }
  }
  return config;
});

export default api;
