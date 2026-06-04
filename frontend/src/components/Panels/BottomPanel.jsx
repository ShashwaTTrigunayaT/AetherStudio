import React, { useCallback, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  XCircle, Terminal as TerminalIcon,
  Bug, ChevronDown, ScrollText,
} from 'lucide-react';
import { useWorkspace } from '../../stores/useWorkspace';
import XTerminal from '../Terminal/XTerminal';
import ProblemsPanel from './ProblemsPanel';
import OutputPanel from './OutputPanel';
import DebugConsole from '../Debug/DebugConsole';


const tabs = [
  { id: 'problems', label: 'PROBLEMS', icon: XCircle },
  { id: 'output', label: 'OUTPUT', icon: ScrollText },
  { id: 'debug', label: 'DEBUG CONSOLE', icon: Bug },
  { id: 'terminal', label: 'TERMINAL', icon: TerminalIcon },
];

export default function BottomPanel() {
  const {
    bottomPanelOpen, activeBottomPanel, setActiveBottomPanel,
    toggleBottomPanel, problems, bottomPanelHeight,
    setBottomPanelHeight, minBottomPanelHeight, maxBottomPanelHeight,
  } = useWorkspace();

  const [dragging, setDragging] = useState(false);

  // ── Use 25% of viewport height as initial panel size ──
  const initialHeight = typeof window !== 'undefined'
    ? Math.round(window.innerHeight * 0.25)
    : 220;

  const errorCount = problems.filter((p) => p.severity === 'error').length;
  const warningCount = problems.filter((p) => p.severity === 'warning').length;

  // Panel resize handle — drag down auto-closes, drag from closed to reopen
  const handleMouseDown = useCallback((e) => {
    e.preventDefault();
    setDragging(true);
    const startY = e.clientY;
    const startHeight = bottomPanelHeight;
    const wasClosed = !bottomPanelOpen;

    const handleMouseMove = (me) => {
      const deltaY = startY - me.clientY; // positive = dragging UP

      if (wasClosed) {
        // Panel is closed — dragging UP reopens it
        if (deltaY > 15) {
          const newHeight = Math.min(maxBottomPanelHeight, Math.max(minBottomPanelHeight, startHeight + deltaY));
          setBottomPanelHeight(newHeight);
          toggleBottomPanel();
          setDragging(false);
          document.removeEventListener('mousemove', handleMouseMove);
          document.removeEventListener('mouseup', handleMouseUp);
        }
        return;
      }

      const newHeight = startHeight + deltaY;

      // Auto-close if dragged below threshold
      if (newHeight < 30) {
        setDragging(false);
        toggleBottomPanel();
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        return;
      }

      setBottomPanelHeight(
        Math.min(maxBottomPanelHeight, Math.max(minBottomPanelHeight, newHeight))
      );
    };

    const handleMouseUp = () => {
      setDragging(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [bottomPanelHeight, bottomPanelOpen, setBottomPanelHeight, minBottomPanelHeight, maxBottomPanelHeight, toggleBottomPanel]);

  return (
    <div className="relative flex-shrink-0">
      {/* ─── Animated Panel Container ─── */}
      <motion.div
        initial={{ height: initialHeight }}
        animate={bottomPanelOpen ? { height: bottomPanelHeight } : { height: 0 }}
        className={`relative overflow-hidden flex flex-col ${
          bottomPanelOpen ? '' : 'border-t-0'
        }`}
        style={{
          background: 'rgba(14,14,18,0.85)',
          backdropFilter: 'blur(16px) saturate(1.4)',
          WebkitBackdropFilter: 'blur(16px) saturate(1.4)',
          borderTop: bottomPanelOpen ? '1px solid rgba(255,255,255,0.06)' : 'none',
        }}
        transition={{ duration: dragging ? 0 : 0.2, ease: [0.25, 0.1, 0.25, 1] }}
      >
        {/* Premium drag handle at top of panel */}
        <div
          onMouseDown={handleMouseDown}
          className="absolute left-0 right-0 z-20 cursor-row-resize transition-all duration-150"
          style={{
            height: '6px',
            top: '-3px',
            background: dragging ? 'rgba(255,255,255,0.15)' : 'transparent',
            boxShadow: dragging ? '0 0 12px rgba(255,255,255,0.1)' : 'none',
          }}
        />
        <div
          onMouseDown={handleMouseDown}
          className="absolute left-0 right-0 z-10 cursor-row-resize transition-colors duration-75"
          style={{ height: '3px', top: '3px' }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
        />

        {/* Panel tabs */}
        <div
          className="flex items-center h-[30px] flex-shrink-0 relative z-10"
          style={{
            borderBottom: '1px solid rgba(255,255,255,0.04)',
          }}
          onMouseMove={(e) => {
            /* Track mouse for tab spotlight */
            const rect = e.currentTarget.getBoundingClientRect();
            const x = ((e.clientX - rect.left) / rect.width) * 100;
            e.currentTarget.style.setProperty('--mouse-x', `${x}%`);
          }}
        >
          <div className="flex items-center h-full">
            {tabs.map((tab) => {
              const isActive = activeBottomPanel === tab.id;
              const Icon = tab.icon;
              return (
                <motion.button
                  key={tab.id}
                  onClick={() => setActiveBottomPanel(tab.id)}                      className={`
                    relative flex items-center gap-1.5 py-2 px-4 h-full text-[11px] leading-none
                    transition-all duration-75 select-none uppercase tracking-wider
                  `}
                  style={{
                    color: isActive ? '#f5f5f7' : 'rgba(255,255,255,0.3)',
                    background: isActive
                      ? 'linear-gradient(180deg, rgba(255,255,255,0.04) 0%, transparent 100%)'
                      : 'transparent',
                  }}
                  whileHover={!isActive ? { color: 'rgba(255,255,255,0.5)', background: 'rgba(255,255,255,0.02)' } : undefined}
                  transition={{ duration: 0.1 }}
                >
                  {/* Active indicator — gold bottom border */}
                  {isActive && (
                    <motion.div
                      layoutId="activePanelIndicator"
                      className="absolute bottom-0 left-2 right-2 h-[2px] rounded-full"
                      style={{
                        background: 'rgba(255,255,255,0.35)',
                        boxShadow: '0 0 8px rgba(255,255,255,0.15)',
                      }}
                      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    />
                  )}
                  <Icon
                    size={12}
                    strokeWidth={1.5}
                    style={{ color: isActive ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.2)' }}
                  />
                  <span className={isActive ? 'font-medium' : ''}>{tab.label}</span>
                  {tab.id === 'problems' && (errorCount + warningCount) > 0 && (
                    <motion.span
                      key={errorCount + warningCount}
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="px-1 py-[1px] rounded text-[9px] font-semibold leading-none"
                      style={{
                        background: errorCount > 0
                          ? 'rgba(255,45,149,0.15)'
                          : 'rgba(255,211,0,0.15)',
                        color: errorCount > 0 ? '#ff2d95' : '#ffd300',
                        border: '1px solid',
                        borderColor: errorCount > 0
                          ? 'rgba(255,45,149,0.2)'
                          : 'rgba(255,211,0,0.2)',
                      }}
                    >
                      {errorCount + warningCount}
                    </motion.span>
                  )}
                </motion.button>
              );
            })}
          </div>            {/* Right actions */}
          <div className="ml-auto flex items-center gap-0.5 px-2">
            <motion.button
              whileHover={{ scale: 1.1, backgroundColor: 'rgba(255,255,255,0.04)' }}
              whileTap={{ scale: 0.9 }}
              onClick={toggleBottomPanel}
              className="p-1 transition-colors group"
              title="Close panel"
            >
              <motion.div
                animate={bottomPanelOpen ? { rotate: 0 } : { rotate: 180 }}
                transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
              >
                <ChevronDown size={13} className="group-hover:text-[rgba(255,255,255,0.4)]" strokeWidth={1.5} style={{ color: 'rgba(255,255,255,0.2)' }} />
              </motion.div>
            </motion.button>
          </div>
        </div>

        {/* Panel content with animated transitions */}
        <div className="flex-1 overflow-hidden min-h-0 relative z-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeBottomPanel}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.12, ease: [0.25, 0.1, 0.25, 1] }}
              className="h-full"
            >
              {activeBottomPanel === 'terminal' && <XTerminal />}
              {activeBottomPanel === 'problems' && <ProblemsPanel />}
              {activeBottomPanel === 'output' && <OutputPanel />}
              {activeBottomPanel === 'debug' && <DebugConsole />}
            </motion.div>
          </AnimatePresence>
        </div>

      </motion.div>

      {/* ─── Closed-state drag strip — always visible for drag-to-reopen ─── */}
      <AnimatePresence>
        {!bottomPanelOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 4 }}
            exit={{ opacity: 0, height: 0 }}              onMouseDown={handleMouseDown}
              className="cursor-row-resize relative flex-shrink-0"
              style={{
                background: dragging ? 'rgba(255,255,255,0.15)' : 'transparent',
                boxShadow: dragging ? '0 0 12px rgba(255,255,255,0.1)' : 'none',
              }}
          >
            {/* Hover zone */}
            <motion.div
              initial={{ opacity: 0 }}
              whileHover={{ opacity: 1 }}
              className="absolute inset-0 transition-opacity"
              style={{
                background: 'rgba(255,255,255,0.03)',
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
