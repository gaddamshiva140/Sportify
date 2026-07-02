import React, { createContext, useContext, useState } from 'react';

const ToastContext = createContext();

export function ToastProvider({ children }) {
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    // Dismiss after 3 seconds
    setTimeout(() => {
      setToast(null);
    }, 3000);
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toast && (
        <div className="fixed bottom-6 right-6 z-[100] animate-scale-in flex items-center gap-3 px-5 py-3.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 border border-slate-850 dark:border-slate-100 rounded-2xl shadow-2xl text-xs font-bold transition-all duration-300">
          <span className="text-base shrink-0">
            {toast.type === 'success' ? '🟢' : toast.type === 'error' ? '🔴' : '🔵'}
          </span>
          <span className="leading-tight">{toast.message}</span>
        </div>
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
