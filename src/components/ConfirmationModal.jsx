import React from 'react';
import { AlertTriangle, Trash2, Unlink, HelpCircle, Check, X, ShieldAlert } from 'lucide-react';

export default function ConfirmationModal({
  isOpen,
  title = 'Are you sure?',
  message = 'Please confirm this action.',
  subMessage,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  type = 'warning', // 'danger' | 'warning' | 'info' | 'unlink'
  onConfirm,
  onCancel,
}) {
  if (!isOpen) return null;

  const getTypeStyles = () => {
    switch (type) {
      case 'danger':
        return {
          icon: <Trash2 className="w-5 h-5 text-rose-400" />,
          glow: 'bg-rose-500/15',
          border: 'border-rose-500/30',
          badgeBg: 'bg-rose-500/10 text-rose-300 border-rose-500/25',
          confirmBtn: 'bg-gradient-to-r from-rose-600 to-red-500 hover:from-rose-500 hover:to-red-400 text-white shadow-lg shadow-rose-600/30 border-rose-400/40',
        };
      case 'unlink':
        return {
          icon: <Unlink className="w-5 h-5 text-sky-400" />,
          glow: 'bg-sky-500/15',
          border: 'border-sky-500/30',
          badgeBg: 'bg-sky-500/10 text-sky-300 border-sky-500/25',
          confirmBtn: 'bg-gradient-to-r from-sky-600 to-blue-500 hover:from-sky-500 hover:to-blue-400 text-white shadow-lg shadow-sky-600/30 border-sky-400/40',
        };
      case 'info':
        return {
          icon: <HelpCircle className="w-5 h-5 text-indigo-400" />,
          glow: 'bg-indigo-500/15',
          border: 'border-indigo-500/30',
          badgeBg: 'bg-indigo-500/10 text-indigo-300 border-indigo-500/25',
          confirmBtn: 'bg-gradient-to-r from-indigo-600 to-blue-500 hover:from-indigo-500 hover:to-blue-400 text-white shadow-lg shadow-indigo-600/30 border-indigo-400/40',
        };
      case 'warning':
      default:
        return {
          icon: <AlertTriangle className="w-5 h-5 text-amber-400" />,
          glow: 'bg-amber-500/15',
          border: 'border-amber-500/30',
          badgeBg: 'bg-amber-500/10 text-amber-300 border-amber-500/25',
          confirmBtn: 'bg-gradient-to-r from-amber-600 to-orange-500 hover:from-amber-500 hover:to-orange-400 text-white shadow-lg shadow-amber-600/30 border-amber-400/40',
        };
    }
  };

  const styles = getTypeStyles();

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in"
      onClick={onCancel}
    >
      <div 
        className={`glass-modal w-full max-w-md rounded-2xl overflow-hidden shadow-2xl border ${styles.border} animate-modal-pop relative`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Ambient Top Glow */}
        <div className={`absolute -top-16 left-1/2 -translate-x-1/2 w-48 h-24 ${styles.glow} rounded-full blur-2xl pointer-events-none`} />

        <div className="p-5 relative z-10 space-y-4">
          {/* Header with Icon Badge */}
          <div className="flex items-start space-x-3.5">
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 border ${styles.badgeBg} shadow-inner`}>
              {styles.icon}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-bold text-white tracking-tight">{title}</h3>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">{message}</p>
              {subMessage && (
                <p className="text-[11px] text-slate-400 mt-1.5 flex items-center space-x-1.5">
                  <ShieldAlert className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>{subMessage}</span>
                </p>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end space-x-2.5 pt-2 border-t border-white/[0.08]">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 transition-all active:scale-95 glass-btn"
            >
              {cancelText}
            </button>
            <button
              type="button"
              onClick={() => {
                onConfirm();
              }}
              className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all active:scale-95 flex items-center space-x-1.5 ${styles.confirmBtn}`}
            >
              <span>{confirmText}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
