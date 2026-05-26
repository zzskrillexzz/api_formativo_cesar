import React, { useState, useEffect } from 'react';
import { Truck, Package, Search, Plus, X, RefreshCw, Loader2, Edit3, Trash2, FileText, Download } from 'lucide-react';
import { ThemeLoader } from '../components/ThemeLoader';
import { ConfirmModal } from '../components/ConfirmModal';
import { comprasService } from '../api/services/comprasService';
import { proveedoresService } from '../api/services/proveedoresService';
import { useAuth } from '../context/AuthContext';
import { useFocusTrap } from '../hooks/useFocusTrap';
import { FIELD_LIMITS } from '../utils/fieldLimits';

const ESTADOS = ['Pendiente', 'Recibida', 'Cancelada'];

const Compras = () => {
  const [tab, setTab] = useState('compras');
  const [compras, setCompras] = useState([]);
  const [proveedores, setProveedores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showComprobanteModal, setShowComprobanteModal] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [formError, setFormError] = useState('');
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [formData, setFormData] = useState({});
  const [editData, setEditData] = useState({});
  const [comprobanteFile, setComprobanteFile] = useState(null);
  const { user } = useAuth();

  const fetchData = async () => {
    setLoading(true);
    try {
      const [comps, provs] = await Promise.all([
        comprasService.listar().catch(() => []),
        proveedoresService.listar().catch(() => [])
      ]);
      setCompras(comps);
      setProveedores(provs);
    } catch (_) {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const openModal = () => {
    if (tab === 'compras') {
      const nums = compras.map(c => { const m = (c.comp_id || '').match(/COM(\d+)/); return m ? parseInt(m[1]) : 0; });
      const max = nums.length > 0 ? Math.max(...nums) : 0;
      setFormData({ com_id: 'COM' + String(max + 1).padStart(3, '0') });
    } else {
      const nums = proveedores.map(p => { const m = (p.id || '').match(/PROV(\d+)/); return m ? parseInt(m[1]) : 0; });
      const max = nums.length > 0 ? Math.max(...nums) : 0;
      setFormData({ id: 'PROV' + String(max + 1).padStart(3, '0') });
    }
    setFormError('');
    setComprobanteFile(null);
    setShowModal(true);
  };

  const openEditModal = async (compra) => {
    setFormError('');
    setComprobanteFile(null);
    try {
      const detalle = await comprasService.buscar(compra.comp_id);
      setEditData(detalle);
      setShowEditModal(true);
    } catch (_) {
      setFormError('Error al cargar datos de la compra');
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    const max = FIELD_LIMITS[name];
    if (max && value.length > max) return;
    setFormData({ ...formData, [name]: value });
    validateField(name, value);
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    const max = FIELD_LIMITS[name];
    if (max && value.length > max) return;
    setEditData({ ...editData, [name]: value });
    validateField(name, value);
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
      else if (name === 'nit') delete newErrors.nit;
      if (name === 'nombre' && !value) newErrors.nombre = 'El nombre es obligatorio';
      else if (name === 'nombre') delete newErrors.nombre;
      if (name === 'tipo' && !value) newErrors.tipo = 'Selecciona un tipo';
      else if (name === 'tipo') delete newErrors.tipo;
      if (name === 'contacto' && !value) newErrors.contacto = 'El contacto es obligatorio';
      else if (name === 'contacto') delete newErrors.contacto;
      if (name === 'email' && !value) newErrors.email = 'El email es obligatorio';
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

  const handleSubmitCompra = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!formData.com_id || !formData.com_fecha || !formData.com_prov_id_fk || !formData.com_total) {
      setFormError('Los campos con * son obligatorios');
      return;
    }
    const total = parseFloat(formData.com_total);
    if (isNaN(total) || total <= 0) {
      setFormError('El total debe ser un número mayor a 0');
      return;
    }
    setFormSubmitting(true);
    try {
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
      setShowModal(false);
      fetchData();
    } catch (err) {
      setFormError(err.response?.data?.mensaje || 'Error al crear compra');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleEditCompra = async (e) => {
    e.preventDefault();
    setFormError('');
    const total = parseFloat(editData.comp_total);
    if (isNaN(total) || total <= 0) {
      setFormError('El total debe ser un número mayor a 0');
      return;
    }
    setFormSubmitting(true);
    try {
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
      setShowEditModal(false);
      fetchData();
    } catch (err) {
      setFormError(err.response?.data?.mensaje || 'Error al actualizar compra');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleChangeStatus = async (compraId, nuevoEstado) => {
    setFormSubmitting(true);
    try {
      await comprasService.editar(compraId, { com_estado: nuevoEstado });
      fetchData();
    } catch (err) {
      setFormError(err.response?.data?.mensaje || 'Error al cambiar estado');
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
      fetchData();
    } catch (err) {
      setFormError(err.response?.data?.mensaje || 'Error al eliminar compra');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleSubmitProveedor = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!formData.id || !formData.nit || !formData.nombre || !formData.tipo || !formData.contacto || !formData.direccion || !formData.email) {
      setFormError('Todos los campos son obligatorios');
      return;
    }
    setFormSubmitting(true);
    try {
      await proveedoresService.registrar({
        id: formData.id,
        nit: formData.nit,
        nombre: formData.nombre,
        tipo: formData.tipo,
        contacto: formData.contacto,
        direccion: formData.direccion,
        email: formData.email
      });
      setShowModal(false);
      fetchData();
    } catch (err) {
      setFormError(err.response?.data?.mensaje || 'Error al crear proveedor');
    } finally {
      setFormSubmitting(false);
    }
  };

  const tabs = [
    { id: 'compras', label: 'Compras a Proveedores', icon: Truck },
    { id: 'proveedores', label: 'Proveedores', icon: Package },
  ];

  const filteredCompras = compras.filter(c =>
    [c.comp_id, c.comp_fecha, c.comp_prov_id_fk, c.comp_estado, c.comp_total, c.comp_observacion
    ].filter(Boolean).join(' ').toLowerCase().includes(searchTerm.toLowerCase())
  );
  const focusTrapRef = useFocusTrap(showModal || showEditModal);

  const filteredProveedores = proveedores.filter(p =>
    [p.prov_id, p.prov_nombre, p.prov_nit, p.prov_tipo, p.prov_contacto, p.prov_email, p.prov_direccion
    ].filter(Boolean).join(' ').toLowerCase().includes(searchTerm.toLowerCase())
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

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 bg-white border border-slate-200 px-5 py-3 rounded-lg w-96 shadow-sm">
          <Search size={18} className="text-slate-400" />
          <input type="text" placeholder={tab === 'compras' ? 'Buscar compra...' : 'Buscar proveedor...'}
            className="bg-transparent border-none outline-none text-sm w-full font-medium"
            value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
        <div className="flex gap-2">
          <button onClick={fetchData} className="p-3 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-all shadow-sm">
            <RefreshCw size={18} className="text-slate-500" />
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
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden card-hover">
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
                  filteredCompras.map((c, i) => (
                    <tr key={i} className="hover:bg-slate-50 group">
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
          <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 text-xs text-slate-400 font-medium">{filteredCompras.length} de {compras.length} compras</div>
        </div>
      </>
      )}

      {/* Proveedores */}
      {tab === 'proveedores' && (
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden card-hover">
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
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-sm font-medium text-slate-600">
                {filteredProveedores.length === 0 ? (
                  <tr><td colSpan="6" className="px-5 py-12 text-center text-slate-400">{searchTerm ? 'Sin resultados' : 'No hay proveedores registrados'}</td></tr>
                ) : (
                  filteredProveedores.map((p, i) => (
                    <tr key={i} className="hover:bg-slate-50">
                      <td className="px-5 py-3 text-slate-400 text-xs">{p.prov_id}</td>
                      <td className="px-5 py-3">{p.prov_nombre}</td>
                      <td className="px-5 py-3 text-slate-400">{p.prov_nit || '-'}</td>
                      <td className="px-5 py-3"><span className="px-2 py-1 rounded-md text-[10px] font-bold uppercase bg-slate-100 text-slate-500">{p.prov_tipo || '-'}</span></td>
                      <td className="px-5 py-3">{p.prov_contacto || '-'}</td>
                      <td className="px-5 py-3 text-slate-400 text-xs">{p.prov_email || '-'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 text-xs text-slate-400 font-medium">{filteredProveedores.length} de {proveedores.length} proveedores</div>
        </div>
      )}

      {/* Modal Registrar */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowModal(false)} />
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
                      <input name="com_fecha" type="date" value={formData.com_fecha || ''} onChange={handleChange}
                        className={`w-full p-3 bg-slate-50 border rounded-md outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium mt-1 ${errors.com_fecha ? 'border-red-400' : 'border-slate-100'}`} />
                      {errors.com_fecha && <p className="text-red-500 text-xs mt-1">{errors.com_fecha}</p>}
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Proveedor <span className="required-star">*</span></label>
                    <select name="com_prov_id_fk" value={formData.com_prov_id_fk || ''} onChange={handleChange}
                      className={`w-full p-3 bg-slate-50 border rounded-md outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium mt-1 ${errors.com_prov_id_fk ? 'border-red-400' : 'border-slate-100'}`}>
                      <option value="">Seleccionar proveedor...</option>
                      {errors.com_prov_id_fk && <p className="text-red-500 text-xs mt-1">{errors.com_prov_id_fk}</p>}
                      {proveedores.map(p => <option key={p.prov_id} value={p.prov_id}>{p.prov_nombre} ({p.prov_id})</option>)}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total <span className="required-star">*</span></label>
                      <input name="com_total" type="number" step="0.01" value={formData.com_total || ''} onChange={handleChange}
                        className={`w-full p-3 bg-slate-50 border rounded-md outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium mt-1 ${errors.com_total ? 'border-red-400' : 'border-slate-100'}`} />
                      {errors.com_total && <p className="text-red-500 text-xs mt-1">{errors.com_total}</p>}
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Estado</label>
                      <select name="com_estado" value={formData.com_estado || 'Pendiente'} onChange={handleChange}
                        className="w-full p-3 bg-slate-50 border border-slate-100 rounded-md outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium mt-1">
                        {ESTADOS.map(e => <option key={e} value={e}>{e}</option>)}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Observación</label>
                    <textarea name="com_observacion" rows="2" value={formData.com_observacion || ''} onChange={handleChange}
                      placeholder="Notas adicionales..."
                      className="w-full p-3 bg-slate-50 border border-slate-100 rounded-md outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium mt-1 resize-none" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Comprobante de pago (PDF / imagen)</label>
                    <input type="file" accept=".pdf,.png,.jpg,.jpeg,.webp" onChange={(e) => handleFileChange(e, false)}
                      className="w-full p-2 bg-slate-50 border border-slate-100 rounded-md outline-none text-sm font-medium mt-1 file:mr-3 file:py-1.5 file:px-3 file:rounded file:text-xs file:font-bold file:bg-blue-50 file:text-blue-600 file:border-0 hover:file:bg-blue-100 transition-colors" />
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
                        className={`w-full p-3 bg-slate-50 border rounded-md outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium mt-1 ${errors.nit ? 'border-red-400' : 'border-slate-100'}`} />
                      {errors.nit && <p className="text-red-500 text-xs mt-1">{errors.nit}</p>}
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Nombre <span className="required-star">*</span></label>
                    <input name="nombre" value={formData.nombre || ''} onChange={handleChange}
                      className={`w-full p-3 bg-slate-50 border rounded-md outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium mt-1 ${errors.nombre ? 'border-red-400' : 'border-slate-100'}`} />
                    {errors.nombre && <p className="text-red-500 text-xs mt-1">{errors.nombre}</p>}
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Tipo <span className="required-star">*</span></label>
                    <select name="tipo" value={formData.tipo || ''} onChange={handleChange}
                      className={`w-full p-3 bg-slate-50 border rounded-md outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium mt-1 ${errors.tipo ? 'border-red-400' : 'border-slate-100'}`}>
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
                      className={`w-full p-3 bg-slate-50 border rounded-md outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium mt-1 ${errors.contacto ? 'border-red-400' : 'border-slate-100'}`} />
                    {errors.contacto && <p className="text-red-500 text-xs mt-1">{errors.contacto}</p>}
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Dirección <span className="required-star">*</span></label>
                    <input name="direccion" value={formData.direccion || ''} onChange={handleChange}
                      className="w-full p-3 bg-slate-50 border border-slate-100 rounded-md outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium mt-1" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Email <span className="required-star">*</span></label>
                    <input name="email" type="email" value={formData.email || ''} onChange={handleChange}
                      className={`w-full p-3 bg-slate-50 border rounded-md outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium mt-1 ${errors.email ? 'border-red-400' : 'border-slate-100'}`} />
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
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowEditModal(false)} />
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
                  <input name="comp_fecha" type="date" value={editData.comp_fecha || ''} onChange={handleEditChange}
                    className="w-full p-3 bg-slate-50 border border-slate-100 rounded-md outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium mt-1" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Proveedor</label>
                  <select name="comp_prov_id_fk" value={editData.comp_prov_id_fk || ''} onChange={handleEditChange}
                    className="w-full p-3 bg-slate-50 border border-slate-100 rounded-md outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium mt-1">
                    <option value="">Seleccionar proveedor...</option>
                    {proveedores.map(p => <option key={p.prov_id} value={p.prov_id}>{p.prov_nombre} ({p.prov_id})</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total</label>
                  <input name="comp_total" type="number" step="0.01" value={editData.comp_total || ''} onChange={handleEditChange}
                    className="w-full p-3 bg-slate-50 border border-slate-100 rounded-md outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium mt-1" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Estado</label>
                  <select name="comp_estado" value={editData.comp_estado || 'Pendiente'} onChange={handleEditChange}
                    className="w-full p-3 bg-slate-50 border border-slate-100 rounded-md outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium mt-1">
                    {ESTADOS.map(e => <option key={e} value={e}>{e}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Observación</label>
                <textarea name="comp_observacion" rows="2" value={editData.comp_observacion || ''} onChange={handleEditChange}
                  placeholder="Notas adicionales..."
                  className="w-full p-3 bg-slate-50 border border-slate-100 rounded-md outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium mt-1 resize-none" />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Comprobante de pago (PDF / imagen)</label>
                <input type="file" accept=".pdf,.png,.jpg,.jpeg,.webp" onChange={(e) => handleFileChange(e, true)}
                  className="w-full p-2 bg-slate-50 border border-slate-100 rounded-md outline-none text-sm font-medium mt-1 file:mr-3 file:py-1.5 file:px-3 file:rounded file:text-xs file:font-bold file:bg-blue-50 file:text-blue-600 file:border-0 hover:file:bg-blue-100 transition-colors" />
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

      {/* Modal Vista Previa Comprobante */}
      {showComprobanteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowComprobanteModal(null)} />
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

      {/* Confirmación de eliminación */}
      <ConfirmModal
        open={!!confirmDelete}
        title="Eliminar Compra"
        message={`¿Está seguro de eliminar la compra ${confirmDelete}? Esta acción no se puede deshacer.`}
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(null)}
        confirmText="Eliminar"
        danger
      />
    </div>
  );
};

export default Compras;
