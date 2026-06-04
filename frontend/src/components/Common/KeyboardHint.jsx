import React from 'react';
import { motion } from 'framer-motion';

export default function KeyboardHint({ keys = [], className = '' }) {
  return (
    <motion.span
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`inline-flex items-center gap-0.5 ${className}`}
    >
      {keys.map((key, idx) => (
        <React.Fragment key={idx}>
          {idx > 0 && <span className="text-[rgba(255,255,255,0.2)] mx-0.5">+</span>}
          <motion.kbd
            whileHover={{ scale: 1.05, borderColor: 'rgba(255,255,255,0.15)' }}
            className="inline-flex items-center px-1.5 py-0.5 text-[10px] font-medium text-[rgba(255,255,255,0.35)] bg-[rgba(255,255,255,0.04)] rounded border border-[rgba(255,255,255,0.06)]"
          >
            {key}
          </motion.kbd>
        </React.Fragment>
      ))}
    </motion.span>
  );
}
