// src/api/axiosConfig.js
import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api',
    headers: {
        'Content-Type': 'application/json'
    }
});

// Request Interceptor: Injects the authorization payload
api.interceptors.request.use(config => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
}, error => {
    return Promise.reject(error);
});

// Response Interceptor: Handles unauthorized access globally
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            // Invalidate local session state
            localStorage.removeItem('token');
            // Force client-side redirection to the authentication interface
            window.location.href = '/login'; 
        }
        return Promise.reject(error);
    }
);

export default api;