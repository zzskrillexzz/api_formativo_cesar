import React from 'react';
import { ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const { login } = useAuth();

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 font-sans">
      <div className="max-w-[900px] w-full bg-white rounded-[40px] shadow-2xl border border-slate-100 flex overflow-hidden">
        <div className="hidden md:flex w-1/2 bg-blue-700 p-12 flex-col justify-between text-white relative">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
          <div className="relative z-10">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center mb-6">
              <ShieldCheck size={28} />
            </div>
            <h1 className="text-4xl font-black leading-none tracking-tighter italic uppercase">San Diego<br/>Distribuidora</h1>
            <div className="h-1 w-12 bg-emerald-400 mt-4 rounded-full"></div>
          </div>
          <p className="relative z-10 text-xs font-bold uppercase tracking-[0.2em] text-blue-200">Logistics OS v1.0</p>
        </div>
        
        <div className="w-full md:w-1/2 p-12 flex flex-col justify-center">
          <h2 className="text-2xl font-black text-slate-800 tracking-tight mb-8">Iniciar Sesión</h2>
          <div className="space-y-4">
            <select className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500 transition-all appearance-none cursor-pointer">
              <option value="ROL001">Administrador</option>
              <option value="ROL002">Vendedor</option>
            </select>
            <input type="text" placeholder="Usuario" className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 font-medium" defaultValue="admin_01" />
            <input type="password" placeholder="Contraseña" className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 font-medium" defaultValue="••••••••" />
            <button 
              onClick={() => login('ROL001')}
              className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-black py-4 rounded-2xl shadow-lg shadow-emerald-100 transition-all active:scale-95 uppercase tracking-widest mt-4"
            >
              Entrar al Sistema
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;