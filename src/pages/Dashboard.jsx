import React, { useState, useEffect, useMemo } from 'react';
import { TrendingUp, Box, Clock, Truck, Activity, Package, AlertTriangle, ArrowUpRight, ArrowDownRight, Users, BarChart3, Table2 } from 'lucide-react';
import { ThemeLoader } from '../components/ThemeLoader';
import { MetricCard } from '../components/dashboard/MetricCard';
import { useAuth } from '../context/AuthContext';
import { productosService } from '../api/services/productosService';
import { proveedoresService } from '../api/services/proveedoresService';
import { alertasService } from '../api/services/alertasService';
import { masVendidosService } from '../api/services/masVendidosService';
import { monitoriasService } from '../api/services/monitoriasService';
import { lotesService } from '../api/services/lotesService';
import { pedidosService } from '../api/services/pedidosService';
import { comprasService } from '../api/services/comprasService';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Cell, PieChart, Pie, AreaChart, Area, Legend
} from 'recharts';

const Dashboard = () => {
  const { user } = useAuth();
  const [productos, setProductos] = useState([]);
  const [proveedores, setProveedores] = useState([]);
  const [alertas, setAlertas] = useState([]);
  const [masVendidos, setMasVendidos] = useState([]);
  const [monitorias, setMonitorias] = useState([]);
  const [lotes, setLotes] = useState([]);
  const [pedidos, setPedidos] = useState([]);
  const [compras, setCompras] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCharts, setShowCharts] = useState(true);
  const [clickCount, setClickCount] = useState(0);
  const [showEgg, setShowEgg] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [prods, provs, alts, top, mons, lots, peds, comps] = await Promise.all([
          productosService.listar().catch(() => []),
          proveedoresService.listar().catch(() => []),
          alertasService.listar().catch(() => []),
          masVendidosService.listar().catch(() => []),
          monitoriasService.listar().catch(() => ({ data: [], total: 0 })),
          lotesService.listar().catch(() => []),
          pedidosService.listar().catch(() => []),
          comprasService.listar().catch(() => [])
        ]);
        setProductos(prods);
        setProveedores(provs);
        setAlertas(alts);
        setMasVendidos(top);
        setMonitorias(Array.isArray(mons) ? mons : (mons.data || []));
        setLotes(lots);
        setPedidos(peds);
        setCompras(comps);
      } catch (_) {
      } finally {
        setLoading(false);
      }
    };
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  const stockTotal = productos.reduce((sum, p) => sum + (p.cantidad_disponible || 0), 0);
  const stockBajo = productos.filter(p => (p.cantidad_disponible || 0) <= (p.stock_minimo || 0));
  const ultimosMovimientos = monitorias.slice(0, 5);

  // ── Vencimientos computados en tiempo real desde lotes ──
  const vencimientosDesdeLotes = useMemo(() => {
    const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
    return (lotes || [])
      .filter(l => l.lot_fecha_vencimiento && l.lot_estado === 'Activo')
      .map(l => {
        const ven = new Date(l.lot_fecha_vencimiento.split('T')[0]);
        const dias = Math.ceil((ven - hoy) / (1000 * 60 * 60 * 24));
        const prod = (productos || []).find(p => p.id === l.lot_pro_id_fk);
        return {
          producto_id: l.lot_pro_id_fk,
          lote_id: l.lot_id,
          nombre_producto: prod ? prod.nombre : l.lot_pro_id_fk,
          dias_restantes: dias,
          fecha_vencimiento: l.lot_fecha_vencimiento.split('T')[0],
          lote_numero: l.lot_numero,
          _desdeLote: true
        };
      })
      .sort((a, b) => a.dias_restantes - b.dias_restantes);
  }, [lotes, productos]);

  // Fusionar alertas de BD + vencimientos computados (sin duplicados)
  const todasLasAlertas = useMemo(() => {
    const idsLoteEnAlertas = new Set((alertas || []).map(a => a.lote_id));
    const deLotes = (vencimientosDesdeLotes || []).filter(l => !idsLoteEnAlertas.has(l.lote_id));
    return [...(alertas || []), ...deLotes].sort((a, b) => a.dias_restantes - b.dias_restantes);
  }, [alertas, vencimientosDesdeLotes]);

  const alertasCriticas = todasLasAlertas.filter(a => a.dias_restantes <= 30);
  const alertasMedias = todasLasAlertas.filter(a => a.dias_restantes > 30 && a.dias_restantes <= 60);

  // ── Datos transformados para gráficos recharts ──

  const alertasChartData = useMemo(() =>
    todasLasAlertas.slice(0, 10).map(a => {
      const prod = productos.find(p => p.id === a.producto_id);
      return {
        name: prod?.nombre ? prod.nombre.split(' ').slice(0, 3).join(' ') : `ID#${a.producto_id}`,
        dias: a.dias_restantes,
        isCritico: a.dias_restantes <= 30,
        isAlerta: a.dias_restantes > 30 && a.dias_restantes <= 60,
      };
    }),
    [todasLasAlertas, productos]
  );

  const topVendidosData = useMemo(() =>
    masVendidos.slice(0, 5).map((item, i) => ({
      name: (item.nombre || `Producto #${item.producto_id}`).length > 22
        ? (item.nombre || `Producto #${item.producto_id}`).slice(0, 20) + '…'
        : (item.nombre || `Producto #${item.producto_id}`),
      vendido: item.total_vendido || 0,
      rank: i + 1,
    })),
    [masVendidos]
  );

  const totalProductos = productos.length;
  const stockMedio = productos.filter(p => {
    const disp = p.cantidad_disponible || 0;
    const min = p.stock_minimo || 0;
    return disp > min && disp <= min * 2;
  }).length;
  const stockOptimo = totalProductos - stockBajo.length - stockMedio;

  const stockPieData = useMemo(() => [
    { name: 'Stock Bajo', value: Math.max(stockBajo.length, 0), color: 'url(#pieRed)' },
    { name: 'Stock Medio', value: Math.max(stockMedio, 0), color: 'url(#pieAmber)' },
    { name: 'Stock Óptimo', value: Math.max(stockOptimo, 0), color: 'url(#pieOrange)' },
  ], [stockBajo, stockMedio, stockOptimo]);

  const movimientosChartData = useMemo(() => {
    const agrupado = {};
    monitorias.forEach(m => {
      const fecha = m.mon_fecha ? m.mon_fecha.split('T')[0] : 'Sin fecha';
      if (!agrupado[fecha]) agrupado[fecha] = { fecha, Entrada: 0, Salida: 0 };
      if (m.mon_tipo === 'Entrada') agrupado[fecha].Entrada += m.mon_cantidad || 0;
      else if (m.mon_tipo === 'Salida') agrupado[fecha].Salida += m.mon_cantidad || 0;
    });
    return Object.values(agrupado).sort((a, b) => new Date(a.fecha) - new Date(b.fecha));
  }, [monitorias]);

  // ── Colores pastel para barras del top ──
  const TOP_COLORS = ['url(#gradTop1)', 'url(#gradTop2)', 'url(#gradTop3)', 'url(#gradTop4)', 'url(#gradTop5)'];

  const today = new Date();
  const fecha = today.toLocaleDateString('es-CO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const saludo = today.getHours() < 12 ? 'Buenos días' : today.getHours() < 18 ? 'Buenas tardes' : 'Buenas noches';

  const getProgressColor = (current, min) => {
    if (min <= 0) return 'bg-emerald-400';
    const ratio = current / min;
    if (ratio >= 1.5) return 'bg-emerald-400';
    if (ratio >= 1) return 'bg-blue-400';
    if (ratio >= 0.5) return 'bg-amber-400';
    return 'bg-red-400';
  };

  const getProgressWidth = (current, min) => {
    if (min <= 0) return 100;
    const ratio = (current / min) * 100;
    return Math.min(ratio, 100);
  };

  if (loading) return <ThemeLoader module="Dashboard" />;

  return (
    <div className="space-y-6 animate-in fade-in duration-700">

      {/* ── Encabezado ── */}
      <div className="bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-600 rounded-xl px-6 py-5 shadow-md flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1
            className="text-2xl font-extrabold text-white tracking-tight cursor-pointer select-none"
            onClick={() => {
              const nuevo = clickCount + 1;
              setClickCount(nuevo);
              if (nuevo >= 5) {
                setShowEgg(true);
                setClickCount(0);
                setTimeout(() => setShowEgg(false), 3000);
              }
            }}
          >
            {saludo}, {user?.name || 'Usuario'} 👋
          </h1>
          {showEgg && (
            <p className="text-sm text-yellow-200 font-bold animate-bounce mt-1">
              🥚 ¡Eres un crack de los clicks! Ahora ve a hacer algo productivo 😂
            </p>
          )}
          <p className="text-sm text-blue-100 font-medium capitalize first-letter:capitalize">
            {fecha} &middot; Panel de Control
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* ── Toggle Gráficos / Tablas ── */}
          <button
            onClick={() => setShowCharts(v => !v)}
            style={{ backgroundColor: '#C47A0D' }}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all duration-300 text-white hover:opacity-90`}
          >
            {showCharts ? <BarChart3 size={14} /> : <Table2 size={14} />}
            {showCharts ? 'Ver Tablas' : 'Ver Gráficos'}
          </button>
          <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider ${
            alertasCriticas.length === 0
              ? 'bg-emerald-400/20 text-emerald-100'
              : alertasCriticas.length <= 3
                ? 'bg-amber-400/20 text-amber-100'
                : 'bg-red-400/20 text-red-100'
          }`}>
            <span className={`w-2 h-2 rounded-full ${
              alertasCriticas.length === 0 ? 'bg-emerald-300' : alertasCriticas.length <= 3 ? 'bg-amber-300' : 'bg-red-300'
            }`} />
            {alertasCriticas.length} vencimientos críticos
          </span>
        </div>
      </div>

      {/* ── Metricas ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
        <MetricCard title="Productos" value={productos.length.toString()} icon={Box} colorClass={{bg:'bg-emerald-50', text:'text-emerald-600'}} trend={`${productos.length} registrados`} />
        <MetricCard title="Stock Total" value={stockTotal.toString()} icon={TrendingUp} colorClass={{bg:'bg-blue-50', text:'text-blue-600'}} trend={stockBajo.length > 0 ? `${stockBajo.length} con stock bajo` : 'Stock estable'} />
        <MetricCard title="Vencimientos" value={alertasCriticas.length.toString()} icon={Clock} colorClass={{bg:'bg-orange-50', text:'text-orange-600'}} trend={`${alertasMedias.length} próximos`} />
        <MetricCard title="Proveedores" value={proveedores.length.toString()} icon={Truck} colorClass={{bg:'bg-slate-100', text:'text-slate-600'}} />
        <MetricCard title="Pedidos Activos" value={pedidos.filter(p => !['Entregado','Anulado'].includes(p.ped_estado_entrega)).length.toString()} icon={Package} colorClass={{bg:'bg-indigo-50', text:'text-indigo-600'}} trend={`${pedidos.filter(p => p.ped_estado_entrega === 'Pendiente').length} pendientes`} />
        <MetricCard title="Compras Pend." value={compras.filter(c => c.comp_estado === 'Pendiente').length.toString()} icon={AlertTriangle} colorClass={{bg:'bg-amber-50', text:'text-amber-600'}} trend={`${compras.filter(c => c.comp_estado === 'Recibida').length} recibidas`} />
      </div>

      {/* ── Fila 2: Alertas + Mas Vendidos + Stock Bajo ── */}
      {/* En vista gráficos: alertas ancho completo y tarjetas debajo */}
      <div className={showCharts ? "space-y-6" : "grid grid-cols-1 lg:grid-cols-3 gap-6"}>

        {/* ── ALERTAS (BarChart / Tabla) ── */}
        <div className={`${showCharts ? '' : 'lg:col-span-2'} bg-white rounded-xl shadow-sm border border-slate-200/80 overflow-hidden transition-shadow hover:shadow-md`}>
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
              <Activity className="text-emerald-500" size={18} />
              Alertas de Vencimientos
            </h3>
            <div className="flex items-center gap-2">
              <span className="text-[10px] bg-emerald-50 text-emerald-600 font-bold px-2 py-1 rounded-md">{todasLasAlertas.filter(a => a.dias_restantes > 60).length} óptimas</span>
              <span className="text-[10px] bg-red-50 text-red-600 font-bold px-2 py-1 rounded-md">{alertasCriticas.length} críticas</span>
            </div>
          </div>

          {showCharts ? (
            /* ── VISTA GRÁFICO ── */
            <div className="p-4">
              {todasLasAlertas.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-8 text-slate-400">
                  <Clock size={28} strokeWidth={1.5} />
                  <p className="text-sm font-medium">No hay alertas registradas</p>
                  <p className="text-[11px]">Los vencimientos aparecerán aquí automáticamente</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={showCharts ? 200 : 280}>
                  <BarChart data={alertasChartData} margin={{ top: 10, right: 10, left: -20, bottom: 5 }} animationBegin={0} animationDuration={800} animationEasing="ease-out">
                    <defs>
                      <linearGradient id="gradEmerald" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#34d399" />
                        <stop offset="50%" stopColor="#10b981" />
                        <stop offset="100%" stopColor="#059669" />
                      </linearGradient>
                      <linearGradient id="gradRed" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#f87171" />
                        <stop offset="100%" stopColor="#dc2626" />
                      </linearGradient>
                      <linearGradient id="gradAmber" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#fbbf24" />
                        <stop offset="100%" stopColor="#d97706" />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 10, fill: '#64748b' }}
                      axisLine={{ stroke: '#e2e8f0' }}
                      tickLine={false}
                      interval={0}
                      angle={-25}
                      textAnchor="end"
                      height={60}
                    />
                    <YAxis
                      tick={{ fontSize: 10, fill: '#64748b' }}
                      axisLine={false}
                      tickLine={false}
                      label={{ value: 'Días restantes', angle: -90, position: 'insideLeft', style: { fontSize: 10, fill: '#94a3b8' } }}
                    />
                    <Tooltip
                      contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                      formatter={(value) => [`${value} días`, 'Días restantes']}
                      labelFormatter={(label) => `Producto: ${label}`}
                    />
                    <Bar dataKey="dias" radius={[4, 4, 0, 0]} maxBarSize={40} isAnimationActive={true}>
                      {alertasChartData.map((entry, idx) => (
                        <Cell
                          key={idx}
                          fill={entry.isCritico ? 'url(#gradRed)' : entry.isAlerta ? 'url(#gradAmber)' : 'url(#gradEmerald)'}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
              {todasLasAlertas.length > 10 && (
                <div className="mt-2 text-[10px] text-slate-400 text-center font-medium">
                  Mostrando 10 de {todasLasAlertas.length} alertas
                </div>
              )}
            </div>
          ) : (
            /* ── VISTA TABLA ── */
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50/50 text-slate-400 text-[11px] uppercase font-bold tracking-wider border-b border-slate-100">
                  <tr>
                    <th className="px-5 py-3">Producto</th>
                    <th className="px-5 py-3">Días Rest.</th>
                    <th className="px-5 py-3">Progreso</th>
                    <th className="px-5 py-3">Estado</th>
                    <th className="px-5 py-3 text-right">Vencimiento</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 text-xs font-medium text-slate-600">
                  {todasLasAlertas.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="px-5 py-14 text-center">
                        <div className="flex flex-col items-center gap-2 text-slate-400">
                          <Clock size={28} strokeWidth={1.5} />
                          <p className="text-sm font-medium">No hay alertas registradas</p>
                          <p className="text-[11px]">Los vencimientos aparecerán aquí automáticamente</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    todasLasAlertas.slice(0, 10).map((row, i) => {
                      const esCritico = row.dias_restantes <= 30;
                      const esAlerta = row.dias_restantes > 30 && row.dias_restantes <= 60;
                      let badgeClass = 'text-emerald-600 bg-emerald-50';
                      let badgeLabel = 'Óptimo';
                      let barColor = 'bg-emerald-400';
                      if (esCritico) {
                        badgeClass = 'text-red-600 bg-red-50';
                        badgeLabel = 'Crítico';
                        barColor = 'bg-red-400';
                      } else if (esAlerta) {
                        badgeClass = 'text-orange-600 bg-orange-50';
                        badgeLabel = 'Alerta';
                        barColor = 'bg-orange-400';
                      }
                      const barWidth = Math.min((row.dias_restantes / 90) * 100, 100);

                      return (
                        <tr key={i} className="hover:bg-orange-100/70 transition-colors">
                          <td className="px-5 py-3">
                            <div className="flex items-center gap-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                              <span>
                                {(() => {
                                  const prod = productos.find(p => p.id === (row.producto_id || row.alv_pro_id_fk));
                                  return prod ? prod.nombre : (row.producto_id || row.alv_pro_id_fk);
                                })()}
                              </span>
                            </div>
                          </td>
                          <td className={`px-5 py-3 font-bold ${esCritico ? 'text-red-600' : esAlerta ? 'text-orange-600' : 'text-slate-700'}`}>
                            {row.dias_restantes} días
                          </td>
                          <td className="px-5 py-3">
                            <div className="flex items-center gap-2">
                              <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full transition-all ${barColor}`}
                                  style={{ width: `${barWidth}%` }}
                                />
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-3">
                            <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase ${badgeClass}`}>{badgeLabel}</span>
                          </td>
                          <td className="px-5 py-3 text-right text-slate-400">{row.fecha_vencimiento || '-'}</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ── MÁS VENDIDOS + STOCK BAJO ── */}
        <div className={showCharts ? "grid grid-cols-1 lg:grid-cols-2 gap-6" : "space-y-4"}>

          {/* ── MÁS VENDIDOS (HorizontalBarChart / Lista) ── */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200/80 overflow-hidden transition-shadow hover:shadow-md">
            <div className="px-5 py-4 border-b border-slate-100">
              <h4 className="font-bold text-sm text-slate-800 flex items-center gap-2">
                <TrendingUp size={16} className="text-blue-500" />
                Más Vendidos
              </h4>
            </div>

            {showCharts ? (
              /* ── VISTA GRÁFICO ── */
              <div className="p-4">
                {topVendidosData.length === 0 ? (
                  <div className="flex flex-col items-center gap-2 py-6 text-slate-400">
                    <Package size={28} strokeWidth={1.5} />
                    <p className="text-xs font-medium">Sin datos de ventas</p>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={240}>
                    <BarChart
                      data={topVendidosData}
                      layout="vertical"
                      margin={{ top: 5, right: 20, left: 5, bottom: 5 }}
                      animationBegin={0}
                      animationDuration={800}
                      animationEasing="ease-out"
                    >
                      <defs>
                        <linearGradient id="gradTop1" x1="0" y1="0" x2="1" y2="0">
                          <stop offset="0%" stopColor="#fbbf24" />
                          <stop offset="100%" stopColor="#d97706" />
                        </linearGradient>
                        <linearGradient id="gradTop2" x1="0" y1="0" x2="1" y2="0">
                          <stop offset="0%" stopColor="#cbd5e1" />
                          <stop offset="100%" stopColor="#64748b" />
                        </linearGradient>
                        <linearGradient id="gradTop3" x1="0" y1="0" x2="1" y2="0">
                          <stop offset="0%" stopColor="#fb923c" />
                          <stop offset="100%" stopColor="#ea580c" />
                        </linearGradient>
                        <linearGradient id="gradTop4" x1="0" y1="0" x2="1" y2="0">
                          <stop offset="0%" stopColor="#60a5fa" />
                          <stop offset="100%" stopColor="#2563eb" />
                        </linearGradient>
                        <linearGradient id="gradTop5" x1="0" y1="0" x2="1" y2="0">
                          <stop offset="0%" stopColor="#a78bfa" />
                          <stop offset="100%" stopColor="#6d28d9" />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
                      <XAxis type="number" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                      <YAxis
                        type="category"
                        dataKey="name"
                        tick={{ fontSize: 10, fill: '#475569' }}
                        axisLine={false}
                        tickLine={false}
                        width={120}
                      />
                      <Tooltip
                        contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                        formatter={(value) => [`${value} unidades`, 'Vendido']}
                      />
                      <Bar dataKey="vendido" radius={[0, 4, 4, 0]} maxBarSize={20} isAnimationActive={true}>
                        {topVendidosData.map((_, idx) => (
                          <Cell key={idx} fill={TOP_COLORS[idx % TOP_COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            ) : (
              /* ── VISTA LISTA ── */
              <div className="p-4 space-y-2">
                {masVendidos.length === 0 ? (
                  <div className="flex flex-col items-center gap-2 py-6 text-slate-400">
                    <Package size={28} strokeWidth={1.5} />
                    <p className="text-xs font-medium">Sin datos de ventas</p>
                  </div>
                ) : (
                  masVendidos.slice(0, 5).map((item, i) => {
                    const maxVendido = Math.max(...masVendidos.slice(0, 5).map(m => m.total_vendido || 0), 1);
                    const pct = ((item.total_vendido || 0) / maxVendido) * 100;
                    const medallas = ['🥇', '🥈', '🥉', '4', '5'];
                    return (
                      <div key={i} className="group flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 transition-colors">
                        <span className={`w-6 h-6 flex items-center justify-center text-[10px] font-bold rounded-md ${
                          i === 0 ? 'bg-amber-100 text-amber-700' :
                          i === 1 ? 'bg-slate-200 text-slate-600' :
                          i === 2 ? 'bg-orange-100 text-orange-700' :
                          'bg-slate-100 text-slate-400'
                        }`}>
                          {i < 3 ? medallas[i] : `#${i + 1}`}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-slate-700 truncate">{item.nombre || item.producto_id}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <div className="flex-1 h-1 bg-slate-100 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all ${
                                  i === 0 ? 'bg-amber-400' : i === 1 ? 'bg-slate-400' : i === 2 ? 'bg-orange-400' : 'bg-blue-300'
                                }`}
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                            <span className="text-[10px] font-bold text-slate-500 shrink-0">{item.total_vendido}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>

          {/* ── STOCK BAJO (PieChart / Tabla) ── */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200/80 overflow-hidden transition-shadow hover:shadow-md">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <h4 className="font-bold text-sm text-slate-800 flex items-center gap-2">
                <AlertTriangle size={16} className="text-red-500" />
                Stock Bajo
              </h4>
              <span className="text-[10px] bg-red-50 text-red-600 font-bold px-2 py-1 rounded-md">{stockBajo.length} productos</span>
            </div>

            {showCharts ? (
              /* ── VISTA GRÁFICO ── */
              <div className="p-4">
                {totalProductos > 0 && (
                  <ResponsiveContainer width="100%" height={140}>
                    <PieChart animationBegin={0} animationDuration={800} animationEasing="ease-out">
                      <defs>
                        <linearGradient id="pieRed" x1="0" y1="0" x2="1" y2="1">
                          <stop offset="0%" stopColor="#f87171" />
                          <stop offset="100%" stopColor="#dc2626" />
                        </linearGradient>
                        <linearGradient id="pieAmber" x1="0" y1="0" x2="1" y2="1">
                          <stop offset="0%" stopColor="#fbbf24" />
                          <stop offset="100%" stopColor="#d97706" />
                        </linearGradient>
                        <linearGradient id="pieOrange" x1="0" y1="0" x2="1" y2="1">
                          <stop offset="0%" stopColor="#34d399" />
                          <stop offset="50%" stopColor="#10b981" />
                          <stop offset="100%" stopColor="#059669" />
                        </linearGradient>
                      </defs>
                      <Pie
                        data={stockPieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={35}
                        outerRadius={60}
                        paddingAngle={3}
                        dataKey="value"
                        isAnimationActive={true}
                      >
                        {stockPieData.map((entry, idx) => (
                          <Cell key={idx} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                        formatter={(value, name) => [`${value} productos`, name]}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                )}

                <div className="flex justify-center gap-4 mb-3 text-[10px] font-medium">
                  {stockPieData.map((item, idx) => {
                    const dotColors = { 'Stock Bajo': '#dc2626', 'Stock Medio': '#d97706', 'Stock Óptimo': '#059669' };
                    return (
                    <span key={idx} className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: dotColors[item.name] }} />
                      {item.name}: {item.value}
                    </span>
                  )})}
                </div>

                {stockBajo.length === 0 ? (
                  <div className="flex flex-col items-center gap-2 py-4 text-slate-400">
                    <Box size={24} strokeWidth={1.5} />
                    <p className="text-xs font-medium">Stock suficiente</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {stockBajo.slice(0, 5).map((p, i) => {
                      const pct = getProgressWidth(p.cantidad_disponible, p.stock_minimo);
                      const barColor = getProgressColor(p.cantidad_disponible, p.stock_minimo);
                      return (
                        <div key={i} className="p-2.5 rounded-lg bg-slate-50/80 hover:bg-red-50/50 transition-colors">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[11px] font-medium text-slate-700 truncate max-w-[70%]">{p.nombre || p.id}</span>
                            <span className={`text-[10px] font-bold ${p.cantidad_disponible === 0 ? 'text-red-600' : 'text-amber-600'}`}>
                              {p.cantidad_disponible}/{p.stock_minimo}
                            </span>
                          </div>
                          <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${barColor}`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <p className="text-[9px] text-slate-400 mt-0.5">
                            {p.cantidad_disponible === 0 ? 'Agotado' : `Faltan ${p.stock_minimo - p.cantidad_disponible}`}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : (
              /* ── VISTA TABLA ── */
              <div className="p-4 space-y-3">
                {stockBajo.length === 0 ? (
                  <div className="flex flex-col items-center gap-2 py-6 text-slate-400">
                    <Box size={28} strokeWidth={1.5} />
                    <p className="text-xs font-medium">Todos los productos tienen stock suficiente</p>
                  </div>
                ) : (
                  stockBajo.slice(0, 5).map((p, i) => {
                    const pct = getProgressWidth(p.cantidad_disponible, p.stock_minimo);
                    const barColor = getProgressColor(p.cantidad_disponible, p.stock_minimo);
                    return (
                      <div key={i} className="group p-3 rounded-lg bg-slate-50/80 hover:bg-red-50/50 transition-colors">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-xs font-medium text-slate-700 truncate max-w-[70%]">{p.nombre || p.id}</span>
                          <span className={`text-[10px] font-bold ${p.cantidad_disponible === 0 ? 'text-red-600' : 'text-amber-600'}`}>
                            {p.cantidad_disponible}/{p.stock_minimo}
                          </span>
                        </div>
                        <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${barColor}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <p className="text-[10px] text-slate-400 mt-1">
                          {p.cantidad_disponible === 0
                            ? 'Agotado — requiere reposición'
                            : `Faltan ${p.stock_minimo - p.cantidad_disponible} para mínimo`}
                        </p>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>

        </div>
      </div>

      {/* ── Fila 3: Últimos Movimientos (AreaChart / Tabla) ── */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200/80 overflow-hidden transition-shadow hover:shadow-md">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
            <Package size={16} className="text-slate-500" />
            Últimos Movimientos
          </h3>
          <span className="text-[10px] bg-slate-100 text-slate-500 font-bold px-2 py-1 rounded-md">
            {monitorias.length} totales
          </span>
        </div>

        {showCharts ? (
          /* ── VISTA GRÁFICO ── */
          <>
            <div className="p-4">
              {movimientosChartData.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-12 text-slate-400">
                  <Package size={28} strokeWidth={1.5} />
                  <p className="text-sm font-medium">Sin movimientos registrados</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={260}>
                  <AreaChart data={movimientosChartData} margin={{ top: 10, right: 10, left: -10, bottom: 5 }} animationBegin={0} animationDuration={800} animationEasing="ease-out">
                    <defs>
                      <linearGradient id="colorEntrada" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#ea580c" stopOpacity={0.5} />
                        <stop offset="40%" stopColor="#f97316" stopOpacity={0.25} />
                        <stop offset="70%" stopColor="#fbbf24" stopOpacity={0.08} />
                        <stop offset="100%" stopColor="#fcd34d" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorSalida" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#dc2626" stopOpacity={0.45} />
                        <stop offset="50%" stopColor="#ef4444" stopOpacity={0.18} />
                        <stop offset="100%" stopColor="#f87171" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                    <XAxis
                      dataKey="fecha"
                      tick={{ fontSize: 10, fill: '#64748b' }}
                      axisLine={{ stroke: '#e2e8f0' }}
                      tickLine={false}
                      tickFormatter={(val) => {
                        if (!val || val === 'Sin fecha') return val;
                        const parts = val.split('-');
                        return `${parts[2]}/${parts[1]}`;
                      }}
                    />
                    <YAxis tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                    <Tooltip
                      contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                      labelFormatter={(label) => `Fecha: ${label}`}
                    />
                    <Legend
                      wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }}
                      formatter={(value) => <span style={{ color: '#475569', fontWeight: 600 }}>{value}</span>}
                    />
                    <Area
                      type="monotone"
                      dataKey="Entrada"
                      stroke="#f97316"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorEntrada)"
                      dot={false}
                      activeDot={{ r: 4, fill: '#f97316' }}
                      isAnimationActive={true}
                    />
                    <Area
                      type="monotone"
                      dataKey="Salida"
                      stroke="#ef4444"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorSalida)"
                      dot={false}
                      activeDot={{ r: 4, fill: '#ef4444' }}
                      isAnimationActive={true}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
            {ultimosMovimientos.length > 0 && (
              <div className="border-t border-slate-100 px-4 py-3">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Últimos registros</p>
                <div className="flex flex-wrap gap-2">
                  {ultimosMovimientos.map((m, i) => (
                    <span key={i} className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold ${
                      m.mon_tipo === 'Entrada' ? 'text-emerald-700 bg-emerald-50' :
                      m.mon_tipo === 'Salida' ? 'text-red-700 bg-red-50' : 'text-yellow-700 bg-yellow-50'
                    }`}>
                      {m.mon_tipo === 'Entrada' ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
                      {m.mon_cantidad} und.
                    </span>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          /* ── VISTA TABLA ── */
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50/50 text-slate-400 text-[11px] uppercase font-bold tracking-wider border-b border-slate-100">
                <tr>
                  <th className="px-5 py-3">Producto</th>
                  <th className="px-5 py-3">Tipo</th>
                  <th className="px-5 py-3 text-right">Cantidad</th>
                  <th className="px-5 py-3 text-right">Saldo</th>
                  <th className="px-5 py-3">Fecha</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-xs font-medium text-slate-600">
                {ultimosMovimientos.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-5 py-12 text-center">
                      <div className="flex flex-col items-center gap-2 text-slate-400">
                        <Package size={28} strokeWidth={1.5} />
                        <p className="text-sm font-medium">Sin movimientos registrados</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  ultimosMovimientos.map((m, i) => (
                    <tr key={i} className="hover:bg-orange-100/70 transition-colors">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                          <span>
                            {(() => {
                              const prod = productos.find(p => p.id === m.mon_pro_id_fk);
                              return prod ? prod.nombre : m.mon_pro_id_fk;
                            })()}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase ${
                          m.mon_tipo === 'Entrada' ? 'text-emerald-700 bg-emerald-50' :
                          m.mon_tipo === 'Salida' ? 'text-red-700 bg-red-50' : 'text-yellow-700 bg-yellow-50'
                        }`}>
                          {m.mon_tipo === 'Entrada' && <ArrowUpRight size={12} />}
                          {m.mon_tipo === 'Salida' && <ArrowDownRight size={12} />}
                          {m.mon_tipo}
                        </span>
                      </td>
                      <td className={`px-5 py-3 text-right font-bold ${
                        m.mon_tipo === 'Entrada' ? 'text-emerald-600' :
                        m.mon_tipo === 'Salida' ? 'text-red-600' : 'text-yellow-600'
                      }`}>{m.mon_cantidad}</td>
                      <td className="px-5 py-3 text-right text-slate-500">{m.mon_saldo_actual}</td>
                      <td className="px-5 py-3 text-slate-400">{m.mon_fecha || '-'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Lotes próximos a vencer ── */}
      {lotes.filter(l => l.lot_estado === 'Activo' && l.lot_fecha_vencimiento).length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200/80 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100">
            <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
              <Clock className="text-amber-500" size={18} />
              Lotes próximos a vencer
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-slate-400 text-[10px] uppercase font-bold tracking-wider">
                <tr>
                  <th className="px-5 py-2">Lote</th>
                  <th className="px-5 py-2">Producto</th>
                  <th className="px-5 py-2 text-right">Stock</th>
                  <th className="px-5 py-2">Vencimiento</th>
                  <th className="px-5 py-2 text-right">Días rest.</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-xs font-medium text-slate-600">
                {lotes
                  .filter(l => l.lot_estado === 'Activo' && l.lot_fecha_vencimiento)
                  .map(l => {
                    const ven = new Date(l.lot_fecha_vencimiento.split('T')[0]);
                    const hoy = new Date(); hoy.setHours(0,0,0,0);
                    const dias = Math.ceil((ven - hoy) / (1000 * 60 * 60 * 24));
                    return { ...l, dias };
                  })
                  .sort((a, b) => a.dias - b.dias)
                  .slice(0, 5)
                  .map((l, i) => {
                    const prod = productos.find(p => p.id === l.lot_pro_id_fk);
                    const color = l.dias <= 0 ? 'text-red-600' : l.dias <= 30 ? 'text-red-500' : l.dias <= 60 ? 'text-amber-500' : 'text-emerald-500';
                    const barColor = l.dias <= 0 ? 'bg-red-400' : l.dias <= 30 ? 'bg-red-400' : l.dias <= 60 ? 'bg-amber-400' : 'bg-emerald-400';
                    return (
                      <tr key={i} className="hover:bg-orange-100/70">
                        <td className="px-5 py-2.5 text-slate-400">{l.lot_numero || l.lot_id}</td>
                        <td className="px-5 py-2.5">{prod ? prod.nombre : l.lot_pro_id_fk}</td>
                        <td className="px-5 py-2.5 text-right font-bold">{l.lot_cantidad_actual || 0}</td>
                        <td className="px-5 py-2.5 text-slate-400">{l.lot_fecha_vencimiento?.split('T')[0]}</td>
                        <td className="px-5 py-2.5 text-right">
                          <span className={`font-bold ${color}`}>{l.dias <= 0 ? 'Vencido' : l.dias}</span>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
};

export default Dashboard;
