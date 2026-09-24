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

  const validateIdentifier = (input: string) => {
    const str = input.trim();
    if (!str) {
      return { valid: false, message: 'Please enter your email address or 10-digit mobile number.' };
    }

    if (/^\d+$/.test(str)) {
      if (!/^[6-9]\d{9}$/.test(str)) {
        return { valid: false, message: 'Please enter a valid 10-digit Indian mobile number (e.g. 9876543210).' };
      }
      return { valid: true };
    }

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(str)) {
      return { valid: false, message: 'Please enter a valid email address (e.g. user@gmail.com) or 10-digit mobile number.' };
    }

    return { valid: true };
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
      setError(valResult.message || 'Invalid email or phone number format.');
      return;
    }

    if (!regForm.password || regForm.password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);
    try {
      const userData = await register({
        ...regForm,
        email: regForm.email.trim(),
        full_name: regForm.full_name.trim()
      });
      onLoginSuccess(userData.role || regForm.role);
    } catch (err: any) {
      const detail = err.response?.data?.detail;
      if (detail && (detail.includes('already exists') || detail.includes('already registered'))) {
        setError('An account with this email/phone number already exists! Click "Sign in" below to log in.');
      } else {
        setError(detail || 'Registration failed. Please check your inputs or network connection.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full flex flex-col items-center justify-center py-8 px-4 animate-fade-in max-w-6xl mx-auto space-y-10">
      
      {/* Hero Header & Official SIH 26043 Badge */}
      <div className="text-center space-y-4 max-w-3xl">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 text-xs font-bold tracking-wide shadow-sm">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
          <span>SIH 2026 Problem Statement 26043 • Dept. of Higher Education, Govt. of Jharkhand</span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
          SETU <span className="text-gradient-blue">Jharkhand</span>
        </h1>
        <p className="text-sm sm:text-base text-slate-600 font-medium max-w-2xl mx-auto">
          Nodal Societal Innovation Collaboration Platform bridging <strong className="text-slate-900">Citizens</strong>, <strong className="text-blue-700">University R&D Hubs</strong>, <strong className="text-emerald-700">Industry CSR Sponsors</strong>, and <strong className="text-indigo-700">State Executives</strong>.
        </p>

        {/* Live Metric Pills */}
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <span className="px-3.5 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-semibold shadow-xs flex items-center gap-1.5">
            📍 <strong className="text-slate-900">24/24</strong> Districts Covered
          </span>
          <span className="px-3.5 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-semibold shadow-xs flex items-center gap-1.5">
            🎓 <strong className="text-blue-700">14</strong> Universities Onboarded
          </span>
          <span className="px-3.5 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-semibold shadow-xs flex items-center gap-1.5">
            💼 <strong className="text-emerald-700">₹4.8 Cr</strong> CSR Grants Active
          </span>
        </div>
      </div>

      {/* Main Grid: Sign In Card + Interactive Feature Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start w-full">
        
        {/* Left Column: Sign In / Sign Up Form Card */}
        <div className="lg:col-span-6 bg-white border border-slate-200/90 rounded-3xl shadow-xl p-6 sm:p-8 space-y-6 relative overflow-hidden">
          <div className="gov-tricolor-bar absolute top-0 left-0 right-0"></div>

          <div className="space-y-1">
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              {tab === 'login' ? 'Stakeholder Sign In' : 'Register Account'}
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              {tab === 'login' ? 'Select pre-fill shortcut or enter credentials below:' : 'Create your official stakeholder account:'}
            </p>
          </div>

          {/* Quick Pre-fill Chips for Video Demo */}
          {tab === 'login' && step === 'credentials' && (
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-amber-500" /> 1-Click Video Demo Pre-Fill:
              </div>
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => { setEmail('grab10aakashbhagat@gmail.com'); setPassword('password123'); setSelectedRole('citizen'); setError(null); }}
                  className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-800 text-xs font-bold hover:border-blue-500 hover:text-blue-600 shadow-xs cursor-pointer flex items-center gap-1"
                >
                  👤 Citizen (Aakash)
                </button>
                <button
                  type="button"
                  onClick={() => { setEmail('ism_admin@iitism.ac.in'); setPassword('password123'); setSelectedRole('university_admin'); setError(null); }}
                  className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-800 text-xs font-bold hover:border-blue-500 hover:text-blue-600 shadow-xs cursor-pointer flex items-center gap-1"
                >
                  🎓 IIT Dhanbad
                </button>
                <button
                  type="button"
                  onClick={() => { setEmail('executive@jharkhand.gov.in'); setPassword('password123'); setSelectedRole('government'); setError(null); }}
                  className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-800 text-xs font-bold hover:border-blue-500 hover:text-blue-600 shadow-xs cursor-pointer flex items-center gap-1"
                >
                  🏛️ Govt Executive
                </button>
                <button
                  type="button"
                  onClick={() => { setEmail('tatasteel@csr.org'); setPassword('password123'); setSelectedRole('industry'); setError(null); }}
                  className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-800 text-xs font-bold hover:border-blue-500 hover:text-blue-600 shadow-xs cursor-pointer flex items-center gap-1"
                >
                  💼 Tata Steel CSR
                </button>
              </div>
            </div>
          )}
          
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 text-xs font-semibold text-center">
              {error}
            </div>
          )}

          {/* LOGIN FORM */}
          {tab === 'login' && step === 'credentials' && (
            <form onSubmit={handleStep1Submit} className="space-y-4 text-xs sm:text-sm">
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

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Email</label>
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

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Password</label>
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

              <button
                type="submit"
                disabled={loading}
                className="w-full btn-primary py-3 justify-center bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-xs sm:text-sm shadow-md cursor-pointer mt-2"
              >
                {loading ? 'Verifying Password...' : 'Sign In'}
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
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Enter 6-Digit Passcode</label>
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
                {loading ? 'Verifying OTP...' : 'Verify & Open Portal'}
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

              {regForm.role === 'university_admin' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">University / Institution Name</label>
                  <input
                    type="text"
                    className="form-input text-xs"
                    placeholder="e.g. IIT (ISM) Dhanbad"
                    value={regForm.institution}
                    onChange={(e) => setRegForm({ ...regForm, institution: e.target.value })}
                  />
                </div>
              )}

              {regForm.role === 'industry' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Company / Organization Name</label>
                  <input
                    type="text"
                    className="form-input text-xs"
                    placeholder="e.g. Tata Steel CSR Division"
                    value={regForm.company_name}
                    onChange={(e) => setRegForm({ ...regForm, company_name: e.target.value })}
                  />
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full btn-primary py-3 justify-center bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-xs sm:text-sm shadow-md cursor-pointer mt-2"
              >
                {loading ? 'Creating Account...' : 'Sign Up'}
              </button>
            </form>
          )}

          {/* Bottom Switch */}
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

        {/* Right Column: Platform Capabilities Showcase Cards */}
        <div className="lg:col-span-6 space-y-4">
          
          <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center font-bold shrink-0">
                <Users className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-slate-900">1. Citizen Challenge Crowdsourcing</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Citizens submit real-world grassroots problems from any of Jharkhand's 24 districts with automatic GPS geolocation, photo upload, and SMS/Email tracking.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center font-bold shrink-0">
                <Zap className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-slate-900">2. AI Zero-Shot Domain Classifier</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Natural language processing pipeline automatically classifies tickets into domains (Water Sanitation, Agri Tech, Healthcare, Mining Safety) and routes them to specialized university R&D centers.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold shrink-0">
                <Building2 className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-slate-900">3. Higher Education R&D Kanban Queue</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  University faculties & student teams at IIT (ISM) Dhanbad, CUJ, and BAU manage innovation lifecycles with milestone tracking from concept to physical prototype.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold shrink-0">
                <Briefcase className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-slate-900">4. Corporate CSR Grant Funding</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Industry leaders like Tata Steel pledge corporate CSR funds directly to validated university R&D projects with full transparent grant utilization analytics.
                </p>
              </div>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}

export default RoleGateLanding;
