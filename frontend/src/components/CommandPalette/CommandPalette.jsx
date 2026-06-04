import React, { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Command, File, GitBranch, Settings, Palette, Terminal, X, LayoutPanelLeft, LayoutPanelTop, Split, Minimize2, FileCode, Puzzle, Download, Star, RefreshCw, ToggleLeft, ToggleRight } from 'lucide-react';
import { useWorkspace } from '../../stores/useWorkspace';
import { useNavigate } from 'react-router-dom';

const EXTENSION_COMMANDS = [
  { id: 'extensions-open', label: 'Extensions: Open Extensions View', icon: Puzzle, shortcut: 'Ctrl+Shift+X' },
  { id: 'extensions-installed', label: 'Extensions: Show Installed', icon: Download, shortcut: '' },
  { id: 'extensions-popular', label: 'Extensions: Show Popular', icon: Star, shortcut: '' },
  { id: 'extensions-updates', label: 'Extensions: Check for Updates', icon: RefreshCw, shortcut: '' },
  { id: 'extensions-enable-all', label: 'Extensions: Enable All', icon: ToggleRight, shortcut: '' },
  { id: 'extensions-disable-all', label: 'Extensions: Disable All (except built-in)', icon: ToggleLeft, shortcut: '' },
];

const COMMANDS = [
  { id: 'toggle-terminal', label: 'Toggle Terminal', icon: Terminal, shortcut: 'Ctrl+`' },
  { id: 'toggle-sidebar', label: 'Toggle Sidebar', icon: Palette, shortcut: 'Ctrl+B' },
  { id: 'toggle-search', label: 'Show Search', icon: Search, shortcut: 'Ctrl+Shift+F' },
  { id: 'toggle-source-control', label: 'Show Source Control', icon: GitBranch, shortcut: 'Ctrl+Shift+G' },
  { id: 'toggle-debug', label: 'Show Debug', icon: Terminal, shortcut: 'Ctrl+Shift+D' },
  { id: 'close-all-tabs', label: 'Close All Tabs', icon: X, shortcut: '' },
  { id: 'open-settings', label: 'Open Settings', icon: Settings, shortcut: 'Ctrl+,' },
  { id: 'toggle-minimap', label: 'Toggle Minimap', icon: Palette, shortcut: '' },
  { id: 'toggle-breadcrumbs', label: 'Toggle Breadcrumbs', icon: Palette, shortcut: '' },
  { id: 'format-document', label: 'Format Document', icon: File, shortcut: 'Shift+Alt+F' },
  { id: 'go-to-dashboard', label: 'Go to Dashboard', icon: File, shortcut: '' },
  { id: 'go-to-profile', label: 'Go to Profile', icon: File, shortcut: '' },
  { type: 'divider' },
  { id: 'split-right', label: 'Split Editor Right', icon: LayoutPanelLeft, shortcut: '' },
  { id: 'split-down', label: 'Split Editor Down', icon: LayoutPanelTop, shortcut: '' },
  { id: 'close-editor-group', label: 'Close Editor Group', icon: X, shortcut: '' },
  { id: 'editor-layout-single', label: 'Single Editor Layout', icon: FileCode, shortcut: '' },
  { type: 'divider' },
  { id: 'go-to-line', label: 'Go to Line...', icon: Terminal, shortcut: 'Ctrl+G' },
  { id: 'go-to-symbol', label: 'Go to Symbol in File...', icon: Search, shortcut: 'Ctrl+Shift+O' },
  { id: 'rename-symbol', label: 'Rename Symbol', icon: Settings, shortcut: 'F2' },
  { type: 'divider' },
  ...EXTENSION_COMMANDS,
];

