import React, { useState } from 'react';
import { 
  Building2, 
  Search, 
  BarChart3, 
  Briefcase, 
  Globe, 
  ShieldCheck, 
  Sparkles,
  LogIn,
  LogOut,
  ChevronDown,
  UserCheck
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenTicketLookup: () => void;
  onOpenLogin: (role?: UserRole | null) => void;
}

function Navbar({ activeTab, setActiveTab, onOpenTicketLookup, onOpenLogin }: NavbarProps) {
  const { language, setLanguage } = useLanguage();
  const { user, isAuthenticated, role, logout } = useAuth();
  const [langDropdownOpen, setLangDropdownOpen] = useState<boolean>(false);

  // Role-locked navigation configuration
  const getRoleTab = (r: UserRole) => {
    switch (r) {
      case 'citizen':
        return { id: 'submit', label: 'Citizen Problem Reporting & Status', icon: Sparkles };
      case 'university_admin':
        return { id: 'university', label: 'University HEI R&D Queue', icon: Building2 };
      case 'government':
        return { id: 'analytics', label: 'Government Executive Dashboard', icon: BarChart3 };
      case 'industry':
        return { id: 'industry', label: 'Corporate CSR Grants Hub', icon: Briefcase };
      default:
        return null;
    }
  };

  const getRoleBadge = (r: UserRole) => {
    switch (r) {
      case 'government':
        return { label: 'Gov Executive Nodal', color: 'bg-amber-500/10 text-amber-400 border-amber-500/30' };
      case 'university_admin':
        return { label: 'University R&D Lead', color: 'bg-blue-500/10 text-blue-400 border-blue-500/30' };
      case 'industry':
        return { label: 'CSR Sponsor Partner', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' };
      default:
        return { label: 'Citizen Reporter', color: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30' };
    }
  };

  const currentTabInfo = getRoleTab(role);
  const badge = getRoleBadge(role);

  return (
    <header className="w-full sticky top-0 z-50 bg-[#030712]/90 backdrop-blur-2xl border-b border-white/10 shadow-2xl">
      {/* Tri-Color Flag Accent Bar */}
      <div className="gov-tricolor-bar" aria-hidden="true" />

      {/* Top Nodal Ticker Strip */}
      <div className="bg-[#02040a] border-b border-white/5 py-1.5 px-4 sm:px-8 text-xs">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 truncate">
            <span className="flex items-center gap-1.5 text-emerald-400 font-medium text-[11px] sm:text-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> Single Sign-On Portal Active
            </span>
            <span className="text-slate-600">•</span>
            <span className="text-slate-300 font-medium truncate text-[11px] sm:text-xs">
              Govt. of Jharkhand • Department of Higher & Technical Education
            </span>
          </div>

          <div className="flex items-center gap-4 shrink-0 text-[11px]">
            <span className="text-amber-400 font-bold bg-amber-500/10 px-2.5 py-0.5 rounded border border-amber-500/20">
              SIH 26043 Role-Locked System
            </span>
          </div>
        </div>
      </div>

      {/* Main Navbar Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-3.5 flex items-center justify-between gap-4">
        
        {/* Brand Logo */}
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/25 border border-white/20">
            <ShieldCheck className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-xl font-extrabold text-white tracking-tight">
                SETU <span className="text-gradient-blue">Jharkhand</span>
              </h1>
              <span className="text-[10px] font-bold bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded-full border border-blue-500/20">
                SSO Secured
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium hidden sm:block">
              Societal Innovation Nodal Portal
            </p>
          </div>
        </div>

        {/* Strictly Scoped Tab indicator (Only visible when signed in) */}
        {isAuthenticated && currentTabInfo && (
          <div className="hidden md:flex items-center gap-2.5 px-4 py-2 rounded-xl bg-blue-600/10 border border-blue-500/30 text-blue-300 text-xs font-bold">
            {React.createElement(currentTabInfo.icon, { className: "w-4 h-4 text-blue-400" })}
            <span>{currentTabInfo.label}</span>
          </div>
        )}

        {/* Right Tools & Account Session Controls */}
        <div className="flex items-center gap-3">
          
          {/* Track Grievance Button (Available to Citizen or Signed Out) */}
          {(!isAuthenticated || role === 'citizen') && (
            <button
              type="button"
              onClick={onOpenTicketLookup}
              className="btn-secondary text-xs py-2.5 px-3.5 bg-[#0b1329] border-white/10 text-slate-200 hover:text-white hover:border-blue-500/50"
            >
              <Search className="w-3.5 h-3.5 text-blue-400" />
              <span className="hidden sm:inline">Track Ticket Code</span>
            </button>
          )}

          {/* Language Switcher */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setLangDropdownOpen(!langDropdownOpen)}
              className="flex items-center gap-1.5 text-xs bg-[#0b1329] hover:bg-slate-800 text-slate-300 px-3.5 py-2.5 rounded-xl border border-white/10 font-semibold transition cursor-pointer"
            >
              <Globe className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden xs:inline">{language}</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {langDropdownOpen && (
              <div className="absolute right-0 mt-2 w-40 bg-[#0f172a] border border-white/10 rounded-2xl shadow-2xl overflow-hidden py-1 z-50 backdrop-blur-xl">
                {['English', 'Hindi', 'Santali'].map(lang => (
                  <button
                    key={lang}
                    type="button"
                    onClick={() => {
                      setLanguage(lang);
                      setLangDropdownOpen(false);
                    }}
                    className={`w-full text-left px-4 py-2.5 text-xs font-semibold hover:bg-blue-600 hover:text-white transition ${
                      language === lang ? 'bg-blue-600/20 text-blue-400 font-bold' : 'text-slate-300'
                    }`}
                  >
                    {lang}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Auth State Button */}
          {isAuthenticated && user ? (
            <div className="flex items-center gap-2.5">
              <div className="hidden lg:flex flex-col text-right">
                <span className="text-xs font-bold text-white truncate max-w-[140px]">{user.full_name}</span>
                <span className={`text-[10px] font-bold px-2 py-0.2 rounded border ${badge.color}`}>
                  {badge.label}
                </span>
              </div>
              <button
                type="button"
                onClick={logout}
                className="btn-secondary text-xs py-2.5 px-3.5 bg-[#0b1329] border-white/10 text-rose-400 hover:bg-rose-500/10 hover:border-rose-500/30 font-bold"
                title="Sign Out & Lock System"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => onOpenLogin(null)}
              className="btn-primary text-xs py-2.5 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold shadow-lg shadow-blue-600/25 border border-white/20"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Sign In / Sign Up</span>
            </button>
          )}

        </div>

      </div>

    </header>
  );
}

export default Navbar;
