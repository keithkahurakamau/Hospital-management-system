import axios from 'axios';

/**
 * Medicare ERP - Central API Configuration
 * Now optimized for HttpOnly Cookie Security.
 */
const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'https://medicare-backend-u7r1.onrender.com',
    headers: {
        'Content-Type': 'application/json'
    },
    // 🚨 CRITICAL: This tells Axios to ALWAYS send cookies with requests 🚨
    withCredentials: true 
});

// --- We DELETED the request interceptor! ---
// The browser will automatically attach the HttpOnly cookie to every request for us.
// We no longer need to pull it from sessionStorage.

// --- RESPONSE INTERCEPTOR ---
// Still needed to handle 401s and kick the user back to the login screen
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            console.warn("Medicare Session Expired.");
            
            // We still clear the non-sensitive UI data
            sessionStorage.removeItem('userRole');
            sessionStorage.removeItem('userName');
            sessionStorage.removeItem('userId'); 
            
            window.location.href = '/login'; 
        }
        
        if (error.response && error.response.status === 403) {
            alert("Access Denied: You do not have the required clearances.");
        }

        return Promise.reject(error);
    }
);

export default api;