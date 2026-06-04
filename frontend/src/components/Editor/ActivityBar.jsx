import React, { useRef, useCallback, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Files, Search, GitBranch, Bug, Puzzle, FlaskConical,
  Bot, Users, FileText, Settings,
} from 'lucide-react';
import { useWorkspace } from '../../stores/useWorkspace';
import { useAuth } from '../../stores/useAuth';

const sidebarViews = [
  { id: 'explorer', icon: Files, label: 'Explorer (Ctrl+Shift+E)' },
  { id: 'search', icon: Search, label: 'Search (Ctrl+Shift+F)' },
  { id: 'source-control', icon: GitBranch, label: 'Source Control (Ctrl+Shift+G)' },
  { id: 'debug', icon: Bug, label: 'Run and Debug (Ctrl+Shift+D)' },
  { id: 'extensions', icon: Puzzle, label: 'Extensions (Ctrl+Shift+X)' },
  // { id: 'tests', icon: FlaskConical, label: 'Tests' }, // hidden — no sidebar view component registered yet
];

const rightPanelViews = [
  { id: 'ai', icon: Bot, label: 'AI Chat' },
  { id: 'collab', icon: Users, label: 'People' },
  { id: 'outline', icon: FileText, label: 'Outline' },
];

// ── VS Code-style Manage menu (gear dropdown) ──
const manageItems = [
  { id: 'command-palette', label: 'Command Palette...', shortcut: 'Ctrl+Shift+P' },
  { id: 'settings', label: 'Settings', shortcut: 'Ctrl+,' },
  { id: 'color-theme', label: 'Color Theme...', shortcut: 'Ctrl+K Ctrl+T' },
  { id: 'keyboard-shortcuts', label: 'Keyboard Shortcuts', shortcut: 'Ctrl+K Ctrl+S' },
  { type: 'divider' },
  { id: 'profiles', label: 'Profiles', shortcut: '' },
  { type: 'divider' },
  { id: 'check-updates', label: 'Check for Updates...', shortcut: '' },
  { id: 'about', label: 'About AetherStudio', shortcut: '' },
];

