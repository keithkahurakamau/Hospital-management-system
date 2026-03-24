import axios from 'axios';

/**
 * Medicare ERP - Central API Configuration
 * Handles global request/response lifecycle and session security.
 */
const api = axios.create({
    // Logic: Use environment variable if available (Vite), otherwise default to local dev
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api',
    headers: {
        'Content-Type': 'application/json'
    }
});

// --- REQUEST INTERCEPTOR ---
// Automatically attaches JWT Bearer tokens to every outgoing clinical/admin request
api.interceptors.request.use(config => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
}, error => {
    return Promise.reject(error);
});

// --- RESPONSE INTERCEPTOR ---
// Monitors for session expiration or unauthorized access attempts
api.interceptors.response.use(
    (response) => response,
    (error) => {
        // Handle 401 Unauthorized (Session Expired/Invalid)
        if (error.response && error.response.status === 401) {
            console.warn("Medicare Session Expired. Clearing local state...");
            
            // Purge all Medicare-specific session data
            localStorage.removeItem('token');
            localStorage.removeItem('userRole');
            localStorage.removeItem('userName');
            
            // Force a hard redirect to the login portal
            window.location.href = '/login'; 
        }
        
        // Handle 403 Forbidden (RBAC violation - e.g., Secretary trying to view Lab)
        if (error.response && error.response.status === 403) {
            alert("Access Denied: You do not have the required clinical permissions.");
        }

        return Promise.reject(error);
    }
);

export default api;