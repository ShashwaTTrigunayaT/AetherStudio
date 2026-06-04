import React from 'react';
import { motion } from 'framer-motion';

/**
 * FloatingCursorBadge — A premium animated name tag that appears above a user's
 * collaborative cursor in the editor. Uses framer-motion for silky entrance/exit.
 */
export default function FloatingCursorBadge({ name, color = '#b89450', visible = true }) {
  if (!visible) return null;

  return (
    <motion.div
      initial={{ y: -5, opacity: 0, scale: 0.95 }}
      animate={{ y: 0, opacity: 1, scale: 1 }}
      exit={{ y: -5, opacity: 0, scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      className="absolute -top-6 left-1/2 -translate-x-1/2 whitespace-nowrap z-50 pointer-events-none"
    >
      <div
        className="px-2 py-0.5 rounded-md text-[10px] font-semibold text-white tracking-wide"
        style={{
          background: `linear-gradient(135deg, ${color}, ${color}dd)`,
          boxShadow: `0 0 12px ${color}88, 0 0 24px ${color}44, 0 4px 12px rgba(0,0,0,0.4)`,
          border: `1px solid ${color}44`,
        }}
      >
        {name || 'Anonymous'}
      </div>
      {/* Tiny arrow pointing down */}
      <div
        className="mx-auto w-2 h-2 -mb-0.5 rotate-45"
        style={{
          background: color,
          boxShadow: `0 0 6px ${color}88`,
        }}
      />
    </motion.div>
  );
}
