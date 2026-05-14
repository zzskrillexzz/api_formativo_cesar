import React, { useState, useEffect } from 'react';
import { Truck, Package, Search, Plus, X, RefreshCw, Loader2 } from 'lucide-react';
import { ThemeLoader } from '../components/ThemeLoader';
import { comprasService } from '../api/services/comprasService';
import { proveedoresService } from '../api/services/proveedoresService';
import { useAuth } from '../context/AuthContext';

const Compras = () => {
  const [tab, setTab] = useState('compras');
  const [compras, setCompras] = useState([]);
  const [proveedores, setProveedores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const [showModal, setShowModal] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formData, setFormData] = useState({});
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
    setFormData({});
    setFormError('');
    setShowModal(true);
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
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
      setFormError('El total debe ser un numero mayor a 0');
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
        com_observacion: formData.com_observacion || ''
      });
      setShowModal(false);
      fetchData();
    } catch (err) {
      setFormError(err.response?.data?.mensaje || 'Error al crear compra');
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
    { id: 'compras', label: 'Compras', icon: Package },
    { id: 'proveedores', label: 'Proveedores', icon: Truck },
  ];

  const filteredCompras = compras.filter(c =>
    (c.comp_id || '').toLowerCase().includes(searchTerm.toLowerCase())
  );
  const filteredProveedores = proveedores.filter(p =>
    (p.prov_nombre || p.prov_id || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <ThemeLoader module="Compras" />;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 bg-white rounded-lg p-1.5 shadow-sm border border-slate-200 w-fit">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-5 py-3 rounded-md text-xs font-bold uppercase tracking-wider transition-all ${
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
                  <th className="px-5 py-3">Observacion</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-sm font-medium text-slate-600">
                {filteredCompras.length === 0 ? (
                  <tr><td colSpan="6" className="px-5 py-12 text-center text-slate-400">{searchTerm ? 'Sin resultados' : 'No hay compras registradas'}</td></tr>
                ) : (
                  filteredCompras.map((c, i) => (
                    <tr key={i} className="hover:bg-slate-50">
                      <td className="px-5 py-3 text-slate-400 text-xs">{c.comp_id}</td>
                      <td className="px-5 py-3">{c.comp_fecha || '-'}</td>
                      <td className="px-5 py-3">{c.comp_prov_id_fk || '-'}</td>
                      <td className="px-5 py-3">
                        <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase ${
                          c.comp_estado === 'Recibida' ? 'text-emerald-600 bg-emerald-50' :
                          c.comp_estado === 'Cancelada' ? 'text-red-600 bg-red-50' : 'text-yellow-600 bg-yellow-50'
                        }`}>{c.comp_estado || '-'}</span>
                      </td>
                      <td className="px-5 py-3 text-right">${parseFloat(c.comp_total || 0).toLocaleString()}</td>
                      <td className="px-5 py-3 text-slate-400 text-xs max-w-[180px] truncate">{c.comp_observacion || '-'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 text-xs text-slate-400 font-medium">{filteredCompras.length} de {compras.length} compras</div>
        </div>
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

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="relative bg-white rounded-lg shadow-2xl border border-slate-100 w-full max-w-lg max-h-[90vh] overflow-y-auto">
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
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">ID *</label>
                      <input name="com_id" autoFocus value={formData.com_id || ''} onChange={handleChange}
                        className="w-full p-3 bg-slate-50 border border-slate-100 rounded-md outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium mt-1" />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Fecha *</label>
                      <input name="com_fecha" type="date" value={formData.com_fecha || ''} onChange={handleChange}
                        className="w-full p-3 bg-slate-50 border border-slate-100 rounded-md outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium mt-1" />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Proveedor *</label>
                    <select name="com_prov_id_fk" value={formData.com_prov_id_fk || ''} onChange={handleChange}
                      className="w-full p-3 bg-slate-50 border border-slate-100 rounded-md outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium mt-1">
                      <option value="">Seleccionar proveedor...</option>
                      {proveedores.map(p => <option key={p.prov_id} value={p.prov_id}>{p.prov_nombre} ({p.prov_id})</option>)}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total *</label>
                      <input name="com_total" type="number" step="0.01" value={formData.com_total || ''} onChange={handleChange}
                        className="w-full p-3 bg-slate-50 border border-slate-100 rounded-md outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium mt-1" />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Estado</label>
                      <select name="com_estado" value={formData.com_estado || 'Pendiente'} onChange={handleChange}
                        className="w-full p-3 bg-slate-50 border border-slate-100 rounded-md outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium mt-1">
                        <option value="Pendiente">Pendiente</option>
                        <option value="Recibida">Recibida</option>
                        <option value="Cancelada">Cancelada</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Observacion</label>
                    <textarea name="com_observacion" rows="2" value={formData.com_observacion || ''} onChange={handleChange}
                      placeholder="Notas adicionales..."
                      className="w-full p-3 bg-slate-50 border border-slate-100 rounded-md outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium mt-1 resize-none" />
                  </div>
                </>
              )}

              {tab === 'proveedores' && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">ID *</label>
                      <input name="id" autoFocus value={formData.id || ''} onChange={handleChange}
                        className="w-full p-3 bg-slate-50 border border-slate-100 rounded-md outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium mt-1" />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">NIT *</label>
                      <input name="nit" value={formData.nit || ''} onChange={handleChange}
                        className="w-full p-3 bg-slate-50 border border-slate-100 rounded-md outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium mt-1" />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Nombre *</label>
                    <input name="nombre" value={formData.nombre || ''} onChange={handleChange}
                      className="w-full p-3 bg-slate-50 border border-slate-100 rounded-md outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium mt-1" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Tipo *</label>
                    <select name="tipo" value={formData.tipo || ''} onChange={handleChange}
                      className="w-full p-3 bg-slate-50 border border-slate-100 rounded-md outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium mt-1">
                      <option value="">Seleccionar...</option>
                      <option value="Laboratorio">Laboratorio</option>
                      <option value="Distribuidor">Distribuidor</option>
                      <option value="Importador">Importador</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Contacto *</label>
                    <input name="contacto" value={formData.contacto || ''} onChange={handleChange}
                      className="w-full p-3 bg-slate-50 border border-slate-100 rounded-md outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium mt-1" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Direccion *</label>
                    <input name="direccion" value={formData.direccion || ''} onChange={handleChange}
                      className="w-full p-3 bg-slate-50 border border-slate-100 rounded-md outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium mt-1" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Email *</label>
                    <input name="email" type="email" value={formData.email || ''} onChange={handleChange}
                      className="w-full p-3 bg-slate-50 border border-slate-100 rounded-md outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium mt-1" />
                  </div>
                </>
              )}

              <button type="submit" disabled={formSubmitting}
                className="w-full bg-blue-600 text-white font-bold py-3 rounded-md text-sm uppercase tracking-wider hover:bg-blue-700 disabled:bg-slate-300 transition-all flex items-center justify-center gap-2">
                {formSubmitting ? <Loader2 className="animate-spin" size={16} /> : null}
                {tab === 'compras' ? 'Registrar Compra' : 'Registrar Proveedor'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Compras;