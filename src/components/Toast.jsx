import { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';

const icons = {
  success: { icon: CheckCircle, bg: 'bg-emerald-600', border: 'border-l-emerald-500' },
  error:   { icon: XCircle,      bg: 'bg-red-600',     border: 'border-l-red-500' },
  warning: { icon: AlertTriangle, bg: 'bg-amber-600',   border: 'border-l-amber-500' },
  info:    { icon: Info,          bg: 'bg-blue-600',     border: 'border-l-blue-500' },
};

let toastId = 0;

const ToastContext = createContext(null);

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
};

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);
  const timers = useRef({});

  const remove = useCallback((id) => {
    setToasts((prev) => prev.map((t) => (t.id === id ? { ...t, exiting: true } : t)));
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
      delete timers.current[id];
    }, 250);
  }, []);

  const toast = useCallback(({ type = 'info', title, description, duration = 4000 }) => {
    const id = ++toastId;
    setToasts((prev) => [...prev, { id, type, title, description, duration, exiting: false }]);
    if (duration > 0) {
      timers.current[id] = setTimeout(() => remove(id), duration);
    }
    return id;
  }, [remove]);

  const dismiss = useCallback((id) => remove(id), [remove]);

  useEffect(() => {
    return () => { Object.values(timers.current).forEach(clearTimeout); };
  }, []);

  return (
    <ToastContext.Provider value={{ toast, dismiss }}>
      {children}
      <div className="fixed bottom-6 right-6 z-[100] flex flex-col-reverse gap-3 max-w-sm w-full pointer-events-none">
        {toasts.map((t) => {
          const { icon: Icon, bg, border } = icons[t.type] || icons.info;
          return (
            <div
              key={t.id}
              className={`pointer-events-auto relative overflow-hidden bg-white rounded-xl shadow-2xl border border-slate-200 border-l-4 ${border} ${t.exiting ? 'toast-exit' : 'toast-enter'}`}
            >
              <div className="flex items-start gap-3 p-4">
                <div className={`shrink-0 ${bg} rounded-lg p-1.5 text-white`}>
                  <Icon size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  {t.title && <p className="text-sm font-bold text-slate-800">{t.title}</p>}
                  {t.description && <p className="text-xs text-slate-500 mt-0.5">{t.description}</p>}
                </div>
                <button onClick={() => dismiss(t.id)} className="shrink-0 p-1 text-slate-400 hover:text-slate-600 transition-colors">
                  <X size={14} />
                </button>
              </div>
              <div className="h-0.5 bg-slate-100 w-full">
                <div
                  className={`h-full ${bg} opacity-60 rounded-full`}
                  style={{ animation: `toastProgress ${t.duration}ms linear forwards` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};
