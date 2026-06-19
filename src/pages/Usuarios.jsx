import React, { useState, useEffect, useRef } from 'react';
import { Users, Shield, Search, Plus, X, RefreshCw, Edit3, Trash2, Loader2, Eye, EyeOff } from 'lucide-react';
import { ThemeLoader } from '../components/ThemeLoader';
import { ConfirmModal } from '../components/ConfirmModal';
import { useToast } from '../components/Toast';
import { useAuth } from '../context/AuthContext';
import { useFocusTrap } from '../hooks/useFocusTrap';
import { FIELD_LIMITS } from '../utils/fieldLimits';
import api from '../api/axios';

const ROLES_DISPONIBLES = ['Administrador', 'Vendedor', 'Bodeguero', 'Contador'];

const Usuarios = () => {
  const { user } = useAuth();
  const [tab, setTab] = useState('usuarios');
  const [usuarios, setUsuarios] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroRol, setFiltroRol] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');
  const POR_PAGINA = 10;
  const [paginaUsuarios, setPaginaUsuarios] = useState(1);
  const [paginaRoles, setPaginaRoles] = useState(1);

  // ── Modal crear/editar usuario ──
  const [showModal, setShowModal] = useState(false);
  const [editingUserId, setEditingUserId] = useState(null);
  const [formError, setFormError] = useState('');
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formData, setFormData] = useState({});
  const [showPassword, setShowPassword] = useState(false);

  // ── Modal crear/editar rol ──
  const [showRolModal, setShowRolModal] = useState(false);
  const [editingRolId, setEditingRolId] = useState(null);
  const [rolFormData, setRolFormData] = useState({});

  // ── Confirmación de eliminación ──
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [confirmDeleteRol, setConfirmDeleteRol] = useState(null);
  const { toast } = useToast();

  const formSnapshotRef = useRef({});
  const focusTrapRef = useFocusTrap(showModal || showRolModal);

    // ── Mapear campos del backend (modelo returns id/nombre/rol/correo/estado) ──
  const mapearUsuario = (u) => ({
    usu_id: u.usu_id || u.id || '',
    usu_nombre: u.usu_nombre || u.nombre || '',
    usu_correo: u.usu_correo || u.correo || '',
    usu_rol: u.usu_rol || u.rol || '',
    usu_estado: u.usu_estado ?? u.estado ?? 1,
    usu_contrasena: u.usu_contrasena || '',
    usu_ultimo_acceso: u.usu_ultimo_acceso || u.ultimo_acceso || null
  });

  const mapearRol = (r) => ({
    rol_id: r.rol_id || r.id || '',
    rol_nombre: r.rol_nombre || r.nombre || '',
    rol_descripcion: r.rol_descripcion || r.descripcion || ''
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [resUsuarios, resRoles] = await Promise.all([
        api.get('/usuarios/').catch(() => ({ data: { data: [] } })),
        api.get('/roles/').catch(() => ({ data: { data: [] } }))
      ]);
      const rawUsuarios = Array.isArray(resUsuarios.data?.data) ? resUsuarios.data.data : (Array.isArray(resUsuarios.data) ? resUsuarios.data : []);
      const rawRoles = Array.isArray(resRoles.data?.data) ? resRoles.data.data : (Array.isArray(resRoles.data) ? resRoles.data : []);
      setUsuarios(rawUsuarios.map(mapearUsuario));
      setRoles(rawRoles.map(mapearRol));
    } catch (_) {
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);
  useEffect(() => { setPaginaUsuarios(1); }, [searchTerm, filtroRol, filtroEstado]);
  useEffect(() => { setPaginaRoles(1); }, [searchTerm]);

  // ═══════════════════ USUARIOS ═══════════════════

  const openUserModal = (usr = null) => {
    setFormError('');
    if (usr) {
      setEditingUserId(usr.usu_id);
      setFormData({
        usu_id: usr.usu_id,
        usu_nombre: usr.usu_nombre || '',
        usu_correo: usr.usu_correo || '',
        usu_rol: usr.usu_rol || 'Vendedor',
        usu_contrasena: '',
        usu_estado: usr.usu_estado ?? 1
      });
      formSnapshotRef.current = JSON.parse(JSON.stringify(usr));
    } else {
      setEditingUserId(null);
      const nums = usuarios.map(u => { const m = (u.usu_id || '').match(/USU(\d+)/); return m ? parseInt(m[1]) : 0; });
      const max = nums.length > 0 ? Math.max(...nums) : 0;
      setFormData({
        usu_id: 'USU' + String(max + 1).padStart(3, '0'),
        usu_nombre: '', usu_correo: '', usu_rol: 'Vendedor',
        usu_contrasena: '', usu_estado: 1
      });
      formSnapshotRef.current = {};
    }
    setShowModal(true);
    setShowPassword(false);
  };

  const handleUserChange = (e) => {
    const { name, value } = e.target;
    const max = FIELD_LIMITS[name];
    if (max && value.length > max) return;
    setFormData({ ...formData, [name]: value });
  };

  const handleUserSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    const { usu_id, usu_nombre, usu_correo, usu_rol, usu_estado } = formData;
    if (!usu_nombre || !usu_correo || !usu_rol) {
      setFormError('Nombre, correo y rol son obligatorios');
      return;
    }
    if (editingUserId && JSON.stringify(formData) === JSON.stringify(formSnapshotRef.current)) {
      toast({ type: 'warning', title: 'Sin cambios', description: 'No se identificaron modificaciones en el usuario' });
      return;
    }
    if (!editingUserId && !formData.usu_contrasena) {
      setFormError('La contraseña es obligatoria para nuevos usuarios');
      return;
    }
    setFormSubmitting(true);
    try {
      if (editingUserId) {
        await api.put('/usuarios/', {
          usu_id, usu_nombre, usu_correo, usu_rol,
          usu_contrasena: formData.usu_contrasena || 'placeholder',
          usu_estado: usu_estado ?? 1
        });
      } else {
        await api.post('/usuarios/', {
          usu_id, usu_nombre, usu_correo, usu_rol,
          usu_contrasena: formData.usu_contrasena,
          usu_estado: usu_estado ?? 1
        });
      }
      setShowModal(false);
      toast({ type: 'success', title: editingUserId ? 'Actualizado' : 'Creado', description: `Usuario ${editingUserId ? 'actualizado' : 'creado'} correctamente` });
      fetchData();
    } catch (err) {
      toast({ type: 'error', title: 'Error', description: err.response?.data?.mensaje || 'Error al guardar usuario' });
    } finally { setFormSubmitting(false); }
  };

  const handleDeleteUser = async () => {
    if (!confirmDelete) return;
    setFormSubmitting(true);
    try {
      await api.delete(`/usuarios/eliminar/${confirmDelete}`);
      setConfirmDelete(null);
      toast({ type: 'success', title: 'Eliminado', description: 'Usuario eliminado correctamente' });
      fetchData();
    } catch (err) {
      toast({ type: 'error', title: 'Error', description: err.response?.data?.mensaje || 'Error al eliminar usuario' });
    } finally { setFormSubmitting(false); }
  };

  // ═══════════════════ ROLES ═══════════════════

  const openRolModal = (rol = null) => {
    setFormError('');
    if (rol) {
      setEditingRolId(rol.rol_id);
      setRolFormData({
        rol_id: rol.rol_id,
        rol_nombre: rol.rol_nombre || '',
        rol_descripcion: rol.rol_descripcion || ''
      });
    } else {
      setEditingRolId(null);
      setRolFormData({ rol_id: '', rol_nombre: '', rol_descripcion: '' });
    }
    setShowRolModal(true);
  };

  const handleRolChange = (e) => {
    const { name, value } = e.target;
    setRolFormData({ ...rolFormData, [name]: value });
  };

  const handleRolSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!rolFormData.rol_id || !rolFormData.rol_nombre) {
      setFormError('ID y nombre del rol son obligatorios');
      return;
    }
    setFormSubmitting(true);
    try {
      if (editingRolId) {
        await api.put('/roles/', rolFormData);
      } else {
        await api.post('/roles/', rolFormData);
      }
      setShowRolModal(false);
      toast({ type: 'success', title: editingRolId ? 'Actualizado' : 'Creado', description: `Rol ${editingRolId ? 'actualizado' : 'creado'} correctamente` });
      fetchData();
    } catch (err) {
      toast({ type: 'error', title: 'Error', description: err.response?.data?.mensaje || 'Error al guardar rol' });
    } finally { setFormSubmitting(false); }
  };

  const handleDeleteRol = async () => {
    if (!confirmDeleteRol) return;
    setFormSubmitting(true);
    try {
      await api.delete(`/roles/eliminar/${confirmDeleteRol}`);
      setConfirmDeleteRol(null);
      toast({ type: 'success', title: 'Eliminado', description: 'Rol eliminado correctamente' });
      fetchData();
    } catch (err) {
      toast({ type: 'error', title: 'Error', description: err.response?.data?.mensaje || 'Error al eliminar rol' });
    } finally { setFormSubmitting(false); }
  };

  // ═══════════════════ FILTROS Y PAGINACIÓN ═══════════════════

  const filteredUsuarios = usuarios.filter(u => {
    const busca = [u.usu_id, u.usu_nombre, u.usu_correo, u.usu_rol]
      .filter(Boolean).join(' ').toLowerCase().includes(searchTerm.toLowerCase());
    const porRol = !filtroRol || u.usu_rol === filtroRol;
    const porEstado = filtroEstado === '' || u.usu_estado === Number(filtroEstado);
    return busca && porRol && porEstado;
  });

  const paginatedUsuarios = filteredUsuarios.slice(
    (paginaUsuarios - 1) * POR_PAGINA, paginaUsuarios * POR_PAGINA
  );

  const filteredRoles = roles.filter(r => {
    const busca = [r.rol_id, r.rol_nombre, r.rol_descripcion]
      .filter(Boolean).join(' ').toLowerCase().includes(searchTerm.toLowerCase());
    return busca;
  });

  const paginatedRoles = filteredRoles.slice(
    (paginaRoles - 1) * POR_PAGINA, paginaRoles * POR_PAGINA
  );

  const estadoBadge = (estado) => {
    const activo = estado === 1 || estado === '1' || estado === true;
    return activo
      ? <span className="px-2 py-1 rounded-md text-[10px] font-bold uppercase bg-emerald-50 text-emerald-600">Activo</span>
      : <span className="px-2 py-1 rounded-md text-[10px] font-bold uppercase bg-red-50 text-red-600">Inactivo</span>;
  };

  const tabs = [
    { id: 'usuarios', label: 'Usuarios', icon: Users },
    { id: 'roles', label: 'Roles', icon: Shield },
  ];

  if (loading) return <ThemeLoader module="Usuarios" />;

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      <div className="flex items-center gap-2 bg-white rounded-lg p-1.5 shadow-sm border border-slate-200 w-fit">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-5 py-3 rounded-md text-xs font-bold uppercase tracking-wider transition-all ${
              tab === t.id ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-600'
            }`}>
            <t.icon size={16} /> {t.label}
          </button>
        ))}
      </div>

      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-3 bg-white border border-slate-300 px-5 py-3 rounded-lg w-80 shadow-sm">
            <Search size={18} className="text-slate-400" />
            <input type="text" placeholder={tab === 'usuarios' ? 'Buscar usuario...' : 'Buscar rol...'}
              className="bg-transparent border-none outline-none text-sm w-full font-medium"
              value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} maxLength={100} />
          </div>
          {tab === 'usuarios' && (
            <>
              <select value={filtroRol} onChange={e => setFiltroRol(e.target.value)}
                className="text-xs border border-slate-300 rounded-md px-2.5 py-3 bg-white outline-none shadow-sm font-medium text-slate-600">
                <option value="">Todos los roles</option>
                {ROLES_DISPONIBLES.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
              <select value={filtroEstado} onChange={e => setFiltroEstado(e.target.value)}
                className="text-xs border border-slate-300 rounded-md px-2.5 py-3 bg-white outline-none shadow-sm font-medium text-slate-600">
                <option value="">Todos los estados</option>
                <option value="1">Activo</option>
                <option value="0">Inactivo</option>
              </select>
            </>
          )}
          {(filtroRol || filtroEstado) && (
            <button onClick={() => { setFiltroRol(''); setFiltroEstado(''); }}
              className="text-[10px] font-bold uppercase tracking-wider text-slate-400 hover:text-red-500 transition-colors px-2">✕ Limpiar</button>
          )}
        </div>
        <div className="flex gap-2">
          <button onClick={fetchData} className="p-3 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-all shadow-sm">
            <RefreshCw size={18} className="text-slate-500" />
          </button>
          <button onClick={() => tab === 'usuarios' ? openUserModal() : openRolModal()}
            className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-3 rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-indigo-700 transition-all shadow-md">
            <Plus size={16} /> {tab === 'usuarios' ? 'Nuevo Usuario' : 'Nuevo Rol'}
          </button>
        </div>
      </div>

      {/* ── Tabla de Usuarios ── */}
      {tab === 'usuarios' && (
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 border-l-4 border-l-indigo-400 overflow-hidden">
          <div className="grid grid-cols-4 gap-2 px-5 pt-4 pb-2">
            {[
              { label: 'Todos', count: usuarios.length, icon: '👥', filtro: '' },
              { label: 'Activos', count: usuarios.filter(u => u.usu_estado === 1).length, icon: '✅', filtro: '1' },
              { label: 'Inactivos', count: usuarios.filter(u => u.usu_estado === 0).length, icon: '🚫', filtro: '0' },
              { label: 'Admins', count: usuarios.filter(u => u.usu_rol === 'Administrador').length, icon: '🛡️', filtro: '' },
            ].map((c, idx) => (
              <button key={idx} onClick={() => c.filtro !== '' ? setFiltroEstado(c.filtro) : null}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg border border-blue-200 bg-blue-50/50 transition-all hover:shadow-md">
                <span className="text-lg">{c.icon}</span>
                <div className="text-left">
                  <div className="text-base font-black text-blue-700">{c.count}</div>
                  <div className="text-[9px] font-bold uppercase tracking-wider text-slate-500">{c.label}</div>
                </div>
              </button>
            ))}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-slate-400 text-xs uppercase font-bold tracking-wider border-b border-slate-100">
                <tr>
                  <th className="px-5 py-3">ID</th>
                  <th className="px-5 py-3">Nombre</th>
                  <th className="px-5 py-3">Correo</th>
                  <th className="px-5 py-3">Rol</th>
                  <th className="px-5 py-3">Estado</th>
                  <th className="px-5 py-3 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-sm font-medium text-slate-600">
                {filteredUsuarios.length === 0 ? (
                  <tr><td colSpan="6" className="px-5 py-12 text-center text-slate-400">
                    {searchTerm || filtroRol || filtroEstado ? 'Sin resultados' : 'No hay usuarios registrados'}
                  </td></tr>
                ) : (
                  paginatedUsuarios.map((u, i) => (
                    <tr key={i} className="hover:bg-indigo-50/70">
                      <td className="px-5 py-3 text-slate-400 text-xs">{u.usu_id}</td>
                      <td className="px-5 py-3">{u.usu_nombre}</td>
                      <td className="px-5 py-3 text-xs">{u.usu_correo}</td>
                      <td className="px-5 py-3">
                        <span className="px-2 py-1 bg-indigo-50 text-indigo-700 rounded-md text-[10px] font-bold uppercase">{u.usu_rol}</span>
                      </td>
                      <td className="px-5 py-3">{estadoBadge(u.usu_estado)}</td>
                      <td className="px-5 py-3">
                        <div className="flex items-center justify-center gap-1.5">
                          <button onClick={() => openUserModal(u)} title="Editar usuario"
                            className="p-1.5 rounded-md text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors">
                            <Edit3 size={15} />
                          </button>
                          <button onClick={() => setConfirmDelete(u.usu_id)} title="Eliminar usuario"
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
            <span>{filteredUsuarios.length > 0
              ? `${(paginaUsuarios - 1) * POR_PAGINA + 1}–${Math.min(paginaUsuarios * POR_PAGINA, filteredUsuarios.length)} de ${filteredUsuarios.length}`
              : `${filteredUsuarios.length} usuarios`}</span>
            <div className="flex items-center gap-2">
              <button onClick={() => setPaginaUsuarios(p => Math.max(1, p - 1))} disabled={paginaUsuarios <= 1}
                className="px-3 py-1.5 rounded-md border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all text-xs font-bold uppercase tracking-wider">Anterior</button>
              <span className="text-slate-500">{paginaUsuarios} / {Math.max(1, Math.ceil(filteredUsuarios.length / POR_PAGINA))}</span>
              <button onClick={() => setPaginaUsuarios(p => p + 1)} disabled={paginaUsuarios >= Math.ceil(filteredUsuarios.length / POR_PAGINA)}
                className="px-3 py-1.5 rounded-md border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all text-xs font-bold uppercase tracking-wider">Siguiente</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Tabla de Roles ── */}
      {tab === 'roles' && (
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 border-l-4 border-l-indigo-400 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-slate-400 text-xs uppercase font-bold tracking-wider border-b border-slate-100">
                <tr>
                  <th className="px-5 py-3">ID</th>
                  <th className="px-5 py-3">Nombre</th>
                  <th className="px-5 py-3">Descripción</th>
                  <th className="px-5 py-3 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-sm font-medium text-slate-600">
                {filteredRoles.length === 0 ? (
                  <tr><td colSpan="4" className="px-5 py-12 text-center text-slate-400">
                    {searchTerm ? 'Sin resultados' : 'No hay roles registrados'}
                  </td></tr>
                ) : (
                  paginatedRoles.map((r, i) => (
                    <tr key={i} className="hover:bg-indigo-50/70">
                      <td className="px-5 py-3 text-slate-400 text-xs">{r.rol_id}</td>
                      <td className="px-5 py-3">
                        <span className="px-2 py-1 bg-indigo-50 text-indigo-700 rounded-md text-[10px] font-bold uppercase">{r.rol_nombre}</span>
                      </td>
                      <td className="px-5 py-3 text-slate-400 text-xs">{r.rol_descripcion || '-'}</td>
                      <td className="px-5 py-3">
                        <div className="flex items-center justify-center gap-1.5">
                          <button onClick={() => openRolModal(r)} title="Editar rol"
                            className="p-1.5 rounded-md text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors">
                            <Edit3 size={15} />
                          </button>
                          <button onClick={() => setConfirmDeleteRol(r.rol_id)} title="Eliminar rol"
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
            <span>{filteredRoles.length} roles</span>
            <div className="flex items-center gap-2">
              <button onClick={() => setPaginaRoles(p => Math.max(1, p - 1))} disabled={paginaRoles <= 1}
                className="px-3 py-1.5 rounded-md border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all text-xs font-bold uppercase tracking-wider">Anterior</button>
              <span className="text-slate-500">{paginaRoles} / {Math.max(1, Math.ceil(filteredRoles.length / POR_PAGINA))}</span>
              <button onClick={() => setPaginaRoles(p => p + 1)} disabled={paginaRoles >= Math.ceil(filteredRoles.length / POR_PAGINA)}
                className="px-3 py-1.5 rounded-md border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all text-xs font-bold uppercase tracking-wider">Siguiente</button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: Usuario ── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" ref={focusTrapRef}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4 border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-800">{editingUserId ? 'Editar Usuario' : 'Nuevo Usuario'}</h2>
              <button onClick={() => setShowModal(false)} className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"><X size={20} /></button>
            </div>
            <form onSubmit={handleUserSubmit} className="px-6 py-4 space-y-4">
              {formError && <div className="bg-red-50 border border-red-200 text-red-700 text-xs font-bold px-4 py-2.5 rounded-lg">{formError}</div>}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">ID *</label>
                  <input type="text" name="usu_id" value={formData.usu_id || ''} disabled={!!editingUserId}
                    className="w-full text-sm border border-slate-300 rounded-md px-3 py-2.5 bg-white outline-none font-medium disabled:bg-slate-100 disabled:text-slate-400" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Nombre *</label>
                  <input type="text" name="usu_nombre" value={formData.usu_nombre || ''} onChange={handleUserChange}
                    className="w-full text-sm border border-slate-300 rounded-md px-3 py-2.5 bg-white outline-none font-medium" />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Correo *</label>
                <input type="email" name="usu_correo" value={formData.usu_correo || ''} onChange={handleUserChange}
                  className="w-full text-sm border border-slate-300 rounded-md px-3 py-2.5 bg-white outline-none font-medium" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Rol *</label>
                  <select name="usu_rol" value={formData.usu_rol || 'Vendedor'} onChange={handleUserChange}
                    className="w-full text-sm border border-slate-300 rounded-md px-3 py-2.5 bg-white outline-none font-medium">
                    {ROLES_DISPONIBLES.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Estado</label>
                  <select name="usu_estado" value={formData.usu_estado ?? 1} onChange={(e) => setFormData({...formData, usu_estado: Number(e.target.value)})}
                    className="w-full text-sm border border-slate-300 rounded-md px-3 py-2.5 bg-white outline-none font-medium">
                    <option value={1}>Activo</option>
                    <option value={0}>Inactivo</option>
                  </select>
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Contraseña {editingUserId ? '(dejar vacío para no cambiar)' : '*'}
                </label>
                <div className="relative">
                  <input type={showPassword ? 'text' : 'password'} name="usu_contrasena" value={formData.usu_contrasena || ''} onChange={handleUserChange}
                    className="w-full text-sm border border-slate-300 rounded-md px-3 py-2.5 bg-white outline-none font-medium pr-10" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1">
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowModal(false)}
                  className="px-4 py-2.5 text-xs font-bold text-slate-500 bg-white border border-slate-200 rounded-md hover:bg-slate-50 transition-colors uppercase tracking-wider">Cancelar</button>
                <button type="submit" disabled={formSubmitting}
                  className="flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-indigo-600 rounded-md hover:bg-indigo-700 transition-colors uppercase tracking-wider disabled:opacity-50">
                  {formSubmitting ? <Loader2 size={14} className="animate-spin" /> : (editingUserId ? <Edit3 size={14} /> : <Plus size={14} />)}
                  {editingUserId ? 'Guardar' : 'Crear Usuario'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: Rol ── */}
      {showRolModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" ref={focusTrapRef}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-800">{editingRolId ? 'Editar Rol' : 'Nuevo Rol'}</h2>
              <button onClick={() => setShowRolModal(false)} className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"><X size={20} /></button>
            </div>
            <form onSubmit={handleRolSubmit} className="px-6 py-4 space-y-4">
              {formError && <div className="bg-red-50 border border-red-200 text-red-700 text-xs font-bold px-4 py-2.5 rounded-lg">{formError}</div>}
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">ID *</label>
                <input type="text" name="rol_id" value={rolFormData.rol_id || ''} onChange={handleRolChange}
                  disabled={!!editingRolId}
                  className="w-full text-sm border border-slate-300 rounded-md px-3 py-2.5 bg-white outline-none font-medium disabled:bg-slate-100 disabled:text-slate-400" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Nombre *</label>
                <input type="text" name="rol_nombre" value={rolFormData.rol_nombre || ''} onChange={handleRolChange}
                  className="w-full text-sm border border-slate-300 rounded-md px-3 py-2.5 bg-white outline-none font-medium" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Descripción</label>
                <textarea name="rol_descripcion" value={rolFormData.rol_descripcion || ''} onChange={handleRolChange}
                  rows="2" className="w-full text-sm border border-slate-300 rounded-md px-3 py-2.5 bg-white outline-none font-medium resize-none" />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowRolModal(false)}
                  className="px-4 py-2.5 text-xs font-bold text-slate-500 bg-white border border-slate-200 rounded-md hover:bg-slate-50 transition-colors uppercase tracking-wider">Cancelar</button>
                <button type="submit" disabled={formSubmitting}
                  className="flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-indigo-600 rounded-md hover:bg-indigo-700 transition-colors uppercase tracking-wider disabled:opacity-50">
                  {formSubmitting ? <Loader2 size={14} className="animate-spin" /> : (editingRolId ? <Edit3 size={14} /> : <Plus size={14} />)}
                  {editingRolId ? 'Guardar' : 'Crear Rol'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmación de eliminación — Usuario */}
      <ConfirmModal open={!!confirmDelete} title="Eliminar Usuario"
        message={`¿Está seguro de eliminar el usuario ${confirmDelete}? Esta acción no se puede deshacer.`}
        onConfirm={handleDeleteUser} onCancel={() => setConfirmDelete(null)} confirmText="Eliminar" danger />

      {/* Confirmación de eliminación — Rol */}
      <ConfirmModal open={!!confirmDeleteRol} title="Eliminar Rol"
        message={`¿Está seguro de eliminar el rol ${confirmDeleteRol}? Esta acción no se puede deshacer.`}
        onConfirm={handleDeleteRol} onCancel={() => setConfirmDeleteRol(null)} confirmText="Eliminar" danger />
    </div>
  );
};

export default Usuarios;