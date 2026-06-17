import { createContext, useContext, useCallback } from 'react';

/* ── SVG strings for each icon type (inline, no React dependency) ── */
const ICON_SVG = {
  success: '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>',
  error:   '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>',
  warning: '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
  info:    '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>',
};

const STYLES = {
  success: { bg: 'bg-emerald-600', border: 'border-l-emerald-500' },
  error:   { bg: 'bg-red-600',     border: 'border-l-red-500' },
  warning: { bg: 'bg-amber-600',   border: 'border-l-amber-500' },
  info:    { bg: 'bg-blue-600',     border: 'border-l-blue-500' },
};

/* ── Module-level state (fully independent from React rendering) ── */
let toastId = 0;
let containerEl = null;
let activeToasts = [];

const ensureContainer = () => {
  if (!containerEl || !document.body.contains(containerEl)) {
    containerEl = document.createElement('div');
    containerEl.id = 'toast-container';
    containerEl.className = 'fixed top-6 left-1/2 -translate-x-1/2 z-[9999] flex flex-col gap-3 w-[420px] max-w-[calc(100vw-2rem)] pointer-events-none';
    document.body.appendChild(containerEl);
  }
};

const dismissToast = (id) => {
  const idx = activeToasts.findIndex(t => t.id === id);
  if (idx === -1) return;
  activeToasts[idx] = { ...activeToasts[idx], exiting: true };
  renderToasts();
  setTimeout(() => {
    activeToasts = activeToasts.filter(t => t.id !== id);
    renderToasts();
  }, 260);
};

const renderToasts = () => {
  if (!containerEl) return;
  containerEl.innerHTML = '';
  activeToasts.forEach((t) => {
    const { bg, border } = STYLES[t.type] || STYLES.info;
    const iconSvg = ICON_SVG[t.type] || ICON_SVG.info;
    const div = document.createElement('div');
    div.className = `pointer-events-auto relative overflow-hidden bg-white rounded-xl shadow-[0_10px_50px_rgba(0,0,0,0.35)] ring-1 ring-black/5 border-l-4 ${border} ${t.exiting ? 'toast-exit' : 'toast-enter'}`;
    div.innerHTML = `
      <div style="display:flex;align-items:flex-start;gap:12px;padding:16px">
        <div style="flex-shrink:0" class="${bg} rounded-lg p-1.5 text-white">${iconSvg}</div>
        <div style="flex:1;min-width:0">
          ${t.title ? `<p style="font-size:14px;font-weight:700;color:#1e293b;margin:0">${t.title}</p>` : ''}
          ${t.description ? `<p style="font-size:12px;color:#64748b;margin:2px 0 0 0">${t.description}</p>` : ''}
        </div>
        <button style="flex-shrink:0;padding:4px;color:#94a3b8;background:none;border:none;cursor:pointer;border-radius:6px" class="toast-dismiss-btn" onmouseover="this.style.color='#475569'" onmouseout="this.style.color='#94a3b8'">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>
      <div class="h-0.5 bg-slate-100" style="width:100%">
        <div class="h-full ${bg}" style="opacity:0.6;border-radius:9999px;animation:toastProgress ${t.duration}ms linear forwards"></div>
      </div>
    `;
    const btn = div.querySelector('.toast-dismiss-btn');
    if (btn) btn.addEventListener('click', () => dismissToast(t.id));
    containerEl.appendChild(div);
  });
};

/* ── React context ── */
const ToastContext = createContext(null);

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
};

export const ToastProvider = ({ children }) => {
  const toast = useCallback(({ type = 'info', title, description, duration = 4000 }) => {
    ensureContainer();
    const id = ++toastId;
    activeToasts = [...activeToasts, { id, type, title, description, duration, exiting: false }];
    renderToasts();
    if (duration > 0) {
      setTimeout(() => {
        if (activeToasts.some(t => t.id === id && !t.exiting)) {
          dismissToast(id);
        }
      }, duration);
    }
    return id;
  }, []);

  const dismiss = useCallback((id) => dismissToast(id), []);

  return (
    <ToastContext.Provider value={{ toast, dismiss }}>
      {children}
    </ToastContext.Provider>
  );
};
