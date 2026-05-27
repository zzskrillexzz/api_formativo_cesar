import React, { useState, useEffect } from 'react';
import { Package, Layers, AlertTriangle, Search, Plus, X, RefreshCw, Edit, Loader2, Trash2 } from 'lucide-react';
import { ThemeLoader } from '../components/ThemeLoader';
import { productosService } from '../api/services/productosService';
import { lotesService } from '../api/services/lotesService';
import { monitoriasService } from '../api/services/monitoriasService';
import { inventariosMovimientosService } from '../api/services/inventariosMovimientosService';
import { proveedoresService } from '../api/services/proveedoresService';
import { useAuth } from '../context/AuthContext';
import { useFocusTrap } from '../hooks/useFocusTrap';
import { FIELD_LIMITS } from '../utils/fieldLimits';

const Inventario = () => {
  const [tab, setTab] = useState('productos');
  const [productos, setProductos] = useState([]);
  const [lotes, setLotes] = useState([]);
  const [monitorias, setMonitorias] = useState([]);
  const [proveedores, setProveedores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // ── Modal para crear ──
  const [showModal, setShowModal] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const { user } = useAuth();
  const [formData, setFormData] = useState({});
  const [editingId, setEditingId] = useState(null);
  const [filtroEstado, setFiltroEstado] = useState('');
  const [filtroTipo, setFiltroTipo] = useState('');
  const [filtroFechaDesde, setFiltroFechaDesde] = useState('');
  const [filtroFechaHasta, setFiltroFechaHasta] = useState('');
  const [pagina, setPagina] = useState(1);
  const [totalMovimientos, setTotalMovimientos] = useState(0);
  const POR_PAGINA = 15;
  const isEditing = !!editingId;

  const openModal = () => {
    let defaultData = {};
    if (tab === 'productos') {
      const nums = productos.map(p => { const m = (p.id || '').match(/PRO(\d+)/); return m ? parseInt(m[1]) : 0; });
      const next = 'PRO' + String((nums.length > 0 ? Math.max(...nums) : 0) + 1).padStart(3, '0');
      defaultData = { id: next };
    } else if (tab === 'lotes') {
      const nums = lotes.map(l => { const m = (l.lot_id || '').match(/LOT(\d+)/); return m ? parseInt(m[1]) : 0; });
      const next = 'LOT' + String((nums.length > 0 ? Math.max(...nums) : 0) + 1).padStart(3, '0');
      defaultData = { lot_id: next };
    } else if (tab === 'movimientos') {
      let max = 0;
      monitorias.forEach(m => {
        const match = (m.mon_inm_id_fk || '').match(/INM(\d+)/);
        if (match) max = Math.max(max, parseInt(match[1]));
      });
      defaultData = { inm_id: 'INM' + String(max + 1).padStart(3, '0') };
    }
    setFormData(defaultData);
    setFormError('');
    setErrors({});
    setEditingId(null);
    setShowModal(true);
  };

  const abrirEditarProducto = (prod) => {
    try {
      if (!prod) return;
      setFormData({
        id: prod.id, nombre: prod.nombre, categoria: prod.categoria || '',
        descripcion: prod.descripcion || '', precio: prod.precio || '',
        cantidad_disponible: prod.cantidad_disponible != null ? prod.cantidad_disponible : '',
        stock_minimo: prod.stock_minimo != null ? prod.stock_minimo : '',
        estado: prod.estado || 'Activo', proveedor_id: prod.proveedor_id || ''
      });
      setFormError('');
      setErrors({});
      setEditingId(prod.id);
      setShowModal(true);
    } catch (e) { console.error('Error al editar:', e); }
  };

  const eliminarProducto = async (id) => {
    if (!window.confirm('Eliminar este producto? Se borrarán todos sus lotes, movimientos y registros asociados.')) return;
    try {
      await productosService.eliminar(id, { params: { force: true } });
      fetchData();
    } catch(e) {
      alert('No se pudo eliminar: ' + (e.response?.data?.mensaje || e.message));
    }
  };
  const eliminarLote = async (id) => {
    if (!window.confirm('Eliminar este lote? Se borrarán movimientos, monitoría y registros asociados.')) return;
    try {
      await lotesService.eliminar(id, { params: { force: true } });
      fetchData();
    } catch(e) {
      alert('No se pudo eliminar: ' + (e.response?.data?.mensaje || e.message));
    }
  };

  const abrirEditarLote = (lote) => {
    setFormData({
      lot_id: lote.lot_id, lot_numero: lote.lot_numero || '',
      lot_fecha_fabricacion: lote.lot_fecha_fabricacion || '',
      lot_fecha_vencimiento: lote.lot_fecha_vencimiento || '',
      lot_cantidad_inicial: lote.lot_cantidad_inicial || '',
      lot_pro_id_fk: lote.lot_pro_id_fk || '', lot_prov_id_fk: lote.lot_prov_id_fk || '',
      lot_estado: lote.lot_estado || 'Activo'
    });
    setFormError('');
    setErrors({});
    setEditingId(lote.lot_id);
    setShowModal(true);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    const max = FIELD_LIMITS[name];
    if (max && value.length > max) return;
    setFormData({ ...formData, [name]: value });
    // Validación en tiempo real
    validateField(name, value);
  };

  const validateField = (name, value) => {
    const newErrors = { ...errors };
    const tabActual = tab;

    if (tabActual === 'productos') {
      if (name === 'id') {
        if (!value) newErrors.id = 'El ID es obligatorio';
        else if (!editingId && productos.some(p => p.id === value)) newErrors.id = 'El ID ya existe';
        else delete newErrors.id;
      }
      if (name === 'nombre' || (name === 'id' && !value)) {
        if (name === 'nombre' && !value) newErrors.nombre = 'El nombre es obligatorio';
        else if (name === 'nombre') delete newErrors.nombre;
      }
      if (name === 'precio' && value && parseFloat(value) <= 0) newErrors.precio = 'Debe ser mayor a 0';
      else if (name === 'precio' && value) delete newErrors.precio;
      if (name === 'proveedor_id' && value) delete newErrors.proveedor_id;
    }

    if (tabActual === 'lotes') {
      if (name === 'lot_id') {
        if (!value) newErrors.lot_id = 'El ID es obligatorio';
        else if (!editingId && lotes.some(l => l.lot_id === value)) newErrors.lot_id = 'El ID ya existe';
        else delete newErrors.lot_id;
      }
      if (name === 'lot_numero' && !value) newErrors.lot_numero = 'El número de lote es obligatorio';
      else if (name === 'lot_numero') delete newErrors.lot_numero;
      if (name === 'lot_fecha_vencimiento' && !value) newErrors.lot_fecha_vencimiento = 'La fecha de vencimiento es obligatoria';
      else if (name === 'lot_fecha_vencimiento') delete newErrors.lot_fecha_vencimiento;
      if (name === 'lot_fecha_fabricacion' && value && formData.lot_fecha_vencimiento && value >= formData.lot_fecha_vencimiento) {
        newErrors.lot_fecha_fabricacion = 'Debe ser anterior a la fecha de vencimiento';
      } else if (name === 'lot_fecha_fabricacion') delete newErrors.lot_fecha_fabricacion;
      if (name === 'lot_fecha_vencimiento' && value && formData.lot_fecha_fabricacion && formData.lot_fecha_fabricacion >= value) {
        newErrors.lot_fecha_vencimiento = 'Debe ser posterior a la fecha de fabricación';
      } else if (name === 'lot_fecha_vencimiento' && value) {
        const soloVen = !newErrors.lot_fecha_vencimiento || newErrors.lot_fecha_vencimiento === 'Debe ser posterior a la fecha de fabricación';
        if (soloVen) delete newErrors.lot_fecha_vencimiento;
      }
      if (name === 'lot_pro_id_fk') {
        if (!value) newErrors.lot_pro_id_fk = 'Selecciona un producto';
        else if (!productos.some(p => p.id === value)) newErrors.lot_pro_id_fk = 'Producto no existe';
        else delete newErrors.lot_pro_id_fk;
      }
      if (name === 'lot_prov_id_fk' && !value) newErrors.lot_prov_id_fk = 'Selecciona un proveedor';
      else if (name === 'lot_prov_id_fk') delete newErrors.lot_prov_id_fk;
      if (name === 'lot_cantidad_inicial' && value && parseInt(value) <= 0) newErrors.lot_cantidad_inicial = 'Debe ser mayor a 0';
      else if (name === 'lot_cantidad_inicial') delete newErrors.lot_cantidad_inicial;
    }

    if (tabActual === 'movimientos') {
      if (name === 'inm_id' && !value) newErrors.inm_id = 'El ID es obligatorio';
      else if (name === 'inm_id') delete newErrors.inm_id;
      if (name === 'inm_tipo_movimiento' && !value) newErrors.inm_tipo_movimiento = 'Selecciona un tipo';
      else if (name === 'inm_tipo_movimiento') delete newErrors.inm_tipo_movimiento;
      if (name === 'inm_pro_id_fk') {
        if (!value) newErrors.inm_pro_id_fk = 'Selecciona un producto';
        else delete newErrors.inm_pro_id_fk;
      }
      if (name === 'inm_lot_id_fk' && value && !lotes.some(l => l.lot_id === value)) newErrors.inm_lot_id_fk = 'Lote no existe';
      else if (name === 'inm_lot_id_fk') delete newErrors.inm_lot_id_fk;
      if (name === 'inm_cantidad') {
        if (!value || parseInt(value) <= 0) newErrors.inm_cantidad = 'Debe ser mayor a 0';
        else delete newErrors.inm_cantidad;
      }
      if (name === 'inm_fecha' && !value) newErrors.inm_fecha = 'La fecha es obligatoria';
      else if (name === 'inm_fecha') delete newErrors.inm_fecha;
      if (name === 'inm_motivo' && !value) newErrors.inm_motivo = 'El motivo es obligatorio';
      else if (name === 'inm_motivo') delete newErrors.inm_motivo;
    }

    setErrors(newErrors);
  };

  const clearErrors = () => setErrors({});

  const handleSubmitProducto = async (e) => {
    e.preventDefault();
    setFormError('');
    setErrors({});
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
      const payload = {
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
      };
      if (isEditing) {
        await productosService.editar(payload.id, payload);
      } else {
        await productosService.registrar(payload);
      }
      setShowModal(false);
      fetchData();
    } catch (err) {
      setFormError(err.response?.data?.mensaje || 'Error al guardar producto');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleSubmitLote = async (e) => {
    e.preventDefault();
    setFormError('');
    setErrors({});
    if (!formData.lot_id || !formData.lot_fecha_vencimiento) {
      setFormError('ID y Fecha de Vencimiento son obligatorios');
      return;
    }
    if (!formData.lot_numero) {
      setFormError('El número de lote es obligatorio');
      return;
    }
    if (!formData.lot_pro_id_fk) {
      setFormError('Selecciona un producto para el lote');
      return;
    }
    if (!formData.lot_prov_id_fk) {
      setFormError('Selecciona un proveedor para el lote');
      return;
    }
    if (formData.lot_fecha_fabricacion && formData.lot_fecha_vencimiento && formData.lot_fecha_fabricacion >= formData.lot_fecha_vencimiento) {
      setFormError('La fecha de fabricación debe ser anterior a la fecha de vencimiento');
      return;
    }
    const cantInicial = parseInt(formData.lot_cantidad_inicial, 10);
    if (isNaN(cantInicial) || cantInicial <= 0) {
      setFormError('La cantidad inicial debe ser un número entero mayor a 0');
      return;
    }
    setFormSubmitting(true);
    try {
      const payload = {
        lot_id: formData.lot_id,
        lot_numero: formData.lot_numero || '',
        lot_fecha_fabricacion: formData.lot_fecha_fabricacion || null,
        lot_fecha_vencimiento: formData.lot_fecha_vencimiento,
        lot_cantidad_inicial: cantInicial,
        lot_cantidad_actual: cantInicial,
        lot_pro_id_fk: formData.lot_pro_id_fk || '',
        lot_prov_id_fk: formData.lot_prov_id_fk || null,
        lot_estado: formData.lot_estado || 'Activo'
      };
      if (isEditing) {
        await lotesService.editar(payload.lot_id, payload);
      } else {
        await lotesService.registrar(payload);
      }
      setShowModal(false);
      fetchData();
    } catch (err) {
      setFormError(err.response?.data?.mensaje || 'Error al guardar lote');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleSubmitMovimiento = async (e) => {
    e.preventDefault();
    setFormError('');
    setErrors({});
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

  const fetchData = async (movParams = {}) => {
    setLoading(true);
    try {
      const [prods, lots, monsRes, provs] = await Promise.all([
        productosService.listar().catch(() => []),
        lotesService.listar().catch(() => []),
        monitoriasService.listar(movParams).catch(() => ({ data: [], total: 0 })),
        proveedoresService.listar().catch(() => [])
      ]);
      setProductos(prods);
      setLotes(lots);
      setProveedores(provs);
      // monsRes puede venir como {data, total} (nuevo) o array (viejo)
      if (Array.isArray(monsRes)) {
        setMonitorias(monsRes);
        setTotalMovimientos(monsRes.length);
      } else {
        setMonitorias(monsRes.data || []);
        setTotalMovimientos(monsRes.total ?? 0);
      }
    } catch (err) {
      console.error('Error cargando inventario:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  // Refetch movimientos cuando cambian filtros/página
  useEffect(() => {
    if (tab !== 'movimientos') return;
    const params = {
      page: pagina,
      limit: POR_PAGINA
    };
    if (filtroTipo) params.tipo = filtroTipo;
    if (filtroFechaDesde) params.fecha_desde = filtroFechaDesde;
    if (filtroFechaHasta) params.fecha_hasta = filtroFechaHasta;
    if (searchTerm) params.q = searchTerm;
    fetchData(params);
  }, [tab, pagina, filtroTipo, filtroFechaDesde, filtroFechaHasta, searchTerm]);

  const tabs = [
    { id: 'productos', label: 'Productos', icon: Package },
    { id: 'lotes', label: 'Lotes', icon: Layers },
    { id: 'movimientos', label: 'Movimientos', icon: AlertTriangle },
  ];

  const filteredProductos = productos.filter(p =>
    [p.id, p.nombre, p.categoria, p.descripcion, p.precio, p.estado,
     p.cantidad_disponible, p.stock_minimo, p.proveedor_id
    ].filter(Boolean).join(' ').toLowerCase().includes(searchTerm.toLowerCase())
  );
  const filteredLotes = lotes.filter(l => {
    const busca = [l.lot_id, l.lot_numero, l.lot_fecha_fabricacion, l.lot_fecha_vencimiento,
      l.lot_cantidad_inicial, l.lot_cantidad_actual, l.lot_pro_id_fk, l.lot_prov_id_fk, l.lot_estado
    ].filter(Boolean).join(' ').toLowerCase().includes(searchTerm.toLowerCase());
    const porEstado = !filtroEstado || l.lot_estado === filtroEstado;
    return busca && porEstado;
  });

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
            className={`select-none cursor-pointer flex items-center gap-2 px-5 py-3 rounded-md text-xs font-bold uppercase tracking-wider transition-all ${
              tab === t.id ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <t.icon size={16} /> {t.label}
          </button>
        ))}
      </div>

      {/* Barra de acciones */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 bg-white border border-slate-300 px-5 py-3 rounded-lg w-96 shadow-sm">
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
          <button onClick={() => fetchData()} className="p-3 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-all shadow-sm">
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
                  <th className="px-6 py-4 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-sm font-bold text-slate-600">
                {filteredProductos.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-12 text-center text-slate-400 italic">
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
                      <td className="px-6 py-4 text-right flex items-center justify-end gap-1">
                        <button onClick={() => abrirEditarProducto(p)} className="p-2 text-slate-400 hover:text-blue-600 transition-colors" title="Editar">
                          <Edit size={14} />
                        </button>
                        <button onClick={() => eliminarProducto(p.id)} className="p-2 text-slate-400 hover:text-red-600 transition-colors" title="Eliminar">
                          <Trash2 size={14} />
                        </button>
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
          <div className="flex items-center gap-3 px-6 py-3 border-b border-slate-100 bg-slate-50/30">
            <select
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value)}
              className="text-xs font-medium border border-slate-400 rounded-md px-2.5 py-1.5 bg-white outline-none cursor-pointer shadow-sm"
            >
              <option value="">Todos los estados</option>
              <option value="Activo">Activo</option>
              <option value="Agotado">Agotado</option>
              <option value="Vencido">Vencido</option>
              <option value="Cuarentena">Cuarentena</option>
            </select>
            {(filtroEstado) && (
              <button
                onClick={() => { setFiltroEstado(''); }}
                className="text-xs text-red-500 font-medium hover:text-red-700 ml-auto"
              >
                Limpiar filtros
              </button>
            )}
          </div>
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
                  <th className="px-6 py-4 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-sm font-bold text-slate-600">
                {filteredLotes.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="px-6 py-12 text-center text-slate-400 italic">
                      {searchTerm ? 'Sin resultados' : 'No hay lotes registrados'}
                    </td>
                  </tr>
                ) : (
                  filteredLotes.map((l, i) => (
                    <tr key={i} className="hover:bg-slate-50">
                      <td className="px-6 py-4 text-slate-400 text-xs">{l.lot_id}</td>
                      <td className="px-6 py-4">{l.lot_numero}</td>
                      <td className="px-6 py-4">
                        {(() => {
                          const prod = productos.find(p => p.id === l.lot_pro_id_fk);
                          return prod ? (
                            <span title={prod.id}>{prod.nombre}</span>
                          ) : (l.lot_pro_id_fk || '-');
                        })()}
                      </td>
                      <td className="px-6 py-4 text-right">{l.lot_cantidad_inicial}</td>
                      <td className="px-6 py-4 text-right">{l.lot_cantidad_actual}</td>
                      <td className="px-6 py-4 text-right text-slate-400">{l.lot_fecha_vencimiento || '-'}</td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${getEstadoBadge(l.lot_estado)}`}>{l.lot_estado}</span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button onClick={() => abrirEditarLote(l)} className="p-2 text-slate-400 hover:text-blue-600 transition-colors">
                          <Edit size={14} />
                        </button>
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
          {/* ── Filtros ── */}
          <div className="flex items-center gap-3 px-6 py-3 border-b border-slate-100 bg-slate-50/30 flex-wrap">
            <select
              value={filtroTipo}
              onChange={(e) => { setFiltroTipo(e.target.value); setPagina(1); }}
              className="text-xs font-medium border border-slate-400 rounded-md px-2.5 py-1.5 bg-white outline-none cursor-pointer shadow-sm"
            >
              <option value="">Todos los tipos</option>
              <option value="Entrada">Entrada</option>
              <option value="Salida">Salida</option>
              <option value="Ajuste">Ajuste</option>
            </select>
            <input
              type="date"
              value={filtroFechaDesde}
              onChange={(e) => { setFiltroFechaDesde(e.target.value); setPagina(1); }}
              className="text-xs border border-slate-400 rounded-md px-2.5 py-1.5 bg-white outline-none shadow-sm"
              title="Desde"
            />
            <span className="text-slate-300 text-xs">→</span>
            <input
              type="date"
              value={filtroFechaHasta}
              onChange={(e) => { setFiltroFechaHasta(e.target.value); setPagina(1); }}
              className="text-xs border border-slate-400 rounded-md px-2.5 py-1.5 bg-white outline-none shadow-sm"
              title="Hasta"
            />
            {(filtroTipo || filtroFechaDesde || filtroFechaHasta) && (
              <button
                onClick={() => {
                  setFiltroTipo('');
                  setFiltroFechaDesde('');
                  setFiltroFechaHasta('');
                  setPagina(1);
                }}
                className="text-xs text-red-500 font-medium hover:text-red-700 ml-auto"
              >
                Limpiar filtros
              </button>
            )}
          </div>

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
                      <td className="px-6 py-4">
                        {(() => {
                          const prod = productos.find(p => p.id === m.mon_pro_id_fk);
                          return prod ? (
                            <span title={prod.id}>{prod.nombre}</span>
                          ) : (m.mon_pro_id_fk || '-');
                        })()}
                      </td>
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

          {/* ── Paginación ── */}
          <div className="flex items-center justify-between px-6 py-4 bg-slate-50/30 border-t border-slate-100 text-xs text-slate-400 font-bold">
            <span>
              {monitorias.length > 0
                ? `${(pagina - 1) * POR_PAGINA + 1}–${Math.min(pagina * POR_PAGINA, totalMovimientos)} de ${totalMovimientos} movimientos`
                : `${totalMovimientos} movimientos`
              }
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPagina(p => Math.max(1, p - 1))}
                disabled={pagina <= 1}
                className="px-3 py-1.5 rounded-md border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all text-xs font-bold uppercase tracking-wider"
              >
                Anterior
              </button>
              <span className="text-slate-500">
                {pagina} / {Math.max(1, Math.ceil(totalMovimientos / POR_PAGINA))}
              </span>
              <button
                onClick={() => setPagina(p => p + 1)}
                disabled={pagina >= Math.ceil(totalMovimientos / POR_PAGINA)}
                className="px-3 py-1.5 rounded-md border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all text-xs font-bold uppercase tracking-wider"
              >
                Siguiente
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal: Nuevo ── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-6">
          <div ref={focusTrapRef} className="bg-white rounded-lg shadow-2xl border border-slate-100 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-8 py-6 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-800">
                {isEditing ? 'Editar' : 'Nuevo'} {tab === 'productos' ? 'Producto' : tab === 'lotes' ? 'Lote' : 'Movimiento'}
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
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">ID <span className="required-star">*</span></label>
                      <input name="id" value={formData.id || ''} disabled className="w-full p-3 bg-slate-100 border border-slate-200 rounded-md outline-none text-sm font-medium text-slate-400 mt-1" autoFocus />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Nombre <span className="required-star">*</span></label>
                      <input name="nombre" value={formData.nombre || ''} onChange={handleChange} className={`w-full p-3 bg-white border-2 rounded-md outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium mt-1 ${errors.nombre ? 'border-red-400' : 'border-slate-300'}`} />
                      {errors.nombre && <p className="text-red-500 text-xs mt-1">{errors.nombre}</p>}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Categoría</label>
                      <input name="categoria" value={formData.categoria || ''} onChange={handleChange} className="w-full p-3 bg-white border-2 border-slate-300 rounded-md outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium mt-1" />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Precio</label>
                      <input name="precio" type="number" step="0.01" value={formData.precio || ''} onChange={handleChange} className={`w-full p-3 bg-white border-2 rounded-md outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium mt-1 ${errors.precio ? 'border-red-400' : 'border-slate-300'}`} />
                      {errors.precio && <p className="text-red-500 text-xs mt-1">{errors.precio}</p>}
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Descripción</label>
                    <input name="descripcion" value={formData.descripcion || ''} onChange={handleChange} className="w-full p-3 bg-white border-2 border-slate-300 rounded-md outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium mt-1" />
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Stock</label>
                      <input name="cantidad_disponible" type="number" value={formData.cantidad_disponible || ''} onChange={handleChange} className="w-full p-3 bg-white border-2 border-slate-300 rounded-md outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium mt-1" />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Stock Mín.</label>
                      <input name="stock_minimo" type="number" value={formData.stock_minimo || ''} onChange={handleChange} className="w-full p-3 bg-white border-2 border-slate-300 rounded-md outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium mt-1" />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Estado</label>
                      <select name="estado" value={formData.estado || 'Activo'} onChange={handleChange} className="w-full p-3 bg-white border-2 border-slate-300 rounded-md outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium mt-1">
                        <option value="Activo">Activo</option>
                        <option value="Descontinuado">Descontinuado</option>
                        <option value="Suspendido">Suspendido</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Proveedor ID</label>
                    <select name="proveedor_id" value={formData.proveedor_id || ''} onChange={handleChange} className="w-full p-3 bg-white border-2 border-slate-300 rounded-md outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium mt-1">
                      <option value="">Seleccionar proveedor...</option>
                      {proveedores.map(p => (
                        <option key={p.prov_id} value={p.prov_id}>{p.prov_id} - {p.prov_nombre}</option>
                      ))}
                    </select>
                  </div>
                </>
              )}

              {/* ─── LOTE ─── */}
              {tab === 'lotes' && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">ID <span className="required-star">*</span></label>
                      <input name="lot_id" value={formData.lot_id || ''} disabled className="w-full p-3 bg-slate-100 border border-slate-200 rounded-md outline-none text-sm font-medium text-slate-400 mt-1" autoFocus />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">N° Lote <span className="required-star">*</span></label>
                      <input name="lot_numero" value={formData.lot_numero || ''} onChange={handleChange} className={`w-full p-3 bg-white border-2 rounded-md outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium mt-1 ${errors.lot_numero ? 'border-red-400' : 'border-slate-300'}`} />
                      {errors.lot_numero && <p className="text-red-500 text-xs mt-1">{errors.lot_numero}</p>}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Producto ID</label>
                      <select name="lot_pro_id_fk" value={formData.lot_pro_id_fk || ''} onChange={handleChange} className={`w-full p-3 bg-white border-2 rounded-md outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium mt-1 ${errors.lot_pro_id_fk ? 'border-red-400' : 'border-slate-300'}`}>
                        <option value="">Seleccionar producto...</option>
                        {productos.filter(p => p.estado === 'Activo').map(p => (
                          <option key={p.id} value={p.id}>{p.id} - {p.nombre}</option>
                        ))}
                      </select>
                      {errors.lot_pro_id_fk && <p className="text-red-500 text-xs mt-1">{errors.lot_pro_id_fk}</p>}
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Proveedor ID <span className="required-star">*</span></label>
                      <select name="lot_prov_id_fk" value={formData.lot_prov_id_fk || ''} onChange={handleChange} className={`w-full p-3 bg-white border-2 rounded-md outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium mt-1 ${errors.lot_prov_id_fk ? 'border-red-400' : 'border-slate-300'}`}>
                        <option value="">Seleccionar proveedor...</option>
                        {proveedores.map(p => (
                          <option key={p.prov_id} value={p.prov_id}>{p.prov_id} - {p.prov_nombre}</option>
                        ))}
                      </select>
                      {errors.lot_prov_id_fk && <p className="text-red-500 text-xs mt-1">{errors.lot_prov_id_fk}</p>}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Fecha Fabricación</label>
                      <input name="lot_fecha_fabricacion" type="date" value={formData.lot_fecha_fabricacion || ''} onChange={handleChange} className={`w-full p-3 bg-white border-2 rounded-md outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium mt-1 ${errors.lot_fecha_fabricacion ? 'border-red-400' : 'border-slate-300'}`} />
                      {errors.lot_fecha_fabricacion && <p className="text-red-500 text-xs mt-1">{errors.lot_fecha_fabricacion}</p>}
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Fecha Vencimiento <span className="required-star">*</span></label>
                      <input name="lot_fecha_vencimiento" type="date" value={formData.lot_fecha_vencimiento || ''} onChange={handleChange} className={`w-full p-3 bg-white border-2 rounded-md outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium mt-1 ${errors.lot_fecha_vencimiento ? 'border-red-400' : 'border-slate-300'}`} />
                      {errors.lot_fecha_vencimiento && <p className="text-red-500 text-xs mt-1">{errors.lot_fecha_vencimiento}</p>}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Cantidad Inicial</label>
                      <input name="lot_cantidad_inicial" type="number" min="1" value={formData.lot_cantidad_inicial || ''} onChange={handleChange} className={`w-full p-3 bg-white border-2 rounded-md outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium mt-1 ${errors.lot_cantidad_inicial ? 'border-red-400' : 'border-slate-300'}`} />
                      {errors.lot_cantidad_inicial && <p className="text-red-500 text-xs mt-1">{errors.lot_cantidad_inicial}</p>}
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Estado</label>
                      <select name="lot_estado" value={formData.lot_estado || 'Activo'} onChange={handleChange} className="w-full p-3 bg-white border-2 border-slate-300 rounded-md outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium mt-1">
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
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">ID <span className="required-star">*</span></label>
                      <input name="inm_id" value={formData.inm_id || ''} disabled className="w-full p-3 bg-slate-100 border border-slate-200 rounded-md outline-none text-sm font-medium text-slate-400 mt-1" />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Tipo <span className="required-star">*</span></label>
                      <select name="inm_tipo_movimiento" value={formData.inm_tipo_movimiento || ''} onChange={handleChange} className={`w-full p-3 bg-white border-2 rounded-md outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium mt-1 ${errors.inm_tipo_movimiento ? 'border-red-400' : 'border-slate-300'}`}>
                        <option value="">Seleccionar...</option>
                        <option value="Entrada">Entrada</option>
                        <option value="Salida">Salida</option>
                        <option value="Ajuste">Ajuste</option>
                      </select>
                      {errors.inm_tipo_movimiento && <p className="text-red-500 text-xs mt-1">{errors.inm_tipo_movimiento}</p>}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Producto <span className="required-star">*</span></label>
                      <select name="inm_pro_id_fk" value={formData.inm_pro_id_fk || ''} onChange={handleChange} className="w-full p-3 bg-white border-2 border-slate-300 rounded-md outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium mt-1">
                        <option value="">Seleccionar producto...</option>
                        {productos.filter(p => p.estado === 'Activo').map(p => (
                          <option key={p.id} value={p.id}>{p.id} - {p.nombre}</option>
                        ))}
                      </select>
                      {errors.inm_pro_id_fk && <p className="text-red-500 text-xs mt-1">{errors.inm_pro_id_fk}</p>}
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Lote</label>
                      <select name="inm_lot_id_fk" value={formData.inm_lot_id_fk || ''} onChange={handleChange} className="w-full p-3 bg-white border-2 border-slate-300 rounded-md outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium mt-1">
                        <option value="">Sin lote (opcional)</option>
                        {lotes
                          .filter(l => l.lot_pro_id_fk === formData.inm_pro_id_fk && l.lot_estado === 'Activo' && (l.lot_cantidad_actual || 0) > 0)
                          .map(l => (
                            <option key={l.lot_id} value={l.lot_id}>{l.lot_id} - {l.lot_numero || ''} (disp: {l.lot_cantidad_actual})</option>
                          ))
                        }
                      </select>
                      {errors.inm_lot_id_fk && <p className="text-red-500 text-xs mt-1">{errors.inm_lot_id_fk}</p>}
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Cantidad <span className="required-star">*</span></label>
                      <input name="inm_cantidad" type="number" min="1" value={formData.inm_cantidad || ''} onChange={handleChange} className={`w-full p-3 bg-white border-2 rounded-md outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium mt-1 ${errors.inm_cantidad ? 'border-red-400' : 'border-slate-300'}`} />
                      {errors.inm_cantidad && <p className="text-red-500 text-xs mt-1">{errors.inm_cantidad}</p>}
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Fecha <span className="required-star">*</span></label>
                      <input name="inm_fecha" type="date" value={formData.inm_fecha || ''} onChange={handleChange} className={`w-full p-3 bg-white border-2 rounded-md outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium mt-1 ${errors.inm_fecha ? 'border-red-400' : 'border-slate-300'}`} />
                      {errors.inm_fecha && <p className="text-red-500 text-xs mt-1">{errors.inm_fecha}</p>}
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Usuario</label>
                      <input value={user?.id || ''} disabled className="w-full p-3 bg-slate-100 border border-slate-200 rounded-md outline-none text-sm font-medium text-slate-400 mt-1" />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Motivo <span className="required-star">*</span></label>
                    <input name="inm_motivo" value={formData.inm_motivo || ''} onChange={handleChange} className={`w-full p-3 bg-white border-2 rounded-md outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium mt-1 ${errors.inm_motivo ? 'border-red-400' : 'border-slate-300'}`} />
                    {errors.inm_motivo && <p className="text-red-500 text-xs mt-1">{errors.inm_motivo}</p>}
                  </div>
                </>
              )}

              <button
                type="submit"
                disabled={formSubmitting || Object.keys(errors).length > 0}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-bold py-3.5 rounded-lg shadow-sm shadow-blue-100 transition-all active:scale-95 uppercase tracking-wider text-xs flex items-center justify-center gap-2"
              >
                {formSubmitting ? <Loader2 className="animate-spin" size={18} /> : null}
                {isEditing ? 'Actualizar' : 'Guardar'}
              </button>
              {Object.keys(errors).length > 0 && !formSubmitting && (
                <p className="text-red-500 text-xs text-center mt-2">Corrige los errores marcados antes de guardar</p>
              )}
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventario;




