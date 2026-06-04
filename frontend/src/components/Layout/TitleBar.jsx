import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Maximize2, Minimize2, Sidebar, PanelBottom, PanelRight,
  Play, Bug, Square, SkipForward, StepForward, StepBack, Circle, XCircle, FileEdit,
  Terminal as TerminalIcon, SplitSquareHorizontal, X, Search,
} from 'lucide-react';
import { useWorkspace } from '../../stores/useWorkspace';
import { useTerminal } from '../../stores/useTerminal';
import AetherStudioLogo from '../Common/AetherStudioLogo';
import MenuBar from './MenuBar';

// ── Reusable action button (VS Code style) ──
function ActionButton({ icon: Icon, onClick, active, title }) {
  return (
    <motion.button
      whileHover={{ background: 'rgba(255,255,255,0.06)' }}
      whileTap={{ scale: 0.9 }}
      onClick={onClick}
      className="flex items-center justify-center h-[24px] w-[24px] rounded-md transition-all duration-100"
      style={{
        color: active ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.2)',
        background: active ? 'rgba(255,255,255,0.05)' : 'transparent',
      }}
      title={title}
    >
      <Icon size={13} strokeWidth={active ? 2 : 1.5} />
    </motion.button>
  );
}

function FullscreenButton() {
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const handleChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleChange);
    return () => document.removeEventListener('fullscreenchange', handleChange);
  }, []);

  const toggle = useCallback(() => {
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      document.documentElement.requestFullscreen();
    }
  }, []);

  return (
    <motion.button
      whileHover={{ borderColor: 'rgba(255,255,255,0.25)', background: 'rgba(255,255,255,0.04)' }}
      whileTap={{ scale: 0.93 }}
      onClick={toggle}
      className="flex items-center justify-center h-[24px] w-[24px] rounded-md transition-all"
      style={{
        border: '1px solid rgba(255,255,255,0.06)',
        color: 'rgba(255,255,255,0.3)',
      }}
      title={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
    >
      {isFullscreen ? (
        <Minimize2 size={11} strokeWidth={1.5} />
      ) : (
        <Maximize2 size={11} strokeWidth={1.5} />
      )}
    </motion.button>
  );
}

// ── Terminal dropdown (VS Code-style) ──
const terminalItems = [
  { id: 'new-terminal', label: 'New Terminal', shortcut: 'Ctrl+`', icon: TerminalIcon },
  { id: 'split-terminal', label: 'Split Terminal', shortcut: 'Ctrl+Shift+5', icon: SplitSquareHorizontal },
  { type: 'divider' },
  { id: 'close-terminal', label: 'Close Terminal', shortcut: '', icon: X },
  { id: 'toggle-terminal-search', label: 'Toggle Search', shortcut: 'Ctrl+Shift+F', icon: Search },
];

