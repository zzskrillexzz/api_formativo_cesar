import React, { useState, useEffect } from 'react';
import { Package, Layers, AlertTriangle, Search, Plus, X, RefreshCw } from 'lucide-react';
import { ThemeLoader } from '../components/ThemeLoader';
import { productosService } from '../api/services/productosService';
import { lotesService } from '../api/services/lotesService';
import { monitoriasService } from '../api/services/monitoriasService';
import { inventariosMovimientosService } from '../api/services/inventariosMovimientosService';
import { useAuth } from '../context/AuthContext';
import { useFocusTrap } from '../hooks/useFocusTrap';

const Inventario = () => {
  const [tab, setTab] = useState('productos');
  const [productos, setProductos] = useState([]);
  const [lotes, setLotes] = useState([]);
  const [monitorias, setMonitorias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // ── Modal para crear ──
  const [showModal, setShowModal] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSubmitting, setFormSubmitting] = useState(false);
  const { user } = useAuth();
  const [formData, setFormData] = useState({});

  const openModal = () => {
    setFormData({});
    setFormError('');
    setShowModal(true);
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmitProducto = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!formData.id || !formData.nombre) {
      setFormError('ID y Nombre son obligatorios');
      return;
    }
    const precio = parseFloat(formData.precio);
    const cantidad = parseInt(formData.cantidad_disponible, 10);
    const stockMin = parseInt(formData.stock_minimo, 10);
    if (isNaN(precio) || precio <= 0) {
      setFormError('El precio debe ser un número mayor a 0');
      return;
    }
    if (isNaN(cantidad) || cantidad < 0) {
      setFormError('La cantidad disponible debe ser un número entero válido');
      return;
    }
    if (isNaN(stockMin) || stockMin < 0) {
      setFormError('El stock mínimo debe ser un número entero válido');
      return;
    }
    setFormSubmitting(true);
    try {
      await productosService.registrar({
        id: formData.id,
        nombre: formData.nombre,
        categoria: formData.categoria || '',
        descripcion: formData.descripcion || '',
        precio: precio,
        cantidad_disponible: cantidad,
        stock_minimo: stockMin,
        fecha_caducidad: formData.fecha_caducidad || null,
        estado: formData.estado || 'Activo',
        proveedor_id: formData.proveedor_id || null
      });
      setShowModal(false);
      fetchData();
    } catch (err) {
      setFormError(err.response?.data?.mensaje || 'Error al crear producto');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleSubmitLote = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!formData.lot_id || !formData.lot_fecha_vencimiento) {
      setFormError('ID y Fecha de Vencimiento son obligatorios');
      return;
    }
    const cantInicial = parseInt(formData.lot_cantidad_inicial, 10);
    if (isNaN(cantInicial) || cantInicial <= 0) {
      setFormError('La cantidad inicial debe ser un número entero mayor a 0');
      return;
    }
    setFormSubmitting(true);
    try {
      await lotesService.registrar({
        lot_id: formData.lot_id,
        lot_numero: formData.lot_numero || '',
        lot_fecha_fabricacion: formData.lot_fecha_fabricacion || null,
        lot_fecha_vencimiento: formData.lot_fecha_vencimiento,
        lot_cantidad_inicial: cantInicial,
        lot_cantidad_actual: cantInicial,
        lot_pro_id_fk: formData.lot_pro_id_fk || '',
        lot_prov_id_fk: formData.lot_prov_id_fk || null,
        lot_estado: formData.lot_estado || 'Activo'
      });
      setShowModal(false);
      fetchData();
    } catch (err) {
      setFormError(err.response?.data?.mensaje || 'Error al crear lote');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleSubmitMovimiento = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!formData.inm_id || !formData.inm_tipo_movimiento || !formData.inm_pro_id_fk || !formData.inm_fecha || !formData.inm_motivo) {
      setFormError('Todos los campos marcados con * son obligatorios');
      return;
    }
    const cantidad = parseInt(formData.inm_cantidad, 10);
    if (isNaN(cantidad) || cantidad <= 0) {
      setFormError('La cantidad debe ser un número entero mayor a 0');
      return;
    }
    setFormSubmitting(true);
    try {
      await inventariosMovimientosService.registrar({
        inm_id: formData.inm_id,
        inm_tipo_movimiento: formData.inm_tipo_movimiento,
        inm_pro_id_fk: formData.inm_pro_id_fk,
        inm_lot_id_fk: formData.inm_lot_id_fk || null,
        inm_cantidad: cantidad,
        inm_fecha: formData.inm_fecha,
        inm_motivo: formData.inm_motivo,
        inm_usu_id_fk: user?.id || ''
      });
      setShowModal(false);
      fetchData();
    } catch (err) {
      setFormError(err.response?.data?.mensaje || 'Error al crear movimiento');
    } finally {
      setFormSubmitting(false);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [prods, lots, mons] = await Promise.all([
        productosService.listar().catch(() => []),
        lotesService.listar().catch(() => []),
        monitoriasService.listar().catch(() => [])
      ]);
      setProductos(prods);
      setLotes(lots);
      setMonitorias(mons);
    } catch (err) {
      console.error('Error cargando inventario:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const tabs = [
    { id: 'productos', label: 'Productos', icon: Package },
    { id: 'lotes', label: 'Lotes', icon: Layers },
    { id: 'movimientos', label: 'Movimientos', icon: AlertTriangle },
  ];

  const filteredProductos = productos.filter(p =>
    (p.nombre || p.id || '').toLowerCase().includes(searchTerm.toLowerCase())
  );
  const filteredLotes = lotes.filter(l =>
    (l.lot_id || l.lot_numero || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const focusTrapRef = useFocusTrap(showModal);

  const getEstadoBadge = (estado) => {
    const map = {
      'Activo': 'text-emerald-600 bg-emerald-50',
      'Agotado': 'text-red-600 bg-red-50',
      'Vencido': 'text-orange-600 bg-orange-50',
      'Cuarentena': 'text-yellow-600 bg-yellow-50',
      'Descontinuado': 'text-slate-500 bg-slate-100',
      'Suspendido': 'text-red-500 bg-red-50',
    };
    return map[estado] || 'text-slate-500 bg-slate-100';
  };

  if (loading) return <ThemeLoader module="Inventario" />;

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex items-center gap-2 bg-white rounded-lg p-1.5 shadow-sm border border-slate-200 w-fit">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-5 py-3 rounded-md text-xs font-bold uppercase tracking-wider transition-all ${
              tab === t.id ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <t.icon size={16} /> {t.label}
          </button>
        ))}
      </div>

      {/* Barra de acciones */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 bg-white border border-slate-200 px-5 py-3 rounded-lg w-96 shadow-sm">
          <Search size={18} className="text-slate-400" />
          <input
            type="text"
            placeholder={tab === 'productos' ? 'Buscar producto...' : tab === 'lotes' ? 'Buscar lote...' : 'Buscar movimiento...'}
            className="bg-transparent border-none outline-none text-sm w-full font-medium"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <button onClick={fetchData} className="p-3 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-all shadow-sm">
            <RefreshCw size={18} className="text-slate-500" />
          </button>
          <button
            onClick={openModal}
            className="flex items-center gap-2 bg-blue-600 text-white px-5 py-3 rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-blue-700 transition-all shadow-md btn-pulse"
          >
            <Plus size={16} /> Nuevo {tab === 'productos' ? 'Producto' : tab === 'lotes' ? 'Lote' : 'Movimiento'}
          </button>
        </div>
      </div>

      {/* TAB: Productos */}
      {tab === 'productos' && (
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left table-animate">
              <thead className="bg-slate-50/50 text-slate-400 text-xs uppercase font-bold tracking-wider border-b border-slate-100">
                <tr>
                  <th className="px-6 py-4">ID</th>
                  <th className="px-6 py-4">Nombre</th>
                  <th className="px-6 py-4">Categoría</th>
                  <th className="px-6 py-4 text-right">Precio</th>
                  <th className="px-6 py-4 text-right">Stock</th>
                  <th className="px-6 py-4">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-sm font-bold text-slate-600">
                {filteredProductos.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-12 text-center text-slate-400 italic">
                      {searchTerm ? 'Sin resultados para esta búsqueda' : 'No hay productos registrados'}
                    </td>
                  </tr>
                ) : (
                  filteredProductos.map((p, i) => (
                    <tr key={i} className="hover:bg-slate-50">
                      <td className="px-6 py-4 text-slate-400 text-xs">{p.id}</td>
                      <td className="px-6 py-4">{p.nombre}</td>
                      <td className="px-6 py-4 text-slate-400">{p.categoria || '-'}</td>
                      <td className="px-6 py-4 text-right">${parseFloat(p.precio || 0).toLocaleString()}</td>
                      <td className="px-6 py-4 text-right">
                        <span className={`font-bold ${(p.cantidad_disponible || 0) <= (p.stock_minimo || 0) ? 'text-red-600' : 'text-slate-800'}`}>
                          {p.cantidad_disponible || 0}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${getEstadoBadge(p.estado)}`}>{p.estado}</span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="px-6 py-4 bg-slate-50/30 border-t border-slate-100 text-xs text-slate-400 font-bold">
            {filteredProductos.length} de {productos.length} productos
          </div>
        </div>
      )}

      {/* TAB: Lotes */}
      {tab === 'lotes' && (
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left table-animate">
              <thead className="bg-slate-50/50 text-slate-400 text-xs uppercase font-bold tracking-wider border-b border-slate-100">
                <tr>
                  <th className="px-6 py-4">ID</th>
                  <th className="px-6 py-4">N° Lote</th>
                  <th className="px-6 py-4">Producto</th>
                  <th className="px-6 py-4 text-right">Cant. Inicial</th>
                  <th className="px-6 py-4 text-right">Cant. Actual</th>
                  <th className="px-6 py-4 text-right">Vencimiento</th>
                  <th className="px-6 py-4">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-sm font-bold text-slate-600">
                {filteredLotes.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-12 text-center text-slate-400 italic">
                      {searchTerm ? 'Sin resultados' : 'No hay lotes registrados'}
                    </td>
                  </tr>
                ) : (
                  filteredLotes.map((l, i) => (
                    <tr key={i} className="hover:bg-slate-50">
                      <td className="px-6 py-4 text-slate-400 text-xs">{l.lot_id}</td>
                      <td className="px-6 py-4">{l.lot_numero}</td>
                      <td className="px-6 py-4 text-slate-400">{l.lot_pro_id_fk || '-'}</td>
                      <td className="px-6 py-4 text-right">{l.lot_cantidad_inicial}</td>
                      <td className="px-6 py-4 text-right">{l.lot_cantidad_actual}</td>
                      <td className="px-6 py-4 text-right text-slate-400">{l.lot_fecha_vencimiento || '-'}</td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${getEstadoBadge(l.lot_estado)}`}>{l.lot_estado}</span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="px-6 py-4 bg-slate-50/30 border-t border-slate-100 text-xs text-slate-400 font-bold">
            {filteredLotes.length} de {lotes.length} lotes
          </div>
        </div>
      )}

      {/* TAB: Movimientos */}
      {tab === 'movimientos' && (
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left table-animate">
              <thead className="bg-slate-50/50 text-slate-400 text-xs uppercase font-bold tracking-wider border-b border-slate-100">
                <tr>
                  <th className="px-6 py-4">ID</th>
                  <th className="px-6 py-4">Producto</th>
                  <th className="px-6 py-4">Tipo</th>
                  <th className="px-6 py-4 text-right">Cantidad</th>
                  <th className="px-6 py-4 text-right">Saldo Anterior</th>
                  <th className="px-6 py-4 text-right">Saldo Actual</th>
                  <th className="px-6 py-4">Fecha</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-sm font-bold text-slate-600">
                {monitorias.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-12 text-center text-slate-400 italic">No hay movimientos registrados</td>
                  </tr>
                ) : (
                  monitorias.map((m, i) => (
                    <tr key={i} className="hover:bg-slate-50">
                      <td className="px-6 py-4 text-slate-400 text-xs">{m.mon_id}</td>
                      <td className="px-6 py-4">{m.mon_pro_id_fk}</td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                          m.mon_tipo === 'Entrada' ? 'text-emerald-600 bg-emerald-50' : 
                          m.mon_tipo === 'Salida' ? 'text-red-600 bg-red-50' : 'text-yellow-600 bg-yellow-50'
                        }`}>{m.mon_tipo}</span>
                      </td>
                      <td className="px-6 py-4 text-right">{m.mon_cantidad}</td>
                      <td className="px-6 py-4 text-right text-slate-400">{m.mon_saldo_anterior}</td>
                      <td className="px-6 py-4 text-right">{m.mon_saldo_actual}</td>
                      <td className="px-6 py-4 text-slate-400">{m.mon_fecha || '-'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="px-6 py-4 bg-slate-50/30 border-t border-slate-100 text-xs text-slate-400 font-bold">
            {monitorias.length} movimientos
          </div>
        </div>
      )}

      {/* ── Modal: Nuevo ── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-6">
          <div ref={focusTrapRef} className="bg-white rounded-lg shadow-2xl border border-slate-100 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-8 py-6 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-800">
                Nuevo {tab === 'productos' ? 'Producto' : tab === 'lotes' ? 'Lote' : 'Movimiento'}
              </h2>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-slate-100 rounded-md transition-colors">
                <X size={20} className="text-slate-400" />
              </button>
            </div>

            <form onSubmit={
              tab === 'productos' ? handleSubmitProducto :
              tab === 'lotes' ? handleSubmitLote : handleSubmitMovimiento
            } className="px-8 py-6 space-y-4">
              {formError && (
                <div className="p-3 bg-red-50 text-red-600 text-xs font-bold rounded-md border border-red-100">{formError}</div>
              )}

              {/* ─── PRODUCTO ─── */}
              {tab === 'productos' && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">ID *</label>
                      <input name="id" autoFocus value={formData.id || ''} onChange={handleChange} className="w-full p-3 bg-slate-50 border border-slate-100 rounded-md outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium mt-1" />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Nombre *</label>
                      <input name="nombre" value={formData.nombre || ''} onChange={handleChange} className="w-full p-3 bg-slate-50 border border-slate-100 rounded-md outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium mt-1" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Categoría</label>
                      <input name="categoria" value={formData.categoria || ''} onChange={handleChange} className="w-full p-3 bg-slate-50 border border-slate-100 rounded-md outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium mt-1" />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Precio</label>
                      <input name="precio" type="number" step="0.01" value={formData.precio || ''} onChange={handleChange} className="w-full p-3 bg-slate-50 border border-slate-100 rounded-md outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium mt-1" />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Descripción</label>
                    <input name="descripcion" value={formData.descripcion || ''} onChange={handleChange} className="w-full p-3 bg-slate-50 border border-slate-100 rounded-md outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium mt-1" />
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Stock</label>
                      <input name="cantidad_disponible" type="number" value={formData.cantidad_disponible || ''} onChange={handleChange} className="w-full p-3 bg-slate-50 border border-slate-100 rounded-md outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium mt-1" />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Stock Mín.</label>
                      <input name="stock_minimo" type="number" value={formData.stock_minimo || ''} onChange={handleChange} className="w-full p-3 bg-slate-50 border border-slate-100 rounded-md outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium mt-1" />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Estado</label>
                      <select name="estado" value={formData.estado || 'Activo'} onChange={handleChange} className="w-full p-3 bg-slate-50 border border-slate-100 rounded-md outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium mt-1">
                        <option value="Activo">Activo</option>
                        <option value="Descontinuado">Descontinuado</option>
                        <option value="Suspendido">Suspendido</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Proveedor ID</label>
                    <input name="proveedor_id" value={formData.proveedor_id || ''} onChange={handleChange} className="w-full p-3 bg-slate-50 border border-slate-100 rounded-md outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium mt-1" />
                  </div>
                </>
              )}

              {/* ─── LOTE ─── */}
              {tab === 'lotes' && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">ID *</label>
                      <input name="lot_id" autoFocus value={formData.lot_id || ''} onChange={handleChange} className="w-full p-3 bg-slate-50 border border-slate-100 rounded-md outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium mt-1" />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">N° Lote</label>
                      <input name="lot_numero" value={formData.lot_numero || ''} onChange={handleChange} className="w-full p-3 bg-slate-50 border border-slate-100 rounded-md outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium mt-1" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Producto ID</label>
                      <input name="lot_pro_id_fk" value={formData.lot_pro_id_fk || ''} onChange={handleChange} className="w-full p-3 bg-slate-50 border border-slate-100 rounded-md outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium mt-1" />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Proveedor ID</label>
                      <input name="lot_prov_id_fk" value={formData.lot_prov_id_fk || ''} onChange={handleChange} className="w-full p-3 bg-slate-50 border border-slate-100 rounded-md outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium mt-1" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Fecha Fabricación</label>
                      <input name="lot_fecha_fabricacion" type="date" value={formData.lot_fecha_fabricacion || ''} onChange={handleChange} className="w-full p-3 bg-slate-50 border border-slate-100 rounded-md outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium mt-1" />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Fecha Vencimiento *</label>
                      <input name="lot_fecha_vencimiento" type="date" value={formData.lot_fecha_vencimiento || ''} onChange={handleChange} className="w-full p-3 bg-slate-50 border border-slate-100 rounded-md outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium mt-1" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Cantidad Inicial</label>
                      <input name="lot_cantidad_inicial" type="number" value={formData.lot_cantidad_inicial || ''} onChange={handleChange} className="w-full p-3 bg-slate-50 border border-slate-100 rounded-md outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium mt-1" />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Estado</label>
                      <select name="lot_estado" value={formData.lot_estado || 'Activo'} onChange={handleChange} className="w-full p-3 bg-slate-50 border border-slate-100 rounded-md outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium mt-1">
                        <option value="Activo">Activo</option>
                        <option value="Agotado">Agotado</option>
                        <option value="Vencido">Vencido</option>
                        <option value="Cuarentena">Cuarentena</option>
                      </select>
                    </div>
                  </div>
                </>
              )}

              {/* ─── MOVIMIENTO ─── */}
              {tab === 'movimientos' && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">ID *</label>
                      <input name="inm_id" autoFocus value={formData.inm_id || ''} onChange={handleChange} className="w-full p-3 bg-slate-50 border border-slate-100 rounded-md outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium mt-1" />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Tipo *</label>
                      <select name="inm_tipo_movimiento" value={formData.inm_tipo_movimiento || ''} onChange={handleChange} className="w-full p-3 bg-slate-50 border border-slate-100 rounded-md outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium mt-1">
                        <option value="">Seleccionar...</option>
                        <option value="Entrada">Entrada</option>
                        <option value="Salida">Salida</option>
                        <option value="Ajuste">Ajuste</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Producto ID *</label>
                      <input name="inm_pro_id_fk" value={formData.inm_pro_id_fk || ''} onChange={handleChange} className="w-full p-3 bg-slate-50 border border-slate-100 rounded-md outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium mt-1" />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Lote ID</label>
                      <input name="inm_lot_id_fk" value={formData.inm_lot_id_fk || ''} onChange={handleChange} className="w-full p-3 bg-slate-50 border border-slate-100 rounded-md outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium mt-1" />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Cantidad *</label>
                      <input name="inm_cantidad" type="number" value={formData.inm_cantidad || ''} onChange={handleChange} className="w-full p-3 bg-slate-50 border border-slate-100 rounded-md outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium mt-1" />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Fecha *</label>
                      <input name="inm_fecha" type="date" value={formData.inm_fecha || ''} onChange={handleChange} className="w-full p-3 bg-slate-50 border border-slate-100 rounded-md outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium mt-1" />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Usuario</label>
                      <input value={user?.id || ''} disabled className="w-full p-3 bg-slate-100 border border-slate-200 rounded-md outline-none text-sm font-medium text-slate-400 mt-1" />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Motivo *</label>
                    <input name="inm_motivo" value={formData.inm_motivo || ''} onChange={handleChange} className="w-full p-3 bg-slate-50 border border-slate-100 rounded-md outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium mt-1" />
                  </div>
                </>
              )}

              <button
                type="submit"
                disabled={formSubmitting}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-bold py-3.5 rounded-lg shadow-sm shadow-blue-100 transition-all active:scale-95 uppercase tracking-wider text-xs flex items-center justify-center gap-2"
              >
                {formSubmitting ? <Loader2 className="animate-spin" size={18} /> : null}
                Guardar
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventario;




