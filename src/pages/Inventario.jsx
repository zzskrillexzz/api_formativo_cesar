import React, { useState, useEffect, useRef } from 'react';
import { Package, Layers, AlertTriangle, Search, Plus, X, RefreshCw, Edit, Loader2, Trash2, Eye } from 'lucide-react';
import { ThemeLoader } from '../components/ThemeLoader';
import { productosService } from '../api/services/productosService';
import { lotesService } from '../api/services/lotesService';
import { monitoriasService } from '../api/services/monitoriasService';
import { inventariosMovimientosService } from '../api/services/inventariosMovimientosService';
import { proveedoresService } from '../api/services/proveedoresService';
import { proveedoresProductosService } from '../api/services/proveedoresProductosService';
import { useAuth } from '../context/AuthContext';
import { useFocusTrap } from '../hooks/useFocusTrap';
import { ConfirmModal } from '../components/ConfirmModal';
import { useToast } from '../components/Toast';
import { FIELD_LIMITS } from '../utils/fieldLimits';

const Inventario = () => {
  const [tab, setTab] = useState('productos');
  const [productos, setProductos] = useState([]);
  const [lotes, setLotes] = useState([]);
  const [monitorias, setMonitorias] = useState([]);
  const [proveedores, setProveedores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // ── Modal para crear ──
  const [showModal, setShowModal] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [confirmAction, setConfirmAction] = useState(null);
  const { toast } = useToast();
  const { user } = useAuth();
  const [formData, setFormData] = useState({});
  const [editingId, setEditingId] = useState(null);
  const [viewingId, setViewingId] = useState(null);
  const [filtroEstado, setFiltroEstado] = useState('');
  const [filtroProducto, setFiltroProducto] = useState('');
  const [filtroTipo, setFiltroTipo] = useState('');
  const [filtroFechaDesde, setFiltroFechaDesde] = useState('');
  const [filtroFechaHasta, setFiltroFechaHasta] = useState('');
  const [filtroEstadoProducto, setFiltroEstadoProducto] = useState('');
  const [filtroCategoriaProducto, setFiltroCategoriaProducto] = useState('');
  const [showNewCategoryForm, setShowNewCategoryForm] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [prodsBySupplier, setProdsBySupplier] = useState([]);
  const [selectedSupplierId, setSelectedSupplierId] = useState('');
  const [showNewProductForm, setShowNewProductForm] = useState(false);
  const [productosProveedor, setProductosProveedor] = useState([]);
  const [searchProveedorProducto, setSearchProveedorProducto] = useState('');
  const [paginaProveedorProducto, setPaginaProveedorProducto] = useState(1);
  const [totalProveedorProductos, setTotalProveedorProductos] = useState(0);

  // ── Estado para el formulario de Lotes (proveedor → productos filtrados) ──
  const [loteSelectedProvId, setLoteSelectedProvId] = useState('');
  const [loteSearchProducto, setLoteSearchProducto] = useState('');

  const getProductStock = (prodId) => {
    return lotes
      .filter(l => l.lot_pro_id_fk === prodId && l.lot_estado === 'Activo')
      .reduce((sum, l) => sum + (l.lot_cantidad_actual || 0), 0);
  };
  const [pagina, setPagina] = useState(1);
  const [totalMovimientos, setTotalMovimientos] = useState(0);
  const [paginaProductos, setPaginaProductos] = useState(1);
  const [paginaLotes, setPaginaLotes] = useState(1);
  const POR_PAGINA = 10;
  const POR_PAGINA_MOV = 15;
  const POR_PAGINA_PROV = 8;
  const isEditing = !!editingId;
  const formSnapshotRef = useRef({});

  const handleAddCategory = () => {
    const name = newCategoryName.trim();
    if (!name) return;
    setFormData(prev => ({ ...prev, categoria: name }));
    setNewCategoryName('');
    setShowNewCategoryForm(false);
  };

  const loadProductsBySupplier = async (provId, q, page) => {
    if (!provId) { setProdsBySupplier([]); return; }
    try {
      const data = await proveedoresProductosService.buscarPorProveedorConDatos(provId, { q: q || undefined, page, limit: POR_PAGINA_PROV });
      setProdsBySupplier(Array.isArray(data?.data) ? data.data : []);
      setTotalProveedorProductos(data?.total || 0);
    } catch (err) {
      console.error('Error cargando productos del proveedor:', err?.response?.data || err);
      setProdsBySupplier([]);
      setTotalProveedorProductos(0);
    }
  };

  useEffect(() => {
    if (!selectedSupplierId) return;
    const timer = setTimeout(() => {
      loadProductsBySupplier(selectedSupplierId, searchProveedorProducto, paginaProveedorProducto);
    }, 300);
    return () => clearTimeout(timer);
  }, [selectedSupplierId, searchProveedorProducto, paginaProveedorProducto]);

  const openModal = () => {
    let defaultData = {};
    if (tab === 'productos') {
      const nums = productos.map(p => { const m = (p.id || '').match(/PRO(\d+)/); return m ? parseInt(m[1]) : 0; });
      const next = 'PRO' + String((nums.length > 0 ? Math.max(...nums) : 0) + 1).padStart(3, '0');
      defaultData = { id: next, estado: 'Activo' };
      setSelectedSupplierId('');
      setProdsBySupplier([]);
      setShowNewProductForm(false);
    } else if (tab === 'lotes') {
      const nums = lotes
        .map(l => { const m = (l.lot_id || '').match(/LOT(\d+)/); return m ? parseInt(m[1]) : 0; })
        .filter(n => n > 0)
        .sort((a, b) => a - b);
      let nextNum = 1;
      for (const n of nums) {
        if (n === nextNum) nextNum++;
        else if (n > nextNum) break;
      }
      const next = 'LOT' + String(nextNum).padStart(3, '0');
      defaultData = { lot_id: next, lot_numero: '' };
      setLoteSelectedProvId('');
      setLoteSearchProducto('');
    } else if (tab === 'movimientos') {
      let max = 0;
      monitorias.forEach(m => {
        const match = (m.mon_inm_id_fk || '').match(/INM(\d+)/);
        if (match) max = Math.max(max, parseInt(match[1]));
      });
      defaultData = { inm_id: 'INM' + String(max + 1).padStart(3, '0') };
    }
    setFormData(defaultData);
    formSnapshotRef.current = JSON.parse(JSON.stringify(defaultData));
    setFormError('');
    setErrors({});
    setEditingId(null);
    setViewingId(null);
    setShowModal(true);
  };

  const abrirEditarProducto = (prod) => {
    try {
      if (!prod) return;
      const editData = {
        id: prod.id, nombre: prod.nombre || '', categoria: prod.categoria || '',
        descripcion: prod.descripcion || '', precio: prod.precio || '',
        estado: prod.estado || 'Activo'
      };
      setFormData(editData);
      formSnapshotRef.current = JSON.parse(JSON.stringify(editData));
      setFormError('');
      setErrors({});
      setEditingId(prod.id);
      setSelectedSupplierId('');
      setProdsBySupplier([]);
      setShowNewProductForm(false);
      setShowModal(true);
    } catch (e) { console.error('Error al editar:', e); }
  };

  const eliminarProducto = async (id) => {
    setConfirmAction({
      type: 'delete',
      danger: true,
      title: 'Eliminar Producto',
      message: '¿Eliminar este producto? Se borrarán todos sus lotes, movimientos y registros asociados.',
      onConfirm: async () => {
        setConfirmAction(null);
        try {
          await productosService.eliminar(id, { params: { force: true } });
          toast({ type: 'success', title: 'Eliminado', description: 'Producto eliminado correctamente' });
          fetchData();
        } catch(e) {
          toast({ type: 'error', title: 'Error', description: e.response?.data?.mensaje || e.message });
        }
      },
      onCancel: () => setConfirmAction(null),
    });
  };
  const eliminarLote = async (id) => {
    setConfirmAction({
      type: 'delete',
      danger: true,
      title: 'Eliminar Lote',
      message: '¿Eliminar este lote? Se borrarán movimientos, monitoría y registros asociados.',
      onConfirm: async () => {
        setConfirmAction(null);
        try {
          await lotesService.eliminar(id, { params: { force: true } });
          toast({ type: 'success', title: 'Eliminado', description: 'Lote eliminado correctamente' });
          fetchData();
        } catch(e) {
          toast({ type: 'error', title: 'Error', description: e.response?.data?.mensaje || e.message });
        }
      },
      onCancel: () => setConfirmAction(null),
    });
  };

  const cambiarEstadoLote = async (id, nuevoEstado) => {
    setConfirmAction({
      type: 'status',
      danger: false,
      title: 'Cambiar Estado',
      message: `¿Cambiar estado del lote ${id} a "${nuevoEstado}"?`,
      onConfirm: async () => {
        setConfirmAction(null);
        try {
          await lotesService.editar(id, { lot_estado: nuevoEstado });
          toast({ type: 'success', title: 'Estado actualizado', description: `Lote ${id} → ${nuevoEstado}` });
          fetchData();
        } catch(e) {
          toast({ type: 'error', title: 'Error', description: e.response?.data?.mensaje || e.message });
        }
      },
      onCancel: () => setConfirmAction(null),
    });
  };

  const abrirEditarLote = (lote) => {
    const editData = {
      lot_id: lote.lot_id, lot_numero: lote.lot_numero || '',
      lot_fecha_fabricacion: lote.lot_fecha_fabricacion || '',
      lot_fecha_vencimiento: lote.lot_fecha_vencimiento || '',
      lot_cantidad_inicial: lote.lot_cantidad_inicial || '',
      lot_pro_id_fk: lote.lot_pro_id_fk || '', lot_prov_id_fk: lote.lot_prov_id_fk || '',
      lot_estado: lote.lot_estado || 'Activo'
    };
    setFormData(editData);
    formSnapshotRef.current = JSON.parse(JSON.stringify(editData));
    setFormError('');
    setErrors({});
    setEditingId(lote.lot_id);
    setLoteSelectedProvId(lote.lot_prov_id_fk || '');
    setLoteSearchProducto('');
    setShowModal(true);
  };

  const verDetalleLote = (lote) => {
    const viewData = {
      lot_id: lote.lot_id,
      lot_numero: lote.lot_numero || '',
      lot_fecha_fabricacion: lote.lot_fecha_fabricacion || '',
      lot_fecha_vencimiento: lote.lot_fecha_vencimiento || '',
      lot_cantidad_inicial: lote.lot_cantidad_inicial || 0,
      lot_cantidad_actual: lote.lot_cantidad_actual || 0,
      lot_pro_id_fk: lote.lot_pro_id_fk || '',
      lot_prov_id_fk: lote.lot_prov_id_fk || '',
      lot_estado: lote.lot_estado || 'Activo'
    };
    setFormData(viewData);
    setViewingId(lote.lot_id);
    setLoteSelectedProvId(lote.lot_prov_id_fk || '');
    setShowModal(true);
  };

  const stripEmojis = (text) => text.replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{FE00}-\u{FE0F}\u{200D}]/gu, '');

  const handleChange = (e) => {
    let { name, value } = e.target;
    value = stripEmojis(value);

    // ── El campo de búsqueda de productos no va a formData ──
    if (name === 'loteSearchProducto') {
      setLoteSearchProducto(value);
      return;
    }

    const max = FIELD_LIMITS[name];
    if (max && value.length > max) return;
    setFormData({ ...formData, [name]: value });

    // ── Al seleccionar proveedor en lote, filtrar productos y limpiar selección ──
    if (!editingId && tab === 'lotes' && name === 'lot_prov_id_fk') {
      setLoteSelectedProvId(value);
      setLoteSearchProducto('');
      if (value !== formData.lot_prov_id_fk) {
        setFormData(prev => ({ ...prev, lot_pro_id_fk: '', lot_numero: '' }));
      }
    }

    // ── Auto-generar lot_numero al seleccionar producto (solo nuevos lotes) ──
    if (!editingId && tab === 'lotes' && name === 'lot_pro_id_fk' && value) {
      const prod = productos.find(p => p.id === value);
      if (prod) {
        const abrev = prod.nombre.slice(0, 3).toUpperCase();
        const anio = new Date().getFullYear();
        const prefijo = `LT-${abrev}-${anio}-`;
        let maxSeq = 0;
        lotes.forEach(l => {
          if (l.lot_numero && l.lot_numero.startsWith(prefijo)) {
            const m = l.lot_numero.match(/-(\d+)$/);
            if (m) maxSeq = Math.max(maxSeq, parseInt(m[1], 10));
          }
        });
        const nextSeq = String(maxSeq + 1).padStart(3, '0');
        setFormData(prev => ({ ...prev, lot_numero: `${prefijo}${nextSeq}` }));
      }
    }

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
      if (name === 'categoria' && !value) newErrors.categoria = 'Selecciona una categoría';
      else if (name === 'categoria') delete newErrors.categoria;
      if (name === 'precio' && value && parseFloat(value) < 100) newErrors.precio = 'Mínimo $100 COP';
      else if (name === 'precio' && value && parseFloat(value) > 999999.99) newErrors.precio = 'Máximo $999,999.99';
      else if (name === 'precio' && value) delete newErrors.precio;
    }

    if (tabActual === 'lotes') {
      if (name === 'lot_id') {
        if (!value) newErrors.lot_id = 'El ID es obligatorio';
        else if (!editingId && lotes.some(l => l.lot_id === value)) newErrors.lot_id = 'El ID ya existe';
        else delete newErrors.lot_id;
      }
      if (name === 'lot_numero' && !value) newErrors.lot_numero = 'El número de lote es obligatorio';
      else if (name === 'lot_numero' && value && !editingId && lotes.some(l => l.lot_numero === value)) newErrors.lot_numero = 'Este número de lote ya existe';
      else if (name === 'lot_numero') delete newErrors.lot_numero;
      const VIDA_UTIL_MINIMA = 14; // días mínimos entre fabricación y vencimiento
      if (name === 'lot_fecha_vencimiento' && !value) newErrors.lot_fecha_vencimiento = 'La fecha de vencimiento es obligatoria';
      else if (name === 'lot_fecha_vencimiento') delete newErrors.lot_fecha_vencimiento;
      if (name === 'lot_fecha_fabricacion' && value && formData.lot_fecha_vencimiento) {
        const diff = (new Date(formData.lot_fecha_vencimiento) - new Date(value)) / (1000 * 60 * 60 * 24);
        if (value >= formData.lot_fecha_vencimiento) {
          newErrors.lot_fecha_fabricacion = 'Debe ser anterior a la fecha de vencimiento';
        } else if (diff < VIDA_UTIL_MINIMA) {
          newErrors.lot_fecha_fabricacion = `La diferencia mínima debe ser de ${VIDA_UTIL_MINIMA} días (jarabe)`;
        } else {
          delete newErrors.lot_fecha_fabricacion;
        }
      } else if (name === 'lot_fecha_fabricacion') delete newErrors.lot_fecha_fabricacion;
      if (name === 'lot_fecha_vencimiento' && value && formData.lot_fecha_fabricacion) {
        const diff = (new Date(value) - new Date(formData.lot_fecha_fabricacion)) / (1000 * 60 * 60 * 24);
        if (formData.lot_fecha_fabricacion >= value) {
          newErrors.lot_fecha_vencimiento = 'Debe ser posterior a la fecha de fabricación';
        } else if (diff < VIDA_UTIL_MINIMA) {
          newErrors.lot_fecha_vencimiento = `Debe ser al menos ${VIDA_UTIL_MINIMA} días después de la fabricación`;
        } else {
          delete newErrors.lot_fecha_vencimiento;
        }
      } else if (name === 'lot_fecha_vencimiento' && value) {
        const soloVen = !newErrors.lot_fecha_vencimiento || 
          newErrors.lot_fecha_vencimiento === 'Debe ser posterior a la fecha de fabricación' ||
          newErrors.lot_fecha_vencimiento.startsWith('Debe ser al menos');
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
    if (JSON.stringify(formData) === JSON.stringify(formSnapshotRef.current)) {
      if (isEditing) {
        toast({ type: 'warning', title: 'Sin cambios', description: 'No se identificaron modificaciones en el producto' });
        return;
      }
      setFormError('Completa los campos del producto antes de guardar');
      return;
    }
    if (!formData.id || !formData.nombre || !formData.categoria) {
      setFormError('ID, Nombre y Categoría son obligatorios');
      return;
    }
    const precio = parseFloat(formData.precio);
    if (isNaN(precio) || precio <= 0) {
      setFormError('El precio debe ser un número mayor a 0');
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
        estado: formData.estado || 'Activo'
      };
      if (isEditing) {
        await productosService.editar(payload.id, payload);
        toast({ type: 'success', title: 'Actualizado', description: 'Producto actualizado correctamente' });
      } else {
        const provId = isEditing ? null : (selectedSupplierId || formData.proveedor_id || null);
        await productosService.registrar({ ...payload, proveedor_id: provId });
        if (provId) {
          await loadProductsBySupplier(provId);
        }
        toast({ type: 'success', title: 'Creado', description: 'Producto registrado correctamente' });
      }
      setShowNewProductForm(false);
      setShowModal(false);
      setViewingId(null);
      fetchData();
    } catch (err) {
      toast({ type: 'error', title: 'Error', description: err.response?.data?.mensaje || 'Error al guardar producto' });
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleSubmitLote = async (e) => {
    e.preventDefault();
    setFormError('');
    setErrors({});
    if (JSON.stringify(formData) === JSON.stringify(formSnapshotRef.current)) {
      if (isEditing) {
        toast({ type: 'warning', title: 'Sin cambios', description: 'No se identificaron modificaciones en el lote' });
        return;
      }
      setFormError('Completa los campos del lote antes de guardar');
      return;
    }
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
    // Validar que el producto pertenezca al proveedor seleccionado
    if (formData.lot_pro_id_fk && formData.lot_prov_id_fk) {
      const tieneRelacion = productosProveedor.some(
        pp => pp.proveedor_id === formData.lot_prov_id_fk && pp.producto_id === formData.lot_pro_id_fk
      );
      if (!tieneRelacion) {
        setFormError(`El producto ${formData.lot_pro_id_fk} no está asociado al proveedor ${formData.lot_prov_id_fk}`);
        return;
      }
    }
    if (formData.lot_fecha_fabricacion && formData.lot_fecha_vencimiento) {
      const diff = (new Date(formData.lot_fecha_vencimiento) - new Date(formData.lot_fecha_fabricacion)) / (1000 * 60 * 60 * 24);
      if (formData.lot_fecha_fabricacion >= formData.lot_fecha_vencimiento) {
        setFormError('La fecha de fabricación debe ser anterior a la fecha de vencimiento');
        return;
      }
      if (diff < 14) {
        setFormError('La fecha de vencimiento debe ser al menos 14 días después de la fabricación');
        return;
      }
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
        toast({ type: 'success', title: 'Actualizado', description: 'Lote actualizado correctamente' });
      } else {
        await lotesService.registrar(payload);
        toast({ type: 'success', title: 'Creado', description: 'Lote registrado correctamente' });
      }
      setShowModal(false);
      setViewingId(null);
      fetchData();
    } catch (err) {
      toast({ type: 'error', title: 'Error', description: err.response?.data?.mensaje || 'Error al guardar lote' });
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleSubmitMovimiento = async (e) => {
    e.preventDefault();
    setFormError('');
    setErrors({});
    if (JSON.stringify(formData) === JSON.stringify(formSnapshotRef.current)) {
      setFormError('Completa los campos del movimiento antes de guardar');
      return;
    }
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
      toast({ type: 'success', title: 'Creado', description: 'Movimiento registrado correctamente' });
      fetchData();
    } catch (err) {
      toast({ type: 'error', title: 'Error', description: err.response?.data?.mensaje || 'Error al crear movimiento' });
    } finally {
      setFormSubmitting(false);
    }
  };

  const fetchData = async (movParams = {}) => {
    setLoading(true);
    setRefreshing(true);
    try {
      const [prods, lots, monsRes, provs, provProds] = await Promise.all([
        productosService.listar().catch(() => []),
        lotesService.listar().catch(() => []),
        monitoriasService.listar(movParams).catch(() => ({ data: [], total: 0 })),
        proveedoresService.listar().catch(() => []),
        proveedoresProductosService.listar().catch(() => [])
      ]);
      setProductos(prods);
      setLotes(lots);
      setProveedores(provs);
      setProductosProveedor(provProds);
      setMonitorias(monsRes.data || []);
      setTotalMovimientos(monsRes.total ?? 0);
    } catch (err) {
      console.error('Error cargando inventario:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  // Refetch movimientos cuando cambian filtros/página
  useEffect(() => {
    if (tab !== 'movimientos') return;
    const params = {
      page: pagina,
      limit: POR_PAGINA_MOV
    };
    if (filtroProducto) params.mon_pro_id_fk = filtroProducto;
    if (filtroTipo) params.tipo = filtroTipo;
    if (filtroFechaDesde) params.fecha_desde = filtroFechaDesde;
    if (filtroFechaHasta) params.fecha_hasta = filtroFechaHasta;
    if (searchTerm) params.q = searchTerm;
    fetchData(params);
  }, [tab, pagina, filtroProducto, filtroTipo, filtroFechaDesde, filtroFechaHasta, searchTerm]);

  // Resetear paginación cuando cambian filtros de productos o lotes
  useEffect(() => { setPaginaProductos(1); }, [searchTerm, filtroEstadoProducto, filtroCategoriaProducto]);
  useEffect(() => { setPaginaLotes(1); }, [searchTerm, filtroEstado, filtroProducto]);

  const tabs = [
    { id: 'productos', label: 'Productos', icon: Package },
    { id: 'lotes', label: 'Lotes', icon: Layers },
    { id: 'movimientos', label: 'Movimientos', icon: AlertTriangle },
  ];

  const filteredProductos = productos.filter(p => {
    const busca = [p.id, p.nombre, p.categoria, p.descripcion, p.estado
    ].filter(Boolean).join(' ').toLowerCase().includes(searchTerm.toLowerCase());
    const porEstado = !filtroEstadoProducto || p.estado === filtroEstadoProducto;
    const porCategoria = !filtroCategoriaProducto || p.categoria === filtroCategoriaProducto;
    return busca && porEstado && porCategoria;
  });

  const getDiasRestantes = (fechaVen) => {
    if (!fechaVen) return null;
    const hoy = new Date(); hoy.setHours(0,0,0,0);
    const ven = new Date(fechaVen.split('T')[0]);
    return Math.ceil((ven - hoy) / (1000 * 60 * 60 * 24));
  };

  const paginatedProductos = filteredProductos.slice(
    (paginaProductos - 1) * POR_PAGINA,
    paginaProductos * POR_PAGINA
  );

  const filteredLotes = lotes.filter(l => {
    const busca = [l.lot_id, l.lot_numero, l.lot_fecha_fabricacion, l.lot_fecha_vencimiento,
      l.lot_cantidad_inicial, l.lot_cantidad_actual, l.lot_pro_id_fk, l.lot_prov_id_fk, l.lot_estado
    ].filter(Boolean).join(' ').toLowerCase().includes(searchTerm.toLowerCase());
    const porEstado = !filtroEstado
      ? true
      : filtroEstado === '__proximos__'
        ? (l.lot_estado === 'Activo' && getDiasRestantes(l.lot_fecha_vencimiento) !== null && getDiasRestantes(l.lot_fecha_vencimiento) >= 0 && getDiasRestantes(l.lot_fecha_vencimiento) <= 30)
        : l.lot_estado === filtroEstado;
    const porProducto = !filtroProducto || l.lot_pro_id_fk === filtroProducto;
    return busca && porEstado && porProducto;
  });

  const paginatedLotes = filteredLotes.slice(
    (paginaLotes - 1) * POR_PAGINA,
    paginaLotes * POR_PAGINA
  );

  const focusTrapRef = useFocusTrap(showModal);

  const getEstadoBadge = (estado) => {
    const map = {
      'Activo': { cls: 'text-emerald-600 bg-emerald-50', dot: 'bg-emerald-500' },
      'Agotado': { cls: 'text-red-600 bg-red-50', dot: 'bg-red-500' },
      'Vencido': { cls: 'text-orange-600 bg-orange-50', dot: 'bg-orange-500' },
      'Cuarentena': { cls: 'text-yellow-600 bg-yellow-50', dot: 'bg-yellow-500' },
      'Descontinuado': { cls: 'text-slate-500 bg-slate-100', dot: 'bg-slate-400' },
      'Suspendido': { cls: 'text-red-500 bg-red-50', dot: 'bg-red-400' },
    };
    return map[estado] || { cls: 'text-slate-500 bg-slate-100', dot: 'bg-slate-400' };
  };

  const getStockBarColor = (disp, min) => {
    const dispVal = disp || 0;
    const minVal = Math.max(min || 10, 10); // piso visual de 10 unidades
    const ratio = dispVal / minVal;
    if (ratio >= 2) return 'bg-emerald-400';
    if (ratio >= 1.5) return 'bg-blue-400';
    if (ratio >= 1) return 'bg-amber-400';
    return 'bg-red-400';
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
            maxLength={100}
          />
        </div>
        <div className="flex gap-2">
          <button onClick={() => {
            if (tab === 'movimientos') {
              const params = { page: pagina, limit: POR_PAGINA_MOV };
              if (filtroProducto) params.mon_pro_id_fk = filtroProducto;
              if (filtroTipo) params.tipo = filtroTipo;
              if (filtroFechaDesde) params.fecha_desde = filtroFechaDesde;
              if (filtroFechaHasta) params.fecha_hasta = filtroFechaHasta;
              if (searchTerm) params.q = searchTerm;
              fetchData(params);
            } else {
              fetchData();
            }
          }} disabled={refreshing} className="p-3 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-all shadow-sm disabled:opacity-70" title="Actualizar datos">
            <RefreshCw size={18} className={`text-slate-500 transition-transform ${refreshing ? 'animate-spin' : ''}`} />
          </button>
          {tab !== 'movimientos' && (
            <button
              onClick={openModal}
              className="flex items-center gap-2 bg-blue-600 text-white px-5 py-3 rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-blue-700 transition-all shadow-md btn-pulse"
            >
              <Plus size={16} /> Nuevo {tab === 'productos' ? 'Producto' : 'Lote'}
            </button>
          )}
        </div>
      </div>

      {/* TAB: Productos */}
      {tab === 'productos' && (
        <div className="animate-in fade-in duration-300 bg-white rounded-lg shadow-sm border border-slate-200 border-l-4 border-l-orange-400 overflow-hidden">
          {/* ── Filtros de productos ── */}
          <div className="flex items-center gap-2 px-6 py-3 border-b border-slate-100 bg-slate-50/30 flex-wrap">
            <select
              value={filtroCategoriaProducto}
              onChange={(e) => setFiltroCategoriaProducto(e.target.value)}
              className="text-xs border border-slate-300 rounded-md px-2.5 py-1.5 bg-white outline-none shadow-sm font-medium text-slate-600"
            >
              <option value="">Todas las categorías</option>
              {[...new Set(productos.map(p => p.categoria).filter(Boolean))].sort().map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            {(filtroEstadoProducto || filtroCategoriaProducto) && (
              <button
                onClick={() => { setFiltroEstadoProducto(''); setFiltroCategoriaProducto(''); }}
                className="text-[10px] font-bold uppercase tracking-wider text-slate-400 hover:text-red-500 transition-colors px-2"
              >
                ✕ Limpiar filtros
              </button>
            )}
          </div>
          {/* ── Tarjetas resumen ── */}
          {(() => {
            const activos = productos.filter(p => p.estado === 'Activo').length;
            const descontinuados = productos.filter(p => p.estado === 'Descontinuado').length;
            const suspendidos = productos.filter(p => p.estado === 'Suspendido').length;
            const cards = [
              { label: 'Todos', count: productos.length, icon: '📋', color: 'border-blue-200 bg-blue-50/50', text: 'text-blue-700', filtro: '' },
              { label: 'Activos', count: activos, icon: '✅', color: 'border-emerald-200 bg-emerald-50/50', text: 'text-emerald-700', filtro: 'Activo' },
              { label: 'Descontinuados', count: descontinuados, icon: '⛔', color: 'border-slate-200 bg-slate-50/50', text: 'text-slate-600', filtro: 'Descontinuado' },
              { label: 'Suspendidos', count: suspendidos, icon: '🚫', color: 'border-red-200 bg-red-50/50', text: 'text-red-700', filtro: 'Suspendido' },
            ];
            return (
              <div className="grid grid-cols-4 gap-2 px-6 pt-4 pb-2">
                {cards.map((c, idx) => (
                  <button
                    key={idx}
                    onClick={() => setFiltroEstadoProducto(c.filtro)}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border ${c.color} transition-all hover:shadow-md ${filtroEstadoProducto === c.filtro ? 'ring-2 ring-blue-400 scale-[1.03]' : ''}`}
                  >
                    <span className="text-lg">{c.icon}</span>
                    <div className="text-left">
                      <div className={`text-base font-black ${c.text}`}>{c.count}</div>
                      <div className="text-[9px] font-bold uppercase tracking-wider text-slate-500">{c.label}</div>
                    </div>
                  </button>
                ))}
              </div>
            );
          })()}
          <div className="overflow-x-auto">
            <table className="w-full text-left table-animate">
              <thead className="bg-slate-50/50 text-slate-400 text-xs uppercase font-bold tracking-wider border-b border-slate-100">
                <tr>
                  <th className="px-6 py-4">ID</th>
                  <th className="px-6 py-4">Nombre</th>
                  <th className="px-6 py-4">Categoría</th>
                  <th className="px-6 py-4 text-right">Precio</th>
                  <th className="px-6 py-4 text-right">Stock</th>
                  <th className="px-6 py-4">Proveedores</th>
                  <th className="px-6 py-4">Estado</th>
                  <th className="px-6 py-4 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-sm font-bold text-slate-600">
                {filteredProductos.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="px-6 py-16 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <Package size={40} strokeWidth={1.2} className="text-slate-300" />
                        <p className="text-sm font-medium text-slate-400">
                          {searchTerm ? 'Sin resultados para esta búsqueda' : 'No hay productos registrados'}
                        </p>
                        {!searchTerm && (
                          <button onClick={openModal} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-blue-700 transition-all shadow-sm">
                            <Plus size={14} /> Crear primer producto
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedProductos.map((p, i) => (
                    <tr key={i} className="hover:bg-orange-100/70">
                      <td className="px-6 py-4 text-slate-400 text-xs">{p.id}</td>
                      <td className="px-6 py-4">{p.nombre}</td>
                      <td className="px-6 py-4 text-slate-400">{p.categoria || '-'}</td>
                      <td className="px-6 py-4 text-right">${parseFloat(p.precio || 0).toLocaleString()}</td>
                      <td className="px-6 py-4 text-right">
                        {(() => {
                          const stock = getProductStock(p.id);
                          return (
                            <div className="flex items-center gap-2 justify-end">
                              <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                <div className={`h-full rounded-full ${stock > 0 ? 'bg-emerald-400' : 'bg-red-400'}`}
                                  style={{ width: `${Math.min(stock / 200 * 100, 100)}%` }} />
                              </div>
                              <span className={`font-bold text-xs ${stock <= 0 ? 'text-red-600' : 'text-slate-800'}`}>
                                {stock}
                              </span>
                            </div>
                          );
                        })()}
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-400">
                        {(() => {
                          if (!productosProveedor || productosProveedor.length === 0) return <span className="text-slate-300">—</span>;
                          const rels = productosProveedor.filter(pp => pp.producto_id === p.id);
                          if (rels.length === 0) return <span className="text-slate-300">—</span>;
                          const provNames = rels.map(r => {
                            const prov = proveedores.find(pr => pr.prov_id === r.proveedor_id);
                            return prov ? prov.prov_nombre : r.proveedor_id;
                          });
                          return provNames.join(', ');
                        })()}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase ${getEstadoBadge(p.estado).cls}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${getEstadoBadge(p.estado).dot}`} />
                          {p.estado}
                        </span>
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
          <div className="flex items-center justify-between px-6 py-4 bg-slate-50/30 border-t border-slate-100 text-xs text-slate-400 font-bold">
            <span>{filteredProductos.length > 0
              ? `${(paginaProductos - 1) * POR_PAGINA + 1}–${Math.min(paginaProductos * POR_PAGINA, filteredProductos.length)} de ${filteredProductos.length}`
              : `${filteredProductos.length} productos`
            }</span>
            <div className="flex items-center gap-2">
              <button onClick={() => setPaginaProductos(p => Math.max(1, p - 1))} disabled={paginaProductos <= 1}
                className="px-3 py-1.5 rounded-md border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all text-xs font-bold uppercase tracking-wider">Anterior</button>
              <span className="text-slate-500">{paginaProductos} / {Math.max(1, Math.ceil(filteredProductos.length / POR_PAGINA))}</span>
              <button onClick={() => setPaginaProductos(p => p + 1)} disabled={paginaProductos >= Math.ceil(filteredProductos.length / POR_PAGINA)}
                className="px-3 py-1.5 rounded-md border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all text-xs font-bold uppercase tracking-wider">Siguiente</button>
            </div>
          </div>
        </div>
      )}

      {/* TAB: Lotes */}
      {tab === 'lotes' && (
        <div className="animate-in fade-in duration-300 bg-white rounded-lg shadow-sm border border-slate-200 border-l-4 border-l-orange-400 overflow-hidden">
          {/* ── Filtros de lotes ── */}
          <div className="flex items-center gap-2 px-6 py-3 border-b border-slate-100 bg-slate-50/30 flex-wrap">
            <select
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value)}
              className="text-xs border border-slate-300 rounded-md px-2.5 py-1.5 bg-white outline-none shadow-sm font-medium text-slate-600"
            >
              <option value="">Todos los estados</option>
              <option value="Activo">Activo</option>
              <option value="Agotado">Agotado</option>
              <option value="Vencido">Vencido</option>
              <option value="Cuarentena">Cuarentena</option>
              <option value="__proximos__">⚠ Próximos a vencer</option>
            </select>
            <select
              value={filtroProducto}
              onChange={(e) => setFiltroProducto(e.target.value)}
              className="text-xs border border-slate-300 rounded-md px-2.5 py-1.5 bg-white outline-none shadow-sm font-medium text-slate-600"
            >
              <option value="">Todos los productos</option>
              {productos.map(p => (
                <option key={p.id} value={p.id}>{p.nombre}</option>
              ))}
            </select>
            {(filtroEstado || filtroProducto) && (
              <button
                onClick={() => { setFiltroEstado(''); setFiltroProducto(''); }}
                className="text-[10px] font-bold uppercase tracking-wider text-slate-400 hover:text-red-500 transition-colors px-2"
              >
                ✕ Limpiar filtros
              </button>
            )}
          </div>
          {/* ── Tarjetas resumen ── */}
          {(() => {
            const activos = lotes.filter(l => l.lot_estado === 'Activo').length;
            const agotados = lotes.filter(l => l.lot_estado === 'Agotado').length;
            const vencidos = lotes.filter(l => l.lot_estado === 'Vencido').length;
            const cuarentena = lotes.filter(l => l.lot_estado === 'Cuarentena').length;
            const proximos = lotes.filter(l =>
              l.lot_estado === 'Activo' &&
              getDiasRestantes(l.lot_fecha_vencimiento) !== null &&
              getDiasRestantes(l.lot_fecha_vencimiento) >= 0 &&
              getDiasRestantes(l.lot_fecha_vencimiento) <= 30
            ).length;
            const cards = [
              { label: 'Todos', count: lotes.length, icon: '📋', color: 'border-blue-200 bg-blue-50/50', text: 'text-blue-700', filtro: '' },
              { label: 'Activos', count: activos, icon: '✅', color: 'border-emerald-200 bg-emerald-50/50', text: 'text-emerald-700', filtro: 'Activo' },
              { label: 'Agotados', count: agotados, icon: '⛔', color: 'border-slate-200 bg-slate-50/50', text: 'text-slate-600', filtro: 'Agotado' },
              { label: 'Vencidos', count: vencidos, icon: '🚫', color: 'border-red-200 bg-red-50/50', text: 'text-red-700', filtro: 'Vencido' },
              { label: 'Cuarentena', count: cuarentena, icon: '⚠️', color: 'border-orange-200 bg-orange-50/50', text: 'text-orange-700', filtro: 'Cuarentena' },
              { label: 'Próx. vencer', count: proximos, icon: '⏳', color: 'border-amber-200 bg-amber-50/50', text: 'text-amber-700', filtro: '__proximos__' },
            ];
            return (
              <div className="grid grid-cols-6 gap-2 px-6 pt-4 pb-2">
                {cards.map((c, idx) => (
                  <button
                    key={idx}
                    onClick={() => setFiltroEstado(c.filtro)}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border ${c.color} transition-all hover:shadow-md ${filtroEstado === c.filtro ? 'ring-2 ring-blue-400 scale-[1.03]' : ''}`}
                  >
                    <span className="text-lg">{c.icon}</span>
                    <div className="text-left">
                      <div className={`text-base font-black ${c.text}`}>{c.count}</div>
                      <div className="text-[9px] font-bold uppercase tracking-wider text-slate-500">{c.label}</div>
                    </div>
                  </button>
                ))}
              </div>
            );
          })()}
          <div className="overflow-x-auto">
            <table className="w-full text-left table-animate">
              <thead className="bg-slate-50/50 text-slate-400 text-xs uppercase font-bold tracking-wider border-b border-slate-100">
                <tr>
                  <th className="px-6 py-4">ID</th>
                  <th className="px-6 py-4">N° Lote</th>
                  <th className="px-6 py-4">Producto</th>
                  <th className="px-6 py-4">Consumo</th>
                  <th className="px-6 py-4 text-right">Vencimiento</th>
                  <th className="px-6 py-4">Estado</th>
                  <th className="px-6 py-4 text-right w-20">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-sm font-bold text-slate-600">
                {filteredLotes.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="px-6 py-16 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <Layers size={40} strokeWidth={1.2} className="text-slate-300" />
                        <p className="text-sm font-medium text-slate-400">
                          {searchTerm ? 'Sin resultados para esta búsqueda' : 'No hay lotes registrados'}
                        </p>
                        {!searchTerm && (
                          <button onClick={openModal} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-blue-700 transition-all shadow-sm">
                            <Plus size={14} /> Crear primer lote
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedLotes.map((l, i) => {
                    const consumido = l.lot_cantidad_inicial - (l.lot_cantidad_actual || 0);
                    const pctConsumo = l.lot_cantidad_inicial > 0 ? Math.round((consumido / l.lot_cantidad_inicial) * 100) : 0;
                    const barColor = pctConsumo >= 90 ? 'bg-red-400' : pctConsumo >= 50 ? 'bg-amber-400' : 'bg-emerald-400';
                    return (
                    <tr key={i} className="hover:bg-orange-100/70">
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
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1 min-w-[120px]">
                          <div className="flex items-center justify-between text-[11px] font-medium">
                            <span className="text-slate-400">{l.lot_cantidad_inicial}</span>
                            <span className="text-slate-600">{l.lot_cantidad_actual || 0}</span>
                          </div>
                          <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full ${barColor}`} style={{ width: `${Math.min(pctConsumo, 100)}%` }} />
                          </div>
                          <span className="text-[10px] text-slate-400 text-right">{pctConsumo}% usado</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex flex-col items-end gap-1">
                          <span className="text-slate-400 text-xs">{l.lot_fecha_vencimiento || '-'}</span>
                          {l.lot_fecha_vencimiento && (() => {
                            const dr = getDiasRestantes(l.lot_fecha_vencimiento);
                            if (dr === null) return null;
                            const pct = Math.min(Math.max((dr / 90) * 100, 0), 100);
                            const color = dr <= 0 ? 'bg-slate-400'
                              : dr <= 30 ? 'bg-red-400'
                              : dr <= 60 ? 'bg-orange-400'
                              : 'bg-emerald-400';
                            return (
                              <div className="w-20 h-1 bg-slate-100 rounded-full overflow-hidden">
                                <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
                              </div>
                            );
                          })()}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="relative group inline-block">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase cursor-default ${getEstadoBadge(l.lot_estado).cls}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${getEstadoBadge(l.lot_estado).dot}`} />
                            {l.lot_estado}
                          </span>
                          <div className="absolute left-0 top-full mt-1 z-20 hidden group-hover:block bg-white border border-slate-200 rounded-lg shadow-lg py-1 min-w-[140px]">
                            {['Activo', 'Agotado', 'Vencido', 'Cuarentena']
                              .filter(e => e !== l.lot_estado)
                              .map(e => (
                                <button
                                  key={e}
                                  onClick={() => cambiarEstadoLote(l.lot_id, e)}
                                  className="w-full text-left px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 hover:text-blue-600 transition-colors"
                                >
                                  Cambiar a {e}
                                </button>
                              ))}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-0.5">
                          <button onClick={() => verDetalleLote(l)} className="p-2 text-slate-400 hover:text-blue-600 transition-colors" title="Ver detalle">
                            <Eye size={14} />
                          </button>
                          <button onClick={() => abrirEditarLote(l)} className="p-2 text-slate-400 hover:text-blue-600 transition-colors" title="Editar">
                            <Edit size={14} />
                          </button>
                          <button onClick={() => eliminarLote(l.lot_id)} className="p-2 text-slate-400 hover:text-red-600 transition-colors" title="Eliminar">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between px-6 py-4 bg-slate-50/30 border-t border-slate-100 text-xs text-slate-400 font-bold">
            <span>{filteredLotes.length > 0
              ? `${(paginaLotes - 1) * POR_PAGINA + 1}–${Math.min(paginaLotes * POR_PAGINA, filteredLotes.length)} de ${filteredLotes.length}`
              : `${filteredLotes.length} lotes`
            }</span>
            <div className="flex items-center gap-2">
              <button onClick={() => setPaginaLotes(p => Math.max(1, p - 1))} disabled={paginaLotes <= 1}
                className="px-3 py-1.5 rounded-md border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all text-xs font-bold uppercase tracking-wider">Anterior</button>
              <span className="text-slate-500">{paginaLotes} / {Math.max(1, Math.ceil(filteredLotes.length / POR_PAGINA))}</span>
              <button onClick={() => setPaginaLotes(p => p + 1)} disabled={paginaLotes >= Math.ceil(filteredLotes.length / POR_PAGINA)}
                className="px-3 py-1.5 rounded-md border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all text-xs font-bold uppercase tracking-wider">Siguiente</button>
            </div>
          </div>
        </div>
      )}

      {/* TAB: Movimientos */}
      {tab === 'movimientos' && (
        <div className="animate-in fade-in duration-300 bg-white rounded-lg shadow-sm border border-slate-200 border-l-4 border-l-orange-400 overflow-hidden">
          {/* ── Filtros ── */}
          <div className="flex items-center gap-2 px-6 py-3 border-b border-slate-100 bg-slate-50/30 flex-wrap">
            <select
              value={filtroProducto}
              onChange={(e) => { setFiltroProducto(e.target.value); setPagina(1); }}
              className="text-xs border border-slate-300 rounded-md px-2.5 py-1.5 bg-white outline-none shadow-sm font-medium text-slate-600"
            >
              <option value="">Todos los productos</option>
              {productos.map(p => (
                <option key={p.id} value={p.id}>{p.nombre}</option>
              ))}
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
            {(filtroProducto || filtroTipo || filtroFechaDesde || filtroFechaHasta) && (
              <button
                onClick={() => {
                  setFiltroProducto('');
                  setFiltroTipo('');
                  setFiltroFechaDesde('');
                  setFiltroFechaHasta('');
                  setPagina(1);
                }}
                className="text-[10px] font-bold uppercase tracking-wider text-slate-400 hover:text-red-500 transition-colors px-2"
              >
                ✕ Limpiar filtros
              </button>
            )}
          </div>
          {/* ── Tarjetas resumen ── */}
          {(() => {
            const totalMovs = monitorias.length;
            const entradas = monitorias.filter(m => m.mon_tipo === 'Entrada').length;
            const salidas = monitorias.filter(m => m.mon_tipo === 'Salida').length;
            const ajustes = monitorias.filter(m => m.mon_tipo === 'Ajuste').length;
            const cards = [
              { label: 'Todos', count: totalMovs, icon: '📋', color: 'border-blue-200 bg-blue-50/50', text: 'text-blue-700', filtro: '' },
              { label: 'Entrada', count: entradas, icon: '📥', color: 'border-emerald-200 bg-emerald-50/50', text: 'text-emerald-700', filtro: 'Entrada' },
              { label: 'Salida', count: salidas, icon: '📤', color: 'border-red-200 bg-red-50/50', text: 'text-red-700', filtro: 'Salida' },
              { label: 'Ajuste', count: ajustes, icon: '⚖️', color: 'border-yellow-200 bg-yellow-50/50', text: 'text-yellow-700', filtro: 'Ajuste' },
            ];
            return (
              <div className="grid grid-cols-4 gap-2 px-6 pt-4 pb-2">
                {cards.map((c, idx) => (
                  <button
                    key={idx}
                    onClick={() => { setFiltroTipo(c.filtro); setPagina(1); }}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border ${c.color} transition-all hover:shadow-md ${filtroTipo === c.filtro ? 'ring-2 ring-blue-400 scale-[1.03]' : ''}`}
                  >
                    <span className="text-lg">{c.icon}</span>
                    <div className="text-left">
                      <div className={`text-base font-black ${c.text}`}>{c.count}</div>
                      <div className="text-[9px] font-bold uppercase tracking-wider text-slate-500">{c.label}</div>
                    </div>
                  </button>
                ))}
              </div>
            );
          })()}

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
                    <td colSpan="7" className="px-6 py-16 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <AlertTriangle size={40} strokeWidth={1.2} className="text-slate-300" />
                        <p className="text-sm font-medium text-slate-400">No hay movimientos registrados</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  monitorias.map((m, i) => (
                    <tr key={i} className="hover:bg-orange-100/70">
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
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase ${
                          m.mon_tipo === 'Entrada' ? 'text-emerald-600 bg-emerald-50' : 
                          m.mon_tipo === 'Salida' ? 'text-red-600 bg-red-50' : 'text-yellow-600 bg-yellow-50'
                        }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          m.mon_tipo === 'Entrada' ? 'bg-emerald-500' : 
                          m.mon_tipo === 'Salida' ? 'bg-red-500' : 'bg-yellow-500'
                        }`} />
                        {m.mon_tipo}
                      </span>
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
                ? `${(pagina - 1) * POR_PAGINA_MOV + 1}–${Math.min(pagina * POR_PAGINA_MOV, totalMovimientos)} de ${totalMovimientos} movimientos`
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
                {pagina} / {Math.max(1, Math.ceil(totalMovimientos / POR_PAGINA_MOV))}
              </span>
              <button
                onClick={() => setPagina(p => p + 1)}
                disabled={pagina >= Math.ceil(totalMovimientos / POR_PAGINA_MOV)}
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-6">
          <div ref={focusTrapRef} className="bg-white rounded-lg shadow-2xl border border-slate-100 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-8 py-6 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-800">
                {viewingId ? 'Detalle del Lote' : isEditing ? 'Editar' : 'Nuevo'} {!viewingId && (tab === 'productos' ? 'Producto' : tab === 'lotes' ? 'Lote' : 'Movimiento')}
              </h2>
              <button onClick={() => { setShowModal(false); setViewingId(null); }} className="p-2 hover:bg-slate-100 rounded-md transition-colors">
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
                  {!isEditing && (
                    <div>
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Proveedor <span className="required-star">*</span></label>
                      <select
                        value={selectedSupplierId}
                        onChange={(e) => {
                          setSelectedSupplierId(e.target.value);
                          setShowNewProductForm(false);
                          setSearchProveedorProducto('');
                          setPaginaProveedorProducto(1);
                        }}
                        className="w-full p-3 bg-white border-2 border-slate-300 rounded-md outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium mt-1"
                      >
                        <option value="">Seleccionar proveedor...</option>
                        {proveedores.map(p => (
                          <option key={p.prov_id} value={p.prov_id}>{p.prov_id} - {p.prov_nombre}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {!isEditing && selectedSupplierId && (
                    <div className="p-3 bg-blue-50 border border-blue-100 rounded-md space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Productos de este proveedor</label>
                        <div className="relative">
                          <Search size={14} className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" />
                          <input
                            type="text"
                            value={searchProveedorProducto}
                            onChange={(e) => {
                              const val = e.target.value;
                              setSearchProveedorProducto(val);
                              setPaginaProveedorProducto(1);
                            }}
                            placeholder="Buscar producto..."
                            className="w-40 pl-7 pr-2 py-1.5 bg-white border border-blue-200 rounded-md text-xs outline-none focus:ring-2 focus:ring-blue-400"
                          />
                        </div>
                      </div>
                      {prodsBySupplier.length > 0 ? (
                        <ul className="space-y-1 max-h-48 overflow-y-auto">
                          {prodsBySupplier.map(prod => (
                            <li key={prod.id} className="text-sm font-medium text-slate-700 flex items-center gap-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />
                              {prod.id} — {prod.nombre}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-sm text-slate-500 italic">No hay productos registrados para este proveedor</p>
                      )}
                      {totalProveedorProductos > POR_PAGINA_PROV && (
                        <div className="flex items-center justify-between pt-1 text-xs text-slate-400 font-bold">
                          <span>
                            {totalProveedorProductos > 0
                              ? `${(paginaProveedorProducto - 1) * POR_PAGINA_PROV + 1}–${Math.min(paginaProveedorProducto * POR_PAGINA_PROV, totalProveedorProductos)} de ${totalProveedorProductos}`
                              : `${totalProveedorProductos} productos`
                            }
                          </span>
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                setPaginaProveedorProducto(p => Math.max(1, p - 1));
                              }}
                              disabled={paginaProveedorProducto <= 1}
                              className="px-2 py-1 rounded border border-blue-200 bg-white hover:bg-blue-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all text-xs font-bold uppercase tracking-wider"
                            >
                              Anterior
                            </button>
                            <span className="text-slate-500">{paginaProveedorProducto} / {Math.max(1, Math.ceil(totalProveedorProductos / POR_PAGINA_PROV))}</span>
                            <button
                              type="button"
                              onClick={() => {
                                setPaginaProveedorProducto(p => p + 1);
                              }}
                              disabled={paginaProveedorProducto >= Math.ceil(totalProveedorProductos / POR_PAGINA_PROV)}
                              className="px-2 py-1 rounded border border-blue-200 bg-white hover:bg-blue-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all text-xs font-bold uppercase tracking-wider"
                            >
                              Siguiente
                            </button>
                          </div>
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={() => setShowNewProductForm(!showNewProductForm)}
                        className="flex items-center gap-1.5 bg-emerald-600 text-white px-3 py-2 rounded-md hover:bg-emerald-700 transition-all text-xs font-bold uppercase tracking-wider"
                      >
                        <Plus size={14} /> {showNewProductForm ? 'Cancelar' : 'Agregar nuevo producto'}
                      </button>
                    </div>
                  )}

                  {(showNewProductForm || isEditing) && (
                    <>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">ID <span className="required-star">*</span></label>
                          <input name="id" value={formData.id || ''} disabled className="w-full p-3 bg-slate-100 border border-slate-200 rounded-md outline-none text-sm font-medium text-slate-400 mt-1" />
                        </div>
                        <div>
                          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Nombre <span className="required-star">*</span></label>
                          <input name="nombre" value={formData.nombre || ''} onChange={handleChange} className={`w-full p-3 bg-white border-2 rounded-md outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium mt-1 ${errors.nombre ? 'border-red-400' : 'border-slate-300'}`} />
                          {errors.nombre && <p className="text-red-500 text-xs mt-1">{errors.nombre}</p>}
                        </div>
                      </div>
                      <div>
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Categoría</label>
                        <div className="flex gap-2 mt-1">
                          <select name="categoria" value={formData.categoria || ''} onChange={handleChange} className={`flex-1 p-3 bg-white border-2 rounded-md outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium ${errors.categoria ? 'border-red-400' : 'border-slate-300'}`}>
                            <option value="">Seleccionar categoría...</option>
                            {[
                              ...new Set(
                                [...productos.map(p => p.categoria), formData.categoria].filter(Boolean)
                              ),
                            ]
                              .sort()
                              .map(cat => (
                                <option key={cat} value={cat}>
                                  {cat}
                                </option>
                              ))}
                          </select>
                          <button
                            type="button"
                            onClick={() => setShowNewCategoryForm(!showNewCategoryForm)}
                            className="px-2.5 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 transition-all text-sm font-bold flex items-center gap-1 shrink-0"
                            title="Agregar nueva categoría"
                          >
                            <Plus size={16} />
                          </button>
                        </div>
                        {showNewCategoryForm && (
                          <div className="flex gap-2 mt-2 p-2 bg-slate-50 rounded-md border border-slate-200">
                            <input
                              type="text"
                              value={newCategoryName}
                              onChange={e => setNewCategoryName(e.target.value)}
                              placeholder="Nombre de la categoría..."
                              className="flex-1 p-2 bg-white border border-slate-300 rounded text-sm outline-none focus:ring-2 focus:ring-blue-500"
                              autoFocus
                            />
                            <button
                              type="button"
                              onClick={handleAddCategory}
                              className="px-3 py-2 text-xs font-bold text-white bg-emerald-600 rounded-md hover:bg-emerald-700 transition-all"
                            >
                              Crear
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setShowNewCategoryForm(false);
                                setNewCategoryName('');
                              }}
                              className="px-3 py-2 text-xs font-bold text-slate-500 bg-white border border-slate-200 rounded-md hover:bg-slate-100 transition-all"
                            >
                              Cancelar
                            </button>
                          </div>
                        )}
                      </div>
                      <div>
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Precio</label>
                        <input
                          name="precio"
                          type="number"
                          step="0.01"
                          min="100"
                          max="999999.99"
                          value={formData.precio || ''}
                          onChange={handleChange}
                          className={`w-full p-3 bg-white border-2 rounded-md outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium mt-1 ${errors.precio ? 'border-red-400' : 'border-slate-300'}`}
                        />
                        {errors.precio && <p className="text-red-500 text-xs mt-1">{errors.precio}</p>}
                      </div>
                      <div>
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Descripción</label>
                        <input
                          name="descripcion"
                          value={formData.descripcion || ''}
                          onChange={handleChange}
                          className="w-full p-3 bg-white border-2 border-slate-300 rounded-md outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium mt-1"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Estado</label>
                        <select
                          name="estado"
                          value={formData.estado || 'Activo'}
                          onChange={handleChange}
                          disabled={!editingId}
                          className={`w-full p-3 border-2 rounded-md outline-none text-sm font-medium mt-1 ${editingId ? 'bg-white border-slate-300 focus:ring-2 focus:ring-blue-500' : 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed'}`}
                        >
                          <option value="Activo">Activo</option>
                          <option value="Descontinuado">Descontinuado</option>
                          <option value="Suspendido">Suspendido</option>
                        </select>
                        {!editingId && (
                          <p className="text-[10px] text-amber-600 font-medium mt-0.5">Siempre Activo al crear</p>
                        )}
                      </div>
                    </>
                  )}
                </>
              )}

              {/* ─── LOTE ─── */}
              {tab === 'lotes' && (
                <>
                  {viewingId ? (
                    /* ── Vista detalle (read-only) ── */
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">ID</label>
                          <p className="w-full p-3 bg-slate-50 border border-slate-200 rounded-md text-sm font-medium text-slate-700 mt-1">{formData.lot_id}</p>
                        </div>
                        <div>
                          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">N° Lote</label>
                          <p className="w-full p-3 bg-slate-50 border border-slate-200 rounded-md text-sm font-medium text-slate-700 mt-1">{formData.lot_numero || '—'}</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Producto</label>
                          <p className="w-full p-3 bg-slate-50 border border-slate-200 rounded-md text-sm font-medium text-slate-700 mt-1">
                            {(() => {
                              const prod = productos.find(p => p.id === formData.lot_pro_id_fk);
                              return prod ? `${prod.id} - ${prod.nombre}` : (formData.lot_pro_id_fk || '—');
                            })()}
                          </p>
                        </div>
                        <div>
                          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Proveedor</label>
                          <p className="w-full p-3 bg-slate-50 border border-slate-200 rounded-md text-sm font-medium text-slate-700 mt-1">
                            {(() => {
                              const prov = proveedores.find(p => p.prov_id === formData.lot_prov_id_fk);
                              return prov ? `${prov.prov_id} - ${prov.prov_nombre}` : (formData.lot_prov_id_fk || '—');
                            })()}
                          </p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Fecha Fabricación</label>
                          <p className="w-full p-3 bg-slate-50 border border-slate-200 rounded-md text-sm font-medium text-slate-700 mt-1">{formData.lot_fecha_fabricacion || '—'}</p>
                        </div>
                        <div>
                          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Fecha Vencimiento</label>
                          <p className="w-full p-3 bg-slate-50 border border-slate-200 rounded-md text-sm font-medium text-slate-700 mt-1">
                            {formData.lot_fecha_vencimiento || '—'}
                            {formData.lot_fecha_vencimiento && (() => {
                              const hoy = new Date();
                              const ven = new Date(formData.lot_fecha_vencimiento);
                              const diff = Math.ceil((ven - hoy) / (1000 * 60 * 60 * 24));
                              if (diff < 0) return <span className="ml-2 text-xs font-bold text-red-600">(Vencido hace {Math.abs(diff)} días)</span>;
                              if (diff <= 30) return <span className="ml-2 text-xs font-bold text-red-600">({diff} días restantes)</span>;
                              if (diff <= 60) return <span className="ml-2 text-xs font-bold text-orange-500">({diff} días restantes)</span>;
                              return <span className="ml-2 text-xs font-bold text-emerald-600">({diff} días restantes)</span>;
                            })()}
                          </p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Cantidad Inicial</label>
                          <p className="w-full p-3 bg-slate-50 border border-slate-200 rounded-md text-sm font-medium text-slate-700 mt-1">{formData.lot_cantidad_inicial || 0}</p>
                        </div>
                        <div>
                          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Cantidad Actual</label>
                          <p className="w-full p-3 bg-slate-50 border border-slate-200 rounded-md text-sm font-medium text-slate-700 mt-1">
                            {formData.lot_cantidad_actual || 0}
                            {formData.lot_cantidad_inicial > 0 && (() => {
                              const pct = Math.round(((formData.lot_cantidad_inicial - formData.lot_cantidad_actual) / formData.lot_cantidad_inicial) * 100);
                              const ancho = Math.min(formData.lot_cantidad_actual / formData.lot_cantidad_inicial * 100, 100);
                              const color = pct >= 80 ? 'bg-red-400' : pct >= 50 ? 'bg-orange-400' : 'bg-emerald-400';
                              return (
                                <div className="mt-1.5 flex items-center gap-2">
                                  <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                    <div className={`h-full rounded-full ${color}`} style={{ width: `${ancho}%` }} />
                                  </div>
                                  <span className="text-[10px] font-bold text-slate-400">{pct}% usado</span>
                                </div>
                              );
                            })()}
                          </p>
                        </div>
                      </div>
                      <div>
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Estado</label>
                        <div className="mt-1">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase ${formData.lot_estado === 'Activo' ? 'text-emerald-600 bg-emerald-50' : formData.lot_estado === 'Agotado' ? 'text-slate-500 bg-slate-100' : formData.lot_estado === 'Vencido' ? 'text-red-600 bg-red-50' : 'text-yellow-600 bg-yellow-50'}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${formData.lot_estado === 'Activo' ? 'bg-emerald-500' : formData.lot_estado === 'Agotado' ? 'bg-slate-400' : formData.lot_estado === 'Vencido' ? 'bg-red-500' : 'bg-yellow-500'}`} />
                            {formData.lot_estado}
                          </span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* ── Formulario de lote (crear/editar) ── */
                    <>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">ID <span className="required-star">*</span></label>
                          <input name="lot_id" value={formData.lot_id || ''} disabled className="w-full p-3 bg-slate-100 border border-slate-200 rounded-md outline-none text-sm font-medium text-slate-400 mt-1" autoFocus />
                        </div>
                        <div>
                          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">N° Lote <span className="required-star">*</span></label>
                          <input name="lot_numero" value={formData.lot_numero || ''} disabled={!editingId} className="w-full p-3 bg-slate-100 border-2 border-slate-200 rounded-md outline-none text-sm font-medium text-slate-500 mt-1" />
                          {errors.lot_numero && <p className="text-red-500 text-xs mt-1">{errors.lot_numero}</p>}
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
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
                        <div>
                          {loteSelectedProvId ? (
                            <>
                              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Buscar producto</label>
                              <div className="relative mt-1">
                                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                  name="loteSearchProducto"
                                  value={loteSearchProducto}
                                  onChange={handleChange}
                                  placeholder="Buscar producto..."
                                  className="w-full pl-9 pr-3 py-3 bg-white border-2 border-slate-300 rounded-md outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium"
                                />
                              </div>
                              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-2 block">Producto ID</label>
                              <select name="lot_pro_id_fk" value={formData.lot_pro_id_fk || ''} onChange={handleChange} className={`w-full p-3 bg-white border-2 rounded-md outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium mt-1 ${errors.lot_pro_id_fk ? 'border-red-400' : 'border-slate-300'}`}>
                                <option value="">Seleccionar producto...</option>
                                {productos
                                  .filter(p => p.estado === 'Activo' && productosProveedor.some(pp => pp.proveedor_id === loteSelectedProvId && pp.producto_id === p.id))
                                  .filter(p => !loteSearchProducto || p.id.toLowerCase().includes(loteSearchProducto.toLowerCase()) || p.nombre.toLowerCase().includes(loteSearchProducto.toLowerCase()))
                                  .map(p => (
                                    <option key={p.id} value={p.id}>{p.id} - {p.nombre}</option>
                                ))}
                              </select>
                              {errors.lot_pro_id_fk && <p className="text-red-500 text-xs mt-1">{errors.lot_pro_id_fk}</p>}
                            </>
                          ) : (
                            <div className="flex items-center justify-center h-full min-h-[80px]">
                              <p className="text-sm text-slate-400 italic">Seleccione un proveedor primero</p>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Fecha Fabricación</label>
                          <input name="lot_fecha_fabricacion" type="date" value={formData.lot_fecha_fabricacion || ''} onChange={handleChange}
                            min={`${new Date().getFullYear() - 5}-01-01`} max={new Date().toISOString().split('T')[0]}
                            className={`w-full p-3 bg-white border-2 rounded-md outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium mt-1 ${errors.lot_fecha_fabricacion ? 'border-red-400' : 'border-slate-300'}`} />
                          {errors.lot_fecha_fabricacion && <p className="text-red-500 text-xs mt-1">{errors.lot_fecha_fabricacion}</p>}
                        </div>
                        <div>
                          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Fecha Vencimiento <span className="required-star">*</span></label>
                          <input name="lot_fecha_vencimiento" type="date" value={formData.lot_fecha_vencimiento || ''} onChange={handleChange}
                            min={`${new Date().getFullYear() - 5}-01-01`} max={new Date(Date.now() + 5 * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
                            className={`w-full p-3 bg-white border-2 rounded-md outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium mt-1 ${errors.lot_fecha_vencimiento ? 'border-red-400' : 'border-slate-300'}`} />
                          {errors.lot_fecha_vencimiento && <p className="text-red-500 text-xs mt-1">{errors.lot_fecha_vencimiento}</p>}
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Cantidad Inicial</label>
                          <input name="lot_cantidad_inicial" type="number" min="1" max="1000" value={formData.lot_cantidad_inicial || ''} onChange={handleChange} className={`w-full p-3 bg-white border-2 rounded-md outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium mt-1 ${errors.lot_cantidad_inicial ? 'border-red-400' : 'border-slate-300'}`} />
                          {errors.lot_cantidad_inicial && <p className="text-red-500 text-xs mt-1">{errors.lot_cantidad_inicial}</p>}
                        </div>
                        <div>
                          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Estado</label>
                          <select name="lot_estado" value={formData.lot_estado || 'Activo'} onChange={handleChange} disabled={!editingId}
                            className={`w-full p-3 border-2 rounded-md outline-none text-sm font-medium mt-1 ${editingId ? 'bg-white border-slate-300 focus:ring-2 focus:ring-blue-500' : 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed'}`}>
                            <option value="Activo">Activo</option>
                            <option value="Agotado">Agotado</option>
                            <option value="Vencido">Vencido</option>
                            <option value="Cuarentena">Cuarentena</option>
                          </select>
                          {!editingId && <p className="text-[10px] text-amber-600 font-medium mt-0.5">Solo editable al modificar</p>}
                        </div>
                      </div>
                    </>
                  )}
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
                      <input name="inm_cantidad" type="number" min="1" max="999999" value={formData.inm_cantidad || ''} onChange={handleChange} className={`w-full p-3 bg-white border-2 rounded-md outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium mt-1 ${errors.inm_cantidad ? 'border-red-400' : 'border-slate-300'}`} />
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

              {viewingId ? (
                <button
                  type="button"
                  onClick={() => { setShowModal(false); setViewingId(null); }}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-lg shadow-sm transition-all active:scale-95 uppercase tracking-wider text-xs flex items-center justify-center gap-2"
                >
                  Cancelar
                </button>
              ) : (
                <>
                  <button
                    type="submit"
                    disabled={formSubmitting || Object.keys(errors).length > 0 || (tab === 'productos' && !isEditing && !showNewProductForm)}
                    className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-bold py-3.5 rounded-lg shadow-sm shadow-blue-100 transition-all active:scale-95 uppercase tracking-wider text-xs flex items-center justify-center gap-2"
                  >
                    {formSubmitting ? <Loader2 className="animate-spin" size={18} /> : null}
                    {isEditing ? 'Actualizar' : 'Guardar'}
                  </button>
                  {Object.keys(errors).length > 0 && !formSubmitting && (
                    <p className="text-red-500 text-xs text-center mt-2">Corrige los errores marcados antes de guardar</p>
                  )}
                </>
              )}
            </form>
          </div>
        </div>
      )}

      <ConfirmModal
        open={!!confirmAction}
        title={confirmAction?.title || ''}
        message={confirmAction?.message || ''}
        danger={confirmAction?.danger}
        onConfirm={confirmAction?.onConfirm || (() => {})}
        onCancel={confirmAction?.onCancel || (() => {})}
      />
    </div>
  );
};

export default Inventario;




