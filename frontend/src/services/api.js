import axios from 'axios';

// Create axios instance with default config
const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL,
    headers: {
        'Content-Type': 'application/json'
    },
});

api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
)

api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export const authAPI = {
    register: (userData) => api.post('/auth/register', userData),
    login: (credentials) => api.post('/auth/login', credentials),
    getMe: () => api.get('/auth/me'),
};

export const connectionsAPI = {
    getAll: () => api.get('/connections'),
    getOne: (id) => api.get(`/connections/${id}`),
    add: (connectionData) => api.post('/connections/add', connectionData),
    update: (id, data) => api.put(`/connections/${id}`, data),
    delete: (id) => api.delete(`/connections/${id}`),
};

export const queryAPI = {
  execute: (data) => api.post('/query/generate-sql', data),
  prepareSchema: (connectionId) => api.post('/query/prepare-schema', { connectionId }),
  executeRaw: (connectionId, sql) => api.post('/query/execute-sql', { connectionId, sql }),
};

export const historyAPI = {
  getAll: (params) => api.get('/history', { params }),
  getOne: (id) => api.get(`/history/${id}`),
  delete: (id) => api.delete(`/history/${id}`),
  clear: () => api.delete('/history'),
};

export default api;