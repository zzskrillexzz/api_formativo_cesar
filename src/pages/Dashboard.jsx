import React, { useState, useEffect } from 'react';
import { TrendingUp, Box, Clock, Truck, Activity, ShoppingCart, Package, BarChart3, Filter, CheckCircle2, Loader2 } from 'lucide-react';
import { MetricCard } from '../components/dashboard/MetricCard';
import { productosService } from '../api/services/productosService';
import { proveedoresService } from '../api/services/proveedoresService';
import { alertasService } from '../api/services/alertasService';
import { masVendidosService } from '../api/services/masVendidosService';

const Dashboard = () => {
  const [productos, setProductos] = useState([]);
  const [proveedores, setProveedores] = useState([]);
  const [alertas, setAlertas] = useState([]);
  const [masVendidos, setMasVendidos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [prods, provs, alts, top] = await Promise.all([
          productosService.listar().catch(() => []),
          proveedoresService.listar().catch(() => []),
          alertasService.listar().catch(() => []),
          masVendidosService.listar().catch(() => [])
        ]);
        setProductos(prods);
        setProveedores(provs);
        setAlertas(alts);
        setMasVendidos(top);
      } catch (err) {
        setError('Error al cargar datos del dashboard');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Calcular stock total
  const stockTotal = productos.reduce((sum, p) => sum + (p.cantidad_disponible || 0), 0);
  // Alertas críticas (menos de 30 días)
  const alertasCriticas = alertas.filter(a => a.dias_restantes <= 30);
  const alertasMedias = alertas.filter(a => a.dias_restantes > 30 && a.dias_restantes <= 60);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-blue-600" size={40} />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard title="Productos" value={productos.length.toString()} icon={Box} colorClass={{bg:'bg-emerald-50', text:'text-emerald-600'}} />
        <MetricCard title="Stock Total" value={stockTotal.toString()} icon={TrendingUp} colorClass={{bg:'bg-blue-50', text:'text-blue-600'}} />
        <MetricCard title="Vencimientos" value={alertasCriticas.length.toString()} icon={Clock} colorClass={{bg:'bg-orange-50', text:'text-orange-600'}} />
        <MetricCard title="Proveedores" value={proveedores.length.toString()} icon={Truck} colorClass={{bg:'bg-slate-100', text:'text-slate-600'}} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white">
            <h3 className="font-black text-slate-800 flex items-center gap-2 tracking-tight">
              <Activity className="text-emerald-500" size={20}/> 
              Alertas de Vencimientos
            </h3>
            <span className="text-[10px] bg-slate-100 text-slate-500 font-black px-2 py-1 rounded-md uppercase tracking-widest">
              {alertas.length} alertas
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50/50 text-slate-400 text-[10px] uppercase font-black tracking-widest border-b border-slate-100">
                <tr>
                  <th className="px-6 py-4">Producto ID</th>
                  <th className="px-6 py-4">Días Rest.</th>
                  <th className="px-6 py-4">Estado</th>
                  <th className="px-6 py-4 text-right">Vencimiento</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-sm font-bold text-slate-600">
                {alertas.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="px-6 py-8 text-center text-slate-400 italic">
                      No hay alertas de vencimiento registradas
                    </td>
                  </tr>
                ) : (
                  alertas.slice(0, 10).map((row, i) => {
                    const esCritico = row.dias_restantes <= 30;
                    const esAlerta = row.dias_restantes > 30 && row.dias_restantes <= 60;
                    let colorClase = 'text-emerald-600 bg-emerald-50';
                    let label = 'Óptimo';
                    if (esCritico) { colorClase = 'text-red-600 bg-red-50'; label = 'Crítico'; }
                    else if (esAlerta) { colorClase = 'text-orange-600 bg-orange-50'; label = 'Alerta'; }
                    return (
                      <tr key={i} className="hover:bg-slate-50">
                        <td className="px-6 py-4">{row.producto_id || row.id}</td>
                        <td className="px-6 py-4">{row.dias_restantes} días</td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase ${colorClase}`}>{label}</span>
                        </td>
                        <td className="px-6 py-4 text-right text-slate-400">{row.fecha_vencimiento || '-'}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-3xl p-6 text-white shadow-lg shadow-blue-200">
            <h4 className="font-black text-sm uppercase tracking-widest mb-4 opacity-80 italic">Más Vendidos</h4>
            <div className="space-y-3">
              {masVendidos.length === 0 ? (
                <p className="text-white/60 text-xs italic">Sin datos de ventas aún</p>
              ) : (
                masVendidos.slice(0, 4).map((item, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-white/10 rounded-2xl border border-white/10">
                    <span className="text-xs font-bold">{item.nombre || item.producto_id}</span>
                    <span className="text-emerald-300 text-[10px] font-black">{item.total_vendido} vend.</span>
                  </div>
                ))
              )}
            </div>
          </div>
          <div className="bg-emerald-50 border border-emerald-100 rounded-3xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <CheckCircle2 className="text-emerald-600" size={24} />
              <h4 className="font-black text-emerald-900 text-sm uppercase">Estado Sistema</h4>
            </div>
            <p className="text-emerald-700/70 text-xs font-medium leading-relaxed italic">
              {error ? `⚠️ ${error}` : '✅ Base de datos sincronizada.'}
            </p>
            <p className="text-emerald-600/50 text-[10px] font-bold mt-2">
              {productos.length} productos · {proveedores.length} proveedores · {alertas.length} alertas
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;