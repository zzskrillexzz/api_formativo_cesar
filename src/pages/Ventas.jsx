import React, { useState, useEffect, useRef } from 'react';
import { ShoppingCart, FileText, Users, Search, Plus, X, RefreshCw, Eye, Trash2, Edit3, AlertTriangle, Loader2, Truck, Package, QrCode } from 'lucide-react';
import { ThemeLoader } from '../components/ThemeLoader';
import { pedidosService } from '../api/services/pedidosService';
import { facturasService } from '../api/services/facturasService';
import { clientesService } from '../api/services/clientesService';
import { productosService } from '../api/services/productosService';
import { detallesPedidosService } from '../api/services/detallesPedidosService';
import { devolucionesService } from '../api/services/devolucionesService';
import { anulacionesService } from '../api/services/anulacionesService';
import { useAuth } from '../context/AuthContext';
import { useFocusTrap } from '../hooks/useFocusTrap';
import { ConfirmModal } from '../components/ConfirmModal';
import { useToast } from '../components/Toast';
import { FIELD_LIMITS } from '../utils/fieldLimits';

const Ventas = () => {
  const [tab, setTab] = useState('pedidos');
  const [pedidos, setPedidos] = useState([]);
  const [facturas, setFacturas] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
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
  const [productosDisponibles, setProductosDisponibles] = useState([]);
  const focusTrapRef = useFocusTrap(showModal);
  const [productosSeleccionados, setProductosSeleccionados] = useState([]);
  const [showNewClientForm, setShowNewClientForm] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [comprobanteFileName, setComprobanteFileName] = useState('');
  const lastToastRef = useRef(null); // Evita mostrar el mismo toast repetido

  const [editingPedidoId, setEditingPedidoId] = useState(null);
  const [editingClienteId, setEditingClienteId] = useState(null);
  const [clienteTarjeta, setClienteTarjeta] = useState(null);
  const [showClienteTarjeta, setShowClienteTarjeta] = useState(false);
  const [showConfirmCancel, setShowConfirmCancel] = useState(false);
  const [pedidoACancelar, setPedidoACancelar] = useState(null);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [filtroEstadoPedido, setFiltroEstadoPedido] = useState('');
  const [filtroEstadoFactura, setFiltroEstadoFactura] = useState('');
  const [filtroTipoDocCliente, setFiltroTipoDocCliente] = useState('');
  const POR_PAGINA = 10;
  const [paginaPedidos, setPaginaPedidos] = useState(1);
  const [paginaFacturas, setPaginaFacturas] = useState(1);
  const [paginaClientes, setPaginaClientes] = useState(1);
  const formSnapshotRef = useRef({});
  const [showSubirComprobanteModal, setShowSubirComprobanteModal] = useState(false);
  const [pedidoSubirComprobante, setPedidoSubirComprobante] = useState(null);

  // ── Verificar pago / Notificar ──
  const [showVerificarModal, setShowVerificarModal] = useState(false);
  const [pedidoAVerificar, setPedidoAVerificar] = useState(null);
  const [notifLoading, setNotifLoading] = useState(false);
  const [pedidoComprobanteCargando, setPedidoComprobanteCargando] = useState(false);
  const [showNotificarModal, setShowNotificarModal] = useState(false);
  const [pedidoANotificar, setPedidoANotificar] = useState(null);
  // Estado individual para cada botón del modal notificar
  const [notifLoadingCorreo, setNotifLoadingCorreo] = useState(false);
  const [notifResultadoCorreo, setNotifResultadoCorreo] = useState(null);
  const [notifLoadingFactura, setNotifLoadingFactura] = useState(false);
  const [notifResultadoFactura, setNotifResultadoFactura] = useState(null);
  // ── QR confirmación de entrega ──
  const [showQRModal, setShowQRModal] = useState(false);
  const [pedidoQR, setPedidoQR] = useState(null);
  // Cargar URL guardada en localStorage o usar localhost por defecto
  const [qrBaseUrl, setQrBaseUrl] = useState(() => {
    return localStorage.getItem('qrBaseUrl') || 'http://localhost:5000';
  });
  const [ultimaActualizacion, setUltimaActualizacion] = useState(null);

  // Guardar la URL en localStorage cada vez que cambie
  const actualizarQrUrl = (url) => {
    setQrBaseUrl(url);
    localStorage.setItem('qrBaseUrl', url);
  };

  const abrirQR = async (pedido) => {
    setPedidoQR(pedido);
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    // Intentar obtener URL pública desde el backend (ngrok gestionado por el servidor)
    try {
      const resp = await fetch(`${apiUrl}/public-url`);
      if (resp.ok) {
        const data = await resp.json();
        if (data.url) {
          const url = data.url.replace(/\/$/, '');
          setQrBaseUrl(url);
          localStorage.setItem('qrBaseUrl', url);
          setShowQRModal(true);
          return;
        }
      }
    } catch (_) {
      // backend no disponible o sin ngrok
    }
    // Fallback: detectar ngrok localmente
    try {
      const resp = await fetch('http://localhost:4040/api/tunnels');
      if (resp.ok) {
        const data = await resp.json();
        const tunel = data.tunnels?.find(t => t.config?.addr === 'http://localhost:5000');
        if (tunel?.public_url) {
          const url = tunel.public_url.replace(/\/$/, '');
          setQrBaseUrl(url);
          localStorage.setItem('qrBaseUrl', url);
          setShowQRModal(true);
          return;
        }
      }
    } catch (_) {
      // ngrok no está corriendo o no se pudo detectar
    }
    // Si no se detectó ngrok, usar URL guardada o localhost
    const guardada = localStorage.getItem('qrBaseUrl');
    if (guardada) {
      setQrBaseUrl(guardada);
    } else {
      const host = window.location.hostname;
      if (host !== 'localhost' && host !== '127.0.0.1') {
        const url = `http://${host}:5000`;
        setQrBaseUrl(url);
        localStorage.setItem('qrBaseUrl', url);
      } else {
        setQrBaseUrl('http://localhost:5000');
      }
    }
    setShowQRModal(true);
  };

  // ── Modal de detalle (Pedido / Factura) ──
  const [showDetalle, setShowDetalle] = useState(false);
  const [detalleTipo, setDetalleTipo] = useState(''); // 'pedido' | 'factura'
  const [detalleData, setDetalleData] = useState(null);
  const abrirDetallePedido = async (pedido) => {
    try {
      const [detalles, prods] = await Promise.all([
        detallesPedidosService.listar().catch(() => []),
        productosService.listar().catch(() => [])
      ]);
      const misDetalles = detalles.filter(d => d.det_ped_id_fk === pedido.ped_id);
      const productosMap = {};
      prods.forEach(p => { productosMap[p.id] = p.nombre; });
      const lineas = misDetalles.map(d => ({
        ...d,
        producto_nombre: productosMap[d.det_pro_id_fk] || d.det_pro_id_fk
      }));
      setDetalleData({ ...pedido, lineas });
      setDetalleTipo('pedido');
      setShowDetalle(true);
    } catch {
      setDetalleData(pedido);
      setDetalleTipo('pedido');
      setShowDetalle(true);
    }
  };

  const abrirDetalleFactura = async (factura) => {
    try {
      const pedidoRelacionado = pedidos.find(p => p.ped_id === factura.id);
      const clienteId = pedidoRelacionado?.ped_cli_id_fk;
      const [detalles, prods, clientesList] = await Promise.all([
        detallesPedidosService.listar().catch(() => []),
        productosService.listar().catch(() => []),
        clientesService.listar().catch(() => [])
      ]);
      const misDetalles = detalles.filter(d => d.det_ped_id_fk === factura.id);
      const productosMap = {};
      prods.forEach(p => { productosMap[p.id] = p.nombre; });
      const cliente = clientesList.find(c => c.cli_id === clienteId) || {};
      const lineas = misDetalles.map(d => ({
        ...d,
        producto_nombre: productosMap[d.det_pro_id_fk] || d.det_pro_id_fk
      }));
      setDetalleData({ ...factura, lineas, cliente, pedidoRelacionado });
      setDetalleTipo('factura');
      setShowDetalle(true);
    } catch {
      setDetalleData(factura);
      setDetalleTipo('factura');
      setShowDetalle(true);
    }
  };

  const confirmarEliminar = (type, id, label) => {
    setConfirmAction({
      danger: true,
      title: `Eliminar ${type}`,
      message: `¿Eliminar ${label} ${id}? Esta acción no se puede deshacer.`,
      onConfirm: async () => {
        setConfirmAction(null);
        try {
          const service = type === 'pedido' ? pedidosService : type === 'factura' ? facturasService : clientesService;
          await service.eliminar(id);
          toast({ type: 'success', title: 'Eliminado', description: `${type} ${id} eliminado correctamente` });
          refreshData();
        } catch(e) {
          toast({ type: 'error', title: 'Error', description: e.response?.data?.mensaje || e.message });
        }
      },
      onCancel: () => setConfirmAction(null),
    });
  };
  const eliminarPedido = (id) => confirmarEliminar('pedido', id, 'pedido');
  const eliminarFactura = (id) => confirmarEliminar('factura', id, 'factura');
  const eliminarCliente = (id) => confirmarEliminar('cliente', id, 'cliente');

  const openModal = async () => {
    setEditingClienteId(null);
    setFormError('');
    setErrors({});
    setProductosSeleccionados([]);
    setShowNewClientForm(false);
    setComprobanteFileName('');
    if (tab === 'pedidos') {
      // Obtener el siguiente ID real desde el backend (evita race condition con nextPedidoId)
      let pedId = 'PED001';
      try {
        const resp = await pedidosService.siguienteId();
        pedId = resp.next_id || pedId;
      } catch { /* fallback al ID calculado localmente */ }
      if (pedId === 'PED001') pedId = nextPedidoId; // fallback si la API falla
      const defaultData = { ped_id: pedId };
      setFormData(defaultData);
      formSnapshotRef.current = JSON.parse(JSON.stringify(defaultData));
      try {
        const prods = await productosService.listar();
        setProductosDisponibles(prods.filter(p => p.estado === 'Activo'));
      } catch {
        setProductosDisponibles([]);
      }
    } else if (tab === 'facturas') {
      const defaultData = { id: nextFacturaId, email_enviado: '0' };
      setFormData(defaultData);
      formSnapshotRef.current = JSON.parse(JSON.stringify(defaultData));
    } else {
      const defaultData = {};
      setFormData(defaultData);
      formSnapshotRef.current = JSON.parse(JSON.stringify(defaultData));
    }
    setShowModal(true);
  };

  // ── Función para eliminar emojis de un texto ──
  const stripEmojis = (text) => text.replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{FE00}-\u{FE0F}\u{200D}]/gu, '');

  const handleChange = (e) => {
    let { name, value } = e.target;
    // Eliminar emojis de todos los campos
    value = stripEmojis(value);
    // Sanitizar teléfono: solo dígitos, espacios, +, -, (, ) y máximo 10
    if (name === 'cli_telefono') {
      value = value.replace(/[^\d]/g, '');
      if (value.length > 10) value = value.slice(0, 10);
    }
    // Sanitizar nombre/apellido: sin caracteres especiales como -,@,_,+,[,*
    if (name === 'cli_nombre' || name === 'cli_apellido') {
      value = value.replace(/[\-@_+\[\]*]/g, '');
    }
    const max = FIELD_LIMITS[name];
    if (max && value.length > max) return;
    setFormData({ ...formData, [name]: value });
    validateField(name, value);
  };

  const validateField = (name, value) => {
    const newErrors = { ...errors };
    const t = tab;
    if (t === 'pedidos') {
      if (name === 'ped_fecha' && !value) newErrors.ped_fecha = 'La fecha es obligatoria';
      else if (name === 'ped_fecha') delete newErrors.ped_fecha;
      if (name === 'ped_metodo_pago' && !value) newErrors.ped_metodo_pago = 'Selecciona un método de pago';
      else if (name === 'ped_metodo_pago') delete newErrors.ped_metodo_pago;
      if (name === 'ped_estado_entrega' && !value) newErrors.ped_estado_entrega = 'Selecciona un estado';
      else if (name === 'ped_estado_entrega') delete newErrors.ped_estado_entrega;
      if (name === 'ped_cli_id_fk' && !value) newErrors.ped_cli_id_fk = 'Selecciona un cliente';
      else if (name === 'ped_cli_id_fk') delete newErrors.ped_cli_id_fk;
    }
    if (t === 'facturas') {
      if (name === 'fecha_emision' && !value) newErrors.fecha_emision = 'La fecha es obligatoria';
      else if (name === 'fecha_emision') delete newErrors.fecha_emision;
      if (name === 'forma_pago' && !value) newErrors.forma_pago = 'Selecciona forma de pago';
      else if (name === 'forma_pago') delete newErrors.forma_pago;
      if (name === 'total' && value && parseFloat(value) <= 0) newErrors.total = 'Debe ser mayor a 0';
      else if (name === 'total') delete newErrors.total;
    }
    if (t === 'clientes') {
      if (name === 'cli_id' && !value) newErrors.cli_id = 'El ID es obligatorio';
      else if (name === 'cli_id' && value && parseInt(value) > 9999999) newErrors.cli_id = 'El ID no puede superar 9,999,999';
      else if (name === 'cli_id') delete newErrors.cli_id;
      if (name === 'cli_nombre' && !value) newErrors.cli_nombre = 'El nombre es obligatorio';
      else if (name === 'cli_nombre' && value && value.length < 2) newErrors.cli_nombre = 'Min. 2 caracteres';
      else if (name === 'cli_nombre' && value && !/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]+$/.test(value)) newErrors.cli_nombre = 'Solo letras y espacios';
      else if (name === 'cli_nombre') delete newErrors.cli_nombre;
      if (name === 'cli_apellido' && !value) newErrors.cli_apellido = 'El apellido es obligatorio';
      else if (name === 'cli_apellido' && value && value.length < 2) newErrors.cli_apellido = 'Min. 2 caracteres';
      else if (name === 'cli_apellido' && value && !/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]+$/.test(value)) newErrors.cli_apellido = 'Solo letras y espacios';
      else if (name === 'cli_apellido') delete newErrors.cli_apellido;
      if (name === 'cli_correo' && !value) newErrors.cli_correo = 'El correo es obligatorio';
      else if (name === 'cli_correo' && value && !/\S+@\S+\.\S+/.test(value)) newErrors.cli_correo = 'Correo no válido';
      else if (name === 'cli_correo' && value && value.length > parseInt(FIELD_LIMITS.cli_correo || 120)) newErrors.cli_correo = `Máx. ${FIELD_LIMITS.cli_correo || 120} caracteres`;
      else if (name === 'cli_correo') delete newErrors.cli_correo;
    }
    setErrors(newErrors);
  };

  // ── Helpers para productos del pedido ──
  const [nuevoProducto, setNuevoProducto] = useState({ pro_id: '', cantidad: 1 });
  const [errorProducto, setErrorProducto] = useState('');

  const agregarProducto = () => {
    setErrorProducto('');
    const prod = productosDisponibles.find(p => p.id === nuevoProducto.pro_id);
    if (!prod) { setErrorProducto('Selecciona un producto'); return; }
    const yaExiste = productosSeleccionados.find(p => p.pro_id === prod.id);
    if (yaExiste) { setErrorProducto('Ese producto ya esta agregado'); return; }
    const cantidad = parseInt(nuevoProducto.cantidad, 10) || 1;
    if (cantidad <= 0) { setErrorProducto('La cantidad debe ser mayor a 0'); return; }
    const stock = parseInt(prod.cantidad_disponible, 10) || 0;
    if (cantidad > stock) {
      setErrorProducto('Stock insuficiente: hay ' + stock + ' unidades de ' + prod.nombre);
      return;
    }
    const precio = parseFloat(prod.precio) || 0;
    setProductosSeleccionados([
      ...productosSeleccionados,
      { pro_id: prod.id, pro_nombre: prod.nombre, cantidad, precio_unitario: precio, subtotal: cantidad * precio }
    ]);
    setNuevoProducto({ pro_id: '', cantidad: 1 });
  };

  const quitarProducto = (pro_id) => {
    setProductosSeleccionados(productosSeleccionados.filter(p => p.pro_id !== pro_id));
  };

  const totalPedidoCalculado = productosSeleccionados.reduce((sum, p) => sum + p.subtotal, 0);
  const nextPedidoId = (() => {
    const nums = pedidos.map(p => { const m = (p.ped_id || '').match(/PED(\d+)/); return m ? parseInt(m[1]) : 0; });
    const max = nums.length > 0 ? Math.max(...nums) : 0;
    return 'PED' + String(max + 1).padStart(3, '0');
  })();
  const nextFacturaId = (() => {
    const nums = facturas.map(f => { const m = (f.id || '').match(/FAC(\d+)/); return m ? parseInt(m[1]) : 0; });
    const max = nums.length > 0 ? Math.max(...nums) : 0;
    return 'FAC' + String(max + 1).padStart(3, '0');
  })();

  const fetchData = async () => {
    setLoading(true);
    try {
      const [peds, facs, clis] = await Promise.all([
        pedidosService.listar().catch(() => []),
        facturasService.listar().catch(() => []),
        clientesService.listar().catch(() => [])
      ]);
      setPedidos(peds);
      setFacturas(facs);
      setClientes(clis);
      setUltimaActualizacion(new Date().toLocaleTimeString());
    } catch (err) {
      console.error('Error cargando ventas:', err);
    } finally {
      setLoading(false);
    }
  };

  // Actualización silenciosa (sin loader) para refrescos tras mutaciones o intervalos
  const refreshData = async () => {
    try {
      const [peds, facs, clis] = await Promise.all([
        pedidosService.listar().catch(() => []),
        facturasService.listar().catch(() => []),
        clientesService.listar().catch(() => [])
      ]);
      setPedidos(peds);
      setFacturas(facs);
      setClientes(clis);
      setUltimaActualizacion(new Date().toLocaleTimeString());
    } catch (err) {
      console.error('Error refrescando ventas:', err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Resetear paginación cuando cambian filtros
  useEffect(() => { setPaginaPedidos(1); }, [searchTerm, filtroEstadoPedido]);
  useEffect(() => { setPaginaFacturas(1); }, [searchTerm, filtroEstadoFactura]);
  useEffect(() => { setPaginaClientes(1); }, [searchTerm, filtroTipoDocCliente]);

  const tabs = [
    { id: 'pedidos', label: 'Pedidos', icon: ShoppingCart },
    { id: 'facturas', label: 'Facturas', icon: FileText },
    { id: 'clientes', label: 'Clientes', icon: Users },
  ];

  const filteredPedidos = pedidos.filter(p => {
    const porEstado = !filtroEstadoPedido || p.ped_estado_entrega === filtroEstadoPedido;
    const busca = [p.ped_id, p.ped_cli_id_fk, p.ped_fecha, p.ped_metodo_pago, p.ped_total,
     p.ped_estado_pago, p.ped_estado_entrega, p.ped_cuenta_bancaria
    ].filter(Boolean).join(' ').toLowerCase().includes(searchTerm.toLowerCase());
    return porEstado && busca;
  });
  const filteredFacturas = facturas.filter(f => {
    const porEstado = !filtroEstadoFactura || f.estado === filtroEstadoFactura;
    const busca = [f.id, f.cli_nombre, f.cli_apellido, f.cli_correo, f.forma_pago,
     f.fecha_emision, f.total, f.estado, f.cuenta_bancaria, f.cli_id_fk
    ].filter(Boolean).join(' ').toLowerCase().includes(searchTerm.toLowerCase());
    return porEstado && busca;
  });

  const paginatedPedidos = filteredPedidos.slice(
    (paginaPedidos - 1) * POR_PAGINA, paginaPedidos * POR_PAGINA
  );
  const paginatedFacturas = filteredFacturas.slice(
    (paginaFacturas - 1) * POR_PAGINA, paginaFacturas * POR_PAGINA
  );

  const filteredClientes = clientes.filter(c => {
    const busca = [c.cli_id, c.cli_nombre, c.cli_apellido, c.cli_tipo_documento, c.cli_correo,
      c.cli_telefono, c.cli_direccion, c.cli_nit
    ].filter(Boolean).join(' ').toLowerCase().includes(searchTerm.toLowerCase());
    const porTipoDoc = !filtroTipoDocCliente || c.cli_tipo_documento === filtroTipoDocCliente;
    return busca && porTipoDoc;
  });

  const paginatedClientes = filteredClientes.slice(
    (paginaClientes - 1) * POR_PAGINA, paginaClientes * POR_PAGINA
  );

  const getEstadoEntregaBadge = (estado) => {
    const map = {
      'Entregado': 'text-emerald-600 bg-emerald-50',
      'En camino': 'text-blue-600 bg-blue-50',
      'En preparación': 'text-amber-600 bg-amber-50',
      'Pendiente': 'text-slate-500 bg-slate-100',
      'Anulado': 'text-slate-500 bg-slate-100',
    };
    return map[estado] || 'text-slate-500 bg-slate-100';
  };

  const getEstadoFacturaBadge = (estado) => {
    const map = {
      'Vigente': 'text-emerald-600 bg-emerald-50',
      'Anulada': 'text-red-600 bg-red-50',
    };
    return map[estado] || 'text-slate-500 bg-slate-100';
  };

  const handleQuickCreateCliente = async () => {
    setFormError('');
    setErrors({});
    if (!formData.cli_id || !formData.cli_nombre || !formData.cli_apellido || !formData.cli_correo) {
      setFormError('ID, Nombre, Apellido y Correo son obligatorios para crear un cliente');
      return;
    }
    setFormSubmitting(true);
    try {
      const cliId = parseInt(formData.cli_id, 10);
      const normalizarNombre = (s) =>
        (s || '').trim().replace(/\s+/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
      await clientesService.registrar({
        cli_id: cliId,
        cli_tipo_documento: formData.cli_tipo_documento || 'CC',
        cli_nombre: normalizarNombre(formData.cli_nombre),
        cli_apellido: normalizarNombre(formData.cli_apellido),
        cli_correo: (formData.cli_correo || '').trim().toLowerCase(),
        cli_telefono: formData.cli_telefono || null,
        cli_direccion: formData.cli_direccion || null
      });
      // Recargar lista de clientes
      const nuevos = await clientesService.listar();
      setClientes(nuevos);
      // Seleccionar el cliente recién creado en el campo ped_cli_id_fk
      setFormData(prev => ({ ...prev, ped_cli_id_fk: cliId }));
      setShowNewClientForm(false);
    } catch (err) {
      setFormError(err.response?.data?.mensaje || 'Error al crear cliente');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleSubmitPedido = async (e) => {
    e.preventDefault();
    setFormError('');
    setErrors({});
    setFormSubmitting(true);
    try {
      if (JSON.stringify(formData) === JSON.stringify(formSnapshotRef.current)) {
        if (editingPedidoId) {
          toast({ type: 'warning', title: 'Sin cambios', description: 'No se identificaron modificaciones en el pedido' });
          return;
        }
        setFormError('Completa los campos del pedido antes de guardar');
        return;
      }
      if (!formData.ped_fecha || !formData.ped_metodo_pago || !formData.ped_estado_entrega || !formData.ped_cli_id_fk) {
        setFormError('Todos los campos con * son obligatorios');
        return;
      }
      if (formData.ped_metodo_pago === 'Transferencia' && !formData.ped_cuenta_bancaria) {
        setFormError('Seleccione un banco o billetera para la transferencia');
        return;
      }
      // Validar fecha no pasada
      const hoy = new Date().toISOString().split('T')[0];
      if (formData.ped_fecha < hoy) {
        setFormError('No se pueden crear pedidos en fechas pasadas. La fecha debe ser hoy o posterior.');
        return;
      }
      if (productosSeleccionados.length === 0) {
        setFormError('Agrega al menos un producto al pedido');
        return;
      }
      const clienteId = parseInt(formData.ped_cli_id_fk, 10);
      if (isNaN(clienteId) || clienteId <= 0) {
        setFormError('El ID del cliente debe ser un número entero positivo');
        return;
      }
      const totalPed = totalPedidoCalculado;
      const pedId = editingPedidoId || formData.ped_id;
      if (editingPedidoId) {
        // ── Editar pedido existente ──
        await pedidosService.editar(editingPedidoId, {
          ped_fecha: formData.ped_fecha,
          ped_metodo_pago: formData.ped_metodo_pago,
          ped_cuenta_bancaria: formData.ped_cuenta_bancaria || null,
          ped_estado_entrega: formData.ped_estado_entrega,
          ped_total: totalPed,
          ped_cli_id_fk: clienteId,
          ped_usu_id_fk: user?.id || null
        });
        // Eliminar detalles viejos y volver a crearlos
        const viejos = await detallesPedidosService.listar().catch(() => []);
        for (const v of viejos.filter(d => d.det_ped_id_fk === editingPedidoId)) {
          await detallesPedidosService.eliminar(v.det_id).catch(() => {});
        }
      } else {
        // ── Crear nuevo pedido ──
        await pedidosService.registrar({
          ped_id: formData.ped_id,
          ped_fecha: formData.ped_fecha,
          ped_metodo_pago: formData.ped_metodo_pago,
          ped_cuenta_bancaria: formData.ped_cuenta_bancaria || null,
          ped_comprobante: formData.ped_comprobante || null,
          ped_comprobante_tipo: formData.ped_comprobante_tipo || null,
          ped_estado_entrega: formData.ped_estado_entrega,
          ped_total: totalPed,
          ped_cli_id_fk: clienteId,
          ped_usu_id_fk: user?.id || null,
          productos: productosSeleccionados.map(p => ({ pro_id: p.pro_id }))
        });
      }
      // 2. Crear/actualizar detalles del pedido
      for (let i = 0; i < productosSeleccionados.length; i++) {
        const p = productosSeleccionados[i];
        await detallesPedidosService.registrar({
          det_id: `${pedId}-DET${String(i + 1).padStart(3, '0')}`,
          det_ped_id_fk: pedId,
          det_pro_id_fk: p.pro_id,
          det_cantidad: p.cantidad,
          det_precio_unitario: p.precio_unitario,
          det_subtotal: p.subtotal
        });
      }
      setShowModal(false);
      setEditingPedidoId(null);
      toast({ type: 'success', title: editingPedidoId ? 'Actualizado' : 'Creado', description: `Pedido ${editingPedidoId ? 'actualizado' : 'creado'} correctamente` });
      refreshData();
    } catch (err) {
      toast({ type: 'error', title: 'Error', description: err.response?.data?.mensaje || 'Error al guardar pedido' });
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleSubmitFactura = async (e) => {
    e.preventDefault();
    setFormError('');
    setErrors({});
    if (JSON.stringify(formData) === JSON.stringify(formSnapshotRef.current)) {
      setFormError('Completa los campos de la factura antes de guardar');
      return;
    }
    if (!formData.id || !formData.fecha_emision || formData.email_enviado === undefined || !formData.forma_pago) {
      setFormError('Todos los campos con * son obligatorios');
      return;
    }
    if (formData.forma_pago === 'Transferencia' && !formData.cuenta_bancaria) {
      setFormError('Seleccione un banco o billetera para la transferencia');
      return;
    }
    const emailEnviado = parseInt(formData.email_enviado, 10);
    if (isNaN(emailEnviado) || ![0, 1].includes(emailEnviado)) {
      setFormError('Selecciona si el email fue enviado o no');
      return;
    }
    const totalFac = parseFloat(formData.total);
    if (isNaN(totalFac) || totalFac <= 0) {
      setFormError('El total debe ser un número mayor a 0');
      return;
    }
    setFormSubmitting(true);
    try {
      await facturasService.registrar({
        id: formData.id,
        fecha_emision: formData.fecha_emision,
        email_enviado: emailEnviado,
        forma_pago: formData.forma_pago,
        cuenta_bancaria: formData.forma_pago === 'Transferencia' ? formData.cuenta_bancaria || '' : null,
        total: totalFac,
        usuario_id: user?.id || '',
        estado: formData.estado || 'Vigente',
        cli_id_fk: formData.cli_id_fk || null
      });
      setShowModal(false);
      toast({ type: 'success', title: 'Creada', description: 'Factura creada correctamente' });
      refreshData();
    } catch (err) {
      toast({ type: 'error', title: 'Error', description: err.response?.data?.mensaje || 'Error al crear factura' });
    } finally {
      setFormSubmitting(false);
    }
  };

  const abrirEditarPedido = async (pedido) => {
    try {
      // Usar datos del pedido desde la tabla
      const editData = {
        ped_id: pedido.ped_id,
        ped_fecha: pedido.ped_fecha,
        ped_metodo_pago: pedido.ped_metodo_pago,
        ped_cuenta_bancaria: pedido.ped_cuenta_bancaria || '',
        ped_estado_entrega: pedido.ped_estado_entrega,
        ped_cli_id_fk: pedido.ped_cli_id_fk,
      };
      setFormData(editData);
      formSnapshotRef.current = JSON.parse(JSON.stringify(editData));
      setEditingPedidoId(pedido.ped_id);
      setFormError('');
      setProductosSeleccionados([]);
      setShowNewClientForm(false);
      setComprobanteFileName('');

      // Cargar productos disponibles
      const prods = await productosService.listar().catch(() => []);
      setProductosDisponibles(prods.filter(p => p.estado === 'Activo'));

      // Cargar detalles del pedido
      const detalles = await detallesPedidosService.listar().catch(() => []);
      const misDetalles = detalles.filter(d => d.det_ped_id_fk === pedido.ped_id);
      const detsConNombres = misDetalles.map(d => {
        const prod = prods.find(p => p.id === d.det_pro_id_fk);
        return {
          pro_id: d.det_pro_id_fk,
          pro_nombre: prod?.nombre || d.det_pro_id_fk,
          cantidad: d.det_cantidad,
          precio_unitario: d.det_precio_unitario,
          subtotal: d.det_subtotal
        };
      });
      setProductosSeleccionados(detsConNombres);
      setShowModal(true);
    } catch (err) {
      toast({ type: 'error', title: 'Error', description: 'Error al cargar pedido: ' + (err.response?.data?.mensaje || err.message) });
    }
  };

  const cancelarPedidoConDevolucion = async () => {
    if (!pedidoACancelar) return;
    if (pedidoACancelar.ped_estado_entrega === 'Anulado') {
      toast({ type: 'warning', title: 'Ya anulado', description: 'Este pedido ya fue anulado anteriormente.' });
      setShowConfirmCancel(false);
      setPedidoACancelar(null);
      return;
    }
    setCancelLoading(true);
    try {
      const id = pedidoACancelar.ped_id;

      // 1. Marcar pedido como Anulado
      await pedidosService.editar(id, {
        ped_fecha: pedidoACancelar.ped_fecha,
        ped_metodo_pago: pedidoACancelar.ped_metodo_pago,
        ped_estado_entrega: 'Anulado',
        ped_total: pedidoACancelar.ped_total,
        ped_cli_id_fk: pedidoACancelar.ped_cli_id_fk,
        ped_usu_id_fk: user?.id || null,
        ped_cuenta_bancaria: pedidoACancelar.ped_cuenta_bancaria || null
      });

      // 2. Obtener detalles del pedido para crear devoluciones
      const detalles = await detallesPedidosService.listar().catch(() => []);
      const misDetalles = detalles.filter(d => d.det_ped_id_fk === id);

      // 3. Crear una devolución por cada producto
      for (const det of misDetalles) {
        await devolucionesService.registrar({
          pedido_id: id,
          producto_id: det.det_pro_id_fk,
          lote_id: det.det_lot_id_fk || null,
          cantidad: det.det_cantidad,
          motivo: 'Pedido cancelado',
          fecha: new Date().toISOString().split('T')[0],
          usuario_id: user?.id || ''
        }).catch(err => {
          console.warn(`Error al crear devolución para ${det.det_pro_id_fk}:`, err);
        });
      }

      // 4. Registrar anulación si existe una factura asociada al pedido
      const facturaAsociada = facturas.find(f => f.id === id);
      if (facturaAsociada) {
        const nums = facturas
          .map(f => { const m = (f.id || '').match(/FAC(\d+)/); return m ? parseInt(m[1]) : 0; })
          .filter(n => n > 0);
        const maxNum = nums.length > 0 ? Math.max(...nums) : 0;
        const anuId = 'ANU' + String(maxNum + 1).padStart(3, '0');
        await anulacionesService.registrar({
          anu_id: anuId,
          anu_fac_id_fk: id,
          anu_usu_id_fk: user?.id || '',
          anu_fecha: new Date().toISOString().split('T')[0],
          anu_motivo: 'Anulación automática por cancelación de pedido'
        }).catch(err => {
          console.warn('Error al registrar anulación:', err);
        });
      }

      setShowConfirmCancel(false);
      setPedidoACancelar(null);
      refreshData();
    } catch (err) {
      toast({ type: 'error', title: 'Error', description: 'Error al cancelar pedido: ' + (err.response?.data?.mensaje || err.message) });
    } finally {
      setCancelLoading(false);
    }
  };

  const [comprobanteUrl, setComprobanteUrl] = useState(null);

  const cerrarVerificarPago = () => {
    if (comprobanteUrl) URL.revokeObjectURL(comprobanteUrl);
    setComprobanteUrl(null);
    setShowVerificarModal(false);
    setPedidoAVerificar(null);
  };

  const abrirVerificarPago = async (pedido) => {
    setPedidoAVerificar(pedido);
    setShowVerificarModal(true);
    setPedidoComprobanteCargando(true);
    setComprobanteUrl(null);
    try {
      // Cargar el comprobante como blob (con autenticación)
      const token = sessionStorage.getItem('access_token');
      const resp = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/pedidos/${pedido.ped_id}/comprobante`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (resp.ok) {
        const blob = await resp.blob();
        setComprobanteUrl(URL.createObjectURL(blob));
      }
    } catch (e) {
      console.error('Error al cargar comprobante:', e);
    } finally {
      setPedidoComprobanteCargando(false);
    }
  };

  const confirmarVerificarPago = async (estado) => {
    if (!pedidoAVerificar) return;
    setNotifLoading(true);
    try {
      await pedidosService.verificarPago(pedidoAVerificar.ped_id, estado);
      // Actualizar visualmente el estado en la tabla de inmediato
      setPedidos(prev => prev.map(p => {
        if (p.ped_id !== pedidoAVerificar.ped_id) return p;
        const updates = { ...p, ped_estado_pago: estado };
        // Al rechazar, el backend limpia el comprobante — reflejarlo
        if (estado === 'Rechazado') {
          updates.ped_tiene_comprobante = false;
          updates.ped_comprobante = null;
          updates.ped_comprobante_tipo = null;
        }
        return updates;
      }));
      cerrarVerificarPago();
      refreshData(); // refuerzo con datos frescos del backend
    } catch (err) {
      toast({ type: 'error', title: 'Error', description: err.response?.data?.mensaje || err.message });
    } finally {
      setNotifLoading(false);
    }
  };

  const abrirNotificar = (pedido) => {
    setPedidoANotificar(pedido);
    setNotifResultadoCorreo(null);
    setNotifLoadingCorreo(false);
    setNotifResultadoFactura(null);
    setNotifLoadingFactura(false);
    setShowNotificarModal(true);
  };

  const abrirEditarCliente = (cliente) => {
    const editData = {
      cli_id: cliente.cli_id,
      cli_tipo_documento: cliente.cli_tipo_documento || '',
      cli_nombre: cliente.cli_nombre || '',
      cli_apellido: cliente.cli_apellido || '',
      cli_correo: cliente.cli_correo || '',
      cli_telefono: cliente.cli_telefono || '',
      cli_direccion: cliente.cli_direccion || ''
    };
    setFormData(editData);
    formSnapshotRef.current = JSON.parse(JSON.stringify(editData));
    setEditingClienteId(cliente.cli_id);
    setFormError('');
    setShowModal(true);
  };

  const handleSubmitCliente = async (e) => {
    e.preventDefault();
    setFormError('');
    setErrors({});
    if (JSON.stringify(formData) === JSON.stringify(formSnapshotRef.current)) {
      if (editingClienteId) {
        toast({ type: 'warning', title: 'Sin cambios', description: 'No se identificaron modificaciones en el cliente' });
        return;
      }
      setFormError('Completa los campos del cliente antes de guardar');
      return;
    }
    if (!formData.cli_id || !formData.cli_tipo_documento || !formData.cli_nombre || !formData.cli_apellido || !formData.cli_correo) {
      setFormError('Los campos ID, Tipo Doc., Nombre, Apellido y Correo son obligatorios');
      return;
    }
    const cliId = parseInt(formData.cli_id, 10);
    if (isNaN(cliId) || cliId <= 0) {
      setFormError('El ID del cliente debe ser un número entero positivo');
      return;
    }
    setFormSubmitting(true);
    try {
      // Normalizar: correo a minúsculas, nombre/apellido con primera letra mayúscula
      const normalizarNombre = (s) =>
        (s || '').trim().replace(/\s+/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
      const payload = {
        cli_id: cliId,
        cli_tipo_documento: formData.cli_tipo_documento,
        cli_nombre: normalizarNombre(formData.cli_nombre),
        cli_apellido: normalizarNombre(formData.cli_apellido),
        cli_correo: (formData.cli_correo || '').trim().toLowerCase(),
        cli_telefono: formData.cli_telefono || null,
        cli_direccion: formData.cli_direccion || null
      };
      if (editingClienteId) {
        await clientesService.editar(payload);
      } else {
        await clientesService.registrar(payload);
      }
      setShowModal(false);
      setEditingClienteId(null);
      toast({ type: 'success', title: editingClienteId ? 'Actualizado' : 'Creado', description: `Cliente ${editingClienteId ? 'actualizado' : 'creado'} correctamente` });
      refreshData();
    } catch (err) {
      toast({ type: 'error', title: 'Error', description: err.response?.data?.mensaje || 'Error al guardar cliente' });
    } finally {
      setFormSubmitting(false);
    }
  };

  if (loading) return <ThemeLoader module="Ventas" />;

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
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
            placeholder={
              tab === 'pedidos' ? 'Buscar pedido...' :
              tab === 'facturas' ? 'Buscar factura...' : 'Buscar cliente...'
            }
            className="bg-transparent border-none outline-none text-sm w-full font-medium"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            maxLength={100}
          />
        </div>
        <div className="flex gap-2">
          <button onClick={refreshData} className="p-3 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-all shadow-sm" title="Actualizar datos">
            <RefreshCw size={18} className="text-slate-500" />
          </button>
          {ultimaActualizacion && (
            <span className="text-xs text-slate-400 flex items-center px-2">
              Actualizado: {ultimaActualizacion}
            </span>
          )}
          <button
            onClick={openModal}
            disabled={loading}
            className="flex items-center gap-2 bg-blue-600 text-white px-5 py-3 rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-blue-700 transition-all shadow-md btn-pulse disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-blue-600"
          >
            <Plus size={16} /> Nuevo {tab === 'pedidos' ? 'Pedido' : tab === 'facturas' ? 'Factura' : 'Cliente'}
          </button>
        </div>
      </div>

      {/* TAB: Pedidos */}
      {tab === 'pedidos' && (
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 border-l-4 border-l-orange-400 overflow-hidden">
          {/* ── Tarjetas resumen ── */}
          <div className="grid grid-cols-6 gap-2 px-6 pt-4 pb-2">
            {(() => {
              const cards = [
                { label: 'Todos', count: pedidos.length, icon: '📋', color: 'border-blue-200 bg-blue-50/50', text: 'text-blue-700', filtro: '' },
                { label: 'Pendientes', count: pedidos.filter(p => p.ped_estado_entrega === 'Pendiente').length, icon: '⏳', color: 'border-slate-200 bg-slate-50/50', text: 'text-slate-600', filtro: 'Pendiente' },
                { label: 'Preparación', count: pedidos.filter(p => p.ped_estado_entrega === 'En preparación').length, icon: '📦', color: 'border-amber-200 bg-amber-50/50', text: 'text-amber-700', filtro: 'En preparación' },
                { label: 'En camino', count: pedidos.filter(p => p.ped_estado_entrega === 'En camino').length, icon: '🚚', color: 'border-blue-200 bg-blue-50/50', text: 'text-blue-700', filtro: 'En camino' },
                { label: 'Entregados', count: pedidos.filter(p => p.ped_estado_entrega === 'Entregado').length, icon: '✅', color: 'border-emerald-200 bg-emerald-50/50', text: 'text-emerald-700', filtro: 'Entregado' },
                { label: 'Anulados', count: pedidos.filter(p => p.ped_estado_entrega === 'Anulado').length, icon: '🚫', color: 'border-red-200 bg-red-50/50', text: 'text-red-700', filtro: 'Anulado' },
              ];
              return cards.map((c, idx) => (
                <button
                  key={idx}
                  onClick={() => setFiltroEstadoPedido(c.filtro)}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border ${c.color} transition-all hover:shadow-md ${filtroEstadoPedido === c.filtro ? 'ring-2 ring-blue-400 scale-[1.03]' : ''}`}
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
              <thead className="bg-slate-50/50 text-slate-400 text-xs uppercase font-bold tracking-wider border-b border-slate-100">
                <tr>
                  <th className="px-6 py-4">ID</th>
                  <th className="px-6 py-4">Cliente</th>
                  <th className="px-6 py-4">Fecha</th>
                  <th className="px-6 py-4">Método Pago</th>
                  <th className="px-6 py-4 text-right">Total</th>
                  <th className="px-6 py-4">Pago</th>
                  <th className="px-6 py-4">Estado</th>
                  <th className="px-6 py-4 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-sm font-bold text-slate-600">
                {filteredPedidos.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="px-6 py-12 text-center text-slate-400 italic">
                      {searchTerm ? 'Sin resultados' : 'No hay pedidos registrados'}
                    </td>
                  </tr>
                ) : (
                  paginatedPedidos.map((p, i) => (
                    <tr key={i} className="hover:bg-orange-100/70">
                      <td className="px-6 py-4 text-slate-400 text-xs">{p.ped_id}</td>
                      <td className="px-6 py-4">{p.ped_cli_id_fk || '-'}</td>
                      <td className="px-6 py-4 text-slate-400">{p.ped_fecha || '-'}</td>
                      <td className="px-6 py-4">
                        {['Nequi', 'Daviplata', 'Transferencia'].includes(p.ped_metodo_pago)
                          ? `Transferencia${p.ped_metodo_pago !== 'Transferencia' ? ` (${p.ped_metodo_pago})` : p.ped_cuenta_bancaria ? ` (${p.ped_cuenta_bancaria})` : ''}`
                          : p.ped_metodo_pago || '-'}
                      </td>
                      <td className="px-6 py-4 text-right">
                        ${parseFloat(p.ped_total || 0).toLocaleString()}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${
                          p.ped_estado_pago === 'Verificado' ? 'text-emerald-600 bg-emerald-50' :
                          p.ped_estado_pago === 'Rechazado' ? 'text-red-600 bg-red-50' :
                          p.ped_estado_pago === 'Comprobante recibido' ? 'text-blue-600 bg-blue-50' :
                          'text-slate-500 bg-slate-100'
                        }`}>
                          {p.ped_estado_pago || 'Pendiente de pago'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${getEstadoEntregaBadge(p.ped_estado_entrega)}`}>
                          {p.ped_estado_entrega}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {p.ped_estado_pago === 'Rechazado' ? (
                            <button
                              onClick={() => { setPedidoSubirComprobante(p); setShowSubirComprobanteModal(true); }}
                              className="p-2 text-blue-500 hover:text-white hover:bg-blue-500 transition-colors rounded-md"
                              title="Subir nuevo comprobante"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                            </button>
                          ) : p.ped_tiene_comprobante ? (
                            <button
                              onClick={() => abrirVerificarPago(p)}
                              disabled={p.ped_estado_pago === 'Verificado'}
                              className={`p-2 transition-colors rounded-md ${
                                p.ped_estado_pago === 'Verificado'
                                  ? 'text-emerald-300 cursor-not-allowed'
                                  : 'text-amber-500 hover:text-white hover:bg-amber-500'
                              }`}
                              title={p.ped_estado_pago === 'Verificado' ? 'Pago ya verificado' : 'Verificar pago'}
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                            </button>
                          ) : p.ped_estado_pago !== 'Verificado' ? (
                            <button
                              onClick={() => { setPedidoSubirComprobante(p); setShowSubirComprobanteModal(true); }}
                              className="p-2 text-blue-500 hover:text-white hover:bg-blue-500 transition-colors rounded-md"
                              title="Subir comprobante"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                            </button>
                          ) : null}
                          {p.ped_estado_pago === 'Verificado' && (
                            <button
                              onClick={() => abrirNotificar(p)}
                              className="p-2 text-blue-500 hover:text-white hover:bg-blue-500 transition-colors rounded-md"
                              title="Notificar cliente"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                            </button>
                          )}

                          {p.ped_estado_entrega === 'En preparación' && (
                            <button
                              onClick={async () => {
                                try {
                                  const res = await pedidosService.avanzarEstado(p.ped_id);
                                  const datos = res.datos || res;
                                  setPedidos(prev => prev.map(pd =>
                                    pd.ped_id === p.ped_id ? { ...pd, ...datos } : pd
                                  ));
                                } catch (err) {
                                  toast({ type: 'error', title: 'Error', description: err.response?.data?.mensaje || err.message });
                                }
                              }}
                              className="p-2 text-indigo-500 hover:text-white hover:bg-indigo-500 transition-colors rounded-md"
                              title="Despachar pedido"
                            >
                              <Truck size={16} />
                            </button>
                          )}
                          {p.ped_estado_entrega === 'En camino' && (
                            <>
                              <button
                                onClick={async () => {
                                  try {
                                    const res = await pedidosService.avanzarEstado(p.ped_id);
                                    const datos = res.datos || res;
                                    setPedidos(prev => prev.map(pd =>
                                      pd.ped_id === p.ped_id ? { ...pd, ...datos } : pd
                                    ));
                                    setShowQRModal(false);
                                  } catch (err) {
                                    toast({ type: 'error', title: 'Error', description: err.response?.data?.mensaje || err.message });
                                  }
                                }}
                                className="p-2 text-emerald-500 hover:text-white hover:bg-emerald-500 transition-colors rounded-md"
                                title="Marcar como entregado"
                              >
                                <Package size={16} />
                              </button>
                              <button
                                onClick={() => abrirQR(p)}
                                className="p-2 text-purple-500 hover:text-white hover:bg-purple-500 transition-colors rounded-md"
                                title="Código QR de entrega"
                              >
                                <QrCode size={16} />
                              </button>
                            </>
                          )}
                          <button onClick={() => abrirEditarPedido(p)} className="p-2 text-slate-400 hover:text-amber-600 transition-colors" title="Editar pedido">
                            <Edit3 size={16} />
                          </button>
                          {p.ped_estado_entrega !== 'Anulado' && (
                            <button onClick={() => { setPedidoACancelar(p); setShowConfirmCancel(true); }} className="p-2 text-slate-400 hover:text-red-600 transition-colors" title="Cancelar pedido">
                              <Trash2 size={16} />
                            </button>
                          )}
                          <button onClick={() => abrirDetallePedido(p)} className="p-2 text-slate-400 hover:text-blue-600 transition-colors" title="Ver detalle">
                            <Eye size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between px-6 py-4 bg-slate-50/30 border-t border-slate-100 text-xs text-slate-400 font-bold">
            <div className="flex items-center gap-3">
              {(filtroEstadoPedido) && (
                <button onClick={() => setFiltroEstadoPedido('')} className="text-slate-400 hover:text-red-500 transition-colors font-bold uppercase">
                  ✕ Limpiar filtro
                </button>
              )}
              <span>{filteredPedidos.length > 0
                ? `${(paginaPedidos - 1) * POR_PAGINA + 1}–${Math.min(paginaPedidos * POR_PAGINA, filteredPedidos.length)} de ${filteredPedidos.length}`
                : `${filteredPedidos.length} pedidos`
              }</span>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setPaginaPedidos(p => Math.max(1, p - 1))} disabled={paginaPedidos <= 1}
                className="px-3 py-1.5 rounded-md border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all text-xs font-bold uppercase tracking-wider">Anterior</button>
              <span className="text-slate-500">{paginaPedidos} / {Math.max(1, Math.ceil(filteredPedidos.length / POR_PAGINA))}</span>
              <button onClick={() => setPaginaPedidos(p => p + 1)} disabled={paginaPedidos >= Math.ceil(filteredPedidos.length / POR_PAGINA)}
                className="px-3 py-1.5 rounded-md border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all text-xs font-bold uppercase tracking-wider">Siguiente</button>
            </div>
          </div>
        </div>
      )}

      {/* TAB: Facturas */}
      {tab === 'facturas' && (
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 border-l-4 border-l-orange-400 overflow-hidden">
          {/* ── Tarjetas resumen ── */}
          <div className="grid grid-cols-3 gap-2 px-6 pt-4 pb-2">
            {(() => {
              const cards = [
                { label: 'Todas', count: facturas.length, icon: '📋', color: 'border-blue-200 bg-blue-50/50', text: 'text-blue-700', filtro: '' },
                { label: 'Vigentes', count: facturas.filter(f => f.estado === 'Vigente').length, icon: '✅', color: 'border-emerald-200 bg-emerald-50/50', text: 'text-emerald-700', filtro: 'Vigente' },
                { label: 'Anuladas', count: facturas.filter(f => f.estado === 'Anulada').length, icon: '🚫', color: 'border-red-200 bg-red-50/50', text: 'text-red-700', filtro: 'Anulada' },
              ];
              return cards.map((c, idx) => (
                <button
                  key={idx}
                  onClick={() => setFiltroEstadoFactura(c.filtro)}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border ${c.color} transition-all hover:shadow-md ${filtroEstadoFactura === c.filtro ? 'ring-2 ring-blue-400 scale-[1.03]' : ''}`}
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
              <thead className="bg-slate-50/50 text-slate-400 text-xs uppercase font-bold tracking-wider border-b border-slate-100">
                <tr>
                  <th className="px-6 py-4">ID Factura</th>
                  <th className="px-6 py-4">Cliente</th>
                  <th className="px-6 py-4">Fecha Emisión</th>
                  <th className="px-6 py-4">Forma Pago</th>
                  <th className="px-6 py-4 text-right">Total</th>
                  <th className="px-6 py-4">Estado</th>
                  <th className="px-6 py-4">Email</th>
                  <th className="px-6 py-4 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-sm font-bold text-slate-600">
                {filteredFacturas.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="px-6 py-12 text-center text-slate-400 italic">
                      {searchTerm ? 'Sin resultados' : 'No hay facturas registradas'}
                    </td>
                  </tr>
                ) : (
                  paginatedFacturas.map((f, i) => (
                    <tr key={i} className="hover:bg-orange-100/70">
                      <td className="px-6 py-4 text-slate-400 text-xs">{f.id}</td>
                      <td className="px-6 py-4">
                        <div className="text-xs">
                          <span className="text-slate-800">{f.cli_nombre ? `${f.cli_nombre} ${f.cli_apellido || ''}` : `Cliente #${f.cli_id_fk || '?'}`}</span>
                          {f.cli_correo && <div className="text-slate-400 text-[10px] mt-0.5">{f.cli_correo}</div>}
                        </div>
                      </td>
                      <td className="px-6 py-4">{f.fecha_emision || '-'}</td>
                      <td className="px-6 py-4">
                        {['Nequi', 'Daviplata', 'Transferencia'].includes(f.forma_pago)
                          ? `Transferencia${f.forma_pago !== 'Transferencia' ? ` (${f.forma_pago})` : f.cuenta_bancaria ? ` (${f.cuenta_bancaria})` : ''}`
                          : f.forma_pago || '-'}
                      </td>
                      <td className="px-6 py-4 text-right">${parseFloat(f.total || 0).toLocaleString()}</td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${getEstadoFacturaBadge(f.estado)}`}>
                          {f.estado || 'Vigente'}
                        </span>
                      </td>
                      <td className="px-6 py-4">{f.email_enviado === 1 ? '✅ Enviado' : '❌ Pendiente'}</td>
                      <td className="px-6 py-4 text-right">
                        <button onClick={() => abrirDetalleFactura(f)} className="p-2 text-slate-400 hover:text-blue-600 transition-colors" title="Ver factura">
                          <Eye size={16} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between px-6 py-4 bg-slate-50/30 border-t border-slate-100 text-xs text-slate-400 font-bold">
            <span>{filteredFacturas.length > 0
              ? `${(paginaFacturas - 1) * POR_PAGINA + 1}–${Math.min(paginaFacturas * POR_PAGINA, filteredFacturas.length)} de ${filteredFacturas.length}`
              : `${filteredFacturas.length} facturas`
            }</span>
            <div className="flex items-center gap-2">
              <button onClick={() => setPaginaFacturas(p => Math.max(1, p - 1))} disabled={paginaFacturas <= 1}
                className="px-3 py-1.5 rounded-md border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all text-xs font-bold uppercase tracking-wider">Anterior</button>
              <span className="text-slate-500">{paginaFacturas} / {Math.max(1, Math.ceil(filteredFacturas.length / POR_PAGINA))}</span>
              <button onClick={() => setPaginaFacturas(p => p + 1)} disabled={paginaFacturas >= Math.ceil(filteredFacturas.length / POR_PAGINA)}
                className="px-3 py-1.5 rounded-md border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all text-xs font-bold uppercase tracking-wider">Siguiente</button>
            </div>
          </div>
        </div>
      )}

      {/* TAB: Clientes */}
      {tab === 'clientes' && (
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 border-l-4 border-l-orange-400 overflow-hidden">
          {/* ── Filtros de clientes ── */}
          <div className="flex items-center gap-2 px-6 py-3 border-b border-slate-100 bg-slate-50/30 flex-wrap">
            <select
              value={filtroTipoDocCliente}
              onChange={(e) => setFiltroTipoDocCliente(e.target.value)}
              className="text-xs border border-slate-300 rounded-md px-2.5 py-1.5 bg-white outline-none shadow-sm font-medium text-slate-600"
            >
              <option value="">Todos los tipos</option>
              {[...new Set(clientes.map(c => c.cli_tipo_documento).filter(Boolean))].sort().map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
            {filtroTipoDocCliente && (
              <button
                onClick={() => setFiltroTipoDocCliente('')}
                className="text-[10px] font-bold uppercase tracking-wider text-slate-400 hover:text-red-500 transition-colors px-2"
              >
                ✕ Limpiar filtros
              </button>
            )}
          </div>
          {/* ── Tarjetas resumen ── */}
          {(() => {
            const cc = clientes.filter(c => c.cli_tipo_documento === 'CC').length;
            const nit = clientes.filter(c => c.cli_tipo_documento === 'NIT').length;
            const ce = clientes.filter(c => c.cli_tipo_documento === 'CE').length;
            const ti = clientes.filter(c => c.cli_tipo_documento === 'TI').length;
            const cards = [
              { label: 'Todos', count: clientes.length, icon: '📋', color: 'border-blue-200 bg-blue-50/50', text: 'text-blue-700', filtro: '' },
              { label: 'CC', count: cc, icon: '🪪', color: 'border-emerald-200 bg-emerald-50/50', text: 'text-emerald-700', filtro: 'CC' },
              { label: 'NIT', count: nit, icon: '🏢', color: 'border-amber-200 bg-amber-50/50', text: 'text-amber-700', filtro: 'NIT' },
              { label: 'CE', count: ce, icon: '🛂', color: 'border-blue-200 bg-blue-50/50', text: 'text-blue-600', filtro: 'CE' },
              { label: 'TI', count: ti, icon: '🧒', color: 'border-slate-200 bg-slate-50/50', text: 'text-slate-600', filtro: 'TI' },
            ];
            return (
              <div className="grid grid-cols-5 gap-2 px-6 pt-4 pb-2">
                {cards.map((c, idx) => (
                  <button
                    key={idx}
                    onClick={() => setFiltroTipoDocCliente(c.filtro)}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border ${c.color} transition-all hover:shadow-md ${filtroTipoDocCliente === c.filtro ? 'ring-2 ring-blue-400 scale-[1.03]' : ''}`}
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
                  <th className="px-6 py-4">Apellido</th>
                  <th className="px-6 py-4">Tipo Doc.</th>
                  <th className="px-6 py-4">Correo</th>
                  <th className="px-6 py-4">Teléfono</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-sm font-bold text-slate-600">
                {filteredClientes.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-12 text-center text-slate-400 italic">
                      {searchTerm ? 'Sin resultados' : 'No hay clientes registrados'}
                    </td>
                  </tr>
                ) : (
                  paginatedClientes.map((c, i) => (
                    <tr key={i} className="hover:bg-orange-100/70">
                      <td className="px-6 py-4 text-slate-400 text-xs">{c.cli_id}</td>
                      <td className="px-6 py-4">{c.cli_nombre}</td>
                      <td className="px-6 py-4">{c.cli_apellido || '-'}</td>
                      <td className="px-6 py-4">{c.cli_tipo_documento || '-'}</td>
                      <td className="px-6 py-4 text-slate-400">{c.cli_correo || '-'}</td>
                      <td className="px-6 py-4">{c.cli_telefono || '-'}</td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => abrirEditarCliente(c)} className="p-2 text-slate-400 hover:text-amber-600 transition-colors" title="Editar cliente"><Edit3 size={14} /></button>
                          <button onClick={() => { setClienteTarjeta(c); setShowClienteTarjeta(true); }} className="p-2 text-slate-400 hover:text-blue-600 transition-colors" title="Ver ficha del cliente"><Eye size={14} /></button>
                          <button onClick={() => eliminarCliente(c.cli_id)} className="p-2 text-slate-400 hover:text-red-500 transition-colors" title="Eliminar cliente"><Trash2 size={14} /></button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between px-6 py-4 bg-slate-50/30 border-t border-slate-100 text-xs text-slate-400 font-bold">
            <span>{filteredClientes.length > 0
              ? `${(paginaClientes - 1) * POR_PAGINA + 1}–${Math.min(paginaClientes * POR_PAGINA, filteredClientes.length)} de ${filteredClientes.length}`
              : `${filteredClientes.length} clientes`
            }</span>
            <div className="flex items-center gap-2">
              <button onClick={() => setPaginaClientes(p => Math.max(1, p - 1))} disabled={paginaClientes <= 1}
                className="px-3 py-1.5 rounded-md border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all text-xs font-bold uppercase tracking-wider">Anterior</button>
              <span className="text-slate-500">{paginaClientes} / {Math.max(1, Math.ceil(filteredClientes.length / POR_PAGINA))}</span>
              <button onClick={() => setPaginaClientes(p => p + 1)} disabled={paginaClientes >= Math.ceil(filteredClientes.length / POR_PAGINA)}
                className="px-3 py-1.5 rounded-md border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all text-xs font-bold uppercase tracking-wider">Siguiente</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal: Nuevo ── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-6">
          <div ref={focusTrapRef} className="bg-white rounded-lg shadow-2xl border border-slate-100 w-full max-w-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-8 py-6 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-800">
                {(editingPedidoId || editingClienteId) ? 'Editar' : 'Nuevo'} {tab === 'pedidos' ? 'Pedido' : tab === 'facturas' ? 'Factura' : 'Cliente'}
              </h2>
              <button onClick={() => { setShowModal(false); setEditingPedidoId(null); setEditingClienteId(null); }} className="p-2 hover:bg-slate-100 rounded-md transition-colors">
                <X size={20} className="text-slate-400" />
              </button>
            </div>

            <form onSubmit={
              tab === 'pedidos' ? handleSubmitPedido :
              tab === 'facturas' ? handleSubmitFactura : handleSubmitCliente
            } className="px-8 py-6 space-y-4">
              {formError && (
                <div className="p-3 bg-red-50 text-red-600 text-xs font-bold rounded-md border border-red-100">{formError}</div>
              )}

              {/* ─── PEDIDO ─── */}
              {tab === 'pedidos' && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">ID <span className="required-star">*</span></label>
                      <input name="ped_id" value={formData.ped_id || ''} disabled className="w-full p-3 bg-slate-100 border border-slate-200 rounded-md outline-none text-sm font-medium text-slate-400 mt-1" />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Fecha <span className="required-star">*</span></label>
                      <input name="ped_fecha" type="date" value={formData.ped_fecha || ''} onChange={handleChange} min={new Date().toISOString().split('T')[0]} className={`w-full p-3 bg-white border-2 rounded-md outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium mt-1 ${errors.ped_fecha ? 'border-red-400' : 'border-slate-300'}`} />
                      {errors.ped_fecha && <p className="text-red-500 text-xs mt-1">{errors.ped_fecha}</p>}
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Cliente <span className="required-star">*</span></label>
                    <div className="flex gap-2 mt-1">
                      <select
                        name="ped_cli_id_fk"
                        value={formData.ped_cli_id_fk || ''}
                        onChange={handleChange}
                        className={`flex-1 p-3 bg-white border-2 rounded-md outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium ${errors.ped_cli_id_fk ? 'border-red-400' : 'border-slate-300'}`}
                      >
                      {errors.ped_cli_id_fk && <p className="text-red-500 text-xs mt-1">{errors.ped_cli_id_fk}</p>}
                        <option value="">Seleccionar cliente...</option>
                        {clientes.map(c => (
                          <option key={c.cli_id} value={c.cli_id}>
                            {c.cli_id} - {c.cli_nombre} {c.cli_apellido}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => setShowNewClientForm(!showNewClientForm)}
                        className="px-3 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 transition-all text-sm font-bold flex items-center gap-1"
                        title="Crear nuevo cliente"
                      >
                        <Plus size={16} />
                      </button>
                    </div>
                  </div>

                  {showNewClientForm && (
                    <div className="p-4 bg-slate-50 rounded-md border border-slate-200 space-y-3">
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Crear nuevo cliente</p>
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <label className="text-[10px] font-bold text-slate-400 uppercase">ID *</label>
                          <input name="cli_id" type="number" min="1" max="9999999" value={formData.cli_id || ''} onChange={handleChange} className="w-full p-2 bg-white border border-slate-300 rounded text-sm mt-0.5" />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-slate-400 uppercase">Tipo Doc *</label>
                          <select name="cli_tipo_documento" value={formData.cli_tipo_documento || 'CC'} onChange={handleChange} className="w-full p-2 bg-white border border-slate-300 rounded text-sm mt-0.5">
                            <option value="CC">CC</option>
                            <option value="NIT">NIT</option>
                            <option value="CE">CE</option>
                            <option value="TI">TI</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-slate-400 uppercase">Teléfono</label>
                          <input name="cli_telefono" value={formData.cli_telefono || ''} onChange={handleChange} maxLength="10" placeholder="3001234567" className="w-full p-2 bg-white border border-slate-300 rounded text-sm mt-0.5" />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] font-bold text-slate-400 uppercase">Nombre *</label>
                          <input name="cli_nombre" value={formData.cli_nombre || ''} onChange={handleChange} className="w-full p-2 bg-white border border-slate-300 rounded text-sm mt-0.5" />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-slate-400 uppercase">Apellido *</label>
                          <input name="cli_apellido" value={formData.cli_apellido || ''} onChange={handleChange} className="w-full p-2 bg-white border border-slate-300 rounded text-sm mt-0.5" />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] font-bold text-slate-400 uppercase">Dirección</label>
                          <input name="cli_direccion" value={formData.cli_direccion || ''} onChange={handleChange} className="w-full p-2 bg-white border border-slate-300 rounded text-sm mt-0.5" />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-slate-400 uppercase">Correo *</label>
                          <input name="cli_correo" type="email" value={formData.cli_correo || ''} onChange={handleChange} className="w-full p-2 bg-white border border-slate-300 rounded text-sm mt-0.5" />
                        </div>
                      </div>
                      <div className="flex gap-2 justify-end pt-1">
                        <button type="button" onClick={() => setShowNewClientForm(false)} className="px-4 py-2 text-xs font-bold text-slate-500 bg-white border border-slate-200 rounded-md hover:bg-slate-50">
                          Cancelar
                        </button>
                        <button type="button" onClick={handleQuickCreateCliente} className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 rounded-md hover:bg-emerald-700">
                          Crear Cliente
                        </button>
                      </div>
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Metodo Pago <span className="required-star">*</span></label>
                      <select name="ped_metodo_pago" value={formData.ped_metodo_pago || ''} onChange={handleChange} className={`w-full p-3 bg-white border-2 rounded-md outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium mt-1 ${errors.ped_metodo_pago ? 'border-red-400' : 'border-slate-300'}`}>
                        {errors.ped_metodo_pago && <p className="text-red-500 text-xs mt-1">{errors.ped_metodo_pago}</p>}
                        <option value="">Seleccionar...</option>
                        <option value="Efectivo">Efectivo</option>
                        <option value="Tarjeta">Tarjeta</option>
                        <option value="Transferencia">Transferencia</option>
                      </select>
                    </div>
                    {formData.ped_metodo_pago === 'Transferencia' && (
                      <div>
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Cuenta Bancaria <span className="required-star">*</span></label>
                        <select
                          name="ped_cuenta_bancaria"
                          value={formData.ped_cuenta_bancaria || ''}
                          onChange={handleChange}
                          className={`w-full p-3 bg-white border-2 rounded-md outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium mt-1 ${errors.ped_cuenta_bancaria ? 'border-red-400' : 'border-slate-300'}`}
                        >
                          <option value="">Seleccionar banco o billetera...</option>
                          <option value="Bancolombia">Bancolombia</option>
                          <option value="Davivienda">Davivienda</option>
                          <option value="Banco de Bogotá">Banco de Bogotá</option>
                          <option value="BBVA Colombia">BBVA Colombia</option>
                          <option value="Banco de Occidente">Banco de Occidente</option>
                          <option value="Banco Popular">Banco Popular</option>
                          <option value="Banco Agrario">Banco Agrario</option>
                          <option value="Banco Caja Social">Banco Caja Social</option>
                          <option value="Banco Falabella">Banco Falabella</option>
                          <option value="Scotiabank Colpatria">Scotiabank Colpatria</option>
                          <option value="Itaú Colombia">Itaú Colombia</option>
                          <option value="Banco Pichincha">Banco Pichincha</option>
                          <option value="Bancamía">Bancamía</option>
                          <option value="Bancoomeva">Bancoomeva</option>
                          <option value="AV Villas">AV Villas</option>
                          <option value="Nequi">Nequi</option>
                          <option value="Daviplata">Daviplata</option>
                          <option value="Movii">Movii</option>
                          <option value="Dale">Dale</option>
                        </select>
                      </div>
                    )}
                    <div>
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Estado <span className="required-star">*</span></label>
                      <select name="ped_estado_entrega" value={formData.ped_estado_entrega || ''} onChange={handleChange} className={`w-full p-3 bg-white border-2 rounded-md outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium mt-1 ${errors.ped_estado_entrega ? 'border-red-400' : 'border-slate-300'}`}>
                        {errors.ped_estado_entrega && <p className="text-red-500 text-xs mt-1">{errors.ped_estado_entrega}</p>}
                        <option value="">Seleccionar...</option>
                        <option value="Pendiente">Pendiente</option>
                        <option value="En preparación">En preparación</option>
                        <option value="En camino">En camino</option>
                        <option value="Entregado">Entregado</option>
                        {editingPedidoId && <option value="Anulado">Anulado</option>}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Usuario (vendedor)</label>
                    <input value={user?.id || ''} disabled className="w-full p-3 bg-slate-100 border border-slate-200 rounded-md outline-none text-sm font-medium text-slate-400 mt-1" />
                  </div>


                  {/* ── Productos del pedido ── */}
                  <div className="border-t border-slate-100 pt-4">
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Productos del pedido</label>
                      {productosSeleccionados.length > 0 && (
                        <span className="text-[10px] text-emerald-600 font-bold">{productosSeleccionados.length} producto{productosSeleccionados.length !== 1 ? 's' : ''} agregado{productosSeleccionados.length !== 1 ? 's' : ''}</span>
                      )}
                    </div>
                    <div className="flex gap-2 items-center">
                      <div className="flex-1">
                        <select
                          value={nuevoProducto.pro_id}
                          onChange={(e) => { setErrorProducto(''); setNuevoProducto({ ...nuevoProducto, pro_id: e.target.value }); }}
                          className="w-full p-2.5 bg-white border-2 border-slate-300 rounded-md outline-none text-sm font-medium"
                        >
                          <option value="">Seleccionar producto...</option>
                          {productosDisponibles.map(prod => (
                            <option key={prod.id} value={prod.id}>
                              {prod.id} — {prod.nombre} ({prod.cantidad_disponible || 0} uds.)
                            </option>
                          ))}
                        </select>
                      </div>
                      <input
                        type="number" min="1" placeholder="Cant."
                        value={nuevoProducto.cantidad}
                        onChange={(e) => setNuevoProducto({ ...nuevoProducto, cantidad: e.target.value })}
                        className="w-20 p-2.5 bg-white border-2 border-slate-300 rounded-md outline-none text-sm font-medium text-center shrink-0"
                      />
                      <button type="button" onClick={agregarProducto}
                        className="px-4 py-2.5 bg-emerald-600 text-white rounded-md text-xs font-bold uppercase hover:bg-emerald-700 transition-all shrink-0 whitespace-nowrap">
                        + Agregar
                      </button>
                    </div>

                    {errorProducto && (
                      <div className="mt-2 p-2 bg-red-50 text-red-600 text-[10px] font-bold rounded-lg border border-red-100">{errorProducto}</div>
                    )}
                    {productosSeleccionados.length > 0 && (
                      <div className="mt-3 bg-slate-50 rounded-md overflow-hidden border border-slate-100">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-slate-100 text-slate-400 uppercase font-bold">
                            <tr>
                              <th className="px-3 py-2">Producto</th>
                              <th className="px-3 py-2 text-right">Cant.</th>
                              <th className="px-3 py-2 text-right">P. Unit.</th>
                              <th className="px-3 py-2 text-right">Subtotal</th>
                              <th className="px-3 py-2"></th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-200 font-bold text-slate-600">
                            {productosSeleccionados.map(p => (
                              <tr key={p.pro_id}>
                                <td className="px-3 py-2 text-slate-400">{p.pro_id} — {p.pro_nombre}</td>
                                <td className="px-3 py-2 text-right">{p.cantidad}</td>
                                <td className="px-3 py-2 text-right">${parseFloat(p.precio_unitario || 0).toLocaleString()}</td>
                                <td className="px-3 py-2 text-right">${parseFloat(p.subtotal || 0).toLocaleString()}</td>
                                <td className="px-3 py-2 text-right">
                                  <button type="button" onClick={() => quitarProducto(p.pro_id)} className="text-red-400 hover:text-red-600 text-lg leading-none">&times;</button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}

                    <div className="flex justify-between items-center mt-3 pt-3 border-t border-slate-200">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total del pedido</span>
                      <span className="text-lg font-bold text-blue-600">${totalPedidoCalculado.toLocaleString()}</span>
                    </div>
                  </div>
                </>
              )}

              {/* ─── FACTURA ─── */}
              {tab === 'facturas' && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">ID Factura <span className="required-star">*</span></label>
                      <input name="id" value={formData.id || ''} disabled className="w-full p-3 bg-slate-100 border border-slate-200 rounded-md outline-none text-sm font-medium text-slate-400 mt-1" />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Fecha Emisión <span className="required-star">*</span></label>
                      <input name="fecha_emision" type="date" value={formData.fecha_emision || ''} onChange={handleChange} className={`w-full p-3 bg-white border-2 rounded-md outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium mt-1 ${errors.fecha_emision ? 'border-red-400' : 'border-slate-300'}`} />
                      {errors.fecha_emision && <p className="text-red-500 text-xs mt-1">{errors.fecha_emision}</p>}
                    </div>
                  </div>

                  {/* ── Pedido / Cliente (como los pedidos) ── */}
                  <div>
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Pedido / Cliente <span className="required-star">*</span></label>
                    <select
                      name="pedido_seleccionado"
                      value={formData.pedido_seleccionado || ''}
                      onChange={(e) => {
                        const pedId = e.target.value;
                        const ped = pedidos.find(p => p.ped_id === pedId);
                        if (ped) {
                          const cli = clientes.find(c => c.cli_id === ped.ped_cli_id_fk);
                          setFormData({
                            ...formData,
                            id: pedId,
                            pedido_seleccionado: pedId,
                            cli_id_fk: ped.ped_cli_id_fk,
                            total: ped.ped_total,
                            forma_pago: ped.ped_metodo_pago,
                            cuenta_bancaria: ped.ped_cuenta_bancaria || '',
                            fecha_emision: formData.fecha_emision || ped.ped_fecha,
                            cli_nombre_mostrar: cli ? `${cli.cli_nombre} ${cli.cli_apellido}` : `Cliente #${ped.ped_cli_id_fk}`,
                            cli_correo_mostrar: cli?.cli_correo || ''
                          });
                        }
                      }}
                      className="w-full p-3 bg-white border-2 border-slate-300 rounded-md outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium mt-1"
                    >
                      <option value="">Seleccionar pedido...</option>
                      {pedidos
                        .filter(p => p.ped_estado_entrega !== 'Anulado')
                        .map(p => {
                          const cli = clientes.find(c => c.cli_id === p.ped_cli_id_fk);
                          return (
                            <option key={p.ped_id} value={p.ped_id}>
                              {p.ped_id} — {cli ? `${cli.cli_nombre} ${cli.cli_apellido}` : `Cliente #${p.ped_cli_id_fk}`}
                            </option>
                          );
                        })}
                    </select>
                    {formData.cli_nombre_mostrar && (
                      <div className="mt-2 p-3 bg-blue-50 border border-blue-100 rounded-md text-sm">
                        <div className="font-bold text-blue-700">{formData.cli_nombre_mostrar}</div>
                        <div className="text-blue-500 text-xs mt-1">
                          <span className="font-medium">Email:</span> {formData.cli_correo_mostrar || 'Sin correo'}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Forma Pago <span className="required-star">*</span></label>
                      <select name="forma_pago" value={formData.forma_pago || ''} onChange={handleChange} className={`w-full p-3 bg-white border-2 rounded-md outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium mt-1 ${errors.forma_pago ? 'border-red-400' : 'border-slate-300'}`}>
                        {errors.forma_pago && <p className="text-red-500 text-xs mt-1">{errors.forma_pago}</p>}
                        <option value="">Seleccionar...</option>
                        <option value="Efectivo">Efectivo</option>
                        <option value="Tarjeta">Tarjeta</option>
                        <option value="Transferencia">Transferencia</option>
                      </select>
                    </div>
                    {formData.forma_pago === 'Transferencia' && (
                      <div>
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Cuenta Bancaria <span className="required-star">*</span></label>
                        <select name="cuenta_bancaria" value={formData.cuenta_bancaria || ''} onChange={handleChange}
                          className={`w-full p-3 bg-white border-2 rounded-md outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium mt-1 ${errors.cuenta_bancaria ? 'border-red-400' : 'border-slate-300'}`}>
                          <option value="">Seleccionar banco o billetera...</option>
                          <option value="Bancolombia">Bancolombia</option>
                          <option value="Davivienda">Davivienda</option>
                          <option value="Banco de Bogotá">Banco de Bogotá</option>
                          <option value="BBVA Colombia">BBVA Colombia</option>
                          <option value="Banco de Occidente">Banco de Occidente</option>
                          <option value="Banco Popular">Banco Popular</option>
                          <option value="Banco Agrario">Banco Agrario</option>
                          <option value="Banco Caja Social">Banco Caja Social</option>
                          <option value="Banco Falabella">Banco Falabella</option>
                          <option value="Scotiabank Colpatria">Scotiabank Colpatria</option>
                          <option value="Itaú Colombia">Itaú Colombia</option>
                          <option value="Banco Pichincha">Banco Pichincha</option>
                          <option value="Bancamía">Bancamía</option>
                          <option value="Bancoomeva">Bancoomeva</option>
                          <option value="AV Villas">AV Villas</option>
                          <option value="Nequi">Nequi</option>
                          <option value="Daviplata">Daviplata</option>
                          <option value="Movii">Movii</option>
                          <option value="Dale">Dale</option>
                        </select>
                      </div>
                    )}
                    <div>
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total <span className="required-star">*</span></label>
                      <input name="total" type="number" step="0.01" value={formData.total || ''} onChange={handleChange} className={`w-full p-3 bg-white border-2 rounded-md outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium mt-1 ${errors.total ? 'border-red-400' : 'border-slate-300'}`} />
                      {errors.total && <p className="text-red-500 text-xs mt-1">{errors.total}</p>}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Email Enviado <span className="required-star">*</span></label>
                      <select name="email_enviado" value={formData.email_enviado !== undefined ? formData.email_enviado : ''} onChange={handleChange} className="w-full p-3 bg-white border-2 border-slate-300 rounded-md outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium mt-1">
                        <option value="">Seleccionar...</option>
                        <option value="1">Sí (Enviado)</option>
                        <option value="0">No (Pendiente)</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Estado</label>
                      <select name="estado" value={formData.estado || 'Vigente'} onChange={handleChange} className="w-full p-3 bg-white border-2 border-slate-300 rounded-md outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium mt-1">
                        <option value="Vigente">Vigente</option>
                        <option value="Anulada">Anulada</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Usuario</label>
                    <input value={user?.id || ''} disabled className="w-full p-3 bg-slate-100 border border-slate-200 rounded-md outline-none text-sm font-medium text-slate-400 mt-1" />
                  </div>
                </>
              )}

              {/* ─── CLIENTE ─── */}
              {tab === 'clientes' && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">ID <span className="required-star">*</span></label>
                      <input name="cli_id" type="number" autoFocus value={formData.cli_id || ''} onChange={handleChange} className={`w-full p-3 bg-white border-2 rounded-md outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium mt-1 ${errors.cli_id ? 'border-red-400' : 'border-slate-300'}`} />
                      {errors.cli_id && <p className="text-red-500 text-xs mt-1">{errors.cli_id}</p>}
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Tipo Documento <span className="required-star">*</span></label>
                      <select name="cli_tipo_documento" value={formData.cli_tipo_documento || ''} onChange={handleChange} className="w-full p-3 bg-white border-2 border-slate-300 rounded-md outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium mt-1">
                        <option value="">Seleccionar...</option>
                        <option value="CC">CC</option>
                        <option value="NIT">NIT</option>
                        <option value="CE">CE</option>
                        <option value="TI">TI</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Nombre <span className="required-star">*</span></label>
                      <input name="cli_nombre" value={formData.cli_nombre || ''} onChange={handleChange} className={`w-full p-3 bg-white border-2 rounded-md outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium mt-1 ${errors.cli_nombre ? 'border-red-400' : 'border-slate-300'}`} />
                      {errors.cli_nombre && <p className="text-red-500 text-xs mt-1">{errors.cli_nombre}</p>}
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Apellido <span className="required-star">*</span></label>
                      <input name="cli_apellido" value={formData.cli_apellido || ''} onChange={handleChange} className={`w-full p-3 bg-white border-2 rounded-md outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium mt-1 ${errors.cli_apellido ? 'border-red-400' : 'border-slate-300'}`} />
                      {errors.cli_apellido && <p className="text-red-500 text-xs mt-1">{errors.cli_apellido}</p>}
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Correo <span className="required-star">*</span></label>
                    <input name="cli_correo" type="email" value={formData.cli_correo || ''} onChange={handleChange} className={`w-full p-3 bg-white border-2 rounded-md outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium mt-1 ${errors.cli_correo ? 'border-red-400' : 'border-slate-300'}`} />
                      {errors.cli_correo && <p className="text-red-500 text-xs mt-1">{errors.cli_correo}</p>}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Teléfono</label>
                      <input name="cli_telefono" value={formData.cli_telefono || ''} onChange={handleChange} maxLength="10" placeholder="3001234567" className="w-full p-3 bg-white border-2 border-slate-300 rounded-md outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium mt-1" />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Dirección</label>
                      <input name="cli_direccion" value={formData.cli_direccion || ''} onChange={handleChange} className="w-full p-3 bg-white border-2 border-slate-300 rounded-md outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium mt-1" />
                    </div>
                  </div>
                </>
              )}

              <button
                type="submit"
                disabled={formSubmitting || Object.keys(errors).length > 0}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-bold py-3.5 rounded-lg shadow-sm shadow-blue-100 transition-all active:scale-95 uppercase tracking-wider text-xs flex items-center justify-center gap-2"
              >
                {formSubmitting ? <Loader2 className="animate-spin" size={18} /> : null}
                Guardar
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal: Detalle de Pedido ── */}
      {showDetalle && detalleTipo === 'pedido' && detalleData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-6" onClick={() => setShowDetalle(false)}>
          <div className="bg-white rounded-xl shadow-2xl border border-slate-100 w-full max-w-xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-8 py-6 border-b border-slate-100">
              <h2 className="text-lg font-black text-slate-800">Pedido {detalleData.ped_id}</h2>
              <button onClick={() => setShowDetalle(false)} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                <X size={20} className="text-slate-400" />
              </button>
            </div>
            <div className="px-8 py-6 space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Fecha</span>
                  <p className="font-bold text-slate-700 mt-1">{detalleData.ped_fecha || '-'}</p>
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Cliente ID</span>
                  <p className="font-bold text-slate-700 mt-1">{detalleData.ped_cli_id_fk || '-'}</p>
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Metodo Pago</span>
                  <p className="font-bold text-slate-700 mt-1">
                    {['Nequi', 'Daviplata', 'Transferencia'].includes(detalleData.ped_metodo_pago)
                      ? `Transferencia${detalleData.ped_metodo_pago !== 'Transferencia' ? ` (${detalleData.ped_metodo_pago})` : detalleData.ped_cuenta_bancaria ? ` (${detalleData.ped_cuenta_bancaria})` : ''}`
                      : detalleData.ped_metodo_pago || '-'}
                  </p>
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Estado</span>
                  <p>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${getEstadoEntregaBadge(detalleData.ped_estado_entrega)}`}>
                      {detalleData.ped_estado_entrega}
                    </span>
                  </p>
                </div>
              </div>
              <div className="border-t border-slate-100 pt-4">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Productos del pedido</h3>
                {detalleData.lineas && detalleData.lineas.length > 0 ? (
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 text-xs text-slate-400 uppercase font-bold">
                      <tr>
                        <th className="px-3 py-2">Producto</th>
                        <th className="px-3 py-2 text-right">Cant.</th>
                        <th className="px-3 py-2 text-right">P. Unit.</th>
                        <th className="px-3 py-2 text-right">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-bold text-slate-600">
                      {detalleData.lineas.map((l, i) => (
                        <tr key={i}>
                          <td className="px-3 py-2 text-xs">{l.producto_nombre || l.det_pro_id_fk}</td>
                          <td className="px-3 py-2 text-right">{l.det_cantidad}</td>
                          <td className="px-3 py-2 text-right">${parseFloat(l.det_precio_unitario || 0).toLocaleString()}</td>
                          <td className="px-3 py-2 text-right">${parseFloat(l.det_subtotal || 0).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="border-t-2 border-slate-300">
                        <td colSpan="3" className="px-3 py-3 text-right text-xs font-black text-slate-400 uppercase">Total</td>
                        <td className="px-3 py-3 text-right font-black text-blue-600 text-lg">
                          ${parseFloat(detalleData.ped_total || 0).toLocaleString()}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                ) : (
                  <p className="text-sm text-slate-400 italic">Sin productos registrados</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal: Factura ── */}
      {showDetalle && detalleTipo === 'factura' && detalleData && (
        <>
          <style>{`
            /* ── Preview en pantalla: diseño limpio y legible ── */
            #factura-preview { display: block; }
            #factura-print  { display: none; }

            /* ── Al imprimir: ocultar preview, mostrar PDF completo ── */
            @media print {
              body * { visibility: hidden; }
              #factura-print, #factura-print * { visibility: visible; }
              #factura-print {
                display: block !important;
                position: absolute; left: 0; top: 0;
                width: 210mm; min-height: 297mm;
                background: #f7f3ed;
                padding: 12mm 10mm;
                font-family: 'Courier New', 'Courier', monospace;
              }
              #factura-preview { display: none !important; }
              /* Botón de cerrar y barra de acciones ocultos en print */
              .factura-actions { display: none !important; }
            }
            @page { margin: 0; size: A4; }
          `}</style>

          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setShowDetalle(false)}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>

              {/* ── Barra de acciones ── */}
              <div className="factura-actions flex items-center justify-between px-6 py-4 border-b border-slate-200 shrink-0">
                <div>
                  <h2 className="text-base font-bold text-slate-800">Factura {detalleData.id}</h2>
                  <p className="text-xs text-slate-400 mt-0.5">{detalleData.fecha_emision || ''}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => window.print()}
                    className="px-5 py-2.5 bg-blue-600 text-white rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-blue-700 transition-all shadow-sm"
                  >
                    Descargar PDF
                  </button>
                  <button onClick={() => setShowDetalle(false)} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                    <X size={20} className="text-slate-400" />
                  </button>
                </div>
              </div>

              {/* ════════════════════════════════════════════ */}
              {/* VISTA PREVIA EN PANTALLA — Simplificada     */}
              {/* ════════════════════════════════════════════ */}
              <div id="factura-preview" className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

                {/* ── Encabezado ── */}
                <div className="text-center pb-3 border-b border-slate-200">
                  <h3 className="text-lg font-black tracking-widest text-blue-700 uppercase">San Diego Distribuidora</h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">NIT: 900.123.456-7</p>
                </div>

                {/* ── Info cliente + factura ── */}
                <div className="flex justify-between items-start gap-4 text-sm">
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Cliente</p>
                    <p className="font-bold text-slate-800">
                      {detalleData.cliente?.cli_nombre
                        ? `${detalleData.cliente.cli_nombre} ${detalleData.cliente.cli_apellido || ''}`
                        : detalleData.pedidoRelacionado?.ped_cli_id_fk || '—'}
                    </p>
                    {detalleData.cliente?.cli_id && (
                      <p className="text-xs text-slate-500">
                        {detalleData.cliente.cli_tipo_documento || 'CC'} {detalleData.cliente.cli_id}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Factura N°</p>
                    <p className="text-lg font-black text-slate-800">{detalleData.id}</p>
                  </div>
                </div>

                {/* ── Tabla de productos (legible) ── */}
                <table className="w-full text-sm border border-slate-200 rounded-lg overflow-hidden">
                  <thead>
                    <tr className="bg-blue-600 text-white text-xs">
                      <th className="px-4 py-2.5 font-bold text-center w-14">Cant.</th>
                      <th className="px-4 py-2.5 font-bold">Producto</th>
                      <th className="px-4 py-2.5 font-bold text-right w-28">P. Unit.</th>
                      <th className="px-4 py-2.5 font-bold text-right w-28">Importe</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {detalleData.lineas && detalleData.lineas.length > 0 ? (
                      detalleData.lineas.map((l, i) => (
                        <tr key={i} className="bg-white">
                          <td className="px-4 py-2.5 text-center font-bold text-slate-600">{l.det_cantidad}</td>
                          <td className="px-4 py-2.5 font-semibold text-slate-700">{l.producto_nombre || l.det_pro_id_fk}</td>
                          <td className="px-4 py-2.5 text-right text-slate-600">${parseFloat(l.det_precio_unitario || 0).toFixed(2)}</td>
                          <td className="px-4 py-2.5 text-right font-bold text-slate-800">${parseFloat(l.det_subtotal || 0).toFixed(2)}</td>
                        </tr>
                      ))
                    ) : (
                      <tr><td colSpan="4" className="px-4 py-6 text-center text-slate-400 italic">Sin productos</td></tr>
                    )}
                  </tbody>
                </table>

                {/* ── Total (grande, visible) ── */}
                {(() => {
                  const subtotal = detalleData.lineas && detalleData.lineas.length > 0
                    ? detalleData.lineas.reduce((s, l) => s + parseFloat(l.det_subtotal || 0), 0)
                    : 0;
                  const iva = subtotal * 0.19;
                  const total = parseFloat(detalleData.total || subtotal + iva);
                  return (
                    <div className="flex justify-end">
                      <div className="w-60 bg-blue-50 rounded-lg p-4 space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-500">Subtotal</span>
                          <span className="font-semibold text-slate-700">${subtotal.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-500">IVA 19%</span>
                          <span className="font-semibold text-slate-700">${iva.toFixed(2)}</span>
                        </div>
                        <div className="border-t border-blue-200 pt-2 flex justify-between">
                          <span className="font-black text-blue-700 uppercase">Total</span>
                          <span className="font-black text-blue-700 text-lg">${total.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* ── Método de pago (breve) ── */}
                <div className="text-xs text-slate-400 text-center pt-2 border-t border-slate-100">
                  {detalleData.forma_pago && <span>Pago: {detalleData.forma_pago}</span>}
                  {detalleData.email_enviado === 1 && <span className="ml-3">Email: Enviado ✓</span>}
                </div>
              </div>

              {/* ════════════════════════════════════════════ */}
              {/* VERSIÓN PDF COMPLETA — Oculta en pantalla   */}
              {/* ════════════════════════════════════════════ */}
              <div id="factura-print" className="bg-[#f7f3ed] p-6 text-[#2d2d2d] font-mono">

                {/* ── ENCABEZADO ── */}
                <div className="text-center relative mb-4">
                  <div className="flex items-center justify-center gap-3 mb-1">
                    <span className="text-blue-600 text-xl">★</span>
                    <span className="text-blue-600 text-lg">✧</span>
                    <h1 className="text-3xl font-black text-black tracking-[6px]" style={{fontFamily: "'Impact', 'Arial Black', sans-serif", letterSpacing: '8px'}}>
                      FACTURA
                    </h1>
                    <span className="text-blue-600 text-lg">✧</span>
                    <span className="text-blue-600 text-xl">★</span>
                  </div>
                  <div className="flex items-center gap-1 text-blue-600 text-sm my-2">
                    <span>«</span>
                    <div className="flex-1 border-t-2 border-dashed border-blue-600"></div>
                    <span>»</span>
                  </div>
                  <p className="text-lg font-black text-black uppercase tracking-[4px] mt-2">San Diego Distribuidora</p>
                  <p className="text-base text-blue-600 font-bold mt-1">NIT: 900.123.456-7 · Barranquilla, Atlántico</p>
                  <p className="text-sm text-[#5a5a5a] mt-0.5">Cra.2 #45-15 Local 2 Ciudadela 20 de Julio · Tel: (605) 555-0123</p>
                </div>

                {/* ── DATOS CLIENTE + FACTURA ── */}
                <div className="flex items-stretch gap-0 mb-4 border border-[#d4c9b8] bg-white/40">
                  <div className="flex-1 p-2 border-r border-dashed border-[#d4c9b8]">
                    <p className="text-sm font-black text-blue-600 uppercase tracking-[2px] mb-0.5">Facturar a</p>
                    <p className="text-lg font-black text-[#2d2d2d]">
                      {detalleData.cliente?.cli_nombre
                        ? `${detalleData.cliente.cli_nombre} ${detalleData.cliente.cli_apellido || ''}`
                        : detalleData.pedidoRelacionado?.ped_cli_id_fk || 'Cliente'}
                    </p>
                    {detalleData.cliente?.cli_direccion && (
                      <p className="text-sm text-[#5a5a5a] mt-0.5">{detalleData.cliente.cli_direccion}</p>
                    )}
                    {detalleData.cliente?.cli_telefono && (
                      <p className="text-sm text-[#5a5a5a]">Tel: {detalleData.cliente.cli_telefono}</p>
                    )}
                    {detalleData.cliente?.cli_id && (
                      <p className="text-sm text-[#5a5a5a]">
                        {detalleData.cliente.cli_tipo_documento || 'CC'}: {detalleData.cliente.cli_id}
                      </p>
                    )}
                  </div>
                  <div className="w-56 p-2 text-right">
                    <p className="text-sm font-black text-blue-600 uppercase tracking-[2px] mb-0.5">No. Factura</p>
                    <p className="text-2xl font-black text-[#2d2d2d]">{detalleData.id}</p>
                    <p className="text-sm font-black text-blue-600 uppercase tracking-[2px] mt-1.5 mb-0.5">Fecha Emisión</p>
                    <p className="text-base font-bold">{detalleData.fecha_emision || '-'}</p>
                    <p className="text-sm font-black text-blue-600 uppercase tracking-[2px] mt-1.5 mb-0.5">Vencimiento</p>
                    <p className="text-base font-bold">
                      {detalleData.fecha_emision
                        ? (() => {
                            const d = new Date(detalleData.fecha_emision);
                            d.setDate(d.getDate() + 30);
                            return d.toISOString().split('T')[0];
                          })()
                        : '-'}
                    </p>
                  </div>
                </div>

                {/* ── TABLA DE PRODUCTOS ── */}
                <table className="w-full text-left mb-5 border border-[#d4c9b8]">
                  <thead>
                    <tr className="bg-blue-600 text-white">
                      <th className="px-2 py-2 text-sm font-black uppercase tracking-wider w-14 text-center">Cant.</th>
                      <th className="px-2 py-2 text-sm font-black uppercase tracking-wider">Descripción</th>
                      <th className="px-2 py-2 text-sm font-black uppercase tracking-wider text-right w-32">Precio Unitario</th>
                      <th className="px-2 py-2 text-sm font-black uppercase tracking-wider text-right w-28">Importe</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#e0d5c8]">
                    {detalleData.lineas && detalleData.lineas.length > 0 ? (
                      detalleData.lineas.map((l, i) => (
                        <tr key={i} className="bg-white/60">
                          <td className="px-2 py-2 text-base text-center font-bold text-[#5a5a5a]">{l.det_cantidad}</td>
                          <td className="px-2 py-2 text-base font-bold text-[#2d2d2d]">{l.producto_nombre || l.det_pro_id_fk}</td>
                          <td className="px-2 py-2 text-base text-right font-bold text-[#5a5a5a]">${parseFloat(l.det_precio_unitario || 0).toFixed(2)}</td>
                          <td className="px-2 py-2 text-base text-right font-bold text-[#2d2d2d]">${parseFloat(l.det_subtotal || 0).toFixed(2)}</td>
                        </tr>
                      ))
                    ) : (
                      <tr><td colSpan="4" className="px-2 py-3 text-center text-base text-[#8a7e6b] italic bg-white/60">Sin productos registrados</td></tr>
                    )}
                  </tbody>
                </table>

                {/* ── TOTALES ── */}
                {(() => {
                  const subtotal = detalleData.lineas && detalleData.lineas.length > 0
                    ? detalleData.lineas.reduce((s, l) => s + parseFloat(l.det_subtotal || 0), 0)
                    : 0;
                  const iva = subtotal * 0.19;
                  const total = parseFloat(detalleData.total || subtotal + iva);
                  return (
                    <div className="flex justify-end mb-4">
                      <div className="w-64 border border-[#d4c9b8] bg-white/40">
                        <div className="px-3 py-2.5 flex justify-between text-base border-b border-dashed border-[#e0d5c8]">
                          <span className="font-bold text-[#5a5a5a] uppercase tracking-wider">Subtotal</span>
                          <span className="font-bold text-[#2d2d2d]">${subtotal.toFixed(2)}</span>
                        </div>
                        <div className="px-3 py-2.5 flex justify-between text-base border-b border-dashed border-[#e0d5c8]">
                          <span className="font-bold text-[#5a5a5a] uppercase tracking-wider">IVA 19.0%</span>
                          <span className="font-bold text-[#2d2d2d]">${iva.toFixed(2)}</span>
                        </div>
                        <div className="px-3 py-3 flex justify-between bg-blue-600/10">
                          <span className="font-black text-blue-600 uppercase tracking-wider text-lg">TOTAL</span>
                          <span className="font-black text-blue-600 text-2xl">${total.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* ── FIRMA ── */}
                <div className="mb-4 text-right">
                  <div className="inline-block border-b border-[#2d2d2d] pb-0.5 px-8">
                    <p className="text-base text-[#2d2d2d]" style={{fontFamily: "'Brush Script MT', 'Segoe Script', cursive", fontSize: '18px'}}>
                      {detalleData.usuario_id || '_________________'}
                    </p>
                  </div>
                  <p className="text-sm text-[#5a5a5a] mt-0.5 uppercase tracking-wider">Firma Autorizada</p>
                </div>

                {/* ── LÍNEA SEPARADORA ── */}
                <div className="flex items-center gap-2 text-blue-600 text-sm mb-4">
                  <span>◄◄</span>
                  <div className="flex-1 border-t-2 border-dashed border-blue-600"></div>
                  <span>►►</span>
                </div>

                {/* ── PIE DE PÁGINA ── */}
                <div className="flex gap-6">
                  <div className="flex-1">
                    <p className="text-sm font-black text-blue-600 uppercase tracking-[2px] mb-0.5">Condiciones y Forma de Pago</p>
                    <p className="text-base text-[#5a5a5a]">Plazo: 15 días desde la fecha de emisión</p>
                    <p className="text-base text-[#5a5a5a]">
                      {detalleData.cuenta_bancaria
                        ? `Banco Santander · Cuenta: ${detalleData.cuenta_bancaria}`
                        : `Método: ${detalleData.forma_pago || 'Efectivo'}`}
                    </p>
                    {detalleData.cliente?.cli_correo && (
                      <p className="text-base text-[#5a5a5a]">Email: {detalleData.cliente.cli_correo}</p>
                    )}
                  </div>
                  <div className="text-right flex items-end">
                    <p className="text-2xl font-black text-blue-600" style={{fontFamily: "'Impact', 'Arial Black', sans-serif", letterSpacing: '6px'}}>
                      Gracias
                    </p>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </>
      )}

      {/* ── Modal: Confirmar cancelación ── */}
      {showConfirmCancel && pedidoACancelar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-6" onClick={() => setShowConfirmCancel(false)}>
          <div className="bg-white rounded-xl shadow-2xl border border-slate-100 w-full max-w-sm" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h3 className="text-sm font-bold text-red-600 uppercase tracking-wider flex items-center gap-2">
                <AlertTriangle size={16} /> Cancelar pedido
              </h3>
              <button onClick={() => setShowConfirmCancel(false)} className="p-1.5 hover:bg-slate-100 rounded-md">
                <X size={18} className="text-slate-400" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-slate-600">
                Vas a cancelar el pedido <strong>{pedidoACancelar.ped_id}</strong>.
              </p>
              <p className="text-xs text-slate-400">
                El pedido se marcará como <strong>Anulado</strong>, se registrará
                la anulación y se crearán automáticamente las devoluciones de los productos asociados.
              </p>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => { setShowConfirmCancel(false); setPedidoACancelar(null); }}
                  className="flex-1 px-4 py-2.5 text-xs font-bold text-slate-500 bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-100 transition-all"
                >
                  Volver
                </button>
                <button
                  onClick={cancelarPedidoConDevolucion}
                  disabled={cancelLoading}
                  className="flex-1 px-4 py-2.5 text-xs font-bold text-white bg-red-600 rounded-lg hover:bg-red-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {cancelLoading ? (
                    <><Loader2 className="animate-spin" size={14} /> Procesando...</>
                  ) : (
                    'Cancelar pedido'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal: Verificar pago ── */}
      {showVerificarModal && pedidoAVerificar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-6" onClick={cerrarVerificarPago}>
          <div className="bg-white rounded-xl shadow-2xl border border-slate-100 w-full max-w-xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Verificar pago</h3>
              <button onClick={cerrarVerificarPago} className="p-1.5 hover:bg-slate-100 rounded-md">
                <X size={18} className="text-slate-400" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-slate-600">
                Pedido: <strong>{pedidoAVerificar.ped_id}</strong>
              </p>
              {pedidoComprobanteCargando ? (
                <div className="bg-slate-50 rounded-lg p-6 flex justify-center items-center">
                  <Loader2 className="animate-spin text-slate-400" size={24} />
                  <span className="ml-2 text-sm text-slate-400">Cargando comprobante...</span>
                </div>
              ) : comprobanteUrl ? (
                <div className="bg-slate-50 rounded-lg p-4 flex justify-center">
                  {pedidoAVerificar?.ped_comprobante_tipo?.startsWith('image/') ? (
                    <>
                      <img
                        src={comprobanteUrl}
                        alt="Comprobante"
                        className="max-h-96 w-full rounded object-contain"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          const fallback = e.target.nextElementSibling;
                          if (fallback) fallback.style.display = 'flex';
                        }}
                      />
                      <div className="hidden flex-col items-center gap-2 py-8 text-slate-400">
                        <FileText size={32} strokeWidth={1.5} />
                        <p className="text-sm font-medium">No se pudo cargar la vista previa</p>
                        <a href={comprobanteUrl} download={`comprobante.${pedidoAVerificar?.ped_comprobante_tipo?.split('/')[1] || 'png'}`} className="text-xs text-blue-500 hover:underline font-bold">Descargar archivo</a>
                      </div>
                    </>
                  ) : (
                    <iframe
                      src={comprobanteUrl}
                      title="Comprobante PDF"
                      className="w-full h-96 rounded border-0"
                    />
                  )}
                </div>
              ) : (
                <div className="bg-slate-50 rounded-lg p-6 text-center text-sm text-slate-400">
                  No se encontró comprobante
                </div>
              )}
              {pedidoAVerificar.ped_estado_pago !== 'Verificado' ? (
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => confirmarVerificarPago('Rechazado')}
                    disabled={notifLoading}
                    className="flex-1 px-4 py-2.5 text-xs font-bold text-red-600 bg-red-50 border border-red-100 rounded-lg hover:bg-red-100 transition-all disabled:opacity-50"
                  >
                    Rechazar
                  </button>
                  <button
                    onClick={() => confirmarVerificarPago('Verificado')}
                    disabled={notifLoading}
                    className="flex-1 px-4 py-2.5 text-xs font-bold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-all disabled:opacity-50"
                  >
                    {notifLoading ? 'Procesando...' : 'Verificar pago ✓'}
                  </button>
                </div>
              ) : (
                <div className="pt-2 text-center">
                  <span className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-emerald-600 bg-emerald-50 rounded-lg">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                    Pago ya verificado
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Modal: Notificar cliente ── */}
      {showNotificarModal && pedidoANotificar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-6" onClick={() => { setShowNotificarModal(false); setNotifResultadoCorreo(null); setNotifResultadoFactura(null); }}>
          <div className="bg-white rounded-xl shadow-2xl border border-slate-100 w-full max-w-md" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Notificar cliente</h3>
              <button onClick={() => { setShowNotificarModal(false); setNotifResultadoCorreo(null); setNotifResultadoFactura(null); }} className="p-1.5 hover:bg-slate-100 rounded-md">
                <X size={18} className="text-slate-400" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-slate-600">
                Pedido: <strong>{pedidoANotificar.ped_id}</strong> — Pago verificado ✓
              </p>
              <p className="text-xs text-slate-400">
                El pedido está listo. Elige una opción:
              </p>

              <div className="flex flex-col gap-2">
                <button
                  onClick={async () => {
                    setNotifResultadoCorreo(null);
                    setNotifLoadingCorreo(true);
                    try {
                      await pedidosService.notificar(pedidoANotificar.ped_id, 'email');
                      setNotifResultadoCorreo({ ok: true, mensaje: '✓ Correo enviado' });
                    } catch (err) {
                      setNotifResultadoCorreo({ ok: false, mensaje: '✗ ' + (err.response?.data?.mensaje || 'Error') });
                    } finally {
                      setNotifLoadingCorreo(false);
                    }
                  }}
                  disabled={notifLoadingCorreo || !!notifResultadoCorreo}
                  className={`flex items-center gap-3 px-4 py-3 text-sm font-bold rounded-lg border transition-all disabled:opacity-60 ${
                    notifResultadoCorreo
                      ? notifResultadoCorreo.ok ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-red-50 text-red-600 border-red-200'
                      : 'text-slate-700 bg-slate-50 border-slate-200 hover:bg-blue-50 hover:border-blue-200'
                  }`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-blue-500"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                  {notifLoadingCorreo ? 'Enviando...' : notifResultadoCorreo ? notifResultadoCorreo.mensaje : 'Notificar por correo'}
                </button>
                <button
                  onClick={async () => {
                    setNotifResultadoFactura(null);
                    setNotifLoadingFactura(true);
                    try {
                      await pedidosService.enviarFactura(pedidoANotificar.ped_id);
                      setNotifResultadoFactura({ ok: true, mensaje: '✓ Factura enviada' });
                    } catch (err) {
                      setNotifResultadoFactura({ ok: false, mensaje: '✗ ' + (err.response?.data?.mensaje || 'Error') });
                    } finally {
                      setNotifLoadingFactura(false);
                    }
                  }}
                  disabled={notifLoadingFactura || !!notifResultadoFactura}
                  className={`flex items-center gap-3 px-4 py-3 text-sm font-bold rounded-lg border transition-all disabled:opacity-60 ${
                    notifResultadoFactura
                      ? notifResultadoFactura.ok ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-red-50 text-red-600 border-red-200'
                      : 'text-slate-700 bg-slate-50 border-slate-200 hover:bg-emerald-50 hover:border-emerald-200'
                  }`}
                >
                  <FileText size={18} className="text-emerald-500" />
                  {notifLoadingFactura ? 'Enviando...' : notifResultadoFactura ? notifResultadoFactura.mensaje : 'Enviar factura al correo'}
                </button>
              </div>
              <button
                onClick={() => { setShowNotificarModal(false); setNotifResultadoCorreo(null); setNotifLoadingCorreo(false); setNotifResultadoFactura(null); setNotifLoadingFactura(false); }}
                className="w-full py-2.5 text-xs font-bold text-slate-600 bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-100 transition-all"
              >
                {notifResultadoCorreo || notifResultadoFactura ? 'Cerrar' : 'Cancelar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal: QR de entrega ── */}
      {showQRModal && pedidoQR && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-6" onClick={() => setShowQRModal(false)}>
          <div className="bg-white rounded-xl shadow-2xl border border-slate-100 w-full max-w-md" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Código QR de entrega</h3>
              <button onClick={() => setShowQRModal(false)} className="p-1.5 hover:bg-slate-100 rounded-md">
                <X size={18} className="text-slate-400" />
              </button>
            </div>
            <div className="p-6 space-y-4 text-center">
              <p className="text-sm text-slate-600">
                Pedido: <strong>{pedidoQR.ped_id}</strong>
              </p>
              {pedidoQR.ped_token_entrega ? (
                <>
                  {/* ── Campo editable para la URL del backend ── */}
                  <div className="text-left">
                    <label className="text-xs font-medium text-slate-500 mb-1 block">
                      URL del servidor (visible desde otros dispositivos en la red):
                    </label>
                    <input
                      type="text"
                      value={qrBaseUrl}
                      onChange={(e) => actualizarQrUrl(e.target.value)}
                      className="w-full px-3 py-2 text-xs font-mono text-slate-700 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-300 focus:border-purple-400"
                    />
                    <p className="text-xs text-amber-500 mt-1">
                      Prueba desde tu teléfono: abre el navegador y escribe <strong>{qrBaseUrl}</strong> — si ves la API, el teléfono puede alcanzar el servidor. Si no, cambia <strong>localhost</strong> por la IP local del PC (ej: 192.168.1.50).
                    </p>
                  </div>

                  <div className="bg-white rounded-lg p-4 flex justify-center">
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(qrBaseUrl + '/confirmar-entrega/' + pedidoQR.ped_token_entrega)}`}
                      alt="QR de entrega"
                      className="rounded-lg"
                    />
                  </div>
                  <p className="text-xs text-slate-400">
                    El repartidor escanea este código con su celular<br />
                    para confirmar la entrega del pedido.
                  </p>
                  <div className="flex gap-2">
                    <a
                      href={`https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(qrBaseUrl + '/confirmar-entrega/' + pedidoQR.ped_token_entrega)}`}
                      download={`qr-entrega-${pedidoQR.ped_id}.png`}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold text-purple-600 bg-purple-50 border border-purple-200 rounded-lg hover:bg-purple-100 transition-all"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                      Descargar QR
                    </a>
                    <button
                      onClick={() => {
                        const url = qrBaseUrl + '/confirmar-entrega/' + pedidoQR.ped_token_entrega;
                        navigator.clipboard.writeText(url);
                        toast({ type: 'success', title: 'Copiado', description: 'Enlace copiado al portapapeles' });
                      }}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold text-slate-600 bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-100 transition-all"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                      Copiar enlace
                    </button>
                  </div>
                </>
              ) : (
                <div className="bg-amber-50 rounded-lg p-6 text-center">
                  <p className="text-sm text-amber-700 font-medium">
                    Este pedido no tiene token de entrega.
                  </p>
                  <p className="text-xs text-amber-500 mt-1">
                    El token se genera automáticamente al despachar el pedido.
                  </p>
                </div>
              )}
              <button
                onClick={() => {
                  setShowQRModal(false);
                  // Refrescar datos al cerrar el QR (por si el repartidor confirmó)
                  setTimeout(() => refreshData(), 500);
                }}
                className="w-full py-2.5 text-xs font-bold text-slate-600 bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-100 transition-all"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal: Preview comprobante ── */}
      {showPreviewModal && formData.ped_comprobante && formData.ped_comprobante_tipo && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4" onClick={() => setShowPreviewModal(false)}>
          <div className="relative bg-white rounded-xl shadow-2xl border border-slate-100 w-full max-w-2xl max-h-[90vh] overflow-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 sticky top-0 bg-white z-10">
              <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Comprobante de pago</h3>
              <button onClick={() => setShowPreviewModal(false)} className="p-1.5 hover:bg-slate-100 rounded-md transition-colors">
                <X size={18} className="text-slate-400" />
              </button>
            </div>
            <div className="p-6 flex justify-center">
              {formData.ped_comprobante_tipo.startsWith('image/') ? (
                <img
                  src={`data:${formData.ped_comprobante_tipo};base64,${formData.ped_comprobante}`}
                  alt="Comprobante de pago"
                  className="max-w-full max-h-[70vh] rounded-lg shadow-sm object-contain"
                />
              ) : formData.ped_comprobante_tipo === 'application/pdf' ? (
                <embed
                  src={`data:${formData.ped_comprobante_tipo};base64,${formData.ped_comprobante}`}
                  type="application/pdf"
                  className="w-full h-[70vh] rounded-lg"
                />
              ) : (
                <div className="flex flex-col items-center gap-3 py-12 text-slate-400">
                  <FileText size={48} />
                  <p className="text-sm font-medium">Vista previa no disponible para este tipo de archivo</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Modal: Ficha del cliente (E-card) ── */}
      {showClienteTarjeta && clienteTarjeta && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-6" onClick={() => setShowClienteTarjeta(false)}>
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 w-full max-w-md overflow-hidden" onClick={e => e.stopPropagation()}>
            {/* Cabecera con color */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-8 py-8 text-center">
              <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <Users size={36} className="text-white" />
              </div>
              <h3 className="text-xl font-bold text-white">{clienteTarjeta.cli_nombre} {clienteTarjeta.cli_apellido}</h3>
              <p className="text-blue-200 text-sm mt-1">{clienteTarjeta.cli_tipo_documento} • {clienteTarjeta.cli_id}</p>
            </div>
            {/* Cuerpo */}
            <div className="px-8 py-6 space-y-5">
              <div className="grid grid-cols-1 gap-4">
                <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-blue-600"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Correo electrónico</p>
                    <p className="text-sm font-bold text-slate-700">{clienteTarjeta.cli_correo || '—'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl">
                  <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-emerald-600"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Teléfono</p>
                    <p className="text-sm font-bold text-slate-700">{clienteTarjeta.cli_telefono || '—'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl">
                  <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-amber-600"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Dirección</p>
                    <p className="text-sm font-bold text-slate-700">{clienteTarjeta.cli_direccion || '—'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-purple-600"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Tipo de documento</p>
                    <p className="text-sm font-bold text-slate-700">{clienteTarjeta.cli_tipo_documento || '—'}</p>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setShowClienteTarjeta(false)}
                className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs uppercase tracking-wider rounded-xl transition-all"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal: Subir comprobante ── */}
      {showSubirComprobanteModal && pedidoSubirComprobante && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-6" onClick={() => setShowSubirComprobanteModal(false)}>
          <div className="bg-white rounded-xl shadow-2xl border border-slate-100 w-full max-w-md" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Subir comprobante</h3>
              <button onClick={() => setShowSubirComprobanteModal(false)} className="p-1.5 hover:bg-slate-100 rounded-md">
                <X size={18} className="text-slate-400" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-slate-600">
                Pedido: <strong>{pedidoSubirComprobante.ped_id}</strong>
              </p>
              <SubirComprobanteForm
                pedidoId={pedidoSubirComprobante.ped_id}
                onSuccess={() => {
                  setShowSubirComprobanteModal(false);
                  setPedidoSubirComprobante(null);
                  refreshData();
                }}
                onCancel={() => {
                  setShowSubirComprobanteModal(false);
                  setPedidoSubirComprobante(null);
                }}
              />
            </div>
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

// ── Componente interno para subir comprobante ──
const SubirComprobanteForm = ({ pedidoId, onSuccess, onCancel }) => {
  const [archivo, setArchivo] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');

  const handleFileChange = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    const validTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg'];
    if (!validTypes.includes(f.type)) {
      setError('Solo se permiten PDF o imágenes (PNG, JPG)');
      return;
    }
    if (f.size > 10 * 1024 * 1024) {
      setError('El archivo no debe superar 10 MB');
      return;
    }
    setError('');
    const reader = new FileReader();
    reader.onload = () => {
      setArchivo({
        base64: reader.result.split(',')[1],
        tipo: f.type,
        nombre: f.name
      });
    };
    reader.readAsDataURL(f);
  };

  const handleSubmit = async () => {
    if (!archivo) {
      setError('Selecciona un archivo');
      return;
    }
    setCargando(true);
    setError('');
    try {
      await pedidosService.subirComprobante(pedidoId, {
        ped_comprobante: archivo.base64,
        ped_comprobante_tipo: archivo.tipo
      });
      onSuccess();
    } catch (err) {
      setError(err.response?.data?.mensaje || 'Error al subir comprobante');
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="space-y-4">
      {error && (
        <div className="p-3 bg-red-50 text-red-600 text-xs font-bold rounded-md border border-red-100">{error}</div>
      )}
      <div>
        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Archivo (PDF o imagen)</label>
        <input
          type="file"
          accept=".pdf,.png,.jpg,.jpeg"
          onChange={handleFileChange}
          className="w-full p-2 bg-white border-2 border-slate-300 rounded-md outline-none text-sm font-medium mt-1 file:mr-3 file:py-1.5 file:px-3 file:rounded file:text-xs file:font-bold file:bg-blue-50 file:text-blue-700 file:border-0 hover:file:bg-blue-100"
        />
        {archivo && (
          <p className="text-xs text-emerald-600 font-medium mt-1">Archivo: {archivo.nombre}</p>
        )}
      </div>
      <div className="flex gap-3 pt-2">
        <button
          onClick={onCancel}
          disabled={cargando}
          className="flex-1 px-4 py-2.5 text-xs font-bold text-slate-600 bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-100 transition-all disabled:opacity-50"
        >
          Cancelar
        </button>
        <button
          onClick={handleSubmit}
          disabled={cargando || !archivo}
          className="flex-1 px-4 py-2.5 text-xs font-bold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {cargando ? <Loader2 className="animate-spin" size={16} /> : null}
          {cargando ? 'Subiendo...' : 'Subir comprobante'}
        </button>
      </div>
    </div>
  );
};

export default Ventas;




