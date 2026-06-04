import React, { useEffect, useRef, useCallback, useState } from 'react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { SearchAddon } from '@xterm/addon-search';
import { WebLinksAddon } from '@xterm/addon-web-links';
import { Unicode11Addon } from '@xterm/addon-unicode11';
import { motion, AnimatePresence } from 'framer-motion';
import '@xterm/xterm/css/xterm.css';
import { getSocket } from '../../lib/api';
import { useTerminal, TERMINAL_THEMES } from '../../stores/useTerminal';
import TerminalSearch from './TerminalSearch';
import TerminalContextMenu from './TerminalContextMenu';
import {
  Terminal as TerminalIcon,
  Plus,
  Trash2,
  ChevronDown,
  X,
  Eraser,
  Layers,
} from 'lucide-react';

// ── Light Ethereal Terminal Theme ──
const AETHER_TERMINAL_THEME = {
  background: 'rgba(255,255,255,0.85)',
  foreground: '#1f2937',
  cursor: '#007acc',
  cursorAccent: '#ffffff',
  selectionBackground: 'rgba(0, 122, 204, 0.25)',
  selectionInactiveBackground: 'rgba(0, 122, 204, 0.08)',
  black: '#1f2937',
  red: '#dc2626',
  green: '#16a34a',
  yellow: '#ca8a04',
  blue: '#2563eb',
  magenta: '#9333ea',
  cyan: '#0891b2',
  white: '#f8fafc',
  brightBlack: '#475569',
  brightRed: '#ef4444',
  brightGreen: '#22c55e',
  brightYellow: '#eab308',
  brightBlue: '#6b7280',
  brightMagenta: '#a855f7',
  brightCyan: '#06b6d4',
  brightWhite: '#ffffff',
};

// ── Tab Variants ──
const tabVariants = {
  initial: { opacity: 0, x: -10, scale: 0.96 },
  animate: { opacity: 1, x: 0, scale: 1 },
  exit: { opacity: 0, x: 10, scale: 0.96 },
};

