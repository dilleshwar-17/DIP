import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'https://dip-5hlo.onrender.com/api';

const api = axios.create({
  baseURL: API_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
};

export const taskAPI = {
  getTasks: (date) => api.get(`/tasks${date ? `?date=${date}` : ''}`),
  getAnalytics: () => api.get('/tasks/analytics'),
  createTask: (data) => api.post('/tasks', data),
  updateTask: (id, data) => api.put(`/tasks/${id}`, data),
  deleteTask: (id) => api.delete(`/tasks/${id}`),
};

export const aiAPI = {
  suggestSubTasks: (title, category) => api.post('/ai/suggest-subtasks', { title, category }),
  getInsights: (stats) => api.post('/ai/insights', { stats }),
  parseTask: (text) => api.post('/ai/parse-task', { text }),
};


export default api;
