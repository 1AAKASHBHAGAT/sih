import React, { useState, useEffect, FormEvent } from 'react';
import { 
  ShieldCheck, 
  Lock, 
  Mail, 
  Key, 
  Eye, 
  EyeOff, 
  MessageSquareCode, 
  AlertTriangle,
  ArrowLeft,
  RefreshCw
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: string;
  targetRole?: UserRole | string | null;
}

const validateIdentifier = (input: string) => {
  const str = input.trim();
  if (!str) {
    return { valid: false, message: 'Please enter your email address or mobile phone number.' };
  }

  if (/^\d+$/.test(str)) {
    if (!/^[6-9]\d{9}$/.test(str)) {
      return { valid: false, message: 'Please enter a valid 10-digit mobile phone number (e.g. 9876543210).' };
    }
    return { valid: true };
  }

  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(str)) {
    if (str.includes('@') && !str.substring(str.indexOf('@')).includes('.')) {
      return { valid: false, message: `Invalid email address "${str}". Missing domain extension (e.g. did you mean ${str}.com?)` };
    }
    return { valid: false, message: 'Please enter a valid email address (e.g. user@gmail.com or user@domain.org).' };
  }

  const domain = str.split('@')[1]?.toLowerCase();
  const typoMap: Record<string, string> = {
    'gmai.com': 'gmail.com',
    'gamil.com': 'gmail.com',
    'gmailcom': 'gmail.com',
    'gmial.com': 'gmail.com',
    'gmaill.com': 'gmail.com',
    'yaho.com': 'yahoo.com',
    'hotmial.com': 'hotmail.com'
  };

  if (domain && typoMap[domain]) {
    return { 
      valid: false, 
      message: `Possible email typo detected: "@${domain}". Did you mean "@${typoMap[domain]}"?` 
    };
  }

  return { valid: true };
};