const TerminalTab = React.forwardRef(({ terminal, isActive, isSelected, onClick, onClose, onContextMenu, onRename, isRenaming, onDragStart, onDragOver, onDragEnd, onDrop, index, onToggleSelection }, ref) => {
  const [editingName, setEditingName] = useState(terminal.name);
  const inputRef = useRef(null);
  const [hovered, setHovered] = useState(false);

  const handleClick = useCallback((e) => {
    if (e.ctrlKey || e.metaKey) {
      // Ctrl+click for multi-select
      e.preventDefault();
      e.stopPropagation();
      onClick(terminal.id, true);
      onToggleSelection?.(terminal.id);
    } else {
      onClick(terminal.id, false);
    }
  }, [terminal.id, onClick, onToggleSelection]);

  useEffect(() => {
    if (isRenaming && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isRenaming]);

  const handleDoubleClick = useCallback(() => {
    onRename(terminal.id);
    setEditingName(terminal.name);
  }, [terminal.id, terminal.name, onRename]);

  const handleRenameSubmit = useCallback(() => {
    onRename(terminal.id, editingName.trim() || terminal.name);
  }, [editingName, terminal.id, terminal.name, onRename]);

  const handleRenameKeyDown = useCallback((e) => {
    if (e.key === 'Enter') handleRenameSubmit();
    else if (e.key === 'Escape') onRename(terminal.id, terminal.name);
  }, [handleRenameSubmit, terminal.id, terminal.name, onRename]);

  return (
    <motion.div
      ref={ref}
      variants={tabVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      layout
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={`
        relative group flex items-center gap-1.5 h-full cursor-pointer select-none whitespace-nowrap
        text-[13px] leading-none
        border-r border-[rgba(0,0,0,0.04)] px-3.5 overflow-hidden
        transition-all duration-150
        ${isActive
          ? 'text-[#1e293b]'
          : isSelected
            ? 'text-[#1e293b]'
            : 'text-[rgba(100,110,130,0.4)] hover:text-[rgba(60,70,90,0.6)]'
        }
      `}
      style={{
        background: isActive
          ? 'rgba(184,148,80,0.04)'
          : isSelected
            ? 'rgba(0,122,204,0.06)'
            : hovered ? 'rgba(0,0,0,0.02)' : 'transparent',
        boxShadow: isActive
          ? 'inset 0 -1px 0 rgba(184,148,80,0.2)'
          : isSelected
            ? 'inset 0 -1px 0 rgba(0,122,204,0.3)'
            : 'none',
      }}
      onClick={handleClick}
      onContextMenu={onContextMenu}
      onDoubleClick={handleDoubleClick}
      draggable
      onDragStart={(e) => { e.dataTransfer.setData('text/plain', index); onDragStart?.(e, index); }}
      onDragOver={(e) => { e.preventDefault(); onDragOver?.(e, index); }}
      onDragEnd={onDragEnd}
      onDrop={(e) => { e.preventDefault(); onDrop?.(e, index); }}
    >
      {/* Active indicator — premium blue bar */isActive && (
        <motion.div
          layoutId="activeTerminalIndicator"
          className="absolute bottom-0 left-2 right-2 h-[2px] rounded-full"
          style={{
            background: '#a07840',
            boxShadow: '0 0 8px rgba(160,120,64,0.3)',
          }}
          transition={{ type: 'spring', stiffness: 350, damping: 35 }}
        />
      )}

      {/* Icon with subtle glow */}
      <div className="relative">
        <TerminalIcon
          size={11}
          strokeWidth={1.5}
          className={isActive ? 'text-[#b89450]' : 'text-[rgba(100,110,130,0.3)]'}
        />
      </div>

      {/* Name / rename input */}
      {isRenaming ? (
        <motion.input
          ref={inputRef}
          type="text"
          value={editingName}
          onChange={(e) => setEditingName(e.target.value)}
          onBlur={handleRenameSubmit}
          onKeyDown={handleRenameKeyDown}
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-[rgba(184,148,80,0.06)] text-[#1e293b] border border-[rgba(184,148,80,0.2)] rounded px-1 py-0 text-[13px] outline-none w-[80px]"
          onClick={(e) => e.stopPropagation()}
        />
      ) : (
        <motion.span
          className={`text-[13px] tracking-wide ${isActive ? 'font-medium text-[#1e293b]' : 'text-[rgba(100,110,130,0.5)]'}`}
          layout
          transition={{ duration: 0.15 }}
        >
          {terminal.name}
        </motion.span>
      )}

      {/* Close button */}
      <motion.button
        whileHover={{ scale: 1.15, backgroundColor: 'rgba(0,0,0,0.05)' }}
        whileTap={{ scale: 0.85 }}
        onClick={(e) => { e.stopPropagation(); onClose(); }}
        className={`
          p-0.5 rounded-sm transition-all flex-shrink-0
          ${isActive
            ? 'opacity-0 group-hover:opacity-80 hover:opacity-100 text-[rgba(100,110,130,0.3)] hover:text-[rgba(60,70,90,0.5)]'
            : 'opacity-0 group-hover:opacity-60 hover:opacity-100 text-[rgba(100,110,130,0.3)] hover:text-[rgba(60,70,90,0.5)]'
          }
        `}
      >
        <X size={10} strokeWidth={1.5} />
      </motion.button>
    </motion.div>
  );
});

// ── Dropdown Variants ──
const dropdownItemVariants = {
  hidden: { opacity: 0, x: -8 },
  visible: (i) => ({
    opacity: 1,
    x: 0,
    transition: { delay: i * 0.025, duration: 0.15, ease: [0.25, 0.1, 0.25, 1] },
  }),
};

const dropdownVariants = {
  hidden: { opacity: 0, scale: 0.96, y: -6, transformOrigin: 'top left' },
  visible: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.15, ease: [0.25, 0.1, 0.25, 1] } },
  exit: { opacity: 0, scale: 0.96, y: -6, transition: { duration: 0.1, ease: 'easeIn' } },
};

// ── Terminal Dropdown ──
function TerminalDropdown({ terminals, activeTerminalId, onSelect, onKill, onClose }) {
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) onClose();
    };
    const handleEsc = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleEsc);
    };
  }, [onClose]);

  return (
    <motion.div
      ref={dropdownRef}
      variants={dropdownVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="z-[9999] w-[220px] overflow-hidden py-1 rounded-lg"
      style={{
        background: 'rgba(255,255,255,0.98)',
        backdropFilter: 'blur(40px) saturate(1.8)',
        WebkitBackdropFilter: 'blur(40px) saturate(1.8)',
        border: '1px solid rgba(0,0,0,0.06)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.08), 0 2px 8px rgba(0,0,0,0.04)',
      }}
    >
      {terminals.map((terminal, idx) => {
        const act = terminal.id === activeTerminalId;
        return (
          <motion.div
            key={terminal.id}
            custom={idx}
            variants={dropdownItemVariants}
            initial="hidden"
            animate="visible"
            className={`
              flex items-center gap-2.5 px-3 py-1.5 text-[12px] cursor-pointer group mx-1 rounded-md
              ${act
                ? 'text-[#1e293b]'
                : 'text-[rgba(100,110,130,0.5)] hover:text-[rgba(60,70,90,0.7)]'
              }
            `}
            style={{
              background: act ? 'rgba(184,148,80,0.06)' : 'transparent',
            }}
            onClick={() => { onSelect(terminal.id); onClose(); }}
            transition={{ duration: 0.1 }}
          >
            <TerminalIcon
              size={12}
              className={`flex-shrink-0 ${act ? 'text-[#b89450]' : 'text-[rgba(100,110,130,0.25)]'}`}
              strokeWidth={1.5}
            />
            <div className="flex-1 min-w-0 truncate">{terminal.name}</div>
            <div
              className="text-[10px] text-[rgba(100,110,130,0.3)] mr-1 px-1 py-[1px] rounded"
              style={{ background: 'rgba(0,0,0,0.03)', border: '1px solid rgba(0,0,0,0.04)' }}
            >
              {terminal.shell}
            </div>
            <motion.button
              whileHover={{ scale: 1.15, backgroundColor: 'rgba(0,0,0,0.05)' }}
              whileTap={{ scale: 0.85 }}
              onClick={(e) => { e.stopPropagation(); onKill(terminal.id); }}
              className="p-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity text-[rgba(100,110,130,0.3)] hover:text-[rgba(60,70,90,0.5)]"
            >
              <X size={10} strokeWidth={1.5} />
            </motion.button>
          </motion.div>
        );
      })}
    </motion.div>
  );
}

