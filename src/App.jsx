import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Sidebar } from './components/layout/Sidebar';
import DashboardPage from './pages/Dashboard';
import LoginPage from './pages/Login';
import { Search, Bell, Activity } from 'lucide-react';

const Layout = () => {
  const { isLogged, role, user } = useAuth();
  const [activeTab, setActiveTab] = useState('Dashboard');

  if (!isLogged) return <LoginPage />;

  return (
    <div className="flex h-screen bg-[#F1F5F9] font-sans text-slate-900">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-24 flex items-center justify-between px-10">
          <div className="flex items-center gap-4 bg-white border border-slate-200 px-6 py-3 rounded-2xl w-[450px] shadow-sm">
            <Search size={18} className="text-slate-400" />
            <input type="text" placeholder="Buscar..." className="bg-transparent border-none outline-none text-sm w-full font-medium" />
          </div>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-4 bg-white p-2 pr-6 rounded-2xl border border-slate-200 shadow-sm">
              <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-600 font-black text-xs border border-slate-200">{user.initials}</div>
              <div>
                <p className="text-xs font-black text-slate-800 leading-none">{user.name}</p>
                <p className="text-[9px] font-black text-blue-500 uppercase mt-1 tracking-widest">{role}</p>
              </div>
            </div>
            <button className="relative p-2 text-slate-400 hover:text-blue-600 transition-colors">
              <Bell size={24} /><span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-[#F1F5F9]"></span>
            </button>
          </div>
        </header>

        <section className="flex-1 overflow-y-auto px-10 pb-10">
          <div className="max-w-7xl mx-auto">
            <header className="mb-8 flex justify-between items-center">
              <h2 className="text-4xl font-black text-slate-800 tracking-tighter uppercase italic">{activeTab}</h2>
              <div className="flex items-center gap-2 bg-emerald-500 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase shadow-lg shadow-emerald-500/20">
                <Activity size={14} /> Sincronizado
              </div>
            </header>

            {activeTab === 'Dashboard' ? <DashboardPage /> : <div className="p-20 bg-white rounded-[40px] text-center font-bold italic text-slate-300 uppercase">Módulo {activeTab} listo para conexión</div>}
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