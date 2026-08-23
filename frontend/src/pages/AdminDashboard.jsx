import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  MapPin, 
  Sparkles, 
  RefreshCw
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
import { getAnalyticsSummary, getProblems } from '../services/api';
import { useLanguage } from '../context/LanguageContext';

const DOMAIN_COLOR_MAP = {
  "Water Management": "#38bdf8",
  "Healthcare": "#f43f5e",
  "Agriculture": "#22c55e",
  "Education": "#a855f7",
  "Sanitation": "#f59e0b",
  "Infrastructure & Energy": "#3b82f6",
  "Environment & Forests": "#10b981"
};

const VIBRANT_BAR_COLORS = [
  '#38bdf8', // Sky Blue
  '#f43f5e', // Rose Red
  '#22c55e', // Emerald Green
  '#a855f7', // Purple
  '#f59e0b', // Amber Gold
  '#3b82f6', // Electric Blue
  '#ec4899', // Pink
  '#10b981', // Teal
  '#06b6d4', // Cyan
  '#84cc16'  // Lime
];

function AdminDashboard() {
  const { t } = useLanguage();
  const [summary, setSummary] = useState(null);
  const [problems, setProblems] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadData = async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    
    // Per-request resilient loading using Promise.allSettled
    const results = await Promise.allSettled([
      getAnalyticsSummary(),
      getProblems()
    ]);

    const [sumResult, probResult] = results;

    if (sumResult.status === 'fulfilled' && sumResult.value?.data) {
      setSummary(sumResult.value.data);
    } else {
      console.warn('Analytics summary dataset request failed or unauthenticated:', sumResult.reason);
    }

    if (probResult.status === 'fulfilled' && probResult.value?.data) {
      setProblems(probResult.value.data);
    } else {
      console.warn('Problems dataset request failed:', probResult.reason);
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

  if (loading && !summary && problems.length === 0) {
    return (
      <div className="w-full max-w-[1720px] mx-auto py-24 px-4 text-center" role="status" aria-live="polite">
        <div className="inline-flex items-center gap-3 text-slate-200 font-medium text-sm animate-pulse full-screen-card px-8 py-5 border-[#1e2d54]">
          <Sparkles className="w-5 h-5 animate-spin text-blue-400" aria-hidden="true" /> Synchronizing Analytics & GIS Datasets...
        </div>
      </div>
    );
  }

  const domainDist = summary?.domain_distribution || [];
  const totalDomainCount = domainDist.reduce((acc, curr) => acc + curr.value, 0) || 1;

  return (
    <div className="w-full max-w-[1720px] mx-auto py-10 sm:py-16 px-4 sm:px-8 lg:px-12 flex flex-col gap-10 sm:gap-12 pb-12">
      
      {/* Page Header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 border-b border-[#1e2d54]/80 pb-8 w-full">
        <div>
          <div className="text-xs font-semibold tracking-wider text-slate-300 uppercase mb-1.5">
            Government of Jharkhand · State Executive Dashboard
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
            {t('analyticsTitle')}
          </h1>
          <p className="text-xs sm:text-sm text-slate-200 mt-1.5 leading-relaxed max-w-5xl">
            {t('analyticsDesc')}
          </p>
        </div>

        <button 
          type="button"
          onClick={() => loadData(false)}
          className="btn-secondary py-3 px-5 text-xs sm:text-sm font-semibold shrink-0 bg-[#0e172e] border-[#2a3b63]/80 shadow-md cursor-pointer focus-visible:ring-2 focus-visible:ring-blue-400"
          title="Refresh Analytics Data"
          aria-label="Refresh executive analytics datasets"
        >
          <RefreshCw className="w-4 h-4 text-blue-400" aria-hidden="true" />
          <span>Refresh</span>
        </button>
      </header>

      {/* KPI SUMMARY ROW */}
      <section aria-label="Key Performance Indicators Summary" className="grid grid-cols-2 lg:grid-cols-4 border-y border-[#1e2d54] py-8 gap-8 divide-y sm:divide-y-0 sm:divide-x divide-[#1e2d54]/60 w-full">
        
        <div className="space-y-1.5 sm:px-6">
          <div className="text-4xl sm:text-5xl font-bold text-white font-mono">
            {summary?.total_submitted || problems.length || 0}
          </div>
          <div className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-slate-300">
            {t('totalChallenges')}
          </div>
        </div>

        <div className="space-y-1.5 sm:px-6 pt-4 sm:pt-0">
          <div className="text-4xl sm:text-5xl font-bold text-white font-mono">
            {summary?.active_projects || 0}
          </div>
          <div className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-slate-300">
            {t('activeProjects')}
          </div>
        </div>

        <div className="space-y-1.5 sm:px-6 pt-4 sm:pt-0">
          <div className="text-4xl sm:text-5xl font-bold text-white font-mono">
            {summary?.completed_deployed || 0}
          </div>
          <div className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-slate-300">
            {t('deployedSolutions')}
          </div>
        </div>

        <div className="space-y-1.5 sm:px-6 pt-4 sm:pt-0">
          <div className="text-4xl sm:text-5xl font-bold text-white font-mono">
            {summary?.participating_heis || 6}
          </div>
          <div className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-slate-300">
            {t('participatingHeis')}
          </div>
        </div>

      </section>

      {/* Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-12 w-full items-start">
        
        {/* VIBRANT DOMAIN CATEGORY PIE CHART & TABLE */}
        <section 
          aria-label="Domain Category Breakdown Chart"
          className="full-screen-card p-8 sm:p-10 flex flex-col border-[#1e2d54] bg-[#0e172e] shadow-2xl w-full space-y-6"
        >
          <div>
            <h2 className="text-base sm:text-lg font-bold text-white mb-1">
              {t('domainBreakdown')}
            </h2>
            <p className="text-xs text-slate-300">AI Zero-Shot classification volume by sector</p>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart aria-label="Sector Domain Distribution Donut Chart">
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
                    const color = DOMAIN_COLOR_MAP[entry.name] || '#3b82f6';
                    return <Cell key={entry.name} fill={color} stroke="#0e172e" strokeWidth={2} />;
                  })}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#080d1a', borderColor: '#1e2d54', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Compact Structured Table under Donut Chart */}
          <div className="border-t border-[#1e2d54] pt-4 w-full">
            <table className="w-full text-xs text-left">
              <caption className="sr-only">Sector Domain Distribution Summary</caption>
              <thead>
                <tr className="border-b border-[#1e2d54]/60 text-[10px] sm:text-xs uppercase font-bold text-slate-300">
                  <th scope="col" className="py-2.5">Sector Domain</th>
                  <th scope="col" className="py-2.5 text-right">Count</th>
                  <th scope="col" className="py-2.5 text-right">Share</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1e2d54]/40">
                {domainDist.map((d) => {
                  const color = DOMAIN_COLOR_MAP[d.name] || '#3b82f6';
                  const percent = Math.round((d.value / totalDomainCount) * 100);
                  return (
                    <tr key={d.name} className="hover:bg-[#111c38]/50">
                      <td className="py-2.5 flex items-center gap-2 font-medium text-slate-200">
                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} aria-hidden="true" />
                        <span className="truncate">{d.name}</span>
                      </td>
                      <td className="py-2.5 text-right font-mono font-bold text-white">{d.value}</td>
                      <td className="py-2.5 text-right font-mono text-slate-300">{percent}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        {/* VIBRANT COLORFUL DISTRICT SUBMISSIONS BAR CHART */}
        <section 
          aria-label="District-Wise Submissions Bar Chart"
          className="full-screen-card p-8 sm:p-10 flex flex-col border-[#1e2d54] bg-[#0e172e] shadow-2xl w-full space-y-6"
        >
          <div>
            <h2 className="text-base sm:text-lg font-bold text-white mb-1">
              {t('districtWise')}
            </h2>
            <p className="text-xs text-slate-300">Geographic challenge volume across Jharkhand</p>
          </div>

          <div className="h-80 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={summary?.district_distribution || []}
                layout="vertical"
                margin={{ top: 10, right: 20, left: 10, bottom: 10 }}
                aria-label="District Submissions Horizontal Bar Chart"
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#1e2d54" horizontal={true} vertical={false} />
                <XAxis type="number" stroke="#94a3b8" tick={{ fontSize: 11 }} allowDecimals={false} domain={[0, 'auto']} />
                <YAxis dataKey="district" type="category" stroke="#cbd5e1" tick={{ fontSize: 11 }} width={80} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#080d1a', borderColor: '#1e2d54', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                />
                <Bar dataKey="count" radius={[0, 6, 6, 0]} barSize={18}>
                  {(summary?.district_distribution || []).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={VIBRANT_BAR_COLORS[index % VIBRANT_BAR_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

      </div>

      {/* GIS SPATIAL MAP SECTION */}
      <section 
        aria-label="Statewide GIS Spatial Map"
        className="full-screen-card p-8 sm:p-10 border-[#1e2d54] bg-[#0e172e] shadow-2xl space-y-6 w-full"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#1e2d54] pb-4">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <MapPin className="w-5 h-5 text-blue-400" aria-hidden="true" />
              {t('gisMapTitle')}
            </h2>
            <p className="text-xs text-slate-300">Geospatial problem mapping centered on Jharkhand bounding box</p>
          </div>
        </div>

        <div className="h-[480px] w-full rounded-xl overflow-hidden border border-[#1e2d54]">
          <MapView problems={problems} />
        </div>
      </section>

      {/* UNIVERSITY PERFORMANCE LEADERBOARD TABLE */}
      <section 
        aria-label="University R&D Performance Leaderboard"
        className="full-screen-card p-8 sm:p-10 lg:p-12 border-[#1e2d54] bg-[#0e172e] shadow-2xl space-y-6 w-full mb-8"
      >
        <div className="flex items-center justify-between border-b border-[#1e2d54] pb-5">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2.5">
              <Building2 className="w-5 h-5 text-blue-400" aria-hidden="true" />
              {t('leaderboardTitle')}
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 mt-1">Higher Education Institutions ranked by active and deployed projects</p>
          </div>
        </div>

        <div className="overflow-x-auto w-full">
          <table className="w-full text-xs sm:text-sm text-left">
            <caption className="sr-only">Ranked Performance Leaderboard of Participating Universities</caption>
            <thead>
              <tr className="border-b border-[#1e2d54] text-[11px] sm:text-xs uppercase font-bold text-slate-300 bg-[#080d1a]/60">
                <th scope="col" className="py-3.5 px-4">University Nodal Institution</th>
                <th scope="col" className="py-3.5 px-4 text-center">Assigned Projects</th>
                <th scope="col" className="py-3.5 px-4 text-center">Active R&D</th>
                <th scope="col" className="py-3.5 px-4 text-center">Deployed</th>
                <th scope="col" className="py-3.5 px-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e2d54]/60">
              {(!summary?.university_performance || summary.university_performance.length === 0) ? (
                <tr>
                  <td colSpan="5" className="py-12 text-center text-slate-300 text-xs sm:text-sm font-medium">
                    Synchronizing University R&D Performance Rankings...
                  </td>
                </tr>
              ) : (
                summary.university_performance.map((uni, idx) => (
                  <tr key={idx} className="hover:bg-[#111c38]/60 transition-colors">
                    <td className="py-4 px-4 font-bold text-white flex items-center gap-3">
                      <span className="w-6 h-6 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center text-[10px] font-mono shrink-0">
                        {idx + 1}
                      </span>
                      <span className="truncate">{uni.name}</span>
                    </td>
                    <td className="py-4 px-4 text-center font-mono font-bold text-slate-200">{uni.total_assigned}</td>
                    <td className="py-4 px-4 text-center font-mono font-bold text-blue-400">{uni.in_progress}</td>
                    <td className="py-4 px-4 text-center font-mono font-bold text-emerald-400">{uni.deployed}</td>
                    <td className="py-4 px-4 text-right">
                      <span className="px-2.5 py-1 rounded text-[10px] sm:text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        Active Nodal Node
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

    </div>
  );
}

export default AdminDashboard;
