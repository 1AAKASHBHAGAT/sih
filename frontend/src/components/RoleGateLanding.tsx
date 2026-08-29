import React from 'react';
import { 
  Users, 
  Building2, 
  BarChart3, 
  Briefcase, 
  ArrowRight, 
  ShieldCheck, 
  Sparkles, 
  Award,
  Globe2,
  CheckCircle2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';

interface RoleGateLandingProps {
  onSelectTier: (tabId: string, roleName: UserRole) => void;
  onOpenLogin: (role?: UserRole | null) => void;
}

function RoleGateLanding({ onSelectTier, onOpenLogin }: RoleGateLandingProps) {
  const { user, role } = useAuth();

  const TIERS = [
    {
      id: 'submit',
      role: 'citizen' as UserRole,
      title: 'Citizen Portal',
      subtitle: 'Grievance Reporting & Tracking',
      icon: Users,
      color: 'from-blue-600 to-cyan-500',
      borderColor: 'hover:border-blue-500/60',
      badgeColor: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
      description: 'Report civic, water, healthcare, or agricultural challenges. Get automated AI classification, priority scoring, & HEI lab routing.',
      features: [
        'AI Automated Grievance Routing',
        'Real-time GPS & District Tagging',
        'Official Grievance Ticket Receipt'
      ],
      btnLabel: 'Enter Citizen Portal',
    },
    {
      id: 'university',
      role: 'university_admin' as UserRole,
      title: 'University Nodal Center',
      subtitle: 'HEI R&D Challenge Workstation',
      icon: Building2,
      color: 'from-indigo-600 to-purple-500',
      borderColor: 'hover:border-indigo-500/60',
      badgeColor: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
      description: 'Review assigned societal challenges for your university. Assign faculty mentors, student R&D teams, & track project stages.',
      features: [
        '5-Stage Kanban Project Board',
        'Student & Mentor Team Assignment',
        'R&D Prototype Milestone Tracker'
      ],
      btnLabel: 'Enter University Interface',
    },
    {
      id: 'analytics',
      role: 'government' as UserRole,
      title: 'Government Executive',
      subtitle: 'Statewide Policy & GIS Dashboard',
      icon: BarChart3,
      color: 'from-amber-500 to-orange-500',
      borderColor: 'hover:border-amber-500/60',
      badgeColor: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
      description: 'Executive overview of 24 Jharkhand districts. Monitor sector domain distribution, resolution rates, & university performance.',
      features: [
        'Interactive Statewide GIS Map',
        'Sector Domain Resolution Analytics',
        'HEI Institutional Performance Rankings'
      ],
      btnLabel: 'Enter Executive Dashboard',
    },
    {
      id: 'industry',
      role: 'industry' as UserRole,
      title: 'Industry CSR Partner',
      subtitle: 'Corporate CSR Sponsorship Hub',
      icon: Briefcase,
      color: 'from-emerald-600 to-teal-500',
      borderColor: 'hover:border-emerald-500/60',
      badgeColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      description: 'Explore verified societal R&D projects requiring funding. Pledge Corporate Social Responsibility (CSR) grants directly.',
      features: [
        'Verified HEI R&D Project Catalog',
        'Direct CSR Financial Pledges',
        'Impact & Milestone Verification'
      ],
      btnLabel: 'Enter CSR Grants Hub',
    }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-8 py-10 space-y-12 animate-fade-in">
      
      {/* Tier Gate Header */}
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold tracking-wide">
          <Sparkles className="w-4 h-4 text-blue-400 animate-pulse" /> Select Institutional Access Tier
        </div>

        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-tight">
          Welcome to <span className="text-gradient-blue">SETU Jharkhand</span>
        </h1>

        <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
          Select your stakeholder profile to enter your customized interface. Every tier provides dedicated tools tailored for citizens, university R&D leads, government officers, and CSR partners.
        </p>
      </div>

      {/* 4 Stakeholder Tier Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {TIERS.map((tier) => {
          const Icon = tier.icon;
          return (
            <div 
              key={tier.id}
              className={`glass-card p-6 flex flex-col justify-between space-y-6 relative group border-white/10 ${tier.borderColor} transition-all duration-300 hover:scale-[1.02]`}
            >
              <div className="space-y-4">
                
                {/* Icon Header */}
                <div className="flex items-center justify-between">
                  <div className={`w-12 h-12 rounded-2xl bg-gradient-to-tr ${tier.color} flex items-center justify-center shadow-lg text-white border border-white/20`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${tier.badgeColor}`}>
                    TIER {tier.id === 'submit' ? '1' : tier.id === 'university' ? '2' : tier.id === 'analytics' ? '3' : '4'}
                  </span>
                </div>

                {/* Title & Subtitle */}
                <div>
                  <h3 className="text-lg font-extrabold text-white group-hover:text-blue-400 transition-colors">
                    {tier.title}
                  </h3>
                  <span className="text-xs font-semibold text-slate-400">
                    {tier.subtitle}
                  </span>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">
                  {tier.description}
                </p>

                {/* Feature Checklist */}
                <div className="space-y-2 pt-2 border-t border-white/10">
                  {tier.features.map((feat, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-[11px] text-slate-300 font-medium">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>

              </div>

              {/* Action Button */}
              <button
                type="button"
                onClick={() => onSelectTier(tier.id, tier.role)}
                className={`w-full btn-primary py-3 text-xs font-bold justify-center bg-gradient-to-r ${tier.color} shadow-lg cursor-pointer rounded-xl`}
              >
                <span>{tier.btnLabel}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

            </div>
          );
        })}
      </div>

    </div>
  );
}

export default RoleGateLanding;
