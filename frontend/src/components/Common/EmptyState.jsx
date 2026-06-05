import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  FilePlus2, FolderOpen, Terminal,
  Settings, Users, Clock,
  Command, Loader2, Folder,
} from 'lucide-react';
import AetherStudioLogo from './AetherStudioLogo';
import { useWorkspace } from '../../stores/useWorkspace';
import { api } from '../../lib/api';

const QUICK_ACTIONS = [
  { id: 'new-file', label: 'New File', icon: FilePlus2, shortcut: 'Ctrl+N' },
  { id: 'open-folder', label: 'Open Folder', icon: FolderOpen, shortcut: 'Ctrl+K' },
  { id: 'open-terminal', label: 'Open Terminal', icon: Terminal, shortcut: 'Ctrl+`' },
];

const CONFIG_ACTIONS = [
  { id: 'settings', label: 'Settings', icon: Settings, shortcut: 'Ctrl+,' },
  { id: 'collaborators', label: 'Collaborators', icon: Users, shortcut: '' },
];

// ─── Section header ──

function SectionHeader({ icon: Icon, label }) {
  return (
    <div className="flex items-center gap-2 px-1 mb-3">
      <Icon size={13} className="text-white/20" strokeWidth={1.8} />
      <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-white/20">
        {label}
      </span>
    </div>
  );
}

// ─── Inline keyboard shortcut ──
// Clean monospace text, no borders or badges — blends into text naturally

function Kbd({ children }) {
  return (
    <span className="font-mono text-[10px] text-white/30 select-none">
      {children}
    </span>
  );
}

// ─── Action row (used in both Quick Start and Configuration) ──

function ActionRow({ icon: Icon, label, shortcut, onClick, index }) {
  return (
    <motion.button
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.25 + index * 0.04, duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ x: 2 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="group flex items-center gap-3 w-full px-3 py-2 rounded-lg text-left
        transition-all duration-150 ease-out
        hover:bg-white/[0.03] active:bg-white/[0.05]"
    >
      <div className="flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-md
        bg-white/[0.03] group-hover:bg-white/[0.06] transition-colors duration-150"
      >
        <Icon size={13} className="text-white/25 group-hover:text-white/45 transition-colors duration-150" strokeWidth={1.8} />
      </div>
      <span className="flex-1 text-[12px] font-medium text-white/30 group-hover:text-white/55 transition-colors duration-150">
        {label}
      </span>
      {shortcut && (
        <span className="transition-opacity duration-150">
          <Kbd>{shortcut}</Kbd>
        </span>
      )}
    </motion.button>
  );
}

// ─── Background ambient glow ──

function AmbientGlow() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-60"
        style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 50%, transparent 100%)' }}
      />
      <motion.div
        className="absolute top-[15%] left-[20%] w-[300px] h-[300px] rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(200,200,208,0.04) 0%, transparent 60%)',
          filter: 'blur(80px)',
        }}
        animate={{ scale: [1, 1.1, 0.95, 1], x: [0, 20, -10, 0], y: [0, -10, 15, 0] }}
        transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute bottom-[20%] right-[15%] w-[400px] h-[400px] rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(48,209,88,0.02) 0%, transparent 60%)',
          filter: 'blur(100px)',
        }}
        animate={{ scale: [1, 0.9, 1.05, 1], opacity: [0.4, 0.7, 0.3, 0.5] }}
        transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut', delay: 4 }}
      />
    </div>
  );
}

// ─── Card wrapper ──

function BentoCard({ children, className = '' }) {
  return (
    <div className={`rounded-xl bg-white/[0.02] border border-white/[0.05]
      hover:bg-white/[0.04] hover:border-white/[0.2]
      transition-all duration-200 ease-out ${className}`}
    >
      {children}
    </div>
  );
}

// ─── Helper: time ago ──

