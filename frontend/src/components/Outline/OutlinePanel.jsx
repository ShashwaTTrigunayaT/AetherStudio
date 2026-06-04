import React from 'react';
import { FileText } from 'lucide-react';
import { motion } from 'framer-motion';
import { useWorkspace } from '../../stores/useWorkspace';

// This would normally be populated from the Monaco editor's document symbols
const SAMPLE_SYMBOLS = [
  { name: 'App', type: 'function', line: 1 },
  { name: 'Workspace', type: 'component', line: 45 },
  { name: 'MonacoEditor', type: 'component', line: 120 },
  { name: 'TabBar', type: 'component', line: 200 },
  { name: 'handleEditorChange', type: 'method', line: 55 },
  { name: 'handleEditorMount', type: 'method', line: 80 },
];

const typeIcons = {
  function: { icon: 'ƒ', color: 'rgba(255,255,255,0.35)' },
  component: { icon: '◈', color: 'rgba(255,255,255,0.35)' },
  method: { icon: 'ƒ', color: 'rgba(255,255,255,0.35)' },
  variable: { icon: '□', color: '#fbbf24' },
  class: { icon: 'C', color: 'rgba(255,255,255,0.25)' },
  interface: { icon: 'I', color: 'rgba(255,255,255,0.15)' },
};

export default function OutlinePanel() {
  const { activeFile } = useWorkspace();

  if (!activeFile) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center px-4 relative">
        <div className="relative">
          <FileText size={22} className="text-[rgba(255,255,255,0.08)] mb-2" />
        </div>
        <p className="text-[12px] text-[rgba(255,255,255,0.2)]">Open a file to see its outline</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full relative">
      {/* Ambient light at top */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[60%] h-[1px] pointer-events-none z-10"
        style={{
          background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent)',
          boxShadow: '0 0 30px rgba(255,255,255,0.15), 0 0 60px rgba(255,255,255,0.05)',
        }}
      />

      {/* Header */}
      <div className="flex-shrink-0 relative z-10">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'linear-gradient(180deg, rgba(12,12,24,0.95) 0%, rgba(0,0,0,0.95) 100%)',
          }}
        />
        <div className="flex items-center gap-2 px-3 py-[10px] relative z-10">
          {/* Status dot */}
          <div className="relative flex-shrink-0">
            <motion.div
              animate={{ scale: [1, 1.2, 1], opacity: [0.7, 1, 0.7] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              className="w-[5px] h-[5px] rounded-full"
              style={{ backgroundColor: 'rgba(255,255,255,0.35)' }}
            />
            <div
              className="absolute inset-0 blur-[6px] rounded-full"
              style={{ backgroundColor: 'rgba(255,255,255,0.35)', opacity: 0.6 }}
            />
            <div
              className="absolute -inset-[5px] rounded-full blur-[3px] opacity-40"
              style={{ border: '1.5px solid rgba(255,255,255,0.3)' }}
            />
          </div>

          <FileText size={11} className="text-[rgba(255,255,255,0.3)]" />
          <span className="text-[10px] font-semibold uppercase tracking-[1.2px] text-[rgba(255,255,255,0.25)]">
            Outline
          </span>

          {/* Separator */}
          <span className="text-[8px] text-[rgba(255,255,255,0.2)] font-mono">◆</span>

          {/* File name */}
          <span className="text-[9px] text-[rgba(255,255,255,0.1)] truncate font-mono">
            {activeFile?.name}
          </span>
        </div>

        {/* Neon gradient divider */}
        <div className="mx-3 h-px relative overflow-hidden">
          <div
            className="absolute inset-0"
            style={{
              background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.12), rgba(255,255,255,0.06), transparent)',
            }}
          />
        </div>
      </div>

      {/* Symbols list */}
      <div className="flex-1 overflow-y-auto py-1 relative z-10">
        {SAMPLE_SYMBOLS.map((symbol, idx) => {
          const info = typeIcons[symbol.type] || { icon: '•', color: 'rgba(255,255,255,0.3)' };
          return (
            <motion.div
              key={idx}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.03, duration: 0.15 }}
              whileHover={{
                x: 4,
                background: 'rgba(255,255,255,0.04)',
              }}
              className="flex items-center gap-2 px-3 py-1.5 cursor-pointer transition-all duration-100 group"
            >
              {/* Symbol icon */}
              <span
                className="text-[11px] font-mono w-4 text-center flex-shrink-0 transition-all duration-100 group-hover:drop-shadow-[0_0_6px_rgba(255,255,255,0.3)]"
                style={{ color: info.color }}
              >
                {info.icon}
              </span>

              {/* Symbol name */}
              <span className="text-[12px] text-[rgba(255,255,255,0.45)] truncate flex-1 group-hover:text-[rgba(255,255,255,0.65)] transition-colors duration-100">
                {symbol.name}
              </span>

              {/* Line number */}
              <span
                className="text-[9px] tabular-nums px-1 py-[1px] rounded"
                style={{
                  color: 'rgba(255,255,255,0.1)',
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(255,255,255,0.04)',
                }}
              >
                L{symbol.line}
              </span>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
