import React from 'react';
import { AnimatedCounter } from '../AnimatedCounter';

export const MetricCard = ({ title, value, icon: Icon, colorClass, trend, trendUp = true }) => {
  const isNumeric = /^\d+$/.test(String(value));

  return (
    <div className="group bg-white rounded-xl p-5 shadow-sm border border-slate-200/80 flex items-center gap-4 hover:shadow-lg hover:border-slate-300/80 transition-all duration-300">
      <div className={`p-3 rounded-xl ${colorClass.bg} ${colorClass.text} group-hover:scale-110 transition-transform duration-300`}>
        <Icon size={22} strokeWidth={2} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-slate-400 text-[11px] font-bold uppercase tracking-wider">{title}</p>
        <h3 className="text-2xl font-extrabold text-slate-800 tracking-tight">
          {isNumeric ? <AnimatedCounter value={parseInt(value)} /> : value}
        </h3>
        {trend && (
          <p className={`text-[11px] font-medium mt-0.5 flex items-center gap-1 ${
            trendUp ? 'text-emerald-600' : 'text-red-500'
          }`}>
            {trend}
          </p>
        )}
      </div>
    </div>
  );
};
