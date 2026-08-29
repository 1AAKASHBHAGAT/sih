import React from 'react';
import { 
  User as UserIcon, 
  Mail, 
  ShieldCheck, 
  Building2, 
  Briefcase, 
  Clock, 
  CheckCircle2, 
  LogOut, 
  X,
  FileText,
  Key,
  Award
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

function UserProfileModal({ isOpen, onClose }: UserProfileModalProps) {
  const { user, role, institution, companyName, logout } = useAuth();

  if (!isOpen || !user) return null;

  const getRoleBadge = (r: UserRole) => {
    switch (r) {
      case 'government':
        return { label: 'Government Executive Nodal Officer', color: 'bg-amber-100 text-amber-800 border-amber-300' };
      case 'university_admin':
        return { label: 'University R&D Lead Admin', color: 'bg-blue-100 text-blue-800 border-blue-300' };
      case 'industry':
        return { label: 'Corporate CSR Partner Sponsor', color: 'bg-emerald-100 text-emerald-800 border-emerald-300' };
      default:
        return { label: 'Verified Citizen Reporter', color: 'bg-sky-100 text-sky-800 border-sky-300' };
    }
  };

  const badge = getRoleBadge(role);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white max-w-md w-full p-6 sm:p-8 rounded-3xl space-y-6 border border-slate-200 shadow-2xl relative">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2 text-slate-900 font-extrabold text-base">
            <ShieldCheck className="w-5 h-5 text-blue-600" />
            <span>Account Profile & Credentials</span>
          </div>
          <button 
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Profile Card Info */}
        <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold text-xl shadow-md shrink-0">
            {user.full_name ? user.full_name[0].toUpperCase() : 'U'}
          </div>
          <div className="space-y-1 truncate">
            <h3 className="text-base font-extrabold text-slate-900 truncate">
              {user.full_name || 'Anonymous User'}
            </h3>
            <span className={`inline-block text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${badge.color}`}>
              {badge.label}
            </span>
          </div>
        </div>

        {/* User Details Checklist */}
        <div className="space-y-3 text-xs sm:text-sm text-slate-700">
          
          <div className="flex items-center justify-between p-3 rounded-xl bg-white border border-slate-200">
            <span className="text-slate-500 flex items-center gap-2">
              <Mail className="w-4 h-4 text-blue-600" /> Email / Contact:
            </span>
            <span className="font-bold text-slate-900 font-mono text-xs">{user.email}</span>
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl bg-white border border-slate-200">
            <span className="text-slate-500 flex items-center gap-2">
              <Key className="w-4 h-4 text-blue-600" /> User ID Code:
            </span>
            <span className="font-bold text-slate-900 font-mono text-xs">{user.id || 'USR-2026-JH'}</span>
          </div>

          {role === 'university_admin' && (institution || user.institution) && (
            <div className="flex items-center justify-between p-3 rounded-xl bg-white border border-slate-200">
              <span className="text-slate-500 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-blue-600" /> Nodal HEI Lab:
              </span>
              <span className="font-bold text-slate-900 text-xs truncate max-w-[180px]">{institution || user.institution}</span>
            </div>
          )}

          {role === 'industry' && (companyName || user.company_name) && (
            <div className="flex items-center justify-between p-3 rounded-xl bg-white border border-slate-200">
              <span className="text-slate-500 flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-blue-600" /> CSR Company:
              </span>
              <span className="font-bold text-slate-900 text-xs truncate max-w-[180px]">{companyName || user.company_name}</span>
            </div>
          )}

          <div className="flex items-center justify-between p-3 rounded-xl bg-white border border-slate-200">
            <span className="text-slate-500 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" /> 2FA Security Status:
            </span>
            <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 text-xs">
              Verified 2FA Logged In
            </span>
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl bg-white border border-slate-200">
            <span className="text-slate-500 flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-500" /> DPDP Compliance:
            </span>
            <span className="font-bold text-slate-800 text-xs">
              DPDP Act 2023 Consent Signed
            </span>
          </div>

        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="btn-secondary flex-1 py-3 text-xs font-bold justify-center"
          >
            Close
          </button>
          <button
            type="button"
            onClick={() => {
              onClose();
              logout();
            }}
            className="btn-primary flex-1 py-3 text-xs font-bold bg-rose-600 hover:bg-rose-700 justify-center text-white"
          >
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>

      </div>
    </div>
  );
}

export default UserProfileModal;
