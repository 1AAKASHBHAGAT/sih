import React, { useState } from 'react';
import { 
  Building2, 
  Search, 
  BarChart3, 
  Briefcase, 
  Globe, 
  ShieldCheck, 
  Sparkles,
  Menu,
  X,
  LogIn,
  LogOut,
  ChevronDown,
  Layers,
  Activity,
  Award
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
  const { language, setLanguage, t } = useLanguage();
  const { user, isAuthenticated, role, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const [langDropdownOpen, setLangDropdownOpen] = useState<boolean>(false);

  const navItems = [
    { id: 'gate', label: 'Select Tier', icon: Layers, roles: ['guest', 'citizen', 'university_admin', 'industry', 'government'] },
    { id: 'submit', label: 'Submit Issue', icon: Sparkles, roles: ['guest', 'citizen', 'university_admin', 'industry', 'government'] },
    { id: 'university', label: 'HEI R&D Queue', icon: Building2, roles: ['university_admin', 'government'] },
    { id: 'analytics', label: 'Executive Dashboard', icon: BarChart3, roles: ['government'] },
    { id: 'industry', label: 'CSR Grants Hub', icon: Briefcase, roles: ['industry', 'government'] },
  ];

  const visibleNavItems = navItems.filter(item => item.roles.includes(role) || role === 'government');

  const getRoleBadge = (r: UserRole) => {
    switch (r) {
      case 'government':
        return { label: 'Gov Executive', color: 'bg-amber-500/10 text-amber-400 border-amber-500/30' };
      case 'university_admin':
        return { label: 'University Nodal', color: 'bg-blue-500/10 text-blue-400 border-blue-500/30' };
      case 'industry':
        return { label: 'CSR Sponsor', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' };
      default:
        return { label: 'Citizen User', color: 'bg-slate-800 text-slate-300 border-slate-700' };
    }
  };

  const badge = getRoleBadge(role);

  return (
    <header className="w-full sticky top-0 z-50 bg-[#030712]/85 backdrop-blur-2xl border-b border-white/10 shadow-2xl">
      {/* Tri-Color Flag Line */}
      <div className="gov-tricolor-bar" aria-hidden="true" />

      {/* Top Nodal Ticker */}
      <div className="bg-[#02040a] border-b border-white/5 py-1.5 px-4 sm:px-8 text-xs">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 truncate">
            <span className="flex items-center gap-1.5 text-emerald-400 font-medium text-[11px] sm:text-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> 24 Districts Live Connected
            </span>
            <span className="text-slate-600">•</span>
            <span className="text-slate-300 font-medium truncate text-[11px] sm:text-xs">
              Govt. of Jharkhand • Department of Higher & Technical Education
            </span>
          </div>

          <div className="flex items-center gap-4 shrink-0 text-[11px]">
            <span className="hidden sm:inline-flex items-center gap-1 text-amber-400 font-bold bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
              <Award className="w-3 h-3" /> SIH 26043 Nodal Platform
            </span>
          </div>
        </div>
      </div>

      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-3.5 flex items-center justify-between gap-4">
        
        {/* Brand Logo */}
        <button 
          type="button"
          onClick={() => setActiveTab('submit')}
          className="flex items-center gap-3.5 group text-left cursor-pointer focus:outline-none"
        >
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/25 group-hover:scale-105 transition-all duration-300 border border-white/20">
            <ShieldCheck className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-xl font-extrabold text-white tracking-tight group-hover:text-blue-400 transition-colors">
                SETU <span className="text-gradient-blue">Jharkhand</span>
              </h1>
              <span className="text-[10px] font-bold bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded-full border border-blue-500/20">
                v2.4
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium hidden sm:block">
              Societal Innovation Collaboration Ecosystem
            </p>
          </div>
        </button>

        {/* Navigation Tabs (Desktop) */}
        <nav className="hidden lg:flex items-center gap-1 bg-[#0b1329]/80 p-1.5 rounded-2xl border border-white/10 shadow-inner">
          {visibleNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => { setActiveTab(item.id); setMobileMenuOpen(false); }}
                className={`flex items-center gap-2 px-4.5 py-2.5 rounded-xl text-xs font-bold transition-all duration-300 cursor-pointer ${
                  isActive 
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-600/35 border border-white/20 scale-[1.02]' 
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-blue-400'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Right Tools & Actions */}
        <div className="flex items-center gap-3">
          
          {/* Track Grievance Button */}
          <button
            type="button"
            onClick={onOpenTicketLookup}
            className="btn-secondary text-xs py-2.5 px-3.5 bg-[#0b1329] border-white/10 text-slate-200 hover:text-white hover:border-blue-500/50"
          >
            <Search className="w-3.5 h-3.5 text-blue-400" />
            <span className="hidden sm:inline">Track Ticket</span>
          </button>

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

          {/* Auth Button */}
          {isAuthenticated && user ? (
            <div className="flex items-center gap-2.5">
              <span className={`hidden md:inline-block text-[11px] font-bold px-3 py-1 rounded-xl border ${badge.color}`}>
                {badge.label}
              </span>
              <button
                type="button"
                onClick={logout}
                className="btn-secondary text-xs py-2.5 px-3.5 bg-[#0b1329] border-white/10 text-rose-400 hover:bg-rose-500/10 hover:border-rose-500/30"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Sign Out</span>
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => onOpenLogin(null)}
              className="btn-primary text-xs py-2.5 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold shadow-lg shadow-blue-600/25 border border-white/20"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Sign In</span>
            </button>
          )}

          {/* Mobile Menu Toggle */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2.5 rounded-xl bg-[#0b1329] border border-white/10 text-slate-300 hover:text-white"
          >
            {mobileMenuOpen ? <X className="w-5 h-5 text-rose-400" /> : <Menu className="w-5 h-5" />}
          </button>

        </div>

      </div>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-[#030712]/95 border-b border-white/10 p-5 space-y-4 animate-fade-in backdrop-blur-2xl">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-1">
            Institutional Dashboards
          </div>
          <div className="grid grid-cols-1 gap-2.5">
            {visibleNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => { setActiveTab(item.id); setMobileMenuOpen(false); }}
                  className={`flex items-center gap-3 p-3.5 rounded-xl text-xs font-bold transition-all text-left ${
                    isActive 
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-600/30' 
                      : 'bg-[#0b1329] text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-blue-400'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

    </header>
  );
}

export default Navbar;
