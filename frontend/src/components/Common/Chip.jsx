import React from 'react';
import { X } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Chip({ children, onRemove, size = 'md', variant = 'neutral', className = '' }) {
  const sizes = {
    sm: 'text-[11px] px-2 py-0.5 gap-1',
    md: 'text-[12px] px-2.5 py-1 gap-1.5',
    lg: 'text-[13px] px-3 py-1.5 gap-2',
  };

  const variants = {
    neutral: 'bg-[rgba(255,255,255,0.06)] text-[rgba(255,255,255,0.6)] hover:bg-[rgba(255,255,255,0.09)]',
    accent: 'bg-[rgba(200,200,208,0.12)] text-[#dedee4] hover:bg-[rgba(200,200,208,0.18)]',
    success: 'bg-[rgba(48,209,88,0.1)] text-[#30d158] hover:bg-[rgba(48,209,88,0.15)]',
    warning: 'bg-[rgba(255,214,10,0.1)] text-[#ffd60a] hover:bg-[rgba(255,214,10,0.15)]',
    error: 'bg-[rgba(255,69,58,0.1)] text-[#ff453a] hover:bg-[rgba(255,69,58,0.15)]',
  };

  return (
    <motion.span
      initial={{ opacity: 0, scale: 0.85 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.85 }}
      whileHover={{ scale: 1.04 }}
      transition={{ type: 'spring', stiffness: 400, damping: 20 }}
      className={`inline-flex items-center rounded-lg font-medium ${sizes[size]} ${variants[variant]} ${className}`}
    >
      {children}
      {onRemove && (
        <motion.button
          onClick={onRemove}
          whileHover={{ scale: 1.15, backgroundColor: 'rgba(255,255,255,0.15)' }}
          whileTap={{ scale: 0.9 }}
          className="p-0.5 rounded"
        >
          <X size={size === 'sm' ? 10 : 12} />
        </motion.button>
      )}
    </motion.span>
  );
}
