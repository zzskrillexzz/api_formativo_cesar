import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Truck, Package, Search, Plus, X, RefreshCw, Loader2, Edit3, Trash2, FileText, Download, Eye } from 'lucide-react';
import { ThemeLoader } from '../components/ThemeLoader';
import { ConfirmModal } from '../components/ConfirmModal';
import { useToast } from '../components/Toast';
import { comprasService } from '../api/services/comprasService';
import { proveedoresService } from '../api/services/proveedoresService';
import { productosService } from '../api/services/productosService';
import { detallesComprasService } from '../api/services/detallesComprasService';
import { proveedoresProductosService } from '../api/services/proveedoresProductosService';
import { useAuth } from '../context/AuthContext';
import { useFocusTrap } from '../hooks/useFocusTrap';
import { FIELD_LIMITS } from '../utils/fieldLimits';

const ESTADOS = ['Pendiente', 'Recibida', 'Cancelada'];
const ESTADOS_CREAR = ['Pendiente'];
const VIDA_UTIL_MINIMA = 14;
const ANOS_ATRAS_MAX = 5;
const ANOS_ADELANTE_MAX = 5;
const CANTIDAD_MAXIMA = 1000;

const dateRangeProps = () => {
  const y = new Date().getFullYear();
  const hoy = new Date().toISOString().split('T')[0];
  const cincoAnosAtras = `${y - ANOS_ATRAS_MAX}-01-01`;
  const cincoAnosAdelante = new Date(Date.now() + ANOS_ADELANTE_MAX * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  return { minFab: cincoAnosAtras, maxFab: hoy, minVen: cincoAnosAtras, maxVen: cincoAnosAdelante };
};

// Elimina emojis y caracteres especiales que rompen la BD
const stripEmojis = (str) => {
  if (!str) return str;
  return str.replace(
    /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2702}-\u{27B0}\u{24C2}-\u{1F251}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2600}-\u{26FF}\u{FE00}-\u{FE0F}\u{200D}]+/gu,
    ''
  );
};

