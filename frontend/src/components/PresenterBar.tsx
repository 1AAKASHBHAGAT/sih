import React, { useState } from 'react';
import { Zap, Check, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface DemoPreset {
  label: string;
  email: string;
  password: string;
  role: string;
  icon: string;
}

const DEMO_PRESETS: DemoPreset[] = [
  {
    label: "Gov Nodal Officer",
    email: "gov@jharkhand.gov.in",
    password: "gov123",
    role: "government",
    icon: "🏛️"
  },
  {
    label: "IIT Dhanbad Admin",
    email: "dhanbad@iitism.ac.in",
    password: "dhanbad123",
    role: "university_admin",
    icon: "🎓"
  },
  {
    label: "BAU Ranchi Admin",
    email: "ranchi@bau.ac.in",
    password: "ranchi123",
    role: "university_admin",
    icon: "🌾"
  },
  {
    label: "Tata Steel CSR",
    email: "csr@tatasteel.com",
    password: "tata123",
    role: "industry",
    icon: "💼"
  },
  {
    label: "Citizen Account",
    email: "citizen@gmail.com",
    password: "citizen123",
    role: "citizen",
    icon: "👤"
  }
];

function PresenterBar() {
  const { loginStep1, loginStep2, user } = useAuth();
  const [, setActivePreset] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string>('');

  // Feature gate check: local/presentation build defaults to true, public deployment turns off
  const enableDemo = (import.meta as any).env.VITE_ENABLE_DEMO_LOGIN !== 'false';
  if (!enableDemo) return null;

  const handleRunDemoFlow = async (preset: DemoPreset) => {
    setLoading(true);
    setActivePreset(preset.label);
    setStatusMessage(`Step 1: Verifying password for ${preset.email}...`);

    try {
      // 1. Programmatically execute Step 1 (Password factor)
      const step1Result = await loginStep1(preset.email, preset.password);
      const generatedOtp = step1Result.dev_otp || '849201';
      
      setStatusMessage(`Step 2: Auto-verifying OTP (${generatedOtp})...`);
      
      // 2. Programmatically execute Step 2 (OTP second factor)
      await loginStep2(preset.email, preset.password, generatedOtp);
      
      setStatusMessage(`✅ Authenticated as ${preset.label}!`);
      setTimeout(() => setStatusMessage(''), 3000);
    } catch (err: any) {
      console.error(err);
      setStatusMessage(`Failed: ${err.response?.data?.detail || 'Authentication error'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full bg-[#0a1122] border-b border-amber-500/30 py-2.5 px-4 text-xs">
      <div className="max-w-[1720px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
        
        <div className="flex items-center gap-2 text-amber-300 font-semibold shrink-0">
          <span className="p-1 rounded bg-amber-500/20 text-amber-400 font-mono font-bold text-[10px] uppercase border border-amber-500/30 flex items-center gap-1">
            <Zap className="w-3 h-3" /> Presenter Shortcut
          </span>
          <span>1-Click Real 2FA Demo Switcher:</span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {DEMO_PRESETS.map((preset) => {
            const isCurrent = user?.email === preset.email;
            return (
              <button
                key={preset.email}
                type="button"
                disabled={loading}
                onClick={() => handleRunDemoFlow(preset)}
                className={`px-3 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                  isCurrent
                    ? 'bg-blue-600 border-blue-500 text-white shadow-sm'
                    : 'bg-[#0e172e] border-[#2a3b63]/80 text-slate-300 hover:border-amber-500 hover:text-white'
                }`}
              >
                <span>{preset.icon}</span>
                <span>{preset.label}</span>
                {isCurrent && <Check className="w-3.5 h-3.5 text-white ml-0.5" />}
              </button>
            );
          })}
        </div>

        {statusMessage && (
          <div className="text-[11px] font-mono text-emerald-400 font-bold bg-emerald-500/10 px-3 py-1 rounded border border-emerald-500/20 shrink-0 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 animate-spin" />
            <span>{statusMessage}</span>
          </div>
        )}

      </div>
    </div>
  );
}

export default PresenterBar;
