import React from 'react';
import { ShieldAlert, LogIn, Lock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

function ProtectedRoute({ allowedRoles, children, pageTitle, onOpenLogin }) {
  const { user, isAuthenticated, role } = useAuth();

  if (!isAuthenticated) {
    return (
      <div className="w-full max-w-3xl mx-auto py-20 px-4 text-center">
        <div className="full-screen-card p-8 sm:p-10 border border-[#1e2d54] bg-[#0e172e] shadow-2xl space-y-5">
          <div className="w-14 h-14 rounded-2xl bg-blue-500/10 border border-blue-500/30 text-blue-400 flex items-center justify-center mx-auto shadow-lg">
            <Lock className="w-7 h-7" />
          </div>

          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Authentication Required
            </span>
            <h2 className="text-2xl font-bold text-white mb-2">
              Sign In Required for {pageTitle}
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-lg mx-auto leading-relaxed">
              Access to this dashboard is restricted to authorized departmental accounts ({allowedRoles.join(', ')}).
            </p>
          </div>

          <button
            onClick={() => onOpenLogin(allowedRoles[0])}
            className="btn-primary py-3.5 px-6 text-sm font-bold justify-center mx-auto bg-blue-600 hover:bg-blue-500 rounded-xl"
          >
            <LogIn className="w-4 h-4" /> Sign In to Continue
          </button>
        </div>
      </div>
    );
  }

  if (!allowedRoles.includes(role)) {
    return (
      <div className="w-full max-w-3xl mx-auto py-20 px-4 text-center">
        <div className="full-screen-card p-8 sm:p-10 border border-rose-500/30 bg-[#0e172e] shadow-2xl space-y-5">
          <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-center justify-center mx-auto shadow-lg">
            <ShieldAlert className="w-7 h-7" />
          </div>

          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-rose-400 block mb-1">
              403 Forbidden · Role Restricted
            </span>
            <h2 className="text-2xl font-bold text-white mb-2">
              Access Denied for Role '{role}'
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-lg mx-auto leading-relaxed">
              Your account ('{user.email}') is signed in as <span className="font-bold text-white">{role}</span>, which is not authorized to access {pageTitle}.
            </p>
          </div>

          <div className="flex gap-3 justify-center">
            <button
              onClick={() => onOpenLogin(allowedRoles[0])}
              className="btn-secondary py-3 px-5 text-xs font-bold bg-[#080d1a] border-[#2a3b63]/80 text-slate-200"
            >
              Switch Account
            </button>
          </div>
        </div>
      </div>
    );
  }

  return children;
}

export default ProtectedRoute;