// ── Terminal Viewport Variants ──
const terminalViewportVariants = {
  initial: { opacity: 0, scale: 0.98 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.98 },
};

function TerminalGroup({
  groupId, terminals, activeTerminalId, selectedTerminalIds, onSelectTerminal, onCloseTab, onContextMenu,
  onRenameTerminal, renamingTerminalId, onCreateTerminal, xtermInstances,
  terminalContainerRefs, onDragStart, onDragOver, onDragEnd, onDrop,
  onKillTerminal, onToggleDropdown, dropdownOpen, onKillSelected, onClearSelected,
  onToggleTerminalSelection, dropZoneVisible, setDropZoneVisible, bellFlash, activeTerminalIdForViewport,
}) {
  const groupTerminals = terminals.filter((t) => t.groupId === groupId);

  if (groupTerminals.length === 0) {
    return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex-1 flex items-center justify-center"
    >
      <motion.button
        whileHover={{ scale: 1.03, backgroundColor: 'rgba(184,148,80,0.06)' }}
        whileTap={{ scale: 0.97 }}
        onClick={() => onCreateTerminal()}
        className="flex items-center gap-2 px-5 py-2.5 text-[13px] text-[rgba(100,110,130,0.5)] hover:text-[rgba(184,148,80,0.6)] rounded-lg border border-dashed transition-all duration-200"
        style={{
          borderColor: 'rgba(0,0,0,0.08)',
        }}
      >
        <motion.div
          whileHover={{ rotate: 90 }}
          transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
        >
          <Plus size={14} strokeWidth={1.5} className="text-[rgba(184,148,80,0.3)]" />
        </motion.div>
        <span className="tracking-wide font-medium">Create Terminal</span>
        <kbd className="text-[9px] px-1.5 py-[1px] rounded ml-1"
          style={{
            background: 'rgba(0,0,0,0.03)',
            border: '1px solid rgba(0,0,0,0.04)',
            color: 'rgba(100,110,130,0.3)',
          }}
        >
          Ctrl+Shift+`
        </kbd>
      </motion.button>
      </motion.div>
    );
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
      className="flex-1 flex flex-col min-h-0 min-w-0 overflow-hidden relative"
    >
      {/* Subtle accent bar at top */}
      <div
        className="absolute top-0 left-0 right-0 h-[1px] pointer-events-none z-10"
        style={{
          background: 'linear-gradient(90deg, transparent, rgba(184,148,80,0.15), transparent)',
        }}
      />

      {/* ── Tab Bar ── */}
      <motion.div
        layout
        className="flex items-center h-[28px] flex-shrink-0 select-none overflow-hidden"
        style={{
          background: 'rgba(255,255,255,0.5)',
          borderBottom: '1px solid rgba(0,0,0,0.04)',
        }}
      >
        {/* Dropdown toggle */}
        <div className="relative flex-shrink-0 self-stretch">
          <motion.button
            whileHover={{ backgroundColor: 'rgba(184,148,80,0.06)' }}
            whileTap={{ scale: 0.95 }}
            onClick={(e) => { e.stopPropagation(); onToggleDropdown(groupId); }}
            className="h-full px-2.5 flex items-center transition-colors group"
            title="Select terminal"
          >
            <ChevronDown size={11} className="text-[rgba(100,110,130,0.3)] group-hover:text-[#b89450] transition-colors" strokeWidth={1.5} />
          </motion.button>
          <AnimatePresence>
            {dropdownOpen && (
              <div className="absolute left-0 top-full z-[9999] mt-0.5">
                <TerminalDropdown
                  terminals={groupTerminals}
                  activeTerminalId={activeTerminalId}
                  onSelect={onSelectTerminal}
                  onKill={onCloseTab}
                  onClose={() => onToggleDropdown(groupId)}
                />
              </div>
            )}
          </AnimatePresence>
        </div>

        {/* Separator */}
        <div className="w-px h-3.5 bg-[rgba(0,0,0,0.04)] flex-shrink-0" />

        {/* Tab list */}
        <div className="flex items-center h-full overflow-x-auto scrollbar-none flex-1">
          <AnimatePresence mode="popLayout">
            {groupTerminals.map((terminal, idx) => (
              <TerminalTab
                key={terminal.id}
                terminal={terminal}
                isActive={terminal.id === activeTerminalId}
                isSelected={selectedTerminalIds.includes(terminal.id)}
                onClick={(id, keepSel) => onSelectTerminal(id, keepSel)}
                onToggleSelection={onToggleTerminalSelection}
                onClose={() => onCloseTab(terminal.id)}
                onContextMenu={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onContextMenu(e.clientX, e.clientY, terminal.id);
                }}
                onRename={(id, name) => onRenameTerminal(id, name)}
                isRenaming={renamingTerminalId === terminal.id}
                index={idx}
                onDragStart={onDragStart}
                onDragOver={onDragOver}
                onDragEnd={onDragEnd}
                onDrop={onDrop}
              />
            ))}
          </AnimatePresence>
        </div>

        {/* Right side actions */}
        <div className="flex items-center gap-0 px-1 flex-shrink-0 self-stretch">
          {/* Batch clear button — visible when multi-selected */}
          {selectedTerminalIds.length > 1 && (
            <>
              <motion.button
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                whileHover={{ scale: 1.08, backgroundColor: 'rgba(0,0,0,0.04)' }}
                whileTap={{ scale: 0.92 }}
                onClick={onClearSelected}
                className="h-full px-2 flex items-center transition-colors group"
                title="Clear selected terminals"
              >
                <Eraser size={11} className="text-[rgba(100,110,130,0.3)] group-hover:text-[rgba(60,70,90,0.5)] transition-colors" strokeWidth={1.5} />
              </motion.button>
              <motion.button
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                whileHover={{ scale: 1.08, backgroundColor: 'rgba(255,45,149,0.08)' }}
                whileTap={{ scale: 0.92 }}
                onClick={onKillSelected}
                className="h-full px-2 flex items-center transition-colors group"
                title="Kill selected terminals"
              >
                <Trash2 size={11} className="text-[rgba(255,45,149,0.4)] group-hover:text-[#ff2d95] transition-colors" strokeWidth={1.5} />
              </motion.button>
              <div className="w-px h-3.5 bg-[rgba(0,0,0,0.04)] mx-0.5 flex-shrink-0" />
            </>
          )}

          <motion.button
            whileHover={{ scale: 1.08, backgroundColor: 'rgba(184,148,80,0.08)' }}
            whileTap={{ scale: 0.92 }}
            onClick={() => onCreateTerminal()}
            className="h-full px-2.5 flex items-center transition-colors group"
            title="New Terminal (Ctrl+Shift+`)"
          >
            <Plus size={13} className="text-[rgba(100,110,130,0.3)] group-hover:text-[#b89450] transition-colors" strokeWidth={1.5} />
          </motion.button>

          <div className="w-px h-3.5 bg-[rgba(0,0,0,0.04)] mx-0.5 flex-shrink-0" />

          <motion.button
            whileHover={{ scale: 1.08, backgroundColor: 'rgba(0,0,0,0.04)' }}
            whileTap={{ scale: 0.92 }}
            onClick={onKillTerminal}
            className="h-full px-2.5 flex items-center transition-colors group"
            title="Kill Terminal (Ctrl+Shift+W)"
          >
            <Trash2 size={12} className="text-[rgba(100,110,130,0.3)] group-hover:text-[rgba(60,70,90,0.5)] transition-colors" strokeWidth={1.5} />
          </motion.button>
        </div>
      </motion.div>

      {/* ── Terminal Viewport ── */}
      <motion.div
        key={activeTerminalId}
        variants={terminalViewportVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        transition={{ duration: 0.15, ease: [0.25, 0.1, 0.25, 1] }}
        className="flex-1 min-h-0 relative overflow-hidden"
        style={{ background: 'transparent' }}
        onDragOver={(e) => {
          // ── Drag from file explorer ──
          if (e.dataTransfer.types?.includes('text/uri-list') || e.dataTransfer.types?.includes('Files') || e.dataTransfer.types?.includes('text/plain')) {
            e.preventDefault();
            e.stopPropagation();
          }
        }}
        onDragEnter={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setDropZoneVisible?.(true);
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setDropZoneVisible?.(false);
        }}
        onDrop={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setDropZoneVisible?.(false);
          const path = e.dataTransfer.getData('text/plain');
          const uri = e.dataTransfer.getData('text/uri-list');
          const files = e.dataTransfer.files;
          let filePath = '';
          if (path) filePath = path;
          else if (uri) filePath = uri;
          else if (files?.length > 0) filePath = files[0].name;
          if (filePath && activeTerminalIdForViewport) {
            const escaped = filePath.includes(' ') ? `'${filePath}'` : filePath;
            const sock = getSocket();
            sock?.emit('terminal-input', { terminalId: activeTerminalIdForViewport, data: escaped });
            setTimeout(() => {
              sock?.emit('terminal-input', { terminalId: activeTerminalIdForViewport, data: ' ' });
            }, 50);
          }
        }}
      >
        {/* Subtle inner border */}
        <div
          className="absolute inset-0 pointer-events-none z-10"
          style={{
            boxShadow: 'inset 0 1px 0 rgba(0,0,0,0.03)',
          }}
        />

        {/* ── Drop zone overlay ── */}
        <AnimatePresence>
          {dropZoneVisible && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-30 flex items-center justify-center pointer-events-none"
              style={{
                background: 'rgba(0,122,204,0.06)',
                border: '2px dashed rgba(0,122,204,0.3)',
                backdropFilter: 'blur(4px)',
              }}
            >
              <span className="text-[13px] font-medium text-[rgba(0,122,204,0.5)]">
                Drop file to paste path
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Visual bell flash overlay ── */}
        <AnimatePresence>
          {bellFlash?.[activeTerminalIdForViewport] && (
            <motion.div
              key={bellFlash[activeTerminalId]}
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.15 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.1 }}
              className="absolute inset-0 z-20 pointer-events-none"
              style={{
                background: 'radial-gradient(ellipse at center, rgba(255,255,255,0.6) 0%, transparent 70%)',
              }}
            />
          )}
        </AnimatePresence>

        {/* xterm container */}
        <div
          ref={(el) => { terminalContainerRefs.current[groupId] = el; }}
          className="w-full h-full relative z-0"
        />

        {/* Search overlay */}
        <TerminalSearch
          searchAddon={xtermInstances.current[activeTerminalId]?.searchAddon || null}
        />
      </motion.div>
    </motion.div>
  );
}

