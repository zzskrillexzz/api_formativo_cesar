import React, { useState, useEffect, useRef } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Sidebar } from './components/layout/Sidebar';
import DashboardPage from './pages/Dashboard';
import InventarioPage from './pages/Inventario';
import VentasPage from './pages/Ventas';
import ComprasPage from './pages/Compras';
import ReportesPage from './pages/Reportes';
import LoginPage from './pages/Login';
import { Wifi, WifiOff } from 'lucide-react';
import { Notificaciones } from './components/Notificaciones';

const Layout = () => {
  const { isLogged, role, user } = useAuth();
  const [activeTab, setActiveTab] = useState('Dashboard');
  const [conectado, setConectado] = useState(true);
  const [currentTab, setCurrentTab] = useState('Dashboard');

  const handleTabChange = (tab) => {
    if (tab === currentTab) return;
    setActiveTab(tab);
    setCurrentTab(tab);
  };

  useEffect(() => {
    const check = async () => {
      try {
        const ctrl = new AbortController();
        const timer = setTimeout(() => ctrl.abort(), 3000);
        const res = await fetch('http://localhost:5000/login', { method: 'OPTIONS', signal: ctrl.signal });
        clearTimeout(timer);
        setConectado(res.ok || res.status === 200);
      } catch { setConectado(false); }
    };
    check();
    const interval = setInterval(check, 15000);
    return () => clearInterval(interval);
  }, []);

  if (!isLogged) return <LoginPage />;

  return (
    <div className="flex h-screen bg-gradient-to-br from-blue-800 via-slate-800 to-slate-900 font-sans text-slate-900 animate-gradient">
      <Sidebar activeTab={activeTab} setActiveTab={handleTabChange} />
      
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-20 flex items-center justify-between px-8">
          <div className="flex items-center gap-3 text-white/70 text-sm font-medium">
            <span className="text-white/50">
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
              <h2 className="text-2xl font-bold text-white tracking-tight">{activeTab}</h2>
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase shadow-sm transition-colors ${
                conectado ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'
              }`}>
                {conectado ? <Wifi size={12} /> : <WifiOff size={12} />}
                {conectado ? 'Conectado' : 'Desconectado'}
              </div>
            </header>

            {currentTab === 'Dashboard' && <DashboardPage />}
            {currentTab === 'Inventario' && <InventarioPage />}
            {currentTab === 'Ventas' && <VentasPage />}
            {currentTab === 'Compras' && <ComprasPage />}
            {currentTab === 'Reportes' && <ReportesPage />}
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