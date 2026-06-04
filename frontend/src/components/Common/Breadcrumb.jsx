import React from 'react';
import { motion } from 'framer-motion';
import { ChevronRight, Code2 } from 'lucide-react';

export default function Breadcrumb({ items = [], className = '' }) {
  return (
    <motion.nav
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
      className={`flex items-center gap-1.5 text-sm select-none ${className}`}
    >
      {items.map((item, idx) => {
        const isLast = idx === items.length - 1;
        const Icon = item.icon || (idx === 0 ? Code2 : null);
        return (
          <motion.div
            key={idx}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.05, duration: 0.2 }}
            className="flex items-center gap-1.5"
          >
            {idx > 0 && (
              <motion.div
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.05 + 0.05, duration: 0.15 }}
              >
                <ChevronRight size={12} className="text-[rgba(255,255,255,0.2)] flex-shrink-0" />
              </motion.div>
            )}
            {item.href ? (
              <motion.a
                href={item.href}
                whileHover={{ backgroundColor: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.8)' }}
                whileTap={{ scale: 0.97 }}
                className={`flex items-center gap-1.5 px-2 py-1 rounded-lg transition-colors ${
                  isLast
                    ? 'text-[#f5f5f7] font-semibold'
                    : 'text-[rgba(255,255,255,0.4)]'
                }`}
              >
                {Icon && <Icon size={14} className={isLast ? 'text-[#d4bc80]' : ''} />}
                {item.label}
              </motion.a>
            ) : (
              <span
                className={`flex items-center gap-1.5 px-2 py-1 ${
                  isLast ? 'text-[#f5f5f7] font-semibold' : 'text-[rgba(255,255,255,0.4)]'
                }`}
              >
                {Icon && <Icon size={14} className={isLast ? 'text-[#d4bc80]' : ''} />}
                {item.label}
              </span>
            )}
          </motion.div>
        );
      })}
    </motion.nav>
  );
}
