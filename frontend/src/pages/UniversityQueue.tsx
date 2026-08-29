import React, { useState, useEffect, FormEvent } from 'react';
import { 
  RefreshCw, 
  Sparkles,
  Filter,
  Check,
  ShieldCheck
} from 'lucide-react';
import { getProblems, updateProblemStatus, assignTeam } from '../services/api';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { Problem } from '../types';

const UNIVERSITIES = [
  "All Universities",
  "IIT (ISM) Dhanbad - Water Research Center",
  "Central University of Jharkhand (CUJ) - Health Tech Hub",
  "Birsa Agricultural University, Ranchi",
  "Ranchi University - Digital Innovation Lab",
  "NIT Jamshedpur - Environmental Engineering Department",
  "BIT Mesra - Civil & Renewable Energy Center"
];

const STAGE_TRANSITIONS: Record<string, string[]> = {
  'Submitted': ['Assigned'],
  'Assigned': ['In Progress', 'Submitted'],
  'In Progress': ['Testing', 'Assigned'],
  'Testing': ['Deployed', 'In Progress'],
  'Deployed': ['Testing']
};

function UniversityQueue() {
  const { t } = useLanguage();
  const { role, institution } = useAuth();
  const [problems, setProblems] = useState<Problem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedUni, setSelectedUni] = useState<string>(UNIVERSITIES[0]);
  const [selectedDomain, setSelectedDomain] = useState<string>("All Domains");
  const [selectedProblem, setSelectedProblem] = useState<Problem | any>(null);
  
  const [assignModalProblem, setAssignModalProblem] = useState<Problem | null>(null);
  const [teamForm, setTeamForm] = useState({
    team_name: '',
    student_lead: '',
    faculty_advisor: '',
    proposal_summary: '',
    budget_allocated: 75000
  });

  const loadData = async () => {
    setLoading(true);
    let localProblems: Problem[] = [];
    try {
      localProblems = JSON.parse(localStorage.getItem('setu_local_problems') || '[]');
    } catch (e) {}

    try {
      const params: any = {};
      if (selectedUni !== "All Universities") {
        params.university = selectedUni;
      }
      const res = await getProblems(params);
      const apiProbs = res.data || [];
      
      // Deduplicate by ticket_code
      const combined = [...localProblems, ...apiProbs];
      const unique = combined.filter((prob, index, self) => 
        index === self.findIndex(p => p.ticket_code === prob.ticket_code)
      );

      setProblems(unique);
    } catch (err) {
      console.warn('API fetch failed, loading local problem queue.');
      setProblems(localProblems);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (institution && role === 'university_admin') {
      setSelectedUni(institution);
    }
  }, [institution, role]);

  useEffect(() => {
    loadData();
  }, [selectedUni]);

  const handleStageChange = async (problemId: string, newStatus: string) => {
    try {
      await updateProblemStatus(problemId, newStatus);
      loadData();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to update stage.');
    }
  };

  const handleAssignSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!assignModalProblem) return;
    try {
      await assignTeam(assignModalProblem.id, teamForm);
      setAssignModalProblem(null);
      loadData();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to assign team.');
    }
  };

  const handleToggleMilestone = async (milestoneId: string) => {
    if (!selectedProblem || !selectedProblem.project) return;
    const updatedMilestones = selectedProblem.project.milestones.map((m: any) => {
      if (m.id === milestoneId) {
        return { ...m, status: m.status === 'Completed' ? 'Pending' : 'Completed' };
      }
      return m;
    });
    setSelectedProblem({
      ...selectedProblem,
      project: {
        ...selectedProblem.project,
        milestones: updatedMilestones
      }
    });
  };

  const DOMAIN_FILTERS = [
    "All Domains",
    "Water Management",
    "Healthcare",
    "Agriculture",
    "Education",
    "Sanitation",
    "Infrastructure & Energy",
    "Environment & Forests"
  ];

  const filteredProblems = selectedDomain === "All Domains"
    ? problems
    : problems.filter(p => p.domain === selectedDomain || (p as any).ai_predicted_category === selectedDomain || (p as any).user_category === selectedDomain);

  const stagesList = [
    { id: 'Submitted', label: t('colSubmitted'), desc: 'Newly crowdsourced challenges awaiting university assignment' },
    { id: 'Assigned', label: t('colAssigned'), desc: 'Assigned to university faculties; ready for student team formation' },
    { id: 'In Progress', label: t('colInProgress'), desc: 'Active student & faculty R&D prototype development' },
    { id: 'Testing', label: t('colTesting'), desc: 'Field trials and community impact validation in progress' },
    { id: 'Deployed', label: t('colDeployed'), desc: 'Validated solutions deployed to local administrative nodes' },
  ];

  return (
    <div className="w-full max-w-[1720px] mx-auto py-10 sm:py-16 px-4 sm:px-8 lg:px-12 flex flex-col gap-10 sm:gap-12">
      
      {/* Page Header & Filters */}
      <header className="space-y-5 border-b border-[#1e2d54]/80 pb-8 w-full">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="text-xs font-semibold tracking-wider text-slate-300 uppercase mb-1.5 flex items-center gap-2">
              <span>Government of Jharkhand · Higher Education R&D Pipeline</span>
              {role === 'university_admin' && (
                <span className="text-[10px] bg-blue-500/10 text-blue-400 px-2.5 py-0.5 rounded border border-blue-500/20 font-bold flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" aria-hidden="true" /> Server-Scoped: {institution}
                </span>
              )}
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
              {t('uniPageTitle')}
            </h1>
            <p className="text-xs sm:text-sm text-slate-200 mt-1.5 max-w-5xl leading-relaxed">
              {t('uniPageDesc')}
            </p>
          </div>

          {/* University Selector Dropdown */}
          <div className="flex items-center gap-3.5 shrink-0">
            <div className="flex items-center gap-2 bg-[#0e172e] border border-[#2a3b63]/80 rounded-xl px-4 py-3 text-xs sm:text-sm shadow-md">
              <label htmlFor="uni-select-filter" className="sr-only">Filter problems by University</label>
              <Filter className="w-4 h-4 text-blue-400 shrink-0" aria-hidden="true" />
              <select
                id="uni-select-filter"
                className="bg-transparent text-slate-100 outline-none font-semibold cursor-pointer max-w-[280px] truncate focus-visible:ring-2 focus-visible:ring-blue-400"
                value={selectedUni}
                onChange={(e) => setSelectedUni(e.target.value)}
                disabled={role === 'university_admin' && !!institution}
              >
                {UNIVERSITIES.map(u => (
                  <option key={u} value={u} className="bg-slate-900 text-slate-200">{u}</option>
                ))}
              </select>
            </div>

            <button 
              type="button"
              onClick={loadData} 
              className="btn-secondary py-3 px-4 text-xs sm:text-sm font-bold bg-[#0e172e] border-[#2a3b63]/80 shadow-md focus-visible:ring-2 focus-visible:ring-blue-400" 
              title="Refresh Data"
              aria-label="Refresh Kanban queue data"
            >
              <RefreshCw className={`w-4 h-4 text-blue-400 ${loading ? 'animate-spin' : ''}`} aria-hidden="true" />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>
        </div>

        {/* Domain Filter Pills Ticker */}
        <div className="flex items-center gap-3 overflow-x-auto pb-2 text-xs sm:text-sm pt-3 border-t border-[#1e2d54]/40" role="toolbar" aria-label="Domain Category Filter Toolbar">
          <span className="text-[10px] sm:text-xs font-semibold text-slate-300 uppercase tracking-wider shrink-0 mr-1">{t('filterDomain')}</span>
          {DOMAIN_FILTERS.map((domain) => {
            const isSelected = selectedDomain === domain;
            return (
              <button
                key={domain}
                type="button"
                aria-pressed={isSelected}
                onClick={() => setSelectedDomain(domain)}
                className={`px-4 py-2 rounded-xl font-medium transition-all shrink-0 text-xs sm:text-sm cursor-pointer focus-visible:ring-2 focus-visible:ring-blue-400 ${
                  isSelected
                    ? 'bg-blue-600 text-white shadow-md font-bold'
                    : 'bg-[#0e172e] border border-[#2a3b63]/80 text-slate-200 hover:border-slate-400 hover:text-white'
                }`}
              >
                {domain}
              </button>
            );
          })}
        </div>
      </header>

      {/* 5 STACKED VERTICAL COLUMNS KANBAN LAYOUT */}
      <main className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 lg:gap-6 items-start w-full">
        
        {stagesList.map((stage) => {
          const stageProblems = filteredProblems.filter(p => p.status === stage.id);

          return (
            <section 
              key={stage.id}
              aria-label={`Kanban Stage: ${stage.label}`}
              className="flex flex-col bg-[#0e172e] border border-[#1e2d54] rounded-2xl min-h-[600px] max-h-[850px] overflow-hidden shadow-xl w-full"
            >
              {/* Column Header */}
              <div className="p-4 sm:p-5 bg-[#111c38] border-b border-[#1e2d54] flex items-center justify-between shrink-0">
                <div>
                  <h2 className="text-sm font-bold text-white tracking-wide flex items-center gap-2">
                    {stage.label}
                  </h2>
                  <span className="text-[11px] text-slate-300 line-clamp-1 mt-0.5">{stage.desc}</span>
                </div>
                <span className="text-xs font-mono font-bold text-blue-400 bg-blue-500/10 px-2.5 py-1 rounded-lg border border-blue-500/20 shrink-0 ml-2">
                  {stageProblems.length}
                </span>
              </div>

              {/* Cards Container */}
              <div className="p-3.5 space-y-3.5 overflow-y-auto flex-1 custom-scrollbar">
                {stageProblems.length === 0 ? (
                  <div className="h-40 border border-dashed border-[#1e2d54]/80 rounded-xl flex items-center justify-center p-4 text-center">
                    <span className="text-xs text-slate-400 font-medium">No challenges in this stage</span>
                  </div>
                ) : (
                  stageProblems.map((prob) => (
                    <div
                      key={prob.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => setSelectedProblem(prob)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          setSelectedProblem(prob);
                        }
                      }}
                      aria-label={`Inspect challenge ${prob.ticket_code}: ${prob.title}`}
                      className="p-4 rounded-xl bg-[#080d1a] border border-[#1e2d54] hover:border-blue-500/60 transition-all cursor-pointer space-y-3 shadow-md group relative focus-visible:ring-2 focus-visible:ring-blue-400 outline-none"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] font-mono font-bold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
                          {prob.ticket_code}
                        </span>
                        <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                          Priority {prob.calculated_priority || (prob as any).urgency_score || 5}/10
                        </span>
                      </div>

                      <h3 className="text-xs sm:text-sm font-bold text-white group-hover:text-blue-400 transition-colors line-clamp-2 leading-snug">
                        {prob.title}
                      </h3>

                      <p className="text-[11px] text-slate-300 line-clamp-2 leading-relaxed">
                        {prob.description}
                      </p>

                      <div className="pt-2 border-t border-[#1e2d54]/60 flex items-center justify-between text-[11px] text-slate-300">
                        <span className="truncate max-w-[120px] font-medium text-slate-200">{prob.district}</span>
                        
                        {/* Quick Stage Transitions */}
                        {STAGE_TRANSITIONS[prob.status] && (
                          <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                            {STAGE_TRANSITIONS[prob.status].map((nextStage) => (
                              <button
                                key={nextStage}
                                type="button"
                                onClick={() => handleStageChange(prob.id, nextStage)}
                                className="px-2 py-1 rounded bg-blue-600/20 hover:bg-blue-600 border border-blue-500/30 text-blue-300 hover:text-white text-[10px] font-bold transition-all focus-visible:ring-2 focus-visible:ring-blue-400"
                                title={`Advance stage to ${nextStage}`}
                                aria-label={`Advance ${prob.ticket_code} to ${nextStage}`}
                              >
                                ➔ {nextStage}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Team Lead Indicator if Assigned */}
                      {(prob as any).project && (prob as any).project.student_lead && (
                        <div className="text-[10px] text-slate-200 bg-[#0e172e] p-2 rounded-lg border border-[#1e2d54] flex items-center justify-between font-mono">
                          <span className="truncate">👤 {(prob as any).project.student_lead}</span>
                          <span className="text-emerald-400 font-bold">₹{((prob as any).project.budget_allocated || 0).toLocaleString()}</span>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </section>
          );
        })}

      </main>

      {/* DETAILED PROJECT MODAL (INSPECT MILESTONES & TEAM) */}
      {selectedProblem && (
        <div 
          role="dialog"
          aria-modal="true"
          aria-labelledby="project-details-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl animate-fade-in"
        >
          <div className="full-screen-card max-w-3xl w-full p-6 sm:p-8 border border-blue-500/40 shadow-2xl relative bg-[#0e172e] space-y-6 max-h-[90vh] overflow-y-auto">
            
            <div className="flex items-center justify-between border-b border-[#1e2d54] pb-4">
              <div>
                <span className="text-xs font-mono font-bold text-blue-400 bg-blue-500/10 px-2.5 py-1 rounded border border-blue-500/20">
                  {selectedProblem.ticket_code}
                </span>
                <h2 id="project-details-modal-title" className="text-lg sm:text-xl font-bold text-white mt-2 leading-snug">
                  {selectedProblem.title}
                </h2>
              </div>
              <button 
                type="button"
                onClick={() => setSelectedProblem(null)} 
                aria-label="Close details dialog"
                className="btn-secondary py-1.5 px-3 text-xs font-bold shrink-0 focus-visible:ring-2 focus-visible:ring-blue-400"
              >
                Close
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
              <div className="space-y-3 bg-[#080d1a] p-4 rounded-xl border border-[#1e2d54]">
                <h3 className="font-bold text-slate-200 uppercase tracking-wider text-[10px]">Problem Metadata</h3>
                <p className="text-slate-200 leading-relaxed">{selectedProblem.description}</p>
                <div className="pt-2 border-t border-[#1e2d54] space-y-1 text-slate-300 font-mono text-[11px]">
                  <div><strong className="text-slate-200">District:</strong> {selectedProblem.district}</div>
                  <div><strong className="text-slate-200">Location:</strong> {selectedProblem.location || 'Jharkhand'}</div>
                  <div><strong className="text-slate-200">Reporter:</strong> {selectedProblem.reporter_name || 'Citizen'} ({selectedProblem.contact_phone || 'N/A'})</div>
                  <div><strong className="text-slate-200">Category:</strong> {selectedProblem.domain || selectedProblem.ai_predicted_category}</div>
                </div>
              </div>

              {/* Team Information */}
              <div className="space-y-3 bg-[#080d1a] p-4 rounded-xl border border-[#1e2d54]">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-slate-200 uppercase tracking-wider text-[10px]">Assigned HEI R&D Team</h3>
                  {(!selectedProblem.project || selectedProblem.project.student_lead === 'To Be Nominated') && (
                    <button
                      type="button"
                      onClick={() => {
                        setAssignModalProblem(selectedProblem);
                        setSelectedProblem(null);
                      }}
                      className="px-2.5 py-1 rounded bg-blue-600 text-white font-bold text-[10px] focus-visible:ring-2 focus-visible:ring-blue-400"
                    >
                      + Form Team
                    </button>
                  )}
                </div>

                {selectedProblem.project ? (
                  <div className="space-y-2 text-slate-200 font-mono text-[11px]">
                    <div><strong className="text-slate-300">University:</strong> {selectedProblem.project.university_name || selectedProblem.assigned_university}</div>
                    <div><strong className="text-slate-300">Team Name:</strong> {selectedProblem.project.team_name}</div>
                    <div><strong className="text-slate-300">Student Lead:</strong> {selectedProblem.project.student_lead}</div>
                    <div><strong className="text-slate-300">Faculty Advisor:</strong> {selectedProblem.project.faculty_advisor}</div>
                    <div><strong className="text-slate-300">Budget:</strong> ₹{(selectedProblem.project.budget_allocated || 0).toLocaleString()}</div>
                    {selectedProblem.project.proposal_summary && (
                      <div className="pt-2 border-t border-[#1e2d54] text-slate-200 font-sans text-xs">
                        <strong>Proposal:</strong> {selectedProblem.project.proposal_summary}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-slate-400 text-xs py-4 text-center">No R&D team assigned yet.</div>
                )}
              </div>
            </div>

            {/* Milestones Checklist */}
            {selectedProblem.project && selectedProblem.project.milestones && (
              <div className="space-y-3 bg-[#080d1a] p-4 rounded-xl border border-[#1e2d54]">
                <h3 className="font-bold text-slate-200 uppercase tracking-wider text-[10px]">Project Milestone Tracker</h3>
                <div className="space-y-2">
                  {selectedProblem.project.milestones.map((m: any) => (
                    <div 
                      key={m.id}
                      role="checkbox"
                      aria-checked={m.status === 'Completed'}
                      tabIndex={0}
                      onClick={() => handleToggleMilestone(m.id)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          handleToggleMilestone(m.id);
                        }
                      }}
                      className="flex items-center justify-between p-2.5 rounded-lg bg-[#0e172e] border border-[#1e2d54] cursor-pointer hover:border-blue-500/50 focus-visible:ring-2 focus-visible:ring-blue-400 outline-none"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className={`w-4 h-4 rounded border flex items-center justify-center ${m.status === 'Completed' ? 'bg-blue-600 border-blue-500 text-white' : 'border-slate-500'}`}>
                          {m.status === 'Completed' && <Check className="w-3 h-3" aria-hidden="true" />}
                        </div>
                        <span className={`text-xs ${m.status === 'Completed' ? 'line-through text-slate-400' : 'text-slate-100 font-medium'}`}>
                          {m.title}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-slate-300">{m.target_date}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        </div>
      )}

      {/* FORM TEAM ASSIGNMENT MODAL */}
      {assignModalProblem && (
        <div 
          role="dialog"
          aria-modal="true"
          aria-labelledby="assign-team-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl animate-fade-in"
        >
          <div className="full-screen-card max-w-md w-full p-6 sm:p-8 border border-blue-500/40 shadow-2xl relative bg-[#0e172e] space-y-4">
            <h2 id="assign-team-modal-title" className="text-lg font-bold text-white">Nominate R&D Team & Budget</h2>
            <p className="text-xs text-slate-300">Assign student lead and faculty advisor for {assignModalProblem.ticket_code}.</p>
            
            <form onSubmit={handleAssignSubmit} className="space-y-3.5 text-xs">
              <div>
                <label htmlFor="team-name" className="block font-semibold text-slate-200 uppercase mb-1">Team Name</label>
                <input 
                  id="team-name"
                  type="text" 
                  className="form-input bg-[#080d1a] border-[#2a3b63] text-white"
                  placeholder="e.g. Team HydroPure"
                  value={teamForm.team_name}
                  onChange={(e) => setTeamForm({ ...teamForm, team_name: e.target.value })}
                  required
                />
              </div>

              <div>
                <label htmlFor="student-lead" className="block font-semibold text-slate-200 uppercase mb-1">Student Lead</label>
                <input 
                  id="student-lead"
                  type="text" 
                  className="form-input bg-[#080d1a] border-[#2a3b63] text-white"
                  placeholder="e.g. Ananya Sen (M.Tech Hydrology)"
                  value={teamForm.student_lead}
                  onChange={(e) => setTeamForm({ ...teamForm, student_lead: e.target.value })}
                  required
                />
              </div>

              <div>
                <label htmlFor="faculty-advisor" className="block font-semibold text-slate-200 uppercase mb-1">Faculty Advisor</label>
                <input 
                  id="faculty-advisor"
                  type="text" 
                  className="form-input bg-[#080d1a] border-[#2a3b63] text-white"
                  placeholder="e.g. Dr. R. N. Mukherjee"
                  value={teamForm.faculty_advisor}
                  onChange={(e) => setTeamForm({ ...teamForm, faculty_advisor: e.target.value })}
                  required
                />
              </div>

              <div>
                <label htmlFor="budget-allocated" className="block font-semibold text-slate-200 uppercase mb-1">Allocated Budget (₹)</label>
                <input 
                  id="budget-allocated"
                  type="number" 
                  className="form-input bg-[#080d1a] border-[#2a3b63] text-white"
                  value={teamForm.budget_allocated}
                  onChange={(e) => setTeamForm({ ...teamForm, budget_allocated: parseFloat(e.target.value) })}
                  required
                />
              </div>

              <div>
                <label htmlFor="proposal-summary" className="block font-semibold text-slate-200 uppercase mb-1">Proposal Summary</label>
                <textarea 
                  id="proposal-summary"
                  rows={3}
                  className="form-textarea bg-[#080d1a] border-[#2a3b63] text-white"
                  placeholder="Brief methodology summary..."
                  value={teamForm.proposal_summary}
                  onChange={(e) => setTeamForm({ ...teamForm, proposal_summary: e.target.value })}
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setAssignModalProblem(null)} className="btn-secondary flex-1 py-2.5 font-bold focus-visible:ring-2 focus-visible:ring-blue-400">Cancel</button>
                <button type="submit" className="btn-primary flex-1 py-2.5 font-bold bg-blue-600 hover:bg-blue-500 focus-visible:ring-2 focus-visible:ring-blue-400">Save Assignment</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

export default UniversityQueue;
