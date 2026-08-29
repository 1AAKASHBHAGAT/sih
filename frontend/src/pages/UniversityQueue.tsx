import React, { useState, useEffect, FormEvent } from 'react';
import { 
  RefreshCw, 
  Sparkles,
  Filter,
  Check,
  ShieldCheck,
  Building2,
  CheckCircle2,
  Layers,
  UserCheck
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
      // Local fallback
      setProblems(prev => prev.map(p => p.id === problemId ? { ...p, status: newStatus } : p));
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
      setAssignModalProblem(null);
      loadData();
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
    { id: 'Submitted', label: t('colSubmitted') || 'New Submissions', desc: 'Newly crowdsourced challenges' },
    { id: 'Assigned', label: t('colAssigned') || 'Assigned Queue', desc: 'Assigned to university faculties' },
    { id: 'In Progress', label: t('colInProgress') || 'In Progress R&D', desc: 'Active student & faculty R&D' },
    { id: 'Testing', label: t('colTesting') || 'Field Testing', desc: 'Field trials & validation' },
    { id: 'Deployed', label: t('colDeployed') || 'Solution Deployed', desc: 'Validated solutions deployed' },
  ];

  return (
    <div className="max-w-[1720px] mx-auto px-4 sm:px-8 py-8 space-y-8 animate-fade-in">
      
      {/* Page Header (Bright Light Theme) */}
      <div className="bg-white border border-slate-200 rounded-3xl p-8 sm:p-10 shadow-sm space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold">
              <Building2 className="w-4 h-4 text-blue-600" /> Government of Jharkhand • Higher Education R&D Pipeline
              {role === 'university_admin' && (
                <span className="text-[10px] bg-blue-600 text-white px-2 py-0.5 rounded-full font-bold ml-1">
                  {institution || 'Nodal HEI Center'}
                </span>
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              University Collaboration & R&D Workspace
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 max-w-4xl">
              Review auto-routed societal challenges, form student innovation teams, and track project R&D milestones across Jharkhand higher education institutions.
            </p>
          </div>

          {/* University Selector Dropdown */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-semibold shadow-sm">
              <Filter className="w-4 h-4 text-blue-600 shrink-0" />
              <select
                className="bg-transparent text-slate-800 outline-none font-bold cursor-pointer max-w-[260px] truncate"
                value={selectedUni}
                onChange={(e) => setSelectedUni(e.target.value)}
                disabled={role === 'university_admin' && !!institution}
              >
                {UNIVERSITIES.map(u => (
                  <option key={u} value={u}>{u}</option>
                ))}
              </select>
            </div>

            <button 
              type="button"
              onClick={loadData} 
              className="btn-secondary py-2.5 px-4 text-xs font-bold bg-white border-slate-200 text-slate-700 hover:text-blue-600 hover:border-blue-300 shadow-sm"
              title="Refresh Queue"
            >
              <RefreshCw className={`w-4 h-4 text-blue-600 ${loading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>
        </div>

        {/* Domain Filter Pills Ticker */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs pt-4 border-t border-slate-100">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider shrink-0 mr-2">Filter Sector Domain:</span>
          {DOMAIN_FILTERS.map((domain) => {
            const isSelected = selectedDomain === domain;
            return (
              <button
                key={domain}
                type="button"
                onClick={() => setSelectedDomain(domain)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition shrink-0 cursor-pointer ${
                  isSelected
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-slate-100 border border-slate-200 text-slate-700 hover:bg-slate-200 hover:text-slate-900'
                }`}
              >
                {domain}
              </button>
            );
          })}
        </div>
      </div>

      {/* 5 STACKED VERTICAL KANBAN COLUMNS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-5 items-start w-full">
        
        {stagesList.map((stage) => {
          const stageProblems = filteredProblems.filter(p => p.status === stage.id);

          return (
            <div 
              key={stage.id}
              className="flex flex-col bg-white border border-slate-200 rounded-2xl min-h-[580px] max-h-[800px] overflow-hidden shadow-sm w-full"
            >
              {/* Column Header */}
              <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between shrink-0">
                <div>
                  <h2 className="text-xs font-extrabold text-slate-900 tracking-wide uppercase">
                    {stage.label}
                  </h2>
                  <span className="text-[10px] text-slate-500 truncate block mt-0.5">{stage.desc}</span>
                </div>
                <span className="text-xs font-mono font-bold text-blue-700 bg-blue-100 px-2.5 py-0.5 rounded-full border border-blue-200 shrink-0 ml-2">
                  {stageProblems.length}
                </span>
              </div>

              {/* Cards Container */}
              <div className="p-3 space-y-3 overflow-y-auto flex-1">
                {stageProblems.length === 0 ? (
                  <div className="h-36 border border-dashed border-slate-200 rounded-xl flex items-center justify-center p-4 text-center">
                    <span className="text-xs text-slate-400 font-semibold">No challenges in this stage</span>
                  </div>
                ) : (
                  stageProblems.map((prob) => (
                    <div
                      key={prob.id || prob.ticket_code}
                      onClick={() => setSelectedProblem(prob)}
                      className="p-4 rounded-xl bg-slate-50 border border-slate-200 hover:border-blue-500 hover:bg-white transition cursor-pointer space-y-2.5 shadow-sm group"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] font-mono font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded border border-blue-200">
                          {prob.ticket_code}
                        </span>
                        <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded border border-amber-200">
                          Priority {prob.calculated_priority || (prob as any).urgency_score || 6}/10
                        </span>
                      </div>

                      <h3 className="text-xs font-bold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-2 leading-snug">
                        {prob.title}
                      </h3>

                      <p className="text-[11px] text-slate-600 line-clamp-2 leading-relaxed">
                        {prob.description}
                      </p>

                      <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between text-[11px] text-slate-600">
                        <span className="truncate max-w-[110px] font-semibold text-slate-700">{prob.district}</span>
                        
                        {/* Stage Action Buttons */}
                        {STAGE_TRANSITIONS[prob.status] && (
                          <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                            {STAGE_TRANSITIONS[prob.status].map((nextStage) => (
                              <button
                                key={nextStage}
                                type="button"
                                onClick={() => handleStageChange(prob.id, nextStage)}
                                className="px-2 py-0.5 rounded bg-blue-50 hover:bg-blue-600 text-blue-700 hover:text-white border border-blue-200 text-[10px] font-bold transition cursor-pointer"
                              >
                                ➔ {nextStage}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}

      </div>

      {/* DETAILED PROJECT MODAL */}
      {selectedProblem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white max-w-3xl w-full p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <span className="text-xs font-mono font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded border border-blue-200">
                  {selectedProblem.ticket_code}
                </span>
                <h2 className="text-lg font-bold text-slate-900 mt-2 leading-snug">
                  {selectedProblem.title}
                </h2>
              </div>
              <button 
                type="button"
                onClick={() => setSelectedProblem(null)} 
                className="btn-secondary py-1.5 px-3 text-xs font-bold shrink-0"
              >
                Close
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
              <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <h3 className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">Problem Metadata</h3>
                <p className="text-slate-700 leading-relaxed">{selectedProblem.description}</p>
                <div className="pt-2 border-t border-slate-200 space-y-1 text-slate-700 font-mono text-[11px]">
                  <div><strong>District:</strong> {selectedProblem.district}</div>
                  <div><strong>Location:</strong> {selectedProblem.location || 'Jharkhand'}</div>
                  <div><strong>Reporter:</strong> {selectedProblem.reporter_name || 'Citizen'} ({selectedProblem.contact_phone || 'N/A'})</div>
                  <div><strong>Category:</strong> {selectedProblem.domain || selectedProblem.ai_predicted_category}</div>
                </div>
              </div>

              {/* Team Information */}
              <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">Assigned HEI R&D Team</h3>
                  <button
                    type="button"
                    onClick={() => {
                      setAssignModalProblem(selectedProblem);
                      setSelectedProblem(null);
                    }}
                    className="px-2.5 py-1 rounded bg-blue-600 text-white font-bold text-[10px] shadow-sm cursor-pointer"
                  >
                    + Form Team
                  </button>
                </div>

                {selectedProblem.project ? (
                  <div className="space-y-2 text-slate-700 font-mono text-[11px]">
                    <div><strong>University:</strong> {selectedProblem.project.university_name || selectedProblem.assigned_university}</div>
                    <div><strong>Team Name:</strong> {selectedProblem.project.team_name}</div>
                    <div><strong>Student Lead:</strong> {selectedProblem.project.student_lead}</div>
                    <div><strong>Faculty Advisor:</strong> {selectedProblem.project.faculty_advisor}</div>
                    <div><strong>Budget:</strong> ₹{(selectedProblem.project.budget_allocated || 75000).toLocaleString()}</div>
                  </div>
                ) : (
                  <div className="text-slate-500 text-xs py-4 text-center">Click '+ Form Team' to assign faculty and student lead.</div>
                )}
              </div>
            </div>

            {/* Milestones Checklist */}
            {selectedProblem.project && selectedProblem.project.milestones && (
              <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <h3 className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">Project Milestone Tracker</h3>
                <div className="space-y-2">
                  {selectedProblem.project.milestones.map((m: any) => (
                    <div 
                      key={m.id}
                      onClick={() => handleToggleMilestone(m.id)}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-slate-200 cursor-pointer hover:border-blue-300"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className={`w-4 h-4 rounded border flex items-center justify-center ${m.status === 'Completed' ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-300'}`}>
                          {m.status === 'Completed' && <Check className="w-3 h-3" />}
                        </div>
                        <span className={`text-xs ${m.status === 'Completed' ? 'line-through text-slate-400' : 'text-slate-800 font-medium'}`}>
                          {m.title}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-slate-500">{m.target_date}</span>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white max-w-md w-full p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-2xl space-y-4">
            <h2 className="text-lg font-bold text-slate-900">Nominate R&D Team & Budget</h2>
            <p className="text-xs text-slate-500">Assign student lead and faculty advisor for {assignModalProblem.ticket_code}.</p>
            
            <form onSubmit={handleAssignSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 uppercase mb-1">Team Name</label>
                <input 
                  type="text" 
                  className="form-input text-xs"
                  placeholder="e.g. Team HydroPure"
                  value={teamForm.team_name}
                  onChange={(e) => setTeamForm({ ...teamForm, team_name: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 uppercase mb-1">Student Lead</label>
                <input 
                  type="text" 
                  className="form-input text-xs"
                  placeholder="e.g. Ananya Sen (M.Tech)"
                  value={teamForm.student_lead}
                  onChange={(e) => setTeamForm({ ...teamForm, student_lead: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 uppercase mb-1">Faculty Advisor</label>
                <input 
                  type="text" 
                  className="form-input text-xs"
                  placeholder="e.g. Dr. R. N. Mukherjee"
                  value={teamForm.faculty_advisor}
                  onChange={(e) => setTeamForm({ ...teamForm, faculty_advisor: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 uppercase mb-1">Allocated Budget (₹)</label>
                <input 
                  type="number" 
                  className="form-input text-xs"
                  value={teamForm.budget_allocated}
                  onChange={(e) => setTeamForm({ ...teamForm, budget_allocated: parseFloat(e.target.value) })}
                  required
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setAssignModalProblem(null)} className="btn-secondary flex-1 py-2.5 font-bold">Cancel</button>
                <button type="submit" className="btn-primary flex-1 py-2.5 font-bold bg-blue-600 hover:bg-blue-700">Save Assignment</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

export default UniversityQueue;