// ── Split Divider ──
function SplitDivider({ direction }) {
  const isHorizontal = direction === 'horizontal';
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`
        ${isHorizontal ? 'w-[3px] cursor-col-resize' : 'h-[3px] cursor-row-resize'}
        flex-shrink-0 relative group transition-all duration-200
      `}
      style={{
        background: isHovered
          ? 'rgba(184,148,80,0.2)'
          : 'rgba(0,0,0,0.04)',
      }}
    >
      {/* Hover glow */}
      <motion.div
        animate={{
          opacity: isHovered ? 1 : 0,
        }}
        className={`absolute ${isHorizontal ? 'inset-y-0 -left-3 -right-3' : 'inset-x-0 -top-3 -bottom-3'} pointer-events-none`}
        style={{
          background: isHorizontal
            ? 'radial-gradient(ellipse at center, rgba(184,148,80,0.1) 0%, transparent 70%)'
            : 'radial-gradient(ellipse at center, rgba(184,148,80,0.1) 0%, transparent 70%)',
        }}
      />

      {/* Center dot on hover */}
      <div className={`absolute ${isHorizontal ? 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2' : 'left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2'}`}>
        <motion.div
          animate={{
            scale: isHovered ? 1 : 0,
            opacity: isHovered ? 1 : 0,
          }}
          className={`${isHorizontal ? 'w-[6px] h-[6px]' : 'w-[6px] h-[6px]'} rounded-full`}
          style={{
            background: '#b89450',
            boxShadow: '0 0 6px rgba(184,148,80,0.3)',
          }}
        />
      </div>
    </motion.div>
  );
}

