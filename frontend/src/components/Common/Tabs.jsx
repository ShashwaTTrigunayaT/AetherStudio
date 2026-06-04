import React from 'react';
import { motion } from 'framer-motion';

export default function Tabs({ tabs = [], activeTab, onChange, variant = 'underline', className = '' }) {
  const variantStyles = {
    underline: {
      container: 'flex border-b border-[rgba(255,255,255,0.06)]',
      tab: (active) => `px-4 py-3 text-xs font-medium transition-all relative ${
        active ? 'text-[#f5f5f7]' : 'text-[rgba(255,255,255,0.35)] hover:text-[rgba(255,255,255,0.6)]'
      }`,
      activeIndicator: 'absolute bottom-0 left-2 right-2 h-0.5 bg-gradient-to-r from-[#b89450] to-[#d4bc80] rounded-full',
    },
    pills: {
      container: 'flex gap-1 p-1 bg-[rgba(255,255,255,0.04)] rounded-xl',
      tab: (active) => `px-4 py-2 text-[12px] font-medium rounded-lg transition-all ${
        active ? 'bg-[rgba(184,148,80,0.15)] text-[#d4bc80] shadow-sm' : 'text-[rgba(255,255,255,0.45)] hover:text-[rgba(255,255,255,0.7)]'
      }`,
      activeIndicator: null,
    },
    segmented: {
      container: 'flex gap-0.5 p-0.5 bg-[rgba(255,255,255,0.04)] rounded-xl border border-[rgba(255,255,255,0.06)]',
      tab: (active) => `px-5 py-2 text-[12px] font-medium rounded-[10px] transition-all ${
        active ? 'bg-[rgba(255,255,255,0.08)] text-[#f5f5f7] shadow-sm' : 'text-[rgba(255,255,255,0.45)] hover:text-[rgba(255,255,255,0.7)]'
      }`,
      activeIndicator: null,
    },
  };

  const styles = variantStyles[variant] || variantStyles.underline;

  return (
    <div className={`${styles.container} ${className}`}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.value;
        const Icon = tab.icon;
        return (
          <button
            key={tab.value}
            onClick={() => onChange?.(tab.value)}
            className={`${styles.tab(isActive)} flex items-center gap-2 whitespace-nowrap relative`}
          >
            {Icon && <Icon size={14} />}
            {tab.label}
            {tab.count !== undefined && (
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${
                isActive ? 'bg-[rgba(184,148,80,0.2)] text-[#d4bc80]' : 'bg-[rgba(255,255,255,0.06)] text-[rgba(255,255,255,0.4)]'
              }`}>
                {tab.count}
              </span>
            )}
            {isActive && styles.activeIndicator && (
              <motion.div
                layoutId="tab-indicator"
                className={styles.activeIndicator}
                transition={{ type: 'spring', stiffness: 600, damping: 35 }}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}
