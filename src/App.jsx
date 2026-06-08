import React, { useState, useEffect, useRef, Suspense } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Sidebar } from './components/layout/Sidebar';
import { 
  Wifi, WifiOff, Database, Loader2,
  LayoutDashboard, Package, ShoppingCart, Truck, BarChart3, RotateCcw 
} from 'lucide-react';
import { Notificaciones } from './components/Notificaciones';

// ── Lazy-loading de páginas (code-splitting por ruta) ──
const DashboardPage = React.lazy(() => import('./pages/Dashboard'));
const InventarioPage = React.lazy(() => import('./pages/Inventario'));
const VentasPage = React.lazy(() => import('./pages/Ventas'));
const ComprasPage = React.lazy(() => import('./pages/Compras'));
const ReportesPage = React.lazy(() => import('./pages/Reportes'));
const DevolucionesPage = React.lazy(() => import('./pages/Devoluciones'));
const LoginPage = React.lazy(() => import('./pages/Login'));

const PageLoader = () => (
  <div className="flex items-center justify-center py-20">
    <Loader2 size={32} className="animate-spin text-white/60" />
  </div>
);

const Layout = () => {
  const { isLogged, role, user } = useAuth();
  const [activeTab, setActiveTab] = useState('Dashboard');
  const [conectado, setConectado] = useState(true);
  const [dbConectado, setDbConectado] = useState(true);
  const [currentTab, setCurrentTab] = useState('Dashboard');

  const handleTabChange = (tab) => {
    if (tab === currentTab) return;
    setActiveTab(tab);
    setCurrentTab(tab);
  };

  const iconosModulos = {
    Dashboard: LayoutDashboard,
    Inventario: Package,
    Ventas: ShoppingCart,
    Compras: Truck,
    Reportes: BarChart3,
    Devoluciones: RotateCcw,
  };
  const IconoActivo = iconosModulos[activeTab] || LayoutDashboard;

  useEffect(() => {
    const check = async () => {
      try {
        const ctrl = new AbortController();
        const timer = setTimeout(() => ctrl.abort(), 3000);
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
        const res = await fetch(`${apiUrl}/`, { method: 'GET', signal: ctrl.signal });
        clearTimeout(timer);
        setConectado(res.ok || res.status === 200);
      } catch { setConectado(false); }
    };
    check();
    const interval = setInterval(check, 15000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const checkDb = async () => {
      try {
        const ctrl = new AbortController();
        const timer = setTimeout(() => ctrl.abort(), 3000);
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
        const res = await fetch(`${apiUrl}/health`, { method: 'GET', signal: ctrl.signal });
        clearTimeout(timer);
        if (res.ok) {
          const data = await res.json();
          setDbConectado(data.db === 'conectada');
        } else {
          setDbConectado(false);
        }
      } catch { setDbConectado(false); }
    };
    checkDb();
    const interval = setInterval(checkDb, 15000);
    return () => clearInterval(interval);
  }, []);

  if (!isLogged) return <Suspense fallback={<PageLoader />}><LoginPage /></Suspense>;

  return (
    <div className="flex h-screen bg-gradient-to-br from-blue-800 via-slate-800 to-slate-900 font-sans text-slate-900 animate-gradient">
      <Sidebar activeTab={activeTab} setActiveTab={handleTabChange} />
      
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-20 flex items-center justify-between px-8">
          <div className="flex items-center gap-4 text-white/70 text-sm font-medium">
            <span className="text-white/50 select-none">
              {new Date().toLocaleDateString('es-CO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </span>
          </div>

          <div className="flex items-center gap-5">
            <div className="flex items-center gap-3 bg-white p-1.5 pr-5 rounded-lg border border-slate-200/60 shadow-sm">
              <div className="w-9 h-9 bg-slate-100 rounded-lg flex items-center justify-center text-slate-600 font-black text-xs border border-slate-200">{user.initials}</div>
              <div>
                <p className="text-xs font-bold text-slate-800 leading-none">{user.name}</p>
                <p className="text-[9px] font-bold uppercase mt-0.5 text-emerald-600 tracking-wider">{role}</p>
              </div>
            </div>
            <Notificaciones />
          </div>
        </header>

        <section className="flex-1 overflow-y-auto px-8 pb-8">
          <div className="max-w-7xl mx-auto">
            <header className="mb-6 flex justify-between items-center">
              <div className="flex items-center gap-4 px-5 py-3 bg-white/[0.04] backdrop-blur-sm border border-white/[0.06] rounded-2xl shadow-sm hover:bg-white/[0.07] transition-all duration-300 group">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-400 to-orange-500 flex items-center justify-center shadow-lg shadow-orange-500/20 group-hover:scale-105 transition-transform duration-300">
                  <IconoActivo size={18} className="text-white drop-shadow-sm" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white tracking-tight drop-shadow-sm">{activeTab}</h2>
                  <div className="flex items-center gap-2 mt-0.5">
                    <div className="w-5 h-0.5 bg-gradient-to-r from-orange-400/80 to-transparent rounded-full" />
                    <span className="text-[9px] font-bold uppercase tracking-[0.15em] text-white/25">Módulo activo</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase shadow-sm transition-colors ${
                  conectado ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'
                }`}>
                  {conectado ? <Wifi size={12} /> : <WifiOff size={12} />}
                  {conectado ? 'Server' : 'Server'}
                </div>
                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase shadow-sm transition-colors ${
                  dbConectado ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'
                }`}>
                  {dbConectado ? <Database size={12} /> : <Database size={12} className="opacity-60" />}
                  {dbConectado ? 'BD Activa' : 'BD Caída'}
                </div>
              </div>
            </header>

            <Suspense fallback={<PageLoader />}>
              {currentTab === 'Dashboard' && <DashboardPage />}
              {currentTab === 'Inventario' && <InventarioPage />}
              {currentTab === 'Ventas' && <VentasPage />}
              {currentTab === 'Compras' && <ComprasPage />}
              {currentTab === 'Reportes' && <ReportesPage />}
              {currentTab === 'Devoluciones' && <DevolucionesPage />}
            </Suspense>
          </div>
        </section>
      </main>
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <Layout />
    </AuthProvider>
  );
}