const Compras = () => {
  const [tab, setTab] = useState('compras');
  const [compras, setCompras] = useState([]);
  const [proveedores, setProveedores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroEstadoCompra, setFiltroEstadoCompra] = useState('');
  const [filtroProveedorCompra, setFiltroProveedorCompra] = useState('');
  const POR_PAGINA = 10;
  const [paginaCompras, setPaginaCompras] = useState(1);
  const [paginaProveedores, setPaginaProveedores] = useState(1);
  const [filtroTipoProveedor, setFiltroTipoProveedor] = useState('');
  const formSnapshotRef = useRef({});
  const productosSnapshotRef = useRef([]);

  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showComprobanteModal, setShowComprobanteModal] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [confirmEditRecibida, setConfirmEditRecibida] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [formData, setFormData] = useState({});
  const [editData, setEditData] = useState({});
  const [comprobanteFile, setComprobanteFile] = useState(null);
  const [productosDisponibles, setProductosDisponibles] = useState([]);
  const [productosSeleccionados, setProductosSeleccionados] = useState([]);
  const [buscadorProducto, setBuscadorProducto] = useState('');
  const [prodSelector, setProdSelector] = useState('');
  const [prodCantidad, setProdCantidad] = useState('');
  const [prodPrecio, setProdPrecio] = useState('');
  const [prodFechaFabricacion, setProdFechaFabricacion] = useState('');
  const [prodFechaVencimiento, setProdFechaVencimiento] = useState('');
  const [editandoProductoId, setEditandoProductoId] = useState(null);
  const [editCantidadValor, setEditCantidadValor] = useState('');
  const [editFabValor, setEditFabValor] = useState('');
  const [editVenValor, setEditVenValor] = useState('');
  const [buscadorSearchMode, setBuscadorSearchMode] = useState('producto');
  const [buscadorProvId, setBuscadorProvId] = useState('');
  const [showEditProveedorModal, setShowEditProveedorModal] = useState(false);
  const [editProveedorData, setEditProveedorData] = useState({});
  const [showViewModal, setShowViewModal] = useState(null);
  const [viewData, setViewData] = useState(null);
  const [viewLoading, setViewLoading] = useState(false);
  const [showViewProveedorModal, setShowViewProveedorModal] = useState(false);
  const [viewProveedorData, setViewProveedorData] = useState(null);
  const [productosProveedor, setProductosProveedor] = useState([]);
  const [confirmDeleteProveedor, setConfirmDeleteProveedor] = useState(null);
  const { toast } = useToast();
  const { user } = useAuth();

  const fetchData = async () => {
    setLoading(true);
    setRefreshing(true);
    try {
      const [comps, provs, provProds] = await Promise.all([
        comprasService.listar().catch(() => []),
        proveedoresService.listar().catch(() => []),
        proveedoresProductosService.listar().catch(() => [])
      ]);
      setCompras(comps);
      setProveedores(provs);
      setProductosProveedor(Array.isArray(provProds) ? provProds : []);
    } catch (_) {
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  // Resetear paginación cuando cambian filtros
  useEffect(() => { setPaginaCompras(1); }, [searchTerm, filtroEstadoCompra, filtroProveedorCompra]);
  useEffect(() => { setPaginaProveedores(1); }, [searchTerm, filtroTipoProveedor]);

  const openModal = () => {
    if (tab === 'compras') {
      const nums = compras.map(c => { const m = (c.comp_id || '').match(/COM(\d+)/); return m ? parseInt(m[1]) : 0; });
      const max = nums.length > 0 ? Math.max(...nums) : 0;
      const defaultData = { com_id: 'COM' + String(max + 1).padStart(3, '0') };
      setFormData(defaultData);
      setProductosSeleccionados([]);
      setBuscadorProducto('');
      setBuscadorSearchMode('proveedor');
      setBuscadorProvId('');
      formSnapshotRef.current = JSON.parse(JSON.stringify(defaultData));
      productosService.listar().then(prods => setProductosDisponibles(prods.filter(p => p.estado === 'Activo'))).catch(() => setProductosDisponibles([]));
    } else {
      // El ID lo genera el backend automáticamente; el frontend solo muestra una previsualización
      const nums = proveedores.map(p => { const m = (p.prov_id || '').match(/PROV(\d+)/); return m ? parseInt(m[1]) : 0; });
      const max = nums.length > 0 ? Math.max(...nums) : 0;
      const defaultData = { id: 'PROV' + String(max + 1).padStart(3, '0') };
      setFormData(defaultData);
      formSnapshotRef.current = JSON.parse(JSON.stringify(defaultData));
    }
    setFormError('');
    setComprobanteFile(null);
    setShowModal(true);
  };

  const openEditModal = async (compra) => {
    setFormError('');
    setComprobanteFile(null);
    setBuscadorProducto('');
    setBuscadorSearchMode('producto');
    setBuscadorProvId(compra.comp_prov_id_fk || '');
    try {
      const [detalle, todosDetalles, prods] = await Promise.all([
        comprasService.buscar(compra.comp_id),
        detallesComprasService.listar().catch(() => []),
        productosService.listar().catch(() => [])
      ]);
      setEditData(detalle);
      setProductosDisponibles(prods.filter(p => p.estado === 'Activo'));
      // Cargar detalles existentes
      const misDetalles = todosDetalles.filter(d => d.compra_id === compra.comp_id);
      let productosCargados = [];
      if (misDetalles.length > 0) {
        const prodsMap = {};
        prods.forEach(p => { prodsMap[p.id] = p.nombre; });
        productosCargados = misDetalles.map(d => ({
          pro_id: d.producto_id,
          pro_nombre: prodsMap[d.producto_id] || d.producto_id,
          cantidad: d.cantidad,
          precio_unitario: d.precio_compra,
          subtotal: d.subtotal,
          fecha_fabricacion: d.fecha_fabricacion || '',
          fecha_vencimiento: d.fecha_vencimiento || '',
          dco_id: d.id,
          lote_id: d.lote_id || null
        }));
        setProductosSeleccionados(productosCargados);
        detalle.comp_tiene_detalles = true;
      } else {
        setProductosSeleccionados([]);
        detalle.comp_tiene_detalles = false;
      }
      setEditData({ ...detalle });
      formSnapshotRef.current = JSON.parse(JSON.stringify(detalle));
      productosSnapshotRef.current = JSON.parse(JSON.stringify(productosCargados));
      setShowEditModal(true);
    } catch (_) {
      setFormError('Error al cargar datos de la compra');
    }
  };

  const openViewModal = async (compra) => {
    setViewLoading(true);
    setViewData(null);
    try {
      const [detalle, detalles, prods] = await Promise.all([
        comprasService.buscar(compra.comp_id),
        detallesComprasService.listar({ dco_com_id_fk: compra.comp_id }).catch(() => []),
        productosService.listar().catch(() => [])
      ]);
      const prov = proveedores.find(p => p.prov_id === detalle.comp_prov_id_fk);
      const prodsMap = {};
      prods.forEach(p => { prodsMap[p.id] = p.nombre; });
      const items = (detalles || []).map(d => ({
        pro_id: d.producto_id,
        pro_nombre: prodsMap[d.producto_id] || d.producto_id,
        cantidad: d.cantidad,
        precio_unitario: d.precio_compra,
        subtotal: d.subtotal,
        fecha_fabricacion: d.fecha_fabricacion || '',
        fecha_vencimiento: d.fecha_vencimiento || ''
      }));
      setViewData({ ...detalle, proveedor: prov || null, productos: items });
      setShowViewModal(compra.comp_id);
    } catch (_) {
      setViewData(null);
    } finally {
      setViewLoading(false);
    }
  };

  // ── Función para eliminar emojis ──
  const stripEmojis = (text) => text.replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{FE00}-\u{FE0F}\u{200D}]/gu, '');

  const handleChange = (e) => {
    const { name, value } = e.target;
    let cleanValue = stripEmojis(value);
    // Validar tipo de entrada según campo
    if (name === 'contacto') {
      cleanValue = cleanValue.replace(/[^0-9+\- ]/g, '');
    } else if (name === 'nombre') {
      cleanValue = cleanValue.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑüÜ ]/g, '');
    } else if (name === 'nit') {
      cleanValue = cleanValue.replace(/[^0-9]/g, '');
    }
    if (name === 'com_prov_id_fk') {
      setBuscadorProvId(value);
      setBuscadorProducto('');
      setProdSelector('');
      if (value) {
        setBuscadorSearchMode('producto');
      }
    }
    const max = FIELD_LIMITS[name];
    if (max && cleanValue.length > max) return;
    setFormData({ ...formData, [name]: cleanValue });
    validateField(name, cleanValue);
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    const cleanValue = stripEmojis(value);
    const max = FIELD_LIMITS[name];
    if (max && cleanValue.length > max) return;
    setEditData({ ...editData, [name]: cleanValue });
    validateField(name, cleanValue);
  };

  // Productos filtrados por proveedor seleccionado
  const productosDelProveedor = useMemo(() => {
    const provId = formData.com_prov_id_fk || editData.comp_prov_id_fk;
    if (!provId) return [];
    return (productosDisponibles || []).filter(p => String(p.proveedor_id) === String(provId));
  }, [productosDisponibles, formData.com_prov_id_fk, editData.comp_prov_id_fk]);

  const handleProductSelect = (selectedId) => {
    setProdSelector(selectedId);
    if (!selectedId) { setProdPrecio(''); return; }
    const prod = productosDelProveedor.find(p => String(p.id) === String(selectedId));
    if (prod && prod.precio) {
      setProdPrecio(prod.precio.toString());
    } else {
      setProdPrecio('');
    }
  };

  const validateField = (name, value) => {
    const newErrors = { ...errors };
    if (tab === 'compras') {
      if (name === 'com_id' && !value) newErrors.com_id = 'El ID es obligatorio';
      else if (name === 'com_id') delete newErrors.com_id;
      if (name === 'com_fecha' && !value) newErrors.com_fecha = 'La fecha es obligatoria';
      else if (name === 'com_fecha') delete newErrors.com_fecha;
      if (name === 'com_prov_id_fk' && !value) newErrors.com_prov_id_fk = 'Selecciona un proveedor';
      else if (name === 'com_prov_id_fk') delete newErrors.com_prov_id_fk;
      if (name === 'com_total' && (!value || parseFloat(value) <= 0)) newErrors.com_total = 'Debe ser mayor a 0';
      else if (name === 'com_total') delete newErrors.com_total;
    }
    if (tab === 'proveedores') {
      if (name === 'id' && !value) newErrors.id = 'El ID es obligatorio';
      else if (name === 'id') delete newErrors.id;
      if (name === 'nit' && !value) newErrors.nit = 'El NIT es obligatorio';
      else if (name === 'nit' && /^0/.test(value)) newErrors.nit = 'El NIT no puede comenzar con cero';
      else if (name === 'nit' && value.length < 6) newErrors.nit = 'El NIT debe tener al menos 6 dígitos';
      else if (name === 'nit') delete newErrors.nit;
      if (name === 'nombre' && !value) newErrors.nombre = 'El nombre es obligatorio';
      else if (name === 'nombre') delete newErrors.nombre;
      if (name === 'tipo' && !value) newErrors.tipo = 'Selecciona un tipo';
      else if (name === 'tipo') delete newErrors.tipo;
      if (name === 'contacto' && !value) newErrors.contacto = 'El contacto es obligatorio';
      else if (name === 'contacto') delete newErrors.contacto;
      if (name === 'direccion' && !value) newErrors.direccion = 'La dirección es obligatoria';
      else if (name === 'direccion') delete newErrors.direccion;
      if (name === 'email' && !value) newErrors.email = 'El email es obligatorio';
      else if (name === 'email' && value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) newErrors.email = 'Formato de email inválido';
      else if (name === 'email') delete newErrors.email;
    }
    setErrors(newErrors);
  };

  const handleFileChange = (e, isEdit = false) => {
    const file = e.target.files[0];
    if (!file) return;
    const validTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setFormError('Solo se permiten archivos PDF o imágenes (PNG, JPG, WEBP)');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setFormError('El archivo no debe superar 10 MB');
      return;
    }
    setFormError('');
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result.split(',')[1];
      const tipo = file.type;
      setComprobanteFile({ base64, tipo, nombre: file.name });
      if (isEdit) {
        setEditData(prev => ({ ...prev, comp_comprobante: base64, comp_comprobante_tipo: tipo }));
      } else {
        setFormData(prev => ({ ...prev, com_comprobante: base64, com_comprobante_tipo: tipo }));
      }
    };
    reader.readAsDataURL(file);
  };

  // ── Validación de fechas (mismas reglas que lotes) ──
  const validarFechasProducto = (fabricacion, vencimiento) => {
    const currentYear = new Date().getFullYear();
    const fabYear = parseInt(fabricacion.split('-')[0]);
    const venYear = parseInt(vencimiento.split('-')[0]);

    if (fabYear < currentYear - ANOS_ATRAS_MAX || fabYear > currentYear)
      return `La fecha de fabricación debe estar entre ${currentYear - ANOS_ATRAS_MAX} y ${currentYear}`;
    if (venYear < currentYear - ANOS_ATRAS_MAX || venYear > currentYear + ANOS_ADELANTE_MAX)
      return `La fecha de vencimiento debe estar entre ${currentYear - ANOS_ATRAS_MAX} y ${currentYear + ANOS_ADELANTE_MAX}`;

    const diffDays = (new Date(vencimiento) - new Date(fabricacion)) / (1000 * 60 * 60 * 24);
    if (diffDays < VIDA_UTIL_MINIMA)
      return `La fecha de vencimiento debe ser al menos ${VIDA_UTIL_MINIMA} días después de la fabricación`;

    return null;
  };

  // ── Manejo de productos seleccionados en la compra ──
  const agregarProductoCompra = () => {
    const prodId = prodSelector;
    const cantidad = parseInt(prodCantidad, 10);
    const precio = parseFloat(prodPrecio);
    if (!prodId) { setFormError('Selecciona un producto'); return; }
    if (!cantidad || cantidad <= 0) { setFormError('La cantidad debe ser mayor a 0'); return; }
    if (cantidad > CANTIDAD_MAXIMA) { setFormError(`La cantidad no puede ser mayor a ${CANTIDAD_MAXIMA.toLocaleString()}`); return; }
    if (!precio || precio <= 0) { setFormError('El precio unitario debe ser mayor a 0'); return; }
    if (!prodFechaFabricacion) { setFormError('La fecha de fabricación es obligatoria'); return; }
    if (!prodFechaVencimiento) { setFormError('La fecha de vencimiento es obligatoria'); return; }
    const errorFechas = validarFechasProducto(prodFechaFabricacion, prodFechaVencimiento);
    if (errorFechas) { setFormError(errorFechas); return; }
    setFormError('');
    const producto = productosDisponibles.find(p => String(p.id) === String(prodId));
    if (!producto) return;
    const yaExiste = productosSeleccionados.find(p => String(p.pro_id) === String(prodId));
    if (yaExiste) { setFormError('El producto ya está agregado'); return; }
    const subtotal = cantidad * precio;
    const nuevo = { pro_id: prodId, pro_nombre: producto.nombre, cantidad, precio_unitario: precio, subtotal, fecha_fabricacion: prodFechaFabricacion, fecha_vencimiento: prodFechaVencimiento };
    const actualizados = [...productosSeleccionados, nuevo];
    setProductosSeleccionados(actualizados);
    const totalCalculado = actualizados.reduce((sum, p) => sum + p.subtotal, 0);
    setFormData(prev => ({ ...prev, com_total: String(totalCalculado) }));
    setBuscadorProducto('');
    setProdSelector('');
    setProdCantidad('');
    setProdPrecio('');
    setProdFechaFabricacion('');
    setProdFechaVencimiento('');
  };

  const quitarProductoCompra = (proId) => {
    const actualizados = productosSeleccionados.filter(p => p.pro_id !== proId);
    setProductosSeleccionados(actualizados);
    const totalCalculado = actualizados.reduce((sum, p) => sum + p.subtotal, 0);
    setFormData(prev => ({ ...prev, com_total: String(totalCalculado) }));
  };

  // ── Manejo de productos en editar compra ──
  const agregarProductoEditCompra = () => {
    const prodId = prodSelector;
    const cantidad = parseInt(prodCantidad, 10);
    const precio = parseFloat(prodPrecio);
    if (!prodId) { setFormError('Selecciona un producto'); return; }
    if (!cantidad || cantidad <= 0) { setFormError('La cantidad debe ser mayor a 0'); return; }
    if (cantidad > CANTIDAD_MAXIMA) { setFormError(`La cantidad no puede ser mayor a ${CANTIDAD_MAXIMA.toLocaleString()}`); return; }
    if (!precio || precio <= 0) { setFormError('El precio unitario debe ser mayor a 0'); return; }
    if (!prodFechaFabricacion) { setFormError('La fecha de fabricación es obligatoria'); return; }
    if (!prodFechaVencimiento) { setFormError('La fecha de vencimiento es obligatoria'); return; }
    const errorFechas = validarFechasProducto(prodFechaFabricacion, prodFechaVencimiento);
    if (errorFechas) { setFormError(errorFechas); return; }
    setFormError('');
    const producto = productosDisponibles.find(p => String(p.id) === String(prodId));
    if (!producto) return;
    const yaExiste = productosSeleccionados.find(p => String(p.pro_id) === String(prodId));
    if (yaExiste) { setFormError('El producto ya está agregado'); return; }
    const subtotal = cantidad * precio;
    const nuevo = { pro_id: prodId, pro_nombre: producto.nombre, cantidad, precio_unitario: precio, subtotal, fecha_fabricacion: prodFechaFabricacion, fecha_vencimiento: prodFechaVencimiento, lote_id: null };
    const actualizados = [...productosSeleccionados, nuevo];
    setProductosSeleccionados(actualizados);
    const totalCalculado = actualizados.reduce((sum, p) => sum + p.subtotal, 0);
    setEditData(prev => ({ ...prev, comp_total: totalCalculado }));
    setBuscadorProducto('');
    setProdSelector('');
    setProdCantidad('');
    setProdPrecio('');
    setProdFechaFabricacion('');
    setProdFechaVencimiento('');
  };

  const quitarProductoEditCompra = (proId) => {
    const actualizados = productosSeleccionados.filter(p => p.pro_id !== proId);
    setProductosSeleccionados(actualizados);
    const totalCalculado = actualizados.reduce((sum, p) => sum + p.subtotal, 0);
    setEditData(prev => ({ ...prev, comp_total: totalCalculado }));
  };

  // ── Helper: recalcular total según modal activo ──
  const actualizarTotal = (productos) => {
    const total = productos.reduce((sum, p) => sum + p.subtotal, 0);
    if (showModal) {
      setFormData(prev => ({ ...prev, com_total: String(total) }));
    } else if (showEditModal) {
      setEditData(prev => ({ ...prev, comp_total: total }));
    }
  };

  // ── Edición inline de cantidad / fechas ──
  const iniciarEdicion = (proId) => {
    const p = productosSeleccionados.find(x => x.pro_id === proId);
    if (!p) return;
    setEditCantidadValor(String(p.cantidad));
    setEditFabValor(p.fecha_fabricacion || '');
    setEditVenValor(p.fecha_vencimiento || '');
    setEditandoProductoId(proId);
    setFormError('');
  };

  const guardarEdicion = () => {
    const idx = productosSeleccionados.findIndex(p => p.pro_id === editandoProductoId);
    if (idx === -1) { cancelarEdicion(); return; }

    const nuevaCant = parseInt(editCantidadValor, 10);
    if (!nuevaCant || nuevaCant <= 0) {
      setFormError('La cantidad debe ser mayor a 0');
      return;
    }
    if (nuevaCant > CANTIDAD_MAXIMA) {
      setFormError(`La cantidad no puede ser mayor a ${CANTIDAD_MAXIMA.toLocaleString()}`);
      return;
    }
    if (!editFabValor) {
      setFormError('La fecha de fabricación es obligatoria');
      return;
    }
    if (!editVenValor) {
      setFormError('La fecha de vencimiento es obligatoria');
      return;
    }
    const errorFechas = validarFechasProducto(editFabValor, editVenValor);
    if (errorFechas) { setFormError(errorFechas); return; }

    const item = { ...productosSeleccionados[idx] };
    item.cantidad = nuevaCant;
    item.subtotal = nuevaCant * item.precio_unitario;
    item.fecha_fabricacion = editFabValor;
    item.fecha_vencimiento = editVenValor;

    const actualizados = [...productosSeleccionados];
    actualizados[idx] = item;
    setProductosSeleccionados(actualizados);
    actualizarTotal(actualizados);
    setFormError('');
    cancelarEdicion();
  };

  const cancelarEdicion = () => {
    setEditandoProductoId(null);
    setEditCantidadValor('');
    setEditFabValor('');
    setEditVenValor('');
  };

  const handleSubmitCompra = async (e) => {
    e.preventDefault();
    setFormError('');
    if (productosSeleccionados.length === 0) {
      setFormError('Debes agregar al menos un producto a la compra');
      return;
    }
    if (!formData.com_fecha || !formData.com_prov_id_fk) {
      setFormError('Completa los campos obligatorios: Fecha y Proveedor');
      return;
    }
    const total = productosSeleccionados.reduce((sum, p) => sum + p.subtotal, 0);
    if (total <= 0) {
      setFormError('El total debe ser mayor a 0');
      return;
    }
    setFormSubmitting(true);
    try {
      // 1. Crear la compra
      await comprasService.registrar({
        com_id: formData.com_id,
        com_fecha: formData.com_fecha,
        com_prov_id_fk: formData.com_prov_id_fk,
        com_usu_id_fk: user?.id || '',
        com_total: total,
        com_estado: formData.com_estado || 'Pendiente',
        com_observacion: formData.com_observacion || '',
        com_comprobante: formData.com_comprobante || null,
        com_comprobante_tipo: formData.com_comprobante_tipo || null
      });

      // 2. Registrar cada detalle de compra
      for (let i = 0; i < productosSeleccionados.length; i++) {
        const p = productosSeleccionados[i];
        const dcoId = 'DCO' + formData.com_id.replace('COM', '') + String(i + 1).padStart(2, '0');
        await detallesComprasService.registrar({
          dco_id: dcoId,
          dco_com_id_fk: formData.com_id,
          dco_pro_id_fk: p.pro_id,
          dco_cantidad: p.cantidad,
          dco_precio_compra: p.precio_unitario,
          dco_subtotal: p.subtotal,
          dco_fecha_fabricacion: p.fecha_fabricacion || null,
          dco_fecha_vencimiento: p.fecha_vencimiento || null
        });
      }

      setShowModal(false);
      setProductosSeleccionados([]);
      toast({ type: 'success', title: 'Creada', description: 'Compra registrada correctamente' });
      fetchData();
    } catch (err) {
      toast({ type: 'error', title: 'Error', description: err.response?.data?.mensaje || 'Error al crear compra' });
    } finally {
      setFormSubmitting(false);
    }
  };

  const ejecutarGuardadoCompra = async () => {
    const total = productosSeleccionados.reduce((sum, p) => sum + p.subtotal, 0);
    setFormSubmitting(true);
    try {
      // 1. Actualizar la compra
      const payload = {
        com_fecha: editData.comp_fecha,
        com_prov_id_fk: editData.comp_prov_id_fk,
        com_usu_id_fk: user?.id || '',
        com_total: total,
        com_estado: editData.comp_estado,
        com_observacion: editData.comp_observacion || '',
      };
      if (editData.comp_comprobante) {
        payload.com_comprobante = editData.comp_comprobante;
        payload.com_comprobante_tipo = editData.comp_comprobante_tipo;
      }
      await comprasService.editar(editData.comp_id, payload);

      // 2. Sincronizar detalles: UPDATE existentes, INSERT nuevos, DELETE eliminados
      if (productosSeleccionados.length > 0 || editData.comp_tiene_detalles) {
        const todosDetalles = await detallesComprasService.listar().catch(() => []);
        const viejosDetalles = todosDetalles.filter(d => d.compra_id === editData.comp_id);
        const idsActuales = new Set(productosSeleccionados.filter(p => p.dco_id).map(p => p.dco_id));

        // Eliminar detalles que ya no están en la lista
        for (const v of viejosDetalles) {
          if (!idsActuales.has(v.id)) {
            try {
              await detallesComprasService.eliminar(v.id);
            } catch { /* si falla, continuar */ }
          }
        }

        // Actualizar o insertar cada producto
        for (let i = 0; i < productosSeleccionados.length; i++) {
          const p = productosSeleccionados[i];
          const detalleData = {
            dco_com_id_fk: editData.comp_id,
            dco_pro_id_fk: p.pro_id,
            dco_lot_id_fk: p.lote_id || null,
            dco_cantidad: p.cantidad,
            dco_precio_compra: p.precio_unitario,
            dco_subtotal: p.subtotal,
            dco_fecha_fabricacion: p.fecha_fabricacion || null,
            dco_fecha_vencimiento: p.fecha_vencimiento || null
          };

          if (p.dco_id) {
            // Producto existente → UPDATE
            await detallesComprasService.editar(p.dco_id, detalleData);
          } else {
            // Producto nuevo → INSERT
            const dcoId = 'DCO' + editData.comp_id.replace('COM', '') + String(i + 1).padStart(2, '0');
            await detallesComprasService.registrar({
              dco_id: dcoId,
              ...detalleData
            });
          }
        }
      }

      setShowEditModal(false);
      setProductosSeleccionados([]);
      toast({ type: 'success', title: 'Actualizada', description: 'Compra actualizada correctamente' });
      fetchData();
    } catch (err) {
      toast({ type: 'error', title: 'Error', description: err.response?.data?.mensaje || 'Error al actualizar compra' });
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleConfirmEditRecibida = () => {
    setConfirmEditRecibida(false);
    ejecutarGuardadoCompra();
  };

  const handleEditCompra = async (e) => {
    e.preventDefault();
    setFormError('');
    const dataCambiada = JSON.stringify(editData) !== JSON.stringify(formSnapshotRef.current);
    const productosCambiados = JSON.stringify(productosSeleccionados) !== JSON.stringify(productosSnapshotRef.current);
    if (!dataCambiada && !productosCambiados) {
      toast({ type: 'warning', title: 'Sin cambios', description: 'No se identificaron modificaciones en la compra' });
      return;
    }
    // Validar estado de la compra antes de editar
    const estadoActual = editData.comp_estado;
    if (estadoActual === 'Cancelada') {
      setFormError('No se puede editar una compra cancelada');
      return;
    }
    if (estadoActual === 'Recibida') {
      setConfirmEditRecibida(true);
      return;
    }
    const tieneProductosBD = editData.comp_tiene_detalles;
    if (productosSeleccionados.length === 0 && !tieneProductosBD) {
      setFormError('Debes agregar al menos un producto a la compra');
      return;
    }
    const total = productosSeleccionados.reduce((sum, p) => sum + p.subtotal, 0);
    if (total <= 0) {
      setFormError('El total debe ser mayor a 0');
      return;
    }
    ejecutarGuardadoCompra();
  };

  const handleChangeStatus = async (compraId, nuevoEstado) => {
    if (formSubmitting) return; // Evitar múltiples envíos simultáneos
    setFormSubmitting(true);
    try {
      await comprasService.editar(compraId, { com_estado: nuevoEstado });
      toast({ type: 'success', title: 'Estado actualizado', description: `Compra → ${nuevoEstado}` });
      fetchData();
    } catch (err) {
      toast({ type: 'error', title: 'Error', description: err.response?.data?.mensaje || 'Error al cambiar estado' });
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    setFormSubmitting(true);
    try {
      await comprasService.eliminar(confirmDelete);
      setConfirmDelete(null);
      toast({ type: 'success', title: 'Eliminada', description: 'Compra eliminada correctamente' });
      fetchData();
    } catch (err) {
      toast({ type: 'error', title: 'Error', description: err.response?.data?.mensaje || 'Error al eliminar compra' });
    } finally {
      setFormSubmitting(false);
    }
  };

  const openEditProveedorModal = async (prov) => {
    setFormError('');
    setErrors({});
    setEditProveedorData({
      id: prov.prov_id,
      nit: prov.prov_nit,
      nombre: prov.prov_nombre,
      tipo: prov.prov_tipo,
      contacto: prov.prov_contacto,
      direccion: prov.prov_direccion,
      email: prov.prov_email
    });
    formSnapshotRef.current = JSON.parse(JSON.stringify(prov));
    setShowEditProveedorModal(true);
  };

  const handleEditProveedorChange = (e) => {
    const { name, value } = e.target;
    let cleaned = stripEmojis(value);
    // Validar tipo de entrada según campo
    if (name === 'contacto') {
      cleaned = cleaned.replace(/[^0-9+\- ]/g, '');
    } else if (name === 'nombre') {
      cleaned = cleaned.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑüÜ ]/g, '');
    } else if (name === 'nit') {
      cleaned = cleaned.replace(/[^0-9]/g, '');
    }
    const max = FIELD_LIMITS[name];
    if (max && cleaned.length > max) return;
    setEditProveedorData({ ...editProveedorData, [name]: cleaned });
    validateField(name, cleaned);
  };

  const handleEditProveedor = async (e) => {
    e.preventDefault();
    setFormError('');
    if (JSON.stringify(editProveedorData) === JSON.stringify(formSnapshotRef.current)) {
      toast({ type: 'warning', title: 'Sin cambios', description: 'No se identificaron modificaciones en el proveedor' });
      return;
    }
    if (!editProveedorData.nit || !editProveedorData.nombre || !editProveedorData.tipo || !editProveedorData.contacto || !editProveedorData.direccion || !editProveedorData.email) {
      setFormError('Todos los campos son obligatorios');
      return;
    }
    if (/^0/.test(editProveedorData.nit)) {
      setFormError('El NIT no puede comenzar con cero');
      return;
    }
    if (editProveedorData.nit.length < 6) {
      setFormError('El NIT debe tener al menos 6 dígitos');
      return;
    }
    if (editProveedorData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editProveedorData.email)) {
      setFormError('El correo electrónico no es válido');
      return;
    }
    setFormSubmitting(true);
    try {
      const normalizarNombre = (s) =>
        (s || '').trim().replace(/\s+/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
      const payload = {
        ...editProveedorData,
        nombre: normalizarNombre(editProveedorData.nombre),
        contacto: normalizarNombre(editProveedorData.contacto),
        email: (editProveedorData.email || '').trim().toLowerCase()
      };
      await proveedoresService.editar(editProveedorData.id, payload);
      setShowEditProveedorModal(false);
      toast({ type: 'success', title: 'Actualizado', description: 'Proveedor actualizado correctamente' });
      fetchData();
    } catch (err) {
      toast({ type: 'error', title: 'Error', description: err.response?.data?.mensaje || 'Error al actualizar proveedor' });
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleDeleteProveedor = async () => {
    if (!confirmDeleteProveedor) return;
    setFormSubmitting(true);
    try {
      await proveedoresService.eliminar(confirmDeleteProveedor);
      setConfirmDeleteProveedor(null);
      toast({ type: 'success', title: 'Eliminado', description: 'Proveedor eliminado correctamente' });
      fetchData();
    } catch (err) {
      toast({ type: 'error', title: 'Error', description: err.response?.data?.mensaje || 'Error al eliminar proveedor' });
    } finally {
      setFormSubmitting(false);
    }
  };

  const openViewProveedorModal = async (prov) => {
    try {
      const detalle = await proveedoresService.buscar(prov.prov_id);
      setViewProveedorData(detalle);
      // Cargar productos de este proveedor
      const prods = await productosService.listar({ pro_prov_id_fk: prov.prov_id }).catch(() => []);
      setProductosProveedor(Array.isArray(prods) ? prods : []);
      setShowViewProveedorModal(true);
    } catch (_) {
      toast({ type: 'error', title: 'Error', description: 'Error al cargar datos del proveedor' });
    }
  };

  const handleSubmitProveedor = async (e) => {
    e.preventDefault();
    setFormError('');
    // Verificar que el usuario haya modificado al menos un campo (excluyendo el ID que es auto-generado)
    const { id: _idSnap, ...snapSinId } = formSnapshotRef.current;
    const { id: _idForm, ...formSinId } = formData;
    if (JSON.stringify(formSinId) === JSON.stringify(snapSinId)) {
      setFormError('Completa los campos del proveedor antes de guardar');
      return;
    }
    if (!formData.nit || !formData.nombre || !formData.tipo || !formData.contacto || !formData.direccion || !formData.email) {
      setFormError('Todos los campos son obligatorios');
      return;
    }
    // Validar NIT — no ceros a la izquierda y longitud mínima
    if (/^0/.test(formData.nit)) {
      setFormError('El NIT no puede comenzar con cero');
      setFormSubmitting(false);
      return;
    }
    if (formData.nit.length < 6) {
      setFormError('El NIT debe tener al menos 6 dígitos');
      setFormSubmitting(false);
      return;
    }
    setFormSubmitting(true);
    try {
      const normalizarNombre = (s) =>
        (s || '').trim().replace(/\s+/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
      // El backend auto-genera el ID; el que muestra el formulario es solo referencial
      await proveedoresService.registrar({
        nit: formData.nit,
        nombre: normalizarNombre(formData.nombre),
        tipo: formData.tipo,
        contacto: normalizarNombre(formData.contacto),
        direccion: formData.direccion,
        email: (formData.email || '').trim().toLowerCase()
      });
      setShowModal(false);
      toast({ type: 'success', title: 'Creado', description: 'Proveedor registrado correctamente' });
      fetchData();
    } catch (err) {
      toast({ type: 'error', title: 'Error', description: err.response?.data?.mensaje || 'Error al crear proveedor' });
    } finally {
      setFormSubmitting(false);
    }
  };

  const tabs = [
    { id: 'compras', label: 'Compras a Proveedores', icon: Truck },
    { id: 'proveedores', label: 'Proveedores', icon: Package },
  ];

  const filteredCompras = compras.filter(c => {
    const porEstado = !filtroEstadoCompra || c.comp_estado === filtroEstadoCompra;
    const porProveedor = !filtroProveedorCompra || c.comp_prov_id_fk === filtroProveedorCompra;
    const prov = proveedores.find(p => p.prov_id === c.comp_prov_id_fk);
    const nombreProveedor = prov ? `${prov.prov_nombre}` : '';
    const busca = [c.comp_id, c.comp_fecha, c.comp_prov_id_fk, c.comp_estado, c.comp_total, c.comp_observacion, c.comp_usu_id_fk, nombreProveedor
    ].filter(Boolean).join(' ').toLowerCase().includes(searchTerm.toLowerCase());
    return porEstado && porProveedor && busca;
  });
  const focusTrapRef = useFocusTrap(showModal || showEditModal);

  const paginatedCompras = filteredCompras.slice(
    (paginaCompras - 1) * POR_PAGINA, paginaCompras * POR_PAGINA
  );

  const filteredProveedores = proveedores.filter(p => {
    const busca = [p.prov_id, p.prov_nombre, p.prov_nit, p.prov_tipo, p.prov_contacto, p.prov_email, p.prov_direccion
    ].filter(Boolean).join(' ').toLowerCase().includes(searchTerm.toLowerCase());
    const porTipo = !filtroTipoProveedor || p.prov_tipo === filtroTipoProveedor;
    return busca && porTipo;
  });

  const paginatedProveedores = filteredProveedores.slice(
    (paginaProveedores - 1) * POR_PAGINA, paginaProveedores * POR_PAGINA
  );

  const estadoBadge = (estado) => {
    const cls = estado === 'Recibida' ? 'text-emerald-600 bg-emerald-50' :
                estado === 'Cancelada' ? 'text-red-600 bg-red-50' :
                'text-yellow-600 bg-yellow-50';
    return <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase ${cls}`}>{estado || '-'}</span>;
  };

  if (loading) return <ThemeLoader module="Compras" />;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 bg-white rounded-lg p-1.5 shadow-sm border border-slate-200 w-fit">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`select-none cursor-pointer flex items-center gap-2 px-5 py-3 rounded-md text-xs font-bold uppercase tracking-wider transition-all ${
              tab === t.id ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-600'
            }`}>
            <t.icon size={16} /> {t.label}
          </button>
        ))}
      </div>

      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-3 bg-white border border-slate-300 px-5 py-3 rounded-lg w-80 shadow-sm">
            <Search size={18} className="text-slate-400" />
            <input type="text" placeholder={tab === 'compras' ? 'Buscar compra...' : 'Buscar proveedor...'}
              className="bg-transparent border-none outline-none text-sm w-full font-medium"
              value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} maxLength={100} />
          </div>
          {tab === 'compras' && (
            <select
              value={filtroProveedorCompra}
              onChange={(e) => setFiltroProveedorCompra(e.target.value)}
              className="text-xs border border-slate-300 rounded-md px-2.5 py-3 bg-white outline-none shadow-sm font-medium text-slate-600"
            >
              <option value="">Todos los proveedores</option>
              {proveedores.map(p => (
                <option key={p.prov_id || p.id} value={p.prov_id || p.id}>{p.prov_nombre || p.nombre}</option>
              ))}
            </select>
          )}
          {(filtroEstadoCompra || filtroProveedorCompra) && (
            <button
              onClick={() => { setFiltroEstadoCompra(''); setFiltroProveedorCompra(''); }}
              className="text-[10px] font-bold uppercase tracking-wider text-slate-400 hover:text-red-500 transition-colors px-2"
            >
              ✕ Limpiar
            </button>
          )}
        </div>
        <div className="flex gap-2">
          <button onClick={fetchData} disabled={refreshing} className="p-3 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-all shadow-sm disabled:opacity-70" title="Actualizar datos">
            <RefreshCw size={18} className={`text-slate-500 transition-transform ${refreshing ? 'animate-spin' : ''}`} />
          </button>
          <button onClick={openModal}
            className="flex items-center gap-2 bg-blue-600 text-white px-5 py-3 rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-blue-700 transition-all shadow-md btn-pulse">
            <Plus size={16} /> Nuevo {tab === 'compras' ? 'Compra' : 'Proveedor'}
          </button>
        </div>
      </div>

      {/* Compras */}
      {tab === 'compras' && (
        <>
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 border-l-4 border-l-orange-400 overflow-hidden card-hover">
          {/* ── Tarjetas resumen ── */}
          <div className="grid grid-cols-4 gap-2 px-5 pt-4 pb-2">
            {(() => {
              const cards = [
                { label: 'Todas', count: compras.length, icon: '📋', color: 'border-blue-200 bg-blue-50/50', text: 'text-blue-700', filtro: '' },
                { label: 'Pendientes', count: compras.filter(c => c.comp_estado === 'Pendiente').length, icon: '⏳', color: 'border-yellow-200 bg-yellow-50/50', text: 'text-yellow-700', filtro: 'Pendiente' },
                { label: 'Recibidas', count: compras.filter(c => c.comp_estado === 'Recibida').length, icon: '✅', color: 'border-emerald-200 bg-emerald-50/50', text: 'text-emerald-700', filtro: 'Recibida' },
                { label: 'Canceladas', count: compras.filter(c => c.comp_estado === 'Cancelada').length, icon: '🚫', color: 'border-red-200 bg-red-50/50', text: 'text-red-700', filtro: 'Cancelada' },
              ];
              return cards.map((c, idx) => (
                <button
                  key={idx}
                  onClick={() => setFiltroEstadoCompra(c.filtro)}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border ${c.color} transition-all hover:shadow-md ${filtroEstadoCompra === c.filtro ? 'ring-2 ring-blue-400 scale-[1.03]' : ''}`}
                >
                  <span className="text-lg">{c.icon}</span>
                  <div className="text-left">
                    <div className={`text-base font-black ${c.text}`}>{c.count}</div>
                    <div className="text-[9px] font-bold uppercase tracking-wider text-slate-500">{c.label}</div>
                  </div>
                </button>
              ));
            })()}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left table-animate">
              <thead className="bg-slate-50 text-slate-400 text-xs uppercase font-bold tracking-wider border-b border-slate-100">
                <tr>
                  <th className="px-5 py-3">ID</th>
                  <th className="px-5 py-3">Fecha</th>
                  <th className="px-5 py-3">Proveedor</th>
                  <th className="px-5 py-3">Estado</th>
                  <th className="px-5 py-3 text-right">Total</th>
                  <th className="px-5 py-3">Observación</th>
                  <th className="px-5 py-3 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-sm font-medium text-slate-600">
                {filteredCompras.length === 0 ? (
                  <tr><td colSpan="7" className="px-5 py-12 text-center text-slate-400">{searchTerm ? 'Sin resultados' : 'No hay compras registradas'}</td></tr>
                ) : (
                  paginatedCompras.map((c, i) => (
                    <tr key={i} className="hover:bg-orange-100/70 group">
                      <td className="px-5 py-3 text-slate-400 text-xs">{c.comp_id}</td>
                      <td className="px-5 py-3">{c.comp_fecha || '-'}</td>
                      <td className="px-5 py-3">
                        {(() => {
                          const prov = proveedores.find(p => p.prov_id === c.comp_prov_id_fk);
                          return prov ? (
                            <span title={prov.prov_id}>{prov.prov_nombre}</span>
                          ) : (c.comp_prov_id_fk || '-');
                        })()}
                      </td>
                      <td className="px-5 py-3">{estadoBadge(c.comp_estado)}</td>
                      <td className="px-5 py-3 text-right">${parseFloat(c.comp_total || 0).toLocaleString()}</td>
                      <td className="px-5 py-3 text-slate-400 text-xs max-w-[160px] truncate">{c.comp_observacion || '-'}</td>
                      <td className="px-5 py-3">
                        <div className="flex items-center justify-center gap-1.5">
                          {c.comp_tiene_comprobante && (
                            <button onClick={async () => {
                              try {
                                const det = await comprasService.buscar(c.comp_id);
                                setShowComprobanteModal(det);
                              } catch (_) {}
                            }} title="Ver comprobante"
                              className="p-1.5 rounded-md text-emerald-500 hover:bg-emerald-50 transition-colors">
                              <FileText size={15} />
                            </button>
                          )}
                          <button onClick={() => openViewModal(c)} title="Ver detalle"
                            className="p-1.5 rounded-md text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition-colors">
                            <Eye size={15} />
                          </button>
                          <select
                            value={c.comp_estado || 'Pendiente'}
                            onChange={(e) => handleChangeStatus(c.comp_id, e.target.value)}
                            className="text-[10px] font-bold uppercase border border-slate-200 rounded-md px-1.5 py-1 bg-white cursor-pointer hover:border-slate-300 transition-colors outline-none"
                            title="Cambiar estado">
                            {ESTADOS.map(e => <option key={e} value={e}>{e}</option>)}
                          </select>
                          <button onClick={() => openEditModal(c)} title="Editar compra"
                            className="p-1.5 rounded-md text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors">
                            <Edit3 size={15} />
                          </button>
                          <button onClick={() => setConfirmDelete(c.comp_id)} title="Eliminar compra"
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
          <div className="flex items-center justify-between px-5 py-3 bg-slate-50 border-t border-slate-100 text-xs text-slate-400 font-medium">
            <span>{filteredCompras.length > 0
              ? `${(paginaCompras - 1) * POR_PAGINA + 1}–${Math.min(paginaCompras * POR_PAGINA, filteredCompras.length)} de ${filteredCompras.length}`
              : `${filteredCompras.length} compras`
            }</span>
            <div className="flex items-center gap-2">
              <button onClick={() => setPaginaCompras(p => Math.max(1, p - 1))} disabled={paginaCompras <= 1}
                className="px-3 py-1.5 rounded-md border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all text-xs font-bold uppercase tracking-wider">Anterior</button>
              <span className="text-slate-500">{paginaCompras} / {Math.max(1, Math.ceil(filteredCompras.length / POR_PAGINA))}</span>
              <button onClick={() => setPaginaCompras(p => p + 1)} disabled={paginaCompras >= Math.ceil(filteredCompras.length / POR_PAGINA)}
                className="px-3 py-1.5 rounded-md border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all text-xs font-bold uppercase tracking-wider">Siguiente</button>
            </div>
          </div>
        </div>
      </>
      )}

      {/* Proveedores */}
      {tab === 'proveedores' && (
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 border-l-4 border-l-orange-400 overflow-hidden card-hover">
          {/* ── Filtros de proveedores ── */}
          <div className="flex items-center gap-2 px-5 py-3 border-b border-slate-100 bg-slate-50/30 flex-wrap">
            <select
              value={filtroTipoProveedor}
              onChange={(e) => setFiltroTipoProveedor(e.target.value)}
              className="text-xs border border-slate-300 rounded-md px-2.5 py-1.5 bg-white outline-none shadow-sm font-medium text-slate-600"
            >
              <option value="">Todos los tipos</option>
              {[...new Set(proveedores.map(p => p.prov_tipo).filter(Boolean))].sort().map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
            {filtroTipoProveedor && (
              <button
                onClick={() => setFiltroTipoProveedor('')}
                className="text-[10px] font-bold uppercase tracking-wider text-slate-400 hover:text-red-500 transition-colors px-2"
              >
                ✕ Limpiar filtros
              </button>
            )}
          </div>
          {/* ── Tarjetas resumen ── */}
          {(() => {
            const laboratorio = proveedores.filter(p => p.prov_tipo === 'Laboratorio').length;
            const distribuidor = proveedores.filter(p => p.prov_tipo === 'Distribuidor').length;
            const importador = proveedores.filter(p => p.prov_tipo === 'Importador').length;
            const cards = [
              { label: 'Todos', count: proveedores.length, icon: '📋', color: 'border-blue-200 bg-blue-50/50', text: 'text-blue-700', filtro: '' },
              { label: 'Laboratorio', count: laboratorio, icon: '🔬', color: 'border-purple-200 bg-purple-50/50', text: 'text-purple-700', filtro: 'Laboratorio' },
              { label: 'Distribuidor', count: distribuidor, icon: '🚚', color: 'border-amber-200 bg-amber-50/50', text: 'text-amber-700', filtro: 'Distribuidor' },
              { label: 'Importador', count: importador, icon: '🌐', color: 'border-blue-200 bg-blue-50/50', text: 'text-blue-700', filtro: 'Importador' },
            ];
            return (
              <div className="grid grid-cols-4 gap-2 px-5 pt-4 pb-2">
                {cards.map((c, idx) => (
                  <button
                    key={idx}
                    onClick={() => setFiltroTipoProveedor(c.filtro)}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border ${c.color} transition-all hover:shadow-md ${filtroTipoProveedor === c.filtro ? 'ring-2 ring-blue-400 scale-[1.03]' : ''}`}
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
              <thead className="bg-slate-50 text-slate-400 text-xs uppercase font-bold tracking-wider border-b border-slate-100">
                <tr>
                  <th className="px-5 py-3">ID</th>
                  <th className="px-5 py-3">Nombre</th>
                  <th className="px-5 py-3">NIT</th>
                  <th className="px-5 py-3">Tipo</th>
                  <th className="px-5 py-3">Contacto</th>
                  <th className="px-5 py-3">Email</th>
                  <th className="px-5 py-3 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-sm font-medium text-slate-600">
                {filteredProveedores.length === 0 ? (
                  <tr><td colSpan="7" className="px-5 py-12 text-center text-slate-400">{searchTerm ? 'Sin resultados' : 'No hay proveedores registrados'}</td></tr>
                ) : (
                  paginatedProveedores.map((p, i) => (
                    <tr key={i} className="hover:bg-orange-100/70">
                      <td className="px-5 py-3 text-slate-400 text-xs">{p.prov_id}</td>
                      <td className="px-5 py-3">{p.prov_nombre}</td>
                      <td className="px-5 py-3 text-slate-400">{p.prov_nit || '-'}</td>
                      <td className="px-5 py-3"><span className="px-2 py-1 rounded-md text-[10px] font-bold uppercase bg-slate-100 text-slate-500">{p.prov_tipo || '-'}</span></td>
                      <td className="px-5 py-3">{p.prov_contacto || '-'}</td>
                      <td className="px-5 py-3 text-slate-400 text-xs">{p.prov_email || '-'}</td>
                      <td className="px-5 py-3">
                        <div className="flex items-center justify-center gap-1.5">
                          <button onClick={() => openViewProveedorModal(p)} title="Ver detalles"
                            className="p-1.5 rounded-md text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors">
                            <Eye size={15} />
                          </button>
                          <button onClick={() => openEditProveedorModal(p)} title="Editar proveedor"
                            className="p-1.5 rounded-md text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition-colors">
                            <Edit3 size={15} />
                          </button>
                          <button onClick={() => setConfirmDeleteProveedor(p.prov_id)} title="Eliminar proveedor"
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
          <div className="flex items-center justify-between px-5 py-3 bg-slate-50 border-t border-slate-100 text-xs text-slate-400 font-medium">
            <span>{filteredProveedores.length > 0
              ? `${(paginaProveedores - 1) * POR_PAGINA + 1}–${Math.min(paginaProveedores * POR_PAGINA, filteredProveedores.length)} de ${filteredProveedores.length}`
              : `${filteredProveedores.length} proveedores`
            }</span>
            <div className="flex items-center gap-2">
              <button onClick={() => setPaginaProveedores(p => Math.max(1, p - 1))} disabled={paginaProveedores <= 1}
                className="px-3 py-1.5 rounded-md border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all text-xs font-bold uppercase tracking-wider">Anterior</button>
              <span className="text-slate-500">{paginaProveedores} / {Math.max(1, Math.ceil(filteredProveedores.length / POR_PAGINA))}</span>
              <button onClick={() => setPaginaProveedores(p => p + 1)} disabled={paginaProveedores >= Math.ceil(filteredProveedores.length / POR_PAGINA)}
                className="px-3 py-1.5 rounded-md border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all text-xs font-bold uppercase tracking-wider">Siguiente</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Registrar */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowModal(false)} />
          <div ref={focusTrapRef} className="relative bg-white rounded-lg shadow-2xl border border-slate-100 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-800">{tab === 'compras' ? 'Registrar Compra' : 'Registrar Proveedor'}</h3>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-slate-100 rounded-md transition-colors"><X size={18} className="text-slate-400" /></button>
            </div>
            <form onSubmit={tab === 'compras' ? handleSubmitCompra : handleSubmitProveedor} className="p-5 space-y-4">
              {formError && <div className="p-3 bg-red-50 text-red-600 text-xs font-bold rounded-md border border-red-100">{formError}</div>}

              {tab === 'compras' && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">ID <span className="required-star">*</span></label>
                      <input name="com_id" value={formData.com_id || ''} disabled className="w-full p-3 bg-slate-100 border border-slate-200 rounded-md outline-none text-sm font-medium text-slate-400 mt-1" />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Fecha <span className="required-star">*</span></label>
                      <input name="com_fecha" type="date" value={formData.com_fecha || ''} onChange={handleChange} min={new Date().toISOString().split('T')[0]}
                        className={`w-full p-3 bg-white border-2 rounded-md outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium mt-1 ${errors.com_fecha ? 'border-red-400' : 'border-slate-300'}`} />
                      {errors.com_fecha && <p className="text-red-500 text-xs mt-1">{errors.com_fecha}</p>}
                    </div>
                  </div>
                  {/* ── Productos ── */}
                  <div className="border border-slate-200 rounded-lg p-3 bg-slate-50/30">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Productos</label>
                    {/* ── Fila de búsqueda (toggle + input) ── */}
                    <div className="grid grid-cols-2 gap-2 mb-2">
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Buscar por</label>
                        <div className="flex gap-1 mt-1">
                          <button type="button" onClick={() => { setBuscadorSearchMode('proveedor'); setBuscadorProducto(''); setProdSelector(''); }}
                            className={`px-3 py-1.5 rounded text-[10px] font-bold uppercase tracking-wider transition-all ${buscadorSearchMode === 'proveedor' ? 'bg-orange-500 text-white shadow-sm' : 'bg-slate-100 text-slate-500 hover:bg-orange-100'}`}>
                            Proveedor
                          </button>
                          <button type="button" onClick={() => { setBuscadorSearchMode('producto'); setBuscadorProducto(''); setProdSelector(''); }}
                            className={`px-3 py-1.5 rounded text-[10px] font-bold uppercase tracking-wider transition-all ${buscadorSearchMode === 'producto' ? 'bg-orange-500 text-white shadow-sm' : 'bg-slate-100 text-slate-500 hover:bg-orange-100'}`}>
                            Producto
                          </button>
                        </div>
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Filtrar</label>
                        <div className="relative mt-1">
                          <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                          <input value={buscadorProducto}
                            onChange={(e) => { setBuscadorProducto(e.target.value); setProdSelector(''); }}
                            placeholder={buscadorSearchMode === 'proveedor' ? 'Buscar proveedor...' : 'Buscar producto...'}
                            className="w-full pl-7 pr-2 py-2 bg-white border border-slate-300 rounded-md outline-none focus:ring-2 focus:ring-blue-500 text-xs font-medium" />
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 mb-2">
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Proveedor <span className="required-star">*</span></label>
                        <select name="com_prov_id_fk" value={formData.com_prov_id_fk || ''} onChange={handleChange}
                          disabled={buscadorSearchMode === 'producto' && !!formData.com_prov_id_fk}
                          className={`w-full p-2 text-xs border rounded-md outline-none focus:ring-2 focus:ring-blue-500 mt-0.5 ${errors.com_prov_id_fk ? 'border-red-400' : 'border-slate-300'} ${buscadorSearchMode === 'producto' && !!formData.com_prov_id_fk ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : ''}`}>
                          <option value="">Seleccionar proveedor...</option>
                          {proveedores
                            .filter(p => buscadorSearchMode !== 'proveedor' || !buscadorProducto ||
                              p.prov_id.toLowerCase().includes(buscadorProducto.toLowerCase()) ||
                              p.prov_nombre.toLowerCase().includes(buscadorProducto.toLowerCase()))
                            .map(p => <option key={p.prov_id} value={p.prov_id}>{p.prov_id} - {p.prov_nombre}</option>)}
                        </select>
                        {errors.com_prov_id_fk && <p className="text-red-500 text-[10px] mt-0.5">{errors.com_prov_id_fk}</p>}
                      </div>
                      <div>
                        {buscadorSearchMode === 'producto' && (buscadorProvId || formData.com_prov_id_fk) ? (
                          <>
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Producto ID</label>
                            <select value={prodSelector} onChange={(e) => handleProductSelect(e.target.value)} className="w-full p-2 text-xs border border-slate-300 rounded-md outline-none focus:ring-2 focus:ring-blue-500 mt-0.5">
                              <option value="">Seleccionar producto...</option>
                              {(productosDisponibles || [])
                                .filter(p => p.estado === 'Activo' && productosProveedor.some(pp => String(pp.proveedor_id) === String(buscadorProvId || formData.com_prov_id_fk) && String(pp.producto_id) === String(p.id)))
                                .filter(p => !buscadorProducto || p.id.toLowerCase().includes(buscadorProducto.toLowerCase()) || p.nombre.toLowerCase().includes(buscadorProducto.toLowerCase()))
                                .map(p => (
                                  <option key={p.id} value={p.id}>{p.id} — {p.nombre}</option>
                              ))}
                            </select>
                          </>
                        ) : buscadorSearchMode === 'producto' ? (
                          <div className="flex items-center justify-center p-2 border-2 border-dashed border-slate-200 rounded-md bg-slate-50 h-[38px] mt-0.5">
                            <p className="text-[11px] text-slate-400 italic">Seleccione un proveedor primero</p>
                          </div>
                        ) : (
                          <div className="flex items-center justify-center p-2 border-2 border-dashed border-slate-200 rounded-md bg-slate-50 h-[38px] mt-0.5">
                            <p className="text-[11px] text-slate-400 italic">Cambie a modo Producto para seleccionar</p>
                          </div>
                        )}
                      </div>
                      <div>
                        <input value={prodCantidad} onChange={(e) => setProdCantidad(e.target.value)} type="number" min="1" max={CANTIDAD_MAXIMA} placeholder="Cant." className="w-full p-2 text-xs border border-slate-300 rounded-md outline-none focus:ring-2 focus:ring-blue-500" />
                      </div>
                      <div>
                        <input value={prodPrecio} onChange={(e) => setProdPrecio(e.target.value)} type="number" step="0.01" min="0.01" placeholder="Precio U." readOnly className="w-full p-2 text-xs border border-slate-200 rounded-md outline-none bg-slate-50 text-slate-500 cursor-not-allowed" />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">F. Fabricación</label>
                        <input value={prodFechaFabricacion} onChange={(e) => setProdFechaFabricacion(e.target.value)} type="date" min={dateRangeProps().minFab} max={dateRangeProps().maxFab} className="w-full p-2 text-xs border border-slate-300 rounded-md outline-none focus:ring-2 focus:ring-blue-500 mt-0.5" />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">F. Vencimiento</label>
                        <input value={prodFechaVencimiento} onChange={(e) => setProdFechaVencimiento(e.target.value)} type="date" min={dateRangeProps().minVen} max={dateRangeProps().maxVen} className="w-full p-2 text-xs border border-slate-300 rounded-md outline-none focus:ring-2 focus:ring-blue-500 mt-0.5" />
                      </div>
                      <div className="col-span-2">
                        <button type="button" onClick={agregarProductoCompra} className="w-full p-2 text-xs font-bold text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-all flex items-center justify-center gap-1">
                          <Plus size={14} /> Agregar Producto
                        </button>
                      </div>
                    </div>
                    {productosSeleccionados.length > 0 && (
                      <div className="max-h-28 overflow-y-auto border border-slate-200 rounded-md bg-white">
                        <table className="w-full text-xs">
                          <thead className="bg-slate-100 text-slate-500 font-bold uppercase">
                            <tr><th className="p-2 text-left">Producto</th><th className="p-2 text-right">Cant.</th><th className="p-2 text-right">P/U</th><th className="p-2 text-right">Subtotal</th><th className="p-2 text-right">F. Fab.</th><th className="p-2 text-right">F. Ven.</th><th className="p-2 w-12"></th></tr>
                          </thead>
                          <tbody>
                            {productosSeleccionados.map(p => {
                              const editando = editandoProductoId === p.pro_id;
                              return (
                                <tr key={p.pro_id} className={`border-t border-slate-100 ${editando ? 'bg-blue-50/40' : ''}`}>
                                  <td className="p-2 text-slate-700">{p.pro_nombre}</td>
                                  <td className="p-2 text-right text-slate-600">
                                    {editando ? (
                                      <input type="number" min="1" max={CANTIDAD_MAXIMA} value={editCantidadValor}
                                        onChange={e => setEditCantidadValor(e.target.value)}
                                        className="w-14 p-1 text-xs border border-blue-300 rounded outline-none focus:ring-1 focus:ring-blue-400 text-right" />
                                    ) : (
                                      <span>{p.cantidad}</span>
                                    )}
                                  </td>
                                  <td className="p-2 text-right text-slate-600">${p.precio_unitario.toFixed(2)}</td>
                                  <td className="p-2 text-right text-slate-800 font-bold">${p.subtotal.toFixed(2)}</td>
                                  <td className="p-2 text-right text-slate-600 text-[10px]">
                                    {editando ? (
                                      <input type="date" value={editFabValor}
                                        onChange={e => setEditFabValor(e.target.value)}
                                        min={dateRangeProps().minFab} max={dateRangeProps().maxFab}
                                        className="w-24 p-1 text-xs border border-blue-300 rounded outline-none focus:ring-1 focus:ring-blue-400" />
                                    ) : (
                                      <span>{p.fecha_fabricacion || '-'}</span>
                                    )}
                                  </td>
                                  <td className="p-2 text-right text-slate-600 text-[10px]">
                                    {editando ? (
                                      <input type="date" value={editVenValor}
                                        onChange={e => setEditVenValor(e.target.value)}
                                        min={dateRangeProps().minVen} max={dateRangeProps().maxVen}
                                        className="w-24 p-1 text-xs border border-blue-300 rounded outline-none focus:ring-1 focus:ring-blue-400" />
                                    ) : (
                                      <span>{p.fecha_vencimiento || '-'}</span>
                                    )}
                                  </td>
                                  <td className="p-2 text-center">
                                    {editando ? (
                                      <span className="inline-flex items-center gap-0.5">
                                        <button type="button" onClick={guardarEdicion} className="text-emerald-500 hover:text-emerald-700 transition-colors p-0.5" title="Guardar"><span className="text-sm font-bold">✓</span></button>
                                        <button type="button" onClick={cancelarEdicion} className="text-red-400 hover:text-red-600 transition-colors p-0.5" title="Cancelar"><span className="text-sm font-bold">✗</span></button>
                                      </span>
                                    ) : (
                                      <span className="inline-flex items-center gap-0.5">
                                        <button type="button" onClick={() => iniciarEdicion(p.pro_id)} className="text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors p-0.5 rounded" title="Editar producto"><Edit3 size={14} /></button>
                                        <button type="button" onClick={() => quitarProductoCompra(p.pro_id)} className="text-red-400 hover:text-red-600 transition-colors p-0.5" title="Quitar producto"><X size={14} /></button>
                                      </span>
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                    {productosSeleccionados.length === 0 && (
                      <p className="text-xs text-slate-400 italic">Agrega al menos un producto a la compra</p>
                    )}
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total</label>
                      <input name="com_total" type="text" value={formData.com_total ? `$${parseFloat(formData.com_total).toFixed(2)}` : '$0.00'} readOnly
                        className="w-full p-3 bg-slate-100 border border-slate-200 rounded-md outline-none text-sm font-bold text-blue-700 mt-1" />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Estado</label>
                      <select name="com_estado" value={formData.com_estado || 'Pendiente'} onChange={handleChange}
                        className="w-full p-3 bg-white border-2 border-slate-300 rounded-md outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium mt-1">
                        {ESTADOS_CREAR.map(e => <option key={e} value={e}>{e}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Observación</label>
                      <textarea name="com_observacion" rows="3" value={formData.com_observacion || ''} onChange={handleChange}
                        placeholder="Notas..."
                        className="w-full p-3 bg-white border-2 border-slate-300 rounded-md outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium mt-1 resize-none" />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Comprobante de pago (PDF / imagen)</label>
                    <input type="file" accept=".pdf,.png,.jpg,.jpeg,.webp" onChange={(e) => handleFileChange(e, false)}
                      className="w-full p-2 bg-white border-2 border-slate-300 rounded-md outline-none text-sm font-medium mt-1 file:mr-3 file:py-1.5 file:px-3 file:rounded file:text-xs file:font-bold file:bg-blue-50 file:text-blue-600 file:border-0 hover:file:bg-blue-100 transition-colors" />
                    {comprobanteFile && <p className="text-xs text-emerald-600 font-medium mt-1">Archivo: {comprobanteFile.nombre}</p>}
                  </div>
                </>
              )}

              {tab === 'proveedores' && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">ID <span className="required-star">*</span></label>
                      <input name="id" value={formData.id || ''} disabled className="w-full p-3 bg-slate-100 border border-slate-200 rounded-md outline-none text-sm font-medium text-slate-400 mt-1" />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">NIT <span className="required-star">*</span></label>
                      <input name="nit" value={formData.nit || ''} onChange={handleChange}
                        className={`w-full p-3 bg-white border-2 rounded-md outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium mt-1 ${errors.nit ? 'border-red-400' : 'border-slate-300'}`} />
                      {errors.nit && <p className="text-red-500 text-xs mt-1">{errors.nit}</p>}
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Nombre <span className="required-star">*</span></label>
                    <input name="nombre" value={formData.nombre || ''} onChange={handleChange}
                      className={`w-full p-3 bg-white border-2 rounded-md outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium mt-1 ${errors.nombre ? 'border-red-400' : 'border-slate-300'}`} />
                    {errors.nombre && <p className="text-red-500 text-xs mt-1">{errors.nombre}</p>}
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Tipo <span className="required-star">*</span></label>
                    <select name="tipo" value={formData.tipo || ''} onChange={handleChange}
                      className={`w-full p-3 bg-white border-2 rounded-md outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium mt-1 ${errors.tipo ? 'border-red-400' : 'border-slate-300'}`}>
                      <option value="">Seleccionar...</option>
                      {errors.tipo && <p className="text-red-500 text-xs mt-1">{errors.tipo}</p>}
                      <option value="Laboratorio">Laboratorio</option>
                      <option value="Distribuidor">Distribuidor</option>
                      <option value="Importador">Importador</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Contacto <span className="required-star">*</span></label>
                    <input name="contacto" value={formData.contacto || ''} onChange={handleChange}
                      className={`w-full p-3 bg-white border-2 rounded-md outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium mt-1 ${errors.contacto ? 'border-red-400' : 'border-slate-300'}`} />
                    {errors.contacto && <p className="text-red-500 text-xs mt-1">{errors.contacto}</p>}
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Dirección <span className="required-star">*</span></label>
                    <input name="direccion" value={formData.direccion || ''} onChange={handleChange}
                      className={`w-full p-3 bg-white border-2 rounded-md outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium mt-1 ${errors.direccion ? 'border-red-400' : 'border-slate-300'}`} />
                    {errors.direccion && <p className="text-red-500 text-xs mt-1">{errors.direccion}</p>}
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Email <span className="required-star">*</span></label>
                    <input name="email" type="email" value={formData.email || ''} onChange={handleChange}
                      className={`w-full p-3 bg-white border-2 rounded-md outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium mt-1 ${errors.email ? 'border-red-400' : 'border-slate-300'}`} />
                    {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                  </div>
                </>
              )}

              <button type="submit" disabled={formSubmitting || Object.keys(errors).length > 0}
                className="w-full bg-blue-600 text-white font-bold py-3 rounded-md text-sm uppercase tracking-wider hover:bg-blue-700 disabled:bg-slate-300 transition-all flex items-center justify-center gap-2">
                {formSubmitting ? <Loader2 className="animate-spin" size={16} /> : null}
                {tab === 'compras' ? 'Registrar Compra' : 'Registrar Proveedor'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal Editar Compra */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowEditModal(false)} />
          <div ref={focusTrapRef} className="relative bg-white rounded-lg shadow-2xl border border-slate-100 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-800">Editar Compra {editData.comp_id}</h3>
              <button onClick={() => setShowEditModal(false)} className="p-2 hover:bg-slate-100 rounded-md transition-colors"><X size={18} className="text-slate-400" /></button>
            </div>
            <form onSubmit={handleEditCompra} className="p-5 space-y-4">
              {formError && <div className="p-3 bg-red-50 text-red-600 text-xs font-bold rounded-md border border-red-100">{formError}</div>}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Fecha</label>
                  <input name="comp_fecha" type="date" value={editData.comp_fecha || ''} onChange={handleEditChange} min={new Date().toISOString().split('T')[0]}
                    className="w-full p-3 bg-white border-2 border-slate-300 rounded-md outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium mt-1" />
                </div>
              </div>
              {/* ── Productos (editar) ── */}
              <div className="border border-slate-200 rounded-lg p-3 bg-slate-50/30">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Productos</label>
                <div className="grid grid-cols-2 gap-2 mb-2">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Buscar por</label>
                    <div className="flex gap-1 mt-1">
                      <button type="button" onClick={() => { setBuscadorSearchMode('proveedor'); setBuscadorProducto(''); setProdSelector(''); }}
                        className={`px-3 py-1.5 rounded text-[10px] font-bold uppercase tracking-wider transition-all ${buscadorSearchMode === 'proveedor' ? 'bg-orange-500 text-white shadow-sm' : 'bg-slate-100 text-slate-500 hover:bg-orange-100'}`}>
                        Proveedor
                      </button>
                      <button type="button" onClick={() => { setBuscadorSearchMode('producto'); setBuscadorProducto(''); setProdSelector(''); }}
                        className={`px-3 py-1.5 rounded text-[10px] font-bold uppercase tracking-wider transition-all ${buscadorSearchMode === 'producto' ? 'bg-orange-500 text-white shadow-sm' : 'bg-slate-100 text-slate-500 hover:bg-orange-100'}`}>
                        Producto
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Filtrar</label>
                    <div className="relative mt-1">
                      <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input value={buscadorProducto}
                        onChange={(e) => { setBuscadorProducto(e.target.value); setProdSelector(''); }}
                        placeholder={buscadorSearchMode === 'proveedor' ? 'Buscar proveedor...' : 'Buscar producto...'}
                        className="w-full pl-7 pr-2 py-2 bg-white border border-slate-300 rounded-md outline-none focus:ring-2 focus:ring-blue-500 text-xs font-medium" />
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 mb-2">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Proveedor <span className="required-star">*</span></label>
                    <select name="comp_prov_id_fk" value={editData.comp_prov_id_fk || ''} onChange={handleEditChange}
                      disabled={editData.comp_tiene_detalles}
                      className={`w-full p-2 text-xs border rounded-md outline-none focus:ring-2 focus:ring-blue-500 mt-0.5 ${editData.comp_tiene_detalles ? 'border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed' : 'border-slate-300'}`}>
                      <option value="">Seleccionar proveedor...</option>
                      {proveedores
                        .filter(p => buscadorSearchMode !== 'proveedor' || !buscadorProducto ||
                          p.prov_id.toLowerCase().includes(buscadorProducto.toLowerCase()) ||
                          p.prov_nombre.toLowerCase().includes(buscadorProducto.toLowerCase()))
                        .map(p => <option key={p.prov_id} value={p.prov_id}>{p.prov_id} - {p.prov_nombre}</option>)}
                    </select>
                    {editData.comp_tiene_detalles && (
                      <p className="text-[10px] text-amber-600 mt-0.5">No se puede cambiar — la compra ya tiene productos</p>
                    )}
                  </div>
                  <div>
                    {buscadorSearchMode === 'producto' && (buscadorProvId || editData.comp_prov_id_fk) ? (
                      <>
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Producto ID</label>
                        <select value={prodSelector} onChange={(e) => handleProductSelect(e.target.value)} className="w-full p-2 text-xs border border-slate-300 rounded-md outline-none focus:ring-2 focus:ring-blue-500 mt-0.5">
                          <option value="">Seleccionar producto...</option>
                          {(productosDisponibles || [])
                            .filter(p => p.estado === 'Activo' && productosProveedor.some(pp => String(pp.proveedor_id) === String(buscadorProvId || editData.comp_prov_id_fk) && String(pp.producto_id) === String(p.id)))
                            .filter(p => !buscadorProducto || p.id.toLowerCase().includes(buscadorProducto.toLowerCase()) || p.nombre.toLowerCase().includes(buscadorProducto.toLowerCase()))
                            .map(p => (
                              <option key={p.id} value={p.id}>{p.id} — {p.nombre}</option>
                          ))}
                        </select>
                      </>
                    ) : buscadorSearchMode === 'producto' ? (
                      <div className="flex items-center justify-center p-2 border-2 border-dashed border-slate-200 rounded-md bg-slate-50 h-[38px] mt-0.5">
                        <p className="text-[11px] text-slate-400 italic">Seleccione un proveedor primero</p>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center p-2 border-2 border-dashed border-slate-200 rounded-md bg-slate-50 h-[38px] mt-0.5">
                        <p className="text-[11px] text-slate-400 italic">Cambie a modo Producto para seleccionar</p>
                      </div>
                    )}
                  </div>
                  <div>
                    <input value={prodCantidad} onChange={(e) => setProdCantidad(e.target.value)} type="number" min="1" max={CANTIDAD_MAXIMA} placeholder="Cant." className="w-full p-2 text-xs border border-slate-300 rounded-md outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <input value={prodPrecio} onChange={(e) => setProdPrecio(e.target.value)} type="number" step="0.01" min="0.01" placeholder="Precio U." readOnly className="w-full p-2 text-xs border border-slate-200 rounded-md outline-none bg-slate-50 text-slate-500 cursor-not-allowed" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">F. Fabricación</label>
                    <input value={prodFechaFabricacion} onChange={(e) => setProdFechaFabricacion(e.target.value)} type="date" min={dateRangeProps().minFab} max={dateRangeProps().maxFab} className="w-full p-2 text-xs border border-slate-300 rounded-md outline-none focus:ring-2 focus:ring-blue-500 mt-0.5" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">F. Vencimiento</label>
                    <input value={prodFechaVencimiento} onChange={(e) => setProdFechaVencimiento(e.target.value)} type="date" min={dateRangeProps().minVen} max={dateRangeProps().maxVen} className="w-full p-2 text-xs border border-slate-300 rounded-md outline-none focus:ring-2 focus:ring-blue-500 mt-0.5" />
                  </div>
                  <div className="col-span-2">
                    <button type="button" onClick={() => agregarProductoEditCompra()} className="w-full p-2 text-xs font-bold text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-all flex items-center justify-center gap-1">
                      <Plus size={14} /> Agregar Producto
                    </button>
                  </div>
                </div>
                {productosSeleccionados.length > 0 && (
                  <div className="max-h-28 overflow-y-auto border border-slate-200 rounded-md bg-white">
                    <table className="w-full text-xs">
                      <thead className="bg-slate-100 text-slate-500 font-bold uppercase">
                        <tr><th className="p-2 text-left">Producto</th><th className="p-2 text-right">Cant.</th><th className="p-2 text-right">P/U</th><th className="p-2 text-right">Subtotal</th><th className="p-2 text-right">F. Fab.</th><th className="p-2 text-right">F. Ven.</th><th className="p-2 w-12"></th></tr>
                      </thead>
                      <tbody>
                        {productosSeleccionados.map(p => {
                          const editando = editandoProductoId === p.pro_id;
                          return (
                            <tr key={p.pro_id} className={`border-t border-slate-100 ${editando ? 'bg-blue-50/40' : ''}`}>
                              <td className="p-2 text-slate-700">{p.pro_nombre}</td>
                              <td className="p-2 text-right text-slate-600">
                                {editando ? (
                                  <input type="number" min="1" max={CANTIDAD_MAXIMA} value={editCantidadValor}
                                    onChange={e => setEditCantidadValor(e.target.value)}
                                    className="w-14 p-1 text-xs border border-blue-300 rounded outline-none focus:ring-1 focus:ring-blue-400 text-right" />
                                ) : (
                                  <span>{p.cantidad}</span>
                                )}
                              </td>
                              <td className="p-2 text-right text-slate-600">${p.precio_unitario.toFixed(2)}</td>
                              <td className="p-2 text-right text-slate-800 font-bold">${p.subtotal.toFixed(2)}</td>
                              <td className="p-2 text-right text-slate-600 text-[10px]">
                                {editando ? (
                                  <input type="date" value={editFabValor}
                                    onChange={e => setEditFabValor(e.target.value)}
                                    min={dateRangeProps().minFab} max={dateRangeProps().maxFab}
                                    className="w-24 p-1 text-xs border border-blue-300 rounded outline-none focus:ring-1 focus:ring-blue-400" />
                                ) : (
                                  <span>{p.fecha_fabricacion || '-'}</span>
                                )}
                              </td>
                              <td className="p-2 text-right text-slate-600 text-[10px]">
                                {editando ? (
                                  <input type="date" value={editVenValor}
                                    onChange={e => setEditVenValor(e.target.value)}
                                    min={dateRangeProps().minVen} max={dateRangeProps().maxVen}
                                    className="w-24 p-1 text-xs border border-blue-300 rounded outline-none focus:ring-1 focus:ring-blue-400" />
                                ) : (
                                  <span>{p.fecha_vencimiento || '-'}</span>
                                )}
                              </td>
                              <td className="p-2 text-center">
                                {editando ? (
                                  <span className="inline-flex items-center gap-0.5">
                                    <button type="button" onClick={guardarEdicion} className="text-emerald-500 hover:text-emerald-700 transition-colors p-0.5" title="Guardar"><span className="text-sm font-bold">✓</span></button>
                                    <button type="button" onClick={cancelarEdicion} className="text-red-400 hover:text-red-600 transition-colors p-0.5" title="Cancelar"><span className="text-sm font-bold">✗</span></button>
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-0.5">
                                    <button type="button" onClick={() => iniciarEdicion(p.pro_id)} className="text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors p-0.5 rounded" title="Editar producto"><Edit3 size={14} /></button>
                                    <button type="button" onClick={() => quitarProductoEditCompra(p.pro_id)} className="text-red-400 hover:text-red-600 transition-colors p-0.5" title="Quitar producto"><X size={14} /></button>
                                  </span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
                {productosSeleccionados.length === 0 && (
                  <p className="text-xs text-slate-400 italic">Agrega al menos un producto a la compra</p>
                )}
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total</label>
                  <input name="comp_total" type="text" value={editData.comp_total ? `$${parseFloat(editData.comp_total).toFixed(2)}` : '$0.00'} readOnly
                    className="w-full p-3 bg-slate-100 border border-slate-200 rounded-md outline-none text-sm font-bold text-blue-700 mt-1" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Estado</label>
                  <select name="comp_estado" value={editData.comp_estado || 'Pendiente'} onChange={handleEditChange}
                    className="w-full p-3 bg-white border-2 border-slate-300 rounded-md outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium mt-1">
                    {ESTADOS.map(e => <option key={e} value={e}>{e}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Observación</label>
                  <textarea name="comp_observacion" rows="3" value={editData.comp_observacion || ''} onChange={handleEditChange}
                    placeholder="Notas adicionales..."
                    className="w-full p-3 bg-white border-2 border-slate-300 rounded-md outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium mt-1 resize-none" />
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Comprobante de pago (PDF / imagen)</label>
                <input type="file" accept=".pdf,.png,.jpg,.jpeg,.webp" onChange={(e) => handleFileChange(e, true)}
                  className="w-full p-2 bg-white border-2 border-slate-300 rounded-md outline-none text-sm font-medium mt-1 file:mr-3 file:py-1.5 file:px-3 file:rounded file:text-xs file:font-bold file:bg-blue-50 file:text-blue-600 file:border-0 hover:file:bg-blue-100 transition-colors" />
                {comprobanteFile && <p className="text-xs text-emerald-600 font-medium mt-1">Nuevo archivo: {comprobanteFile.nombre}</p>}
                {editData.comp_comprobante && !comprobanteFile && (
                  <p className="text-xs text-slate-400 font-medium mt-1">Ya existe un comprobante. Seleccione un nuevo archivo para reemplazarlo.</p>
                )}
              </div>

              <button type="submit" disabled={formSubmitting || Object.keys(errors).length > 0}
                className="w-full bg-blue-600 text-white font-bold py-3 rounded-md text-sm uppercase tracking-wider hover:bg-blue-700 disabled:bg-slate-300 transition-all flex items-center justify-center gap-2">
                {formSubmitting ? <Loader2 className="animate-spin" size={16} /> : null}
                Guardar Cambios
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal Editar Proveedor */}
      {showEditProveedorModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowEditProveedorModal(false)} />
          <div ref={focusTrapRef} className="relative bg-white rounded-lg shadow-2xl border border-slate-100 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-800">Editar Proveedor {editProveedorData.id}</h3>
              <button onClick={() => setShowEditProveedorModal(false)} className="p-2 hover:bg-slate-100 rounded-md transition-colors"><X size={18} className="text-slate-400" /></button>
            </div>
            <form onSubmit={handleEditProveedor} className="p-5 space-y-4">
              {formError && <div className="p-3 bg-red-50 text-red-600 text-xs font-bold rounded-md border border-red-100">{formError}</div>}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">ID</label>
                  <input name="id" value={editProveedorData.id || ''} disabled className="w-full p-3 bg-slate-100 border border-slate-200 rounded-md outline-none text-sm font-medium text-slate-400 mt-1" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">NIT</label>
                  <input name="nit" value={editProveedorData.nit || ''} onChange={handleEditProveedorChange}
                    className="w-full p-3 bg-white border-2 border-slate-300 rounded-md outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium mt-1" />
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Nombre</label>
                <input name="nombre" value={editProveedorData.nombre || ''} onChange={handleEditProveedorChange}
                  className="w-full p-3 bg-white border-2 border-slate-300 rounded-md outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium mt-1" />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Tipo</label>
                <select name="tipo" value={editProveedorData.tipo || ''} onChange={handleEditProveedorChange}
                  className="w-full p-3 bg-white border-2 border-slate-300 rounded-md outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium mt-1">
                  <option value="Laboratorio">Laboratorio</option>
                  <option value="Distribuidor">Distribuidor</option>
                  <option value="Importador">Importador</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Contacto</label>
                  <input name="contacto" value={editProveedorData.contacto || ''} onChange={handleEditProveedorChange}
                    className="w-full p-3 bg-white border-2 border-slate-300 rounded-md outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium mt-1" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Dirección</label>
                  <input name="direccion" value={editProveedorData.direccion || ''} onChange={handleEditProveedorChange}
                    className="w-full p-3 bg-white border-2 border-slate-300 rounded-md outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium mt-1" />
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Email</label>
                <input name="email" type="email" value={editProveedorData.email || ''} onChange={handleEditProveedorChange}
                  className="w-full p-3 bg-white border-2 border-slate-300 rounded-md outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium mt-1" />
              </div>

              <button type="submit" disabled={formSubmitting || Object.keys(errors).length > 0}
                className="w-full bg-blue-600 text-white font-bold py-3 rounded-md text-sm uppercase tracking-wider hover:bg-blue-700 disabled:bg-slate-300 transition-all flex items-center justify-center gap-2">
                {formSubmitting ? <Loader2 className="animate-spin" size={16} /> : null}
                Guardar Cambios
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal Ver Proveedor */}
      {showViewProveedorModal && viewProveedorData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => { setShowViewProveedorModal(false); setViewProveedorData(null); setProductosProveedor([]); }} />
          <div className="relative bg-white rounded-lg shadow-2xl border border-slate-100 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-800">Detalle del Proveedor</h3>
              <button onClick={() => { setShowViewProveedorModal(false); setViewProveedorData(null); setProductosProveedor([]); }} className="p-2 hover:bg-slate-100 rounded-md transition-colors"><X size={18} className="text-slate-400" /></button>
            </div>
            <div className="p-5 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-slate-50 rounded-lg">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">ID</p>
                  <p className="text-sm font-bold text-slate-700 mt-0.5">{viewProveedorData.prov_id}</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">NIT</p>
                  <p className="text-sm font-bold text-slate-700 mt-0.5">{viewProveedorData.prov_nit || '-'}</p>
                </div>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Nombre</p>
                <p className="text-sm font-bold text-slate-700 mt-0.5">{viewProveedorData.prov_nombre || '-'}</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-slate-50 rounded-lg">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Tipo</p>
                  <p className="text-sm font-bold text-slate-700 mt-0.5">
                    <span className="px-2 py-1 rounded-md text-[10px] font-bold uppercase bg-slate-200 text-slate-600">{viewProveedorData.prov_tipo || '-'}</span>
                  </p>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Contacto</p>
                  <p className="text-sm font-bold text-slate-700 mt-0.5">{viewProveedorData.prov_contacto || '-'}</p>
                </div>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Dirección</p>
                <p className="text-sm font-bold text-slate-700 mt-0.5">{viewProveedorData.prov_direccion || '-'}</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Email</p>
                <p className="text-sm font-bold text-slate-700 mt-0.5">{viewProveedorData.prov_email || '-'}</p>
              </div>

              {/* Productos del proveedor */}
              <div className="border-t border-slate-100 pt-3">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Productos que vende</p>
                {productosProveedor.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">Sin productos asignados</p>
                ) : (
                  <div className="max-h-28 overflow-y-auto space-y-1">
                    {productosProveedor.map(p => (
                      <div key={p.id} className="flex items-center justify-between p-2 bg-slate-50 rounded-md">
                        <span className="text-xs font-medium text-slate-700">{p.id} — {p.nombre}</span>
                        <span className="text-[11px] font-bold text-emerald-600">${p.precio?.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Vista Previa Comprobante */}
      {showComprobanteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70" onClick={() => setShowComprobanteModal(null)} />
          <div className="relative bg-white rounded-lg shadow-2xl border border-slate-100 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-800">Comprobante de pago — {showComprobanteModal.comp_id}</h3>
              <div className="flex items-center gap-2">
                <a
                  href={`data:${showComprobanteModal.comp_comprobante_tipo || 'application/pdf'};base64,${showComprobanteModal.comp_comprobante}`}
                  download={`comprobante_${showComprobanteModal.comp_id}.${showComprobanteModal.comp_comprobante_tipo?.includes('pdf') ? 'pdf' : 'png'}`}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-xs font-bold rounded-md hover:bg-blue-700 transition-colors uppercase tracking-wider"
                >
                  <Download size={14} /> Descargar
                </a>
                <button onClick={() => setShowComprobanteModal(null)} className="p-2 hover:bg-slate-100 rounded-md transition-colors"><X size={18} className="text-slate-400" /></button>
              </div>
            </div>
            <div className="p-4 flex items-center justify-center min-h-[300px] bg-slate-50">
              {showComprobanteModal.comp_comprobante_tipo === 'application/pdf' ? (
                <iframe
                  src={`data:application/pdf;base64,${showComprobanteModal.comp_comprobante}`}
                  className="w-full h-[70vh] border-0 rounded"
                  title="Comprobante PDF"
                />
              ) : (
                <img
                  src={`data:${showComprobanteModal.comp_comprobante_tipo || 'image/png'};base64,${showComprobanteModal.comp_comprobante}`}
                  alt="Comprobante"
                  className="max-w-full max-h-[70vh] object-contain rounded"
                />
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal Ver Detalle Compra */}
      {showViewModal && viewData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => { setShowViewModal(null); setViewData(null); }} />
          <div className="relative bg-white rounded-lg shadow-2xl border border-slate-100 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-800">Detalle de Compra {showViewModal}</h3>
              <div className="flex items-center gap-2">
                {viewData.comp_comprobante && (
                  <button onClick={async () => {
                    try {
                      const det = await comprasService.buscar(showViewModal);
                      setShowComprobanteModal(det);
                    } catch (_) {}
                  }} title="Ver comprobante"
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 text-white text-xs font-bold rounded-md hover:bg-emerald-700 transition-colors uppercase tracking-wider">
                    <FileText size={14} /> Comprobante
                  </button>
                )}
                <button onClick={() => { setShowViewModal(null); setViewData(null); }} className="p-2 hover:bg-slate-100 rounded-md transition-colors"><X size={18} className="text-slate-400" /></button>
              </div>
            </div>
            {viewLoading ? (
              <div className="flex items-center justify-center p-12">
                <Loader2 className="animate-spin text-blue-600" size={32} />
              </div>
            ) : (
              <div className="p-5 space-y-4">
                {/* Datos generales */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-50 rounded-lg p-3">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">ID</p>
                    <p className="text-sm font-bold text-slate-800">{viewData.comp_id}</p>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-3">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Fecha</p>
                    <p className="text-sm font-bold text-slate-800">{viewData.comp_fecha || '-'}</p>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-3">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Proveedor</p>
                    <p className="text-sm font-bold text-slate-800">{viewData.proveedor ? viewData.proveedor.prov_nombre : (viewData.comp_prov_id_fk || '-')}</p>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-3">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Estado</p>
                    <div className="mt-1">{estadoBadge(viewData.comp_estado)}</div>
                  </div>
                </div>
                <div className="bg-slate-50 rounded-lg p-3">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total</p>
                  <p className="text-lg font-black text-blue-700">${parseFloat(viewData.comp_total || 0).toLocaleString()}</p>
                </div>
                {viewData.comp_observacion && (
                  <div className="bg-slate-50 rounded-lg p-3">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Observación</p>
                    <p className="text-sm text-slate-600">{viewData.comp_observacion}</p>
                  </div>
                )}

                {/* Productos */}
                <div className="border border-slate-200 rounded-lg p-3 bg-slate-50/30">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">Productos</p>
                  {viewData.productos && viewData.productos.length > 0 ? (
                    <div className="max-h-40 overflow-y-auto border border-slate-200 rounded-md bg-white">
                      <table className="w-full text-xs">
                        <thead className="bg-slate-100 text-slate-500 font-bold uppercase">
                          <tr><th className="p-2 text-left">Producto</th><th className="p-2 text-right">Cant.</th><th className="p-2 text-right">P/U</th><th className="p-2 text-right">Subtotal</th></tr>
                        </thead>
                        <tbody>
                          {viewData.productos.map((p, idx) => (
                            <tr key={idx} className="border-t border-slate-100">
                              <td className="p-2 text-slate-700">{p.pro_nombre}</td>
                              <td className="p-2 text-right text-slate-600">{p.cantidad}</td>
                              <td className="p-2 text-right text-slate-600">${parseFloat(p.precio_unitario).toFixed(2)}</td>
                              <td className="p-2 text-right text-slate-800 font-bold">${parseFloat(p.subtotal).toFixed(2)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 italic">Sin productos registrados en esta compra</p>
                  )}
                </div>
              </div>
            )}
            <div className="flex justify-end p-4 border-t border-slate-100">
              <button onClick={() => { setShowViewModal(null); setViewData(null); }}
                className="px-5 py-2.5 bg-slate-100 text-slate-600 text-xs font-bold rounded-md hover:bg-slate-200 transition-colors uppercase tracking-wider">
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmación de edición — Compra Recibida */}
      <ConfirmModal
        open={confirmEditRecibida}
        title="Editar Compra Recibida"
        message="Esta compra ya fue recibida y tiene inventario ingresado. Editar revertirá el inventario actual y lo volverá a ingresar con los nuevos datos. ¿Desea continuar?"
        onConfirm={handleConfirmEditRecibida}
        onCancel={() => setConfirmEditRecibida(false)}
        confirmText="Sí, continuar"
      />

      {/* Confirmación de eliminación — Compra */}
      <ConfirmModal
        open={!!confirmDelete}
        title="Eliminar Compra"
        message={`¿Está seguro de eliminar la compra ${confirmDelete}? Esta acción no se puede deshacer.`}
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(null)}
        confirmText="Eliminar"
        danger
      />

      {/* Confirmación de eliminación — Proveedor */}
      <ConfirmModal
        open={!!confirmDeleteProveedor}
        title="Eliminar Proveedor"
        message={`¿Está seguro de eliminar el proveedor ${confirmDeleteProveedor}? Esta acción no se puede deshacer.`}
        onConfirm={handleDeleteProveedor}
        onCancel={() => setConfirmDeleteProveedor(null)}
        confirmText="Eliminar"
        danger
      />
    </div>
  );
};

export default Compras;
