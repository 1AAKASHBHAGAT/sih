import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  loginStep1 as apiLoginStep1, 
  loginStep2 as apiLoginStep2, 
  requestPasswordReset as apiRequestPasswordReset,
  confirmPasswordReset as apiConfirmPasswordReset,
  resendOTP as apiResendOTP,
  registerUser as apiRegister, 
  getAuthMe 
} from '../services/api';
import { User, AuthContextType } from '../types';

const defaultAuthContext: AuthContextType = {
  user: null,
  token: null,
  loading: false,
  isAuthenticated: false,
  role: 'guest',
  institution: null,
  companyName: null,
  loginStep1: async () => ({}),
  loginStep2: async () => ({}),
  forgotPasswordRequest: async () => ({}),
  forgotPasswordConfirm: async () => ({}),
  resendOTP: async () => ({}),
  register: async () => ({} as User),
  logout: () => {}
};

const AuthContext = createContext<AuthContextType>(defaultAuthContext);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('setu_jwt_token') || null);
  const [loading, setLoading] = useState<boolean>(true);

  const logout = () => {
    localStorage.removeItem('setu_jwt_token');
    setToken(null);
    setUser(null);
  };

  const fetchProfile = async () => {
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      const res = await getAuthMe();
      setUser(res.data);
    } catch (err) {
      console.error('Session expired or invalid token:', err);
      logout();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [token]);

  const executeLoginStep1 = async (email: string, password: string) => {
    const res = await apiLoginStep1({ email, password });
    return res.data;
  };

  const executeLoginStep2 = async (email: string, password: string, otp: string) => {
    const res = await apiLoginStep2({ email, password, otp });
    const { access_token, user: userData } = res.data;
    localStorage.setItem('setu_jwt_token', access_token);
    setToken(access_token);
    setUser(userData);
    return userData;
  };

  const executeForgotPasswordRequest = async (email: string) => {
    const res = await apiRequestPasswordReset(email);
    return res.data;
  };

  const executeForgotPasswordConfirm = async (email: string, otp: string, newPassword: string) => {
    const res = await apiConfirmPasswordReset({ email, otp, new_password: newPassword });
    const { access_token, user: userData } = res.data;
    localStorage.setItem('setu_jwt_token', access_token);
    setToken(access_token);
    setUser(userData);
    return userData;
  };

  const executeResendOTP = async (email: string) => {
    const res = await apiResendOTP(email);
    return res.data;
  };

  const register = async (formData: any) => {
    const res = await apiRegister(formData);
    const { access_token, user: userData } = res.data;
    localStorage.setItem('setu_jwt_token', access_token);
    setToken(access_token);
    setUser(userData);
    return userData;
  };

  return (
    <AuthContext.Provider value={{
      user,
      token,
      loading,
      loginStep1: executeLoginStep1,
      loginStep2: executeLoginStep2,
      forgotPasswordRequest: executeForgotPasswordRequest,
      forgotPasswordConfirm: executeForgotPasswordConfirm,
      resendOTP: executeResendOTP,
      register,
      logout,
      isAuthenticated: !!user,
      role: user?.role || 'guest',
      institution: user?.institution || null,
      companyName: user?.company_name || null
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    return defaultAuthContext;
  }
  return context;
};
