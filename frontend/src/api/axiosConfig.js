import axios from 'axios';

/**
 * Medicare ERP - Central API Configuration
 * Now optimized for HttpOnly Cookie Security.
 */
const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'https://medicare-backend-u7r1.onrender.com/api',
    headers: {
        'Content-Type': 'application/json'
    },
    // 🚨 CRITICAL: This tells Axios to ALWAYS send cookies with requests 🚨
    withCredentials: true 
});

// --- RESPONSE INTERCEPTOR ---
api.interceptors.response.use(
    (response) => response,
    (error) => {
        // Capture the exact URL that triggered this error
        const originalRequestUrl = error.config?.url || '';

        if (error.response && error.response.status === 401) {
            
            // 🚨 EXCEPTION LOGIC: Only force a logout/redirect if the user is NOT on the login route.
            if (!originalRequestUrl.includes('/auth/login')) {
                console.warn("Medicare Session Expired or Invalid Cookie.");
                
                // Clear the non-sensitive UI state
                sessionStorage.removeItem('userRole');
                sessionStorage.removeItem('userName');
                sessionStorage.removeItem('userId'); 
                
                // Boot them back to the login screen
                window.location.href = '/login'; 
            }
            // If the URL *does* include '/auth/login', the interceptor does nothing and 
            // allows the Login component's try/catch block to handle the UI error message.
        }
        
        if (error.response && error.response.status === 403) {
            alert("Access Denied: You do not have the required clinical or administrative clearances.");
        }

        return Promise.reject(error);
    }
);

export default api;