import React, { useState, useEffect } from 'react';
import { Truck, Package, Search, Plus, Loader2, RefreshCw } from 'lucide-react';
import { comprasService } from '../api/services/comprasService';
import { proveedoresService } from '../api/services/proveedoresService';

const Compras = () => {
  const [tab, setTab] = useState('compras');
  const [compras, setCompras] = useState([]);
  const [proveedores, setProveedores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [comps, provs] = await Promise.all([
        comprasService.listar().catch(() => []),
        proveedoresService.listar().catch(() => [])
      ]);
      setCompras(comps);
      setProveedores(provs);
    } catch (err) {
      console.error('Error cargando compras:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const tabs = [
    { id: 'compras', label: 'Compras', icon: Package },
    { id: 'proveedores', label: 'Proveedores', icon: Truck },
  ];

  const filteredCompras = compras.filter(c =>
    (c.id || c.comp_id || '').toLowerCase().includes(searchTerm.toLowerCase())
  );
  const filteredProveedores = proveedores.filter(p =>
    (p.prov_nombre || p.prov_id || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-blue-600" size={40} />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      {/* Tabs */}
      <div className="flex items-center gap-2 bg-white rounded-2xl p-1.5 shadow-sm border border-slate-200 w-fit">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-5 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
              tab === t.id ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <t.icon size={16} /> {t.label}
          </button>
        ))}
      </div>

      {/* Barra de acciones */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 bg-white border border-slate-200 px-5 py-3 rounded-2xl w-96 shadow-sm">
          <Search size={18} className="text-slate-400" />
          <input
            type="text"
            placeholder={tab === 'compras' ? 'Buscar compra...' : 'Buscar proveedor...'}
            className="bg-transparent border-none outline-none text-sm w-full font-medium"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <button onClick={fetchData} className="p-3 bg-white border border-slate-200 rounded-2xl hover:bg-slate-50 transition-all shadow-sm">
            <RefreshCw size={18} className="text-slate-500" />
          </button>
          <button className="flex items-center gap-2 bg-blue-600 text-white px-5 py-3 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-md">
            <Plus size={16} /> Nuevo {tab === 'compras' ? 'Compra' : 'Proveedor'}
          </button>
        </div>
      </div>

      {/* TAB: Compras */}
      {tab === 'compras' && (
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50/50 text-slate-400 text-[10px] uppercase font-black tracking-widest border-b border-slate-100">
                <tr>
                  <th className="px-6 py-4">ID</th>
                  <th className="px-6 py-4">Producto</th>
                  <th className="px-6 py-4">Proveedor</th>
                  <th className="px-6 py-4 text-right">Cantidad</th>
                  <th className="px-6 py-4 text-right">Total</th>
                  <th className="px-6 py-4">Fecha</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-sm font-bold text-slate-600">
                {filteredCompras.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-12 text-center text-slate-400 italic">
                      {searchTerm ? 'Sin resultados' : 'No hay compras registradas'}
                    </td>
                  </tr>
                ) : (
                  filteredCompras.map((c, i) => (
                    <tr key={i} className="hover:bg-slate-50">
                      <td className="px-6 py-4 text-slate-400 text-xs">{c.comp_id || c.id}</td>
                      <td className="px-6 py-4">{c.comp_pro_id_fk || '-'}</td>
                      <td className="px-6 py-4">{c.comp_prov_id_fk || '-'}</td>
                      <td className="px-6 py-4 text-right">{c.comp_cantidad || '-'}</td>
                      <td className="px-6 py-4 text-right">${parseFloat(c.comp_total || 0).toLocaleString()}</td>
                      <td className="px-6 py-4 text-slate-400">{c.comp_fecha || '-'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="px-6 py-4 bg-slate-50/30 border-t border-slate-100 text-[10px] text-slate-400 font-bold">
            {filteredCompras.length} de {compras.length} compras
          </div>
        </div>
      )}

      {/* TAB: Proveedores */}
      {tab === 'proveedores' && (
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50/50 text-slate-400 text-[10px] uppercase font-black tracking-widest border-b border-slate-100">
                <tr>
                  <th className="px-6 py-4">ID</th>
                  <th className="px-6 py-4">Nombre</th>
                  <th className="px-6 py-4">Contacto</th>
                  <th className="px-6 py-4">Teléfono</th>
                  <th className="px-6 py-4">Correo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-sm font-bold text-slate-600">
                {filteredProveedores.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-12 text-center text-slate-400 italic">
                      {searchTerm ? 'Sin resultados' : 'No hay proveedores registrados'}
                    </td>
                  </tr>
                ) : (
                  filteredProveedores.map((p, i) => (
                    <tr key={i} className="hover:bg-slate-50">
                      <td className="px-6 py-4 text-slate-400 text-xs">{p.prov_id}</td>
                      <td className="px-6 py-4">{p.prov_nombre}</td>
                      <td className="px-6 py-4">{p.prov_contacto || '-'}</td>
                      <td className="px-6 py-4">{p.prov_telefono || '-'}</td>
                      <td className="px-6 py-4 text-slate-400">{p.prov_correo || '-'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="px-6 py-4 bg-slate-50/30 border-t border-slate-100 text-[10px] text-slate-400 font-bold">
            {filteredProveedores.length} de {proveedores.length} proveedores
          </div>
        </div>
      )}
    </div>
  );
};

export default Compras;