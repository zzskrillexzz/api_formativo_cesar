import React, { useState, useEffect, useRef } from 'react';
import { Bell, X, AlertTriangle, Package, Clock } from 'lucide-react';
import { alertasService } from '../api/services/alertasService';
import { productosService } from '../api/services/productosService';
import { lotesService } from '../api/services/lotesService';

export const Notificaciones = () => {
  const [open, setOpen] = useState(false);
  const [alertas, setAlertas] = useState([]);
  const [stockBajo, setStockBajo] = useState([]);
  const [lotes, setLotes] = useState([]);
  const [visto, setVisto] = useState(true);
  const panelRef = useRef(null);
  const btnRef = useRef(null);

  const fetchNotificaciones = async () => {
    try {
      const [alts, prods, lots] = await Promise.all([
        alertasService.listar().catch(() => []),
        productosService.listar().catch(() => []),
        lotesService.listar().catch(() => [])
      ]);
      setLotes(lots);
      const criticas = alts.filter(a => a.dias_restantes <= 30);
      const bajo = prods.filter(p => {
        const stock = lots.filter(l => l.lot_pro_id_fk === p.id && l.lot_estado === 'Activo').reduce((s, l) => s + (l.lot_cantidad_actual || 0), 0);
        return stock <= 0;
      });
      setAlertas(criticas);
      setStockBajo(bajo);

      const total = criticas.length + bajo.length;
      const ultimoVisto = parseInt(localStorage.getItem('notif_last_count') || '0');
      setVisto(total <= ultimoVisto);
    } catch (_) {}
  };

  useEffect(() => {
    fetchNotificaciones();
    const interval = setInterval(fetchNotificaciones, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClick = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target) &&
          btnRef.current && !btnRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const total = alertas.length + stockBajo.length;

  const marcarVisto = () => {
    localStorage.setItem('notif_last_count', total.toString());
    setVisto(true);
  };

  const handleToggle = () => {
    if (!open && !visto) marcarVisto();
    setOpen(!open);
  };

  return (
    <div className="relative">
      <button
        ref={btnRef}
        onClick={handleToggle}
        className="relative p-2 text-white/60 hover:text-white transition-colors"
      >
        <Bell size={22} />
        {!visto && (
          <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-blue-800 animate-pulse" />
        )}
      </button>

      {open && (
        <div
          ref={panelRef}
          className="absolute right-0 top-12 w-80 bg-white rounded-lg shadow-2xl border border-slate-200 overflow-hidden z-50"
        >
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50/50">
            <h4 className="font-bold text-sm text-slate-800">Notificaciones</h4>
            <span className="text-xs text-slate-400 font-medium">{total} nuevas</span>
          </div>

          <div className="max-h-72 overflow-y-auto divide-y divide-slate-50">
            {total === 0 ? (
              <div className="px-4 py-10 text-center text-sm text-slate-400">
                No hay notificaciones pendientes
              </div>
            ) : (
              <>
                {stockBajo.map((p, i) => (
                  <div key={`sb-${i}`} className="flex items-start gap-3 px-4 py-3 hover:bg-slate-50">
                    <div className="p-1.5 bg-red-50 rounded-md mt-0.5">
                      <AlertTriangle size={14} className="text-red-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-800">{p.nombre || p.id}</p>
                      <p className="text-xs text-red-500 mt-0.5">
                        Sin stock disponible
                      </p>
                    </div>
                  </div>
                ))}

                {alertas.map((a, i) => (
                  <div key={`al-${i}`} className="flex items-start gap-3 px-4 py-3 hover:bg-slate-50">
                    <div className="p-1.5 bg-orange-50 rounded-md mt-0.5">
                      <Clock size={14} className="text-orange-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-800">{a.producto_id || a.id}</p>
                      <p className="text-xs text-orange-600 mt-0.5">
                        Vence en {a.dias_restantes} dias ({a.fecha_vencimiento || '-'})
                      </p>
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
