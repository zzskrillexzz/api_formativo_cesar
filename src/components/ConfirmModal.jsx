import React from 'react';
import { AlertTriangle, CheckCircle, X } from 'lucide-react';

export const ConfirmModal = ({ open, title, message, onConfirm, onCancel, confirmText = 'Confirmar', cancelText = 'Cancelar', danger = false }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative w-full max-w-sm animate-fade-in">
        <div className="relative bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
          {danger && (
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-500 via-rose-400 to-red-500" />
          )}
          <div className="p-6 text-center">
            <div className={`mx-auto w-14 h-14 rounded-full flex items-center justify-center mb-4 ${danger ? 'bg-red-50' : 'bg-blue-50'}`}>
              {danger
                ? <AlertTriangle size={32} className="text-red-500" />
                : <CheckCircle size={32} className="text-blue-500" />
              }
            </div>
            <h3 className="text-lg font-black text-slate-800 mb-1.5">{title}</h3>
            <p className="text-sm text-slate-500 leading-relaxed mb-6">{message}</p>
            <div className="flex justify-center gap-3">
              <button
                onClick={onCancel}
                className="px-5 py-2.5 bg-slate-100 text-slate-600 font-bold text-xs rounded-xl hover:bg-slate-200 hover:text-slate-800 transition-all uppercase tracking-wider"
              >
                {cancelText}
              </button>
              <button
                onClick={onConfirm}
                className={`px-5 py-2.5 text-white font-bold text-xs rounded-xl transition-all uppercase tracking-wider ${
                  danger
                    ? 'bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 shadow-lg shadow-red-500/25 hover:shadow-red-500/40'
                    : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40'
                }`}
              >
                {confirmText}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const PromptModal = ({ open, title, message, value, onChange, onConfirm, onCancel, placeholder = '', confirmText = 'Confirmar', cancelText = 'Cancelar' }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative w-full max-w-sm animate-fade-in">
        <div className="relative bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-500 via-rose-400 to-red-500" />
          <div className="p-6 text-center">
            <div className="mx-auto w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mb-4">
              <AlertTriangle size={32} className="text-red-500" />
            </div>
            <h3 className="text-lg font-black text-slate-800 mb-1.5">{title}</h3>
            <p className="text-sm text-slate-500 leading-relaxed mb-4">{message}</p>
            <textarea
              autoFocus
              rows="3"
              placeholder={placeholder}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-red-400 text-sm font-medium resize-none mb-4 text-center"
            />
            <div className="flex justify-center gap-3">
              <button
                onClick={onCancel}
                className="px-5 py-2.5 bg-slate-100 text-slate-600 font-bold text-xs rounded-xl hover:bg-slate-200 hover:text-slate-800 transition-all uppercase tracking-wider"
              >
                {cancelText}
              </button>
              <button
                onClick={onConfirm}
                disabled={!value.trim()}
                className="px-5 py-2.5 text-white font-bold text-xs rounded-xl transition-all uppercase tracking-wider bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 disabled:from-slate-300 disabled:to-slate-300 disabled:shadow-none shadow-lg shadow-red-500/25 hover:shadow-red-500/40"
              >
                {confirmText}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
