import React, { useState, useEffect } from 'react';
import { ShoppingCart, FileText, Users, Search, Plus, X, RefreshCw, Eye } from 'lucide-react';
import { ThemeLoader } from '../components/ThemeLoader';
import { pedidosService } from '../api/services/pedidosService';
import { facturasService } from '../api/services/facturasService';
import { clientesService } from '../api/services/clientesService';
import { productosService } from '../api/services/productosService';
import { detallesPedidosService } from '../api/services/detallesPedidosService';
import { useAuth } from '../context/AuthContext';
import { useFocusTrap } from '../hooks/useFocusTrap';

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
  const { user } = useAuth();
  const [formData, setFormData] = useState({});
  const [productosDisponibles, setProductosDisponibles] = useState([]);
  const focusTrapRef = useFocusTrap(showModal);
  const [productosSeleccionados, setProductosSeleccionados] = useState([]);

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

  const openModal = async () => {
    setFormData({});
    setFormError('');
    setProductosSeleccionados([]);
    // Cargar productos para el selector (pedidos)
    if (tab === 'pedidos') {
      try {
        const prods = await productosService.listar();
        setProductosDisponibles(prods.filter(p => p.estado === 'Activo'));
      } catch {
        setProductosDisponibles([]);
      }
    }
    setShowModal(true);
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
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
    } catch (err) {
      console.error('Error cargando ventas:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const tabs = [
    { id: 'pedidos', label: 'Pedidos', icon: ShoppingCart },
    { id: 'facturas', label: 'Facturas', icon: FileText },
    { id: 'clientes', label: 'Clientes', icon: Users },
  ];

  const filteredPedidos = pedidos.filter(p =>
    (p.ped_id || '').toLowerCase().includes(searchTerm.toLowerCase())
  );
  const filteredFacturas = facturas.filter(f =>
    (f.id || '').toString().toLowerCase().includes(searchTerm.toLowerCase())
  );
  const filteredClientes = clientes.filter(c =>
    (c.cli_nombre || c.cli_apellido || (c.cli_id ? String(c.cli_id) : '')).toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getEstadoEntregaBadge = (estado) => {
    const map = {
      'Entregado': 'text-emerald-600 bg-emerald-50',
      'En camino': 'text-blue-600 bg-blue-50',
      'No entregado': 'text-red-600 bg-red-50',
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

  const handleSubmitPedido = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!formData.ped_id || !formData.ped_fecha || !formData.ped_metodo_pago || !formData.ped_estado_entrega || !formData.ped_cli_id_fk) {
      setFormError('Todos los campos con * son obligatorios');
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
    setFormSubmitting(true);
    try {
      // 1. Crear pedido
      await pedidosService.registrar({
        ped_id: formData.ped_id,
        ped_fecha: formData.ped_fecha,
        ped_metodo_pago: formData.ped_metodo_pago,
        ped_cuenta_bancaria: formData.ped_cuenta_bancaria || null,
        ped_estado_entrega: formData.ped_estado_entrega,
        ped_total: totalPed,
        ped_cli_id_fk: clienteId,
        ped_usu_id_fk: user?.id || null
      });
      // 2. Crear detalles del pedido
      for (let i = 0; i < productosSeleccionados.length; i++) {
        const p = productosSeleccionados[i];
        await detallesPedidosService.registrar({
          det_id: `${formData.ped_id}-DET${String(i + 1).padStart(3, '0')}`,
          det_ped_id_fk: formData.ped_id,
          det_pro_id_fk: p.pro_id,
          det_cantidad: p.cantidad,
          det_precio_unitario: p.precio_unitario,
          det_subtotal: p.subtotal
        });
      }
      setShowModal(false);
      fetchData();
    } catch (err) {
      setFormError(err.response?.data?.mensaje || 'Error al crear pedido');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleSubmitFactura = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!formData.id || !formData.fecha_emision || formData.email_enviado === undefined || !formData.forma_pago) {
      setFormError('Todos los campos con * son obligatorios');
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
        estado: formData.estado || 'Vigente'
      });
      setShowModal(false);
      fetchData();
    } catch (err) {
      setFormError(err.response?.data?.mensaje || 'Error al crear factura');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleSubmitCliente = async (e) => {
    e.preventDefault();
    setFormError('');
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
      await clientesService.registrar({
        cli_id: cliId,
        cli_tipo_documento: formData.cli_tipo_documento,
        cli_nombre: formData.cli_nombre,
        cli_apellido: formData.cli_apellido,
        cli_correo: formData.cli_correo,
        cli_telefono: formData.cli_telefono || null,
        cli_direccion: formData.cli_direccion || null
      });
      setShowModal(false);
      fetchData();
    } catch (err) {
      setFormError(err.response?.data?.mensaje || 'Error al crear cliente');
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
        <div className="flex items-center gap-3 bg-white border border-slate-200 px-5 py-3 rounded-lg w-96 shadow-sm">
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
            <Plus size={16} /> Nuevo {tab === 'pedidos' ? 'Pedido' : tab === 'facturas' ? 'Factura' : 'Cliente'}
          </button>
        </div>
      </div>

      {/* TAB: Pedidos */}
      {tab === 'pedidos' && (
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left table-animate">
              <thead className="bg-slate-50/50 text-slate-400 text-xs uppercase font-bold tracking-wider border-b border-slate-100">
                <tr>
                  <th className="px-6 py-4">ID</th>
                  <th className="px-6 py-4">Cliente</th>
                  <th className="px-6 py-4">Fecha</th>
                  <th className="px-6 py-4">Método Pago</th>
                  <th className="px-6 py-4 text-right">Total</th>
                  <th className="px-6 py-4">Estado</th>
                  <th className="px-6 py-4 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-sm font-bold text-slate-600">
                {filteredPedidos.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-12 text-center text-slate-400 italic">
                      {searchTerm ? 'Sin resultados' : 'No hay pedidos registrados'}
                    </td>
                  </tr>
                ) : (
                  filteredPedidos.map((p, i) => (
                    <tr key={i} className="hover:bg-slate-50">
                      <td className="px-6 py-4 text-slate-400 text-xs">{p.ped_id}</td>
                      <td className="px-6 py-4">{p.ped_cli_id_fk || '-'}</td>
                      <td className="px-6 py-4 text-slate-400">{p.ped_fecha || '-'}</td>
                      <td className="px-6 py-4">
                        {p.ped_cuenta_bancaria
                          ? `Transferencia (${p.ped_cuenta_bancaria})`
                          : ['Nequi', 'Daviplata', 'Transferencia'].includes(p.ped_metodo_pago)
                            ? `Transferencia${p.ped_metodo_pago !== 'Transferencia' ? ` (${p.ped_metodo_pago})` : ''}`
                            : p.ped_metodo_pago || '-'}
                      </td>
                      <td className="px-6 py-4 text-right">
                        ${parseFloat(p.ped_total || 0).toLocaleString()}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${getEstadoEntregaBadge(p.ped_estado_entrega)}`}>
                          {p.ped_estado_entrega}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button onClick={() => abrirDetallePedido(p)} className="p-2 text-slate-400 hover:text-blue-600 transition-colors" title="Ver detalle">
                          <Eye size={16} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="px-6 py-4 bg-slate-50/30 border-t border-slate-100 text-xs text-slate-400 font-bold">
            {filteredPedidos.length} de {pedidos.length} pedidos
          </div>
        </div>
      )}

      {/* TAB: Facturas */}
      {tab === 'facturas' && (
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left table-animate">
              <thead className="bg-slate-50/50 text-slate-400 text-xs uppercase font-bold tracking-wider border-b border-slate-100">
                <tr>
                  <th className="px-6 py-4">ID Factura</th>
                  <th className="px-6 py-4">Fecha Emisión</th>
                  <th className="px-6 py-4">Forma Pago</th>
                  <th className="px-6 py-4">Email</th>
                  <th className="px-6 py-4 text-right">Total</th>
                  <th className="px-6 py-4">Estado</th>
                  <th className="px-6 py-4 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-sm font-bold text-slate-600">
                {filteredFacturas.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-12 text-center text-slate-400 italic">
                      {searchTerm ? 'Sin resultados' : 'No hay facturas registradas'}
                    </td>
                  </tr>
                ) : (
                  filteredFacturas.map((f, i) => (
                    <tr key={i} className="hover:bg-slate-50">
                      <td className="px-6 py-4 text-slate-400 text-xs">{f.id}</td>
                      <td className="px-6 py-4">{f.fecha_emision || '-'}</td>
                      <td className="px-6 py-4">
                        {f.cuenta_bancaria
                          ? `Transferencia (${f.cuenta_bancaria})`
                          : ['Nequi', 'Daviplata', 'Transferencia'].includes(f.forma_pago)
                            ? `Transferencia${f.forma_pago !== 'Transferencia' ? ` (${f.forma_pago})` : ''}`
                            : f.forma_pago || '-'}
                      </td>
                      <td className="px-6 py-4">{f.email_enviado === 1 ? '✅' : '❌'}</td>
                      <td className="px-6 py-4 text-right">${parseFloat(f.total || 0).toLocaleString()}</td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${getEstadoFacturaBadge(f.estado)}`}>
                          {f.estado || 'Vigente'}
                        </span>
                      </td>
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
          <div className="px-6 py-4 bg-slate-50/30 border-t border-slate-100 text-xs text-slate-400 font-bold">
            {filteredFacturas.length} de {facturas.length} facturas
          </div>
        </div>
      )}

      {/* TAB: Clientes */}
      {tab === 'clientes' && (
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
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
                    <td colSpan="6" className="px-6 py-12 text-center text-slate-400 italic">
                      {searchTerm ? 'Sin resultados' : 'No hay clientes registrados'}
                    </td>
                  </tr>
                ) : (
                  filteredClientes.map((c, i) => (
                    <tr key={i} className="hover:bg-slate-50">
                      <td className="px-6 py-4 text-slate-400 text-xs">{c.cli_id}</td>
                      <td className="px-6 py-4">{c.cli_nombre}</td>
                      <td className="px-6 py-4">{c.cli_apellido || '-'}</td>
                      <td className="px-6 py-4">{c.cli_tipo_documento || '-'}</td>
                      <td className="px-6 py-4 text-slate-400">{c.cli_correo || '-'}</td>
                      <td className="px-6 py-4">{c.cli_telefono || '-'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="px-6 py-4 bg-slate-50/30 border-t border-slate-100 text-xs text-slate-400 font-bold">
            {filteredClientes.length} de {clientes.length} clientes
          </div>
        </div>
      )}

      {/* ── Modal: Nuevo ── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-6">
          <div ref={focusTrapRef} className="bg-white rounded-lg shadow-2xl border border-slate-100 w-full max-w-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-8 py-6 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-800">
                Nuevo {tab === 'pedidos' ? 'Pedido' : tab === 'facturas' ? 'Factura' : 'Cliente'}
              </h2>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-slate-100 rounded-md transition-colors">
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
                      <input name="ped_id" autoFocus value={formData.ped_id || ''} onChange={handleChange} className="w-full p-3 bg-slate-50 border border-slate-100 rounded-md outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium mt-1" />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Fecha <span className="required-star">*</span></label>
                      <input name="ped_fecha" type="date" value={formData.ped_fecha || ''} onChange={handleChange} className="w-full p-3 bg-slate-50 border border-slate-100 rounded-md outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium mt-1" />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Cliente ID <span className="required-star">*</span></label>
                    <input name="ped_cli_id_fk" type="number" value={formData.ped_cli_id_fk || ''} onChange={handleChange} className="w-full p-3 bg-slate-50 border border-slate-100 rounded-md outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium mt-1" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Metodo Pago <span className="required-star">*</span></label>
                      <select name="ped_metodo_pago" value={formData.ped_metodo_pago || ''} onChange={handleChange} className="w-full p-3 bg-slate-50 border border-slate-100 rounded-md outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium mt-1">
                        <option value="">Seleccionar...</option>
                        <option value="Efectivo">Efectivo</option>
                        <option value="Tarjeta">Tarjeta</option>
                        <option value="Transferencia">Transferencia</option>
                      </select>
                    </div>
                    {formData.ped_metodo_pago === 'Transferencia' && (
                      <div>
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Cuenta Bancaria</label>
                        <input
                          name="ped_cuenta_bancaria"
                          placeholder="Ej: Nequi, Bancolombia, Davivienda..."
                          value={formData.ped_cuenta_bancaria || ''}
                          onChange={handleChange}
                          className="w-full p-3 bg-slate-50 border border-slate-100 rounded-md outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium mt-1"
                        />
                      </div>
                    )}
                    <div>
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Estado <span className="required-star">*</span></label>
                      <select name="ped_estado_entrega" value={formData.ped_estado_entrega || ''} onChange={handleChange} className="w-full p-3 bg-slate-50 border border-slate-100 rounded-md outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium mt-1">
                        <option value="">Seleccionar...</option>
                        <option value="Entregado">Entregado</option>
                        <option value="En camino">En camino</option>
                        <option value="No entregado">No entregado</option>
                        <option value="Anulado">Anulado</option>
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
                          className="w-full p-2.5 bg-slate-50 border border-slate-100 rounded-md outline-none text-sm font-medium"
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
                        className="w-20 p-2.5 bg-slate-50 border border-slate-100 rounded-md outline-none text-sm font-medium text-center shrink-0"
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
                                <td className="px-3 py-2 text-right">${p.precio_unitario.toLocaleString()}</td>
                                <td className="px-3 py-2 text-right">${p.subtotal.toLocaleString()}</td>
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
                      <input name="id" autoFocus value={formData.id || ''} onChange={handleChange} className="w-full p-3 bg-slate-50 border border-slate-100 rounded-md outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium mt-1" />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Fecha Emisión <span className="required-star">*</span></label>
                      <input name="fecha_emision" type="date" value={formData.fecha_emision || ''} onChange={handleChange} className="w-full p-3 bg-slate-50 border border-slate-100 rounded-md outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium mt-1" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Forma Pago <span className="required-star">*</span></label>
                      <select name="forma_pago" value={formData.forma_pago || ''} onChange={handleChange} className="w-full p-3 bg-slate-50 border border-slate-100 rounded-md outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium mt-1">
                        <option value="">Seleccionar...</option>
                        <option value="Efectivo">Efectivo</option>
                        <option value="Tarjeta">Tarjeta</option>
                        <option value="Transferencia">Transferencia</option>
                      </select>
                    </div>
                    {formData.forma_pago === 'Transferencia' && (
                      <div>
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Cuenta Bancaria</label>
                        <input name="cuenta_bancaria" placeholder="Ej: Nequi, Bancolombia, Davivienda..." value={formData.cuenta_bancaria || ''} onChange={handleChange} className="w-full p-3 bg-slate-50 border border-slate-100 rounded-md outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium mt-1" />
                      </div>
                    )}
                    <div>
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total <span className="required-star">*</span></label>
                      <input name="total" type="number" step="0.01" value={formData.total || ''} onChange={handleChange} className="w-full p-3 bg-slate-50 border border-slate-100 rounded-md outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium mt-1" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Email Enviado <span className="required-star">*</span></label>
                      <select name="email_enviado" value={formData.email_enviado !== undefined ? formData.email_enviado : ''} onChange={handleChange} className="w-full p-3 bg-slate-50 border border-slate-100 rounded-md outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium mt-1">
                        <option value="">Seleccionar...</option>
                        <option value="1">Sí (Enviado)</option>
                        <option value="0">No (Pendiente)</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Estado</label>
                      <select name="estado" value={formData.estado || 'Vigente'} onChange={handleChange} className="w-full p-3 bg-slate-50 border border-slate-100 rounded-md outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium mt-1">
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
                      <input name="cli_id" type="number" autoFocus value={formData.cli_id || ''} onChange={handleChange} className="w-full p-3 bg-slate-50 border border-slate-100 rounded-md outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium mt-1" />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Tipo Documento <span className="required-star">*</span></label>
                      <select name="cli_tipo_documento" value={formData.cli_tipo_documento || ''} onChange={handleChange} className="w-full p-3 bg-slate-50 border border-slate-100 rounded-md outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium mt-1">
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
                      <input name="cli_nombre" value={formData.cli_nombre || ''} onChange={handleChange} className="w-full p-3 bg-slate-50 border border-slate-100 rounded-md outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium mt-1" />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Apellido <span className="required-star">*</span></label>
                      <input name="cli_apellido" value={formData.cli_apellido || ''} onChange={handleChange} className="w-full p-3 bg-slate-50 border border-slate-100 rounded-md outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium mt-1" />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Correo <span className="required-star">*</span></label>
                    <input name="cli_correo" type="email" value={formData.cli_correo || ''} onChange={handleChange} className="w-full p-3 bg-slate-50 border border-slate-100 rounded-md outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium mt-1" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Teléfono</label>
                      <input name="cli_telefono" value={formData.cli_telefono || ''} onChange={handleChange} className="w-full p-3 bg-slate-50 border border-slate-100 rounded-md outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium mt-1" />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Dirección</label>
                      <input name="cli_direccion" value={formData.cli_direccion || ''} onChange={handleChange} className="w-full p-3 bg-slate-50 border border-slate-100 rounded-md outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium mt-1" />
                    </div>
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

      {/* ── Modal: Detalle de Pedido ── */}
      {showDetalle && detalleTipo === 'pedido' && detalleData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-6" onClick={() => setShowDetalle(false)}>
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
                    {detalleData.ped_cuenta_bancaria
                      ? `Transferencia (${detalleData.ped_cuenta_bancaria})`
                      : ['Nequi', 'Daviplata', 'Transferencia'].includes(detalleData.ped_metodo_pago)
                        ? `Transferencia${detalleData.ped_metodo_pago !== 'Transferencia' ? ` (${detalleData.ped_metodo_pago})` : ''}`
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
            @media print {
              body * { visibility: hidden; }
              #factura-print, #factura-print * { visibility: visible; }
              #factura-print { position: absolute; left: 0; top: 0; width: 100%; background: white; }
            }
          `}</style>
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-6" onClick={() => setShowDetalle(false)}>
            <div className="bg-white rounded-xl shadow-2xl border border-slate-100 w-full max-w-xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between px-8 py-6 border-b border-slate-100">
                <h2 className="text-lg font-black text-slate-800">Factura</h2>
                <div className="flex gap-2">
                  <button
                    onClick={() => window.print()}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-bold uppercase hover:bg-blue-700 transition-all"
                  >
                    Descargar PDF
                  </button>
                  <button onClick={() => setShowDetalle(false)} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                    <X size={20} className="text-slate-400" />
                  </button>
                </div>
              </div>

              {/* Contenido imprimible */}
              <div id="factura-print" className="px-8 py-6 space-y-4 text-slate-800">
                <div className="text-center border-b border-slate-200 pb-4">
                  <h3 className="text-xl font-black uppercase tracking-widest text-blue-700">San Diego Distribuidora</h3>
                  <p className="text-xs text-slate-400 mt-1">NIT: 900.123.456-7 · Cali, Colombia</p>
                </div>

                <div className="flex justify-between text-sm">
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Factura N°</p>
                    <p className="font-black text-lg">{detalleData.id}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Fecha</p>
                    <p className="font-bold">{detalleData.fecha_emision || '-'}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm bg-slate-50 rounded-lg p-4">
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Cliente</p>
                    <p className="font-bold">
                      {detalleData.cliente?.cli_nombre
                        ? `${detalleData.cliente.cli_nombre} ${detalleData.cliente.cli_apellido || ''}`
                        : detalleData.pedidoRelacionado?.ped_cli_id_fk || '-'}
                    </p>
                    {detalleData.cliente?.cli_id && (
                      <p className="text-xs text-slate-400">{detalleData.cliente.cli_tipo_documento}: {detalleData.cliente.cli_id}</p>
                    )}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Forma de Pago</p>
                    <p className="font-bold">
                      {detalleData.cuenta_bancaria
                        ? `Transferencia (${detalleData.cuenta_bancaria})`
                        : ['Nequi', 'Daviplata', 'Transferencia'].includes(detalleData.forma_pago)
                          ? `Transferencia${detalleData.forma_pago !== 'Transferencia' ? ` (${detalleData.forma_pago})` : ''}`
                          : detalleData.forma_pago || '-'}
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      Email: {detalleData.email_enviado === 1 ? 'Enviado ✅' : 'Pendiente ❌'}
                    </p>
                  </div>
                </div>

                <table className="w-full text-left text-sm border-t border-b border-slate-200">
                  <thead className="text-xs text-slate-400 uppercase font-bold border-b border-slate-100">
                    <tr>
                      <th className="px-3 py-2">Producto</th>
                      <th className="px-3 py-2 text-right">Cant.</th>
                      <th className="px-3 py-2 text-right">P. Unit.</th>
                      <th className="px-3 py-2 text-right">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-bold text-slate-600">
                    {detalleData.lineas && detalleData.lineas.length > 0 ? (
                      detalleData.lineas.map((l, i) => (
                        <tr key={i}>
                          <td className="px-3 py-2 text-xs">{l.producto_nombre || l.det_pro_id_fk}</td>
                          <td className="px-3 py-2 text-right">{l.det_cantidad}</td>
                          <td className="px-3 py-2 text-right">${parseFloat(l.det_precio_unitario || 0).toLocaleString()}</td>
                          <td className="px-3 py-2 text-right">${parseFloat(l.det_subtotal || 0).toLocaleString()}</td>
                        </tr>
                      ))
                    ) : (
                      <tr><td colSpan="4" className="px-3 py-4 text-center text-slate-400 italic text-xs">Sin productos registrados</td></tr>
                    )}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-slate-300 bg-slate-50">
                      <td colSpan="3" className="px-3 py-3 text-right text-xs font-black text-slate-400 uppercase">Total</td>
                      <td className="px-3 py-3 text-right font-black text-blue-700 text-lg">
                        ${parseFloat(detalleData.total || 0).toLocaleString()}
                      </td>
                    </tr>
                  </tfoot>
                </table>

                <div className="text-center text-[10px] text-slate-400 mt-4">
                  <p>Gracias por su compra · San Diego Distribuidora</p>
                  <p>Este documento es una representación digital de la factura</p>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Ventas;




