import React from 'react';
import { motion } from 'framer-motion';

const variants = {
  primary: 'btn-apple',
  secondary: 'btn-apple-secondary',
  ghost: 'btn-ghost',
  danger: 'btn-apple bg-[#ff453a] hover:bg-[#ff6961] active:bg-[#d63a30]',
  success: 'btn-apple bg-[#30d158] hover:bg-[#63e6a0] active:bg-[#26a848] text-black',
};

const sizes = {
  xs: 'text-[11px] px-2 py-1 rounded-lg gap-1',
  sm: 'text-[12px] px-3 py-1.5 rounded-[8px] gap-1.5',
  md: 'text-[14px] px-4 py-2 rounded-[10px] gap-2',
  lg: 'text-[15px] px-5 py-2.5 rounded-[10px] gap-2',
  xl: 'text-[16px] px-6 py-3 rounded-[12px] gap-2.5',
};

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  icon: Icon,
  iconPosition = 'left',
  loading = false,
  disabled = false,
  className = '',
  onClick,
  ...props
}) {
  return (
    <motion.button
      whileHover={!disabled && !loading ? { scale: 1.02, y: -1 } : {}}
      whileTap={!disabled && !loading ? { scale: 0.97, y: 0 } : {}}
      transition={{ type: 'spring', stiffness: 500, damping: 20 }}
      disabled={disabled || loading}
      onClick={onClick}
      className={`inline-flex items-center justify-center font-semibold select-none outline-none ${
        disabled || loading
          ? 'opacity-40 cursor-not-allowed !transform-none !shadow-none'
          : 'transition-shadow duration-150'
      } ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {loading ? (
        <motion.span
          className="flex items-center gap-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <motion.svg
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            width={size === 'xs' ? 12 : size === 'sm' ? 14 : 16}
            height={size === 'xs' ? 12 : size === 'sm' ? 14 : 16}
            viewBox="0 0 24 24"
            fill="none"
          >
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.25" />
            <path d="M12 2C6.477 2 2 6.477 2 12" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
          </motion.svg>
          {children}
        </motion.span>
      ) : (
        <motion.span
          className="flex items-center gap-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          {Icon && iconPosition === 'left' && (
            <Icon size={size === 'xs' ? 13 : size === 'sm' ? 14 : 16} />
          )}
          {children}
          {Icon && iconPosition === 'right' && (
            <Icon size={size === 'xs' ? 13 : size === 'sm' ? 14 : 16} />
          )}
        </motion.span>
      )}
      {/* Ripple on click */}
      <motion.span
        className="absolute inset-0 rounded-[inherit] bg-white/10"
        initial={{ scale: 0, opacity: 0 }}
        whileTap={{ scale: 2, opacity: [0.3, 0] }}
        transition={{ duration: 0.5 }}
        style={{ pointerEvents: 'none' }}
      />
    </motion.button>
  );
}
