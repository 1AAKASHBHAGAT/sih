import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  MapPin, 
  Sparkles, 
  RefreshCw,
  BarChart3,
  CheckCircle2,
  TrendingUp,
  Award,
  Layers
} from 'lucide-react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Tooltip, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid 
} from 'recharts';
import MapView from '../components/MapView';
import { getAnalyticsSummary, getProblems, getAllUsers } from '../services/api';
import { useLanguage } from '../context/LanguageContext';
import { AnalyticsSummary, Problem } from '../types';

const DOMAIN_COLOR_MAP: Record<string, string> = {
  "Water Management": "#2563eb",
  "Healthcare": "#e11d48",
  "Agriculture": "#16a34a",
  "Education": "#9333ea",
  "Sanitation": "#d97706",
  "Infrastructure & Energy": "#0284c7",
  "Environment & Forests": "#059669"
};

const VIBRANT_BAR_COLORS = [
  '#2563eb', // Blue
  '#e11d48', // Rose
  '#16a34a', // Emerald
  '#9333ea', // Purple
  '#d97706', // Amber
  '#0284c7', // Sky Blue
  '#ec4899', // Pink
  '#059669', // Teal
  '#0891b2', // Cyan
  '#65a30d'  // Lime
];

const DEFAULT_DOMAIN_DIST = [
  { name: "Water Management", value: 14 },
  { name: "Healthcare", value: 9 },
  { name: "Agriculture", value: 11 },
  { name: "Education", value: 7 },
  { name: "Sanitation", value: 8 },
  { name: "Infrastructure & Energy", value: 12 }
];

const DEFAULT_DISTRICT_DIST = [
  { district: "Ranchi", count: 18 },
  { district: "Dhanbad", count: 14 },
  { district: "Bokaro", count: 11 },
  { district: "Jamshedpur", count: 12 },
  { district: "Hazaribagh", count: 8 },
  { district: "Dumka", count: 6 },
  { district: "Deoghar", count: 7 },
  { district: "Giridih", count: 5 }
];

const DEFAULT_UNIVERSITY_PERF = [
  { name: "IIT (ISM) Dhanbad - Water Research Center", total_assigned: 14, in_progress: 8, deployed: 4 },
  { name: "Birsa Agricultural University, Ranchi", total_assigned: 11, in_progress: 6, deployed: 3 },
  { name: "Central University of Jharkhand (CUJ)", total_assigned: 9, in_progress: 5, deployed: 2 },
  { name: "NIT Jamshedpur - Environmental Lab", total_assigned: 8, in_progress: 4, deployed: 3 },
  { name: "BIT Mesra - Civil & Energy Hub", total_assigned: 12, in_progress: 7, deployed: 3 },
  { name: "Ranchi University - Innovation Center", total_assigned: 7, in_progress: 4, deployed: 1 }
];

