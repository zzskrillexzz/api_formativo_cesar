import React, { useState } from 'react';
import { Loader2, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const { login, loading } = useAuth();
  const [correo, setCorreo] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [errors, setErrors] = useState({});

  const validateField = (field, value) => {
    const newErrors = { ...errors };
    if (field === 'correo') {
      if (!value.trim()) newErrors.correo = 'El correo es obligatorio';
      else if (!/\S+@\S+\.\S+/.test(value)) newErrors.correo = 'Correo no válido';
      else delete newErrors.correo;
    }
    if (field === 'password') {
      if (!value) newErrors.password = 'La contraseña es obligatoria';
      else delete newErrors.password;
    }
    setErrors(newErrors);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setErrors({});
    validateField('correo', correo);
    validateField('password', password);
    if (!correo.trim() || !password) {
      setError('Complete todos los campos');
      return;
    }
    const result = await login(correo, password);
    if (!result.success) setError(result.message);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-800 via-slate-800 to-slate-900 flex items-center justify-center p-4 font-sans animate-gradient">
      {/* Tarjeta central tipo ventana */}
      <div className="w-full max-w-[700px] bg-white rounded-lg shadow-2xl flex overflow-hidden animate-fade-in" style={{ boxShadow: '0 20px 45px rgba(0,0,0,0.25)' }}>
        
        {/* ── PANEL IZQUIERDO ── */}
        <div className="hidden md:flex w-1/2 bg-gradient-to-b from-blue-600 to-blue-800 p-8 flex-col justify-between text-white relative min-h-[450px]">
          {/* Icono superior */}
          <div className="relative z-10">
            <ShieldCheck size={22} className="text-white/80" />
          </div>

          {/* Espacio para logo (Ez Logistics) */}
          <div className="relative z-10 flex flex-col items-center justify-center flex-1 -mt-10">
            <div className="w-16 h-16 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center mb-4 ring-1 ring-white/20 animate-float">
              <ShieldCheck size={32} className="text-white" />
            </div>
            <p className="text-white/90 text-lg font-black tracking-tight uppercase animate-fade-in animate-delay-200">Ez</p>
            <p className="text-blue-200 text-lg font-black tracking-tight uppercase animate-fade-in animate-delay-300">Logistics</p>
            <div className="h-0.5 w-10 bg-blue-300/50 mt-3 rounded-full animate-fade-in animate-delay-400" />
          </div>

          {/* Indicadores inferiores + version */}
          <div className="relative z-10 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-300 shadow-lg animate-pulse-soft" />
              <span className="w-2 h-2 rounded-full bg-white/30 animate-pulse-soft animate-delay-200" />
              <span className="w-2 h-2 rounded-full bg-white/30 animate-pulse-soft animate-delay-300" />
              <span className="w-2 h-2 rounded-full bg-white/30 animate-pulse-soft animate-delay-400" />
            </div>
            <span className="text-[9px] text-white/40 font-medium tracking-wider">Ez Platform V 1.0</span>
          </div>
        </div>

        {/* ── PANEL DERECHO ── */}
        <div className="w-full md:w-1/2 p-8 flex flex-col justify-center bg-white">
          {/* Titulo */}
          <h2 className="text-xl font-bold text-slate-800 tracking-tight mb-1 animate-slide-up">
            Iniciar <span className="text-blue-600">Sesion</span>
          </h2>
          <p className="text-xs text-slate-400 mb-6 animate-slide-up animate-delay-100">Ingrese sus credenciales de acceso</p>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="p-2.5 bg-red-50 text-red-600 text-xs font-bold rounded border border-red-100 animate-slide-up animate-delay-100">
                {error}
              </div>
            )}

            {/* Campo CORREO */}
            <div className="animate-slide-up animate-delay-200">
              <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Correo Electronico</label>
              <input
                type="email"
                placeholder="ejemplo@ezlogistics.com"
                className={`w-full bg-transparent border-b py-1.5 text-sm text-slate-700 outline-none focus:border-blue-500 font-medium transition-colors placeholder:text-slate-300 ${errors.correo ? 'border-red-400' : 'border-slate-200'}`}
                value={correo}
                onChange={(e) => { setCorreo(e.target.value); validateField('correo', e.target.value); }}
              />
              {errors.correo && <p className="text-red-500 text-xs mt-1">{errors.correo}</p>}
            </div>

            {/* Campo CONTRASENA */}
            <div className="animate-slide-up animate-delay-300">
              <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Contrasena</label>
              <input
                type="password"
                placeholder="••••••••"
                className={`w-full bg-transparent border-b py-1.5 text-sm text-slate-700 outline-none focus:border-blue-500 font-medium transition-colors placeholder:text-slate-300 ${errors.password ? 'border-red-400' : 'border-slate-200'}`}
                value={password}
                onChange={(e) => { setPassword(e.target.value); validateField('password', e.target.value); }}
              />
              {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
            </div>

            {/* Checkbox + terminos */}
            <div className="flex items-center gap-2 animate-slide-up animate-delay-400">
              <input
                type="checkbox"
                id="terms"
                className="w-3.5 h-3.5 accent-blue-600 rounded"
                defaultChecked
              />
              <label htmlFor="terms" className="text-[10px] text-slate-500 font-medium">
                Acepto los terminos y condiciones del servicio
              </label>
            </div>

            {/* Boton + enlace */}
            <div className="flex items-center gap-4 pt-1 animate-slide-up animate-delay-500">
              <button
                type="submit"
                disabled={loading || Object.keys(errors).length > 0}
                className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:from-slate-300 disabled:to-slate-300 text-white text-xs font-bold py-2.5 px-8 rounded-full shadow-lg transition-all active:scale-95 uppercase tracking-widest flex items-center gap-2 animate-glow"
                style={{ boxShadow: '0 6px 18px rgba(37,99,235,0.25)' }}
              >
                {loading ? <Loader2 className="animate-spin" size={14} /> : 'Entrar'}
              </button>
              <span className="text-[10px] text-slate-400 font-medium">¿Eres miembro?</span>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;