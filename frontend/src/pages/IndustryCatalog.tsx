import React, { useState, useEffect, FormEvent } from 'react';
import { 
  Briefcase, 
  Sparkles,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import { getProblems, submitCSRPledge, getAllPledges } from '../services/api';
import { useLanguage } from '../context/LanguageContext';
import { Problem, CSRPledge } from '../types';

const COMPANY_SUGGESTIONS = [
  "Tata Steel CSR Division",
  "Coal India Ltd (CIL CSR)",
  "NTPC Limited - Eastern Region",
  "JSPL Foundation",
  "Usha Martin CSR"
];

function IndustryCatalog() {
  const { t } = useLanguage();
  const [problems, setProblems] = useState<Problem[]>([]);
  const [pledges, setPledges] = useState<CSRPledge[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [pledgeModalProblem, setPledgeModalProblem] = useState<Problem | null>(null);
  const [pledgeSuccess, setPledgeSuccess] = useState<string | null>(null);

  const [selectedDomain, setSelectedDomain] = useState<string>("All");

  const [pledgeForm, setPledgeForm] = useState({
    company_name: 'Tata Steel CSR Division',
    contact_person: 'Ravi Desai (CSR Head)',
    email: 'csr@tatasteel.com',
    pledge_type: 'Grant Funding',
    amount: 150000,
    notes: 'Approved under Corporate Social Responsibility Innovation Fund 2026.'
  });

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [probRes, pledgeRes] = await Promise.all([
        getProblems(),
        getAllPledges()
      ]);
      setProblems(probRes.data);
      setPledges(pledgeRes.data);
    } catch (err) {
      console.error(err);
      setError('Unable to connect to backend API.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handlePledgeSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!pledgeModalProblem) return;
    try {
      await submitCSRPledge(pledgeModalProblem.id, pledgeForm);
      setPledgeModalProblem(null);
      setPledgeSuccess(`CSR Pledge of ₹${pledgeForm.amount.toLocaleString('en-IN')} submitted successfully.`);
      setTimeout(() => setPledgeSuccess(null), 5000);
      loadData();
    } catch (err) {
      alert('Failed to submit CSR pledge.');
    }
  };

  const filteredProblems = selectedDomain === "All"
    ? problems
    : problems.filter(p => p.domain === selectedDomain || (p as any).ai_predicted_category === selectedDomain || (p as any).user_category === selectedDomain);

  const totalCommitted = pledges.reduce((acc, curr) => acc + (curr.pledge_amount || (curr as any).amount || 0), 0);

  if (loading) {
    return (
      <div className="w-full max-w-[1720px] mx-auto py-24 px-4 text-center" role="status" aria-live="polite">
        <div className="inline-flex items-center gap-3 text-slate-200 font-medium text-sm animate-pulse full-screen-card px-8 py-5 border-[#1e2d54]">
          <Sparkles className="w-5 h-5 animate-spin text-blue-400" aria-hidden="true" /> Loading Industry CSR Discovery Engine...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full max-w-2xl mx-auto py-16 px-4 text-center" role="alert">
        <div className="full-screen-card p-8 border border-rose-500/30 bg-[#0e172e]">
          <AlertCircle className="w-10 h-10 text-rose-400 mx-auto mb-3" aria-hidden="true" />
          <h2 className="text-lg font-bold text-white mb-2">Backend API Disconnected</h2>
          <p className="text-xs text-slate-300 mb-6">{error}</p>
          <button type="button" onClick={loadData} className="btn-primary text-xs justify-center mx-auto py-2.5 px-4 font-bold bg-blue-600 focus-visible:ring-2 focus-visible:ring-blue-400">
            <RefreshCw className="w-4 h-4" aria-hidden="true" /> Retry Connection
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[1720px] mx-auto py-10 sm:py-16 px-4 sm:px-8 lg:px-12 flex flex-col gap-10 sm:gap-12">
      
      {/* Success Notification */}
      {pledgeSuccess && (
        <div role="status" aria-live="polite" className="fixed top-24 right-6 z-50 full-screen-card p-4 border border-blue-500/40 text-blue-300 text-xs font-semibold max-w-md shadow-2xl bg-[#0e172e]">
          {pledgeSuccess}
        </div>
      )}

      {/* Page Header */}
      <header className="space-y-5 border-b border-[#1e2d54]/80 pb-8 w-full">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="text-xs font-semibold tracking-wider text-slate-300 uppercase mb-1.5">
              Government of Jharkhand · Industry CSR Grants
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
              {t('industryPageTitle')}
            </h1>
            <p className="text-xs sm:text-sm text-slate-200 mt-1.5 leading-relaxed max-w-5xl">
              {t('industryPageDesc')}
            </p>
          </div>

          {/* Running Total KPI */}
          <div className="border border-[#1e2d54] bg-[#0e172e] p-5 rounded-2xl shrink-0 text-left shadow-lg">
            <div className="text-2xl sm:text-3xl lg:text-4xl font-mono font-bold text-white">
              ₹{totalCommitted.toLocaleString('en-IN')}
            </div>
            <div className="text-[10px] sm:text-xs font-semibold tracking-wider text-slate-300 uppercase mt-0.5">
              {t('totalGrants')}
            </div>
          </div>
        </div>
      </header>

      {/* Simple Filter Bar */}
      <div className="flex items-center justify-between gap-4 p-5 bg-[#0e172e] border border-[#1e2d54] rounded-2xl shadow-lg w-full">
        <div className="text-xs font-semibold uppercase tracking-wider text-slate-200 flex items-center gap-2">
          <Briefcase className="w-4 h-4 text-blue-400" aria-hidden="true" /> Filter CSR Project Catalog
        </div>

        <div className="flex items-center gap-3">
          <label htmlFor="domain-catalog-filter" className="text-xs font-medium text-slate-200">Sector Domain:</label>
          <select 
            id="domain-catalog-filter"
            value={selectedDomain} 
            onChange={(e) => setSelectedDomain(e.target.value)}
            className="form-select text-xs font-semibold bg-[#080d1a] border-[#2a3b63]/80 py-2.5 px-4 rounded-xl cursor-pointer text-white focus-visible:ring-2 focus-visible:ring-blue-400"
          >
            <option value="All">All Domains</option>
            <option value="Water Management">Water Management</option>
            <option value="Healthcare">Healthcare</option>
            <option value="Agriculture">Agriculture</option>
            <option value="Education">Education</option>
            <option value="Sanitation">Sanitation</option>
            <option value="Infrastructure & Energy">Infrastructure & Energy</option>
            <option value="Environment & Forests">Environment & Forests</option>
          </select>
        </div>
      </div>

      {/* Project Catalog Grid */}
      <main className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 items-start w-full">
        {filteredProblems.map((prob) => (
          <article 
            key={prob.id}
            aria-label={`CSR Project: ${prob.title}`}
            className="full-screen-card p-6 sm:p-8 bg-[#0e172e] border border-[#1e2d54] hover:border-blue-500/60 transition-all flex flex-col justify-between space-y-6 shadow-xl w-full"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-blue-400 bg-blue-500/10 px-2.5 py-1 rounded border border-blue-500/20">
                  {prob.ticket_code}
                </span>
                <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded border border-emerald-500/20">
                  {prob.status}
                </span>
              </div>

              <h2 className="text-base font-bold text-white leading-snug line-clamp-2">
                {prob.title}
              </h2>

              <p className="text-xs text-slate-200 line-clamp-3 leading-relaxed">
                {prob.description}
              </p>

              <div className="p-3.5 rounded-xl bg-[#080d1a] border border-[#1e2d54] space-y-1.5 text-xs font-mono">
                <div className="text-slate-300"><strong className="text-slate-100">Routed HEI:</strong> {prob.assigned_university}</div>
                <div className="text-slate-300"><strong className="text-slate-100">District:</strong> {prob.district}</div>
                {(prob as any).project && (
                  <div className="text-slate-300"><strong className="text-slate-100">R&D Team:</strong> {(prob as any).project.team_name} ({(prob as any).project.student_lead})</div>
                )}
              </div>
            </div>

            <div className="pt-4 border-t border-[#1e2d54] flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-slate-300 uppercase block">Required Support</span>
                <span className="text-xs font-bold text-white">
                  ₹{((prob as any).project?.budget_allocated || 75000).toLocaleString('en-IN')}
                </span>
              </div>

              <button
                type="button"
                onClick={() => setPledgeModalProblem(prob)}
                aria-label={`Pledge CSR Support for ${prob.ticket_code}`}
                className="btn-primary py-2.5 px-4 text-xs font-bold bg-blue-600 hover:bg-blue-500 rounded-xl cursor-pointer focus-visible:ring-2 focus-visible:ring-blue-400"
              >
                {t('sponsorBtn')}
              </button>
            </div>
          </article>
        ))}
      </main>

      {/* PLEDGE MODAL */}
      {pledgeModalProblem && (
        <div 
          role="dialog"
          aria-modal="true"
          aria-labelledby="csr-pledge-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl animate-fade-in"
        >
          <div className="full-screen-card max-w-lg w-full p-8 border border-blue-500/40 shadow-2xl relative bg-[#0e172e] space-y-5">
            <div className="flex items-center justify-between border-b border-[#1e2d54] pb-4">
              <div>
                <span className="text-xs font-mono font-bold text-blue-400">{pledgeModalProblem.ticket_code}</span>
                <h2 id="csr-pledge-modal-title" className="text-lg font-bold text-white mt-1">Pledge CSR Support & Sponsorship</h2>
              </div>
              <button 
                type="button" 
                onClick={() => setPledgeModalProblem(null)} 
                aria-label="Close CSR pledge dialog"
                className="btn-secondary py-1.5 px-3 text-xs font-bold focus-visible:ring-2 focus-visible:ring-blue-400"
              >
                Close
              </button>
            </div>

            <form onSubmit={handlePledgeSubmit} className="space-y-4 text-xs">
              <div>
                <label htmlFor="company-name" className="block font-semibold text-slate-200 uppercase mb-1">Company / Enterprise Name</label>
                <select
                  id="company-name"
                  className="form-select bg-[#080d1a] border-[#2a3b63] text-white focus-visible:ring-2 focus-visible:ring-blue-400"
                  value={pledgeForm.company_name}
                  onChange={(e) => setPledgeForm({ ...pledgeForm, company_name: e.target.value })}
                >
                  {COMPANY_SUGGESTIONS.map(c => (
                    <option key={c} value={c} className="bg-slate-900 text-slate-200">{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="contact-person" className="block font-semibold text-slate-200 uppercase mb-1">Contact Person & Title</label>
                <input
                  id="contact-person"
                  type="text"
                  className="form-input bg-[#080d1a] border-[#2a3b63] text-white"
                  value={pledgeForm.contact_person}
                  onChange={(e) => setPledgeForm({ ...pledgeForm, contact_person: e.target.value })}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="pledge-type" className="block font-semibold text-slate-200 uppercase mb-1">Pledge Type</label>
                  <select
                    id="pledge-type"
                    className="form-select bg-[#080d1a] border-[#2a3b63] text-white"
                    value={pledgeForm.pledge_type}
                    onChange={(e) => setPledgeForm({ ...pledgeForm, pledge_type: e.target.value })}
                  >
                    <option value="Grant Funding">Grant Funding</option>
                    <option value="Equipment & Hardware">Equipment & Hardware</option>
                    <option value="Mentorship & R&D Support">Mentorship & R&D Support</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="pledge-amount" className="block font-semibold text-slate-200 uppercase mb-1">Pledge Amount (₹)</label>
                  <input
                    id="pledge-amount"
                    type="number"
                    className="form-input bg-[#080d1a] border-[#2a3b63] text-white"
                    value={pledgeForm.amount}
                    onChange={(e) => setPledgeForm({ ...pledgeForm, amount: parseFloat(e.target.value) })}
                    required
                  />
                </div>
              </div>

              <div>
                <label htmlFor="corporate-notes" className="block font-semibold text-slate-200 uppercase mb-1">Corporate Notes / CSR Scope</label>
                <textarea
                  id="corporate-notes"
                  rows={3}
                  className="form-textarea bg-[#080d1a] border-[#2a3b63] text-white"
                  value={pledgeForm.notes}
                  onChange={(e) => setPledgeForm({ ...pledgeForm, notes: e.target.value })}
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setPledgeModalProblem(null)} className="btn-secondary flex-1 py-3 font-bold focus-visible:ring-2 focus-visible:ring-blue-400">Cancel</button>
                <button type="submit" className="btn-primary flex-1 py-3 font-bold bg-blue-600 hover:bg-blue-500 focus-visible:ring-2 focus-visible:ring-blue-400">Confirm CSR Pledge</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

export default IndustryCatalog;