function TerminalDropdown() {
  const [open, setOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(0);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setOpen(false);
    };
    if (open) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  const handleAction = (actionId) => {
    setOpen(false);
    switch (actionId) {
      case 'new-terminal':
        useWorkspace.getState().setActiveBottomPanel('terminal');
        break;
      case 'split-terminal':
        useTerminal.getState().splitTerminal();
        break;
      case 'close-terminal': {
        const t = useTerminal.getState();
        if (t.activeTerminalId) t.killTerminal(t.activeTerminalId);
        break;
      }
      case 'toggle-terminal-search':
        useTerminal.getState().toggleSearch();
        break;
    }
  };

  const handleKeyDown = (e) => {
    const items = terminalItems.filter(i => i.type !== 'divider');
    switch (e.key) {
      case 'ArrowDown': e.preventDefault(); setFocusedIndex(i => Math.min(i + 1, items.length - 1)); break;
      case 'ArrowUp': e.preventDefault(); setFocusedIndex(i => Math.max(i - 1, 0)); break;
      case 'Enter': e.preventDefault(); if (items[focusedIndex]) handleAction(items[focusedIndex].id); break;
      case 'Escape': e.preventDefault(); setOpen(false); break;
    }
  };

  return (
    <div ref={dropdownRef} className="relative">
      <motion.button
        whileHover={{ borderColor: 'rgba(255,255,255,0.25)', background: 'rgba(255,255,255,0.04)' }}
        whileTap={{ scale: 0.93 }}
        onClick={() => { setOpen(!open); setFocusedIndex(0); }}
        className="flex items-center gap-1.5 h-[24px] px-2 rounded-md text-[11px] transition-all"
        style={{
          border: '1px solid rgba(255,255,255,0.06)',
          color: 'rgba(255,255,255,0.3)',
          background: open ? 'rgba(255,255,255,0.04)' : 'transparent',
        }}
        title="Terminal"
      >
        <TerminalIcon size={10} strokeWidth={2} />
        <span>Terminal</span>
        <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.4 }}>
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.96 }}
            transition={{ duration: 0.12, ease: [0.25, 0.1, 0.25, 1] }}
            className="absolute right-0 top-full mt-0.5 min-w-[200px] overflow-y-auto"
            style={{
              background: 'rgba(18,18,22,0.95)',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: '8px',
              boxShadow: '0 8px 32px rgba(0,0,0,0.6), 0 2px 8px rgba(0,0,0,0.4)',
              backdropFilter: 'blur(40px)',
              WebkitBackdropFilter: 'blur(40px)',
            }}
            onKeyDown={handleKeyDown}
          >
            <div className="py-1">
              {terminalItems.map((item, idx) => {
                if (item.type === 'divider') {
                  return <div key={`d-${idx}`} className="my-1 mx-3" style={{ height: '1px', background: 'rgba(255,255,255,0.06)' }} />;
                }
                const menuIdx = terminalItems.filter(i => i.type !== 'divider').indexOf(item);
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

// ── Run/Debug dropdown (VS Code-style run toolbar) ──
const runItems = [
  { id: 'run', label: 'Run Without Debugging', shortcut: 'Ctrl+F5', icon: Play },
  { id: 'start-debugging', label: 'Start Debugging', shortcut: 'F5', icon: Bug },
  { id: 'stop-debugging', label: 'Stop Debugging', shortcut: 'Shift+F5', icon: Square },
  { id: 'restart-debugging', label: 'Restart Debugging', shortcut: 'Ctrl+Shift+F5', icon: SkipForward },
  { type: 'divider' },
  { id: 'open-configurations', label: 'Open Configurations', shortcut: '', icon: FileEdit },
  { id: 'add-configuration', label: 'Add Configuration...', shortcut: '', icon: FileEdit },
  { type: 'divider' },
  { id: 'step-over', label: 'Step Over', shortcut: 'F10', icon: SkipForward },
  { id: 'step-into', label: 'Step Into', shortcut: 'F11', icon: StepForward },
  { id: 'step-out', label: 'Step Out', shortcut: 'Shift+F11', icon: StepBack },
  { type: 'divider' },
  { id: 'toggle-breakpoint', label: 'Toggle Breakpoint', shortcut: 'F9', icon: Circle },
  { id: 'enable-all-breakpoints', label: 'Enable All Breakpoints', shortcut: '', icon: Circle },
  { id: 'disable-all-breakpoints', label: 'Disable All Breakpoints', shortcut: '', icon: Circle },
  { id: 'remove-all-breakpoints', label: 'Remove All Breakpoints', shortcut: '', icon: XCircle },
];

function RunDropdown() {
  const [open, setOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(0);
  const dropdownRef = useRef(null);

  // Close on outside click
  useEffect(() => {
    const handleClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    if (open) {
      document.addEventListener('mousedown', handleClick);
    }
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  const handleAction = (actionId) => {
    setOpen(false);
    const state = useWorkspace.getState();
    switch (actionId) {
      case 'run':
        state.runCode();
        break;
      case 'start-debugging':
        // If paused, continue; otherwise start debugging
        if (state.debugState === 'paused') {
          state.continueExecution();
        } else {
          state.startDebugging();
        }
        break;
      case 'stop-debugging':
        state.stopDebugging();
        break;
      case 'restart-debugging':
        state.stopDebugging();
        setTimeout(() => state.startDebugging(), 100);
        break;
      case 'step-over':
        state.stepOver();
        break;
      case 'step-into':
        state.stepInto();
        break;
      case 'step-out':
        state.stepOut();
        break;
      case 'toggle-breakpoint': {
        const { activeFile, breakpoints, addBreakpoint, removeBreakpoint } = state;
        const activeLine = window.__editorCursorLine || 1;
        const existing = breakpoints.find(
          (b) => b.fileId === activeFile?.id && b.line === activeLine
        );
        if (existing) removeBreakpoint(activeLine);
        else addBreakpoint(activeLine);
        break;
      }
      case 'enable-all-breakpoints':
        state.enableAllBreakpoints();
        break;
      case 'disable-all-breakpoints':
        state.disableAllBreakpoints();
        break;
      case 'remove-all-breakpoints':
        state.removeAllBreakpoints();
        break;
      case 'open-configurations': {
        // Search workspace files for existing .vscode/launch.json
        const existingConfig = state.files.find(
          (f) => f.path === '.vscode/launch.json' || f.name === 'launch.json'
        );
        const g = state.getActiveGroup();
        if (existingConfig) {
          state.openFile(existingConfig, g?.id);
        } else {
          // Create untitled launch.json (like VS Code when none exists)
          const launchFile = {
            id: `untitled-launch-${Date.now()}`,
            name: 'launch.json',
            path: '.vscode/launch.json',
            type: 'file',
            isUntitled: true,
          };
          state.openFile(launchFile, g?.id);
          state.updateCode(JSON.stringify({
            version: '0.2.0',
            configurations: [{
              type: 'node',
              request: 'launch',
              name: 'Launch Program',
              program: '${file}',
            }],
          }, null, 2), g?.id);
        }
        break;
      }
      case 'add-configuration': {
        const g = state.getActiveGroup();
        const launchFile = {
          id: `untitled-launch-${Date.now()}`,
          name: 'launch.json',
          path: '.vscode/launch.json',
          type: 'file',
          isUntitled: true,
        };
        state.openFile(launchFile, g?.id);
        state.updateCode(JSON.stringify({
          version: '0.2.0',
          configurations: [{
            type: 'node',
            request: 'launch',
            name: 'Launch Program',
            program: '${file}',
          }],
        }, null, 2), g?.id);
        break;
      }
    }
  };

  const handleKeyDown = (e) => {
    const items = runItems.filter(i => i.type !== 'divider');
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setFocusedIndex(i => Math.min(i + 1, items.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setFocusedIndex(i => Math.max(i - 1, 0));
        break;
      case 'Enter':
        e.preventDefault();
        if (items[focusedIndex]) handleAction(items[focusedIndex].id);
        break;
      case 'Escape':
        e.preventDefault();
        setOpen(false);
        break;
    }
  };

  const { isRunning, isDebugging, debugState } = useWorkspace();

  return (
    <div ref={dropdownRef} className="relative">
      <motion.button
        whileHover={{ borderColor: 'rgba(255,255,255,0.25)', background: 'rgba(255,255,255,0.04)' }}
        whileTap={{ scale: 0.93 }}
        onClick={() => {
          setOpen(!open);
          setFocusedIndex(0);
        }}
        className="flex items-center gap-1.5 h-[24px] px-2 rounded-md text-[11px] transition-all"
        style={{
          border: '1px solid rgba(255,255,255,0.06)',
          color: isRunning || isDebugging ? 'rgba(74,222,128,0.9)' : 'rgba(255,255,255,0.3)',
          background: open ? 'rgba(255,255,255,0.04)' : 'transparent',
        }}
        title="Run and Debug"
      >
        {debugState === 'paused' ? (
          <Bug size={10} strokeWidth={2} fill="rgba(250,204,21,0.9)" />
        ) : (
          <Play size={10} strokeWidth={2} fill={isRunning || isDebugging ? 'rgba(74,222,128,0.9)' : 'transparent'} />
        )}
        <span style={{ color: isRunning || isDebugging ? 'rgba(74,222,128,0.9)' : 'rgba(255,255,255,0.3)' }}>
          {debugState === 'paused' ? 'Paused'
            : isDebugging ? 'Debugging'
            : isRunning ? 'Running'
            : 'Run'}
        </span>
        <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.4 }}>
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.96 }}
            transition={{ duration: 0.12, ease: [0.25, 0.1, 0.25, 1] }}
            className="absolute right-0 top-full mt-0.5 min-w-[220px] overflow-y-auto"
            style={{
              background: 'rgba(18,18,22,0.95)',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: '8px',
              boxShadow: '0 8px 32px rgba(0,0,0,0.6), 0 2px 8px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.04)',
              backdropFilter: 'blur(40px)',
              WebkitBackdropFilter: 'blur(40px)',
              maxHeight: '70vh',
              scrollbarWidth: 'thin',
              scrollbarColor: 'rgba(255,255,255,0.08) transparent',
            }}
            onKeyDown={handleKeyDown}
          >
            <div className="py-1">
              {runItems.map((item, idx) => {
                if (item.type === 'divider') {
                  return (
                    <div
                      key={`divider-${idx}`}
                      className="my-1 mx-3"
                      style={{ height: '1px', background: 'rgba(255,255,255,0.06)' }}
                    />
                  );
                }
                const menuIdx = runItems.filter(i => i.type !== 'divider').indexOf(item);
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
                    {Icon && (
                      <Icon
                        size={13}
                        style={{
                          color: isSelected ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.2)'
                        }}
                      />
                    )}
                    <span className="flex-1 text-left">{item.label}</span>
                    {item.shortcut && (
                      <kbd style={{ color: 'rgba(255,255,255,0.15)', fontSize: '10px', fontFamily: 'inherit' }}>{item.shortcut}</kbd>
                    )}
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

export default function TitleBar() {
  const navigate = useNavigate();
  const {
    workspace, activeFile, toggleCommandPalette,
    sidebarOpen, bottomPanelOpen, rightPanelOpen,
    toggleSidebar, toggleBottomPanel, toggleRightPanel,
  } = useWorkspace();

  return (
    <div
      className="h-[44px] flex items-center justify-between px-5 select-none z-10"
      style={{
        background: 'rgba(20,20,26,0.85)',
        backdropFilter: 'blur(20px) saturate(1.5)',
        WebkitBackdropFilter: 'blur(20px) saturate(1.5)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        borderRadius: 0,
      }}
    >
      <div className="flex items-center gap-2.5 h-full">
        <div className="flex items-center justify-center">
          <AetherStudioLogo size={18} animated glow />
        </div>
        <MenuBar />
      </div>

      <div className="flex items-center gap-2 absolute left-1/2 -translate-x-1/2 h-full">
        <motion.button
          whileHover={{
            color: 'rgba(255,255,255,0.5)',
            background: 'rgba(255,255,255,0.05)',
          }}
          whileTap={{ scale: 0.93 }}
          onClick={() => navigate('/dashboard')}
          className="flex items-center justify-center w-[20px] h-[20px] rounded-md transition-all"
          style={{ color: 'rgba(255,255,255,0.2)' }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </motion.button>
        <span className="text-[12px] font-semibold tracking-tight" style={{ color: 'rgba(245,245,247,0.6)' }}>
          {workspace?.name || 'Untitled'}
        </span>
        {activeFile && (
          <>
            <span style={{ color: 'rgba(255,255,255,0.1)', fontSize: '14px' }}>/</span>
            <span className="text-[11px] font-mono" style={{ color: 'rgba(255,255,255,0.2)' }}>
              {activeFile.path || activeFile.name}
            </span>
          </>
        )}
      </div>

      <div className="flex items-center gap-1 h-full">
        {/* ── VS Code-style layout action buttons ── */}
        <ActionButton
          icon={Sidebar}
          onClick={toggleSidebar}
          active={sidebarOpen}
          title="Toggle Sidebar (Ctrl+B)"
        />
        <ActionButton
          icon={PanelBottom}
          onClick={toggleBottomPanel}
          active={bottomPanelOpen}
          title="Toggle Panel (Ctrl+J)"
        />
        <ActionButton
          icon={PanelRight}
          onClick={toggleRightPanel}
          active={rightPanelOpen}
          title="Toggle Right Panel"
        />

        <div className="w-px h-4 mx-1" style={{ background: 'rgba(255,255,255,0.06)' }} />

        {/* Terminal dropdown */}
        <TerminalDropdown />

        <div className="w-px h-4 mx-1" style={{ background: 'rgba(255,255,255,0.06)' }} />

        {/* Run/Debug dropdown */}
        <RunDropdown />

        <div className="w-px h-4 mx-1" style={{ background: 'rgba(255,255,255,0.06)' }} />

        {/* Fullscreen toggle */}
        <FullscreenButton />

        {/* Search button */}
        <motion.button
          whileHover={{ borderColor: 'rgba(255,255,255,0.25)', background: 'rgba(255,255,255,0.04)' }}
          onClick={() => toggleCommandPalette()}
          className="flex items-center gap-2 h-[24px] px-2.5 rounded-md text-[11px] transition-all"
          style={{
            border: '1px solid rgba(255,255,255,0.06)',
            color: 'rgba(255,255,255,0.3)',
          }}
        >
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <span>Search</span>
          <kbd className="text-[9px] px-1 py-[1px] rounded font-mono" style={{ background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.15)' }}>⌘P</kbd>
        </motion.button>
      </div>
    </div>
  );
}
