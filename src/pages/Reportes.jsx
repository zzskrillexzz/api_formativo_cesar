import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, FileText, RefreshCw, Package, AlertCircle } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import { ThemeLoader } from '../components/ThemeLoader';
import { masVendidosService } from '../api/services/masVendidosService';
import { reportesService } from '../api/services/reportesService';
import { anulacionesService } from '../api/services/anulacionesService';

const COLORS = ['#059669', '#0d9488', '#0284c7', '#7c3aed', '#db2777', '#ea580c', '#ca8a04', '#4f46e5'];

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-slate-200 rounded-md p-3 shadow-lg">
        <p className="text-xs font-bold text-slate-600">{label}</p>
        <p className="text-sm font-bold text-emerald-600">{payload[0].value}</p>
      </div>
    );
  }
  return null;
};

const EmptyState = ({ message }) => (
  <div className="flex flex-col items-center justify-center py-16 text-slate-400">
    <AlertCircle size={48} className="mb-4 opacity-50" />
    <p className="text-sm font-bold italic">{message}</p>
  </div>
);

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

  // ── Datos procesados para graficos ──
  const masVendidosChart = masVendidos
    .map(m => ({ name: m.nombre || m.producto_id, value: Number(m.total_vendido) || 0 }))
    .filter(m => m.value > 0).sort((a, b) => b.value - a.value)
    .slice(0, 10);

  // Agrupar reportes por tipo
  const reportesPorTipo = reportes.reduce((acc, r) => {
    const tipo = r.tipo || 'Sin tipo';
    acc[tipo] = (acc[tipo] || 0) + 1;
    return acc;
  }, {});
  const reportesChart = Object.entries(reportesPorTipo).map(([name, value]) => ({ name, value }));

  // Agrupar anulaciones por motivo
  const anulacionesPorMotivo = anulaciones.reduce((acc, a) => {
    const motivo = a.motivo || 'Sin motivo';
    acc[motivo] = (acc[motivo] || 0) + 1;
    return acc;
  }, {});
  const anulacionesChart = Object.entries(anulacionesPorMotivo).map(([name, value]) => ({ name, value }));

  const tabs = [
    { id: 'masVendidos', label: 'Mas Vendidos', icon: TrendingUp },
    { id: 'reportes', label: 'Reportes', icon: BarChart3 },
    { id: 'anulaciones', label: 'Anulaciones', icon: FileText },
  ];

  


  if (loading) return <ThemeLoader module="Reportes" />;

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      {/* Tabs */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 bg-white rounded-lg p-1.5 shadow-sm border border-slate-200 w-fit">
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`select-none cursor-pointer flex items-center gap-2 px-5 py-3 rounded-md text-xs font-bold uppercase tracking-wider transition-all ${
                tab === t.id ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <t.icon size={16} /> {t.label}
            </button>
          ))}
        </div>
        <button onClick={fetchData} className="p-3 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-all shadow-sm">
          <RefreshCw size={18} className="text-slate-500" />
        </button>
      </div>

      {/* TAB: Mas Vendidos */}
      {tab === 'masVendidos' && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 card-hover">
            <h3 className="font-bold text-slate-800 tracking-tight mb-1">Productos Mas Vendidos</h3>
            <p className="text-xs text-slate-400 font-medium mb-6">Top {masVendidosChart.length} productos por volumen de ventas</p>
            {masVendidosChart.length === 0 ? (
              <EmptyState message="Sin datos de ventas disponibles" />
            ) : (
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={masVendidosChart} layout="vertical" margin={{ left: 20, right: 20, top: 10, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis type="number" tick={{ fontSize: 11, fontWeight: 'bold', fill: '#94a3b8' }} />
                  <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 11, fontWeight: 'bold', fill: '#475569' }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="value" fill="#059669" radius={[0, 8, 8, 0]} barSize={28} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
          {/* Tabla resumen */}
          {masVendidos.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden card-hover">
              <div className="p-4 border-b border-slate-100">
                <h4 className="font-bold text-xs text-slate-500 uppercase tracking-wider">Detalle</h4>
              </div>
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50/50 text-slate-400 text-xs uppercase font-bold tracking-wider">
                  <tr>
                    <th className="px-6 py-3">Producto</th>
                    <th className="px-6 py-3 text-right">Total Vendido</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 font-bold text-slate-600">
                  {masVendidos.map((item, i) => (
                    <tr key={i} className="hover:bg-slate-50">
                      <td className="px-6 py-3">{item.nombre || item.producto_id}</td>
                      <td className="px-6 py-3 text-right text-emerald-600">{item.total_vendido}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB: Reportes */}
      {tab === 'reportes' && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 card-hover">
            <h3 className="font-bold text-slate-800 tracking-tight mb-1">Reportes por Tipo</h3>
            <p className="text-xs text-slate-400 font-medium mb-6">Distribucion de reportes generados</p>
            {reportesChart.length === 0 ? (
              <EmptyState message="No hay reportes generados" />
            ) : (
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={reportesChart} margin={{ top: 10, right: 20, left: 10, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fontWeight: 'bold', fill: '#475569' }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11, fontWeight: 'bold', fill: '#94a3b8' }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="value" fill="#0d9488" radius={[8, 8, 0, 0]} barSize={48} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
          {/* Tabla detalle */}
          {reportes.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden card-hover">
              <div className="p-4 border-b border-slate-100">
                <h4 className="font-bold text-xs text-slate-500 uppercase tracking-wider">Ultimos reportes</h4>
              </div>
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50/50 text-slate-400 text-xs uppercase font-bold tracking-wider">
                  <tr>
                    <th className="px-6 py-3">Tipo</th>
                    <th className="px-6 py-3">Usuario</th>
                    <th className="px-6 py-3">Fecha</th>
                    <th className="px-6 py-3">Parametros</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 font-bold text-slate-600">
                  {reportes.slice(0, 20).map((r, i) => (
                    <tr key={i} className="hover:bg-slate-50">
                      <td className="px-6 py-3">
                        <span className="px-2 py-1 bg-emerald-50 text-emerald-700 rounded-md text-xs font-bold uppercase">{r.tipo || '-'}</span>
                      </td>
                      <td className="px-6 py-3 text-slate-400">{r.usuario_id || '-'}</td>
                      <td className="px-6 py-3 text-slate-400 text-xs">{r.fecha || '-'}</td>
                      <td className="px-6 py-3 text-slate-400 text-xs max-w-[200px] truncate">{r.parametros || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB: Anulaciones */}
      {tab === 'anulaciones' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 card-hover">
              <h3 className="font-bold text-slate-800 tracking-tight mb-1">Anulaciones por Motivo</h3>
              <p className="text-xs text-slate-400 font-medium mb-6">Distribucion de motivos de anulacion</p>
              {anulacionesChart.length === 0 ? (
                <EmptyState message="No hay anulaciones registradas" />
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={anulacionesChart}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      innerRadius={50}
                      paddingAngle={3}
                      label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                      labelLine={{ stroke: '#cbd5e1', strokeWidth: 1 }}
                    >
                      {anulacionesChart.map((_, index) => (
                        <Cell key={index} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 card-hover">
              <h3 className="font-bold text-slate-800 tracking-tight mb-1">Resumen</h3>
              <p className="text-xs text-slate-400 font-medium mb-6">Conteo por motivo</p>
              {anulacionesChart.length === 0 ? (
                <EmptyState message="Sin datos" />
              ) : (
                <div className="space-y-3">
                  {anulacionesChart.map((item, i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-slate-50 rounded-md">
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                        <span className="text-sm font-bold text-slate-700">{item.name}</span>
                      </div>
                      <span className="text-sm font-bold text-slate-500">{item.value}</span>
                    </div>
                  ))}
                  <div className="pt-3 border-t border-slate-100 flex justify-between">
                    <span className="text-xs font-bold text-slate-400">Total anulaciones</span>
                    <span className="text-xs font-bold text-slate-600">{anulaciones.length}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
          {/* Tabla detalle */}
          {anulaciones.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden card-hover">
              <div className="p-4 border-b border-slate-100">
                <h4 className="font-bold text-xs text-slate-500 uppercase tracking-wider">Registro de anulaciones</h4>
              </div>
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50/50 text-slate-400 text-xs uppercase font-bold tracking-wider">
                  <tr>
                    <th className="px-6 py-3">Factura</th>
                    <th className="px-6 py-3">Motivo</th>
                    <th className="px-6 py-3">Fecha</th>
                    <th className="px-6 py-3">Usuario</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 font-bold text-slate-600">
                  {anulaciones.slice(0, 20).map((a, i) => (
                    <tr key={i} className="hover:bg-slate-50">
                      <td className="px-6 py-3 text-slate-400 text-xs">{a.factura_id || a.id}</td>
                      <td className="px-6 py-3">{a.motivo || '-'}</td>
                      <td className="px-6 py-3 text-slate-400 text-xs">{a.fecha || '-'}</td>
                      <td className="px-6 py-3 text-slate-400 text-xs">{a.usuario_id || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Reportes;





