import React, { useState, useRef, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function SearchBar({
  value,
  onChange,
  onSearch,
  placeholder = 'Search...',
  results = [],
  onResultClick,
  loading = false,
  className = '',
  autoFocus = false,
}) {
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <motion.div
      className={`relative ${className}`}
      initial={{ opacity: 0, y: -5 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <motion.div
        animate={isFocused ? {
          borderColor: 'rgba(0, 113, 227, 0.4)',
          backgroundColor: 'rgba(0, 113, 227, 0.04)',
          boxShadow: '0 0 20px rgba(0, 113, 227, 0.06)',
        } : {
          borderColor: 'rgba(255, 255, 255, 0.06)',
          backgroundColor: 'rgba(255, 255, 255, 0.04)',
          boxShadow: '0 0 0px rgba(0, 113, 227, 0)',
        }}
        transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
        className="flex items-center gap-2 px-3 py-2 rounded-xl border"
      >
        <motion.div
          animate={isFocused ? { color: 'rgba(64, 169, 255, 0.6)' } : { color: 'rgba(255, 255, 255, 0.3)' }}
          transition={{ duration: 0.2 }}
        >
          <Search size={14} className="flex-shrink-0" />
        </motion.div>
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setTimeout(() => setIsFocused(false), 200)}
          onKeyDown={(e) => e.key === 'Enter' && onSearch?.(value)}
          placeholder={placeholder}
          className="flex-1 bg-transparent text-[13px] text-[#f5f5f7] placeholder:text-[rgba(255,255,255,0.25)] focus:outline-none"
          autoFocus={autoFocus}
        />
        {value && (
          <motion.button
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => onChange?.('')}
            className="btn-ghost p-0.5"
          >
            <X size={12} className="text-[rgba(255,255,255,0.3)]" />
          </motion.button>
        )}
        <motion.kbd
          className="hidden md:inline-flex items-center px-1.5 py-0.5 text-[10px] font-medium text-[rgba(255,255,255,0.25)] bg-[rgba(255,255,255,0.04)] rounded border border-[rgba(255,255,255,0.06)]"
          animate={isFocused ? {
            opacity: 0.15,
            scale: 0.95,
          } : {
            opacity: 1,
            scale: 1,
          }}
          transition={{ duration: 0.15 }}
        >
          ⌘K
        </motion.kbd>
      </motion.div>

      {/* Results dropdown */}
      <AnimatePresence>
        {isFocused && results.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="absolute top-full mt-1 left-0 right-0 z-50 glass-card-strong p-1.5 shadow-xl max-h-60 overflow-y-auto"
          >
            {results.map((result, idx) => (
              <button
                key={idx}
                onClick={() => onResultClick?.(result)}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] text-[rgba(255,255,255,0.7)] hover:bg-[rgba(255,255,255,0.05)] hover:text-[#f5f5f7] transition-colors text-left"
              >
                {result.icon && <span className="flex-shrink-0">{result.icon}</span>}
                <div className="flex-1 min-w-0">
                  <p className="truncate">{result.label}</p>
                  {result.description && (
                    <p className="text-[11px] text-[rgba(255,255,255,0.35)] truncate">{result.description}</p>
                  )}
                </div>
                {result.shortcut && (
                  <kbd className="text-[10px] text-[rgba(255,255,255,0.25)] px-1.5 py-0.5 bg-[rgba(255,255,255,0.04)] rounded border border-[rgba(255,255,255,0.06)] flex-shrink-0">
                    {result.shortcut}
                  </kbd>
                )}
              </button>
            ))}
            {loading && (
              <div className="flex items-center justify-center py-3">
                <div className="w-4 h-4 rounded-full border-2 border-[rgba(255,255,255,0.1)] border-t-[#c8c8d0] animate-spin" />
              </div>
            )}
          </motion.div>
        )}        </AnimatePresence>
      </motion.div>
    );
  }
