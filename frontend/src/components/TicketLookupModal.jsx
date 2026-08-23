import React, { useState } from 'react';
import { Search, X, Building2, CheckCircle2, Bell, Smartphone, ShieldCheck } from 'lucide-react';
import { getProblemByTicket, getNotificationsForTicket } from '../services/api';

function TicketLookupModal({ isOpen, onClose }) {
  const [ticketInput, setTicketInput] = useState('');
  const [problemData, setProblemData] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!ticketInput.trim()) return;
    setLoading(true);
    setError('');
    setProblemData(null);
    setNotifications([]);

    try {
      const [probRes, notifRes] = await Promise.allSettled([
        getProblemByTicket(ticketInput.trim()),
        getNotificationsForTicket(ticketInput.trim())
      ]);

      if (probRes.status === 'fulfilled' && probRes.value?.data) {
        setProblemData(probRes.value.data);
      } else {
        throw new Error(probRes.reason?.response?.data?.detail || 'Ticket not found. Please verify tracking code (e.g. SIH-JH-1042).');
      }

      if (notifRes.status === 'fulfilled' && notifRes.value?.data) {
        setNotifications(notifRes.value.data);
      }
    } catch (err) {
      setError(err.message || 'Ticket not found. Please verify tracking code (e.g. SIH-JH-1042).');
    } finally {
      setLoading(false);
    }
  };

  const STAGES = ['Submitted', 'Assigned', 'In Progress', 'Testing', 'Deployed'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl animate-fade-in">
      <div className="glass-card w-full max-w-2xl p-6 sm:p-8 relative border border-blue-500/30 shadow-2xl max-h-[90vh] overflow-y-auto">
        
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-white p-1.5 rounded-xl hover:bg-slate-800 transition cursor-pointer focus-visible:ring-2 focus-visible:ring-blue-400"
          aria-label="Close ticket tracking modal"
        >
          <X className="w-5 h-5" aria-hidden="true" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 shadow-lg shadow-blue-500/20 shrink-0">
            <Search className="w-6 h-6" aria-hidden="true" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">Track Challenge Ticket & SMS Log</h3>
            <p className="text-xs text-slate-400">Lookup real-time status & SMS delivery dispatch history (e.g. SIH-JH-1024)</p>
          </div>
        </div>

        {/* Search Input Form */}
        <form onSubmit={handleSearch} className="flex gap-2 mb-6">
          <input
            type="text"
            className="form-input text-sm font-mono uppercase tracking-wider font-bold"
            placeholder="e.g. SIH-JH-1024"
            value={ticketInput}
            onChange={(e) => setTicketInput(e.target.value)}
            required
            aria-label="Enter Ticket Code"
          />
          <button type="submit" className="btn-primary py-2.5 px-6 text-xs font-bold" disabled={loading}>
            {loading ? 'Searching...' : 'Search'}
          </button>
        </form>

        {/* Error Notification */}
        {error && (
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-bold mb-4" role="alert">
            {error}
          </div>
        )}

        {/* Result Card */}
        {problemData && (
          <div className="bg-[#080d1a] rounded-2xl p-5 sm:p-6 border border-[#1e2d54] space-y-6">
            <div className="flex items-center justify-between border-b border-[#1e2d54] pb-4">
              <div>
                <span className="text-xs font-extrabold text-blue-400 bg-blue-500/10 px-2.5 py-0.5 rounded border border-blue-500/20 font-mono">
                  {problemData.ticket_code}
                </span>
                <h4 className="text-base font-bold text-white mt-1.5 leading-snug">{problemData.title}</h4>
              </div>
              <span className={`badge badge-${problemData.status.toLowerCase().replace(/\s+/g, '')}`}>
                {problemData.status}
              </span>
            </div>

            <p className="text-xs text-slate-300 line-clamp-3 leading-relaxed">{problemData.description}</p>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="bg-[#0e172e] p-3 rounded-xl border border-[#1e2d54]">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">AI Category</span>
                <span className="text-cyan-400 font-bold">{problemData.ai_predicted_category}</span>
              </div>
              <div className="bg-[#0e172e] p-3 rounded-xl border border-[#1e2d54]">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Location</span>
                <span className="text-slate-200 font-semibold">{problemData.district}</span>
              </div>
            </div>

            <div className="bg-[#0e172e] p-3.5 rounded-xl border border-[#1e2d54] flex items-start gap-2.5">
              <Building2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" aria-hidden="true" />
              <div>
                <span className="text-slate-400 text-[10px] uppercase font-bold block">Assigned HEI Research Hub</span>
                <span className="text-emerald-300 font-bold text-xs">{problemData.assigned_university}</span>
              </div>
            </div>

            {/* 5-Step Lifecycle Progress Stepper */}
            <div className="pt-2 border-t border-[#1e2d54]">
              <span className="text-[11px] font-bold text-slate-400 block mb-3 uppercase tracking-wider">
                R&D Project Progress Timeline
              </span>
              <div className="flex items-center justify-between text-xs relative">
                {STAGES.map((stage, idx) => {
                  const isCurrent = problemData.status === stage;
                  const currentIndex = STAGES.indexOf(problemData.status);
                  const isPassed = currentIndex >= idx;

                  return (
                    <div key={stage} className="flex flex-col items-center gap-1.5 z-10">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                        isCurrent ? 'bg-blue-600 text-white ring-4 ring-blue-500/30 shadow-lg shadow-blue-500/50' :
                        isPassed ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' :
                        'bg-slate-800 text-slate-500 border border-slate-700'
                      }`}>
                        {isPassed ? <CheckCircle2 className="w-4 h-4 text-emerald-400" aria-hidden="true" /> : idx + 1}
                      </div>
                      <span className={`text-[10px] text-center font-semibold ${isCurrent ? 'text-blue-400 font-bold' : isPassed ? 'text-slate-200' : 'text-slate-500'}`}>
                        {stage}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* REAL-TIME IN-APP SMS & SYSTEM NOTIFICATION ACTIVITY FEED */}
            <div className="pt-4 border-t border-[#1e2d54] space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-emerald-400" aria-hidden="true" /> SMS & Lifecycle Activity Feed
                </span>
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 font-bold">
                  Live Dispatch Ledger
                </span>
              </div>

              {notifications.length === 0 ? (
                <div className="bg-[#0e172e] p-4 rounded-xl border border-[#1e2d54] text-xs text-slate-400 text-center">
                  No SMS notification dispatches recorded yet for this ticket.
                </div>
              ) : (
                <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1">
                  {notifications.map((notif) => (
                    <div key={notif.id} className="bg-[#0e172e] p-3 rounded-xl border border-[#1e2d54] space-y-1.5">
                      <div className="flex items-center justify-between text-[10px] font-mono">
                        <span className="text-blue-400 font-bold flex items-center gap-1">
                          <Bell className="w-3 h-3" aria-hidden="true" /> {notif.event_type}
                        </span>
                        <span className="text-slate-400">
                          {new Date(notif.created_at).toLocaleString('en-IN', { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' })}
                        </span>
                      </div>
                      <p className="text-xs text-slate-200 leading-relaxed font-sans">{notif.message}</p>
                      <div className="flex items-center justify-between text-[10px] text-slate-400 pt-0.5 font-mono">
                        <span>Recipient: {notif.recipient_contact || '+91 94311 02931'}</span>
                        <span className="text-emerald-400 font-bold">✓ {notif.channel} ({notif.status})</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        )}

      </div>
    </div>
  );
}

export default TicketLookupModal;
