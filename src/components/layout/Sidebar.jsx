import React from 'react';
import { LayoutDashboard, Package, ShoppingCart, Truck, BarChart3, RotateCcw, Users, LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import logoSrc from '../../assets/image/mi-logo.png';

export const Sidebar = ({ activeTab, setActiveTab }) => {
  const { role, logout } = useAuth();

  const menuItems = [
    { id: 'Dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['ROL001', 'ROL002', 'ROL003', 'ROL004'] },
    { id: 'Inventario', label: 'Inventario', icon: Package, roles: ['ROL001', 'ROL003'] },
    { id: 'Ventas', label: 'Módulo Ventas', icon: ShoppingCart, roles: ['ROL001', 'ROL002'] },
    { id: 'Compras', label: 'Gestión Compras', icon: Truck, roles: ['ROL001', 'ROL003'] },
    { id: 'Reportes', label: 'Analítica', icon: BarChart3, roles: ['ROL001', 'ROL004'] },
    { id: 'Devoluciones', label: 'Devoluciones', icon: RotateCcw, roles: ['ROL001', 'ROL002', 'ROL003'] },
    { id: 'Usuarios', label: 'Usuarios', icon: Users, roles: ['ROL001'] },
  ];

  return (
    <aside className="w-64 bg-gradient-to-b from-blue-600 to-blue-800 flex flex-col m-3 mr-0 rounded-lg overflow-hidden shadow-xl relative">
      {/* Decorative crosses */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <span className="absolute top-16 left-6 text-white/10 text-base">+</span>
        <span className="absolute top-20 right-8 text-white/10 text-base">+</span>
        <span className="absolute bottom-32 left-8 text-white/8 text-base">+</span>
      </div>

      <div className="p-5 relative z-10 flex flex-col items-center">
        <img
          src={logoSrc}
          alt="Logo"
          className="w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 object-contain"
        />
        <span className="text-white/70 text-[20px] font-bold uppercase tracking-[0.2em] -mt-1 leading-none select-none">logistics</span>
      </div>

      <nav className="flex-1 px-3 space-y-0.5 relative z-10">
        {menuItems.map((item) => (
          item.roles.includes(role) && (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all font-medium text-sm ${
                activeTab === item.id 
                ? 'bg-white/15 text-white shadow-sm' 
                : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              <item.icon size={16} strokeWidth={2} className={activeTab === item.id ? 'text-orange-400' : ''} />
              {item.label}
            </button>
          )
        ))}
      </nav>

      <div className="p-4 relative z-10">
        <button 
          onClick={logout}
          className="w-full flex items-center justify-center gap-2 py-2.5 bg-white/10 text-white/50 hover:text-red-300 hover:bg-white/15 rounded-lg font-bold text-[9px] uppercase tracking-widest transition-all"
        >
          <LogOut size={14} /> Salir
        </button>
      </div>
    </aside>
  );
};
