import React from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';

export default function Toast({ message, type = 'info', onClose }) {
  const typeStyles = {
    success: 'border-[rgba(48,209,88,0.3)] bg-[rgba(48,209,88,0.08)]',
    error: 'border-[rgba(255,69,58,0.3)] bg-[rgba(255,69,58,0.08)]',
    warning: 'border-[rgba(255,214,10,0.3)] bg-[rgba(255,214,10,0.08)]',
    info: 'border-[rgba(184,148,80,0.3)] bg-[rgba(184,148,80,0.08)]',
  };

  const icons = {
    success: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#30d158" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
      </svg>
    ),
    error: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ff453a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" />
      </svg>
    ),
    warning: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ffd60a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
    ),
    info: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#b89450" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" />
      </svg>
    ),
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -12, scale: 0.92 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, x: 20, scale: 0.92 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      layout
      className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${typeStyles[type]} backdrop-blur-xl shadow-lg`}
    >
      <motion.span
        initial={{ rotate: -20, scale: 0 }}
        animate={{ rotate: 0, scale: 1 }}
        transition={{ delay: 0.1, type: 'spring', stiffness: 300 }}
        className="flex-shrink-0"
      >
        {icons[type]}
      </motion.span>
      <motion.p
        initial={{ opacity: 0, x: -5 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.1, duration: 0.2 }}
        className="text-[13px] text-[rgba(255,255,255,0.8)] flex-1"
      >
        {message}
      </motion.p>
      {onClose && (
        <motion.button
          onClick={onClose}
          whileHover={{ scale: 1.1, backgroundColor: 'rgba(255,255,255,0.1)' }}
          whileTap={{ scale: 0.9 }}
          className="btn-ghost p-1 flex-shrink-0"
        >
          <X size={14} />
        </motion.button>
      )}
    </motion.div>
  );
}

export function ToastContainer({ toasts = [], position = 'top-right' }) {
  const positionClasses = {
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
    'top-center': 'top-4 left-1/2 -translate-x-1/2',
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'bottom-center': 'bottom-4 left-1/2 -translate-x-1/2',
  };

  return (
    <div className={`fixed z-[200] flex flex-col gap-2 ${positionClasses[position]}`}>
      {toasts.map((toast) => (
        <Toast key={toast.id} {...toast} />
      ))}
    </div>
  );
}
