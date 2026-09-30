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
  update: (id, data) => api.put(`/labour/update/${id}`, data),
};

// Site Rate APIs
export const siteRateAPI = {
  getByLabour: (labourId) => api.get(`/labour/site-rates/${labourId}`),
  save: (data) => api.post('/labour/site-rate', data),
};

// Payment APIs
export const paymentAPI = {
  getAllHistory: () => api.get('/payments/all-history'),
  getLabourHistory: (labourId) => api.get(`/payments/history/${labourId}`),
};

// Food Advance APIs
export const foodAdvanceAPI = {
  create: (data) => api.post('/food-advance/create', data),
  getAll: (filters) => api.get('/food-advance/list', { params: filters }),
  getTotal: (site_id, from_date, to_date) => 
    api.get('/food-advance/total', { params: { site_id, from_date, to_date } }),
  update: (id, data) => api.put(`/food-advance/update/${id}`, data),
  delete: (id) => api.delete(`/food-advance/delete/${id}`),
};

// Bill Management APIs
export const billAPI = {
  create: (data) => api.post('/bills/create', data),
  getAll: (filters) => api.get('/bills/list', { params: filters }),
  getById: (id) => api.get(`/bills/${id}`),
  calculateDeduction: (site_id, period_start, period_end) =>
    api.get('/bills/calculate-deduction', { params: { site_id, period_start, period_end } }),
  addPayment: (id, data) => api.post(`/bills/${id}/payment`, data),
  delete: (id) => api.delete(`/bills/${id}`),
  getSiteSummary: (month) => api.get('/bills/summary/site-wise', { params: { month } }),
getAgingReport: () => api.get('/bills/summary/aging'),
};

export default api;