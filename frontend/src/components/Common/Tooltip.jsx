import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Tooltip({ children, content, position = 'top', delay = 0.3, className = '' }) {
  const [isVisible, setIsVisible] = useState(false);
  let timeout;

  const positions = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  };

  const arrows = {
    top: 'top-full left-1/2 -translate-x-1/2 border-l-[5px] border-r-[5px] border-t-[5px] border-l-transparent border-r-transparent border-t-[rgba(30,30,32,0.95)]',
    bottom: 'bottom-full left-1/2 -translate-x-1/2 border-l-[5px] border-r-[5px] border-b-[5px] border-l-transparent border-r-transparent border-b-[rgba(30,30,32,0.95)]',
    left: 'left-full top-1/2 -translate-y-1/2 border-t-[5px] border-b-[5px] border-l-[5px] border-t-transparent border-b-transparent border-l-[rgba(30,30,32,0.95)]',
    right: 'right-full top-1/2 -translate-y-1/2 border-t-[5px] border-b-[5px] border-r-[5px] border-t-transparent border-b-transparent border-r-[rgba(30,30,32,0.95)]',
  };

  const handleMouseEnter = () => {
    timeout = setTimeout(() => setIsVisible(true), delay * 1000);
  };

  const handleMouseLeave = () => {
    clearTimeout(timeout);
    setIsVisible(false);
  };

  return (
    <div
      className={`relative inline-flex ${className}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0, scale: 0.85, y: position === 'top' ? 4 : position === 'bottom' ? -4 : 0, x: position === 'left' ? 4 : position === 'right' ? -4 : 0 }}
            animate={{ opacity: 1, scale: 1, y: 0, x: 0 }}
            exit={{ opacity: 0, scale: 0.85, y: position === 'top' ? 4 : position === 'bottom' ? -4 : 0, x: position === 'left' ? 4 : position === 'right' ? -4 : 0 }}
            transition={{ duration: 0.12, ease: [0.25, 0.1, 0.25, 1] }}
            className={`absolute z-[100] pointer-events-none ${positions[position]}`}
          >
            <div className="bg-[rgba(30,30,32,0.95)] backdrop-blur-xl border border-[rgba(255,255,255,0.08)] rounded-lg px-2.5 py-1.5 shadow-lg whitespace-nowrap">
              <p className="text-[11px] text-[rgba(255,255,255,0.7)]">{content}</p>
            </div>
            <div className={`absolute w-0 h-0 ${arrows[position]}`} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
