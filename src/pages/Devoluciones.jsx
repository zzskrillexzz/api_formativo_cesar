import React, { useState, useEffect, useRef } from 'react';
import { RotateCcw, RefreshCw, Search, Plus, Edit3, Trash2, X, Loader2 } from 'lucide-react';
import { ThemeLoader } from '../components/ThemeLoader';
import { ConfirmModal } from '../components/ConfirmModal';
import { devolucionesService } from '../api/services/devolucionesService';
import { productosService } from '../api/services/productosService';
import { pedidosService } from '../api/services/pedidosService';
import { useAuth } from '../context/AuthContext';
import { useFocusTrap } from '../hooks/useFocusTrap';

const Devoluciones = () => {
  const [devoluciones, setDevoluciones] = useState([]);
  const [productos, setProductos] = useState([]);
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');
  const POR_PAGINA = 10;
  const [pagina, setPagina] = useState(1);
  const formSnapshotRef = useRef({});
  const { user } = useAuth();

  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [formError, setFormError] = useState('');
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [formData, setFormData] = useState({});
  const [editData, setEditData] = useState({});

  const fetchData = async () => {
    setLoading(true);
    try {
      const [devs, prods, peds] = await Promise.all([
        devolucionesService.listar().catch(() => []),
        productosService.listar().catch(() => []),
        pedidosService.listar().catch(() => [])
      ]);
      setDevoluciones(devs);
      setProductos(prods);
      setPedidos(peds);
    } catch (_) {} finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  // Resetear paginación cuando cambian filtros
  useEffect(() => { setPagina(1); }, [searchTerm, fechaDesde, fechaHasta]);

  const getProductoNombre = (prodId) => {
    const prod = productos.find(p => p.id === prodId);
    return prod ? prod.nombre : prodId;
  };

  const getPedidoInfo = (pedId) => {
    const ped = pedidos.find(p => p.ped_id === pedId);
    return ped ? `${ped.ped_id} (${ped.ped_cli_id_fk || '?'})` : pedId;
  };

  const openModal = () => {
    const nums = devoluciones.map(d => { const m = (d.id || '').match(/DEV(\d+)/); return m ? parseInt(m[1]) : 0; });
    const max = nums.length > 0 ? Math.max(...nums) : 0;
    const hoy = new Date().toISOString().split('T')[0];
    const defaultData = {
      id: 'DEV' + String(max + 1).padStart(3, '0'),
      fecha: hoy
    };
    setFormData(defaultData);
    formSnapshotRef.current = JSON.parse(JSON.stringify(defaultData));
    setFormError('');
    setErrors({});
    setShowModal(true);
  };

  const openEditModal = (dev) => {
    setFormError('');
    setErrors({});
    const edit = {
      id: dev.id,
      pedido_id: dev.pedido_id,
      producto_id: dev.producto_id,
      lote_id: dev.lote_id || '',
      cantidad: dev.cantidad,
      motivo: dev.motivo,
      fecha: dev.fecha ? dev.fecha.split('T')[0] : '',
    };
    setEditData(edit);
    formSnapshotRef.current = JSON.parse(JSON.stringify(edit));
    setShowEditModal(true);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditData({ ...editData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!formData.pedido_id || !formData.producto_id || !formData.cantidad || !formData.motivo || !formData.fecha) {
      setFormError('Los campos marcados con * son obligatorios');
      return;
    }
    const cant = parseInt(formData.cantidad);
    if (isNaN(cant) || cant <= 0) {
      setFormError('La cantidad debe ser un número mayor a 0');
      return;
    }
    setFormSubmitting(true);
    try {
      await devolucionesService.registrar({
        pedido_id: formData.pedido_id,
        producto_id: formData.producto_id,
        lote_id: formData.lote_id || null,
        cantidad: cant,
        motivo: formData.motivo,
        fecha: formData.fecha,
        usuario_id: user?.id || ''
      });
      setShowModal(false);
      fetchData();
    } catch (err) {
      setFormError(err.response?.data?.mensaje || 'Error al registrar devolución');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!editData.cantidad || !editData.motivo || !editData.fecha) {
      setFormError('La cantidad, motivo y fecha son obligatorios');
      return;
    }
    const cant = parseInt(editData.cantidad);
    if (isNaN(cant) || cant <= 0) {
      setFormError('La cantidad debe ser un número mayor a 0');
      return;
    }
    setFormSubmitting(true);
    try {
      await devolucionesService.editar(editData.id, {
        lote_id: editData.lote_id || null,
        cantidad: cant,
        motivo: editData.motivo,
        fecha: editData.fecha
      });
      setShowEditModal(false);
      fetchData();
    } catch (err) {
      setFormError(err.response?.data?.mensaje || 'Error al actualizar devolución');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    setFormSubmitting(true);
    try {
      await devolucionesService.eliminar(confirmDelete);
      setConfirmDelete(null);
      fetchData();
    } catch (err) {
      setFormError(err.response?.data?.mensaje || 'Error al eliminar devolución');
    } finally {
      setFormSubmitting(false);
    }
  };

  const filteredDevoluciones = devoluciones.filter(d => {
    const busca = searchTerm
      ? [d.id, d.pedido_id, getProductoNombre(d.producto_id), d.lote_id, d.motivo, d.usuario_id]
          .filter(Boolean).join(' ').toLowerCase().includes(searchTerm.toLowerCase())
      : true;
    const porFechaDesde = !fechaDesde || (d.fecha && d.fecha >= fechaDesde);
    const porFechaHasta = !fechaHasta || (d.fecha && d.fecha <= fechaHasta);
    return busca && porFechaDesde && porFechaHasta;
  });

  const paginatedDevoluciones = filteredDevoluciones.slice(
    (pagina - 1) * POR_PAGINA, pagina * POR_PAGINA
  );

  // Tarjetas resumen
  const hoy = new Date();
  const mesActualKey = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}`;
  const devEsteMes = devoluciones.filter(d => d.fecha && d.fecha.startsWith(mesActualKey)).length;
  const unidadesDevueltas = devoluciones.reduce((sum, d) => sum + (parseInt(d.cantidad) || 0), 0);

  const focusTrapRef = useFocusTrap(showModal || showEditModal);

  if (loading) return <ThemeLoader module="Devoluciones" />;

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      {/* Barra de acciones */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-3 bg-white border border-slate-300 px-5 py-3 rounded-lg w-80 shadow-sm">
            <Search size={18} className="text-slate-400" />
            <input
              type="text"
              placeholder="Buscar devolución..."
              className="bg-transparent border-none outline-none text-sm w-full font-medium"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              maxLength={100}
            />
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchData} className="p-3 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-all shadow-sm" title="Actualizar">
            <RefreshCw size={18} className="text-slate-500" />
          </button>
          <button onClick={openModal}
            className="flex items-center gap-2 bg-blue-600 text-white px-5 py-3 rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-blue-700 transition-all shadow-md btn-pulse">
            <Plus size={16} /> Nueva Devolución
          </button>
        </div>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 border-l-4 border-l-orange-400 overflow-hidden">
        {/* ── Filtros ── */}
        <div className="flex items-center gap-2 px-5 py-3 border-b border-slate-100 bg-slate-50/30 flex-wrap">
          <input
            type="date"
            value={fechaDesde}
            onChange={(e) => setFechaDesde(e.target.value)}
            className="text-xs border border-slate-300 rounded-md px-2.5 py-1.5 bg-white outline-none shadow-sm font-medium text-slate-600"
            title="Fecha desde"
          />
          <span className="text-slate-300 text-xs">→</span>
          <input
            type="date"
            value={fechaHasta}
            onChange={(e) => setFechaHasta(e.target.value)}
            className="text-xs border border-slate-300 rounded-md px-2.5 py-1.5 bg-white outline-none shadow-sm font-medium text-slate-600"
            title="Fecha hasta"
          />
          {(searchTerm || fechaDesde || fechaHasta) && (
            <button
              onClick={() => { setSearchTerm(''); setFechaDesde(''); setFechaHasta(''); }}
              className="text-[10px] font-bold uppercase tracking-wider text-slate-400 hover:text-red-500 transition-colors px-2"
            >
              ✕ Limpiar filtros
            </button>
          )}
        </div>
        {/* ── Tarjetas resumen ── */}
        <div className="grid grid-cols-3 gap-2 px-5 pt-4 pb-2">
          {[
            { label: 'Todas', count: devoluciones.length, icon: '📋', color: 'border-blue-200 bg-blue-50/50', text: 'text-blue-700' },
            { label: 'Este mes', count: devEsteMes, icon: '📅', color: 'border-emerald-200 bg-emerald-50/50', text: 'text-emerald-700' },
            { label: 'Unidades devueltas', count: unidadesDevueltas, icon: '📦', color: 'border-amber-200 bg-amber-50/50', text: 'text-amber-700' },
          ].map((c, idx) => (
            <div key={idx}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg border ${c.color} transition-all`}
            >
              <span className="text-lg">{c.icon}</span>
              <div className="text-left">
                <div className={`text-base font-black ${c.text}`}>{c.count}</div>
                <div className="text-[9px] font-bold uppercase tracking-wider text-slate-500">{c.label}</div>
              </div>
            </div>
          ))}
        </div>
        <div className="overflow-x-auto">
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
                <th className="px-5 py-3 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 text-sm font-medium text-slate-600">
              {filteredDevoluciones.length === 0 ? (
                <tr><td colSpan="9" className="px-5 py-12 text-center text-slate-400">
                  {searchTerm || fechaDesde || fechaHasta ? 'Sin resultados para estos filtros' : 'No hay devoluciones registradas'}
                </td></tr>
              ) : (
                paginatedDevoluciones.map((d, i) => (
                  <tr key={i} className="hover:bg-orange-100/70 group">
                    <td className="px-5 py-3 text-slate-400 text-xs">{d.id}</td>
                    <td className="px-5 py-3 text-xs" title={d.pedido_id}>{getPedidoInfo(d.pedido_id)}</td>
                    <td className="px-5 py-3" title={d.producto_id}>{getProductoNombre(d.producto_id)}</td>
                    <td className="px-5 py-3">{d.lote_id || '-'}</td>
                    <td className="px-5 py-3 text-right font-bold">{d.cantidad}</td>
                    <td className="px-5 py-3 text-slate-500 text-xs max-w-[180px] truncate" title={d.motivo}>{d.motivo}</td>
                    <td className="px-5 py-3 text-slate-400 text-xs">{d.fecha ? d.fecha.split('T')[0] : '-'}</td>
                    <td className="px-5 py-3 text-slate-400 text-xs">{d.usuario_id || '-'}</td>
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-center gap-1.5">
                        <button onClick={() => openEditModal(d)} title="Editar devolución"
                          className="p-1.5 rounded-md text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors">
                          <Edit3 size={15} />
                        </button>
                        <button onClick={() => setConfirmDelete(d.id)} title="Eliminar devolución"
                          className="p-1.5 rounded-md text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors">
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {/* Paginación */}
        <div className="flex items-center justify-between px-5 py-3 bg-slate-50 border-t border-slate-100 text-xs text-slate-400 font-medium">
          <span>{filteredDevoluciones.length > 0
            ? `${(pagina - 1) * POR_PAGINA + 1}–${Math.min(pagina * POR_PAGINA, filteredDevoluciones.length)} de ${filteredDevoluciones.length}`
            : `${filteredDevoluciones.length} devoluciones`
          }</span>
          <div className="flex items-center gap-2">
            <button onClick={() => setPagina(p => Math.max(1, p - 1))} disabled={pagina <= 1}
              className="px-3 py-1.5 rounded-md border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all text-xs font-bold uppercase tracking-wider">Anterior</button>
            <span className="text-slate-500">{pagina} / {Math.max(1, Math.ceil(filteredDevoluciones.length / POR_PAGINA))}</span>
            <button onClick={() => setPagina(p => p + 1)} disabled={pagina >= Math.ceil(filteredDevoluciones.length / POR_PAGINA)}
              className="px-3 py-1.5 rounded-md border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all text-xs font-bold uppercase tracking-wider">Siguiente</button>
          </div>
        </div>
      </div>

      {/* ── MODAL: Nueva Devolución ── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" ref={focusTrapRef}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4 border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-800">Nueva Devolución</h2>
              <button onClick={() => setShowModal(false)} className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
              {formError && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-xs font-bold px-4 py-2.5 rounded-lg">{formError}</div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Pedido *</label>
                  <select name="pedido_id" value={formData.pedido_id || ''} onChange={handleChange}
                    className="w-full text-sm border border-slate-300 rounded-md px-3 py-2.5 bg-white outline-none font-medium">
                    <option value="">Seleccionar pedido</option>
                    {pedidos.map(p => (
                      <option key={p.ped_id} value={p.ped_id}>{p.ped_id} — {p.ped_cli_id_fk || '?'}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Producto *</label>
                  <select name="producto_id" value={formData.producto_id || ''} onChange={handleChange}
                    className="w-full text-sm border border-slate-300 rounded-md px-3 py-2.5 bg-white outline-none font-medium">
                    <option value="">Seleccionar producto</option>
                    {productos.map(p => (
                      <option key={p.id} value={p.id}>{p.nombre}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Lote</label>
                  <input type="text" name="lote_id" value={formData.lote_id || ''} onChange={handleChange}
                    placeholder="Opcional"
                    className="w-full text-sm border border-slate-300 rounded-md px-3 py-2.5 bg-white outline-none font-medium" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Cantidad *</label>
                  <input type="number" name="cantidad" value={formData.cantidad || ''} onChange={handleChange}
                    min="1" max="999999" placeholder="0"
                    className="w-full text-sm border border-slate-300 rounded-md px-3 py-2.5 bg-white outline-none font-medium" />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Motivo *</label>
                <textarea name="motivo" value={formData.motivo || ''} onChange={handleChange}
                  rows="2" placeholder="Describe el motivo de la devolución"
                  className="w-full text-sm border border-slate-300 rounded-md px-3 py-2.5 bg-white outline-none font-medium resize-none" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Fecha *</label>
                <input type="date" name="fecha" value={formData.fecha || ''} onChange={handleChange}
                  className="w-full text-sm border border-slate-300 rounded-md px-3 py-2.5 bg-white outline-none font-medium" />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowModal(false)}
                  className="px-4 py-2.5 text-xs font-bold text-slate-500 bg-white border border-slate-200 rounded-md hover:bg-slate-50 transition-colors uppercase tracking-wider">
                  Cancelar
                </button>
                <button type="submit" disabled={formSubmitting}
                  className="flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors uppercase tracking-wider disabled:opacity-50">
                  {formSubmitting ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                  Registrar Devolución
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: Editar Devolución ── */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" ref={focusTrapRef}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4 border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-800">Editar Devolución</h2>
              <button onClick={() => setShowEditModal(false)} className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleEdit} className="px-6 py-4 space-y-4">
              {formError && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-xs font-bold px-4 py-2.5 rounded-lg">{formError}</div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">ID</label>
                  <input type="text" value={editData.id || ''} disabled
                    className="w-full text-sm border border-slate-200 rounded-md px-3 py-2.5 bg-slate-50 outline-none font-medium text-slate-400" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Pedido</label>
                  <input type="text" value={editData.pedido_id || ''} disabled
                    className="w-full text-sm border border-slate-200 rounded-md px-3 py-2.5 bg-slate-50 outline-none font-medium text-slate-400" />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Producto</label>
                <input type="text" value={getProductoNombre(editData.producto_id) || ''} disabled
                  className="w-full text-sm border border-slate-200 rounded-md px-3 py-2.5 bg-slate-50 outline-none font-medium text-slate-400" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Lote</label>
                  <input type="text" name="lote_id" value={editData.lote_id || ''} onChange={handleEditChange}
                    placeholder="Opcional"
                    className="w-full text-sm border border-slate-300 rounded-md px-3 py-2.5 bg-white outline-none font-medium" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Cantidad *</label>
                  <input type="number" name="cantidad" value={editData.cantidad || ''} onChange={handleEditChange}
                    min="1" max={editData.cantidad || 999999}
                    className="w-full text-sm border border-slate-300 rounded-md px-3 py-2.5 bg-white outline-none font-medium" />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Motivo *</label>
                <textarea name="motivo" value={editData.motivo || ''} onChange={handleEditChange}
                  rows="2"
                  className="w-full text-sm border border-slate-300 rounded-md px-3 py-2.5 bg-white outline-none font-medium resize-none" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Fecha *</label>
                <input type="date" name="fecha" value={editData.fecha || ''} onChange={handleEditChange}
                  className="w-full text-sm border border-slate-300 rounded-md px-3 py-2.5 bg-white outline-none font-medium" />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowEditModal(false)}
                  className="px-4 py-2.5 text-xs font-bold text-slate-500 bg-white border border-slate-200 rounded-md hover:bg-slate-50 transition-colors uppercase tracking-wider">
                  Cancelar
                </button>
                <button type="submit" disabled={formSubmitting}
                  className="flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors uppercase tracking-wider disabled:opacity-50">
                  {formSubmitting ? <Loader2 size={14} className="animate-spin" /> : <Edit3 size={14} />}
                  Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmación de eliminación */}
      <ConfirmModal
        open={!!confirmDelete}
        title="Eliminar Devolución"
        message={`¿Está seguro de eliminar la devolución ${confirmDelete}? Esta acción no se puede deshacer.`}
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(null)}
        confirmText="Eliminar"
        danger
      />
    </div>
  );
};

export default Devoluciones;