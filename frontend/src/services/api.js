import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';

const API = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json'
    }
});

// Automatically attach Bearer token to requests
API.interceptors.request.use((config) => {
    const token = localStorage.getItem('setu_jwt_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
}, (error) => {
    return Promise.reject(error);
});

// Global Response Interceptor: Handle 401 Unauthorized token expiry gracefully
API.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;
        
        if (error.response && error.response.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;
            const refreshToken = localStorage.getItem('setu_refresh_token');

            if (refreshToken && !originalRequest.url.includes('/auth/refresh')) {
                try {
                    const res = await axios.post(`${API_BASE_URL}/auth/refresh`, { refresh_token: refreshToken });
                    if (res.data && res.data.access_token) {
                        localStorage.setItem('setu_jwt_token', res.data.access_token);
                        if (res.data.refresh_token) {
                            localStorage.setItem('setu_refresh_token', res.data.refresh_token);
                        }
                        originalRequest.headers.Authorization = `Bearer ${res.data.access_token}`;
                        return API(originalRequest);
                    }
                } catch (refreshErr) {
                    console.warn('Session refresh expired. Clearing authentication state.');
                }
            }

            // Clear credentials and dispatch logout notification if refresh fails or token expired
            localStorage.removeItem('setu_jwt_token');
            localStorage.removeItem('setu_refresh_token');
            localStorage.removeItem('setu_user_data');
            window.dispatchEvent(new CustomEvent('auth:expired'));
        }
        return Promise.reject(error);
    }
);

// Authentication endpoints
export const loginStep1 = (data) => API.post('/auth/login-step1', data);
export const loginStep2 = (data) => API.post('/auth/login-step2', data);
export const refreshSession = (refreshToken) => API.post('/auth/refresh', { refresh_token: refreshToken });
export const requestPasswordReset = (email) => API.post('/auth/forgot-password/request', { email });
export const confirmPasswordReset = (data) => API.post('/auth/forgot-password/confirm', data);
export const resendOTP = (email) => API.post('/auth/resend-otp', { email });
export const registerUser = (data) => API.post('/auth/register', data);
export const getAuthMe = () => API.get('/auth/me');

// Application endpoints
export const submitProblem = (data) => API.post('/problems/submit', data);
export const getProblems = (params) => API.get('/problems', { params });
export const getProblemByTicket = (ticket) => API.get(`/problems/ticket/${ticket}`);
export const updateProblemStatus = (id, status) => API.post(`/problems/${id}/status`, { status });
export const assignTeam = (problemId, data) => API.post(`/projects/${problemId}/assign-team`, data);
export const toggleMilestone = (milestoneId) => API.patch(`/projects/milestones/${milestoneId}/toggle`);
export const getAnalyticsSummary = () => API.get('/analytics/summary');
export const submitCSRPledge = (problemId, data) => API.post(`/industry/pledge/${problemId}`, data);
export const getAllPledges = () => API.get('/industry/pledges');

// Notification endpoints
export const getNotificationsForTicket = (ticket) => API.get(`/notifications/ticket/${ticket}`);
export const getRecentNotifications = () => API.get('/notifications/recent');

export default API;
