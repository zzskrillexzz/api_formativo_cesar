import React, { useState, useEffect } from 'react';
import { RotateCcw, RefreshCw } from 'lucide-react';
import { ThemeLoader } from '../components/ThemeLoader';
import { devolucionesService } from '../api/services/devolucionesService';

const Devoluciones = () => {
  const [devoluciones, setDevoluciones] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const devs = await devolucionesService.listar().catch(() => []);
      setDevoluciones(devs);
    } catch (_) {} finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  if (loading) return <ThemeLoader module="Devoluciones" />;

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 bg-white border border-slate-200 px-5 py-3 rounded-lg shadow-sm">
          <RotateCcw size={18} className="text-slate-400" />
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Historial de Devoluciones</span>
        </div>
        <button onClick={fetchData} className="p-3 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-all shadow-sm" title="Actualizar">
          <RefreshCw size={18} className="text-slate-500" />
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-left table-animate">
          <thead className="bg-slate-50 text-slate-400 text-xs uppercase font-bold tracking-wider border-b border-slate-100">
            <tr>
              <th className="px-5 py-3">ID</th>
              <th className="px-5 py-3">Pedido</th>
              <th className="px-5 py-3">Producto</th>
              <th className="px-5 py-3">Lote</th>
              <th className="px-5 py-3 text-right">Cant.</th>
              <th className="px-5 py-3">Motivo</th>
              <th className="px-5 py-3">Fecha</th>
              <th className="px-5 py-3">Registrado por</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 text-sm font-medium text-slate-600">
            {devoluciones.length === 0 ? (
              <tr><td colSpan="8" className="px-5 py-12 text-center text-slate-400">No hay devoluciones registradas</td></tr>
            ) : (
              devoluciones.map((d, i) => (
                <tr key={i} className="hover:bg-slate-50">
                  <td className="px-5 py-3 text-slate-400 text-xs">{d.id}</td>
                  <td className="px-5 py-3">{d.pedido_id}</td>
                  <td className="px-5 py-3">{d.producto_id}</td>
                  <td className="px-5 py-3">{d.lote_id || '-'}</td>
                  <td className="px-5 py-3 text-right font-bold">{d.cantidad}</td>
                  <td className="px-5 py-3 text-slate-500 text-xs max-w-[200px] truncate" title={d.motivo}>{d.motivo}</td>
                  <td className="px-5 py-3 text-slate-400">{d.fecha || '-'}</td>
                  <td className="px-5 py-3 text-slate-400 text-xs">{d.usuario_id || '-'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {devoluciones.length > 0 && (
        <div className="text-xs text-slate-400 font-medium">
          Total: {devoluciones.length} devoluciones registradas
        </div>
      )}
    </div>
  );
};

export default Devoluciones;
