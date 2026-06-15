import React from 'react';

export const ConfirmModal = ({ open, title, message, onConfirm, onCancel, confirmText = 'Confirmar', cancelText = 'Cancelar', danger = false }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onCancel} />
      <div className="relative bg-white rounded-lg shadow-2xl border border-slate-100 w-full max-w-sm p-6 animate-fade-in">
        <h3 className="text-base font-bold text-slate-800 mb-2">{title}</h3>
        <p className="text-sm text-slate-600 mb-6">{message}</p>
        <div className="flex justify-end gap-3">
          <button onClick={onCancel} className="px-4 py-2 bg-slate-100 text-slate-600 font-bold text-xs rounded-lg hover:bg-slate-200 transition-all uppercase tracking-wider">
            {cancelText}
          </button>
          <button onClick={onConfirm} className={`px-4 py-2 text-white font-bold text-xs rounded-lg transition-all uppercase tracking-wider ${
            danger ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'
          }`}>
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export const PromptModal = ({ open, title, message, value, onChange, onConfirm, onCancel, placeholder = '', confirmText = 'Confirmar', cancelText = 'Cancelar' }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onCancel} />
      <div className="relative bg-white rounded-lg shadow-2xl border border-slate-100 w-full max-w-sm p-6 animate-fade-in">
        <h3 className="text-base font-bold text-slate-800 mb-2">{title}</h3>
        <p className="text-sm text-slate-600 mb-4">{message}</p>
        <textarea
          autoFocus
          rows="3"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium resize-none mb-4"
        />
        <div className="flex justify-end gap-3">
          <button onClick={onCancel} className="px-4 py-2 bg-slate-100 text-slate-600 font-bold text-xs rounded-lg hover:bg-slate-200 transition-all uppercase tracking-wider">{cancelText}</button>
          <button onClick={onConfirm} disabled={!value.trim()} className="px-4 py-2 bg-red-600 text-white font-bold text-xs rounded-lg hover:bg-red-700 disabled:bg-slate-300 transition-all uppercase tracking-wider">{confirmText}</button>
        </div>
      </div>
    </div>
  );
};
