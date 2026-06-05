import React from 'react';
import { motion } from 'framer-motion';

export default function ProgressBar({ value = 0, max = 100, size = 'md', variant = 'accent', showLabel = false, className = '' }) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);
  
  const sizes = {
    xs: 'h-1',
    sm: 'h-1.5',
    md: 'h-2',
    lg: 'h-2.5',
    xl: 'h-3',
  };

  const colors = {
    accent: 'bg-gradient-to-r from-[#c8c8d0] to-[#dedee4]',
    success: 'bg-gradient-to-r from-[#30d158] to-[#63e6a0]',
    warning: 'bg-gradient-to-r from-[#ffd60a] to-[#ffe066]',
    error: 'bg-gradient-to-r from-[#ff453a] to-[#ff6961]',
    info: 'bg-gradient-to-r from-[#b0b0bc] to-[#c0c0cc]',
  };

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className={`flex-1 bg-[rgba(255,255,255,0.06)] rounded-full overflow-hidden ${sizes[size]}`}>
        <motion.div
          className={`${sizes[size]} ${colors[variant]} rounded-full`}
          initial={{ width: '0%' }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1] }}
        >
          {/* Shimmer overlay */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
            animate={{ x: ['-100%', '200%'] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          />
        </motion.div>
      </div>
      {showLabel && (
        <motion.span
          initial={{ opacity: 0, x: -5 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, delay: 0.3 }}
          className="text-[11px] font-medium text-[rgba(255,255,255,0.4)] tabular-nums flex-shrink-0"
        >
          {Math.round(percentage)}%
        </motion.span>
      )}
    </div>
  );
}
