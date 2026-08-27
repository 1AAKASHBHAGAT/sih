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
  Phone
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

  const allNavItems = [
    { id: 'submit', label: t('navSubmit'), icon: Sparkles, roles: ['guest', 'citizen', 'university_admin', 'industry', 'government'], desc: 'Report societal challenges & track AI routing' },
    { id: 'university', label: t('navUniversity'), icon: Building2, roles: ['university_admin', 'government'], desc: 'Nodal university R&D & student team queue' },
    { id: 'analytics', label: t('navAnalytics'), icon: BarChart3, roles: ['government'], desc: 'State executive analytics & spatial GIS map' },
    { id: 'industry', label: t('navIndustry'), icon: Briefcase, roles: ['industry', 'government'], desc: 'CSR grants & corporate mentorship hub' },
  ];

  const visibleNavItems = allNavItems.filter(item => item.roles.includes(role) || role === 'government');

  const handleTabChange = (id: string) => {
    setActiveTab(id);
    setMobileMenuOpen(false);
  };

  const getRoleBadge = (r: UserRole) => {
    switch (r) {
      case 'government':
        return { label: 'Gov Executive', color: 'bg-amber-500/10 text-amber-400 border-amber-500/30' };
      case 'university_admin':
        return { label: 'University Admin', color: 'bg-blue-500/10 text-blue-400 border-blue-500/30' };
      case 'industry':
        return { label: 'Industry Partner', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' };
      case 'citizen':
        return { label: 'Citizen', color: 'bg-slate-800 text-slate-300 border-slate-700' };
      default:
        return { label: 'Visitor', color: 'bg-slate-800 text-slate-400 border-slate-700' };
    }
  };

  const badgeInfo = getRoleBadge(role);

  return (
    <header className="w-full sticky top-0 z-50 bg-[#080d1a] border-b border-[#1e2d54] shadow-2xl">
      
      {/* 1. Tri-Color Government Accent Bar */}
      <div className="gov-tricolor-bar" aria-hidden="true"></div>

      {/* 2. Top Nodal Strip */}
      <div className="bg-[#050914] border-b border-[#1e2d54] py-2 px-4 sm:px-8 lg:px-12 text-xs text-slate-300 w-full">
        <div className="w-full flex items-center justify-between">
          
          <div className="flex items-center gap-3">
            <img 
              src="/jharkhand_emblem.png" 
              alt="Jharkhand State Seal" 
              className="w-6 h-6 object-contain rounded-full border border-amber-500/40 shrink-0"
              onError={(e: any) => { e.target.style.display = 'none'; }}
            />
            <div className="flex items-center gap-2 text-[11px] font-bold">
              <span className="text-amber-400 uppercase tracking-wide">{t('govtTitle')}</span>
              <span className="text-slate-500" aria-hidden="true">•</span>
              <span className="text-slate-300 font-medium hidden sm:inline">{t('deptTitle')}</span>
            </div>
          </div>

          <div className="flex items-center gap-3 text-[11px] font-semibold">
            <span className="flex items-center gap-1.5 text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded border border-emerald-500/20 font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" aria-hidden="true"></span> {t('districtsConnected')}
            </span>
            <span className="hidden sm:inline text-blue-300 bg-blue-500/10 px-2.5 py-0.5 rounded border border-blue-500/20 font-bold">
              SIH 26043
            </span>
          </div>

        </div>
      </div>

      {/* 3. Main Header Bar */}
      <div className="bg-[#0e172e] px-4 sm:px-8 lg:px-12 w-full py-3">
        <div className="w-full flex items-center justify-between gap-4 h-14">
          
          {/* Logo & Portal Title */}
          <button 
            type="button"
            className="flex items-center gap-3.5 cursor-pointer group text-left focus-visible:ring-2 focus-visible:ring-blue-400 rounded-xl p-1" 
            onClick={() => setActiveTab('submit')}
            aria-label="Return to Citizen Challenge Submission Portal"
          >
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-600 via-indigo-700 to-slate-900 border border-blue-400/40 flex items-center justify-center shadow-lg shrink-0 group-hover:scale-105 transition-transform">
              <ShieldCheck className="w-6 h-6 text-white" aria-hidden="true" />
            </div>

            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-400 block leading-none mb-0.5">
                {t('socialRnd')}
              </span>
              <h1 className="text-base sm:text-lg font-extrabold text-white tracking-tight leading-tight group-hover:text-blue-300 transition-colors">
                {t('portalTitle')}
              </h1>
            </div>
          </button>

          {/* Right Action Tools */}
          <div className="flex items-center gap-3">
            
            {/* Track Ticket Button */}
            <button
              id="btn-track-ticket"
              type="button"
              onClick={onOpenTicketLookup}
              className="btn-secondary text-xs py-2 px-3.5 bg-[#111c38] border-[#1e2d54] hover:border-blue-400 text-white font-bold focus-visible:ring-2 focus-visible:ring-blue-400"
              aria-label="Track submission status by Grievance ID"
            >
              <Search className="w-4 h-4 text-blue-400" aria-hidden="true" />
              <span className="hidden sm:inline">{t('trackTicket')}</span>
            </button>

            {/* Language Selector Dropdown */}
            <div className="relative group hidden sm:block">
              <button 
                type="button"
                aria-haspopup="true"
                aria-label="Select Portal Language"
                className="flex items-center gap-1.5 text-xs bg-[#111c38] hover:bg-[#17264a] text-slate-200 px-3.5 py-2 rounded-xl border border-[#1e2d54] font-semibold transition cursor-pointer focus-visible:ring-2 focus-visible:ring-blue-400"
              >
                <Globe className="w-4 h-4 text-cyan-400" aria-hidden="true" />
                <span>{language === 'Hindi' ? 'हिन्दी' : language === 'Santali' ? 'ᱥᱟᱱᱛᱟᱲᱤ' : 'English'}</span>
              </button>
              <div className="absolute right-0 top-full mt-1 hidden group-hover:block bg-[#0e172e] border border-[#1e2d54] rounded-xl shadow-2xl overflow-hidden text-xs z-50 w-40">
                {[
                  { id: 'English', label: 'English' },
                  { id: 'Hindi', label: 'हिन्दी (Hindi)' },
                  { id: 'Santali', label: 'ᱥᱟᱱᱛᱟᱲᱤ (Santali)' }
                ].map((lang) => (
                  <button
                    key={lang.id}
                    type="button"
                    onClick={() => setLanguage(lang.id)}
                    className={`w-full text-left px-4 py-2.5 hover:bg-blue-600 hover:text-white font-semibold transition cursor-pointer ${
                      language === lang.id ? 'bg-blue-600 text-white font-bold' : 'text-slate-300'
                    }`}
                  >
                    {lang.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Authentication Button & Profile Badge */}
            {isAuthenticated && user ? (
              <div className="flex items-center gap-2.5">
                <div className={`hidden md:flex flex-col items-end px-3 py-1 rounded-xl border ${badgeInfo.color} text-xs`}>
                  <span className="font-bold text-white text-xs leading-none mb-0.5">{user.full_name.split(' ')[0]}</span>
                  <span className="text-[10px] font-mono uppercase tracking-wider">{badgeInfo.label}</span>
                </div>
                <button
                  type="button"
                  onClick={logout}
                  className="btn-secondary text-xs py-2 px-3 bg-[#111c38] border-[#1e2d54] hover:border-rose-400 text-slate-300 hover:text-white font-bold hidden sm:flex focus-visible:ring-2 focus-visible:ring-blue-400"
                  aria-label="Sign Out of user account"
                >
                  <LogOut className="w-4 h-4 text-rose-400" aria-hidden="true" />
                  <span>Sign Out</span>
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => onOpenLogin(null)}
                className="btn-primary text-xs py-2 px-4 bg-blue-600 hover:bg-blue-500 text-white font-bold shadow-lg hidden sm:flex focus-visible:ring-2 focus-visible:ring-blue-400"
                aria-label="Sign In to official user account"
              >
                <LogIn className="w-4 h-4" aria-hidden="true" />
                <span>Sign In</span>
              </button>
            )}

            {/* Mobile Hamburger 3-Line Menu Button */}
            <button
              id="btn-mobile-menu"
              type="button"
              className="lg:hidden btn-secondary py-2 px-3 bg-[#111c38] border-[#1e2d54] hover:border-blue-400 text-white font-bold flex items-center gap-1.5 cursor-pointer shadow-md focus-visible:ring-2 focus-visible:ring-blue-400"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle navigation drawer"
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? (
                <>
                  <X className="w-4 h-4 text-rose-400" aria-hidden="true" />
                  <span className="text-xs font-bold text-slate-200">Close</span>
                </>
              ) : (
                <>
                  <Menu className="w-4 h-4 text-blue-400" aria-hidden="true" />
                  <span className="text-xs font-bold text-slate-200">Menu</span>
                </>
              )}
            </button>

          </div>

        </div>
      </div>

      {/* 4. SPECIAL HORIZONTAL NAVIGATION TAB COMPONENT */}
      <nav 
        aria-label="Portal Workspace Navigation" 
        className="special-horizontal-nav w-full px-4 sm:px-8 lg:px-12"
      >
        <div 
          role="tablist" 
          aria-label="Main Dashboards"
          className="w-full flex items-center justify-between gap-3 overflow-x-auto pb-1"
        >
          {visibleNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                id={`special-nav-tab-${item.id}`}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => handleTabChange(item.id)}
                className={`special-nav-tab focus-visible:ring-2 focus-visible:ring-blue-400 ${isActive ? 'special-nav-tab-active' : ''}`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-blue-400'}`} aria-hidden="true" />
                <span className="truncate">{item.label}</span>
                {isActive && <CheckCircle2 className="w-4 h-4 text-cyan-300 ml-1 shrink-0" aria-hidden="true" />}
              </button>
            );
          })}
        </div>
      </nav>

      {/* HIGH-TRUST SLIDE-OUT PORTAL DRAWER */}
      {mobileMenuOpen && (
        <div 
          role="dialog"
          aria-modal="true"
          aria-label="Mobile Navigation Drawer"
          className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-md flex justify-end animate-fade-in"
        >
          <div className="w-full max-w-sm sm:max-w-md bg-[#080d1a] border-l border-[#1e2d54] p-6 shadow-2xl space-y-6 overflow-y-auto h-full flex flex-col justify-between">
            
            <div className="space-y-6">
              
              <div className="flex items-center justify-between border-b border-[#1e2d54] pb-4">
                <div className="flex items-center gap-3">
                  <img 
                    src="/jharkhand_emblem.png" 
                    alt="Jharkhand State Seal" 
                    className="w-7 h-7 object-contain rounded-full border border-amber-500/40"
                    onError={(e: any) => { e.target.style.display = 'none'; }}
                  />
                  <div>
                    <h3 className="font-bold text-white text-sm">State Nodal Portal Menu</h3>
                    <span className="text-[10px] text-amber-400 uppercase font-mono tracking-wider">Government of Jharkhand</span>
                  </div>
                </div>
                
                <button 
                  type="button"
                  onClick={() => setMobileMenuOpen(false)}
                  aria-label="Close navigation drawer"
                  className="btn-secondary py-1.5 px-2.5 text-xs font-bold text-slate-300 shrink-0"
                >
                  <X className="w-5 h-5 text-slate-300" aria-hidden="true" />
                </button>
              </div>

              <div className="bg-[#0e172e] p-4 rounded-2xl border border-[#1e2d54] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-300">Account Identity</span>
                  <span className={`text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded border ${badgeInfo.color}`}>
                    {badgeInfo.label}
                  </span>
                </div>

                {isAuthenticated && user ? (
                  <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-600/20 border border-blue-400/40 flex items-center justify-center font-bold text-white font-mono">
                        {user.full_name.charAt(0)}
                      </div>
                      <div>
                        <h4 className="font-bold text-white text-sm">{user.full_name}</h4>
                        <span className="text-xs text-slate-300 font-mono">{user.email}</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => { logout(); setMobileMenuOpen(false); }}
                      className="btn-secondary text-xs py-2 px-3 bg-rose-500/10 border-rose-500/30 text-rose-300 font-bold shrink-0"
                    >
                      <LogOut className="w-4 h-4" aria-hidden="true" /> Sign Out
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between pt-1">
                    <div className="text-xs text-slate-200">
                      Sign in with OTP to access institutional dashboards
                    </div>
                    <button
                      type="button"
                      onClick={() => { onOpenLogin(null); setMobileMenuOpen(false); }}
                      className="btn-primary text-xs py-2.5 px-4 bg-blue-600 hover:bg-blue-500 font-bold shrink-0"
                    >
                      <LogIn className="w-4 h-4" aria-hidden="true" /> Sign In
                    </button>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-300">Navigation Dashboards</span>
                <div className="space-y-2 pt-1">
                  {visibleNavItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => handleTabChange(item.id)}
                        className={`w-full text-left p-3.5 rounded-xl text-xs transition-all cursor-pointer flex items-center justify-between border ${
                          isActive
                            ? 'bg-blue-600 text-white border-blue-400 shadow-lg'
                            : 'bg-[#0e172e] text-slate-200 border-[#1e2d54] hover:bg-slate-900'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-blue-400'}`} aria-hidden="true" />
                          <div>
                            <div className="font-bold text-sm">{item.label}</div>
                            <div className="text-[11px] text-slate-300 font-normal">{item.desc}</div>
                          </div>
                        </div>
                        {isActive && <CheckCircle2 className="w-5 h-5 text-cyan-300 shrink-0" aria-hidden="true" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-3 border-t border-[#1e2d54] pt-4">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-300 block">Citizen Services & Tools</span>
                
                <button
                  type="button"
                  onClick={() => { onOpenTicketLookup(); setMobileMenuOpen(false); }}
                  className="w-full btn-secondary py-3 px-4 text-xs font-bold bg-[#0e172e] border-[#2a3b63]/80 text-white justify-between"
                >
                  <span className="flex items-center gap-2">
                    <Search className="w-4 h-4 text-blue-400" aria-hidden="true" /> Track Grievance Status by ID
                  </span>
                  <span className="text-[10px] font-mono text-blue-300">SIH-JH-XXXX</span>
                </button>

                <div className="bg-[#0e172e] p-3 rounded-xl border border-[#1e2d54] space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-300 block">Select Portal Language:</span>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'English', label: 'English' },
                      { id: 'Hindi', label: 'हिन्दी' },
                      { id: 'Santali', label: 'ᱥᱟᱱᱛᱟᱲᱤ' }
                    ].map((lang) => (
                      <button
                        key={lang.id}
                        type="button"
                        onClick={() => { setLanguage(lang.id); setMobileMenuOpen(false); }}
                        className={`py-2 px-2 text-center text-xs rounded-xl font-bold border cursor-pointer transition ${
                          language === lang.id
                            ? 'bg-blue-600 border-blue-400 text-white'
                            : 'bg-[#080d1a] border-[#1e2d54] text-slate-300'
                        }`}
                      >
                        {lang.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

            </div>

            <div className="pt-4 border-t border-[#1e2d54] text-xs text-slate-300 space-y-1">
              <div className="flex items-center gap-2 text-amber-400 font-bold text-xs">
                <Phone className="w-4 h-4" aria-hidden="true" /> State Nodal Helpline: 1800-345-6789
              </div>
              <p className="text-[11px] text-slate-400">
                Department of Higher & Technical Education, Govt. of Jharkhand
              </p>
            </div>

          </div>
        </div>
      )}

    </header>
  );
}

export default Navbar;
