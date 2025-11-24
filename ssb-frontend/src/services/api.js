import axios from 'axios'

const API_URL = '/api'

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Auth API
export const authService = {
  login: (tenDangNhap, matKhau) => api.post('/auth/login', { username: tenDangNhap, password: matKhau }),
  logout: () => api.post('/auth/logout'),
  checkSession: () => api.get('/auth/check'),
}

// Bus API
export const busService = {
  getAll: () => api.get('/buses'),
  getById: (id) => api.get(`/buses/${id}`),
  create: (data) => api.post('/buses', data),
  update: (id, data) => api.put(`/buses/${id}`, data),
  delete: (id) => api.delete(`/buses/${id}`),
}

// Student API
export const studentService = {
  getAll: () => api.get('/students'),
  getById: (id) => api.get(`/students/${id}`),
  getParents: (id) => api.get(`/students/${id}/parents`),
  create: (data) => api.post('/students', data),
  update: (id, data) => api.put(`/students/${id}`, data),
  delete: (id) => api.delete(`/students/${id}`),
}

// Route API
export const routeService = {
  getAll: () => api.get('/routes'),
  getById: (id) => api.get(`/routes/${id}`),
  create: (data) => api.post('/routes', data),
  update: (id, data) => api.put(`/routes/${id}`, data),
  delete: (id) => api.delete(`/routes/${id}`),
}

// Driver API
export const driverService = {
  getAll: () => api.get('/drivers'),
  getById: (id) => api.get(`/drivers/${id}`),
  create: (data) => api.post('/drivers', data),
  update: (id, data) => api.put(`/drivers/${id}`, data),
  delete: (id) => api.delete(`/drivers/${id}`),
}

// Parent API
export const parentService = {
  getAll: () => api.get('/parents'),
  getById: (id) => api.get(`/parents/${id}`),
  create: (data) => api.post('/parents', data),
  update: (id, data) => api.put(`/parents/${id}`, data),
  delete: (id) => api.delete(`/parents/${id}`),
  linkStudent: (parentId, studentId) => api.post(`/parents/${parentId}/students`, { studentId }),
  unlinkStudent: (parentId, studentId) => api.delete(`/parents/${parentId}/students/${studentId}`),
  getStudents: (parentId) => api.get(`/parents/${parentId}/students`),
}

// Schedule API
export const scheduleService = {
  getAll: () => api.get('/schedules'),
  getById: (id) => api.get(`/schedules/${id}`),
  create: (data) => api.post('/schedules', data),
  update: (id, data) => api.put(`/schedules/${id}`, data),
  delete: (id) => api.delete(`/schedules/${id}`),
}

// Stop API
export const stopService = {
  getAll: () => api.get('/stops'),
  getById: (id) => api.get(`/stops/${id}`),
  create: (data) => api.post('/stops', data),
  update: (id, data) => api.put(`/stops/${id}`, data),
  delete: (id) => api.delete(`/stops/${id}`),
}

export const attendanceService = {
  // Gọi API điểm danh xuống Backend
  mark: (data) => api.put('/attendance', data),
};

export default api