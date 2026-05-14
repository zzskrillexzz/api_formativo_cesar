import React, { useState, useEffect } from 'react';
import { TrendingUp, Box, Clock, Truck, Activity, Package, AlertTriangle } from 'lucide-react';
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
          monitoriasService.listar().catch(() => [])
        ]);
        setProductos(prods);
        setProveedores(provs);
        setAlertas(alts);
        setMasVendidos(top);
        setMonitorias(mons);
      } catch (_) {
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const stockTotal = productos.reduce((sum, p) => sum + (p.cantidad_disponible || 0), 0);
  const alertasCriticas = alertas.filter(a => a.dias_restantes <= 30);
  const stockBajo = productos.filter(p => (p.cantidad_disponible || 0) <= (p.stock_minimo || 0));
  const ultimosMovimientos = monitorias.slice(0, 5);

  if (loading) return <ThemeLoader module="Dashboard" />;

  return (
    <div className="space-y-6 animate-in fade-in duration-700">

      {/* ── Metricas ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard title="Productos" value={productos.length.toString()} icon={Box} colorClass={{bg:'bg-emerald-50', text:'text-emerald-600'}} />
        <MetricCard title="Stock Total" value={stockTotal.toString()} icon={TrendingUp} colorClass={{bg:'bg-blue-50', text:'text-blue-600'}} />
        <MetricCard title="Vencimientos" value={alertasCriticas.length.toString()} icon={Clock} colorClass={{bg:'bg-orange-50', text:'text-orange-600'}} />
        <MetricCard title="Proveedores" value={proveedores.length.toString()} icon={Truck} colorClass={{bg:'bg-slate-100', text:'text-slate-600'}} />
      </div>

      {/* ── Fila 2: Alertas + Mas Vendidos ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-lg shadow-sm border border-slate-200/60 overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex justify-between items-center">
            <h3 className="font-bold text-base text-slate-800 flex items-center gap-2">
              <Activity className="text-emerald-500" size={18}/> 
              Alertas de Vencimientos
            </h3>
            <span className="text-xs bg-slate-100 text-slate-500 font-bold px-2 py-1 rounded-md uppercase tracking-wider">{alertas.length} alertas</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-slate-400 text-sm uppercase font-bold tracking-wider border-b border-slate-100">
                <tr>
                  <th className="px-5 py-3">Producto ID</th>
                  <th className="px-5 py-3">Dias Rest.</th>
                  <th className="px-5 py-3">Estado</th>
                  <th className="px-5 py-3 text-right">Vencimiento</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-xs font-medium text-slate-600">
                {alertas.length === 0 ? (
                  <tr><td colSpan="4" className="px-5 py-10 text-center text-slate-400">No hay alertas registradas</td></tr>
                ) : (
                  alertas.slice(0, 10).map((row, i) => {
                    const esCritico = row.dias_restantes <= 30;
                    const esAlerta = row.dias_restantes > 30 && row.dias_restantes <= 60;
                    let c = 'text-emerald-600 bg-emerald-50'; let l = 'Optimo';
                    if (esCritico) { c = 'text-red-600 bg-red-50'; l = 'Critico'; }
                    else if (esAlerta) { c = 'text-orange-600 bg-orange-50'; l = 'Alerta'; }
                    return (
                      <tr key={i} className="hover:bg-slate-50">
                        <td className="px-5 py-3">{row.producto_id || row.id}</td>
                        <td className="px-5 py-3">{row.dias_restantes} dias</td>
                        <td className="px-5 py-3"><span className={`px-3 py-1.5 rounded-md text-xs font-bold uppercase ${c}`}>{l}</span></td>
                        <td className="px-5 py-3 text-right text-slate-400">{row.fecha_vencimiento || '-'}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-lg p-5 text-white shadow-md">
            <h4 className="font-bold text-sm uppercase tracking-wider mb-4 opacity-80">Mas Vendidos</h4>
            <div className="space-y-2.5">
              {masVendidos.length === 0 ? (
                <p className="text-white/60 text-xs">Sin datos</p>
              ) : (
                masVendidos.slice(0, 4).map((item, i) => (
                  <div key={i} className="flex items-center justify-between p-2.5 bg-white/10 rounded-lg">
                    <span className="text-xs font-medium">{item.nombre || item.producto_id}</span>
                    <span className="text-emerald-300 text-xs font-bold">{item.total_vendido}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h4 className="font-bold text-xs text-red-800 uppercase tracking-wider flex items-center gap-2 mb-3">
              <AlertTriangle size={14} /> Stock Bajo ({stockBajo.length})
            </h4>
            <div className="space-y-2">
              {stockBajo.length === 0 ? (
                <p className="text-red-600/60 text-xs">No hay productos con stock bajo</p>
              ) : (
                stockBajo.slice(0, 5).map((p, i) => (
                  <div key={i} className="flex justify-between items-center bg-white/80 rounded-md px-3 py-2">
                    <span className="text-xs font-medium text-red-700">{p.nombre || p.id}</span>
                    <span className="text-xs font-bold text-red-500">{p.cantidad_disponible} / {p.stock_minimo}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Fila 3: Ultimos Movimientos ── */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200/60 overflow-hidden">
        <div className="p-5 border-b border-slate-100">
          <h3 className="font-bold text-base text-slate-800 flex items-center gap-2">
            <Package size={16} className="text-slate-400" /> Ultimos Movimientos
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-slate-400 text-sm uppercase font-bold tracking-wider border-b border-slate-100">
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
                <tr><td colSpan="5" className="px-5 py-8 text-center text-slate-400">Sin movimientos registrados</td></tr>
              ) : (
                ultimosMovimientos.map((m, i) => (
                  <tr key={i} className="hover:bg-slate-50">
                    <td className="px-5 py-3">{m.mon_pro_id_fk}</td>
                    <td className="px-5 py-3">
                      <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${
                        m.mon_tipo === 'Entrada' ? 'text-emerald-600 bg-emerald-50' :
                        m.mon_tipo === 'Salida' ? 'text-red-600 bg-red-50' : 'text-yellow-600 bg-yellow-50'
                      }`}>{m.mon_tipo}</span>
                    </td>
                    <td className="px-5 py-3 text-right">{m.mon_cantidad}</td>
                    <td className="px-5 py-3 text-right">{m.mon_saldo_actual}</td>
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





