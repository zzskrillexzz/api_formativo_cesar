import React from 'react';
import { LayoutDashboard, Package, ShoppingCart, Truck, BarChart3, LogOut, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const Sidebar = ({ activeTab, setActiveTab }) => {
  const { role, logout } = useAuth();

  const menuItems = [
    { id: 'Dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['ROL001', 'ROL002', 'ROL003', 'ROL004'] },
    { id: 'Inventario', label: 'Inventario', icon: Package, roles: ['ROL001', 'ROL003'] },
    { id: 'Ventas', label: 'Módulo Ventas', icon: ShoppingCart, roles: ['ROL001', 'ROL002'] },
    { id: 'Compras', label: 'Gestión Compras', icon: Truck, roles: ['ROL001', 'ROL003'] },
    { id: 'Reportes', label: 'Analítica', icon: BarChart3, roles: ['ROL001', 'ROL004'] },
  ];

  return (
    <aside className="w-72 bg-slate-900 flex flex-col m-4 mr-0 rounded-[32px] overflow-hidden shadow-2xl">
      <div className="p-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center text-white shadow-lg">
            <ShieldCheck size={24} />
          </div>
          <div>
            <span className="text-white font-black text-lg tracking-tighter leading-none block">SAN DIEGO</span>
            <span className="text-emerald-400 text-[9px] font-black uppercase tracking-widest">Distribuidora</span>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-4 space-y-1">
        {menuItems.map((item) => (
          item.roles.includes(role) && (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all font-bold text-sm ${
                activeTab === item.id 
                ? 'bg-blue-600 text-white shadow-lg' 
                : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
              }`}
            >
              <item.icon size={20} strokeWidth={2.5} />
              {item.label}
            </button>
          )
        ))}
      </nav>

      <div className="p-6 mt-auto">
        <button 
          onClick={logout}
          className="w-full flex items-center justify-center gap-2 py-4 bg-slate-800 text-slate-400 hover:text-red-400 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all"
        >
          <LogOut size={16} /> Salir
        </button>
      </div>
    </aside>
  );
};