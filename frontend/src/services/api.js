import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

// Create axios instance
const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor to add auth token
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
);

// Response interceptor to handle auth errors
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('token');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

// Auth API
export const authAPI = {
    login: (email, password) => api.post('/auth/login', { email, password }),
    logout: () => api.post('/auth/logout'),
    verifyToken: () => api.post('/auth/verify-token'),
    changePassword: (currentPassword, newPassword) =>
        api.post('/auth/change-password', { currentPassword, newPassword }),
    getMe: () => api.get('/auth/me'),
};

// Users API
export const usersAPI = {
    getUsers: (params) => api.get('/users', { params }),
    getUser: (id) => api.get(`/users/${id}`),
    createUser: (userData) => api.post('/users', userData),
    updateUser: (id, userData) => api.put(`/users/${id}`, userData),
    deleteUser: (id) => api.delete(`/users/${id}`),
    activateUser: (id) => api.put(`/users/${id}/activate`),
    getDepartments: () => api.get('/users/departments'),
};

// Attendance API
export const attendanceAPI = {
    checkIn: (notes) => api.post('/attendance/check-in', { notes }),
    checkOut: (notes) => api.post('/attendance/check-out', { notes }),
    getMyRecords: (params) => api.get('/attendance/my-records', { params }),
    getRecords: (params) => api.get('/attendance/records', { params }),
    getRecord: (id) => api.get(`/attendance/records/${id}`),
    updateRecord: (id, data) => api.put(`/attendance/records/${id}`, data),
    getTodayStatus: () => api.get('/attendance/today-status'),
};

// Tasks API
export const tasksAPI = {
    getTasks: (params) => api.get('/tasks', { params }),
    getTask: (id) => api.get(`/tasks/${id}`),
    createTask: (taskData) => api.post('/tasks', taskData),
    updateTask: (id, taskData) => api.put(`/tasks/${id}`, taskData),
    deleteTask: (id) => api.delete(`/tasks/${id}`),
    getTaskStats: () => api.get('/tasks/stats/overview'),
    getMyTasks: (params) => api.get('/tasks/my-tasks', { params }),
};

// Reports API
export const reportsAPI = {
    getAttendanceReport: (params) => api.get('/reports/attendance', { params }),
    getTaskReport: (params) => api.get('/reports/tasks', { params }),
    getDashboardStats: () => api.get('/reports/dashboard'),
    getEmployeeReport: (id, params) => api.get(`/reports/employee/${id}`, { params }),
};

export default api;