import React, { useEffect, useRef, useCallback, useState } from 'react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { WebLinksAddon } from '@xterm/addon-web-links';
import { Unicode11Addon } from '@xterm/addon-unicode11';
import { motion, AnimatePresence } from 'framer-motion';
import '@xterm/xterm/css/xterm.css';
import { getSocket } from '../../lib/api';
import { useTerminal } from '../../stores/useTerminal';
import {
  Plus,
  Trash2,
  Terminal as TerminalIcon,
  GripVertical,
} from 'lucide-react';

// ── Cyberpunk Neon Terminal Theme ──
const CYBER_TERMINAL_THEME = {
  background: '#000000',
  foreground: '#d0d0d0',
  cursor: '#00f0ff',
  cursorAccent: '#000000',
  selectionBackground: 'rgba(0, 240, 255, 0.25)',
  selectionInactiveBackground: 'rgba(0, 240, 255, 0.08)',
  black: '#101018',
  red: '#ff2d95',
  green: '#00ff41',
  yellow: '#ffd300',
  blue: '#0088ff',
  magenta: '#ff00ff',
  cyan: '#00f0ff',
  white: '#d0d0d0',
  brightBlack: '#303048',
  brightRed: '#ff5fa0',
  brightGreen: '#40ff7a',
  brightYellow: '#ffe040',
  brightBlue: '#40a0ff',
  brightMagenta: '#ff40ff',
  brightCyan: '#40f4ff',
  brightWhite: '#f0f0f0',
};

// ── Variants ──
const paneVariants = {
  initial: { opacity: 0, y: -10, scale: 0.98 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, scale: 0.96, height: 0, marginBottom: 0, overflow: 'hidden' },
};

