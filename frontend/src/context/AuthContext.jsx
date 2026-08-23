import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  loginStep1 as apiLoginStep1, 
  loginStep2 as apiLoginStep2, 
  requestPasswordReset as apiRequestPasswordReset,
  confirmPasswordReset as apiConfirmPasswordReset,
  resendOTP as apiResendOTP,
  registerUser as apiRegister, 
  getAuthMe 
} from '../services/api';

const defaultAuthContext = {
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
  register: async () => ({}),
  logout: () => {}
};

const AuthContext = createContext(defaultAuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('setu_jwt_token') || null);
  const [loading, setLoading] = useState(true);

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

  const executeLoginStep1 = async (email, password) => {
    const res = await apiLoginStep1({ email, password });
    return res.data;
  };

  const executeLoginStep2 = async (email, password, otp) => {
    const res = await apiLoginStep2({ email, password, otp });
    const { access_token, user: userData } = res.data;
    localStorage.setItem('setu_jwt_token', access_token);
    setToken(access_token);
    setUser(userData);
    return userData;
  };

  const executeForgotPasswordRequest = async (email) => {
    const res = await apiRequestPasswordReset(email);
    return res.data;
  };

  const executeForgotPasswordConfirm = async (email, otp, newPassword) => {
    const res = await apiConfirmPasswordReset({ email, otp, new_password: newPassword });
    const { access_token, user: userData } = res.data;
    localStorage.setItem('setu_jwt_token', access_token);
    setToken(access_token);
    setUser(userData);
    return userData;
  };

  const executeResendOTP = async (email) => {
    const res = await apiResendOTP(email);
    return res.data;
  };

  const register = async (formData) => {
    const res = await apiRegister(formData);
    const { access_token, user: userData } = res.data;
    localStorage.setItem('setu_jwt_token', access_token);
    setToken(access_token);
    setUser(userData);
    return userData;
  };

  const logout = () => {
    localStorage.removeItem('setu_jwt_token');
    setToken(null);
    setUser(null);
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
