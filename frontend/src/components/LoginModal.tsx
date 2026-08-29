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
  RefreshCw,
  CheckCircle2
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
    return { valid: false, message: 'Please enter your email address or 10-digit mobile phone number.' };
  }

  if (/^\d+$/.test(str)) {
    if (!/^[6-9]\d{9}$/.test(str)) {
      return { valid: false, message: 'Please enter a valid 10-digit Indian mobile phone number (e.g. 9876543210).' };
    }
    return { valid: true };
  }

  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(str)) {
    if (str.includes('@') && !str.substring(str.indexOf('@')).includes('.')) {
      return { valid: false, message: `Invalid email "${str}". Missing extension (e.g. ${str}.com)` };
    }
    return { valid: false, message: 'Please enter a valid email address (e.g. user@gmail.com).' };
  }

  const domain = str.split('@')[1]?.toLowerCase();
  const typoMap: Record<string, string> = {
    'gmai.com': 'gmail.com',
    'gamil.com': 'gmail.com',
    'gmailcom': 'gmail.com',
    'gmial.com': 'gmail.com'
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
      setError(valResult.message || 'Invalid email or mobile format');
      return;
    }

    if (!password) {
      setError('Please enter your account password.');
      return;
    }

    setLoading(true);

    try {
      const res = await loginStep1(email.trim(), password);
      const generatedCode = res.dev_otp || res.otp || '123456';
      setDispatchedOTP(generatedCode);
      setOtpCode(generatedCode); // Auto-fill 6-digit OTP for instant 1-click verification!
      setStep('otp');
      setCooldown(30);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Sign in failed. Check email/password or network.');
    } finally {
      setLoading(false);
    }
  };

  const handleStep2Submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!otpCode || otpCode.trim().length !== 6) {
      setError('Please enter the 6-digit security OTP code.');
      return;
    }

    setLoading(true);

    try {
      await loginStep2(email.trim(), password, otpCode.trim());
      onClose();
    } catch (err: any) {
      const errMsg = err.response?.data?.detail || 'Invalid OTP code.';
      setError(errMsg);
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
      setError(valResult.message || 'Invalid input');
      return;
    }

    setLoading(true);

    try {
      const res = await forgotPasswordRequest(targetEmail.trim());
      const generatedCode = res.dev_otp || '123456';
      setDispatchedOTP(generatedCode);
      setResetOtp(generatedCode);
      setEmail(targetEmail.trim());
      setStep('forgot_confirm');
      setCooldown(30);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'No account found for this email/mobile.');
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
      setError('New password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
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
      setError(err.response?.data?.detail || 'Invalid reset code.');
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
      const generatedCode = res.dev_otp || '123456';
      setDispatchedOTP(generatedCode);
      setOtpCode(generatedCode);
      setCooldown(30);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to resend OTP.');
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
      setError(err.response?.data?.detail || 'Registration failed. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-fade-in">
      <div className="bg-white max-w-md w-full p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-2xl relative space-y-6">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Government of Jharkhand • Single Sign-On (SSO 2FA)
            </div>
            <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2 mt-0.5">
              <ShieldCheck className="w-5 h-5 text-blue-600" />
              {tab === 'login' 
                ? (step === 'otp' 
                    ? 'Step 2: Enter 6-Digit OTP' 
                    : (step === 'forgot_request' || step === 'forgot_confirm' ? 'Reset Account Password' : 'Sign In to Account'))
                : 'Create Official Account'
              }
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="btn-secondary py-1.5 px-3 text-xs font-bold shrink-0 text-slate-600 hover:text-slate-900 cursor-pointer"
          >
            Close
          </button>
        </div>

        {targetRole && (
          <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-blue-800 text-xs font-semibold">
            Authentication Required: Please sign in as <strong className="text-slate-900">{String(targetRole).toUpperCase()}</strong> to access this workspace.
          </div>
        )}

        {/* Error Banner */}
        {error && (
          <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2.5">
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        {/* Success Banner */}
        {successMessage && (
          <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Tabs */}
        <div className="flex border-b border-slate-200 text-xs font-bold">
          <button
            type="button"
            onClick={() => { setTab('login'); setStep('credentials'); setError(null); }}
            className={`pb-3 flex-1 text-center border-b-2 transition-all cursor-pointer ${
              tab === 'login' && (step === 'credentials' || step === 'otp')
                ? 'border-blue-600 text-blue-600 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Sign In (2-Factor OTP)
          </button>
          <button
            type="button"
            onClick={() => { setTab('register'); setError(null); }}
            className={`pb-3 flex-1 text-center border-b-2 transition-all cursor-pointer ${
              tab === 'register'
                ? 'border-blue-600 text-blue-600 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Register Account
          </button>
        </div>

        {/* STEP 1: CREDENTIALS */}
        {tab === 'login' && step === 'credentials' && (
          <form onSubmit={handleStep1Submit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                Email Address or 10-Digit Mobile Number
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  className="form-input form-input-with-icon text-xs sm:text-sm bg-slate-50 border-slate-200 text-slate-900 font-semibold"
                  placeholder="user@gmail.com or 9876543210"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-700">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setResetEmail(email);
                    setStep('forgot_request');
                    setError(null);
                  }}
                  className="text-xs text-blue-600 hover:text-blue-700 font-bold cursor-pointer"
                >
                  Forgot Password?
                </button>
              </div>
              
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? "text" : "password"}
                  className="form-input form-input-with-icon text-xs sm:text-sm pr-10 bg-slate-50 border-slate-200 text-slate-900"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary py-3.5 text-sm font-bold justify-center bg-blue-600 hover:bg-blue-700 rounded-xl cursor-pointer shadow-md"
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

        {/* STEP 2: OTP VERIFICATION */}
        {tab === 'login' && step === 'otp' && (
          <form onSubmit={handleStep2Submit} className="space-y-4">
            
            <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 text-blue-900 text-xs space-y-2">
              <div className="font-bold flex items-center gap-2 text-blue-900">
                <MessageSquareCode className="w-4 h-4 text-blue-600" />
                <span>Step 2: 6-Digit OTP Dispatched</span>
              </div>
              <p className="text-slate-700 leading-relaxed">
                Password verified. 6-digit security code sent to <strong className="text-slate-900 font-mono">{maskIdentifier(email)}</strong>.
              </p>
              
              {dispatchedOTP && (
                <div className="pt-2 text-xs font-mono text-emerald-800 font-bold bg-emerald-50 p-3 rounded-xl border border-emerald-200 flex items-center justify-between">
                  <span>📱 DISPATCHED OTP:</span>
                  <span className="text-emerald-900 font-extrabold text-base tracking-widest bg-white px-3 py-1 rounded-lg border border-emerald-300 shadow-sm">
                    {dispatchedOTP}
                  </span>
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                6-Digit Security OTP Code
              </label>
              <div className="relative">
                <Key className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  maxLength={6}
                  className="form-input form-input-with-icon text-lg font-mono tracking-widest bg-slate-50 border-blue-500 text-slate-900 font-extrabold"
                  placeholder="849201"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
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
                className="text-slate-500 hover:text-slate-900 flex items-center gap-1 font-semibold cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Back to Password
              </button>

              <button
                type="button"
                disabled={cooldown > 0 || loading}
                onClick={handleResendOTP}
                className={`font-bold ${
                  cooldown > 0 
                    ? 'text-slate-400 cursor-not-allowed' 
                    : 'text-blue-600 hover:text-blue-700 cursor-pointer'
                }`}
              >
                {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend OTP Code'}
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary py-3.5 text-sm font-bold justify-center bg-blue-600 hover:bg-blue-700 rounded-xl cursor-pointer shadow-md"
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

        {/* FORGOT PASSWORD REQUEST */}
        {tab === 'login' && step === 'forgot_request' && (
          <form onSubmit={handleForgotRequestSubmit} className="space-y-4">
            <div className="p-3.5 rounded-2xl bg-blue-50 border border-blue-200 text-slate-700 text-xs leading-relaxed">
              Enter your registered email or 10-digit mobile number. We will dispatch a 6-digit password reset security code.
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                Registered Email or Mobile Number
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  className="form-input form-input-with-icon text-xs sm:text-sm bg-slate-50 border-slate-200 text-slate-900"
                  placeholder="user@gmail.com or 9876543210"
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
                className="text-slate-500 hover:text-slate-900 flex items-center gap-1 font-semibold cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Back to Sign In
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary py-3.5 text-sm font-bold justify-center bg-blue-600 hover:bg-blue-700 rounded-xl cursor-pointer shadow-md"
            >
              {loading ? 'Dispatching Reset Code...' : 'Send Password Reset Code'}
            </button>
          </form>
        )}

        {/* FORGOT PASSWORD CONFIRM */}
        {tab === 'login' && step === 'forgot_confirm' && (
          <form onSubmit={handleForgotConfirmSubmit} className="space-y-4">
            
            <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 text-blue-900 text-xs space-y-2">
              <div className="font-bold flex items-center gap-2">
                <MessageSquareCode className="w-4 h-4 text-blue-600" />
                <span>Reset Code Dispatched</span>
              </div>
              <p className="text-slate-700 leading-relaxed">
                Reset passcode sent to <strong className="text-slate-900 font-mono">{maskIdentifier(email)}</strong>.
              </p>
              
              {dispatchedOTP && (
                <div className="pt-2 text-xs font-mono text-emerald-800 font-bold bg-emerald-50 p-3 rounded-xl border border-emerald-200 flex items-center justify-between">
                  <span>📱 RESET OTP:</span>
                  <span className="text-emerald-900 font-extrabold text-base tracking-widest bg-white px-3 py-1 rounded-lg border border-emerald-300 shadow-sm">
                    {dispatchedOTP}
                  </span>
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                6-Digit Reset Code
              </label>
              <div className="relative">
                <Key className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  maxLength={6}
                  className="form-input form-input-with-icon text-lg font-mono tracking-widest bg-slate-50 border-blue-500 text-slate-900 font-extrabold"
                  placeholder="739102"
                  value={resetOtp}
                  onChange={(e) => setResetOtp(e.target.value)}
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                New Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showNewPassword ? "text" : "password"}
                  className="form-input form-input-with-icon text-xs sm:text-sm pr-10 bg-slate-50 border-slate-200 text-slate-900"
                  placeholder="Min 6 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer"
                >
                  {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                Confirm New Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showNewPassword ? "text" : "password"}
                  className="form-input form-input-with-icon text-xs sm:text-sm bg-slate-50 border-slate-200 text-slate-900"
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
                className="text-slate-500 hover:text-slate-900 flex items-center gap-1 font-semibold cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Back to Sign In
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary py-3.5 text-sm font-bold justify-center bg-blue-600 hover:bg-blue-700 rounded-xl cursor-pointer shadow-md"
            >
              {loading ? 'Updating Password...' : 'Reset Password & Sign In'}
            </button>
          </form>
        )}

        {/* REGISTER FORM */}
        {tab === 'register' && (
          <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                Full Name
              </label>
              <input
                type="text"
                className="form-input text-xs bg-slate-50 border-slate-200 text-slate-900"
                placeholder="Ramesh Kumar Mahato"
                value={regForm.full_name}
                onChange={(e) => setRegForm({ ...regForm, full_name: e.target.value })}
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                Email Address or 10-Digit Mobile Number
              </label>
              <input
                type="text"
                className="form-input text-xs bg-slate-50 border-slate-200 text-slate-900"
                placeholder="user@gmail.com or 9876543210"
                value={regForm.email}
                onChange={(e) => setRegForm({ ...regForm, email: e.target.value })}
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                Password
              </label>
              <input
                type="password"
                className="form-input text-xs bg-slate-50 border-slate-200 text-slate-900"
                placeholder="••••••••"
                value={regForm.password}
                onChange={(e) => setRegForm({ ...regForm, password: e.target.value })}
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                Account Role
              </label>
              <select
                className="form-select text-xs bg-slate-50 border-slate-200 text-slate-900 font-semibold"
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
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                  Nodal Institution
                </label>
                <input
                  type="text"
                  className="form-input text-xs bg-slate-50 border-slate-200 text-slate-900"
                  placeholder="IIT (ISM) Dhanbad - Water Research Center"
                  value={regForm.institution}
                  onChange={(e) => setRegForm({ ...regForm, institution: e.target.value })}
                  required
                />
              </div>
            )}

            {regForm.role === 'industry' && (
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                  Company / Organization Name
                </label>
                <input
                  type="text"
                  className="form-input text-xs bg-slate-50 border-slate-200 text-slate-900"
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
              className="w-full btn-primary py-3.5 text-xs font-bold justify-center bg-blue-600 hover:bg-blue-700 rounded-xl mt-2 cursor-pointer shadow-md"
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
