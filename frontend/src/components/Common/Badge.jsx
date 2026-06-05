import React from 'react';
import { motion } from 'framer-motion';

const variants = {
  accent: 'bg-[rgba(200,200,208,0.15)] text-[#c8c8d0]',
  success: 'bg-[rgba(48,209,88,0.12)] text-[#30d158]',
  warning: 'bg-[rgba(255,214,10,0.12)] text-[#ffd60a]',
  error: 'bg-[rgba(255,69,58,0.12)] text-[#ff453a]',
  info: 'bg-[rgba(176,176,188,0.12)] text-[#b0b0bc]',
  neutral: 'bg-[rgba(255,255,255,0.06)] text-[rgba(255,255,255,0.55)]',
  premium: 'bg-gradient-to-r from-[rgba(176,176,188,0.2)] to-[rgba(200,200,208,0.2)] text-[#c0c0cc]',
};

const sizes = {
  xs: 'text-[10px] px-1.5 py-0.5',
  sm: 'text-[11px] px-2 py-0.5',
  md: 'text-[12px] px-2.5 py-1',
  lg: 'text-[13px] px-3 py-1.5',
};

export default function Badge({
  children,
  variant = 'neutral',
  size = 'sm',
  dot = false,
  pulse = false,
  removable = false,
  onRemove,
  className = '',
}) {
  return (
    <motion.span
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      whileHover={{ scale: 1.04 }}
      transition={{ type: 'spring', stiffness: 400, damping: 20 }}
      className={`inline-flex items-center gap-1.5 rounded-full font-semibold whitespace-nowrap select-none ${variants[variant]} ${sizes[size]} ${className}`}
    >
      {dot && (
        <motion.span
          animate={pulse ? { scale: [1, 1.2, 1], opacity: [1, 0.6, 1] } : {}}
          transition={pulse ? { duration: 2, repeat: Infinity, ease: 'easeInOut' } : {}}
          className={`w-1.5 h-1.5 rounded-full ${
            variant === 'accent' ? 'bg-[#c8c8d0]' :
            variant === 'success' ? 'bg-[#30d158]' :
            variant === 'warning' ? 'bg-[#ffd60a]' :
            variant === 'error' ? 'bg-[#ff453a]' :
            variant === 'info' ? 'bg-[#b0b0bc]' :
            variant === 'premium' ? 'bg-[#c0c0cc]' :
            'bg-[rgba(255,255,255,0.3)]'
          }`}
        />
      )}
      {children}
      {removable && (
        <motion.button
          onClick={onRemove}
          whileHover={{ scale: 1.15, backgroundColor: 'rgba(255,255,255,0.15)' }}
          whileTap={{ scale: 0.9 }}
          className="ml-0.5 rounded-full p-0.5 transition-colors"
        >
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <path d="M2 2L8 8M8 2L2 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </motion.button>
      )}
    </motion.span>
  );
}