// ── Single Terminal Pane ──
function TerminalPane({ terminal, idx, total, containerRef, onClose, onNew }) {
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const paneRef = useRef(null);

  return (
    <motion.div
      ref={paneRef}
      layout
      variants={paneVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1], delay: idx * 0.03 }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="relative flex flex-col overflow-hidden"
      style={{ minHeight: 0 }}
    >
      {/* Cyberpunk background glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'linear-gradient(180deg, rgba(0,240,255,0.06) 0%, transparent 50%)',
        }}
      />

      {/* Top neon accent line */}
      <div
        className="absolute top-0 left-6 right-6 h-[1px] pointer-events-none"
        style={{
          background: 'linear-gradient(90deg, transparent, rgba(0,240,255,0.2), transparent)',
          boxShadow: '0 0 16px rgba(0,240,255,0.25), 0 0 32px rgba(0,240,255,0.08)',
        }}
      />

      {/* ── Cyberpunk Header ── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex items-center h-[28px] flex-shrink-0 px-2 gap-1.5 select-none relative"
        style={{
          background: 'linear-gradient(180deg, rgba(12,12,24,0.95) 0%, rgba(0,0,0,0.95) 100%)',
          borderBottom: '1px solid rgba(0,240,255,0.06)',
        }}
      >
        {/* Drag handle */}
        <motion.div
          animate={{ opacity: hovered ? 0.6 : 0.15 }}
          transition={{ duration: 0.15 }}
        >
          <GripVertical size={10} className="text-[rgba(64,64,104,0.3)] flex-shrink-0" strokeWidth={1.5} />
        </motion.div>

        {/* Status dot — cyan neon */}
        <div className="relative flex-shrink-0">
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.7, 1, 0.7],
            }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            className="w-[5px] h-[5px] rounded-full"
            style={{ backgroundColor: '#00f0ff' }}
          />
          <div
            className="absolute inset-0 blur-[6px] rounded-full"
            style={{ backgroundColor: '#00f0ff', opacity: 0.9 }}
          />
          {/* Outer glow ring */}
          <div
            className="absolute -inset-[5px] rounded-full blur-[3px] opacity-60"
            style={{ border: '1.5px solid rgba(0,240,255,0.5)' }}
          />
        </div>

        {/* Terminal icon */}
        <motion.div
          animate={focused ? { color: '#00f0ff' } : { color: 'rgba(64,64,104,0.5)' }}
          transition={{ duration: 0.2 }}
        >
          <TerminalIcon size={10} className="flex-shrink-0" strokeWidth={1.5} />
        </motion.div>

        {/* Terminal name */}
        <motion.span
          className="flex-1 truncate"
          layout
          transition={{ duration: 0.15 }}
        >
          <span className="text-[11px] font-medium text-[rgba(200,200,220,0.45)] tracking-wide">
            {terminal.name}
          </span>
        </motion.span>

        {/* Action buttons */}
        <div className="flex items-center gap-0.5">
          <motion.button
            whileHover={{ scale: 1.1, backgroundColor: 'rgba(0,255,65,0.12)', boxShadow: '0 0 16px rgba(0,255,65,0.35), 0 0 32px rgba(0,255,65,0.12)' }}
            whileTap={{ scale: 0.9 }}
            onClick={onNew}
            className="p-0.5 rounded-sm transition-all duration-150 group"
            style={{ opacity: hovered ? 1 : 0 }}
            title="New Terminal"
          >
            <Plus size={10} className="text-[#00ff41] group-hover:text-[#40ff7a]" strokeWidth={2} />
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.1, backgroundColor: 'rgba(255,45,149,0.12)', boxShadow: '0 0 16px rgba(255,45,149,0.35), 0 0 32px rgba(255,45,149,0.12)' }}
            whileTap={{ scale: 0.9 }}
            onClick={onClose}
            className="p-0.5 rounded-sm transition-all duration-150 group"
            style={{ opacity: hovered ? 1 : 0 }}
            title="Close terminal"
          >
            <Trash2 size={10} className="text-[#ff2d95] group-hover:text-[#ff5fa0]" strokeWidth={2} />
          </motion.button>
        </div>
      </motion.div>

      {/* ── Terminal Viewport ── */}
      <div
        className="flex-1 min-h-0 relative"
        onDragOver={(e) => {
          if (e.dataTransfer.types?.includes('text/uri-list') || e.dataTransfer.types?.includes('Files') || e.dataTransfer.types?.includes('text/plain')) {
            e.preventDefault();
            e.stopPropagation();
          }
        }}
        onDragEnter={(e) => {
          e.preventDefault();
          e.stopPropagation();
          // Signal parent about drag-over
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
        onDrop={(e) => {
          e.preventDefault();
          e.stopPropagation();
          const path = e.dataTransfer.getData('text/plain');
          const uri = e.dataTransfer.getData('text/uri-list');
          const files = e.dataTransfer.files;
          let filePath = '';
          if (path) filePath = path;
          else if (uri) filePath = uri;
          else if (files?.length > 0) filePath = files[0].name;
          if (filePath && terminal.id) {
            const escaped = filePath.includes(' ') ? `'${filePath}'` : filePath;
            const sock = getSocket();
            sock?.emit('terminal-input', { terminalId: terminal.id, data: escaped });
            setTimeout(() => {
              sock?.emit('terminal-input', { terminalId: terminal.id, data: ' ' });
            }, 50);
          }
        }}
      >
        {/* Focus glow — cyan */}
        <motion.div
          animate={{ opacity: focused ? 0.08 : 0 }}
          className="absolute inset-0 pointer-events-none z-10"
          style={{
            background: 'radial-gradient(ellipse at center, rgba(0,240,255,0.35) 0%, transparent 70%)',
          }}
        />

        {/* Scanline overlay */}
        <div
          className="absolute inset-0 pointer-events-none z-10 opacity-[0.03]"
          style={{
            background: `repeating-linear-gradient(
              0deg,
              transparent,
              transparent 2px,
              rgba(0, 240, 255, 0.02) 2px,
              rgba(0, 240, 255, 0.02) 4px
            )`,
          }}
        />

        {/* Grid overlay */}
        <div
          className="absolute inset-0 pointer-events-none z-10 opacity-[0.02]"
          style={{
            backgroundImage: `
              linear-gradient(rgba(0,240,255,0.04) 1px, transparent 1px),
              linear-gradient(90deg, rgba(0,240,255,0.04) 1px, transparent 1px)
            `,
            backgroundSize: '32px 32px',
          }}
        />

        {/* ── Visual bell flash overlay ── */}
        <AnimatePresence>
          {bellFlash[terminal.id] && (
            <motion.div
              key={bellFlash[terminal.id]}
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.2 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.1 }}
              className="absolute inset-0 z-20 pointer-events-none"
              style={{
                background: 'radial-gradient(ellipse at center, rgba(0,240,255,0.5) 0%, transparent 70%)',
              }}
            />
          )}
        </AnimatePresence>

        {/* xterm container */}
        <div
          ref={(el) => { containerRef.current[terminal.id] = el; }}
          className="w-full h-full relative z-0"
          onClick={() => setFocused(true)}
          style={{
            background: 'radial-gradient(ellipse at 50% 0%, rgba(0,240,255,0.03) 0%, transparent 60%)',
          }}
        />
      </div>
    </motion.div>
  );
}

