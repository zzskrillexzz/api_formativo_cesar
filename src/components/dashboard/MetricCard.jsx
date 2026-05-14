import React from 'react';
import { AnimatedCounter } from '../AnimatedCounter';

export const MetricCard = ({ title, value, icon: Icon, colorClass, trend }) => {
  const isNumeric = /^\d+$/.test(String(value));

  return (
    <div className="bg-white rounded-lg p-5 shadow-sm border border-slate-200/60 flex items-center gap-4 hover:shadow-md transition-shadow">
      <div className={`p-3 rounded-lg ${colorClass.bg} ${colorClass.text}`}>
        <Icon size={22} strokeWidth={2} />
      </div>
      <div>
        <p className="text-slate-500 text-sm font-bold uppercase tracking-wider">{title}</p>
        <h3 className="text-2xl font-bold text-slate-800 tracking-tight">
          {isNumeric ? <AnimatedCounter value={parseInt(value)} /> : value}
        </h3>
        {trend && <p className="text-emerald-600 text-xs font-medium mt-0.5">{trend}</p>}
      </div>
    </div>
  );
};


