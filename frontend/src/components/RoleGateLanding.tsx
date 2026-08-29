import React, { useState, FormEvent } from 'react';
import { 
  Users, 
  Building2, 
  BarChart3, 
  Briefcase, 
  ArrowRight, 
  ShieldCheck, 
  Sparkles, 
  CheckCircle2,
  Lock,
  Mail,
  Key,
  LogIn,
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

  // Quick Demo Sign In presets
  const DEMO_PRESETS = [
    {
      role: 'citizen' as UserRole,
      title: 'Citizen Portal',
      subtitle: 'Problem Reporting & Ticket Tracking',
      icon: Users,
      color: 'from-blue-600 to-cyan-500',
      badgeColor: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
      demoEmail: 'citizen@jharkhand.gov.in',
      description: 'Report local challenges. Get automated AI classification, priority scoring, & HEI lab routing.',
      targetTab: 'submit'
    },
    {
      role: 'university_admin' as UserRole,
      title: 'University Nodal Center',
      subtitle: 'HEI R&D Queue & Student Workstation',
      icon: Building2,
      color: 'from-indigo-600 to-purple-500',
      badgeColor: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
      demoEmail: 'admin@iitism.ac.in',
      description: 'Review assigned societal challenges. Manage faculty advisors, student teams, & project milestones.',
      targetTab: 'university'
    },
    {
      role: 'government' as UserRole,
      title: 'Government Executive',
      subtitle: 'Statewide Policy & GIS Dashboard',
      icon: BarChart3,
      color: 'from-amber-500 to-orange-500',
      badgeColor: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
      demoEmail: 'nodal.officer@jharkhand.gov.in',
      description: 'Statewide policy monitoring across 24 districts. Track sector resolution rates & university rankings.',
      targetTab: 'analytics'
    },
    {
      role: 'industry' as UserRole,
      title: 'Industry CSR Partner',
      subtitle: 'Corporate CSR Sponsorship Hub',
      icon: Briefcase,
      color: 'from-emerald-600 to-teal-500',
      badgeColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      demoEmail: 'csr@tatasteel.com',
      description: 'Browse verified societal R&D projects. Pledge Corporate Social Responsibility (CSR) funding directly.',
      targetTab: 'industry'
    }
  ];

  const handleQuickDemoLogin = async (demoRole: UserRole, demoEmail: string) => {
    setLoading(true);
    setError(null);
    try {
      await loginStep2(demoEmail, 'demo123', '123456');
      onLoginSuccess(demoRole);
    } catch (err: any) {
      setError('Quick sign in failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleStep1Submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !password.trim()) {
      setError('Please enter both email/phone and password.');
      return;
    }

    setLoading(true);
    try {
      const res = await loginStep1(email.trim(), password);
      setDispatchedOtp(res?.dev_otp || '123456');
      setStep('otp');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Sign in failed. Check credentials.');
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
      onLoginSuccess(userData.role);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Invalid OTP code.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!regForm.full_name.trim() || !regForm.email.trim() || !regForm.password) {
      setError('Please fill in all required registration fields.');
      return;
    }

    setLoading(true);
    try {
      const userData = await register(regForm);
      onLoginSuccess(userData.role);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-8 py-8 space-y-12 animate-fade-in">
      
      {/* Header Banner */}
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold tracking-wide">
          <ShieldCheck className="w-4 h-4 text-blue-400" /> Government of Jharkhand • Single Sign-On Portal
        </div>

        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-tight">
          Sign In to Access Your <span className="text-gradient-blue">Role Interface</span>
        </h1>

        <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
          Authentication required. Please sign in with your account or select your stakeholder tier below to automatically open your dedicated workspace.
        </p>
      </div>

      {/* Main Grid: SSO Sign In Form + 4 Stakeholder Quick Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* SSO Form Card */}
        <div className="lg:col-span-5 glass-card p-6 sm:p-8 space-y-6 border-blue-500/30">
          
          <div className="border-b border-white/10 pb-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Lock className="w-5 h-5 text-blue-400" /> Official Portal Sign In
            </h2>
            <p className="text-xs text-slate-400 mt-1">2-Factor Authentication & Role Navigation</p>
          </div>

          {error && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-semibold">
              {error}
            </div>
          )}

          {/* Toggle */}
          <div className="flex border-b border-white/10 text-xs font-bold">
            <button
              type="button"
              onClick={() => { setTab('login'); setStep('credentials'); setError(null); }}
              className={`pb-3 flex-1 text-center border-b-2 transition-all cursor-pointer ${
                tab === 'login' ? 'border-blue-500 text-white font-bold' : 'border-transparent text-slate-400'
              }`}
            >
              Sign In (2-Factor)
            </button>
            <button
              type="button"
              onClick={() => { setTab('register'); setError(null); }}
              className={`pb-3 flex-1 text-center border-b-2 transition-all cursor-pointer ${
                tab === 'register' ? 'border-blue-500 text-white font-bold' : 'border-transparent text-slate-400'
              }`}
            >
              Register Account
            </button>
          </div>

          {/* LOGIN STEP 1 */}
          {tab === 'login' && step === 'credentials' && (
            <form onSubmit={handleStep1Submit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold uppercase text-slate-300 mb-1.5">
                  Email Address or Phone
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    className="form-input form-input-with-icon text-xs bg-[#080d1a] border-white/10"
                    placeholder="user@gmail.com or 9876543210"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold uppercase text-slate-300 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    className="form-input form-input-with-icon text-xs bg-[#080d1a] border-white/10"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full btn-primary py-3.5 text-xs font-bold justify-center bg-blue-600 hover:bg-blue-500 rounded-xl cursor-pointer"
              >
                {loading ? 'Verifying Password...' : 'Sign In & Authenticate'}
              </button>
            </form>
          )}

          {/* LOGIN STEP 2 (OTP) */}
          {tab === 'login' && step === 'otp' && (
            <form onSubmit={handleStep2Submit} className="space-y-4 text-xs">
              <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Security OTP Dispatched
                </div>
                <div className="text-[11px] font-mono text-amber-300">
                  Dev Passcode: <span className="font-extrabold text-white bg-amber-500/20 px-2 py-0.5 rounded">{dispatchedOtp || '123456'}</span>
                </div>
              </div>

              <div>
                <label className="block font-bold uppercase text-slate-300 mb-1.5">
                  Enter 6-Digit OTP Code
                </label>
                <div className="relative">
                  <Key className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    maxLength={6}
                    className="form-input form-input-with-icon text-base font-mono tracking-widest bg-[#080d1a] border-blue-500/60 font-bold"
                    placeholder="123456"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full btn-primary py-3.5 text-xs font-bold justify-center bg-blue-600 hover:bg-blue-500 rounded-xl cursor-pointer"
              >
                {loading ? 'Verifying OTP...' : 'Verify OTP & Open Dashboard'}
              </button>
            </form>
          )}

          {/* REGISTER */}
          {tab === 'register' && (
            <form onSubmit={handleRegisterSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold uppercase text-slate-300 mb-1">Full Name</label>
                <input
                  type="text"
                  className="form-input text-xs bg-[#080d1a] border-white/10"
                  placeholder="Ramesh Kumar Mahato"
                  value={regForm.full_name}
                  onChange={(e) => setRegForm({ ...regForm, full_name: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="block font-bold uppercase text-slate-300 mb-1">Email Address</label>
                <input
                  type="text"
                  className="form-input text-xs bg-[#080d1a] border-white/10"
                  placeholder="user@gmail.com"
                  value={regForm.email}
                  onChange={(e) => setRegForm({ ...regForm, email: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="block font-bold uppercase text-slate-300 mb-1">Password</label>
                <input
                  type="password"
                  className="form-input text-xs bg-[#080d1a] border-white/10"
                  placeholder="••••••••"
                  value={regForm.password}
                  onChange={(e) => setRegForm({ ...regForm, password: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="block font-bold uppercase text-slate-300 mb-1">Select Stakeholder Category</label>
                <select
                  className="form-select text-xs bg-[#080d1a] border-white/10 font-bold text-blue-400"
                  value={regForm.role}
                  onChange={(e) => setRegForm({ ...regForm, role: e.target.value as UserRole })}
                >
                  <option value="citizen">Citizen (Grievance Reporting & Tracking)</option>
                  <option value="university_admin">University Admin (Faculty / R&D Lead)</option>
                  <option value="government">Government Executive (Nodal Officer)</option>
                  <option value="industry">Industry CSR Partner (Project Sponsorship)</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full btn-primary py-3.5 text-xs font-bold justify-center bg-blue-600 hover:bg-blue-500 rounded-xl cursor-pointer"
              >
                {loading ? 'Registering...' : 'Register & Enter Interface'}
              </button>
            </form>
          )}

        </div>

        {/* 4 Stakeholder Quick Demo Access Cards */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-amber-400" /> Instant Stakeholder Interface Access:
            </span>
            <span className="text-[11px] text-slate-400 font-mono">Select Category Tier</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {DEMO_PRESETS.map((preset) => {
              const Icon = preset.icon;
              return (
                <div
                  key={preset.role}
                  className="glass-card p-5 space-y-4 border-white/10 hover:border-blue-500/50 flex flex-col justify-between transition-all duration-300 hover:scale-[1.02] bg-[#0b1329]/80"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className={`w-10 h-10 rounded-xl bg-gradient-to-tr ${preset.color} flex items-center justify-center text-white shadow-md`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${preset.badgeColor}`}>
                        {preset.role.toUpperCase()}
                      </span>
                    </div>

                    <div>
                      <h3 className="text-sm font-bold text-white">{preset.title}</h3>
                      <span className="text-[11px] text-slate-400 font-medium block">{preset.subtitle}</span>
                    </div>

                    <p className="text-[11px] text-slate-300 leading-relaxed">{preset.description}</p>
                  </div>

                  <button
                    type="button"
                    disabled={loading}
                    onClick={() => handleQuickDemoLogin(preset.role, preset.demoEmail)}
                    className={`w-full btn-primary py-2.5 text-xs font-bold justify-center bg-gradient-to-r ${preset.color} cursor-pointer shadow-md rounded-xl`}
                  >
                    <span>Sign In & Open Interface</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>

      </div>

    </div>
  );
}

export default RoleGateLanding;
