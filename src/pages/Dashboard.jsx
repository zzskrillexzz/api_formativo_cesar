import React, { useState, useEffect } from 'react';
import { TrendingUp, Box, Clock, Truck, Activity, Package, AlertTriangle, ArrowUpRight, ArrowDownRight, Users } from 'lucide-react';
import { ThemeLoader } from '../components/ThemeLoader';
import { MetricCard } from '../components/dashboard/MetricCard';
import { productosService } from '../api/services/productosService';
import { proveedoresService } from '../api/services/proveedoresService';
import { alertasService } from '../api/services/alertasService';
import { masVendidosService } from '../api/services/masVendidosService';
import { monitoriasService } from '../api/services/monitoriasService';

const Dashboard = () => {
  const [productos, setProductos] = useState([]);
  const [proveedores, setProveedores] = useState([]);
  const [alertas, setAlertas] = useState([]);
  const [masVendidos, setMasVendidos] = useState([]);
  const [monitorias, setMonitorias] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [prods, provs, alts, top, mons] = await Promise.all([
          productosService.listar().catch(() => []),
          proveedoresService.listar().catch(() => []),
          alertasService.listar().catch(() => []),
          masVendidosService.listar().catch(() => []),
          monitoriasService.listar().catch(() => ({ data: [], total: 0 }))
        ]);
        setProductos(prods);
        setProveedores(provs);
        setAlertas(alts);
        setMasVendidos(top);
        setMonitorias(Array.isArray(mons) ? mons : (mons.data || []));
      } catch (_) {
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const stockTotal = productos.reduce((sum, p) => sum + (p.cantidad_disponible || 0), 0);
  const alertasCriticas = alertas.filter(a => a.dias_restantes <= 30);
  const alertasMedias = alertas.filter(a => a.dias_restantes > 30 && a.dias_restantes <= 60);
  const stockBajo = productos.filter(p => (p.cantidad_disponible || 0) <= (p.stock_minimo || 0));
  const ultimosMovimientos = monitorias.slice(0, 5);

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
          <h1 className="text-2xl font-extrabold text-white tracking-tight">
            {saludo} 👋
          </h1>
          <p className="text-sm text-blue-100 font-medium capitalize first-letter:capitalize">
            {fecha} &middot; Panel de Control
          </p>
        </div>
        <div className="flex items-center gap-3">
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard title="Productos" value={productos.length.toString()} icon={Box} colorClass={{bg:'bg-emerald-50', text:'text-emerald-600'}} trend={`${productos.length} registrados`} />
        <MetricCard title="Stock Total" value={stockTotal.toString()} icon={TrendingUp} colorClass={{bg:'bg-blue-50', text:'text-blue-600'}} trend={stockBajo.length > 0 ? `${stockBajo.length} con stock bajo` : 'Stock estable'} />
        <MetricCard title="Vencimientos" value={alertasCriticas.length.toString()} icon={Clock} colorClass={{bg:'bg-orange-50', text:'text-orange-600'}} trend={`${alertasMedias.length} próximos`} />
        <MetricCard title="Proveedores" value={proveedores.length.toString()} icon={Truck} colorClass={{bg:'bg-slate-100', text:'text-slate-600'}} />
      </div>

      {/* ── Fila 2: Alertas + Mas Vendidos + Stock Bajo ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ── ALERTAS ── */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200/80 overflow-hidden transition-shadow hover:shadow-md">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
              <Activity className="text-emerald-500" size={18} />
              Alertas de Vencimientos
            </h3>
            <div className="flex items-center gap-2">
              <span className="text-[10px] bg-emerald-50 text-emerald-600 font-bold px-2 py-1 rounded-md">{alertas.filter(a => a.dias_restantes > 60).length} óptimas</span>
              <span className="text-[10px] bg-red-50 text-red-600 font-bold px-2 py-1 rounded-md">{alertasCriticas.length} críticas</span>
            </div>
          </div>
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
                {alertas.length === 0 ? (
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
                  alertas.slice(0, 10).map((row, i) => {
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
                      <tr key={i} className="hover:bg-slate-50/80 transition-colors">
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
          {alertas.length > 10 && (
            <div className="px-5 py-2.5 bg-slate-50/50 border-t border-slate-100 text-[10px] text-slate-400 text-center font-medium">
              Mostrando 10 de {alertas.length} alertas
            </div>
          )}
        </div>

        {/* ── COLUMNA DERECHA ── */}
        <div className="space-y-4">

          {/* ── MÁS VENDIDOS ── */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200/80 overflow-hidden transition-shadow hover:shadow-md">
            <div className="px-5 py-4 border-b border-slate-100">
              <h4 className="font-bold text-sm text-slate-800 flex items-center gap-2">
                <TrendingUp size={16} className="text-blue-500" />
                Más Vendidos
              </h4>
            </div>
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
          </div>

          {/* ── STOCK BAJO ── */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200/80 overflow-hidden transition-shadow hover:shadow-md">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <h4 className="font-bold text-sm text-slate-800 flex items-center gap-2">
                <AlertTriangle size={16} className="text-red-500" />
                Stock Bajo
              </h4>
              <span className="text-[10px] bg-red-50 text-red-600 font-bold px-2 py-1 rounded-md">{stockBajo.length} productos</span>
            </div>
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
          </div>

        </div>
      </div>

      {/* ── Fila 3: Ultimos Movimientos ── */}
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
                  <tr key={i} className="hover:bg-slate-50/80 transition-colors">
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
      </div>

    </div>
  );
};

export default Dashboard;
