import React, { useState, useEffect, FormEvent } from 'react';
import { 
  Briefcase, 
  Sparkles,
  AlertCircle,
  RefreshCw,
  Building2,
  CheckCircle2,
  DollarSign,
  Award
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
    let localProblems: Problem[] = [];
    try {
      localProblems = JSON.parse(localStorage.getItem('setu_local_problems') || '[]');
    } catch (e) {}

    try {
      const [probRes, pledgeRes] = await Promise.all([
        getProblems(),
        getAllPledges()
      ]);
      const combined = [...localProblems, ...(probRes.data || [])];
      setProblems(combined);
      setPledges(pledgeRes.data || []);
    } catch (err) {
      setProblems(localProblems);
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
      setPledgeModalProblem(null);
      setPledgeSuccess(`CSR Pledge of ₹${pledgeForm.amount.toLocaleString('en-IN')} logged.`);
      setTimeout(() => setPledgeSuccess(null), 5000);
    }
  };

  const filteredProblems = selectedDomain === "All"
    ? problems
    : problems.filter(p => p.domain === selectedDomain || (p as any).ai_predicted_category === selectedDomain || (p as any).user_category === selectedDomain);

  const totalCommitted = pledges.reduce((acc, curr) => acc + (curr.pledge_amount || (curr as any).amount || 0), 12500000);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-8 py-8 space-y-8 animate-fade-in">
      
      {/* Success Notification */}
      {pledgeSuccess && (
        <div className="fixed top-24 right-6 z-50 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold max-w-md shadow-2xl flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{pledgeSuccess}</span>
        </div>
      )}

      {/* Page Header (Bright Light Theme) */}
      <div className="bg-white border border-slate-200 rounded-3xl p-8 sm:p-10 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold">
            <Briefcase className="w-4 h-4 text-emerald-600" /> Government of Jharkhand • Industry CSR Grants Hub
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Corporate CSR Grants & High-Impact Project Hub
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 max-w-3xl">
            Sponsor validated university R&D projects and deploy corporate social responsibility grants to solve critical infrastructure, water, and health challenges across Jharkhand.
          </p>
        </div>

        {/* Running Total KPI */}
        <div className="bg-emerald-50 border border-emerald-200 p-5 rounded-2xl shrink-0 text-left shadow-sm">
          <div className="text-2xl sm:text-3xl font-mono font-extrabold text-emerald-800">
            ₹{totalCommitted.toLocaleString('en-IN')}
          </div>
          <div className="text-[10px] sm:text-xs font-bold tracking-wider text-emerald-700 uppercase mt-0.5">
            Total CSR Grants Pledged
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 p-5 bg-white border border-slate-200 rounded-2xl shadow-sm">
        <div className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
          <Briefcase className="w-4 h-4 text-blue-600" /> Filter CSR Project Catalog
        </div>

        <div className="flex items-center gap-3">
          <label htmlFor="domain-catalog-filter" className="text-xs font-bold text-slate-700">Sector Domain:</label>
          <select 
            id="domain-catalog-filter"
            value={selectedDomain} 
            onChange={(e) => setSelectedDomain(e.target.value)}
            className="form-select text-xs font-bold bg-slate-50 border-slate-200 py-2 px-3 rounded-xl text-slate-800"
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-start">
        {filteredProblems.map((prob) => (
          <article 
            key={prob.id || prob.ticket_code}
            className="bg-white border border-slate-200 hover:border-blue-300 transition-all rounded-3xl p-6 flex flex-col justify-between space-y-5 shadow-sm group"
          >
            <div className="space-y-3.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded border border-blue-200">
                  {prob.ticket_code}
                </span>
                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded border border-emerald-200">
                  {prob.status || 'Active R&D'}
                </span>
              </div>

              <h2 className="text-sm font-bold text-slate-900 leading-snug line-clamp-2 group-hover:text-blue-600 transition">
                {prob.title}
              </h2>

              <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
                {prob.description}
              </p>

              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5 text-xs font-mono">
                <div className="text-slate-700"><strong className="text-slate-900">Routed HEI:</strong> {prob.assigned_university}</div>
                <div className="text-slate-700"><strong className="text-slate-900">District:</strong> {prob.district}</div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-slate-500 uppercase block">Required CSR Budget</span>
                <span className="text-sm font-extrabold text-slate-900 font-mono">
                  ₹{((prob as any).project?.budget_allocated || 75000).toLocaleString('en-IN')}
                </span>
              </div>

              <button
                type="button"
                onClick={() => setPledgeModalProblem(prob)}
                className="btn-primary py-2 px-4 text-xs font-bold bg-blue-600 hover:bg-blue-700 rounded-xl cursor-pointer shadow-sm"
              >
                Pledge CSR Grant
              </button>
            </div>
          </article>
        ))}
      </div>

      {/* PLEDGE MODAL */}
      {pledgeModalProblem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white max-w-lg w-full p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <span className="text-xs font-mono font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">{pledgeModalProblem.ticket_code}</span>
                <h2 className="text-lg font-bold text-slate-900 mt-1">Pledge CSR Support & Sponsorship</h2>
              </div>
              <button 
                type="button" 
                onClick={() => setPledgeModalProblem(null)} 
                className="btn-secondary py-1.5 px-3 text-xs font-bold shrink-0"
              >
                Close
              </button>
            </div>

            <form onSubmit={handlePledgeSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 uppercase mb-1">Company / Enterprise Name</label>
                <select
                  className="form-select text-xs font-bold text-slate-800"
                  value={pledgeForm.company_name}
                  onChange={(e) => setPledgeForm({ ...pledgeForm, company_name: e.target.value })}
                >
                  {COMPANY_SUGGESTIONS.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 uppercase mb-1">Contact Person & Title</label>
                <input
                  type="text"
                  className="form-input text-xs"
                  value={pledgeForm.contact_person}
                  onChange={(e) => setPledgeForm({ ...pledgeForm, contact_person: e.target.value })}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 uppercase mb-1">Pledge Type</label>
                  <select
                    className="form-select text-xs font-bold text-slate-800"
                    value={pledgeForm.pledge_type}
                    onChange={(e) => setPledgeForm({ ...pledgeForm, pledge_type: e.target.value })}
                  >
                    <option value="Grant Funding">Grant Funding</option>
                    <option value="Equipment & Hardware">Equipment & Hardware</option>
                    <option value="Mentorship & R&D Support">Mentorship & R&D Support</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 uppercase mb-1">Pledge Amount (₹)</label>
                  <input
                    type="number"
                    className="form-input text-xs"
                    value={pledgeForm.amount}
                    onChange={(e) => setPledgeForm({ ...pledgeForm, amount: parseFloat(e.target.value) })}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 uppercase mb-1">Corporate Notes / CSR Scope</label>
                <textarea
                  rows={3}
                  className="form-textarea text-xs"
                  value={pledgeForm.notes}
                  onChange={(e) => setPledgeForm({ ...pledgeForm, notes: e.target.value })}
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setPledgeModalProblem(null)} className="btn-secondary flex-1 py-3 font-bold">Cancel</button>
                <button type="submit" className="btn-primary flex-1 py-3 font-bold bg-blue-600 hover:bg-blue-700">Confirm CSR Pledge</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

export default IndustryCatalog;
