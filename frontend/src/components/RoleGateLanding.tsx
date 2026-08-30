import React, { useState, FormEvent } from 'react';
import { 
  Lock, 
  Mail, 
  UserCheck, 
  ShieldCheck, 
  ArrowRight, 
  CheckCircle2,
  Users,
  Building2,
  BarChart3,
  Briefcase,
  Zap
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';

interface RoleGateLandingProps {
  onLoginSuccess: (roleName: UserRole) => void;
}

function RoleGateLanding({ onLoginSuccess }: RoleGateLandingProps) {
  const { loginStep1, loginStep2, register } = useAuth();
  
  const [tab, setTab] = useState<'login' | 'register'>('login');
  const [step, setStep] = useState<'credentials' | 'otp'>('credentials');
  
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [selectedRole, setSelectedRole] = useState<UserRole>('citizen');
  const [otpCode, setOtpCode] = useState<string>('');
  const [dispatchedOtp, setDispatchedOtp] = useState<string | null>(null);
  
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [regForm, setRegForm] = useState({
    email: '',
    password: '',
    full_name: '',
    role: 'citizen' as UserRole,
    institution: '',
    company_name: ''
  });



  const handleStep1Submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !password.trim()) {
      setError('Please enter your email and password.');
      return;
    }

    setLoading(true);
    try {
      const res = await loginStep1(email.trim(), password);
      const generatedOtp = res?.dev_otp || '';
      setDispatchedOtp(generatedOtp);
      setOtpCode(generatedOtp);
      setStep('otp');
    } catch (err: any) {
      const detail = err.response?.data?.detail;
      if (err.response?.status === 401 || (detail && (detail.toLowerCase().includes('incorrect') || detail.toLowerCase().includes('invalid') || detail.toLowerCase().includes('not found')))) {
        setError('No account found for this email or password incorrect. Click "Sign up" below to create your account!');
      } else {
        setError(detail || 'Sign in failed. Please check your credentials or network connection.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleStep2Submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!otpCode || otpCode.trim().length !== 6) {
      setError('Please enter 6-digit OTP code.');
      return;
    }

    setLoading(true);
    try {
      const userData = await loginStep2(email.trim(), password, otpCode.trim());
      onLoginSuccess(userData.role || selectedRole);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Invalid OTP code.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (regForm.password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);
    try {
      const userData = await register(regForm);
      onLoginSuccess(userData.role);
    } catch (err: any) {
      const detail = err.response?.data?.detail;
      if (detail && detail.includes('already exists')) {
        setError('An account with this email/phone number already exists! Please click "Sign in" below.');
      } else {
        setError(detail || 'Registration failed. Please check your network connection.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] w-full flex flex-col items-center justify-center py-10 px-4 animate-fade-in">
      
      {/* Brand Logo Header (Matches user screenshot) */}
      <div className="text-center space-y-3 mb-6">
        <div className="inline-flex items-center justify-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-md">
            SC
          </div>
          <span className="text-xl font-extrabold text-slate-900 tracking-tight">
            Societal<span className="text-blue-600">Connect</span>
          </span>
        </div>
        
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          {tab === 'login' ? 'Welcome back' : 'Create your account'}
        </h1>
        <p className="text-xs sm:text-sm text-slate-500">
          {tab === 'login' ? 'Sign in to your account' : 'Register your official stakeholder account'}
        </p>
      </div>

      {/* Main White Card (Matches user screenshot layout) */}
      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xl p-8 max-w-md w-full space-y-6">
        
        {error && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 text-xs font-semibold text-center">
            {error}
          </div>
        )}

        {/* LOGIN FORM */}
        {tab === 'login' && step === 'credentials' && (
          <form onSubmit={handleStep1Submit} className="space-y-4 text-xs sm:text-sm">
            
            {/* Stakeholder Category Designation */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Stakeholder Category / Designation <span className="text-blue-600">*</span>
              </label>
              <select
                className="form-select text-xs font-bold text-blue-700 bg-blue-50/50 border-blue-200"
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value as UserRole)}
              >
                <option value="citizen">👤 Citizen (Grievance Reporting & Tracking)</option>
                <option value="university_admin">🎓 University Admin (Faculty / HEI R&D Lead)</option>
                <option value="government">🏛️ Government Executive (Nodal Officer)</option>
                <option value="industry">💼 Industry CSR Partner (Project Sponsorship)</option>
              </select>
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  className="form-input form-input-with-icon text-xs sm:text-sm"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  className="form-input form-input-with-icon text-xs sm:text-sm"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Sign in Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary py-3 justify-center bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-xs sm:text-sm shadow-md cursor-pointer mt-2"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>

          </form>
        )}

        {/* STEP 2: OTP */}
        {tab === 'login' && step === 'otp' && (
          <form onSubmit={handleStep2Submit} className="space-y-4 text-xs sm:text-sm">
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 space-y-1">
              <div className="font-bold flex items-center gap-1.5 text-xs">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Security Passcode Dispatched
              </div>
              <div className="text-xs font-mono text-emerald-800 font-bold bg-white p-2.5 rounded-xl border border-emerald-200 flex items-center justify-between">
                <span>📱 6-DIGIT OTP CODE:</span>
                <span className="font-extrabold text-slate-900 bg-emerald-100 px-3 py-1 rounded-lg border border-emerald-300 text-sm tracking-widest">{dispatchedOtp}</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Enter 6-Digit Passcode
              </label>
              <input
                type="text"
                maxLength={6}
                className="form-input text-center text-lg font-mono tracking-widest font-bold border-blue-300 text-blue-700"
                placeholder="123456"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value)}
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary py-3 justify-center bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-xs sm:text-sm shadow-md cursor-pointer"
            >
              {loading ? 'Verifying...' : 'Verify & Open Portal'}
            </button>
          </form>
        )}

        {/* REGISTER FORM */}
        {tab === 'register' && (
          <form onSubmit={handleRegisterSubmit} className="space-y-3.5 text-xs sm:text-sm">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
              <input
                type="text"
                className="form-input text-xs"
                placeholder="Ramesh Kumar Mahato"
                value={regForm.full_name}
                onChange={(e) => setRegForm({ ...regForm, full_name: e.target.value })}
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Email</label>
              <input
                type="text"
                className="form-input text-xs"
                placeholder="you@example.com"
                value={regForm.email}
                onChange={(e) => setRegForm({ ...regForm, email: e.target.value })}
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Password</label>
              <input
                type="password"
                className="form-input text-xs"
                placeholder="••••••••"
                value={regForm.password}
                onChange={(e) => setRegForm({ ...regForm, password: e.target.value })}
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Stakeholder Category</label>
              <select
                className="form-select text-xs font-bold text-blue-700 bg-blue-50/50 border-blue-200"
                value={regForm.role}
                onChange={(e) => setRegForm({ ...regForm, role: e.target.value as UserRole })}
              >
                <option value="citizen">👤 Citizen (Grievance Reporting & Tracking)</option>
                <option value="university_admin">🎓 University Admin (Faculty / HEI R&D Lead)</option>
                <option value="government">🏛️ Government Executive (Nodal Officer)</option>
                <option value="industry">💼 Industry CSR Partner (Project Sponsorship)</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary py-3 justify-center bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-xs sm:text-sm shadow-md cursor-pointer mt-2"
            >
              {loading ? 'Creating Account...' : 'Sign up'}
            </button>
          </form>
        )}

        {/* Bottom Switch Link (Matches user screenshot) */}
        <div className="text-center text-xs text-slate-500 pt-2 border-t border-slate-100">
          {tab === 'login' ? (
            <span>
              Don't have an account?{' '}
              <button
                type="button"
                onClick={() => { setTab('register'); setRegForm(prev => ({ ...prev, email: email.trim() })); setError(null); }}
                className="font-semibold text-blue-600 hover:text-blue-700 cursor-pointer"
              >
                Sign up
              </button>
            </span>
          ) : (
            <span>
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => { setTab('login'); setStep('credentials'); setError(null); }}
                className="font-semibold text-blue-600 hover:text-blue-700 cursor-pointer"
              >
                Sign in
              </button>
            </span>
          )}
        </div>

      </div>

    </div>
  );
}

export default RoleGateLanding;