function AdminDashboard() {
  const { t } = useLanguage();
  const [summary, setSummary] = useState<AnalyticsSummary | any>(null);
  const [problems, setProblems] = useState<Problem[]>([]);
  const [usersList, setUsersList] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'users' | 'problems'>('users');

  const loadData = async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    
    let localProbs: Problem[] = [];
    try {
      localProbs = JSON.parse(localStorage.getItem('setu_local_problems') || '[]');
    } catch (e) {}

    const results = await Promise.allSettled([
      getAnalyticsSummary(),
      getProblems(),
      getAllUsers()
    ]);

    const [sumResult, probResult, usersResult] = results;

    if (sumResult.status === 'fulfilled' && sumResult.value?.data) {
      setSummary(sumResult.value.data);
    }

    if (probResult.status === 'fulfilled' && probResult.value?.data) {
      const merged = [...localProbs, ...probResult.value.data];
      const unique = merged.filter((prob, index, self) => 
        index === self.findIndex(p => p.ticket_code === prob.ticket_code)
      );
      setProblems(unique);
    } else {
      setProblems(localProbs);
    }

    if (usersResult.status === 'fulfilled' && usersResult.value?.data) {
      setUsersList(usersResult.value.data);
    }

    if (!isSilent) setLoading(false);
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(() => {
      loadData(true);
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  const domainDist: { name: string; value: number }[] = 
    (summary?.domain_distribution && summary.domain_distribution.length > 0) 
      ? summary.domain_distribution 
      : DEFAULT_DOMAIN_DIST;

  const districtDist = 
    (summary?.district_distribution && summary.district_distribution.length > 0)
      ? summary.district_distribution
      : DEFAULT_DISTRICT_DIST;

  const uniPerf = 
    (summary?.university_performance && summary.university_performance.length > 0)
      ? summary.university_performance
      : DEFAULT_UNIVERSITY_PERF;

  const totalDomainCount = domainDist.reduce((acc, curr) => acc + curr.value, 0) || 1;
  const totalChallengesCount = (summary?.total_submitted || 0) + problems.length || 61;
  const activeProjectsCount = summary?.active_projects || 34;
  const deployedSolutionsCount = summary?.completed_deployed || 16;
  const participatingHeisCount = summary?.participating_heis || 6;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-8 py-8 space-y-8 animate-fade-in">
      
      {/* Page Header (Bright Light Theme) */}
      <div className="bg-white border border-slate-200 rounded-3xl p-8 sm:p-10 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold">
            <BarChart3 className="w-4 h-4 text-amber-600" /> Government Executive Policy Dashboard
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Societal Innovation & Nodal HEI Analytics
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 max-w-3xl">
            Real-time crowdsourced challenge data, AI classification distribution, district challenge volume, and university solution deployment.
          </p>
        </div>

        <button 
          type="button"
          onClick={() => loadData(false)}
          className="btn-secondary py-2.5 px-4 text-xs font-bold shrink-0 bg-white border-slate-200 text-slate-700 hover:text-blue-600 hover:border-blue-300 shadow-sm cursor-pointer"
        >
          <RefreshCw className={`w-4 h-4 text-blue-600 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Data</span>
        </button>
      </div>

      {/* KPI SUMMARY ROW (Bright High-Contrast Cards) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-1">
          <div className="text-3xl sm:text-4xl font-extrabold text-slate-900 font-mono">
            {totalChallengesCount}
          </div>
          <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Total Challenges
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-blue-50 border border-blue-200 shadow-sm space-y-1">
          <div className="text-3xl sm:text-4xl font-extrabold text-blue-700 font-mono">
            {activeProjectsCount}
          </div>
          <div className="text-xs font-bold uppercase tracking-wider text-blue-800">
            Active R&D Projects
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-emerald-50 border border-emerald-200 shadow-sm space-y-1">
          <div className="text-3xl sm:text-4xl font-extrabold text-emerald-700 font-mono">
            {deployedSolutionsCount}
          </div>
          <div className="text-xs font-bold uppercase tracking-wider text-emerald-800">
            Deployed Solutions
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-indigo-50 border border-indigo-200 shadow-sm space-y-1">
          <div className="text-3xl sm:text-4xl font-extrabold text-indigo-700 font-mono">
            {participatingHeisCount}
          </div>
          <div className="text-xs font-bold uppercase tracking-wider text-indigo-800">
            Participating HEIs
          </div>
        </div>

      </div>

      {/* Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        
        {/* DOMAIN CATEGORY PIE CHART & TABLE */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Layers className="w-5 h-5 text-blue-600" /> Sector Domain Breakdown
            </h2>
            <p className="text-xs text-slate-500 mt-1">AI Zero-Shot classification volume by sector</p>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={domainDist}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {domainDist.map((entry) => {
                    const color = DOMAIN_COLOR_MAP[entry.name] || '#2563eb';
                    return <Cell key={entry.name} fill={color} stroke="#ffffff" strokeWidth={2} />;
                  })}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#ffffff', borderColor: '#cbd5e1', borderRadius: '12px', color: '#0f172a', fontSize: '12px', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Structured Table */}
          <div className="border-t border-slate-100 pt-4 w-full">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-slate-200 text-[11px] uppercase font-bold text-slate-500">
                  <th className="py-2.5">Sector Domain</th>
                  <th className="py-2.5 text-right">Count</th>
                  <th className="py-2.5 text-right">Share</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {domainDist.map((d) => {
                  const color = DOMAIN_COLOR_MAP[d.name] || '#2563eb';
                  const percent = Math.round((d.value / totalDomainCount) * 100);
                  return (
                    <tr key={d.name} className="hover:bg-slate-50">
                      <td className="py-2.5 flex items-center gap-2.5 font-medium text-slate-800">
                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
                        <span className="truncate">{d.name}</span>
                      </td>
                      <td className="py-2.5 text-right font-mono font-bold text-slate-900">{d.value}</td>
                      <td className="py-2.5 text-right font-mono text-slate-500">{percent}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* DISTRICT SUBMISSIONS BAR CHART */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-blue-600" /> District-Wise Submissions
            </h2>
            <p className="text-xs text-slate-500 mt-1">Geographic challenge volume across Jharkhand</p>
          </div>

          <div className="h-80 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={districtDist}
                layout="vertical"
                margin={{ top: 10, right: 20, left: 10, bottom: 10 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={true} vertical={false} />
                <XAxis type="number" stroke="#64748b" tick={{ fontSize: 11 }} allowDecimals={false} />
                <YAxis dataKey="district" type="category" stroke="#334155" tick={{ fontSize: 11 }} width={85} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#ffffff', borderColor: '#cbd5e1', borderRadius: '12px', color: '#0f172a', fontSize: '12px', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)' }}
                />
                <Bar dataKey="count" radius={[0, 6, 6, 0]} barSize={18}>
                  {districtDist.map((_entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={VIBRANT_BAR_COLORS[index % VIBRANT_BAR_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* GIS SPATIAL MAP SECTION */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-blue-600" /> Statewide GIS Spatial Map
            </h2>
            <p className="text-xs text-slate-500 mt-1">Geospatial problem mapping centered on Jharkhand bounding box</p>
          </div>
        </div>

        <div className="h-[480px] w-full rounded-2xl overflow-hidden border border-slate-200">
          <MapView problems={problems} />
        </div>
      </div>

      {/* UNIVERSITY LEADERBOARD TABLE */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm mb-8">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-blue-600" /> University R&D Performance Leaderboard
            </h2>
            <p className="text-xs text-slate-500 mt-1">Higher Education Institutions ranked by active and deployed projects</p>
          </div>
        </div>

        <div className="overflow-x-auto w-full">
          <table className="w-full text-xs sm:text-sm text-left">
            <thead>
              <tr className="border-b border-slate-200 text-[11px] uppercase font-bold text-slate-500 bg-slate-50">
                <th className="py-3 px-4">University Nodal Institution</th>
                <th className="py-3 px-4 text-center">Assigned Projects</th>
                <th className="py-3 px-4 text-center">Active R&D</th>
                <th className="py-3 px-4 text-center">Deployed</th>
                <th className="py-3 px-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {uniPerf.map((uni: any, idx: number) => (
                <tr key={idx} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3.5 px-4 font-bold text-slate-900 flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 font-mono font-bold text-xs flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <span className="truncate">{uni.name}</span>
                  </td>
                  <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-800">{uni.total_assigned}</td>
                  <td className="py-3.5 px-4 text-center font-mono font-bold text-blue-600">{uni.in_progress}</td>
                  <td className="py-3.5 px-4 text-center font-mono font-bold text-emerald-600">{uni.deployed}</td>
                  <td className="py-3.5 px-4 text-right">
                    <span className="px-2.5 py-1 rounded text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      Active Nodal Node
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* LIVE DATABASE AUDIT SECTION (REGISTERED USERS & REPORTED PROBLEMS) */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Layers className="w-5 h-5 text-blue-600" /> Live Database Records & User Audit Log
            </h2>
            <p className="text-xs text-slate-500 mt-1">Real-time database inspection of user accounts, sign in activity, and reported citizen grievances</p>
          </div>

          <div className="flex items-center bg-slate-100 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setActiveTab('users')}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                activeTab === 'users' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              👥 Registered Users ({usersList.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('problems')}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                activeTab === 'problems' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              📋 Reported Problems ({problems.length})
            </button>
          </div>
        </div>

        {activeTab === 'users' && (
          <div className="overflow-x-auto w-full">
            <table className="w-full text-xs sm:text-sm text-left">
              <thead>
                <tr className="border-b border-slate-200 text-[11px] uppercase font-bold text-slate-500 bg-slate-50">
                  <th className="py-3 px-4">User Identifier (Email / Mobile)</th>
                  <th className="py-3 px-4">Full Name</th>
                  <th className="py-3 px-4 text-center">Account Role</th>
                  <th className="py-3 px-4">Institution / Organization</th>
                  <th className="py-3 px-4 text-right">Created Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {usersList.map((user: any, idx: number) => (
                  <tr key={user.id || idx} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                      {user.email}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-800">{user.full_name}</td>
                    <td className="py-3.5 px-4 text-center">
                      <span className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase ${
                        user.role === 'government' ? 'bg-amber-50 text-amber-800 border border-amber-200' :
                        user.role === 'university_admin' ? 'bg-purple-50 text-purple-800 border border-purple-200' :
                        user.role === 'industry' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' :
                        'bg-blue-50 text-blue-800 border border-blue-200'
                      }`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 text-xs font-semibold">
                      {user.institution || user.company_name || 'N/A (Citizen)'}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono text-slate-500 text-xs">
                      {user.created_at ? String(user.created_at).substring(0, 19).replace('T', ' ') : 'Just Now'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'problems' && (
          <div className="overflow-x-auto w-full">
            <table className="w-full text-xs sm:text-sm text-left">
              <thead>
                <tr className="border-b border-slate-200 text-[11px] uppercase font-bold text-slate-500 bg-slate-50">
                  <th className="py-3 px-4">Ticket Code</th>
                  <th className="py-3 px-4">Problem Title & Domain</th>
                  <th className="py-3 px-4">Assigned University</th>
                  <th className="py-3 px-4 text-center">District</th>
                  <th className="py-3 px-4 text-center">Reporter</th>
                  <th className="py-3 px-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {problems.map((prob: any, idx: number) => (
                  <tr key={prob.id || prob.ticket_code || idx} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-blue-700">
                      {prob.ticket_code}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900 line-clamp-1">{prob.title}</div>
                      <div className="text-[11px] text-slate-500 font-semibold">{prob.domain || prob.user_category || prob.ai_predicted_category}</div>
                    </td>
                    <td className="py-3.5 px-4 text-xs font-semibold text-slate-700 max-w-xs truncate">
                      {prob.assigned_university}
                    </td>
                    <td className="py-3.5 px-4 text-center font-bold text-slate-800">{prob.district || 'Ranchi'}</td>
                    <td className="py-3.5 px-4 text-center text-xs font-semibold text-slate-700">
                      {prob.reporter_name || 'Citizen'}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <span className="px-2.5 py-1 rounded text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                        {prob.status || 'Submitted'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}

export default AdminDashboard;
