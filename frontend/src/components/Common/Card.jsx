import React from 'react';
import { motion } from 'framer-motion';

export default function Card({
  children,
  className = '',
  hover = true,
  padding = true,
  onClick,
  as: Component = 'div',
}) {
  return (
    <motion.div
      onClick={onClick}
      whileHover={hover ? {
        y: -3,
        boxShadow: '0 8px 30px rgba(0, 113, 227, 0.1)',
        borderColor: 'rgba(0, 113, 227, 0.2)',
        transition: { duration: 0.2, ease: [0.25, 0.1, 0.25, 1] },
      } : {}}
      whileTap={onClick ? { scale: 0.98, y: -1 } : {}}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      className={`glass-card ${
        padding ? 'p-5' : ''
      } ${
        onClick ? 'cursor-pointer group text-left' : ''
      } ${className}`}
    >
      {children}
    </motion.div>
  );
}