export default function CommandPalette() {
  const { commandPaletteOpen, closeCommandPalette, toggleBottomPanel, toggleSidebar,
    setActiveSidebarView, closeAllTabs, updateSetting, settings,
    splitEditor, closeEditorGroup, editorGroups, getActiveGroup } = useWorkspace();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);
  const listRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (commandPaletteOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [commandPaletteOpen]);

  // Filter commands
  const filteredCommands = useMemo(() => {
    if (!query.trim()) return COMMANDS.filter(c => c.type !== 'divider');
    const q = query.toLowerCase();
    return COMMANDS.filter((cmd) =>
      cmd.type === 'divider' ? false : cmd.label.toLowerCase().includes(q)
    );
  }, [query]);

  const executeCommand = (cmd) => {
    closeCommandPalette();
    switch (cmd.id) {
      case 'toggle-terminal': toggleBottomPanel(); break;
      case 'toggle-sidebar': toggleSidebar(); break;
      case 'toggle-search': setActiveSidebarView('search'); break;
      case 'toggle-source-control': setActiveSidebarView('source-control'); break;
      case 'toggle-debug': setActiveSidebarView('debug'); break;
      case 'close-all-tabs': {
        const activeGroup = getActiveGroup();
        if (activeGroup) closeAllTabs(activeGroup.id);
        break;
      }
      case 'toggle-minimap': updateSetting('minimap', !settings.minimap); break;
      case 'toggle-breadcrumbs': updateSetting('breadcrumbs', !settings.breadcrumbs); break;
      case 'format-document': break; // Handled by Monaco
      case 'go-to-dashboard': navigate('/dashboard'); break;
      case 'go-to-profile': navigate('/profile'); break;
      case 'split-right': splitEditor('horizontal'); break;
      case 'split-down': splitEditor('vertical'); break;
      // ── Extension commands ──
      case 'extensions-open': setActiveSidebarView('extensions'); break;
      case 'extensions-installed': setActiveSidebarView('extensions'); break; // view handled by ExtensionsPanel
      case 'extensions-popular': setActiveSidebarView('extensions'); break;
      case 'extensions-updates': setActiveSidebarView('extensions'); break;
      case 'extensions-enable-all': setActiveSidebarView('extensions'); break;
      case 'extensions-disable-all': setActiveSidebarView('extensions'); break;
      case 'close-editor-group': {
        const activeGroup = getActiveGroup();
        if (activeGroup) closeEditorGroup(activeGroup.id);
        break;
      }
      case 'editor-layout-single': {
        // Close all groups except the active one
        const groups = [...editorGroups];
        const activeGroup = getActiveGroup();
        if (activeGroup && groups.length > 1) {
          groups.forEach(g => {
            if (g.id !== activeGroup.id) {
              closeEditorGroup(g.id);
            }
          });
        }
        break;
      }
      default: break;
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      closeCommandPalette();
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => Math.min(prev + 1, filteredCommands.length - 1));
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => Math.max(prev - 1, 0));
    }
    if (e.key === 'Enter' && filteredCommands[selectedIndex]) {
      executeCommand(filteredCommands[selectedIndex]);
    }
  };

  // Scroll selected into view
  useEffect(() => {
    const selected = listRef.current?.querySelector('[data-selected="true"]');
    selected?.scrollIntoView({ block: 'nearest' });
  }, [selectedIndex]);

  return (
    <AnimatePresence>
      {commandPaletteOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.1 }}
          className="fixed inset-0 z-[9999] flex items-start justify-center pt-[12vh]"
          onClick={closeCommandPalette}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

          {/* Palette */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -10 }}
            transition={{ duration: 0.15, ease: [0.25, 0.1, 0.25, 1] }}
            className="glass-card-strong w-[600px] max-w-[90vw] overflow-hidden"
            style={{
              border: '1px solid rgba(0,240,255,0.12)',
              boxShadow: '0 8px 48px rgba(0,0,0,0.8), 0 0 40px rgba(0,240,255,0.12), 0 0 80px rgba(0,240,255,0.06)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Neon gradient accent bar at top */}
            <div
              className="absolute top-0 left-0 right-0 h-[2px] pointer-events-none z-10"
              style={{
                background: 'linear-gradient(90deg, #00f0ff, #ff00ff, #00f0ff)',
                backgroundSize: '200% 100%',
                opacity: 0.8,
                boxShadow: '0 0 30px rgba(0,240,255,0.7), 0 0 60px rgba(0,240,255,0.35), 0 0 100px rgba(0,240,255,0.1)',
              }}
            />

            {/* Search input */}
            <div className="flex items-center gap-3 px-4 py-3" style={{ borderBottom: '1px solid rgba(0,240,255,0.06)' }}>
              <div className="relative">
                <Command size={16} className="text-[rgba(0,240,255,0.3)] flex-shrink-0" />
              </div>
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => { setQuery(e.target.value); setSelectedIndex(0); }}
                onKeyDown={handleKeyDown}
                placeholder="Type a command..."
                className="flex-1 bg-transparent text-[14px] text-[#f0f0f0] placeholder:text-[rgba(200,200,220,0.2)] focus:outline-none"
                style={{ caretColor: '#00f0ff' }}
              />
              {/* Focus purple glow indicator */}
              <div
                className="absolute inset-0 pointer-events-none rounded-lg transition-opacity duration-300 opacity-0 focus-within:opacity-100"
                style={{
                  boxShadow: '0 0 20px rgba(160,120,64,0.15), 0 0 40px rgba(160,120,64,0.06)',
                  border: '1px solid rgba(160,120,64,0.2)',
                }}
              />
              <kbd
                className="px-1.5 py-0.5 rounded text-[10px] font-mono"
                style={{
                  background: 'rgba(0,240,255,0.04)',
                  border: '1px solid rgba(0,240,255,0.06)',
                  color: 'rgba(200,200,220,0.2)',
                }}
              >
                Esc
              </kbd>
            </div>

            {/* Command list */}
            <div ref={listRef} className="max-h-[300px] overflow-y-auto py-1" style={{ background: 'rgba(0,0,0,0.8)' }}>
              {filteredCommands.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-[13px]" style={{ color: 'rgba(200,200,220,0.2)' }}>
                    No matching commands found
                  </p>
                </div>
              ) : (
                filteredCommands.map((cmd, idx) => {
                  const isSelected = idx === selectedIndex;
                  const Icon = cmd.icon;
                  return (
                    <motion.div
                      key={cmd.id}
                      data-selected={isSelected ? 'true' : 'false'}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: idx * 0.005 }}
                      onClick={() => executeCommand(cmd)}
                      onMouseEnter={() => setSelectedIndex(idx)}
                      className="flex items-center gap-3 px-4 py-2.5 mx-1 rounded-lg cursor-pointer transition-all duration-100"
                      style={{
                        background: isSelected ? 'rgba(0,240,255,0.08)' : 'transparent',
                        boxShadow: isSelected ? 'inset 0 0 20px rgba(0,240,255,0.12), 0 0 8px rgba(0,240,255,0.06)' : 'none',
                      }}
                    >
                      <div className="relative">
                        <Icon
                          size={15}
                          className={`flex-shrink-0`}
                          style={{
                            color: isSelected ? '#00f0ff' : 'rgba(200,200,220,0.2)',
                          }}
                        />
                        {isSelected && (
                          <div className="absolute inset-0 blur-[12px] bg-[#00f0ff] opacity-80" />
                        )}
                      </div>
                      <span
                        className="text-[13px] font-medium flex-1"
                        style={{
                          color: isSelected ? '#f0f0f0' : 'rgba(200,200,220,0.4)',
                        }}
                      >
                        {cmd.label}
                      </span>
                      {cmd.shortcut && (
                        <kbd
                          className="px-1.5 py-0.5 rounded text-[10px] font-mono"
                          style={{
                            background: 'rgba(0,240,255,0.04)',
                            border: '1px solid rgba(0,240,255,0.06)',
                            color: isSelected ? 'rgba(0,240,255,0.4)' : 'rgba(200,200,220,0.15)',
                          }}
                        >
                          {cmd.shortcut}
                        </kbd>
                      )}
                    </motion.div>
                  );
                })
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
