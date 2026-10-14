import axios from 'axios';

export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
});

let authToken = null;

export const setAuthToken = (token) => {
  authToken = token;
};

api.interceptors.request.use((config) => {
  if (authToken) {
    config.headers.Authorization = `Bearer ${authToken}`;
  }
  return config;
});

export const getErrorMessage = (error, fallback = 'Something went wrong. Please try again.') =>
  error.response?.data?.message || error.message || fallback;

export const authApi = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  profile: () => api.get('/auth/profile'),
};

export const complaintApi = {
  list: () => api.get('/complaints'),
  stats: () => api.get('/complaints/stats'),
  create: (data) => api.post('/complaints', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  updateStatus: (id, status, resolutionNotes) => api.patch(`/complaints/${id}/status`, { status, resolutionNotes }),
  assign: (id, assignedTo) => api.patch(`/complaints/${id}/assign`, { assignedTo }),
  feedback: (id, rating, feedback) => api.post(`/complaints/${id}/feedback`, { rating, feedback }),
  addNote: (id, note) => api.post(`/complaints/${id}/notes`, { note }),
};

export const directoryApi = {
  departments: () => api.get('/departments'),
  blocks: (params) => api.get('/blocks', { params }),
  rooms: (params) => api.get('/rooms', { params }),
  programmes: (params) => api.get('/programmes', { params }),
  roles: () => api.get('/roles'),
  users: () => api.get('/users'),
};

const masterEndpoints = {
  departments: '/departments',
  programmes: '/programmes',
  blocks: '/blocks',
  rooms: '/rooms',
  roles: '/roles',
  users: '/users',
};

export const masterApi = {
  list: (resource) => api.get(masterEndpoints[resource]),
  create: (resource, data) => api.post(masterEndpoints[resource], data),
  update: (resource, id, data) => api.put(`${masterEndpoints[resource]}/${id}`, data),
  remove: (resource, id) => api.delete(`${masterEndpoints[resource]}/${id}`),
  report: (params) => api.get('/complaints/report', { params }),
};
