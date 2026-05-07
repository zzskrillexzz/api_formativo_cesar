import React from 'react';
import { TrendingUp, Box, Clock, Truck, Activity, ShoppingCart, Package, BarChart3, Filter, CheckCircle2 } from 'lucide-react';
import { MetricCard } from '../components/dashboard/MetricCard';

const Dashboard = () => (
  <div className="space-y-6 animate-in fade-in duration-700">
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <MetricCard title="Ventas Hoy" value="$1.2M" icon={TrendingUp} colorClass={{bg:'bg-blue-50', text:'text-blue-600'}} trend="+5.2%" />
      <MetricCard title="Stock Total" value="850" icon={Box} colorClass={{bg:'bg-emerald-50', text:'text-emerald-600'}} />
      <MetricCard title="Vencimientos" value="12" icon={Clock} colorClass={{bg:'bg-orange-50', text:'text-orange-600'}} />
      <MetricCard title="Proveedores" value="15" icon={Truck} colorClass={{bg:'bg-slate-100', text:'text-slate-600'}} />
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white">
          <h3 className="font-black text-slate-800 flex items-center gap-2 tracking-tight">
            <Activity className="text-emerald-500" size={20}/> 
            Alertas de Lotes y Vencimientos
          </h3>
          <span className="text-[10px] bg-slate-100 text-slate-500 font-black px-2 py-1 rounded-md uppercase tracking-widest">v_proximos_vencer</span>
        </div>
        <table className="w-full text-left">
          <thead className="bg-slate-50/50 text-slate-400 text-[10px] uppercase font-black tracking-widest border-b border-slate-100">
            <tr>
              <th className="px-6 py-4">Producto</th>
              <th className="px-6 py-4">Estado</th>
              <th className="px-6 py-4 text-right">Días</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 text-sm font-bold text-slate-600">
            {[
              { n: 'Amoxicilina 500mg', s: 'Crítico', d: '15 días', c: 'text-red-600 bg-red-50' },
              { n: 'Ibuprofeno Forte', s: 'Alerta', d: '45 días', c: 'text-orange-600 bg-orange-50' },
              { n: 'Alcohol 70%', s: 'Óptimo', d: '180 días', c: 'text-emerald-600 bg-emerald-50' },
            ].map((row, i) => (
              <tr key={i} className="hover:bg-slate-50">
                <td className="px-6 py-4">{row.n}</td>
                <td className="px-6 py-4"><span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase ${row.c}`}>{row.s}</span></td>
                <td className="px-6 py-4 text-right text-slate-400">{row.d}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="space-y-4">
        <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-3xl p-6 text-white shadow-lg shadow-blue-200">
          <h4 className="font-black text-sm uppercase tracking-widest mb-4 opacity-80 italic">Acceso Rápido</h4>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Nueva Venta', icon: ShoppingCart },
              { label: 'Cargar Lote', icon: Package },
              { label: 'Reporte PDF', icon: BarChart3 },
              { label: 'Ajuste Stock', icon: Filter },
            ].map((btn, i) => (
              <button key={i} className="flex flex-col items-center justify-center p-4 bg-white/10 hover:bg-white/20 rounded-2xl transition-all border border-white/10">
                <btn.icon size={20} className="mb-2" />
                <span className="text-[10px] font-bold uppercase text-center leading-tight">{btn.label}</span>
              </button>
            ))}
          </div>
        </div>
        <div className="bg-emerald-50 border border-emerald-100 rounded-3xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <CheckCircle2 className="text-emerald-600" size={24} />
            <h4 className="font-black text-emerald-900 text-sm uppercase">Estado Sistema</h4>
          </div>
          <p className="text-emerald-700/70 text-xs font-medium leading-relaxed italic">Base de datos sincronizada.</p>
        </div>
      </div>
    </div>
  </div>
);

export default Dashboard;