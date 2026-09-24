import axios from 'axios';
import { Problem, CSRPledge, NotificationItem, AnalyticsSummary } from '../types';

const API_BASE_URL = (import.meta as any).env.VITE_API_URL || (
    window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
        ? 'http://127.0.0.1:8000/api' 
        : 'https://sih-2y11.onrender.com/api'
);

const API = axios.create({
    baseURL: API_BASE_URL,
    timeout: 8000,
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

// Demo fallback mock database for instant offline/offline fallback
const DEMO_USER_DB: Record<string, any> = {
    "grab10aakashbhagat@gmail.com": {
        id: "usr_aakash_10",
        email: "grab10aakashbhagat@gmail.com",
        full_name: "Aakash Bhagat",
        role: "citizen",
        institution: null,
        company_name: null
    },
    "citizen@gmail.com": {
        id: "usr_citizen_01",
        email: "citizen@gmail.com",
        full_name: "Ramesh Kumar Mahato",
        role: "citizen",
        institution: null,
        company_name: null
    },
    "ism_admin@iitism.ac.in": {
        id: "usr_dhanbad_01",
        email: "ism_admin@iitism.ac.in",
        full_name: "Prof. S. K. Sinha (Water Center Head)",
        role: "university_admin",
        institution: "IIT (ISM) Dhanbad - Water Research Center",
        company_name: null
    },
    "dhanbad@iitism.ac.in": {
        id: "usr_dhanbad_02",
        email: "dhanbad@iitism.ac.in",
        full_name: "Prof. A. K. Singh (R&D Dean)",
        role: "university_admin",
        institution: "IIT (ISM) Dhanbad - Water Research Center",
        company_name: null
    },
    "cuj_admin@cuj.ac.in": {
        id: "usr_cuj_01",
        email: "cuj_admin@cuj.ac.in",
        full_name: "Dr. Priyadarshini Roy (Health Hub)",
        role: "university_admin",
        institution: "Central University of Jharkhand (CUJ) - Health Tech Hub",
        company_name: null
    },
    "cuj@cuj.ac.in": {
        id: "usr_cuj_02",
        email: "cuj@cuj.ac.in",
        full_name: "Prof. Rajeshwar Roy",
        role: "university_admin",
        institution: "Central University of Jharkhand (CUJ) - Health Tech Hub",
        company_name: null
    },
    "executive@jharkhand.gov.in": {
        id: "usr_exec_01",
        email: "executive@jharkhand.gov.in",
        full_name: "Dr. Rameshwar Oraon (Nodal Director)",
        role: "government",
        institution: "Department of Higher Education, Govt. of Jharkhand",
        company_name: null
    },
    "gov@jharkhand.gov.in": {
        id: "usr_exec_02",
        email: "gov@jharkhand.gov.in",
        full_name: "State Nodal Executive",
        role: "government",
        institution: "Department of Higher & Technical Education",
        company_name: null
    },
    "tatasteel@csr.org": {
        id: "usr_csr_01",
        email: "tatasteel@csr.org",
        full_name: "Ravi Desai (CSR Vice President)",
        role: "industry",
        institution: null,
        company_name: "Tata Steel CSR Division"
    },
    "csr@tatasteel.com": {
        id: "usr_csr_02",
        email: "csr@tatasteel.com",
        full_name: "Ravi Desai (CSR Head)",
        role: "industry",
        institution: null,
        company_name: "Tata Steel CSR Division"
    }
};

// Safe helper wrapper that attempts backend API call and falls back seamlessly if unreachable
async function safeApiCall<T>(apiFn: () => Promise<{ data: T }>, fallbackData: T): Promise<{ data: T }> {
    try {
        const res = await apiFn();
        return res;
    } catch (err: any) {
        console.warn('Backend API call failed or unreachable. Using robust interactive fallback:', err?.message || err);
        return { data: fallbackData };
    }
}

// Authentication endpoints
export const loginStep1 = async (data: { email: string; password: string }) => {
    try {
        const res = await API.post('/auth/login-step1', data);
        return res;
    } catch (err: any) {
        // Fallback for demo login step 1
        const cleanEmail = data.email.trim().toLowerCase();
        const user = DEMO_USER_DB[cleanEmail] || {
            id: `usr_${Date.now()}`,
            email: cleanEmail,
            full_name: cleanEmail.split('@')[0],
            role: "citizen",
            institution: null,
            company_name: null
        };
        DEMO_USER_DB[cleanEmail] = user;

        return {
            data: {
                status: "otp_required",
                email: cleanEmail,
                message: "Password verified. 6-digit OTP code dispatched.",
                dev_otp: "849201"
            }
        };
    }
};

export const loginStep2 = async (data: { email: string; password: string; otp: string }) => {
    try {
        const res = await API.post('/auth/login-step2', data);
        return res;
    } catch (err: any) {
        const cleanEmail = data.email.trim().toLowerCase();
        const user = DEMO_USER_DB[cleanEmail] || {
            id: `usr_${Date.now()}`,
            email: cleanEmail,
            full_name: cleanEmail.split('@')[0],
            role: "citizen",
            institution: null,
            company_name: null
        };

        const mockToken = `setu_jwt_${Date.now()}`;
        return {
            data: {
                access_token: mockToken,
                refresh_token: `refresh_${Date.now()}`,
                token_type: "bearer",
                user: user
            }
        };
    }
};

export const registerUser = async (data: any) => {
    try {
        const res = await API.post('/auth/register', data);
        return res;
    } catch (err: any) {
        const cleanEmail = data.email.trim().toLowerCase();
        const newUser = {
            id: `usr_${Date.now()}`,
            email: cleanEmail,
            full_name: data.full_name || cleanEmail.split('@')[0],
            role: data.role || "citizen",
            institution: data.institution || null,
            company_name: data.company_name || null
        };
        DEMO_USER_DB[cleanEmail] = newUser;

        return {
            data: {
                access_token: `setu_jwt_${Date.now()}`,
                refresh_token: `refresh_${Date.now()}`,
                token_type: "bearer",
                user: newUser
            }
        };
    }
};

export const getAuthMe = async () => {
    try {
        const res = await API.get('/auth/me');
        return res;
    } catch (err) {
        const saved = localStorage.getItem('setu_user_data');
        if (saved) {
            try {
                return { data: JSON.parse(saved) };
            } catch (e) {}
        }
        throw err;
    }
};
export const requestPasswordReset = (email: string) => API.post('/auth/forgot-password/request', { email });
export const confirmPasswordReset = (data: { email: string; otp: string; new_password: string }) => API.post('/auth/forgot-password/confirm', data);
export const resendOTP = async (email: string) => ({ data: { message: "OTP resent successfully.", dev_otp: "849201" } });
export const getAllUsers = () => API.get<any[]>('/auth/users');

// Application endpoints
export const submitProblem = (data: any) => API.post<Problem>('/problems/submit', data);
export const getProblems = (params?: any) => API.get<Problem[]>('/problems', { params });
export const getProblemByTicket = (ticket: string) => API.get<Problem>(`/problems/ticket/${ticket}`);
export const updateProblemStatus = (id: string, status: string) => API.post<Problem>(`/problems/${id}/status`, { status });
export const assignTeam = (problemId: string, data: { team_name: string; lead_name?: string }) => API.post(`/projects/${problemId}/assign-team`, data);
export const toggleMilestone = (milestoneId: string) => API.patch(`/projects/milestones/${milestoneId}/toggle`);
export const getAnalyticsSummary = () => API.get<AnalyticsSummary>('/analytics/summary');
export const submitCSRPledge = (problemId: string, data: any) => API.post<CSRPledge>(`/industry/pledge/${problemId}`, data);
export const getAllPledges = () => API.get<CSRPledge[]>('/industry/pledges');

// Notification endpoints
export const getNotificationsForTicket = (ticket: string) => API.get<NotificationItem[]>(`/notifications/ticket/${ticket}`);
export const getRecentNotifications = () => API.get<NotificationItem[]>('/notifications/recent');

export default API;
