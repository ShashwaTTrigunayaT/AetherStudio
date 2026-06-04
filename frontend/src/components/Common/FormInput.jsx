import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function FormInput({
  id,
  type = 'text',
  value = '',
  onChange,
  label,
  error,
  valid,
  autoComplete,
  autoFocus,
  required,
  disabled,
  children,
  className = '',
  hint,
}) {
  const [focused, setFocused] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (autoFocus && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [autoFocus]);

  const hasValue = value.length > 0;
  const showError = !!error && hasValue && !focused;

  return (
    <div className={`${className}`}>
      {/* Label */}
      {label && (
        <label
          htmlFor={id}
          onClick={() => inputRef.current?.focus()}
          className={`block text-[11px] font-medium mb-1.5 tracking-[0.02em] transition-colors duration-150 ${
            focused
              ? 'text-[rgba(184,148,80,0.7)]'
              : showError
                ? 'text-[rgba(255,69,58,0.6)]'
                : 'text-[rgba(255,255,255,0.35)]'
          }`}
        >
          {label}
          {required && <span className="ml-0.5 text-[rgba(255,69,58,0.4)]">*</span>}
        </label>
      )}

      {/* Input Container */}
      <div
        className={`group relative flex items-center rounded-[8px] border transition-all duration-150 ${
          focused
            ? 'border-[rgba(184,148,80,0.45)] bg-[rgba(184,148,80,0.02)] shadow-[0_0_0_1px_rgba(184,148,80,0.08)]'
            : showError
              ? 'border-[rgba(255,69,58,0.35)] bg-[rgba(255,69,58,0.02)]'
              : hasValue
                ? 'border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.015)]'
                : 'border-[rgba(255,255,255,0.06)] bg-transparent'
        }`}
      >
        <input
          ref={inputRef}
          id={id}
          type={type}
          value={value}
          onChange={onChange}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          autoComplete={autoComplete}
          required={required}
          disabled={disabled}
          className="w-full bg-transparent border-none outline-none text-[14px] text-[#f5f5f7] py-[10px] px-3 leading-relaxed placeholder:text-[rgba(255,255,255,0.12)] placeholder:text-[14px] disabled:opacity-40"
          placeholder={focused ? '' : undefined}
        />

        {/* Right side */}
        <div className="flex-shrink-0 pr-3 flex items-center gap-1">
          <AnimatePresence mode="wait">
            {valid && hasValue && !focused && !showError && (
              <motion.div
                key="valid"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.15 }}
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <circle cx="7" cy="7" r="6" stroke="rgba(48,209,88,0.3)" strokeWidth="1.5" />
                  <path d="M4.5 7L6.5 9L9.5 5" stroke="#30d158" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </motion.div>
            )}
            {showError && (
              <motion.div
                key="error"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.15 }}
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <circle cx="7" cy="7" r="6" stroke="rgba(255,69,58,0.3)" strokeWidth="1.5" />
                  <path d="M5 5L9 9M9 5L5 9" stroke="#ff453a" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </motion.div>
            )}
          </AnimatePresence>
          {children}
        </div>
      </div>

      {/* Error Message */}
      <AnimatePresence>
        {showError && error && (
          <motion.p
            initial={{ opacity: 0, y: -2 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -2 }}
            className="text-[11px] text-[#ff453a] mt-1.5 font-medium"
          >
            {error}
          </motion.p>
        )}
        {hint && !showError && !focused && (
          <motion.p
            initial={{ opacity: 0, y: -2 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -2 }}
            className="text-[11px] mt-1.5"
            style={{ color: 'rgba(255,255,255,0.2)' }}
          >
            {hint}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}
