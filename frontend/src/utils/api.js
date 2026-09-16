import axios from 'axios';

// In production (Vercel), REACT_APP_API_URL env var points to Render backend.
// In local dev, CRA proxy (package.json "proxy") handles /api → localhost:5000.
const baseURL = process.env.REACT_APP_API_URL
  ? `${process.env.REACT_APP_API_URL}/api`
  : '/api';

const API = axios.create({ baseURL, withCredentials: true, timeout: 15000 });

API.interceptors.response.use(
  res => res,
  err => {
    const msg = err.response?.data?.message || err.message || 'Something went wrong';
    return Promise.reject(new Error(msg));
  }
);

export const studentAPI = {
  getAll: (params) => API.get('/students', { params }),
  getOne: (id) => API.get(`/students/${id}`),
  create: (data) => API.post('/students', data),
  update: (id, data) => API.put(`/students/${id}`, data),
  delete: (id) => API.delete(`/students/${id}`),
  stats: () => API.get('/students/stats'),
};

export const companyAPI = {
  getAll: (params) => API.get('/companies', { params }),
  getOne: (id) => API.get(`/companies/${id}`),
  create: (data) => API.post('/companies', data),
  update: (id, data) => API.put(`/companies/${id}`, data),
  delete: (id) => API.delete(`/companies/${id}`),
  stats: () => API.get('/companies/stats'),
};

export const applicationAPI = {
  getAll: (params) => API.get('/applications', { params }),
  getOne: (id) => API.get(`/applications/${id}`),
  create: (data) => API.post('/applications', data),
  update: (id, data) => API.put(`/applications/${id}`, data),
  updateStatus: (id, data) => API.put(`/applications/${id}/status`, data),
  delete: (id) => API.delete(`/applications/${id}`),
  pipeline: () => API.get('/applications/pipeline'),
};

export const interviewAPI = {
  getAll: (params) => API.get('/interviews', { params }),
  getOne: (id) => API.get(`/interviews/${id}`),
  create: (data) => API.post('/interviews', data),
  update: (id, data) => API.put(`/interviews/${id}`, data),
  delete: (id) => API.delete(`/interviews/${id}`),
  stats: () => API.get('/interviews/stats'),
  upcoming: () => API.get('/interviews/upcoming'),
};

export const placementAPI = {
  getAll: (params) => API.get('/placements', { params }),
  getOne: (id) => API.get(`/placements/${id}`),
  create: (data) => API.post('/placements', data),
  update: (id, data) => API.put(`/placements/${id}`, data),
  delete: (id) => API.delete(`/placements/${id}`),
  stats: () => API.get('/placements/stats'),
};

export const dashboardAPI = {
  stats: () => API.get('/dashboard'),
  reports: () => API.get('/dashboard/reports'),
};

export const aiAPI = {
  chat: (data) => API.post('/ai/chat', data),
  search: (params) => API.get('/ai/search', { params }),
};

export default API;
