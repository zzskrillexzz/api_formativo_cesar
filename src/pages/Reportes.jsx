import React, { useState, useEffect, useRef } from 'react';
import { BarChart3, TrendingUp, FileText, RefreshCw, Package, AlertCircle, Download, FileDown, Calendar, Clock } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import { ThemeLoader } from '../components/ThemeLoader';
import { toast } from '../components/Toast';
import { masVendidosService } from '../api/services/masVendidosService';
import { reportesService } from '../api/services/reportesService';
import { anulacionesService } from '../api/services/anulacionesService';
import { useAuth } from '../context/AuthContext';

const COLORS = ['#ea580c', '#d97706', '#0284c7', '#7c3aed', '#db2777', '#ea580c', '#ca8a04', '#4f46e5'];
const GRAD_COLORS = [
  'url(#anulGrad0)', 'url(#anulGrad1)', 'url(#anulGrad2)', 'url(#anulGrad3)',
  'url(#anulGrad4)', 'url(#anulGrad5)', 'url(#anulGrad6)', 'url(#anulGrad7)'
];

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
  const { user } = useAuth();
  const [tab, setTab] = useState('generar');
  const [masVendidos, setMasVendidos] = useState([]);
  const [reportes, setReportes] = useState([]);
  const [anulaciones, setAnulaciones] = useState([]);
  const [loading, setLoading] = useState(true);

  // ── Reportes reales ──
  const [reporteTipo, setReporteTipo] = useState('ventas');
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');
  const [diasVencer, setDiasVencer] = useState(30);
  const [datosReporte, setDatosReporte] = useState(null);
  const [cargandoReporte, setCargandoReporte] = useState(false);
  const [reporteError, setReporteError] = useState('');
  const [exportando, setExportando] = useState(false);
  const downloadRef = useRef(null);

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

  // ── Generar reporte real (usando reportesService) ──
  const generarReporte = async () => {
    setCargandoReporte(true);
    setReporteError('');
    setDatosReporte(null);
    try {
      const params = {};
      if (fechaDesde) params.fecha_desde = fechaDesde;
      if (fechaHasta) params.fecha_hasta = fechaHasta;
      if (reporteTipo === 'por_vencer') params.dias = diasVencer;
      const data = await reportesService.generar(reporteTipo, params);
      setDatosReporte(data);
    } catch (err) {
      const msg = err.response?.data?.mensaje || err.message || 'Error al generar reporte';
      setReporteError(msg);
      toast({ type: 'error', title: 'Error', description: msg });
    } finally {
      setCargandoReporte(false);
    }
  };

  // ── Exportar PDF/Excel (blob + <a download> → muestra "Guardar como…") ──
  const exportarReporte = async (formato) => {
    if (exportando) return;
    setExportando(true);
    try {
      const token = sessionStorage.getItem('access_token');
      if (!token) {
        toast({ type: 'error', title: 'Sesión expirada', description: 'Inicie sesión nuevamente' });
        return;
      }

      const ext = formato === 'pdf' ? 'pdf' : 'xlsx';
      const fileName = `reporte_${reporteTipo}_${new Date().toISOString().slice(0, 10)}.${ext}`;
      const blob = await reportesService.exportar(reporteTipo, formato, {
        fecha_desde: fechaDesde || undefined,
        fecha_hasta: fechaHasta || undefined,
        dias: reporteTipo === 'por_vencer' ? diasVencer : undefined,
      });

      // Si el backend devolvió un JSON de error envuelto en Blob
      if (blob.type === 'application/json') {
        const text = await blob.text();
        const err = JSON.parse(text);
        throw new Error(err.mensaje || 'Error del servidor');
      }

      // Intentar con showSaveFilePicker (API moderna → muestra "Guardar como…")
      try {
        if ('showSaveFilePicker' in window) {
          const opts = {
            suggestedName: fileName,
            types: [{
              description: formato === 'pdf' ? 'PDF' : 'Excel',
              accept: formato === 'pdf'
                ? { 'application/pdf': ['.pdf'] }
                : { 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'] }
            }]
          };
          const handle = await window.showSaveFilePicker(opts);
          const writable = await handle.createWritable();
          await writable.write(blob);
          await writable.close();
          toast({ type: 'success', title: `Guardado`, description: `«${fileName}» se guardó correctamente` });
        } else {
          throw new Error('API no disponible');
        }
      } catch (pickerErr) {
        // Fallback: <a download> para navegadores sin showSaveFilePicker
        if (pickerErr.name === 'AbortError') {
          // El usuario canceló el diálogo — no hacer nada
          toast({ type: 'info', title: 'Cancelado', description: 'Descarga cancelada' });
          return;
        }
        const blobUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = blobUrl;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => window.URL.revokeObjectURL(blobUrl), 60000);
        toast({ type: 'success', title: `Descargando ${formato.toUpperCase()}`, description: `Archivo guardado en Descargas como «${fileName}»` });
      }
    } catch (err) {
      let msg = err.message || 'Error desconocido';
      try {
        if (err.response?.data instanceof Blob) {
          const text = await err.response.data.text();
          const json = JSON.parse(text);
          msg = json.mensaje || json.error || msg;
        } else if (err.response?.data?.mensaje) {
          msg = err.response.data.mensaje;
        }
      } catch (_) {}
      toast({ type: 'error', title: 'Error al exportar', description: msg });
      console.error('[ExportarReporte]', err);
    } finally {
      setTimeout(() => setExportando(false), 2000);
    }
  };

  // ── Datos procesados para graficos ──
  const masVendidosChart = masVendidos
    .map(m => ({ name: m.nombre || m.producto_id, value: Number(m.total_vendido) || 0 }))
    .filter(m => m.value > 0).sort((a, b) => b.value - a.value)
    .slice(0, 10);

  const reportesPorTipo = reportes.reduce((acc, r) => {
    const tipo = r.tipo || 'Sin tipo';
    acc[tipo] = (acc[tipo] || 0) + 1;
    return acc;
  }, {});
  const reportesChart = Object.entries(reportesPorTipo).map(([name, value]) => ({ name, value }));

  const anulacionesPorMotivo = anulaciones.reduce((acc, a) => {
    const motivo = a.motivo || 'Sin motivo';
    acc[motivo] = (acc[motivo] || 0) + 1;
    return acc;
  }, {});
  const anulacionesChart = Object.entries(anulacionesPorMotivo).map(([name, value]) => ({ name, value }));

  const tiposReporte = [
    { id: 'ventas', label: 'Ventas', icon: TrendingUp },
    { id: 'inventario', label: 'Inventario', icon: Package },
    { id: 'mas_vendidos', label: 'Más Vendidos', icon: BarChart3 },
    { id: 'por_vencer', label: 'Por Vencer', icon: Clock },
  ];

  const tabs = [
    { id: 'generar', label: 'Generar Reportes', icon: BarChart3 },
    { id: 'masVendidos', label: 'Top Ventas', icon: TrendingUp },
    { id: 'reportes', label: 'Historial', icon: FileText },
    { id: 'anulaciones', label: 'Anulaciones', icon: AlertCircle },
  ];

  if (loading) return <ThemeLoader module="Reportes" />;

  return (
    <>

    <div className="space-y-6 animate-in fade-in duration-700">
      {/* Tabs */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 bg-white rounded-lg p-1.5 shadow-sm border border-slate-200 w-fit flex-wrap">
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-5 py-3 rounded-md text-xs font-bold uppercase tracking-wider transition-all ${
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

      {/* ═════════════════════ TAB: GENERAR REPORTES ═════════════════════ */}
      {tab === 'generar' && (
        <div className="space-y-6">
          {/* Selector de tipo + filtros */}
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 card-hover">
            <h3 className="font-bold text-slate-800 tracking-tight mb-1">Generar Reporte</h3>
            <p className="text-xs text-slate-400 font-medium mb-4">Selecciona el tipo de reporte, aplica filtros y genera o descarga</p>

            {/* Tipo de reporte */}
            <div className="flex items-center gap-2 mb-4 flex-wrap">
              {tiposReporte.map(t => (
                <button
                  key={t.id}
                  onClick={() => { setReporteTipo(t.id); setDatosReporte(null); }}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                    reporteTipo === t.id
                      ? 'bg-emerald-600 text-white shadow-md'
                      : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                  }`}
                >
                  <t.icon size={14} /> {t.label}
                </button>
              ))}
            </div>

            {/* Filtros de fecha (excepto para inventario que no los usa) */}
            {reporteTipo !== 'inventario' && reporteTipo !== 'por_vencer' && (
              <div className="flex items-center gap-3 mb-4 flex-wrap">
                <div className="flex items-center gap-2">
                  <Calendar size={14} className="text-slate-400" />
                  <input
                    type="date" value={fechaDesde} onChange={(e) => setFechaDesde(e.target.value)}
                    className="text-xs border border-slate-300 rounded-md px-2.5 py-2 bg-white outline-none font-medium text-slate-600"
                  />
                </div>
                <span className="text-slate-300 text-xs">→</span>
                <input
                  type="date" value={fechaHasta} onChange={(e) => setFechaHasta(e.target.value)}
                  className="text-xs border border-slate-300 rounded-md px-2.5 py-2 bg-white outline-none font-medium text-slate-600"
                />
                {(fechaDesde || fechaHasta) && (
                  <button onClick={() => { setFechaDesde(''); setFechaHasta(''); }}
                    className="text-[10px] font-bold uppercase text-slate-400 hover:text-red-500">
                    ✕ Limpiar
                  </button>
                )}
              </div>
            )}

            {/* Días para por_vencer */}
            {reporteTipo === 'por_vencer' && (
              <div className="flex items-center gap-2 mb-4">
                <Clock size={14} className="text-slate-400" />
                <label className="text-xs font-medium text-slate-500">Alertar productos que vencen en los próximos</label>
                <input
                  type="number" min="1" max="365" value={diasVencer}
                  onChange={(e) => setDiasVencer(parseInt(e.target.value) || 30)}
                  className="w-20 text-xs border border-slate-300 rounded-md px-2.5 py-2 bg-white outline-none font-bold text-slate-600 text-center"
                />
                <span className="text-xs text-slate-500">días</span>
              </div>
            )}

            {/* Botones */}
            <div className="flex items-center gap-3">
              <button onClick={generarReporte} disabled={cargandoReporte}
                className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-emerald-700 transition-all shadow-md disabled:opacity-50">
                {cargandoReporte ? (
                  <RefreshCw size={14} className="animate-spin" />
                ) : (
                  <BarChart3 size={14} />
                )}
                Generar
              </button>
              {datosReporte && datosReporte.datos && datosReporte.datos.length > 0 && (
                <>
                  <button onClick={() => exportarReporte('pdf')} disabled={exportando}
                    className="flex items-center gap-2 px-4 py-2.5 bg-red-600 text-white rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-red-700 transition-all shadow-md disabled:opacity-50">
                    <FileDown size={14} /> PDF
                  </button>
                  <button onClick={() => exportarReporte('excel')} disabled={exportando}
                    className="flex items-center gap-2 px-4 py-2.5 bg-green-700 text-white rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-green-800 transition-all shadow-md disabled:opacity-50">
                    <Download size={14} /> Excel
                  </button>
                </>
              )}
            </div>

            {reporteError && (
              <div className="mt-4 p-4 bg-red-100 border-l-4 border-red-600 text-red-800 text-sm font-bold rounded-lg shadow-sm">
                {reporteError}
              </div>
            )}
          </div>

          {/* Resultados */}
          {datosReporte && (
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 border-l-4 border-l-orange-400 overflow-hidden card-hover">
              <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                <h4 className="font-bold text-sm text-slate-800">
                  {reporteTipo === 'ventas' && 'Reporte de Ventas'}
                  {reporteTipo === 'inventario' && 'Reporte de Inventario'}
                  {reporteTipo === 'mas_vendidos' && 'Productos Más Vendidos'}
                  {reporteTipo === 'por_vencer' && 'Medicamentos por Vencer'}
                </h4>
                <span className="text-[10px] bg-emerald-50 text-emerald-600 font-bold px-2 py-1 rounded-md">
                  {datosReporte.total} resultados
                </span>
              </div>

              {(!datosReporte.datos || datosReporte.datos.length === 0) ? (
                <EmptyState message="No hay datos para el período seleccionado" />
              ) : (
                <>
                  {/* Gráfico para mas_vendidos */}
                  {reporteTipo === 'mas_vendidos' && (
                    <div className="p-4">
                      <ResponsiveContainer width="100%" height={350}>
                        <BarChart
                          data={datosReporte.datos.slice(0, 10).map(d => ({ name: d.nombre, value: d.total_vendido }))}
                          layout="vertical" margin={{ left: 20, right: 20, top: 10, bottom: 10 }}
                          animationBegin={0} animationDuration={800} animationEasing="ease-out"
                        >
                          <defs>
                            <linearGradient id="gradEmeraldR" x1="0" y1="0" x2="1" y2="0">
                              <stop offset="0%" stopColor="#fbbf24" />
                              <stop offset="50%" stopColor="#f97316" />
                              <stop offset="100%" stopColor="#ea580c" />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                          <XAxis type="number" tick={{ fontSize: 11, fontWeight: 'bold', fill: '#94a3b8' }} />
                          <YAxis type="category" dataKey="name" width={140} tick={{ fontSize: 11, fontWeight: 'bold', fill: '#475569' }} />
                          <Tooltip content={<CustomTooltip />} />
                          <Bar dataKey="value" fill="url(#gradEmeraldR)" radius={[0, 8, 8, 0]} barSize={28} isAnimationActive={true} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}

                  {/* Tabla de datos */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-slate-50/50 text-slate-400 text-xs uppercase font-bold tracking-wider">
                        <tr>
                          {reporteTipo === 'ventas' && (
                            <><th className="px-6 py-3">Fecha</th><th className="px-6 py-3 text-right">Pedidos</th><th className="px-6 py-3 text-right">Total Vendido</th></>
                          )}
                          {reporteTipo === 'inventario' && (
                            <><th className="px-6 py-3">Producto</th><th className="px-6 py-3">Categoría</th><th className="px-6 py-3 text-right">Stock</th><th className="px-6 py-3 text-right">Stock Mín</th><th className="px-6 py-3 text-center">Estado</th><th className="px-6 py-3 text-right">Precio</th><th className="px-6 py-3">Lote</th><th className="px-6 py-3">Vencimiento</th></>
                          )}
                          {reporteTipo === 'mas_vendidos' && (
                            <><th className="px-6 py-3">Producto</th><th className="px-6 py-3 text-right">Unidades</th><th className="px-6 py-3 text-right">Total</th></>
                          )}
                          {reporteTipo === 'por_vencer' && (
                            <><th className="px-6 py-3">Producto</th><th className="px-6 py-3">Categoría</th><th className="px-6 py-3">Lote</th><th className="px-6 py-3">Vencimiento</th><th className="px-6 py-3 text-right">Stock</th><th className="px-6 py-3 text-right">Días</th></>
                          )}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50 font-bold text-slate-600">
                        {datosReporte.datos.map((d, i) => {
                          const invStock = d.pro_cantidad_disponible || 0;
                          const invMin = d.pro_stock_minimo || 0;
                          const esCritico = reporteTipo === 'inventario' && invStock <= invMin;

                          return (
                          <tr key={i} className={`${esCritico ? 'bg-red-50 hover:bg-red-100/80' : 'hover:bg-orange-100/70'}`}>
                            {reporteTipo === 'ventas' && (
                              <><td className="px-6 py-3 text-slate-400 text-xs">{d.fecha}</td><td className="px-6 py-3 text-right">{d.cantidad_pedidos}</td><td className="px-6 py-3 text-right text-emerald-600">${Number(d.total_vendido).toLocaleString()}</td></>
                            )}
                            {reporteTipo === 'inventario' && (
                              <><td className="px-6 py-3 font-bold text-slate-800">{d.pro_nombre}</td>
                                <td className="px-6 py-3">
                                  <span className="px-2 py-1 bg-slate-100 text-slate-500 rounded-md text-[10px] font-bold uppercase">{d.pro_categoria}</span>
                                </td>
                                <td className="px-6 py-3 text-right">
                                  <div className="flex items-center justify-end gap-2">
                                    <span className={`text-sm font-bold ${esCritico ? 'text-red-600' : 'text-emerald-600'}`}>{invStock}</span>
                                    <div className="w-14 h-1.5 bg-slate-200 rounded-full overflow-hidden hidden sm:block">
                                      <div className={`h-full rounded-full transition-all ${esCritico ? 'bg-red-500' : 'bg-emerald-500'}`}
                                        style={{ width: `${Math.min(100, (invStock / Math.max(invMin, 1)) * 100)}%` }} />
                                    </div>
                                  </div>
                                </td>
                                <td className="px-6 py-3 text-right text-slate-400 text-xs">{invMin}</td>
                                <td className="px-6 py-3 text-center">
                                  {esCritico
                                    ? <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-[10px] font-bold"><span className="w-1.5 h-1.5 bg-red-500 rounded-full" /> Crítico</span>
                                    : <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full text-[10px] font-bold"><span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" /> Normal</span>
                                  }
                                </td>
                                <td className="px-6 py-3 text-right text-emerald-600 font-bold">${Number(d.pro_precio).toLocaleString()}</td>
                                <td className="px-6 py-3 text-slate-400 text-xs font-mono">{d.lot_numero || d.lot_id || '-'}</td>
                                <td className={`px-6 py-3 text-xs ${d.lot_fecha_vencimiento ? 'text-slate-500' : 'text-slate-300'}`}>{d.lot_fecha_vencimiento || '—'}</td></>
                            )}
                            {reporteTipo === 'mas_vendidos' && (
                              <><td className="px-6 py-3">{d.nombre}</td><td className="px-6 py-3 text-right">{d.total_unidades}</td><td className="px-6 py-3 text-right text-emerald-600">${Number(d.total_vendido).toLocaleString()}</td></>
                            )}
                            {reporteTipo === 'por_vencer' && (
                              <><td className="px-6 py-3">{d.pro_nombre}</td><td className="px-6 py-3 text-slate-400 text-xs">{d.pro_categoria}</td><td className="px-6 py-3 text-slate-400 text-xs">{d.lot_numero || d.lot_id}</td><td className="px-6 py-3 text-slate-400 text-xs">{d.lot_fecha_vencimiento}</td><td className="px-6 py-3 text-right">{d.lot_cantidad_actual}</td><td className={`px-6 py-3 text-right font-bold ${d.dias_restantes <= 30 ? 'text-red-600' : d.dias_restantes <= 60 ? 'text-orange-600' : 'text-emerald-600'}`}>{d.dias_restantes}</td></>
                            )}
                          </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      )}

      {/* ═════════════════════ TAB: TOP VENTAS ═════════════════════ */}
      {tab === 'masVendidos' && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 card-hover">
            <h3 className="font-bold text-slate-800 tracking-tight mb-1">Productos Más Vendidos</h3>
            <p className="text-xs text-slate-400 font-medium mb-6">Top {masVendidosChart.length} productos por volumen de ventas</p>
            {masVendidosChart.length === 0 ? (
              <EmptyState message="Sin datos de ventas disponibles" />
            ) : (
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={masVendidosChart} layout="vertical" margin={{ left: 20, right: 20, top: 10, bottom: 10 }} animationBegin={0} animationDuration={800} animationEasing="ease-out">
                  <defs>
                    <linearGradient id="gradEmeraldR2" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#fbbf24" />
                      <stop offset="50%" stopColor="#f97316" />
                      <stop offset="100%" stopColor="#ea580c" />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis type="number" tick={{ fontSize: 11, fontWeight: 'bold', fill: '#94a3b8' }} />
                  <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 11, fontWeight: 'bold', fill: '#475569' }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="value" fill="url(#gradEmeraldR2)" radius={[0, 8, 8, 0]} barSize={28} isAnimationActive={true} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
          {masVendidos.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 border-l-4 border-l-orange-400 overflow-hidden card-hover">
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
                    <tr key={i} className="hover:bg-orange-100/70">
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

      {/* ═════════════════════ TAB: HISTORIAL ═════════════════════ */}
      {tab === 'reportes' && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 card-hover">
            <h3 className="font-bold text-slate-800 tracking-tight mb-1">Reportes por Tipo</h3>
            <p className="text-xs text-slate-400 font-medium mb-6">Distribución de reportes generados</p>
            {reportesChart.length === 0 ? (
              <EmptyState message="No hay reportes generados" />
            ) : (
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={reportesChart} margin={{ top: 10, right: 20, left: 10, bottom: 10 }} animationBegin={0} animationDuration={800} animationEasing="ease-out">
                  <defs>
                    <linearGradient id="gradTealR" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#fcd34d" />
                      <stop offset="50%" stopColor="#f59e0b" />
                      <stop offset="100%" stopColor="#d97706" />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fontWeight: 'bold', fill: '#475569' }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11, fontWeight: 'bold', fill: '#94a3b8' }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="value" fill="url(#gradTealR)" radius={[8, 8, 0, 0]} barSize={48} isAnimationActive={true} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
          {reportes.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 border-l-4 border-l-orange-400 overflow-hidden card-hover">
              <div className="p-4 border-b border-slate-100">
                <h4 className="font-bold text-xs text-slate-500 uppercase tracking-wider">Últimos reportes</h4>
              </div>
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50/50 text-slate-400 text-xs uppercase font-bold tracking-wider">
                  <tr>
                    <th className="px-6 py-3">Tipo</th>
                    <th className="px-6 py-3">Usuario</th>
                    <th className="px-6 py-3">Fecha</th>
                    <th className="px-6 py-3">Parámetros</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 font-bold text-slate-600">
                  {reportes.slice(0, 20).map((r, i) => (
                    <tr key={i} className="hover:bg-orange-100/70">
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

      {/* ═════════════════════ TAB: ANULACIONES ═════════════════════ */}
      {tab === 'anulaciones' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 card-hover">
              <h3 className="font-bold text-slate-800 tracking-tight mb-1">Anulaciones por Motivo</h3>
              <p className="text-xs text-slate-400 font-medium mb-6">Distribución de motivos de anulación</p>
              {anulacionesChart.length === 0 ? (
                <EmptyState message="No hay anulaciones registradas" />
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart animationBegin={0} animationDuration={800} animationEasing="ease-out">
                    <defs>
                      <linearGradient id="anulGrad0" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#fbbf24" /><stop offset="50%" stopColor="#f97316" /><stop offset="100%" stopColor="#ea580c" /></linearGradient>
                      <linearGradient id="anulGrad1" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#fcd34d" /><stop offset="50%" stopColor="#f59e0b" /><stop offset="100%" stopColor="#d97706" /></linearGradient>
                      <linearGradient id="anulGrad2" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#38bdf8" /><stop offset="100%" stopColor="#0284c7" /></linearGradient>
                      <linearGradient id="anulGrad3" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#a78bfa" /><stop offset="100%" stopColor="#6d28d9" /></linearGradient>
                      <linearGradient id="anulGrad4" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#fb7185" /><stop offset="100%" stopColor="#be123c" /></linearGradient>
                      <linearGradient id="anulGrad5" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#fb923c" /><stop offset="100%" stopColor="#c2410c" /></linearGradient>
                      <linearGradient id="anulGrad6" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#fbbf24" /><stop offset="100%" stopColor="#a16207" /></linearGradient>
                      <linearGradient id="anulGrad7" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#818cf8" /><stop offset="100%" stopColor="#3730a3" /></linearGradient>
                    </defs>
                    <Pie
                      data={anulacionesChart}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      innerRadius={50}
                      paddingAngle={3}
                      isAnimationActive={true}
                      label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                      labelLine={{ stroke: '#cbd5e1', strokeWidth: 1 }}
                    >
                      {anulacionesChart.map((_, index) => (
                        <Cell key={index} fill={GRAD_COLORS[index % GRAD_COLORS.length]} />
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
          {anulaciones.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 border-l-4 border-l-orange-400 overflow-hidden card-hover">
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
                    <tr key={i} className="hover:bg-orange-100/70">
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
    </>
  );
};

export default Reportes;
