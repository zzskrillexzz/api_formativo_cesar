import React, { useState, useEffect } from 'react';
import { ShoppingCart, FileText, Users, Search, Plus, Loader2, RefreshCw, Eye } from 'lucide-react';
import { pedidosService } from '../api/services/pedidosService';
import { facturasService } from '../api/services/facturasService';
import { clientesService } from '../api/services/clientesService';

const Ventas = () => {
  const [tab, setTab] = useState('pedidos');
  const [pedidos, setPedidos] = useState([]);
  const [facturas, setFacturas] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

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
    (c.cli_nombre || c.cli_apellido || c.cli_id || '').toLowerCase().includes(searchTerm.toLowerCase())
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
          <button onClick={fetchData} className="p-3 bg-white border border-slate-200 rounded-2xl hover:bg-slate-50 transition-all shadow-sm">
            <RefreshCw size={18} className="text-slate-500" />
          </button>
          <button className="flex items-center gap-2 bg-blue-600 text-white px-5 py-3 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-md">
            <Plus size={16} /> Nuevo {tab === 'pedidos' ? 'Pedido' : tab === 'facturas' ? 'Factura' : 'Cliente'}
          </button>
        </div>
      </div>

      {/* TAB: Pedidos */}
      {tab === 'pedidos' && (
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50/50 text-slate-400 text-[10px] uppercase font-black tracking-widest border-b border-slate-100">
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
                      <td className="px-6 py-4">{p.ped_metodo_pago || '-'}</td>
                      <td className="px-6 py-4 text-right">
                        ${parseFloat(p.ped_total || 0).toLocaleString()}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase ${getEstadoEntregaBadge(p.ped_estado_entrega)}`}>
                          {p.ped_estado_entrega}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button className="p-2 text-slate-400 hover:text-blue-600 transition-colors">
                          <Eye size={16} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="px-6 py-4 bg-slate-50/30 border-t border-slate-100 text-[10px] text-slate-400 font-bold">
            {filteredPedidos.length} de {pedidos.length} pedidos
          </div>
        </div>
      )}

      {/* TAB: Facturas */}
      {tab === 'facturas' && (
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50/50 text-slate-400 text-[10px] uppercase font-black tracking-widest border-b border-slate-100">
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
                      <td className="px-6 py-4">{f.forma_pago || '-'}</td>
                      <td className="px-6 py-4">{f.email_enviado === 1 ? '✅' : '❌'}</td>
                      <td className="px-6 py-4 text-right">${parseFloat(f.total || 0).toLocaleString()}</td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase ${getEstadoFacturaBadge(f.estado)}`}>
                          {f.estado || 'Vigente'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button className="p-2 text-slate-400 hover:text-blue-600 transition-colors">
                          <Eye size={16} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="px-6 py-4 bg-slate-50/30 border-t border-slate-100 text-[10px] text-slate-400 font-bold">
            {filteredFacturas.length} de {facturas.length} facturas
          </div>
        </div>
      )}

      {/* TAB: Clientes */}
      {tab === 'clientes' && (
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50/50 text-slate-400 text-[10px] uppercase font-black tracking-widest border-b border-slate-100">
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
          <div className="px-6 py-4 bg-slate-50/30 border-t border-slate-100 text-[10px] text-slate-400 font-bold">
            {filteredClientes.length} de {clientes.length} clientes
          </div>
        </div>
      )}
    </div>
  );
};

export default Ventas;