import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:4000',
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authAPI = {
  register: (data: { username: string; email: string; password: string }) =>
    api.post('/auth/register', data),
  
  login: (data: { username: string; password: string }) =>
    api.post('/auth/login', data),
  
  getProfile: () => api.get('/auth/profile'),
};

export const dockerAPI = {
  createContainer: () => api.post('/docker/container/create'),
  stopContainer: (id: string) => api.post(`/docker/container/${id}/stop`),
  removeContainer: (id: string) => api.delete(`/docker/container/${id}`),
};

export const labAPI = {
  getAll: () => api.get('/labs'),
  getOne: (id: string) => api.get(`/labs/${id}`),
  create: (data: any) => api.post('/labs', data),
};

export default api;
