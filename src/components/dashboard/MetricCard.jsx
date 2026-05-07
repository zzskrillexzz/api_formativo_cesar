import React from 'react';

export const MetricCard = ({ title, value, icon: Icon, colorClass, trend }) => (
  <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 flex items-center gap-4 relative overflow-hidden group hover:border-blue-300 transition-all">
    <div className={`p-3 rounded-2xl ${colorClass.bg} ${colorClass.text}`}>
      <Icon size={24} strokeWidth={2.5} />
    </div>
    <div>
      <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.1em]">{title}</p>
      <h3 className="text-2xl font-black text-slate-800 tracking-tighter">{value}</h3>
      {trend && <p className="text-emerald-600 text-[10px] font-bold mt-0.5">{trend} que el mes pasado</p>}
    </div>
  </div>
);