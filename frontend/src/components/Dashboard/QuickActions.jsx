import React from 'react';
import { motion } from 'framer-motion';
import { Plus, FileCode, Upload, GitBranch, BookOpen } from 'lucide-react';

const actions = [
  {
    label: 'New Workspace',
    description: 'Start a fresh project',
    icon: Plus,
    shortcut: '⌘N',
    color: 'rgba(255,255,255,0.5)',
    gradient: 'from-[rgba(255,255,255,0.08)] to-[rgba(255,255,255,0.04)]',
  },
  {
    label: 'Import Project',
    description: 'From GitHub or local',
    icon: Upload,
    shortcut: '⌘I',
    color: '#30d158',
    gradient: 'from-[#30d158] to-[#dcccb5]',
  },
  {
    label: 'Clone Repository',
    description: 'Git clone & start coding',
    icon: GitBranch,
    shortcut: '⌘G',
    color: '#ffd60a',
    gradient: 'from-[#ffd60a] to-[#ff9f0a]',
  },
  {
    label: 'Documentation',
    description: 'Guides & API reference',
    icon: BookOpen,
    shortcut: '⌘H',
    color: '#b0b0bc',
    gradient: 'from-[#b0b0bc] to-[#c0c0cc]',
  },
];

export default function QuickActions({ onCreateWorkspace }) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {actions.map((action, idx) => (
        <motion.button
          key={action.label}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            delay: idx * 0.05,
            type: 'spring',
            stiffness: 400,
            damping: 25,
          }}
          whileHover={{
            y: -4,
            borderColor: `${action.color}25`,
            boxShadow: `0 12px 32px rgba(0,0,0,0.4), 0 0 0 1px ${action.color}10`,
            transition: { duration: 0.2 },
          }}
          whileTap={{ scale: 0.97 }}
          onClick={onCreateWorkspace}
          className="group relative flex items-center gap-3.5 p-3.5 rounded-[12px] border transition-all duration-300 overflow-hidden text-left"
          style={{
            background: 'rgba(14,14,18,0.7)',
            borderColor: 'rgba(255,255,255,0.06)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
          }}
        >
          {/* Hover glow */}
          <div
            className="absolute inset-0 rounded-[12px] opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
            style={{
              background: `radial-gradient(ellipse at 30% 50%, ${action.color}06, transparent)`,
            }}
          />

          <div
            className="relative w-10 h-10 rounded-[10px] flex items-center justify-center flex-shrink-0 transition-all duration-300 group-hover:scale-110"
            style={{
              background: `${action.color}10`,
              boxShadow: `0 0 16px ${action.color}08`,
            }}
          >
            <action.icon size={16} style={{ color: action.color }} />
          </div>

          <div className="relative flex-1 min-w-0">
            <p className="text-[12px] font-semibold text-[#f5f5f7] transition-colors duration-200">
              {action.label}
            </p>
            <p className="text-[10px] mt-0.5" style={{ color: 'rgba(255,255,255,0.25)' }}>
              {action.description}
            </p>
          </div>

          <kbd
            className="relative flex-shrink-0 text-[9px] font-mono px-1.5 py-0.5 rounded-md opacity-0 group-hover:opacity-100 transition-all duration-200"
            style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.05)',
              color: 'rgba(255,255,255,0.2)',
            }}
          >
            {action.shortcut}
          </kbd>
        </motion.button>
      ))}
    </div>
  );
}
