'use client';

import React from 'react';
import { useChat } from '../context/ChatContext';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast, settings } = useChat();

  if (toasts.length === 0) return null;

  const isRTL = settings.language === 'ar';

  return (
    <div 
      className={`fixed bottom-5 z-[9999] flex flex-col gap-2 max-w-sm w-full px-4 pointer-events-none ${
        isRTL ? 'left-0 md:left-5' : 'right-0 md:right-5'
      }`}
    >
      {toasts.map((toast) => {
        let Icon = Info;
        let borderClass = 'border-indigo-500/30 dark:border-indigo-500/20 bg-indigo-50/50 dark:bg-indigo-950/10 text-indigo-600 dark:text-indigo-400';
        
        if (toast.type === 'success') {
          Icon = CheckCircle;
          borderClass = 'border-emerald-500/30 dark:border-emerald-500/20 bg-emerald-50/50 dark:bg-emerald-950/10 text-emerald-600 dark:text-emerald-400';
        } else if (toast.type === 'error') {
          Icon = AlertCircle;
          borderClass = 'border-red-500/30 dark:border-red-500/20 bg-red-50/50 dark:bg-red-950/10 text-red-600 dark:text-red-400';
        }

        return (
          <div 
            key={toast.id} 
            className={`pointer-events-auto flex items-center justify-between gap-3 px-4 py-3 bg-white dark:bg-[#1e1e1e] border rounded-2xl shadow-xl transition-all duration-300 text-sm ${borderClass}`}
            style={{ animation: 'slideIn 0.25s cubic-bezier(0.16, 1, 0.3, 1)' }}
          >
            <div className="flex items-center gap-2.5 flex-1 min-w-0">
              <Icon size={16} className="flex-shrink-0" />
              <span className="text-neutral-800 dark:text-neutral-200 truncate font-medium">
                {toast.message}
              </span>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="p-1 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg text-neutral-400 hover:text-neutral-600 dark:hover:text-white transition-colors flex-shrink-0"
              title="Fermer"
            >
              <X size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
};
export default ToastContainer;
