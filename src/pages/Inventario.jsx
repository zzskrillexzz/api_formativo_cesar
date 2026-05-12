import React, { useState, useEffect } from 'react';
import { Package, Layers, AlertTriangle, Search, Plus, Loader2, RefreshCw } from 'lucide-react';
import { productosService } from '../api/services/productosService';
import { lotesService } from '../api/services/lotesService';
import { monitoriasService } from '../api/services/monitoriasService';

const Inventario = () => {
  const [tab, setTab] = useState('productos');
  const [productos, setProductos] = useState([]);
  const [lotes, setLotes] = useState([]);
  const [monitorias, setMonitorias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [prods, lots, mons] = await Promise.all([
        productosService.listar().catch(() => []),
        lotesService.listar().catch(() => []),
        monitoriasService.listar().catch(() => [])
      ]);
      setProductos(prods);
      setLotes(lots);
      setMonitorias(mons);
    } catch (err) {
      console.error('Error cargando inventario:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const tabs = [
    { id: 'productos', label: 'Productos', icon: Package },
    { id: 'lotes', label: 'Lotes', icon: Layers },
    { id: 'movimientos', label: 'Movimientos', icon: AlertTriangle },
  ];

  const filteredProductos = productos.filter(p =>
    (p.nombre || p.id || '').toLowerCase().includes(searchTerm.toLowerCase())
  );
  const filteredLotes = lotes.filter(l =>
    (l.lot_id || l.lot_numero || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

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
            placeholder={tab === 'productos' ? 'Buscar producto...' : tab === 'lotes' ? 'Buscar lote...' : 'Buscar movimiento...'}
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
            <Plus size={16} /> Nuevo {tab === 'productos' ? 'Producto' : tab === 'lotes' ? 'Lote' : 'Movimiento'}
          </button>
        </div>
      </div>

      {/* TAB: Productos */}
      {tab === 'productos' && (
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50/50 text-slate-400 text-[10px] uppercase font-black tracking-widest border-b border-slate-100">
                <tr>
                  <th className="px-6 py-4">ID</th>
                  <th className="px-6 py-4">Nombre</th>
                  <th className="px-6 py-4">Categoría</th>
                  <th className="px-6 py-4 text-right">Precio</th>
                  <th className="px-6 py-4 text-right">Stock</th>
                  <th className="px-6 py-4">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-sm font-bold text-slate-600">
                {filteredProductos.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-12 text-center text-slate-400 italic">
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
                        <span className={`font-black ${(p.cantidad_disponible || 0) <= (p.stock_minimo || 0) ? 'text-red-600' : 'text-slate-800'}`}>
                          {p.cantidad_disponible || 0}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase ${getEstadoBadge(p.estado)}`}>{p.estado}</span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="px-6 py-4 bg-slate-50/30 border-t border-slate-100 text-[10px] text-slate-400 font-bold">
            {filteredProductos.length} de {productos.length} productos
          </div>
        </div>
      )}

      {/* TAB: Lotes */}
      {tab === 'lotes' && (
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50/50 text-slate-400 text-[10px] uppercase font-black tracking-widest border-b border-slate-100">
                <tr>
                  <th className="px-6 py-4">ID</th>
                  <th className="px-6 py-4">N° Lote</th>
                  <th className="px-6 py-4">Producto</th>
                  <th className="px-6 py-4 text-right">Cant. Inicial</th>
                  <th className="px-6 py-4 text-right">Cant. Actual</th>
                  <th className="px-6 py-4 text-right">Vencimiento</th>
                  <th className="px-6 py-4">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-sm font-bold text-slate-600">
                {filteredLotes.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-12 text-center text-slate-400 italic">
                      {searchTerm ? 'Sin resultados' : 'No hay lotes registrados'}
                    </td>
                  </tr>
                ) : (
                  filteredLotes.map((l, i) => (
                    <tr key={i} className="hover:bg-slate-50">
                      <td className="px-6 py-4 text-slate-400 text-xs">{l.lot_id}</td>
                      <td className="px-6 py-4">{l.lot_numero}</td>
                      <td className="px-6 py-4 text-slate-400">{l.lot_pro_id_fk || '-'}</td>
                      <td className="px-6 py-4 text-right">{l.lot_cantidad_inicial}</td>
                      <td className="px-6 py-4 text-right">{l.lot_cantidad_actual}</td>
                      <td className="px-6 py-4 text-right text-slate-400">{l.lot_fecha_vencimiento || '-'}</td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase ${getEstadoBadge(l.lot_estado)}`}>{l.lot_estado}</span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="px-6 py-4 bg-slate-50/30 border-t border-slate-100 text-[10px] text-slate-400 font-bold">
            {filteredLotes.length} de {lotes.length} lotes
          </div>
        </div>
      )}

      {/* TAB: Movimientos */}
      {tab === 'movimientos' && (
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50/50 text-slate-400 text-[10px] uppercase font-black tracking-widest border-b border-slate-100">
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
                      <td className="px-6 py-4">{m.mon_pro_id_fk}</td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase ${
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
          <div className="px-6 py-4 bg-slate-50/30 border-t border-slate-100 text-[10px] text-slate-400 font-bold">
            {monitorias.length} movimientos
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventario;