import React, { useState, useEffect } from 'react';
import { RotateCcw, RefreshCw, Search } from 'lucide-react';
import { ThemeLoader } from '../components/ThemeLoader';
import { devolucionesService } from '../api/services/devolucionesService';
import { productosService } from '../api/services/productosService';
import { pedidosService } from '../api/services/pedidosService';

const Devoluciones = () => {
  const [devoluciones, setDevoluciones] = useState([]);
  const [productos, setProductos] = useState([]);
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [devs, prods, peds] = await Promise.all([
        devolucionesService.listar().catch(() => []),
        productosService.listar().catch(() => []),
        pedidosService.listar().catch(() => [])
      ]);
      setDevoluciones(devs);
      setProductos(prods);
      setPedidos(peds);
    } catch (_) {} finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const getProductoNombre = (prodId) => {
    const prod = productos.find(p => p.id === prodId);
    return prod ? prod.nombre : prodId;
  };

  const getPedidoInfo = (pedId) => {
    const ped = pedidos.find(p => p.ped_id === pedId);
    return ped ? `${ped.ped_id} (${ped.ped_cli_id_fk || '?'})` : pedId;
  };

  const filteredDevoluciones = devoluciones.filter(d => {
    const busca = searchTerm
      ? [d.id, d.pedido_id, getProductoNombre(d.producto_id), d.lote_id, d.motivo, d.usuario_id]
          .filter(Boolean).join(' ').toLowerCase().includes(searchTerm.toLowerCase())
      : true;
    const porFechaDesde = !fechaDesde || (d.fecha && d.fecha >= fechaDesde);
    const porFechaHasta = !fechaHasta || (d.fecha && d.fecha <= fechaHasta);
    return busca && porFechaDesde && porFechaHasta;
  });

  if (loading) return <ThemeLoader module="Devoluciones" />;

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      {/* Barra de acciones */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-3 bg-white border border-slate-300 px-5 py-3 rounded-lg w-80 shadow-sm">
            <Search size={18} className="text-slate-400" />
            <input
              type="text"
              placeholder="Buscar devolución..."
              className="bg-transparent border-none outline-none text-sm w-full font-medium"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <input
            type="date"
            value={fechaDesde}
            onChange={(e) => setFechaDesde(e.target.value)}
            className="text-xs border border-slate-300 rounded-md px-2.5 py-3 bg-white outline-none shadow-sm"
            title="Fecha desde"
          />
          <span className="text-slate-300 text-xs">→</span>
          <input
            type="date"
            value={fechaHasta}
            onChange={(e) => setFechaHasta(e.target.value)}
            className="text-xs border border-slate-300 rounded-md px-2.5 py-3 bg-white outline-none shadow-sm"
            title="Fecha hasta"
          />
          {(searchTerm || fechaDesde || fechaHasta) && (
            <button
              onClick={() => { setSearchTerm(''); setFechaDesde(''); setFechaHasta(''); }}
              className="text-[10px] font-bold uppercase tracking-wider text-slate-400 hover:text-red-500 transition-colors px-2"
            >
              ✕ Limpiar filtros
            </button>
          )}
        </div>
        <button onClick={fetchData} className="p-3 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-all shadow-sm" title="Actualizar">
          <RefreshCw size={18} className="text-slate-500" />
        </button>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-left table-animate">
          <thead className="bg-slate-50 text-slate-400 text-xs uppercase font-bold tracking-wider border-b border-slate-100">
            <tr>
              <th className="px-5 py-3">ID</th>
              <th className="px-5 py-3">Pedido</th>
              <th className="px-5 py-3">Producto</th>
              <th className="px-5 py-3">Lote</th>
              <th className="px-5 py-3 text-right">Cant.</th>
              <th className="px-5 py-3">Motivo</th>
              <th className="px-5 py-3">Fecha</th>
              <th className="px-5 py-3">Registrado por</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 text-sm font-medium text-slate-600">
            {filteredDevoluciones.length === 0 ? (
              <tr><td colSpan="8" className="px-5 py-12 text-center text-slate-400">
                {searchTerm || fechaDesde || fechaHasta ? 'Sin resultados para estos filtros' : 'No hay devoluciones registradas'}
              </td></tr>
            ) : (
              filteredDevoluciones.map((d, i) => (
                <tr key={i} className="hover:bg-slate-50">
                  <td className="px-5 py-3 text-slate-400 text-xs">{d.id}</td>
                  <td className="px-5 py-3 text-xs" title={d.pedido_id}>{getPedidoInfo(d.pedido_id)}</td>
                  <td className="px-5 py-3" title={d.producto_id}>{getProductoNombre(d.producto_id)}</td>
                  <td className="px-5 py-3">{d.lote_id || '-'}</td>
                  <td className="px-5 py-3 text-right font-bold">{d.cantidad}</td>
                  <td className="px-5 py-3 text-slate-500 text-xs max-w-[200px] truncate" title={d.motivo}>{d.motivo}</td>
                  <td className="px-5 py-3 text-slate-400 text-xs">{d.fecha ? d.fecha.split('T')[0] : '-'}</td>
                  <td className="px-5 py-3 text-slate-400 text-xs">{d.usuario_id || '-'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="text-xs text-slate-400 font-medium">
        {filteredDevoluciones.length} de {devoluciones.length} devoluciones
      </div>
    </div>
  );
};

export default Devoluciones;
