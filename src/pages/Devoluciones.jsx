import React, { useState, useEffect } from 'react';
import { RotateCcw, Plus, X, RefreshCw, Loader2 } from 'lucide-react';
import { ThemeLoader } from '../components/ThemeLoader';
import { devolucionesService } from '../api/services/devolucionesService';
import { pedidosService } from '../api/services/pedidosService';
import { productosService } from '../api/services/productosService';
import { useAuth } from '../context/AuthContext';

const Devoluciones = () => {
  const [devoluciones, setDevoluciones] = useState([]);
  const [pedidos, setPedidos] = useState([]);
  const [pedidosCargados, setPedidosCargados] = useState(false);
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formData, setFormData] = useState({});
  const { user } = useAuth();

  const fetchData = async () => {
    setLoading(true);
    try {
      const [devs, peds, prods] = await Promise.all([
        devolucionesService.listar().catch(() => []),
        pedidosService.listar().catch(() => []),
        productosService.listar().catch(() => [])
      ]);
      setDevoluciones(devs);
      setPedidos(peds);
      setProductos(prods);
      setPedidosCargados(true);
    } catch (_) {} finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!formData.pedido_id || !formData.producto_id || !formData.cantidad || !formData.motivo || !formData.fecha) {
      setFormError('Campos con * obligatorios');
      return;
    }
    setFormSubmitting(true);
    try {
      await devolucionesService.registrar({
        pedido_id: formData.pedido_id,
        producto_id: formData.producto_id,
        lote_id: formData.lote_id || null,
        cantidad: parseInt(formData.cantidad, 10),
        motivo: formData.motivo,
        fecha: formData.fecha,
        usuario_id: user?.id || ''
      });
      setShowModal(false);
      fetchData();
    } catch (err) {
      setFormError(err.response?.data?.mensaje || 'Error al registrar devolucion');
    } finally { setFormSubmitting(false); }
  };

  if (loading) return <ThemeLoader module="Devoluciones" />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-end gap-2">
        <button onClick={fetchData} className="p-3 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-all shadow-sm">
          <RefreshCw size={18} className="text-slate-500" />
        </button>
        <button onClick={() => { setFormData({}); setFormError(''); setShowModal(true); }}
          className="flex items-center gap-2 bg-blue-600 text-white px-5 py-3 rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-blue-700 transition-all shadow-md btn-pulse">
          <Plus size={16} /> Nueva Devolucion
        </button>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden card-hover">
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
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 text-sm font-medium text-slate-600">
            {devoluciones.length === 0 ? (
              <tr><td colSpan="7" className="px-5 py-12 text-center text-slate-400">No hay devoluciones registradas</td></tr>
            ) : (
              devoluciones.map((d, i) => (
                <tr key={i} className="hover:bg-slate-50">
                  <td className="px-5 py-3 text-slate-400 text-xs">{d.id}</td>
                  <td className="px-5 py-3">{d.pedido_id}</td>
                  <td className="px-5 py-3">{d.producto_id}</td>
                  <td className="px-5 py-3">{d.lote_id || '-'}</td>
                  <td className="px-5 py-3 text-right">{d.cantidad}</td>
                  <td className="px-5 py-3 text-slate-500 text-xs max-w-[180px] truncate">{d.motivo}</td>
                  <td className="px-5 py-3 text-slate-400">{d.fecha || '-'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="relative bg-white rounded-lg shadow-2xl border border-slate-100 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-800">Registrar Devolucion</h3>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-slate-100 rounded-md"><X size={18} className="text-slate-400" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              {formError && <div className="p-3 bg-red-50 text-red-600 text-xs font-bold rounded-md border border-red-100">{formError}</div>}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Pedido *</label>
                  <select name="pedido_id" value={formData.pedido_id || ''} onChange={handleChange}
                    className="w-full p-3 bg-slate-50 border border-slate-100 rounded-md outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium mt-1">
                    <option value="">Seleccionar...</option>
                    {pedidos.map(p => <option key={p.ped_id} value={p.ped_id}>{p.ped_id} - {parseFloat(p.ped_total||0).toLocaleString('es-CO')}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Producto *</label>
                  <select name="producto_id" value={formData.producto_id || ''} onChange={handleChange}
                    className="w-full p-3 bg-slate-50 border border-slate-100 rounded-md outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium mt-1">
                    <option value="">Seleccionar...</option>
                    {productos.map(p => <option key={p.id} value={p.id}>{p.nombre} ({p.id})</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Fecha *</label>
                  <input name="fecha" type="date" value={formData.fecha || ''} onChange={handleChange}
                    className="w-full p-3 bg-slate-50 border border-slate-100 rounded-md outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium mt-1" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Cantidad *</label>
                  <input name="cantidad" type="number" min="1" value={formData.cantidad || ''} onChange={handleChange}
                    className="w-full p-3 bg-slate-50 border border-slate-100 rounded-md outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium mt-1" />
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Lote (opcional)</label>
                <input name="lote_id" placeholder="Numero de lote" value={formData.lote_id || ''} onChange={handleChange}
                  className="w-full p-3 bg-slate-50 border border-slate-100 rounded-md outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium mt-1" />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Motivo *</label>
                <textarea name="motivo" rows="2" placeholder="Motivo de la devolucion..." value={formData.motivo || ''} onChange={handleChange}
                  className="w-full p-3 bg-slate-50 border border-slate-100 rounded-md outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium mt-1 resize-none" />
              </div>
              <button type="submit" disabled={formSubmitting}
                className="w-full bg-blue-600 text-white font-bold py-3 rounded-md text-sm uppercase tracking-wider hover:bg-blue-700 disabled:bg-slate-300 transition-all flex items-center justify-center gap-2">
                {formSubmitting ? <Loader2 className="animate-spin" size={16} /> : null}
                Registrar Devolucion
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Devoluciones;
