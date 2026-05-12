import React, { useState } from 'react';
import { ShieldCheck, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const { login, loading } = useAuth();
  const [correo, setCorreo] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!correo || !password) {
      setError('Por favor complete todos los campos');
      return;
    }

    const result = await login(correo, password);
    if (!result.success) {
      setError(result.message);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 font-sans">
      <div className="max-w-[900px] w-full bg-white rounded-[40px] shadow-2xl border border-slate-100 flex overflow-hidden">
        {/* Lado Izquierdo - Branding */}
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
        
        {/* Lado Derecho - Formulario */}
        <div className="w-full md:w-1/2 p-12 flex flex-col justify-center">
          <h2 className="text-2xl font-black text-slate-800 tracking-tight mb-2">Iniciar Sesión</h2>
          <p className="text-slate-400 text-sm mb-8 font-medium">Ingrese sus credenciales de acceso</p>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-red-50 text-red-600 text-xs font-bold rounded-xl border border-red-100 italic">
                {error}
              </div>
            )}

            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Correo Electrónico</label>
              <input 
                type="email" 
                placeholder="ejemplo@sandiego.com" 
                className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 font-medium transition-all"
                value={correo}
                onChange={(e) => setCorreo(e.target.value)}
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Contraseña</label>
              <input 
                type="password" 
                placeholder="••••••••" 
                className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 font-medium transition-all"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            
            <button 
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-black py-4 rounded-2xl shadow-lg shadow-blue-100 transition-all active:scale-95 uppercase tracking-widest mt-4 flex items-center justify-center"
            >
              {loading ? <Loader2 className="animate-spin" size={20} /> : 'Entrar al Sistema'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;