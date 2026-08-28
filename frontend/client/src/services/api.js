import axios from 'axios';

const API_BASE_URL = 'https://labourbhai.online/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Auth APIs
export const authAPI = {
  login: (mobile, password) => api.post('/auth/login', { mobile, password }),
  register: (userData) => api.post('/auth/register', userData),
  getProfile: () => api.get('/auth/me'),
};

// Site APIs
export const siteAPI = {
  getAll: () => api.get('/labour/sites/all'),
  create: (data) => api.post('/labour/sites/create', data),
  update: (id, data) => api.put(`/labour/sites/update/${id}`, data),
  delete: (id) => api.delete(`/labour/sites/delete/${id}`),
};

// Labour Category APIs
export const categoryAPI = {
  getAll: () => api.get('/labour/categories/all'),
};

// Labour APIs
export const labourAPI = {
  register: (data) => api.post('/labour/register', data),
  getAll: (filters) => api.get('/labour/list', { params: filters }),
  getById: (id) => api.get(`/labour/${id}`),
    getInactive: () => api.get('/labour/inactive'),
  getActiveCount: () => api.get('/labour/active-count'),
  toggleStatus: (id, status) => api.put(`/labour/toggle-status/${id}`, { is_active: status }),
};

export default api;