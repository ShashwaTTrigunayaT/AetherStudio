import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTerminal, SHELL_OPTIONS, TERMINAL_THEMES } from '../../stores/useTerminal';
import {
  Plus,
  SplitSquareVertical,
  Pencil,
  Trash2,
  Copy,
  Clipboard,
  Eraser,
  Terminal,
  Palette,
  XCircle,
  Layers,
  ChevronRight,
} from 'lucide-react';

export default function TerminalContextMenu({ onCopy, onPaste }) {
  const menuRef = useRef(null);
  const {
    contextMenu,
    hideContextMenu,
    createTerminal,
    splitTerminal,
    startRenaming,
    killTerminal,
    clearTerminal,
    activeTerminalId,
  } = useTerminal();

  useEffect(() => {
    if (!contextMenu) return;

    const handleClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        hideContextMenu();
      }
    };
    const handleEsc = (e) => {
      if (e.key === 'Escape') hideContextMenu();
    };

    setTimeout(() => {
      document.addEventListener('mousedown', handleClick);
      document.addEventListener('keydown', handleEsc);
    }, 0);

    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleEsc);
    };
  }, [contextMenu, hideContextMenu]);

  if (!contextMenu) return null;

  // ── Animation Variants ──
  const menuVariants = {
    hidden: { opacity: 0, scale: 0.96, y: -6 },
    visible: {
      opacity: 1, scale: 1, y: 0,
      transition: { duration: 0.12, ease: [0.25, 0.1, 0.25, 1] },
    },
    exit: {
      opacity: 0, scale: 0.96, y: -6,
      transition: { duration: 0.08, ease: 'easeIn' },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -6 },
    visible: (i) => ({
      opacity: 1, x: 0,
      transition: { delay: i * 0.015, duration: 0.12, ease: [0.25, 0.1, 0.25, 1] },
    }),
  };

  const {
    terminalProfiles,
    activeProfileId,
    setActiveProfile,
    addCustomProfile,
    removeCustomProfile,
    terminalThemeOverrides,
    setTerminalTheme,
    clearTerminalTheme,
    killSelectedTerminals,
    clearSelectedTerminals,
  } = useTerminal();

  const items = [
    {
      type: 'action', label: 'New Terminal', icon: Plus, shortcut: 'Ctrl+Shift+`',
      action: () => { createTerminal(); hideContextMenu(); },
    },
    {
      type: 'action', label: 'Split Terminal', icon: SplitSquareVertical, shortcut: 'Ctrl+Shift+5',
      action: () => { splitTerminal(); hideContextMenu(); },
    },
    { type: 'separator' },
    {
      type: 'action', label: 'Copy', icon: Copy, shortcut: 'Ctrl+Shift+C',
      action: () => { onCopy?.(); hideContextMenu(); },
    },
    {
      type: 'action', label: 'Paste', icon: Clipboard, shortcut: 'Ctrl+Shift+V',
      action: () => { onPaste?.(); hideContextMenu(); },
    },
    { type: 'separator' },
    {
      type: 'action', label: 'Rename...', icon: Pencil,
      action: () => { startRenaming(contextMenu.terminalId || activeTerminalId); hideContextMenu(); },
    },
    // ── Terminal Profile Submenu ──
    {
      type: 'submenu', label: 'Terminal Profile', icon: Layers,
      children: terminalProfiles.map((profile) => ({
        label: profile.name,
        description: profile.shell + (Object.keys(profile.env).length > 0 ? ` (env: ${Object.keys(profile.env).join(', ')})` : ''),
        active: profile.id === activeProfileId,
        action: () => {
          setActiveProfile(profile.id);
          hideContextMenu();
        },
      })).concat([
        { type: 'separator' },
        {
          label: 'Save Custom Profile...',
          description: 'Save current shell config as a new profile',
          action: () => {
            const name = prompt('Profile name:');
            if (name) {
              addCustomProfile({ name, shell: 'bash', env: {} });
            }
            hideContextMenu();
          },
        },
      ]),
    },
    // ── Terminal Theme Submenu ──
    {
      type: 'submenu', label: 'Terminal Theme', icon: Palette,
      children: Object.entries(TERMINAL_THEMES).map(([key, theme]) => {
        const tid = contextMenu.terminalId || activeTerminalId;
        const isActive = terminalThemeOverrides[tid] === key || (!terminalThemeOverrides[tid] && key === 'aether-light');
        return {
          label: theme.name,
          description: `Background: ${theme.background}`,
          active: isActive,
          action: () => {
            setTerminalTheme(tid, key);
            hideContextMenu();
          },
        };
      }).concat([
        { type: 'separator' },
        {
          label: 'Reset to Default',
          description: 'Clear per-terminal theme override',
          action: () => {
            const tid = contextMenu.terminalId || activeTerminalId;
            clearTerminalTheme(tid);
            hideContextMenu();
          },
        },
      ]),
    },
    // ── Shell Submenu ──
    {
      type: 'submenu', label: 'Select Default Shell', icon: Terminal,
      children: SHELL_OPTIONS.map((shell) => ({
        label: shell.label, description: shell.description,
        action: () => { createTerminal(shell.id); hideContextMenu(); },
      })),
    },
    { type: 'separator' },
    {
      type: 'action', label: 'Clear Terminal', icon: Eraser,
      action: () => { clearTerminal(contextMenu.terminalId || activeTerminalId); hideContextMenu(); },
    },
    {
      type: 'action', label: 'Clear All Selected', icon: Eraser,
      action: () => { clearSelectedTerminals(); hideContextMenu(); },
    },
    { type: 'separator' },
    {
      type: 'action', label: 'Kill Terminal', icon: Trash2, shortcut: 'Ctrl+Shift+W', danger: true,
      action: () => {
        const tid = contextMenu.terminalId || activeTerminalId;
        if (tid) killTerminal(tid);
        hideContextMenu();
      },
    },
    {
      type: 'action', label: 'Kill All Selected', icon: XCircle, danger: true,
      action: () => { killSelectedTerminals(); hideContextMenu(); },
    },
  ];

  return (
    <AnimatePresence>
      {contextMenu && (
        <motion.div
          ref={menuRef}
          variants={menuVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="fixed z-[99999] w-[240px] overflow-hidden py-1 rounded-lg shadow-2xl"
          style={{
            left: contextMenu.x,
            top: contextMenu.y,
            maxHeight: '400px',
            overflowY: 'auto',
            background: 'rgba(8,8,16,0.96)',
            backdropFilter: 'blur(24px) saturate(1.8)',
            WebkitBackdropFilter: 'blur(24px) saturate(1.8)',
            border: '1px solid rgba(0,240,255,0.12)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.8), 0 0 40px rgba(0,240,255,0.10), 0 0 80px rgba(0,240,255,0.04), inset 0 1px 0 rgba(0,240,255,0.08)',
          }}
        >
          {items.map((item, index) => {
            if (item.type === 'separator') {
              return (
                <motion.div
                  key={`sep-${index}`}
                  variants={itemVariants}
                  custom={index}
                  initial="hidden"
                  animate="visible"
                  className="h-px mx-3 my-1"
                  style={{ background: 'rgba(0,240,255,0.06)' }}
                />
              );
            }

            if (item.type === 'submenu') {
              return (
                <motion.div
                  key={item.label}
                  variants={itemVariants}
                  custom={index}
                  initial="hidden"
                  animate="visible"
                >
                  <SubmenuItem item={item} />
                </motion.div>
              );
            }

            const Icon = item.icon;
            return (
              <motion.button
                key={item.label}
                variants={itemVariants}
                custom={index}
                initial="hidden"
                animate="visible"
                whileHover={
                  item.danger
                    ? { backgroundColor: 'rgba(255,45,149,0.08)' }
                    : { backgroundColor: 'rgba(0,240,255,0.04)' }
                }
                whileTap={{ scale: 0.98 }}
                onClick={item.action}
                className={`w-full flex items-center gap-2.5 px-3 py-1.5 text-[12px] transition-colors text-left mx-1 rounded-md ${
                  item.danger
                    ? 'text-[#ff2d95]'
                    : 'text-[#8080b0]'
                }`}
              >
                <Icon size={13} className={`flex-shrink-0 ${item.danger ? 'opacity-70' : 'opacity-50 text-[#00f0ff]/60'}`} strokeWidth={1.5} />
                <span className="flex-1">{item.label}</span>
                {item.shortcut && (
                  <span className="text-[10px] text-[rgba(128,128,176,0.2)] ml-4 font-mono">{item.shortcut}</span>
                )}
              </motion.button>
            );
          })}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

const submenuVariants = {
  hidden: { opacity: 0, scale: 0.96, x: -6 },
  visible: {
    opacity: 1, scale: 1, x: 0,
    transition: { duration: 0.12, ease: [0.25, 0.1, 0.25, 1] },
  },
  exit: {
    opacity: 0, scale: 0.96, x: -6,
    transition: { duration: 0.08, ease: 'easeIn' },
  },
};

function SubmenuItem({ item }) {
  const [open, setOpen] = React.useState(false);
  const Icon = item.icon;

  // Find the active child (if any have active=true)
  const activeChild = item.children?.find((c) => c.active);

  return (
    <div
      className="relative mx-1"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <motion.button
        whileHover={{ backgroundColor: 'rgba(0,240,255,0.04)' }}
        whileTap={{ scale: 0.98 }}
        className="w-full flex items-center gap-2.5 px-3 py-1.5 text-[12px] text-[#8080b0] transition-colors text-left rounded-md"
      >
        <Icon size={13} className="flex-shrink-0 opacity-50 text-[#00f0ff]/60" strokeWidth={1.5} />
        <span className="flex-1">{item.label}</span>
        <motion.div
          animate={open ? { x: 3, opacity: 0.7 } : { x: 0, opacity: 0.3 }}
          transition={{ duration: 0.15 }}
        >
          <ChevronRight size={11} className="text-[rgba(128,128,176,0.3)]" strokeWidth={1.5} />
        </motion.div>
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            variants={submenuVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="absolute left-full top-0 ml-1 w-[200px] overflow-hidden py-1 rounded-lg shadow-2xl"
            style={{
              background: 'rgba(8,8,16,0.96)',
              backdropFilter: 'blur(24px) saturate(1.8)',
              WebkitBackdropFilter: 'blur(24px) saturate(1.8)',
              border: '1px solid rgba(0,240,255,0.12)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.8), 0 0 40px rgba(0,240,255,0.10), 0 0 80px rgba(0,240,255,0.04), inset 0 1px 0 rgba(0,240,255,0.08)',
            }}
          >
            {item.children.map((child, idx) => {
              if (child.type === 'separator') {
                return (
                  <div key={`sep-${idx}`} className="h-px mx-3 my-1" style={{ background: 'rgba(0,240,255,0.06)' }} />
                );
              }
              return (
                <motion.button
                  key={child.label}
                  initial={{ opacity: 0, x: -6 }}
                  animate={{
                    opacity: 1, x: 0,
                    transition: { delay: idx * 0.02, duration: 0.1 },
                  }}
                  whileHover={{ backgroundColor: child.danger ? 'rgba(255,45,149,0.08)' : 'rgba(0,240,255,0.04)' }}
                  whileTap={{ scale: 0.98 }}
                  onClick={child.action}
                  className={`w-full flex items-center gap-2 px-3 py-1.5 text-[12px] transition-colors text-left mx-1 rounded-md ${child.danger ? 'text-[#ff2d95]' : child.active ? 'text-[#00f0ff]' : 'text-[#8080b0]'}`}
                >
                  {child.active && (
                    <svg className="flex-shrink-0" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="rgba(0,240,255,0.8)" strokeWidth="3">
                      <path d="M20 6L9 17l-5-5" />
                    </svg>
                  )}
                  {!child.active && (
                    <Terminal size={12} className="flex-shrink-0 opacity-40 text-[#00f0ff]/50" strokeWidth={1.5} />
                  )}
                  <div className="flex flex-col">
                    <span className={child.active ? 'text-[rgba(200,200,220,0.8)]' : ''}>{child.label}</span>
                    {child.description && (
                      <span className="text-[10px] text-[rgba(128,128,176,0.3)]">{child.description}</span>
                    )}
                  </div>
                </motion.button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
