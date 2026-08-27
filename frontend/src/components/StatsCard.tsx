import React, { ElementType } from 'react';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: ElementType;
  color?: 'blue' | 'cyan' | 'amber' | 'emerald' | 'purple';
  subtitle?: string;
  trend?: string;
}

function StatsCard({ title, value, icon: Icon, color = 'blue', subtitle, trend }: StatsCardProps) {
  const colorMap = {
    blue: { 
      bg: 'bg-blue-500/15', 
      text: 'text-blue-400', 
      border: 'border-blue-500/30',
      gradient: 'from-blue-600/30 to-indigo-600/30',
      glow: 'shadow-blue-500/20'
    },
    cyan: { 
      bg: 'bg-cyan-500/15', 
      text: 'text-cyan-400', 
      border: 'border-cyan-500/30',
      gradient: 'from-cyan-600/30 to-teal-600/30',
      glow: 'shadow-cyan-500/20'
    },
    amber: { 
      bg: 'bg-amber-500/15', 
      text: 'text-amber-400', 
      border: 'border-amber-500/30',
      gradient: 'from-amber-600/30 to-orange-600/30',
      glow: 'shadow-amber-500/20'
    },
    emerald: { 
      bg: 'bg-emerald-500/15', 
      text: 'text-emerald-400', 
      border: 'border-emerald-500/30',
      gradient: 'from-emerald-600/30 to-green-600/30',
      glow: 'shadow-emerald-500/20'
    },
    purple: { 
      bg: 'bg-purple-500/15', 
      text: 'text-purple-400', 
      border: 'border-purple-500/30',
      gradient: 'from-purple-600/30 to-pink-600/30',
      glow: 'shadow-purple-500/20'
    },
  };

  const colorStyles = colorMap[color] || colorMap.blue;

  return (
    <div className="glass-card p-6 relative overflow-hidden group hover:border-slate-700/80">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">{title}</p>
          <h3 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">{value}</h3>
          {subtitle && (
            <p className="text-xs text-slate-400 mt-2 flex items-center gap-1.5">
              {trend && <span className="text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">{trend}</span>}
              <span>{subtitle}</span>
            </p>
          )}
        </div>
        
        <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${colorStyles.gradient} ${colorStyles.border} border ${colorStyles.glow} shadow-lg flex items-center justify-center transition-all duration-300 group-hover:scale-110 shrink-0`}>
          <Icon className={`w-7 h-7 ${colorStyles.text}`} />
        </div>
      </div>
      
      {/* Background ambient light */}
      <div className={`absolute -right-8 -bottom-8 w-28 h-28 rounded-full ${colorStyles.bg} blur-3xl pointer-events-none opacity-40 group-hover:opacity-70 transition-opacity`} />
    </div>
  );
}

export default StatsCard;
