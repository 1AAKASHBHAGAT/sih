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
  CheckCircle2,
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
  const { language, setLanguage, t } = useLanguage();
  const { user, isAuthenticated, role, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const [langDropdownOpen, setLangDropdownOpen] = useState<boolean>(false);

  const navItems = [
    { id: 'submit', label: t('navSubmit') || 'Submit Issue', icon: Sparkles, roles: ['guest', 'citizen', 'university_admin', 'industry', 'government'] },
    { id: 'university', label: t('navUniversity') || 'University Queue', icon: Building2, roles: ['university_admin', 'government'] },
    { id: 'analytics', label: t('navAnalytics') || 'Gov Dashboard', icon: BarChart3, roles: ['government'] },
    { id: 'industry', label: t('navIndustry') || 'CSR Grants', icon: Briefcase, roles: ['industry', 'government'] },
  ];

  const visibleNavItems = navItems.filter(item => item.roles.includes(role) || role === 'government');

  const handleTabClick = (id: string) => {
    setActiveTab(id);
    setMobileMenuOpen(false);
  };

  const getRoleBadge = (r: UserRole) => {
    switch (r) {
      case 'government':
        return { label: 'Gov Admin', color: 'bg-amber-500/10 text-amber-400 border-amber-500/30' };
      case 'university_admin':
        return { label: 'University', color: 'bg-blue-500/10 text-blue-400 border-blue-500/30' };
      case 'industry':
        return { label: 'CSR Sponsor', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' };
      default:
        return { label: 'Citizen', color: 'bg-slate-800 text-slate-300 border-slate-700' };
    }
  };

  const badge = getRoleBadge(role);

  return (
    <header className="w-full sticky top-0 z-50 bg-[#070c18]/90 backdrop-blur-xl border-b border-slate-800/80 shadow-2xl">
      {/* Tri-Color Flag Line */}
      <div className="gov-tricolor-bar" aria-hidden="true" />

      {/* Top Utility Strip */}
      <div className="bg-[#040813] border-b border-slate-800/60 py-1.5 px-4 sm:px-8 text-xs text-slate-400">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5 truncate">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
            <span className="text-slate-300 font-medium truncate text-[11px] sm:text-xs">
              Govt. of Jharkhand • Department of Higher & Technical Education
            </span>
          </div>

          <div className="flex items-center gap-4 shrink-0 text-[11px]">
            <span className="hidden md:inline-flex items-center gap-1.5 text-emerald-400 font-semibold bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
              24 Districts Online
            </span>
            <span className="text-slate-400 font-mono">SIH 26043</span>
          </div>
        </div>
      </div>

      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-3 flex items-center justify-between gap-4">
        
        {/* Brand Logo */}
        <button 
          type="button"
          onClick={() => handleTabClick('submit')}
          className="flex items-center gap-3 group text-left cursor-pointer focus:outline-none"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/25 group-hover:scale-105 transition-transform">
            <ShieldCheck className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-bold text-white tracking-tight group-hover:text-blue-400 transition-colors">
                SETU Jharkhand
              </h1>
              <span className="text-[10px] font-semibold bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded border border-blue-500/20">
                SIH 2026
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              Societal Innovation Collaboration Portal
            </p>
          </div>
        </button>

        {/* Navigation Tabs (Desktop) */}
        <nav className="hidden lg:flex items-center gap-1 bg-[#0b1329] p-1.5 rounded-xl border border-slate-800">
          {visibleNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleTabClick(item.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  isActive 
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30' 
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-blue-400'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Right Tools & Actions */}
        <div className="flex items-center gap-2.5">
          
          {/* Track Grievance Button */}
          <button
            type="button"
            onClick={onOpenTicketLookup}
            className="btn-secondary text-xs py-2 px-3 sm:px-3.5 bg-[#0b1329] border-slate-800 text-slate-200 hover:text-white hover:border-blue-500/50"
          >
            <Search className="w-3.5 h-3.5 text-blue-400" />
            <span className="hidden sm:inline">Track Ticket</span>
          </button>

          {/* Language Switcher */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setLangDropdownOpen(!langDropdownOpen)}
              className="flex items-center gap-1.5 text-xs bg-[#0b1329] hover:bg-slate-800 text-slate-300 px-3 py-2 rounded-xl border border-slate-800 font-medium transition cursor-pointer"
            >
              <Globe className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden xs:inline">{language}</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {langDropdownOpen && (
              <div className="absolute right-0 mt-2 w-36 bg-[#0f172a] border border-slate-800 rounded-xl shadow-2xl overflow-hidden py-1 z-50">
                {['English', 'Hindi', 'Santali'].map(lang => (
                  <button
                    key={lang}
                    type="button"
                    onClick={() => {
                      setLanguage(lang);
                      setLangDropdownOpen(false);
                    }}
                    className={`w-full text-left px-3.5 py-2 text-xs font-medium hover:bg-blue-600 hover:text-white transition ${
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
            <div className="flex items-center gap-2">
              <span className={`hidden md:inline-block text-[11px] font-semibold px-2.5 py-1 rounded-lg border ${badge.color}`}>
                {badge.label}
              </span>
              <button
                type="button"
                onClick={logout}
                className="btn-secondary text-xs py-2 px-3 bg-[#0b1329] border-slate-800 text-rose-400 hover:bg-rose-500/10 hover:border-rose-500/30"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Sign Out</span>
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => onOpenLogin(null)}
              className="btn-primary text-xs py-2 px-3.5 sm:px-4 bg-blue-600 hover:bg-blue-500 text-white font-semibold shadow-lg shadow-blue-600/20"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Sign In</span>
            </button>
          )}

          {/* Mobile Menu Button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded-xl bg-[#0b1329] border border-slate-800 text-slate-300 hover:text-white"
          >
            {mobileMenuOpen ? <X className="w-5 h-5 text-rose-400" /> : <Menu className="w-5 h-5" />}
          </button>

        </div>

      </div>

      {/* Mobile Dropdown Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-[#070c18] border-b border-slate-800 p-4 space-y-3 animate-fade-in">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-2">
            Navigation
          </div>
          <div className="grid grid-cols-2 gap-2">
            {visibleNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleTabClick(item.id)}
                  className={`flex items-center gap-2.5 p-3 rounded-xl text-xs font-semibold transition-all text-left ${
                    isActive 
                      ? 'bg-blue-600 text-white font-bold' 
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