function timeAgo(dateStr) {
  if (!dateStr) return null;
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;
  if (diffMs < 0) return null;
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hour${hrs === 1 ? '' : 's'} ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days} day${days === 1 ? '' : 's'} ago`;
  return `${Math.floor(days / 7)} week${days >= 14 ? 's' : ''} ago`;
}

// ─── Main EmptyState Component ──

export default function EmptyState() {
  const { setActiveSidebarView, toggleBottomPanel } = useWorkspace();
  const navigate = useNavigate();
  const [workspaces, setWorkspaces] = useState([]);
  const [loadingWorkspaces, setLoadingWorkspaces] = useState(true);
  const [workspaceError, setWorkspaceError] = useState(null);

  const fetchWorkspaces = useCallback(async () => {
    try {
      setLoadingWorkspaces(true);
      setWorkspaceError(null);
      const { data } = await api.get('/workspace');
      // Sort by most recently updated
      const sorted = (data || []).sort(
        (a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0)
      );
      setWorkspaces(sorted.slice(0, 5));
    } catch (err) {
      setWorkspaceError(err.message);
      setWorkspaces([]);
    } finally {
      setLoadingWorkspaces(false);
    }
  }, []);

  useEffect(() => {
    fetchWorkspaces();
  }, [fetchWorkspaces]);

  const handleAction = (id) => {
    switch (id) {
      case 'search':
        setActiveSidebarView('search');
        break;
      case 'open-terminal':
        toggleBottomPanel();
        break;
      case 'new-file':
        setActiveSidebarView('explorer');
        break;
      case 'open-folder':
        setActiveSidebarView('explorer');
        break;
      case 'collaborators':
        useWorkspace.getState().setRightPanelTab('collab');
        break;
      case 'settings':
        useWorkspace.getState().setRightPanelTab('settings');
        break;
      default:
        break;
    }
  };

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center overflow-hidden select-none
      bg-[#0b0b0f] px-6 py-8"
    >
      <AmbientGlow />

      <div className="relative z-10 w-full max-w-[640px] flex flex-col items-center">
        {/* ═══ Header ═══ */}
        <motion.div
          initial={{ opacity: 0, y: -12, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col items-center mb-8"
        >
          {/* Logo with glow */}
          <div className="relative mb-3">
            <motion.div
              animate={{ y: [0, -3, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            >
              <AetherStudioLogo size={40} animated />
            </motion.div>
            <div className="absolute inset-0 rounded-full blur-xl scale-150 opacity-60"
              style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 50%, transparent 100%)' }}
            />
          </div>

          {/* Title */}
          <h2 className="text-[18px] font-semibold tracking-tight text-white/70 mb-1">
            AetherStudio
          </h2>

          {/* Subtitle */}
          <p className="text-[12px] text-white/20 max-w-xs text-center leading-relaxed">
            Open a file or workspace to start building.
          </p>
        </motion.div>

        {/* ═══ Bento Grid — 60/40 ═══ */}
        <div className="w-full grid grid-cols-5 gap-3">
          {/* ═══ Left Column (60%) ═══ */}
          <div className="col-span-3 flex flex-col gap-3">
            {/* Recent Workspaces */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.12, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            >
              <BentoCard className="p-4">
                <SectionHeader icon={Clock} label="Recent Workspaces" />
                <div className="space-y-0.5">
                  {loadingWorkspaces ? (
                    <div className="flex items-center justify-center py-6">
                      <Loader2 size={16} className="text-white/15 animate-spin" />
                    </div>
                  ) : workspaces.length === 0 ? (
                    <div className="py-6 text-center">
                      <Folder size={18} className="text-white/10 mx-auto mb-2" strokeWidth={1.5} />
                      <p className="text-[11px] text-white/15">
                        {workspaceError ? 'Could not load workspaces' : 'No workspaces yet'}
                      </p>
                      {workspaceError && (
                        <button
                          onClick={fetchWorkspaces}
                          className="mt-2 text-[10px] font-medium text-white/20 hover:text-white/40 transition-colors"
                        >
                          Try again
                        </button>
                      )}
                    </div>
                  ) : (
                    workspaces.map((ws, i) => (
                      <motion.button
                        key={ws._id}
                        initial={{ opacity: 0, x: -4 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.18 + i * 0.04, duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                        whileHover={{ x: 3 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => navigate(`/workspace/${ws._id}`)}
                        className="group flex items-center gap-3 w-full px-3 py-2 rounded-lg text-left
                          transition-all duration-150 ease-out
                          hover:bg-white/[0.03] active:bg-white/[0.05]"
                      >
                        <div className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-md bg-white/[0.03]">
                          <Folder size={12} className="text-white/20 group-hover:text-white/35 transition-colors duration-150" strokeWidth={1.6} />
                        </div>
                        <span className="flex-1 text-[12px] font-medium text-white/30 group-hover:text-white/55 transition-colors duration-150 truncate">
                          {ws.name}
                        </span>
                        <span className="text-[10px] text-white/15 group-hover:text-white/25 transition-colors duration-150 flex-shrink-0">
                          {timeAgo(ws.updatedAt)}
                        </span>
                      </motion.button>
                    ))
                  )}
                </div>
              </BentoCard>
            </motion.div>


          </div>

          {/* ═══ Right Column (40%) ═══ */}
          <div className="col-span-2 flex flex-col gap-3">
            {/* Quick Start Actions */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.14, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            >
              <BentoCard className="p-4">
                <SectionHeader icon={Command} label="Quick Start" />
                <div className="space-y-0.5">
                  {QUICK_ACTIONS.map((action, idx) => (
                    <ActionRow
                      key={action.id}
                      icon={action.icon}
                      label={action.label}
                      shortcut={action.shortcut}
                      index={idx}
                      onClick={() => handleAction(action.id)}
                    />
                  ))}
                </div>
              </BentoCard>
            </motion.div>

            {/* Configuration */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.18, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            >
              <BentoCard className="p-4">
                <SectionHeader icon={Settings} label="Configuration" />
                <div className="space-y-0.5">
                  {CONFIG_ACTIONS.map((action, idx) => (
                    <ActionRow
                      key={action.id}
                      icon={action.icon}
                      label={action.label}
                      shortcut={action.shortcut}
                      index={idx}
                      onClick={() => handleAction(action.id)}
                    />
                  ))}
                </div>
              </BentoCard>
            </motion.div>
          </div>
        </div>

        {/* Footer hint */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.4 }}
          className="mt-6 text-[10px] text-white/10"
        >
          Press{' '}
          <Kbd>Ctrl+Shift+P</Kbd>
          {' '}for commands
        </motion.p>
      </div>
    </div>
  );
}