function ManageMenu() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(0);
  const ref = useRef(null);

  useEffect(() => {
    const handleClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    if (open) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  const handleAction = (actionId) => {
    setOpen(false);
    const state = useWorkspace.getState();
    switch (actionId) {
      case 'command-palette':
        state.toggleCommandPalette();
        break;
      case 'settings':
        state.setRightPanelTab('settings');
        if (!state.rightPanelOpen) state.toggleRightPanel();
        break;
      case 'color-theme':
        // Cycle through themes like VS Code
        const themes = ['nexus-dark', 'nexus-light', 'monokai', 'github-dark', 'one-dark-pro'];
        const current = state.settings.theme;
        const idx = themes.indexOf(current);
        const next = themes[(idx + 1) % themes.length];
        state.updateSetting('theme', next);
        break;
      case 'keyboard-shortcuts':
        state.toggleCommandPalette();
        break;
      case 'profiles':
        navigate('/profile');
        break;
      case 'check-updates':
        alert('AetherStudio is up to date. (Version 1.0.0)');
        break;
      case 'about':
        alert('AetherStudio — AI-Powered Collaborative IDE\n\nVersion: 1.0.0\n\nBuilt with React, Monaco Editor, and Socket.IO');
        break;
    }
  };

  const handleKeyDown = (e) => {
    const items = manageItems.filter(i => i.type !== 'divider');
    switch (e.key) {
      case 'ArrowDown': e.preventDefault(); setFocusedIndex(i => Math.min(i + 1, items.length - 1)); break;
      case 'ArrowUp': e.preventDefault(); setFocusedIndex(i => Math.max(i - 1, 0)); break;
      case 'Enter': e.preventDefault(); if (items[focusedIndex]) handleAction(items[focusedIndex].id); break;
      case 'Escape': e.preventDefault(); setOpen(false); break;
    }
  };

  return (
    <div ref={ref} className="relative">
      <motion.button
        initial={{ opacity: 0, x: -12, scale: 0.8 }}
        animate={{ opacity: 1, x: 0, scale: 1 }}
        transition={{ delay: 0.15 + (sidebarViews.length + rightPanelViews.length) * 0.035 + 0.1, duration: 0.35, ease: [0.25, 0.1, 0.25, 1] }}
        whileHover={{ scale: 1.08, color: 'rgba(255,255,255,0.4)' }}
        whileTap={{ scale: 0.92 }}
        onClick={() => { setOpen(!open); setFocusedIndex(0); }}
        className="relative w-[40px] h-[40px] flex items-center justify-center rounded-xl group"
        title="Manage"
        style={{
          color: open ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.15)',
          background: open ? 'rgba(255,255,255,0.04)' : 'transparent',
        }}
      >
        <Settings size={18} strokeWidth={open ? 2.2 : 1.5} />
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.96 }}
            transition={{ duration: 0.12, ease: [0.25, 0.1, 0.25, 1] }}
            className="absolute left-0 bottom-full mb-0.5 min-w-[200px] overflow-y-auto"
            style={{
              background: 'rgba(18,18,22,0.95)',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: '8px',
              boxShadow: '0 8px 32px rgba(0,0,0,0.6), 0 2px 8px rgba(0,0,0,0.4)',
              backdropFilter: 'blur(40px)',
              WebkitBackdropFilter: 'blur(40px)',
              maxHeight: '50vh',
              scrollbarWidth: 'thin',
              scrollbarColor: 'rgba(255,255,255,0.08) transparent',
            }}
            onKeyDown={handleKeyDown}
          >
            <div className="py-1">
              {manageItems.map((item, idx) => {
                if (item.type === 'divider') {
                  return <div key={`d-${idx}`} className="my-1 mx-3" style={{ height: '1px', background: 'rgba(255,255,255,0.06)' }} />;
                }
                const menuIdx = manageItems.filter(i => i.type !== 'divider').indexOf(item);
                const isSelected = focusedIndex === menuIdx;
                const Icon = item.icon;
                return (
                  <motion.button
                    key={item.id}
                    onClick={() => handleAction(item.id)}
                    onMouseEnter={() => setFocusedIndex(menuIdx)}
                    className="w-full flex items-center gap-2.5 px-3 py-1.5 text-[12px] transition-all duration-75 cursor-pointer"
                    style={{
                      color: isSelected ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.4)',
                      background: isSelected ? 'rgba(255,255,255,0.04)' : 'transparent',
                      borderLeft: isSelected ? '2px solid rgba(255,255,255,0.3)' : '2px solid transparent',
                    }}
                  >
                    {Icon && <Icon size={13} style={{ color: isSelected ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.2)' }} />}
                    <span className="flex-1 text-left">{item.label}</span>
                    {item.shortcut && <kbd style={{ color: 'rgba(255,255,255,0.15)', fontSize: '10px' }}>{item.shortcut}</kbd>}
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ActivityButton({ isActive, Icon, onClick, label, index }) {
  return (
    <motion.button
      initial={{ opacity: 0, x: -12, scale: 0.8 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      transition={{ delay: 0.15 + index * 0.035, duration: 0.35, ease: [0.25, 0.1, 0.25, 1] }}
      onClick={onClick}
      className={`relative w-[40px] h-[40px] flex items-center justify-center rounded-xl transition-colors group ${
        isActive ? 'scale-105' : ''
      }`}
      title={label}
      whileHover={{ scale: 1.08 }}
      whileTap={{ scale: 0.92 }}
      style={{
        color: isActive
          ? 'rgba(255,255,255,0.5)'
          : 'rgba(255,255,255,0.2)',
        textShadow: isActive
          ? '0 0 12px rgba(255,255,255,0.1)'
          : 'none',
        background: isActive
          ? 'rgba(255,255,255,0.04)'
          : 'transparent',
        boxShadow: isActive
          ? 'inset 0 0 20px rgba(255,255,255,0.02)'
          : 'none',
        transition: 'all 0.2s cubic-bezier(0.25, 0.1, 0.25, 1)',
      }}
      onMouseEnter={(e) => {
        if (!isActive) {
          e.currentTarget.style.color = 'rgba(255,255,255,0.4)';
          e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
        }
      }}
      onMouseLeave={(e) => {
        if (!isActive) {
          e.currentTarget.style.color = 'rgba(255,255,255,0.2)';
          e.currentTarget.style.background = 'transparent';
        }
      }}
    >
      {/* Active glow aura */}
      {isActive && (
        <motion.div
          layoutId="activityGlow"
          className="absolute inset-[-4px] rounded-xl pointer-events-none"
          style={{
            background: 'radial-gradient(circle, rgba(255,255,255,0.04) 0%, transparent 70%)',
          }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        />
      )}

      <Icon size={20} strokeWidth={isActive ? 2.2 : 1.5} />
    </motion.button>
  );
}

export default function ActivityBar() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    activeSidebarView, setActiveSidebarView, sidebarOpen,
    rightPanelTab, rightPanelOpen, setRightPanelTab,
  } = useWorkspace();

  const pillRef = useRef(null);

  // Mouse-tracking spotlight handler
  const handleMouseMove = useCallback((e) => {
    if (!pillRef.current) return;
    const rect = pillRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    pillRef.current.style.setProperty('--mouse-x', `${x}%`);
    pillRef.current.style.setProperty('--mouse-y', `${y}%`);
  }, []);

  const handleMouseLeave = useCallback(() => {
    if (!pillRef.current) return;
    pillRef.current.style.setProperty('--mouse-x', '50%');
    pillRef.current.style.setProperty('--mouse-y', '50%');
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
      className="flex-shrink-0 flex flex-col items-center select-none self-stretch"
    >
      {/* ── Dark Glass Pill ── */}
      <div
        ref={pillRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className="relative flex flex-col items-center py-4 px-2 gap-0.5 h-full"
        style={{
          background: 'rgba(20,20,26,0.85)',
          backdropFilter: 'blur(20px) saturate(1.5)',
          WebkitBackdropFilter: 'blur(20px) saturate(1.5)',
          borderLeft: '1px solid rgba(255,255,255,0.08)',
          borderTop: '1px solid rgba(255,255,255,0.08)',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          boxShadow: `
            0 1px 2px rgba(0,0,0,0.3),
            0 4px 12px rgba(0,0,0,0.4),
            0 12px 24px rgba(0,0,0,0.35),
            inset 0 1px 0 rgba(255,255,255,0.05)
          `,
        }}
      >
        {/* Subtle ambient light overlay */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'radial-gradient(500px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), rgba(74,158,255,0.03) 0%, transparent 60%)',
            transition: 'background 0.08s ease-out',
          }}
        />
        {/* ── Top section — Sidebar Views ── */}
        <div className="flex flex-col items-center gap-0.5">
          {sidebarViews.map((view, idx) => (
            <ActivityButton
              key={view.id}
              index={idx}
              isActive={activeSidebarView === view.id && sidebarOpen}
              Icon={view.icon}
              onClick={() => setActiveSidebarView(view.id)}
              label={view.label}
            />
          ))}
        </div>

        {/* ── Divider ── */}
        <div
          className="w-[24px] h-px my-2"
          style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.06), transparent)' }}
        />

        {/* ── Middle section — Right Panel Views ── */}
        <div className="flex flex-col items-center gap-0.5">
          {rightPanelViews.map((view, idx) => (
            <ActivityButton
              key={view.id}
              index={idx + sidebarViews.length}
              isActive={rightPanelTab === view.id && rightPanelOpen}
              Icon={view.icon}
              onClick={() => setRightPanelTab(view.id)}
              label={view.label}
            />
          ))}
        </div>

        {/* ── Spacer to push bottom section down ── */}
        <div className="flex-1" />

        {/* ── Divider ── */}
        <div
          className="w-[24px] h-px mb-2"
          style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.06), transparent)' }}
        />

        {/* ── Bottom section — Accounts & Settings ── */}
        <div className="flex flex-col items-center gap-0.5">
          {/* Profile / Account */}
          <motion.button
            initial={{ opacity: 0, x: -12, scale: 0.8 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            transition={{ delay: 0.15 + (sidebarViews.length + rightPanelViews.length) * 0.035 + 0.05, duration: 0.35, ease: [0.25, 0.1, 0.25, 1] }}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.92 }}
            onClick={() => navigate('/profile')}
            className="relative w-[40px] h-[40px] flex items-center justify-center rounded-xl group"
            title={user?.name || 'Account'}
            style={{ color: 'rgba(255,255,255,0.2)' }}
          >
            {user?.avatar ? (
              <img
                src={user.avatar}
                alt={user.name}
                className="w-[22px] h-[22px] rounded-full object-cover"
                style={{ border: '1px solid rgba(74,158,255,0.2)' }}
              />
            ) : (
              <div
                className="w-[22px] h-[22px] rounded-full flex items-center justify-center"
                style={{
                  background: 'rgba(74,158,255,0.08)',
                  border: '1px solid rgba(74,158,255,0.15)',
                }}
              >
                <span className="text-[8px] font-bold" style={{ color: 'rgba(74,158,255,0.5)' }}>
                  {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                </span>
              </div>
            )}
          </motion.button>

          {/* Manage (gear dropdown) */}
          <ManageMenu />
        </div>
      </div>
    </motion.div>
  );
}
