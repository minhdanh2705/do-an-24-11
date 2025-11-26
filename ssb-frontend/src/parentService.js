import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  withCredentials: false,
  headers: { 'Content-Type': 'application/json' }
});

// ==========================
// AUTH SERVICE
// ==========================
export const authService = {
  login: (username, password) =>
    api.post('/auth/login', { username, password }),
};

// ==========================
// PARENT SERVICE
// ==========================
export const parentService = {
  getStudents: (parentId) =>
    api.get(`/parents/${parentId}/students`),
};

// ==========================
// ROUTE SERVICE (TUYẾN ĐƯỜNG)
// ==========================
export const routeService = {
  getAll: () => api.get('/routes'),
};

// ==========================
// STUDENT SERVICE
// ==========================
export const studentService = {
  getById: (id) => api.get(`/students/${id}`),
};

export default api;