// ── Main VerticalTerminal ──
export default function VerticalTerminal() {
  const terminalContainerRefs = useRef({});
  const xtermInstances = useRef({});
  const scrollRef = useRef(null);
  const socket = getSocket();
  const [bellFlash, setBellFlash] = useState({});
  const bellFlashTimeouts = useRef({});

  const {
    terminals,
    createTerminal,
    killTerminal,
    initialize,
  } = useTerminal();

  const terminalsRef = useRef(terminals);
  terminalsRef.current = terminals;

  // ── Init ──
  useEffect(() => { initialize(); }, []);

  // ── Socket listeners ──
  useEffect(() => {
    if (!socket) return;

    const onTerminalOutput = (data) => {
      const { terminalId, data: outputData } = data;
      const out = outputData || data;

      // ── Visual bell detection ──
      if (typeof out === 'string' && out.includes('\x07')) {
        const now = Date.now();
        setBellFlash((prev) => ({ ...prev, [terminalId]: now }));
        if (bellFlashTimeouts.current[terminalId]) {
          clearTimeout(bellFlashTimeouts.current[terminalId]);
        }
        bellFlashTimeouts.current[terminalId] = setTimeout(() => {
          setBellFlash((prev) => {
            const next = { ...prev };
            delete next[terminalId];
            return next;
          });
        }, 300);
      }

      const cleanOut = typeof out === 'string' ? out.replace(/\x07/g, '') : out;
      const instance = xtermInstances.current[terminalId];
      if (instance?.term) {
        instance.term.write(cleanOut);
      }
    };
    const onTerminalError = (error) => {
      const msg = typeof error === 'object' ? error.error || error.message || JSON.stringify(error) : error;
      const targetId = error?.terminalId;
      const instance = xtermInstances.current[targetId];
      if (instance?.term) {
        instance.term.write(`\x1b[38;2;255;45;149m${msg}\x1b[0m\r\n`);
      }
    };
    const onTerminalExit = (data) => {
      if (!data.terminalId) return;
      const instance = xtermInstances.current[data.terminalId];
      if (instance?.term) {
        instance.term.write(`\r\n\x1b[38;2;64;64;104m[Process exited ${data.exitCode !== null ? `with code ${data.exitCode}` : ''}]\x1b[0m\r\n`);
      }
    };

    socket.on('terminal-output', onTerminalOutput);
    socket.on('terminal-error', onTerminalError);
    socket.on('terminal-exit', onTerminalExit);

    return () => {
      socket.off('terminal-output', onTerminalOutput);
      socket.off('terminal-error', onTerminalError);
      socket.off('terminal-exit', onTerminalExit);
    };
  }, [socket]);

  // ── Create xterm instance ──
  const createXTermInstance = useCallback((terminalId) => {
    if (xtermInstances.current[terminalId]) return;
    const currentTerminals = terminalsRef.current;
    const terminal = currentTerminals.find((t) => t.id === terminalId);
    if (!terminal) return;

    const term = new Terminal({
      cursorBlink: true,
      cursorStyle: 'bar',
      cursorWidth: 2,
      theme: CYBER_TERMINAL_THEME,
      fontFamily: "'SF Mono', 'Fira Code', 'Cascadia Code', 'JetBrains Mono', 'Menlo', monospace",
      fontSize: 12,
      lineHeight: 1.4,
      allowTransparency: false,
      drawBoldTextInBrightColors: true,
      minimumContrastRatio: 4.5,
      experimentalCharAtlas: 'dynamic',
      allowProposedApi: true,
      scrollback: 10000,
      rows: 5,
    });

    const fitAddon = new FitAddon();
    const webLinksAddon = new WebLinksAddon((_event, uri) => {
      window.open(uri, '_blank', 'noopener,noreferrer');
    });
    const unicode11Addon = new Unicode11Addon();

    term.loadAddon(fitAddon);
    term.loadAddon(webLinksAddon);
    term.loadAddon(unicode11Addon);
    term.unicode.active = 'unicode11';

    const container = terminalContainerRefs.current[terminalId];
    if (!container) {
      setTimeout(() => createXTermInstance(terminalId), 50);
      return;
    }

    const termDiv = document.createElement('div');
    termDiv.style.width = '100%';
    termDiv.style.height = '100%';
    termDiv.style.display = 'block';
    termDiv.dataset.terminalId = terminalId;
    container.appendChild(termDiv);

    term.open(termDiv);
    fitAddon.fit();

    xtermInstances.current[terminalId] = { term, fitAddon, container: termDiv };

    term.onData((data) => {
      socket?.emit('terminal-input', { terminalId, data });
    });

    const handleResize = () => {
      try {
        fitAddon.fit();
        const cols = term.cols;
        const rows = term.rows;
        if (cols > 0 && rows > 0) {
          socket?.emit('terminal-resize', { terminalId, cols, rows });
        }
      } catch (e) { /* noop */ }
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(termDiv);

    const handleContainerClick = () => { term.focus(); };
    termDiv.addEventListener('click', handleContainerClick);

    xtermInstances.current[terminalId]._cleanup = {
      resizeObserver, handleContainerClick,
    };

    setTimeout(() => term.focus(), 50);
    setTimeout(handleResize, 100);
  }, [socket]);

  // ── Destroy xterm ──
  const destroyXTermInstance = useCallback((terminalId) => {
    const instance = xtermInstances.current[terminalId];
    if (!instance) return;
    const { term, fitAddon, _cleanup } = instance;

    if (_cleanup) {
      _cleanup.resizeObserver.disconnect();
      _cleanup.container?.removeEventListener('click', _cleanup.handleContainerClick);
      _cleanup.container?.remove();
    }

    try { fitAddon.dispose(); } catch (e) { /* noop */ }
    try { term.dispose(); } catch (e) { /* noop */ }
    delete xtermInstances.current[terminalId];
  }, []);

  // ── Sync terminals ──
  useEffect(() => {
    const currentIds = new Set(terminals.map((t) => t.id));
    Object.keys(xtermInstances.current).forEach((id) => {
      if (!currentIds.has(id)) destroyXTermInstance(id);
    });
    terminals.forEach((t) => {
      if (!xtermInstances.current[t.id]) createXTermInstance(t.id);
    });
  }, [terminals, createXTermInstance, destroyXTermInstance]);

  // ── Resize handling ──
  useEffect(() => {
    const handleResize = () => {
      Object.values(xtermInstances.current).forEach((instance) => {
        try { instance.fitAddon?.fit(); } catch (e) { /* noop */ }
      });
    };
    window.addEventListener('resize', handleResize);
    const mainObserver = new ResizeObserver(handleResize);
    const observe = () => {
      Object.values(terminalContainerRefs.current).forEach((el) => { if (el) mainObserver.observe(el); });
    };
    observe();
    return () => {
      window.removeEventListener('resize', handleResize);
      mainObserver.disconnect();
    };
  }, [terminals]);

  // ── Cleanup on unmount ──
  useEffect(() => {
    return () => { Object.keys(xtermInstances.current).forEach((id) => destroyXTermInstance(id)); };
  }, []);

  // ── Handlers ──
  const handleCreateTerminal = useCallback(() => {
    createTerminal();
    setTimeout(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }
    }, 50);
  }, [createTerminal]);

  const handleKillTerminal = useCallback((terminalId) => {
    killTerminal(terminalId);
  }, [killTerminal]);

  if (terminals.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
      className="h-full flex flex-col relative"
      style={{ backgroundColor: '#000000' }}
    >
      {/* Cyberpunk ambient background */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at 50% 0%, rgba(0,240,255,0.08) 0%, transparent 60%), radial-gradient(ellipse at 50% 100%, rgba(255,0,255,0.06) 0%, transparent 50%)',
        }}
      />

      {/* Neon gradient accent bar at top */}
      <div
        className="flex-shrink-0 h-[2px] relative z-10"
        style={{
          background: 'linear-gradient(90deg, #00f0ff, #ff00ff, #00f0ff)',
          backgroundSize: '200% 100%',
          opacity: 0.5,
          boxShadow: '0 0 20px rgba(0,240,255,0.5), 0 0 40px rgba(0,240,255,0.2)',
        }}
      />

      {/* ── Scrollable pane stack ── */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-thin relative z-0"
      >
        <AnimatePresence mode="popLayout">
          {terminals.map((terminal, idx) => (
            <TerminalPane
              key={terminal.id}
              terminal={terminal}
              idx={idx}
              total={terminals.length}
              containerRef={terminalContainerRefs}
              onClose={() => handleKillTerminal(terminal.id)}
              onNew={handleCreateTerminal}
            />
          ))}
        </AnimatePresence>
      </div>

      {/* ── Neon New Terminal Footer ── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex-shrink-0 relative z-10"
        style={{
          borderTop: '1px solid rgba(0,240,255,0.06)',
          background: 'linear-gradient(180deg, rgba(12,12,24,0.95) 0%, rgba(0,0,0,0.95) 100%)',
        }}
      >
        <motion.button
          whileHover={{ backgroundColor: 'rgba(0,240,255,0.08)', boxShadow: '0 0 24px rgba(0,240,255,0.2), 0 0 48px rgba(0,240,255,0.08)' }}
          whileTap={{ scale: 0.98 }}
          onClick={handleCreateTerminal}
          className="w-full flex items-center justify-center gap-2 py-2.5 text-[11px] text-[rgba(128,128,176,0.3)] hover:text-[rgba(200,200,220,0.45)] transition-all duration-150 relative group"
        >
          {/* Hover accent line */}
          <motion.div
            initial={{ opacity: 0 }}
            whileHover={{ opacity: 1 }}
            className="absolute top-0 left-8 right-8 h-[1px]"
            style={{
              background: 'linear-gradient(90deg, transparent, rgba(0,240,255,0.3), transparent)',
              boxShadow: '0 0 6px rgba(0,240,255,0.15)',
            }}
          />

          <motion.div
            whileHover={{ rotate: 90 }}
            transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
          >
            <Plus size={12} strokeWidth={2} className="text-[#00f0ff]/60 group-hover:text-[#00f0ff]/90" />
          </motion.div>
          <span className="tracking-wide font-medium">New Terminal</span>
          <kbd
            className="ml-1 text-[9px] px-1 py-[1px] rounded"
            style={{
              background: 'rgba(0,240,255,0.03)',
              border: '1px solid rgba(0,240,255,0.05)',
              color: 'rgba(128,128,176,0.15)',
            }}
          >
            Ctrl+Shift+`
          </kbd>
        </motion.button>
      </motion.div>

      {/* Bottom accent line */}
      <div
        className="absolute bottom-0 left-4 right-4 h-[1px] pointer-events-none"
        style={{
          background: 'linear-gradient(90deg, transparent, rgba(0,240,255,0.15), transparent)',
        }}
      />
    </motion.div>
  );
}
