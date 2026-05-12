import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, FileText, Loader2, RefreshCw } from 'lucide-react';
import { masVendidosService } from '../api/services/masVendidosService';
import { reportesService } from '../api/services/reportesService';
import { anulacionesService } from '../api/services/anulacionesService';

const Reportes = () => {
  const [tab, setTab] = useState('masVendidos');
  const [masVendidos, setMasVendidos] = useState([]);
  const [reportes, setReportes] = useState([]);
  const [anulaciones, setAnulaciones] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [top, reps, anuls] = await Promise.all([
        masVendidosService.listar().catch(() => []),
        reportesService.listar().catch(() => []),
        anulacionesService.listar().catch(() => [])
      ]);
      setMasVendidos(top);
      setReportes(reps);
      setAnulaciones(anuls);
    } catch (err) {
      console.error('Error cargando reportes:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const tabs = [
    { id: 'masVendidos', label: 'Más Vendidos', icon: TrendingUp },
    { id: 'reportes', label: 'Reportes', icon: BarChart3 },
    { id: 'anulaciones', label: 'Anulaciones', icon: FileText },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-blue-600" size={40} />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      {/* Tabs */}
      <div className="flex items-center gap-2 bg-white rounded-2xl p-1.5 shadow-sm border border-slate-200 w-fit">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-5 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
              tab === t.id ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <t.icon size={16} /> {t.label}
          </button>
        ))}
      </div>

      <button onClick={fetchData} className="p-3 bg-white border border-slate-200 rounded-2xl hover:bg-slate-50 transition-all shadow-sm">
        <RefreshCw size={18} className="text-slate-500" />
      </button>

      {/* TAB: Más Vendidos */}
      {tab === 'masVendidos' && (
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-6 border-b border-slate-100">
            <h3 className="font-black text-slate-800 tracking-tight">Productos Más Vendidos</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50/50 text-slate-400 text-[10px] uppercase font-black tracking-widest border-b border-slate-100">
                <tr>
                  <th className="px-6 py-4">#</th>
                  <th className="px-6 py-4">Producto ID</th>
                  <th className="px-6 py-4">Nombre</th>
                  <th className="px-6 py-4 text-right">Total Vendido</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-sm font-bold text-slate-600">
                {masVendidos.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="px-6 py-12 text-center text-slate-400 italic">Sin datos de ventas</td>
                  </tr>
                ) : (
                  masVendidos.map((item, i) => (
                    <tr key={i} className="hover:bg-slate-50">
                      <td className="px-6 py-4 text-slate-400">{i + 1}</td>
                      <td className="px-6 py-4 text-slate-400 text-xs">{item.producto_id}</td>
                      <td className="px-6 py-4">{item.nombre}</td>
                      <td className="px-6 py-4 text-right font-black text-emerald-600">{item.total_vendido}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB: Reportes */}
      {tab === 'reportes' && (
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-6 border-b border-slate-100">
            <h3 className="font-black text-slate-800 tracking-tight">Reportes del Sistema</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50/50 text-slate-400 text-[10px] uppercase font-black tracking-widest border-b border-slate-100">
                <tr>
                  <th className="px-6 py-4">ID</th>
                  <th className="px-6 py-4">Datos</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-sm font-bold text-slate-600">
                {reportes.length === 0 ? (
                  <tr>
                    <td colSpan="2" className="px-6 py-12 text-center text-slate-400 italic">No hay reportes disponibles</td>
                  </tr>
                ) : (
                  reportes.map((r, i) => (
                    <tr key={i} className="hover:bg-slate-50">
                      <td className="px-6 py-4 text-slate-400 text-xs">{r.id || i + 1}</td>
                      <td className="px-6 py-4">{JSON.stringify(r)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB: Anulaciones */}
      {tab === 'anulaciones' && (
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-6 border-b border-slate-100">
            <h3 className="font-black text-slate-800 tracking-tight">Ventas Anuladas</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50/50 text-slate-400 text-[10px] uppercase font-black tracking-widest border-b border-slate-100">
                <tr>
                  <th className="px-6 py-4">ID</th>
                  <th className="px-6 py-4">Motivo</th>
                  <th className="px-6 py-4">Fecha</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-sm font-bold text-slate-600">
                {anulaciones.length === 0 ? (
                  <tr>
                    <td colSpan="3" className="px-6 py-12 text-center text-slate-400 italic">No hay anulaciones registradas</td>
                  </tr>
                ) : (
                  anulaciones.map((a, i) => (
                    <tr key={i} className="hover:bg-slate-50">
                      <td className="px-6 py-4 text-slate-400 text-xs">{a.id || a.anv_id}</td>
                      <td className="px-6 py-4">{a.motivo || a.anv_motivo || '-'}</td>
                      <td className="px-6 py-4 text-slate-400">{a.fecha || a.anv_fecha || '-'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reportes;