function LoginModal({ isOpen, onClose, defaultTab = 'login', targetRole = null }: LoginModalProps) {
  const { 
    loginStep1, 
    loginStep2, 
    forgotPasswordRequest, 
    forgotPasswordConfirm, 
    resendOTP, 
    register 
  } = useAuth();
  
  const [tab, setTab] = useState<string>(defaultTab);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showNewPassword, setShowNewPassword] = useState<boolean>(false);

  const [step, setStep] = useState<string>('credentials');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [otpCode, setOtpCode] = useState<string>('');
  const [dispatchedOTP, setDispatchedOTP] = useState<string | null>(null);

  const [resetEmail, setResetEmail] = useState<string>('');
  const [resetOtp, setResetOtp] = useState<string>('');
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');

  const [cooldown, setCooldown] = useState<number>(0);
  const [, setFailedAttempts] = useState<number>(0);

  const [regForm, setRegForm] = useState({
    email: '',
    password: '',
    full_name: '',
    role: 'citizen',
    institution: '',
    company_name: ''
  });

  useEffect(() => {
    let timer: any;
    if (cooldown > 0) {
      timer = setInterval(() => setCooldown(prev => prev - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [cooldown]);

  if (!isOpen) return null;

  const maskIdentifier = (str: string) => {
    if (!str) return '';
    if (str.includes('@')) {
      const [name, domain] = str.split('@');
      if (name.length <= 2) return `${name}***@${domain}`;
      return `${name[0]}***${name[name.length - 1]}@${domain}`;
    }
    if (str.length >= 10) {
      return `${str.substring(0, 3)}*****${str.substring(str.length - 2)}`;
    }
    return str;
  };

  const handleStep1Submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    const valResult = validateIdentifier(email);
    if (!valResult.valid) {
      setError(valResult.message || 'Invalid format');
      return;
    }

    if (!password) {
      setError('Please enter your account password.');
      return;
    }

    setLoading(true);

    try {
      const res = await loginStep1(email.trim(), password);
      setDispatchedOTP(res.dev_otp || null);
      setStep('otp');
      setCooldown(30);
      setFailedAttempts(0);
    } catch (err: any) {
      if (!err.response) {
        setError('Cannot connect to backend server (http://127.0.0.1:8000). Please verify the backend service is running.');
      } else {
        setError(err.response?.data?.detail || 'Incorrect email or password.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleStep2Submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!otpCode || otpCode.trim().length !== 6) {
      setError('Please enter the valid 6-digit security OTP code.');
      return;
    }

    setLoading(true);

    try {
      await loginStep2(email.trim(), password, otpCode.trim());
      onClose();
    } catch (err: any) {
      const errMsg = err.response?.data?.detail || 'Invalid OTP verification code.';
      setError(errMsg);
      setFailedAttempts(prev => prev + 1);

      if (errMsg.includes('Maximum failed') || errMsg.includes('restart sign in')) {
        setTimeout(() => {
          setStep('credentials');
          setOtpCode('');
        }, 3000);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForgotRequestSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    const targetEmail = resetEmail || email;
    const valResult = validateIdentifier(targetEmail);
    if (!valResult.valid) {
      setError(valResult.message || 'Invalid format');
      return;
    }

    setLoading(true);

    try {
      const res = await forgotPasswordRequest(targetEmail.trim());
      setDispatchedOTP(res.dev_otp || null);
      setEmail(targetEmail.trim());
      setStep('forgot_confirm');
      setCooldown(30);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'No account found matching this email address.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotConfirmSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (!resetOtp || resetOtp.trim().length !== 6) {
      setError('Please enter the 6-digit password reset code.');
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      setError('New password must be at least 6 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match. Please verify your new password.');
      return;
    }

    setLoading(true);

    try {
      await forgotPasswordConfirm(email.trim(), resetOtp.trim(), newPassword);
      setSuccessMessage('Password reset successfully! Logging you in...');
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Invalid password reset code.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (cooldown > 0) return;
    setError(null);
    setLoading(true);

    try {
      const res = await resendOTP(email.trim());
      setDispatchedOTP(res.dev_otp || null);
      setCooldown(30);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to resend OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!regForm.full_name.trim()) {
      setError('Please enter your full name.');
      return;
    }

    const valResult = validateIdentifier(regForm.email);
    if (!valResult.valid) {
      setError(valResult.message || 'Invalid format');
      return;
    }

    if (!regForm.password || regForm.password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);

    try {
      await register(regForm);
      onClose();
    } catch (err: any) {
      if (!err.response) {
        setError('Cannot connect to backend server (http://127.0.0.1:8000). Please verify the backend service is running.');
      } else {
        setError(err.response?.data?.detail || 'Registration failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl animate-fade-in">
      <div className="full-screen-card max-w-md w-full p-6 sm:p-8 border border-[#1e2d54] shadow-2xl relative bg-[#0e172e] space-y-6">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-[#1e2d54] pb-4">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Government of Jharkhand · Single Sign-On (SSO)
            </div>
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-blue-400" />
              {tab === 'login' 
                ? (step === 'otp' 
                    ? 'Step 2: Enter 6-Digit OTP' 
                    : (step === 'forgot_request' || step === 'forgot_confirm' ? 'Reset Account Password' : 'Sign In to Account'))
                : 'Create Official Account'
              }
            </h3>
          </div>
          <button
            onClick={onClose}
            className="btn-secondary py-1.5 px-3 text-xs font-bold shrink-0 text-slate-300 hover:text-white"
          >
            Close
          </button>
        </div>

        {targetRole && (
          <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-300 text-xs font-semibold">
            Authentication Required: Please sign in as <span className="text-white font-bold">{String(targetRole).toUpperCase()}</span> to access this workspace.
          </div>
        )}

        {/* Form Error Banner */}
        {error && (
          <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-semibold flex items-center gap-2.5">
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        {/* Form Success Banner */}
        {successMessage && (
          <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center gap-2.5">
            <MessageSquareCode className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Login / Register Toggle */}
        <div className="flex border-b border-[#1e2d54] text-xs font-bold">
          <button
            type="button"
            onClick={() => { setTab('login'); setStep('credentials'); setError(null); }}
            className={`pb-3 flex-1 text-center border-b-2 transition-all cursor-pointer ${
              tab === 'login' && (step === 'credentials' || step === 'otp')
                ? 'border-blue-500 text-white font-bold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Sign In (2-Factor)
          </button>
          <button
            type="button"
            onClick={() => { setTab('register'); setError(null); }}
            className={`pb-3 flex-1 text-center border-b-2 transition-all cursor-pointer ${
              tab === 'register'
                ? 'border-blue-500 text-white font-bold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Register Account
          </button>
        </div>

        {/* STEP 1: PASSWORD (FIRST FACTOR) */}
        {tab === 'login' && step === 'credentials' && (
          <form onSubmit={handleStep1Submit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Email Address or Phone Number
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  className="form-input text-xs sm:text-sm pl-10 bg-[#080d1a] border-[#2a3b63]/80"
                  placeholder="user@gmail.com or 9876543210"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setResetEmail(email);
                    setStep('forgot_request');
                    setError(null);
                  }}
                  className="text-xs text-blue-400 hover:text-blue-300 font-semibold cursor-pointer"
                >
                  Forgot Password?
                </button>
              </div>
              
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? "text" : "password"}
                  className="form-input text-xs sm:text-sm pl-10 pr-10 bg-[#080d1a] border-[#2a3b63]/80"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  title={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary py-3.5 text-sm font-bold justify-center bg-blue-600 hover:bg-blue-500 rounded-xl cursor-pointer shadow-lg"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin" /> Verifying Password...
                </span>
              ) : (
                'Sign In'
              )}
            </button>
          </form>
        )}

        {/* STEP 2: OTP (SECOND FACTOR) */}
        {tab === 'login' && step === 'otp' && (
          <form onSubmit={handleStep2Submit} className="space-y-4">
            
            {/* Masked Email Notice */}
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs space-y-2">
              <div className="font-bold flex items-center gap-2">
                <MessageSquareCode className="w-4 h-4 text-emerald-400" />
                <span>Step 2: Enter 6-Digit Security OTP</span>
              </div>
              <p className="text-slate-300 leading-relaxed">
                Password verified. Code sent to <span className="text-white font-mono font-bold">{maskIdentifier(email)}</span>.
              </p>
              
              {/* Dev/Hackathon Toast Notification */}
              {dispatchedOTP && (
                <div className="pt-2 text-xs font-mono text-amber-300 font-bold bg-[#080d1a] p-2.5 rounded-lg border border-amber-500/40 flex items-center justify-between">
                  <span>📱 DISPATCHED OTP:</span>
                  <span className="text-white font-extrabold text-base tracking-widest bg-amber-500/20 px-3 py-0.5 rounded border border-amber-500/30">
                    {dispatchedOTP}
                  </span>
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                6-Digit Security OTP Passcode
              </label>
              <div className="relative">
                <Key className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  maxLength={6}
                  className="form-input text-lg pl-10 font-mono tracking-widest bg-[#080d1a] border-blue-500/60 text-white font-extrabold"
                  placeholder="849201"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Resend Cooldown Link */}
            <div className="flex items-center justify-between text-xs pt-1">
              <button
                type="button"
                onClick={() => {
                  setStep('credentials');
                  setError(null);
                }}
                className="text-slate-400 hover:text-white flex items-center gap-1 font-medium"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Back to Password
              </button>

              <button
                type="button"
                disabled={cooldown > 0 || loading}
                onClick={handleResendOTP}
                className={`font-semibold transition-colors ${
                  cooldown > 0 
                    ? 'text-slate-500 cursor-not-allowed' 
                    : 'text-blue-400 hover:text-blue-300 cursor-pointer'
                }`}
              >
                {cooldown > 0 ? `Resend code in ${cooldown}s` : 'Resend OTP Code'}
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary py-3.5 text-sm font-bold justify-center bg-blue-600 hover:bg-blue-500 rounded-xl cursor-pointer shadow-lg mt-2"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin" /> Verifying OTP...
                </span>
              ) : (
                'Verify & Sign In'
              )}
            </button>

          </form>
        )}

        {/* FORGOT PASSWORD STEP 1: REQUEST CODE */}
        {tab === 'login' && step === 'forgot_request' && (
          <form onSubmit={handleForgotRequestSubmit} className="space-y-4">
            <div className="p-3.5 rounded-xl bg-blue-500/10 border border-blue-500/30 text-slate-300 text-xs leading-relaxed">
              Enter your registered email address or mobile phone number. We will dispatch a 6-digit password reset security code.
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Registered Email or Phone
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  className="form-input text-xs sm:text-sm pl-10 bg-[#080d1a] border-[#2a3b63]/80"
                  placeholder="user@gmail.com"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="flex items-center justify-between text-xs pt-1">
              <button
                type="button"
                onClick={() => {
                  setStep('credentials');
                  setError(null);
                }}
                className="text-slate-400 hover:text-white flex items-center gap-1 font-medium"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Back to Sign In
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary py-3.5 text-sm font-bold justify-center bg-blue-600 hover:bg-blue-500 rounded-xl cursor-pointer shadow-lg mt-2"
            >
              {loading ? 'Dispatching Code...' : 'Send Password Reset Code'}
            </button>
          </form>
        )}

        {/* FORGOT PASSWORD STEP 2: CONFIRM RESET */}
        {tab === 'login' && step === 'forgot_confirm' && (
          <form onSubmit={handleForgotConfirmSubmit} className="space-y-4">
            
            {/* Masked Email Notice */}
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs space-y-2">
              <div className="font-bold flex items-center gap-2">
                <MessageSquareCode className="w-4 h-4 text-emerald-400" />
                <span>Reset Code Dispatched</span>
              </div>
              <p className="text-slate-300 leading-relaxed">
                Reset passcode sent to <span className="text-white font-mono font-bold">{maskIdentifier(email)}</span>.
              </p>
              
              {/* Dev/Hackathon Toast Notification */}
              {dispatchedOTP && (
                <div className="pt-2 text-xs font-mono text-amber-300 font-bold bg-[#080d1a] p-2.5 rounded-lg border border-amber-500/40 flex items-center justify-between">
                  <span>📱 DISPATCHED RESET OTP:</span>
                  <span className="text-white font-extrabold text-base tracking-widest bg-amber-500/20 px-3 py-0.5 rounded border border-amber-500/30">
                    {dispatchedOTP}
                  </span>
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                6-Digit Reset Code
              </label>
              <div className="relative">
                <Key className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  maxLength={6}
                  className="form-input text-lg pl-10 font-mono tracking-widest bg-[#080d1a] border-blue-500/60 text-white font-extrabold"
                  placeholder="739102"
                  value={resetOtp}
                  onChange={(e) => setResetOtp(e.target.value)}
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                New Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showNewPassword ? "text" : "password"}
                  className="form-input text-xs sm:text-sm pl-10 pr-10 bg-[#080d1a] border-[#2a3b63]/80"
                  placeholder="Min 6 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Confirm New Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showNewPassword ? "text" : "password"}
                  className="form-input text-xs sm:text-sm pl-10 bg-[#080d1a] border-[#2a3b63]/80"
                  placeholder="Re-enter new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="flex items-center justify-between text-xs pt-1">
              <button
                type="button"
                onClick={() => {
                  setStep('credentials');
                  setError(null);
                }}
                className="text-slate-400 hover:text-white flex items-center gap-1 font-medium"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Back to Sign In
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary py-3.5 text-sm font-bold justify-center bg-blue-600 hover:bg-blue-500 rounded-xl cursor-pointer shadow-lg mt-2"
            >
              {loading ? 'Updating Password...' : 'Reset Password & Sign In'}
            </button>
          </form>
        )}

        {/* REGISTER FORM */}
        {tab === 'register' && (
          <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
                Full Name
              </label>
              <input
                type="text"
                className="form-input text-xs bg-[#080d1a] border-[#2a3b63]/80"
                placeholder="Ramesh Kumar Mahato"
                value={regForm.full_name}
                onChange={(e) => setRegForm({ ...regForm, full_name: e.target.value })}
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
                Email Address or Phone Number
              </label>
              <input
                type="text"
                className="form-input text-xs bg-[#080d1a] border-[#2a3b63]/80"
                placeholder="user@gmail.com"
                value={regForm.email}
                onChange={(e) => setRegForm({ ...regForm, email: e.target.value })}
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
                Password
              </label>
              <input
                type="password"
                className="form-input text-xs bg-[#080d1a] border-[#2a3b63]/80"
                placeholder="••••••••"
                value={regForm.password}
                onChange={(e) => setRegForm({ ...regForm, password: e.target.value })}
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
                Account Role
              </label>
              <select
                className="form-select text-xs bg-[#080d1a] border-[#2a3b63]/80"
                value={regForm.role}
                onChange={(e) => setRegForm({ ...regForm, role: e.target.value })}
              >
                <option value="citizen">Citizen (Grievance Reporting & Tracking)</option>
                <option value="industry">Industry CSR Partner (Project Sponsorship)</option>
                <option value="university_admin">University Admin (Faculty / R&D Lead)</option>
                <option value="government">Government Executive (Nodal Officer)</option>
              </select>
            </div>

            {regForm.role === 'university_admin' && (
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
                  Nodal Institution
                </label>
                <input
                  type="text"
                  className="form-input text-xs bg-[#080d1a] border-[#2a3b63]/80"
                  placeholder="IIT (ISM) Dhanbad - Water Research Center"
                  value={regForm.institution}
                  onChange={(e) => setRegForm({ ...regForm, institution: e.target.value })}
                  required
                />
              </div>
            )}

            {regForm.role === 'industry' && (
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
                  Company / Organization Name
                </label>
                <input
                  type="text"
                  className="form-input text-xs bg-[#080d1a] border-[#2a3b63]/80"
                  placeholder="Tata Steel CSR Division"
                  value={regForm.company_name}
                  onChange={(e) => setRegForm({ ...regForm, company_name: e.target.value })}
                  required
                />
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary py-3 text-xs font-bold justify-center bg-blue-600 hover:bg-blue-500 rounded-xl mt-2 cursor-pointer"
            >
              {loading ? 'Creating Account...' : 'Register Official Account'}
            </button>
          </form>
        )}

      </div>
    </div>
  );
}

export default LoginModal;
