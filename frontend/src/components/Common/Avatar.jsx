import React from 'react';
import { motion } from 'framer-motion';

const colors = [
  'from-[#b89450] to-[#d4bc80]',
  'from-[#a07840] to-[#c0a078]',
  'from-[#ff453a] to-[#ff6961]',
  'from-[#30d158] to-[#63e6a0]',
  'from-[#ffd60a] to-[#ffe066]',
  'from-[#ff9f0a] to-[#ffb340]',
  'from-[#bf5af2] to-[#da8fff]',
  'from-[#ff375f] to-[#ff6783]',
];

function hashCode(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash);
}

export default function Avatar({ name, email, src, size = 'md', status, className = '', neonPulse = false }) {
  const sizes = {
    xs: 'w-6 h-6 text-[9px]',
    sm: 'w-8 h-8 text-[11px]',
    md: 'w-10 h-10 text-[14px]',
    lg: 'w-12 h-12 text-[16px]',
    xl: 'w-16 h-16 text-[22px]',
    xxl: 'w-20 h-20 text-[28px]',
  };

  const statusSizes = {
    xs: 'w-2 h-2 right-0 bottom-0',
    sm: 'w-2.5 h-2.5 right-0 bottom-0',
    md: 'w-3 h-3 -right-0.5 -bottom-0.5',
    lg: 'w-3.5 h-3.5 -right-0.5 -bottom-0.5',
    xl: 'w-4 h-4 -right-0.5 -bottom-0.5',
    xxl: 'w-5 h-5 -right-0.5 -bottom-0.5',
  };

  const statusColors = {
    online: 'bg-[#30d158] shadow-[0_0_8px_rgba(48,209,88,0.5)]',
    idle: 'bg-[#ffd60a] shadow-[0_0_8px_rgba(255,214,10,0.5)]',
    offline: 'bg-[rgba(255,255,255,0.2)]',
    busy: 'bg-[#ff453a] shadow-[0_0_8px_rgba(255,69,58,0.5)]',
  };

  const identifier = name || email || '?';
  const colorIndex = hashCode(identifier) % colors.length;

  if (src) {
    return (
      <div className={`relative inline-flex flex-shrink-0 ${className}`}>
        <img
          src={src}
          alt={identifier}
          className={`${sizes[size]} rounded-full object-cover border-2 border-[rgba(255,255,255,0.08)]`}
        />
        {status && (
          <span className={`absolute ${statusSizes[size]} rounded-full border-2 border-[#000000] ${statusColors[status]}`} />
        )}
        {/* Premium neon pulsing ring around avatar */}
        {neonPulse && (
          <span
            className={`absolute -inset-0.5 rounded-full animate-pulse`}
            style={{
              background: 'transparent',
              border: '2px solid rgba(0,240,255,0.3)',
              boxShadow: '0 0 12px rgba(0,240,255,0.4), 0 0 24px rgba(0,240,255,0.15)',
            }}
          />
        )}
      </div>
    );
  }

  return (
    <motion.div
      whileHover={{ scale: 1.08 }}
      whileTap={{ scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 400, damping: 15 }}
      className={`relative inline-flex flex-shrink-0 ${className}`}
    >
      {/* Premium neon pulsing ring */}
      {neonPulse && (
        <motion.span
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className={`absolute -inset-0.5 rounded-full pointer-events-none`}
          style={{
            border: '2px solid rgba(0,240,255,0.3)',
            boxShadow: '0 0 12px rgba(0,240,255,0.4), 0 0 24px rgba(0,240,255,0.15)',
            animation: 'neonPulse 2s ease-in-out infinite',
          }}
        />
      )}

      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        className={`${sizes[size]} rounded-full bg-gradient-to-br ${colors[colorIndex]} flex items-center justify-center font-bold text-white border-2 border-[rgba(255,255,255,0.08)] select-none`}
        style={neonPulse ? {
          ring: '2px solid rgba(0,240,255,0.5)',
          ringOffset: '2px',
          ringColor: 'rgba(0,0,0)',
        } : {}}
      >
        {identifier.charAt(0).toUpperCase()}
      </motion.div>
      {status && (
        <motion.span
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.15, type: 'spring', stiffness: 500 }}
          className={`absolute ${statusSizes[size]} rounded-full border-2 border-[#000000] ${statusColors[status]}`}
        />
      )}
    </motion.div>
  );
}
