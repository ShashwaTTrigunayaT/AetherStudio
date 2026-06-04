import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';

export default function Dropdown({
  trigger,
  children,
  align = 'left',
  width = 'auto',
  className = '',
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const alignClasses = {
    left: 'left-0',
    right: 'right-0',
    center: 'left-1/2 -translate-x-1/2',
  };

  return (
    <div ref={dropdownRef} className={`relative inline-block ${className}`}>
      <div onClick={() => setIsOpen(!isOpen)} className="cursor-pointer">
        {trigger || (
          <button className="btn-ghost gap-1">
            Options
            <ChevronDown size={14} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          </button>
        )}
      </div>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.94 }}
            transition={{ duration: 0.12, ease: [0.25, 0.1, 0.25, 1] }}
            className={`absolute top-full mt-1 z-50 min-w-[160px] ${alignClasses[align]} ${
              width !== 'auto' ? width : ''
            }`}
            onClick={() => setIsOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.03, duration: 0.1 }}
              className="glass-card-strong p-1.5 shadow-xl shadow-[rgba(0,0,0,0.5)]"
            >
              {children}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function DropdownItem({ icon: Icon, children, onClick, danger = false, disabled = false, divider = false }) {
  return (
    <>
      {divider && <div className="my-1 mx-2 h-px bg-[rgba(255,255,255,0.06)]" />}
      <motion.button
        onClick={onClick}
        disabled={disabled}
        whileHover={!disabled ? { x: 2, transition: { duration: 0.15 } } : {}}
        whileTap={!disabled ? { scale: 0.98 } : {}}
        className={`w-full flex items-center gap-2.5 px-3 py-2 text-[13px] rounded-lg transition-colors ${
          danger
            ? 'text-[#ff453a] hover:bg-[rgba(255,69,58,0.1)]'
            : 'text-[rgba(255,255,255,0.7)] hover:bg-[rgba(255,255,255,0.05)] hover:text-[#f5f5f7]'
        } ${disabled ? 'opacity-40 cursor-not-allowed' : ''}`}
      >
        {Icon && <Icon size={15} />}
        {children}
      </motion.button>
    </>
  );
}
