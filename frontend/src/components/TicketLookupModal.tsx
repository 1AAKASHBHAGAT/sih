import React, { useState, FormEvent } from 'react';
import { Search, X, Building2, CheckCircle2, Bell, Smartphone } from 'lucide-react';
import { getProblemByTicket, getNotificationsForTicket } from '../services/api';
import { NotificationItem } from '../types';

interface TicketLookupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

function TicketLookupModal({ isOpen, onClose }: TicketLookupModalProps) {
  const [ticketInput, setTicketInput] = useState<string>('');
  const [problemData, setProblemData] = useState<any | null>(null);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  if (!isOpen) return null;

  const handleSearch = async (e: FormEvent) => {
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
        const reason: any = (probRes as PromiseRejectedResult).reason;
        throw new Error(reason?.response?.data?.detail || 'Ticket not found. Please verify tracking code (e.g. SIH-JH-1042).');
      }

      if (notifRes.status === 'fulfilled' && notifRes.value?.data) {
        setNotifications(notifRes.value.data);
      }
    } catch (err: any) {
      setError(err.message || 'Ticket not found. Please verify tracking code (e.g. SIH-JH-1042).');
    } finally {
      setLoading(false);
    }
  };

  const STAGES = ['Submitted', 'Assigned', 'In Progress', 'Testing', 'Deployed'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-fade-in">
      <div className="bg-white w-full max-w-2xl p-6 sm:p-8 relative border border-slate-200 shadow-2xl max-h-[90vh] overflow-y-auto rounded-3xl">
        
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-slate-900 p-1.5 rounded-xl hover:bg-slate-100 transition cursor-pointer focus-visible:ring-2 focus-visible:ring-blue-400"
          aria-label="Close ticket tracking modal"
        >
          <X className="w-5 h-5" aria-hidden="true" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-blue-100 border border-blue-200 flex items-center justify-center text-blue-600 shadow-sm shrink-0">
            <Search className="w-6 h-6" aria-hidden="true" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-900">Track Challenge Ticket & SMS Log</h3>
            <p className="text-xs text-slate-500">Lookup real-time status & SMS delivery dispatch history (e.g. SIH-JH-1024)</p>
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
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold mb-4" role="alert">
            {error}
          </div>
        )}

        {/* Result Card */}
        {problemData && (
          <div className="bg-slate-50 rounded-2xl p-5 sm:p-6 border border-slate-200 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <div>
                <span className="text-xs font-extrabold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded border border-blue-200 font-mono">
                  {problemData.ticket_code}
                </span>
                <h4 className="text-base font-bold text-slate-900 mt-1.5 leading-snug">{problemData.title}</h4>
              </div>
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded border border-emerald-200">
                {problemData.status}
              </span>
            </div>

            <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">{problemData.description}</p>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="bg-white p-3 rounded-xl border border-slate-200">
                <span className="text-slate-500 block text-[10px] uppercase font-bold">AI Category</span>
                <span className="text-blue-700 font-bold">{problemData.domain || problemData.ai_predicted_category}</span>
              </div>
              <div className="bg-white p-3 rounded-xl border border-slate-200">
                <span className="text-slate-500 block text-[10px] uppercase font-bold">Location</span>
                <span className="text-slate-800 font-semibold">{problemData.district}</span>
              </div>
            </div>

            <div className="bg-white p-3.5 rounded-xl border border-slate-200 flex items-start gap-2.5">
              <Building2 className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" aria-hidden="true" />
              <div>
                <span className="text-slate-500 text-[10px] uppercase font-bold block">Assigned HEI Research Hub</span>
                <span className="text-blue-700 font-bold text-xs">{problemData.assigned_university}</span>
              </div>
            </div>

            {/* 5-Step Lifecycle Progress Stepper */}
            <div className="pt-2 border-t border-slate-200">
              <span className="text-[11px] font-bold text-slate-500 block mb-3 uppercase tracking-wider">
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
                        isCurrent ? 'bg-blue-600 text-white ring-4 ring-blue-200 shadow-md' :
                        isPassed ? 'bg-emerald-100 text-emerald-700 border border-emerald-300' :
                        'bg-slate-100 text-slate-500 border border-slate-300'
                      }`}>
                        {isPassed ? <CheckCircle2 className="w-4 h-4 text-emerald-600" aria-hidden="true" /> : idx + 1}
                      </div>
                      <span className={`text-[10px] text-center font-semibold ${isCurrent ? 'text-blue-700 font-bold' : isPassed ? 'text-slate-800' : 'text-slate-400'}`}>
                        {stage}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* REAL-TIME IN-APP SMS & SYSTEM NOTIFICATION ACTIVITY FEED */}
            <div className="pt-4 border-t border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-blue-600" aria-hidden="true" /> SMS & Lifecycle Activity Feed
                </span>
                <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-bold">
                  Live Dispatch Ledger
                </span>
              </div>

              {notifications.length === 0 ? (
                <div className="bg-white p-4 rounded-xl border border-slate-200 text-xs text-slate-500 text-center">
                  No SMS notification dispatches recorded yet for this ticket.
                </div>
              ) : (
                <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1">
                  {notifications.map((notif: any) => (
                    <div key={notif.id} className="bg-white p-3 rounded-xl border border-slate-200 space-y-1.5">
                      <div className="flex items-center justify-between text-[10px] font-mono">
                        <span className="text-blue-700 font-bold flex items-center gap-1">
                          <Bell className="w-3 h-3" aria-hidden="true" /> {notif.event_type}
                        </span>
                        <span className="text-slate-500">
                          {new Date(notif.created_at).toLocaleString('en-IN', { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' })}
                        </span>
                      </div>
                      <p className="text-xs text-slate-700 leading-relaxed font-sans">{notif.message}</p>
                      <div className="flex items-center justify-between text-[10px] text-slate-500 pt-0.5 font-mono">
                        <span>Recipient: {notif.recipient_contact || '+91 94311 02931'}</span>
                        <span className="text-emerald-700 font-bold">✓ {notif.channel || 'SMS'} ({notif.status || 'SENT'})</span>
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
