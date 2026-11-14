import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  change?: string;
  icon: LucideIcon;
  badge?: string;
}

export const StatCard: React.FC<StatCardProps> = ({ title, value, change, icon: Icon, badge }) => {
  return (
    <div className="glass-panel glow-card p-5 rounded-2xl relative overflow-hidden group">
      <div className="flex items-center justify-between mb-4">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          {title}
        </span>
        <div className="w-9 h-9 rounded-xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-center text-brand-400 group-hover:scale-110 group-hover:border-brand-500/50 transition-all duration-300">
          <Icon className="w-4 h-4" />
        </div>
      </div>

      <div className="flex items-baseline justify-between">
        <div className="text-2xl font-bold tracking-tight text-white">{value}</div>
        {badge && (
          <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-brand-500/10 text-brand-300 border border-brand-500/20">
            {badge}
          </span>
        )}
      </div>

      {change && (
        <div className="mt-3 text-xs text-slate-400 flex items-center gap-1.5">
          <span className="text-emerald-400 font-medium">↑</span>
          <span>{change}</span>
        </div>
      )}
    </div>
  );
};
