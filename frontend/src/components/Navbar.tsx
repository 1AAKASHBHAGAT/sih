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
  ChevronDown
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
        return { label: 'Gov Executive Nodal', color: 'bg-amber-100 text-amber-800 border-amber-200' };
      case 'university_admin':
        return { label: 'University R&D Lead', color: 'bg-blue-100 text-blue-800 border-blue-200' };
      case 'industry':
        return { label: 'CSR Sponsor Partner', color: 'bg-emerald-100 text-emerald-800 border-emerald-200' };
      default:
        return { label: 'Citizen Reporter', color: 'bg-sky-100 text-sky-800 border-sky-200' };
    }
  };

  const currentTabInfo = getRoleTab(role);
  const badge = getRoleBadge(role);

  return (
    <header className="w-full sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200/90 shadow-sm">
      {/* Tri-Color Flag Accent Bar */}
      <div className="gov-tricolor-bar" aria-hidden="true" />

      {/* Top Nodal Ticker Strip */}
      <div className="bg-slate-900 border-b border-slate-800 py-1.5 px-4 sm:px-8 text-xs text-white">
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
      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-3 flex items-center justify-between gap-4">
        
        {/* Brand Logo (SocietalConnect / SETU Jharkhand) */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-md">
            SC
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight">
                Societal<span className="text-blue-600">Connect</span>
              </h1>
              <span className="text-[10px] font-bold bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full border border-blue-200">
                SETU Jharkhand
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium hidden sm:block">
              Societal Innovation Nodal Ecosystem
            </p>
          </div>
        </div>

        {/* Strictly Scoped Tab indicator (Only visible when signed in) */}
        {isAuthenticated && currentTabInfo && (
          <div className="hidden md:flex items-center gap-2.5 px-4 py-2 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold shadow-sm">
            {React.createElement(currentTabInfo.icon, { className: "w-4 h-4 text-blue-600" })}
            <span>{currentTabInfo.label}</span>
          </div>
        )}

        {/* Right Tools & Account Controls */}
        <div className="flex items-center gap-3">
          
          {/* Track Grievance Button (Available to Citizen or Signed Out) */}
          {(!isAuthenticated || role === 'citizen') && (
            <button
              type="button"
              onClick={onOpenTicketLookup}
              className="btn-secondary text-xs py-2 px-3.5 bg-white border-slate-200 text-slate-700 hover:text-blue-600 hover:border-blue-300"
            >
              <Search className="w-3.5 h-3.5 text-blue-600" />
              <span className="hidden sm:inline">Track Ticket Code</span>
            </button>
          )}

          {/* Language Switcher */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setLangDropdownOpen(!langDropdownOpen)}
              className="flex items-center gap-1.5 text-xs bg-white hover:bg-slate-50 text-slate-700 px-3 py-2 rounded-xl border border-slate-200 font-semibold transition cursor-pointer"
            >
              <Globe className="w-3.5 h-3.5 text-blue-600" />
              <span className="hidden xs:inline">{language}</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {langDropdownOpen && (
              <div className="absolute right-0 mt-2 w-40 bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden py-1 z-50">
                {['English', 'Hindi', 'Santali'].map(lang => (
                  <button
                    key={lang}
                    type="button"
                    onClick={() => {
                      setLanguage(lang);
                      setLangDropdownOpen(false);
                    }}
                    className={`w-full text-left px-4 py-2.5 text-xs font-semibold hover:bg-blue-600 hover:text-white transition ${
                      language === lang ? 'bg-blue-50 text-blue-600 font-bold' : 'text-slate-700'
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
                <span className="text-xs font-bold text-slate-900 truncate max-w-[140px]">{user.full_name}</span>
                <span className={`text-[10px] font-bold px-2 py-0.2 rounded border ${badge.color}`}>
                  {badge.label}
                </span>
              </div>
              <button
                type="button"
                onClick={logout}
                className="btn-secondary text-xs py-2 px-3.5 bg-white border-slate-200 text-rose-600 hover:bg-rose-50 hover:border-rose-300 font-bold"
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
              className="btn-primary text-xs py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-md"
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
