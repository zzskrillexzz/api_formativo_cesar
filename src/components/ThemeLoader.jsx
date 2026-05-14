import React from 'react';
import { Box, Package, ShoppingCart, Truck, BarChart3, Layers } from 'lucide-react';

const themes = {
  Dashboard: {
    Icon: BarChart3,
    color: 'text-blue-600',
    bg: 'bg-blue-50',
    label: 'Cargando panel',
    bars: 4,
  },
  Inventario: {
    Icon: Box,
    color: 'text-emerald-600',
    bg: 'bg-emerald-50',
    label: 'Inventario',
    bars: 5,
  },
  Ventas: {
    Icon: ShoppingCart,
    color: 'text-blue-600',
    bg: 'bg-blue-50',
    label: 'Ventas',
    bars: 4,
  },
  Compras: {
    Icon: Truck,
    color: 'text-orange-600',
    bg: 'bg-orange-50',
    label: 'Compras',
    bars: 3,
  },
  Reportes: {
    Icon: BarChart3,
    color: 'text-emerald-600',
    bg: 'bg-emerald-50',
    label: 'Analitica',
    bars: 6,
  },
};

export const ThemeLoader = ({ module }) => {
  const theme = themes[module] || themes.Dashboard;
  const { Icon, color, bg, label, bars } = theme;

  return (
    <div className="flex flex-col items-center justify-center py-16 space-y-8">
      {/* Icono animado */}
      <div className={`w-16 h-16 ${bg} rounded-xl flex items-center justify-center animate-bounce`}>
        <Icon size={32} className={color} />
      </div>

      {/* Barras de carga tematicas */}
      <div className="flex items-end gap-1.5 h-16">
        {[...Array(bars)].map((_, i) => (
          <div
            key={i}
            className={`w-4 ${bg} rounded-t-md animate-pulse`}
            style={{
              height: `${30 + Math.random() * 100}%`,
              animationDelay: `${i * 0.15}s`,
              animationDuration: '0.9s',
            }}
          />
        ))}
      </div>

      {/* Texto */}
      <p className={`text-sm font-bold ${color}`}>{label}</p>
    </div>
  );
};
