import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器
api.interceptors.request.use(
  (config) => {
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // 处理401错误
    if (error.response?.status === 401) {
      // 未授权，跳转到登录页（排除登录、注册和首页）
      if (typeof window !== 'undefined' && 
          !window.location.pathname.includes('/login') &&
          !window.location.pathname.includes('/register') &&
          window.location.pathname !== '/') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;

// ==================== Auth API ====================
export const authAPI = {
  register: (data: { username: string; displayName: string; password: string; qqNumber?: string }) =>
    api.post('/auth/register', data),
  
  login: (data: { username: string; password: string }) =>
    api.post('/auth/login', data),
  
  logout: () =>
    api.post('/auth/logout'),
  
  getProfile: () =>
    api.get('/auth/profile'),
  
  checkAuth: () =>
    api.get('/auth/check'),
};

// ==================== Course API ====================
export const courseAPI = {
  getAll: () =>
    api.get('/courses'),
  
  getOne: (id: string) =>
    api.get(`/courses/${id}`),
  
  enroll: (id: string) =>
    api.post(`/courses/${id}/enroll`),
  
  getProgress: (id: string) =>
    api.get(`/courses/${id}/progress`),
};

// ==================== Lab API ====================
export const labAPI = {
  getOne: (id: string) =>
    api.get(`/labs/${id}`),
  
  getByCourse: (courseId: string) =>
    api.get(`/labs/course/${courseId}`),
  
  submit: (id: string, code?: string) =>
    api.post(`/labs/${id}/submit`, { code }),
};

// ==================== Container API ====================
export const containerAPI = {
  create: (labId: string) =>
    api.post('/containers', { labId }),
  
  getAll: () =>
    api.get('/containers'),
  
  getOne: (id: string) =>
    api.get(`/containers/${id}`),
  
  start: (id: string) =>
    api.post(`/containers/${id}/start`),
  
  stop: (id: string) =>
    api.post(`/containers/${id}/stop`),
  
  remove: (id: string) =>
    api.delete(`/containers/${id}`),
  
  heartbeat: (id: string) =>
    api.post(`/containers/${id}/heartbeat`),
  
  exec: (id: string, command: string) =>
    api.post(`/containers/${id}/exec`, { command }),
};

// ==================== Snapshot API ====================
export const snapshotAPI = {
  create: (data: { containerId: string; name: string; description?: string }) =>
    api.post('/snapshots', data),
  
  getAll: () =>
    api.get('/snapshots'),
  
  getOne: (id: string) =>
    api.get(`/snapshots/${id}`),
  
  restore: (id: string) =>
    api.post(`/snapshots/${id}/restore`),
  
  remove: (id: string) =>
    api.delete(`/snapshots/${id}`),
};

// ==================== Admin API ====================
export const adminAPI = {
  getStats: () =>
    api.get('/admin/stats'),
  
  getAllUsers: () =>
    api.get('/admin/users'),
  
  createUser: (data: { username: string; displayName: string; password: string; role?: string; qqNumber?: string }) =>
    api.post('/admin/users', data),
  
  updateUser: (id: string, data: { username?: string; displayName?: string; password?: string; role?: string; qqNumber?: string }) =>
    api.put(`/admin/users/${id}`, data),
  
  deleteUser: (id: string) =>
    api.delete(`/admin/users/${id}`),
  
  getAllContainers: () =>
    api.get('/admin/containers'),
  
  forceStopContainer: (id: string) =>
    api.post(`/admin/containers/${id}/force-stop`),
  
  createCourse: (data: any) =>
    api.post('/admin/courses', data),
  
  updateCourse: (id: string, data: any) =>
    api.put(`/admin/courses/${id}`, data),
  
  deleteCourse: (id: string) =>
    api.delete(`/admin/courses/${id}`),
  
  createLab: (data: any) =>
    api.post('/admin/labs', data),
  
  updateLab: (id: string, data: any) =>
    api.put(`/admin/labs/${id}`, data),
  
  deleteLab: (id: string) =>
    api.delete(`/admin/labs/${id}`),
};