// ── Main XTerminal ──
export default function XTerminal() {
  const terminalContainerRefs = useRef({});
  const xtermInstances = useRef({});
  const [dropdownGroup, setDropdownGroup] = useState(null);
  const [dragIndex, setDragIndex] = useState(null);

  // ── Output queue: buffers output for terminals whose xterm instance isn't ready yet ──
  const outputQueue = useRef({}); // { [terminalId]: string[] }

  const flushOutputQueue = useCallback((terminalId) => {
    const queue = outputQueue.current[terminalId];
    if (!queue || queue.length === 0) return;
    const instance = xtermInstances.current[terminalId];
    if (!instance?.term) return;
    queue.forEach((chunk) => instance.term.write(chunk));
    delete outputQueue.current[terminalId];
  }, []);

  const [dropZoneVisible, setDropZoneVisible] = useState(false);
  const [bellFlash, setBellFlash] = useState({}); // { [terminalId]: timestamp }
  const bellFlashTimeouts = useRef({});

  const {
    terminals,
    terminalLayout,
    activeTerminalId,
    renamingTerminalId,
    selectedTerminalIds,
    terminalThemeOverrides,
    createTerminal,
    createTerminalInGroup,
    killTerminal,
    toggleTerminalSelection,
    killSelectedTerminals,
    clearSelectedTerminals,
    setActiveTerminal,
    renameTerminal,
    finishRenaming,
    moveTerminal,
    splitTerminal,
    toggleSearch,
    clearTerminal,
    showContextMenu,
    initialize,
  } = useTerminal();

  const socket = getSocket();
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

      // ── Write output ──
      const cleanOut = typeof out === 'string' ? out.replace(/\x07/g, '') : out;
      const instance = xtermInstances.current[terminalId];
      if (instance?.term) {
        instance.term.write(cleanOut);
      } else {
        if (!outputQueue.current[terminalId]) outputQueue.current[terminalId] = [];
        outputQueue.current[terminalId].push(cleanOut);
      }
    };

    const onTerminalCreated = (data) => {
      const { terminalId } = data;
      // Flush any queued output that arrived before the instance was ready
      flushOutputQueue(terminalId);
    };

    const onTerminalError = (error) => {
      const msg = typeof error === 'object' ? error.error || error.message || JSON.stringify(error) : error;
      const targetId = error?.terminalId;
      const instance = xtermInstances.current[targetId];
      if (instance?.term) {
        instance.term.write(`\x1b[38;2;255;45;149m${msg}\x1b[0m\r\n`);
      } else if (targetId) {
        // Queue error output too
        if (!outputQueue.current[targetId]) outputQueue.current[targetId] = [];
        outputQueue.current[targetId].push(`\x1b[38;2;255;45;149m${msg}\x1b[0m\r\n`);
      }
    };

    const onTerminalExit = (data) => {
      if (!data.terminalId) return;
      const exitMsg = `\r\n\x1b[38;2;64;64;104m[Process exited ${data.exitCode !== null ? `with code ${data.exitCode}` : ''}]\x1b[0m\r\n`;
      const instance = xtermInstances.current[data.terminalId];
      if (instance?.term) {
        instance.term.write(exitMsg);
      } else {
        // Queue exit message too
        if (!outputQueue.current[data.terminalId]) outputQueue.current[data.terminalId] = [];
        outputQueue.current[data.terminalId].push(exitMsg);
      }
    };

    socket.on('terminal-output', onTerminalOutput);
    socket.on('terminal-created', onTerminalCreated);
    socket.on('terminal-error', onTerminalError);
    socket.on('terminal-exit', onTerminalExit);

    return () => {
      socket.off('terminal-output', onTerminalOutput);
      socket.off('terminal-created', onTerminalCreated);
      socket.off('terminal-error', onTerminalError);
      socket.off('terminal-exit', onTerminalExit);
    };
  }, [socket, flushOutputQueue]);

  // ── Resolve theme for a terminal (per-terminal override or default) ──
  const resolveTerminalTheme = useCallback((terminalId) => {
    const themeKey = terminalThemeOverrides[terminalId];
    if (themeKey && TERMINAL_THEMES[themeKey]) {
      return TERMINAL_THEMES[themeKey];
    }
    return AETHER_TERMINAL_THEME;
  }, [terminalThemeOverrides]);

  // ── Create xterm instance ──
  const createXTermInstance = useCallback((terminalId) => {
    if (xtermInstances.current[terminalId]) return;
    const currentTerminals = terminalsRef.current;
    const terminal = currentTerminals.find((t) => t.id === terminalId);
    if (!terminal) return;

    const termTheme = resolveTerminalTheme(terminalId);
    const term = new Terminal({
      cursorBlink: true,
      cursorStyle: 'bar',
      cursorWidth: 2,
      theme: termTheme,
      fontFamily: "'SF Mono', 'Fira Code', 'Cascadia Code', 'JetBrains Mono', 'Menlo', 'Consolas', monospace",
      fontSize: 13,
      lineHeight: 1.4,
      allowTransparency: true,
      drawBoldTextInBrightColors: true,
      minimumContrastRatio: 5,
      experimentalCharAtlas: 'dynamic',
      allowProposedApi: true,
      scrollback: 10000,
    });

    const fitAddon = new FitAddon();
    const searchAddon = new SearchAddon();
    const webLinksAddon = new WebLinksAddon((_event, uri) => {
      window.open(uri, '_blank', 'noopener,noreferrer');
    });
    const unicode11Addon = new Unicode11Addon();

    term.loadAddon(fitAddon);
    term.loadAddon(searchAddon);
    term.loadAddon(webLinksAddon);
    term.loadAddon(unicode11Addon);
    term.unicode.active = 'unicode11';

    const groupId = terminal.groupId;
    const container = terminalContainerRefs.current[groupId];
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

    xtermInstances.current[terminalId] = { term, fitAddon, searchAddon, container: termDiv };

    // Flush any queued output that arrived before the xterm instance was ready
    flushOutputQueue(terminalId);

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
    // Clean up any buffered output for this terminal
    delete outputQueue.current[terminalId];

    if (!instance) return;
    const { term, fitAddon, searchAddon, _cleanup } = instance;

    if (_cleanup) {
      _cleanup.resizeObserver.disconnect();
      _cleanup.container?.removeEventListener('click', _cleanup.handleContainerClick);
      _cleanup.container?.remove();
    }

    try { fitAddon.dispose(); } catch (e) { /* noop */ }
    try { searchAddon.dispose(); } catch (e) { /* noop */ }
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

  // ── Show/hide terminals ──
  useEffect(() => {
    Object.entries(xtermInstances.current).forEach(([id, instance]) => {
      if (instance.container) {
        instance.container.style.display = id === activeTerminalId ? 'block' : 'none';
      }
    });
    const active = xtermInstances.current[activeTerminalId];
    if (active?.term) {
      try { active.fitAddon.fit(); } catch (e) { /* noop */ }
      setTimeout(() => active.term.focus(), 20);
    }
  }, [activeTerminalId]);

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
  const handleCreateTerminal = useCallback((shell) => createTerminal(shell), [createTerminal]);
  const handleKillTerminal = useCallback(() => {
    if (activeTerminalId) killTerminal(activeTerminalId);
  }, [activeTerminalId, killTerminal]);
  const handleSelectTerminal = useCallback((id, keepSelection = false) => setActiveTerminal(id, keepSelection), [setActiveTerminal]);
  const handleCloseTab = useCallback((id) => killTerminal(id), [killTerminal]);
  const handleRenameTerminal = useCallback((id, name) => {
    if (name) renameTerminal(id, name);
    finishRenaming();
  }, [renameTerminal, finishRenaming]);
  const handleToggleSearch = useCallback(() => toggleSearch(), [toggleSearch]);
  const handleClearTerminal = useCallback(() => {
    if (activeTerminalId) {
      const instance = xtermInstances.current[activeTerminalId];
      if (instance?.term) instance.term.clear();
      clearTerminal(activeTerminalId);
    }
  }, [activeTerminalId, clearTerminal]);
  const handleContextMenu = useCallback((x, y, terminalId) => showContextMenu(x, y, terminalId), [showContextMenu]);
  const handleCopy = useCallback(() => {
    const instance = xtermInstances.current[activeTerminalId];
    if (instance?.term) {
      const s = instance.term.getSelection();
      if (s) navigator.clipboard.writeText(s);
      instance.term.clearSelection();
    }
  }, [activeTerminalId]);
  const handlePaste = useCallback(() => {
    navigator.clipboard.readText().then((text) => {
      if (text && activeTerminalId) socket?.emit('terminal-input', { terminalId: activeTerminalId, data: text });
    });
  }, [activeTerminalId, socket]);

  // ── Drag handlers ──
  const handleDragStart = useCallback((e, index) => { setDragIndex(index); e.dataTransfer.effectAllowed = 'move'; }, []);
  const handleDragOver = useCallback((e, _index) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; }, []);
  const handleDrop = useCallback((e, dropIndex) => {
    e.preventDefault();
    if (dragIndex !== null && dragIndex !== dropIndex) moveTerminal(dragIndex, dropIndex);
    setDragIndex(null);
  }, [dragIndex, moveTerminal]);
  const handleDragEnd = useCallback(() => setDragIndex(null), []);

  // ── Keyboard shortcuts ──
  useEffect(() => {
    const handleKeyDown = (e) => {
      const tag = e.target?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;

      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === '`') { e.preventDefault(); handleCreateTerminal(); return; }
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === '5') { e.preventDefault(); splitTerminal(); return; }
      if ((e.ctrlKey || e.metaKey) && e.key === 'f') { e.preventDefault(); handleToggleSearch(); return; }
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'c' || e.key === 'C')) { e.preventDefault(); handleCopy(); return; }
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'v' || e.key === 'V')) { e.preventDefault(); handlePaste(); return; }

      if ((e.ctrlKey || e.metaKey) && e.key === 'l') {
        const active = xtermInstances.current[activeTerminalId];
        if (active?.term && active.term.element?.contains(document.activeElement)) { e.preventDefault(); handleClearTerminal(); }
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'w' || e.key === 'W')) { e.preventDefault(); handleKillTerminal(); return; }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeTerminalId, handleCreateTerminal, handleClearTerminal, handleCopy, handleKillTerminal, handlePaste, handleToggleSearch, splitTerminal]);

  // ── Render split layout ──
  const renderLayout = useCallback((layout) => {
    if (!layout) return null;

    if (layout.type === 'group') {
      return (
        <TerminalGroup
          key={layout.id}
          groupId={layout.id}
          terminals={terminals}
          activeTerminalId={activeTerminalId}
          onSelectTerminal={handleSelectTerminal}
          selectedTerminalIds={selectedTerminalIds}
          onToggleTerminalSelection={toggleTerminalSelection}
          onCloseTab={handleCloseTab}
          onContextMenu={handleContextMenu}
          onRenameTerminal={handleRenameTerminal}
          renamingTerminalId={renamingTerminalId}
          onCreateTerminal={() => createTerminalInGroup(layout.id)}
          xtermInstances={xtermInstances}
          terminalContainerRefs={terminalContainerRefs}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
          onDrop={handleDrop}
          onKillTerminal={handleKillTerminal}
          onKillSelected={killSelectedTerminals}
          onClearSelected={clearSelectedTerminals}
          onToggleDropdown={(groupId) => setDropdownGroup((prev) => prev === groupId ? null : groupId)}
          dropdownOpen={dropdownGroup === layout.id}
          dropZoneVisible={dropZoneVisible}
          setDropZoneVisible={setDropZoneVisible}
          bellFlash={bellFlash}
          activeTerminalIdForViewport={activeTerminalId}
        />
      );
    }

    if (layout.type === 'split') {
      return (
        <motion.div
          layout
          className={`flex ${layout.direction === 'horizontal' ? 'flex-row' : 'flex-col'} flex-1 min-h-0 min-w-0`}
          transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
        >
          {layout.children.map((child, index) => (
            <React.Fragment key={index}>
              {index > 0 && (
                <SplitDivider direction={layout.direction} />
              )}
              <motion.div
                layout
                className={`flex ${layout.direction === 'horizontal' ? 'flex-1 min-w-0' : 'flex-1 min-h-0'}`}
                style={layout.sizes ? { flexBasis: `${layout.sizes[index]}%` } : { flex: 1 }}
                transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
              >
                {renderLayout(child)}
              </motion.div>
            </React.Fragment>
          ))}
        </motion.div>
      );
    }
    return null;
  }, [
    terminals, activeTerminalId, selectedTerminalIds, renamingTerminalId, handleSelectTerminal, handleCloseTab,
    handleContextMenu, handleRenameTerminal, createTerminalInGroup, handleKillTerminal,
    handleDragStart, handleDragOver, handleDragEnd, handleDrop, dropdownGroup,
    killSelectedTerminals, clearSelectedTerminals, toggleTerminalSelection,
    setDropZoneVisible, bellFlash,
  ]);

  if (terminals.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
      className="h-full flex flex-col relative overflow-hidden bg-white/60 backdrop-blur-3xl shadow-[0_8px_30px_rgba(0,0,0,0.04)]"
    >

      {/* Subtle ambient light at top */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[60%] h-[1px] pointer-events-none"
        style={{
          background: 'linear-gradient(90deg, transparent, rgba(0,122,204,0.2), transparent)',
        }}
      />

      {/* Terminal panes */}
      <div className="flex-1 min-h-0 overflow-hidden relative z-0">
        {renderLayout(terminalLayout)}
      </div>

      {/* Bottom accent line */}
      <div
        className="absolute bottom-0 left-4 right-4 h-[1px] pointer-events-none"
        style={{
          background: 'linear-gradient(90deg, transparent, rgba(0,0,0,0.03), transparent)',
        }}
      />

      {/* Context menu */}
      <TerminalContextMenu onCopy={handleCopy} onPaste={handlePaste} />
    </motion.div>
  );
}
