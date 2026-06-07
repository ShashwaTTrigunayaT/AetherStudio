import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useWorkspace } from '../../stores/useWorkspace';
import { useTerminal } from '../../stores/useTerminal';
import { useFilePicker } from '../../hooks/useFilePicker';
import {
  Save, X, XCircle,
  Scissors, Copy, Clipboard, ClipboardPaste,
  Search, Eye, Sidebar, PanelBottom, PanelRight,
  Terminal as TerminalIcon,
  Move, ArrowLeft, ArrowRight, ArrowUp, ArrowDown, Bug, Play, Square, SkipForward,
  StepForward, StepBack, Circle, HelpCircle, Book, Keyboard,
  FilePlus, FolderOpen, FileEdit, SplitSquareHorizontal,
  Undo2, Redo2, StickyNote, Type, PanelTop, Spline,
  Maximize2, LayoutDashboard, ArrowLeftRight, Columns, Rows, LayoutGrid,
  ListChecks, RefreshCw, Settings, Zap, TextSelect, ChevronRight,
} from 'lucide-react';

const menuItems = {
  File: [
    // New
    { id: 'new-file', label: 'New File', shortcut: 'Ctrl+N', icon: FilePlus },
    { id: 'new-window', label: 'New Window', shortcut: 'Ctrl+Shift+N', icon: FilePlus },
    { type: 'divider' },
    // Open
    { id: 'open-file', label: 'Open File...', shortcut: 'Ctrl+O', icon: FolderOpen },
    { id: 'open-folder', label: 'Open Folder...', shortcut: 'Ctrl+K Ctrl+O', icon: FolderOpen },
    { type: 'divider' },
    // Save
    { id: 'save', label: 'Save', shortcut: 'Ctrl+S', icon: Save },
    { id: 'save-as', label: 'Save As...', shortcut: 'Ctrl+Shift+S', icon: Save },
    { id: 'save-all', label: 'Save All', shortcut: 'Ctrl+K S', icon: Save },
    { type: 'divider' },
    // Preferences
    { id: 'auto-save', label: 'Auto Save', shortcut: '', icon: Save },
    { id: 'preferences', label: 'Preferences', shortcut: 'Ctrl+,', icon: FileEdit },
    { type: 'divider' },
    // Close
    { id: 'close-tab', label: 'Close Tab', shortcut: 'Ctrl+W', icon: X },
    { id: 'close-other-tabs', label: 'Close Others', shortcut: 'Ctrl+Shift+W', icon: XCircle },
    { id: 'close-all-tabs', label: 'Close All', shortcut: '', icon: XCircle },
    { type: 'divider' },
    // Navigate
    { id: 'close-folder', label: 'Close Folder', shortcut: '', icon: ArrowLeft },
    { id: 'exit', label: 'Exit', shortcut: 'Alt+F4', icon: XCircle },
  ],
  Edit: [
    // Undo / Redo
    { id: 'undo', label: 'Undo', shortcut: 'Ctrl+Z', icon: Undo2 },
    { id: 'redo', label: 'Redo', shortcut: 'Ctrl+Shift+Z', icon: Redo2 },
    { type: 'divider' },
    // Clipboard
    { id: 'cut', label: 'Cut', shortcut: 'Ctrl+X', icon: Scissors },
    { id: 'copy', label: 'Copy', shortcut: 'Ctrl+C', icon: Copy },
    { id: 'paste', label: 'Paste', shortcut: 'Ctrl+V', icon: ClipboardPaste },
    { type: 'divider' },
    // Find
    { id: 'find', label: 'Find', shortcut: 'Ctrl+F', icon: Search },
    { id: 'replace', label: 'Replace', shortcut: 'Ctrl+H', icon: FileEdit },
    { id: 'find-in-files', label: 'Find in Files', shortcut: 'Ctrl+Shift+F', icon: Search },
    { type: 'divider' },
    // Selection
    { id: 'select-all', label: 'Select All', shortcut: 'Ctrl+A', icon: StickyNote },
    { type: 'divider' },
    // Comments
    { id: 'toggle-line-comment', label: 'Toggle Line Comment', shortcut: 'Ctrl+/', icon: Type },
    { id: 'toggle-block-comment', label: 'Toggle Block Comment', shortcut: 'Shift+Alt+A', icon: Type },
    { type: 'divider' },
    // Formatting
    { id: 'format-document', label: 'Format Document', shortcut: 'Shift+Alt+F', icon: FileEdit },
    { id: 'format-selection', label: 'Format Selection', shortcut: 'Ctrl+K Ctrl+F', icon: FileEdit },
    { type: 'divider' },
    // Indent
    { id: 'indent', label: 'Indent Line', shortcut: 'Ctrl+]', icon: FileEdit },
    { id: 'outdent', label: 'Outdent Line', shortcut: 'Ctrl+[', icon: FileEdit },
    { type: 'divider' },
    // Line movement
    { id: 'move-line-up', label: 'Shift Line Up', shortcut: 'Alt+↑', icon: ArrowUp },
    { id: 'move-line-down', label: 'Shift Line Down', shortcut: 'Alt+↓', icon: ArrowDown },
    { id: 'copy-line-up', label: 'Copy Line Up', shortcut: 'Shift+Alt+↑', icon: ArrowUp },
    { id: 'copy-line-down', label: 'Copy Line Down', shortcut: 'Shift+Alt+↓', icon: ArrowDown },
    { type: 'divider' },
    // Word Wrap
    { id: 'toggle-word-wrap', label: 'Toggle Word Wrap', shortcut: 'Alt+Z', icon: FileEdit },
  ],
  View: [
    { id: 'command-palette', label: 'Command Palette', shortcut: 'Ctrl+Shift+P', icon: Eye },
    { id: 'open-view', label: 'Open View...', shortcut: '', icon: Eye },
    { type: 'divider' },
    // ── Appearance ──
    { id: 'show-activity-bar', label: 'Show Activity Bar', shortcut: '', icon: PanelTop },
    { id: 'toggle-sidebar', label: 'Toggle Sidebar', shortcut: 'Ctrl+B', icon: Sidebar },
    { id: 'toggle-bottom-panel', label: 'Toggle Panel', shortcut: 'Ctrl+J', icon: PanelBottom },
    { id: 'toggle-right-panel', label: 'Toggle Right Panel', shortcut: '', icon: PanelRight },
    { id: 'toggle-status-bar', label: 'Toggle Status Bar', shortcut: '', icon: PanelBottom },
    { id: 'toggle-tab-bar', label: 'Toggle Tab Bar', shortcut: '', icon: PanelTop },
    { id: 'toggle-centered-layout', label: 'Toggle Centered Layout', shortcut: '', icon: LayoutDashboard },
    { id: 'zen-mode', label: 'Zen Mode', shortcut: 'Ctrl+K Z', icon: Maximize2 },
    { id: 'fullscreen', label: 'Full Screen', shortcut: 'F11', icon: Maximize2 },
    { type: 'divider' },
    // ── Editor Layout ──
    { id: 'split-right', label: 'Split Editor Right', shortcut: 'Ctrl+\\', icon: SplitSquareHorizontal },
    { id: 'split-down', label: 'Split Editor Down', shortcut: 'Ctrl+K Ctrl+\\', icon: SplitSquareHorizontal },
    { id: 'split-left', label: 'Split Editor Left', shortcut: '', icon: SplitSquareHorizontal },
    { id: 'split-up', label: 'Split Editor Up', shortcut: '', icon: SplitSquareHorizontal },
    { type: 'divider' },
    { id: 'layout-single', label: 'Single Column', shortcut: '', icon: Columns },
    { id: 'layout-two-columns', label: 'Two Columns', shortcut: 'Ctrl+K Ctrl+\\', icon: Columns },
    { id: 'layout-three-columns', label: 'Three Columns', shortcut: '', icon: Columns },
    { id: 'layout-two-rows', label: 'Two Rows', shortcut: '', icon: Rows },
    { id: 'layout-three-rows', label: 'Three Rows', shortcut: '', icon: Rows },
    { id: 'layout-grid', label: 'Grid (2x2)', shortcut: '', icon: LayoutGrid },
    { type: 'divider' },
    { id: 'flip-layout', label: 'Flip Layout', shortcut: '', icon: ArrowLeftRight },
    { type: 'divider' },
    { id: 'toggle-minimap', label: 'Toggle Minimap', shortcut: '', icon: Eye },
    { id: 'toggle-breadcrumbs', label: 'Toggle Breadcrumbs', shortcut: '', icon: Eye },
    { id: 'toggle-sticky-scroll', label: 'Toggle Sticky Scroll', shortcut: '', icon: Eye },
    { id: 'toggle-render-whitespace', label: 'Toggle Render Whitespace', shortcut: '', icon: Eye },
    { id: 'toggle-word-wrap', label: 'Toggle Word Wrap', shortcut: 'Alt+Z', icon: FileEdit },
  ],
  Go: [
    { id: 'go-to-file', label: 'Go to File...', shortcut: 'Ctrl+P', icon: Search },
    { id: 'go-to-symbol', label: 'Go to Symbol in File...', shortcut: 'Ctrl+Shift+O', icon: Spline },
    { id: 'go-to-symbol-workspace', label: 'Go to Symbol in Workspace...', shortcut: 'Ctrl+T', icon: Spline },
    { type: 'divider' },
    { id: 'go-to-definition', label: 'Go to Definition', shortcut: 'F12', icon: Move },
    { id: 'go-to-type-definition', label: 'Go to Type Definition', shortcut: '', icon: Move },
    { id: 'go-to-implementation', label: 'Go to Implementation', shortcut: 'Ctrl+F12', icon: Move },
    { id: 'go-to-references', label: 'Go to References', shortcut: 'Shift+F12', icon: Move },
    { type: 'divider' },
    { id: 'peek-definition', label: 'Peek Definition', shortcut: 'Alt+F12', icon: Eye },
    { id: 'peek-type-definition', label: 'Peek Type Definition', shortcut: '', icon: Eye },
    { id: 'peek-implementation', label: 'Peek Implementation', shortcut: '', icon: Eye },
    { id: 'peek-references', label: 'Peek References', shortcut: '', icon: Eye },
    { type: 'divider' },
    { id: 'go-to-line', label: 'Go to Line/Column...', shortcut: 'Ctrl+G', icon: Move },
    { id: 'go-to-bracket', label: 'Go to Bracket', shortcut: 'Ctrl+Shift+\\', icon: Move },
    { type: 'divider' },
    { id: 'next-problem', label: 'Next Problem', shortcut: 'F8', icon: ArrowRight },
    { id: 'previous-problem', label: 'Previous Problem', shortcut: 'Shift+F8', icon: ArrowLeft },
    { type: 'divider' },
    { id: 'go-back', label: 'Go Back', shortcut: 'Alt+\u2190', icon: ArrowLeft },
    { id: 'go-forward', label: 'Go Forward', shortcut: 'Alt+\u2192', icon: ArrowRight },
    { id: 'go-to-last-edit-location', label: 'Go to Last Edit Location', shortcut: '', icon: Undo2 },
    { type: 'divider' },
    { id: 'go-to-breadcrumb', label: 'Go to Breadcrumb', shortcut: 'Ctrl+Shift+.', icon: Move },
  ],
  Run: [
    { id: 'run', label: 'Run', shortcut: 'Ctrl+F5', icon: Play },
    { id: 'start-debugging', label: 'Start Debugging', shortcut: 'F5', icon: Bug },
    { id: 'stop-debugging', label: 'Stop Debugging', shortcut: 'Shift+F5', icon: Square },
    { id: 'restart-debugging', label: 'Restart Debugging', shortcut: 'Ctrl+Shift+F5', icon: SkipForward },
    { type: 'divider' },
    { id: 'step-over', label: 'Step Over', shortcut: 'F10', icon: SkipForward },
    { id: 'step-into', label: 'Step Into', shortcut: 'F11', icon: StepForward },
    { id: 'step-out', label: 'Step Out', shortcut: 'Shift+F11', icon: StepBack },
    { type: 'divider' },
    { id: 'toggle-breakpoint', label: 'Toggle Breakpoint', shortcut: 'F9', icon: Circle },
    { id: 'enable-all-breakpoints', label: 'Enable All Breakpoints', shortcut: '', icon: Circle },
    { id: 'disable-all-breakpoints', label: 'Disable All Breakpoints', shortcut: '', icon: Circle },
    { id: 'remove-all-breakpoints', label: 'Remove All Breakpoints', shortcut: '', icon: XCircle },
    { type: 'divider' },
    { id: 'add-configuration', label: 'Add Configuration...', shortcut: '', icon: FileEdit },
  ],
  Terminal: [
    // Terminal management
    { id: 'new-terminal', label: 'New Terminal', shortcut: 'Ctrl+Shift+`', icon: TerminalIcon },
    { id: 'split-terminal', label: 'Split Terminal', shortcut: 'Ctrl+Shift+5', icon: SplitSquareHorizontal },
    { type: 'divider' },
    // Tasks
    { id: 'run-task', label: 'Run Task...', shortcut: '', icon: TerminalIcon },
    { id: 'run-build-task', label: 'Run Build Task...', shortcut: 'Ctrl+Shift+B', icon: Zap },
    { id: 'run-active-file', label: 'Run Active File', shortcut: '', icon: Play },
    { id: 'run-selected-text', label: 'Run Selected Text in Active Terminal', shortcut: '', icon: TextSelect },
    { type: 'divider' },
    // Running tasks
    { id: 'show-running-tasks', label: 'Show Running Tasks', shortcut: '', icon: ListChecks },
    { id: 'restart-running-task', label: 'Restart Running Task...', shortcut: '', icon: RefreshCw },
    { id: 'terminate-task', label: 'Terminate Task...', shortcut: '', icon: XCircle },
    { type: 'divider' },
    // Task configuration
    { id: 'configure-tasks', label: 'Configure Tasks...', shortcut: '', icon: FileEdit },
    { id: 'configure-default-build-task', label: 'Configure Default Build Task...', shortcut: '', icon: Settings },
    { type: 'divider' },
    // Terminal
    { id: 'kill-terminal', label: 'Kill Terminal', shortcut: '', icon: X },
    { type: 'divider' },
    { id: 'configure-terminal-settings', label: 'Configure Terminal Settings', shortcut: '', icon: Settings },
  ],
  Help: [
    { id: 'about', label: 'About AetherStudio', shortcut: '', icon: HelpCircle },
    { type: 'divider' },
    { id: 'keyboard-shortcuts', label: 'Keyboard Shortcuts', shortcut: '', icon: Keyboard },
    { id: 'documentation', label: 'Documentation', shortcut: '', icon: Book },
    { type: 'divider' },
    { id: 'report-issue', label: 'Report Issue', shortcut: '', icon: Bug },
  ],
};

export default function MenuBar() {
  const navigate = useNavigate();
  const [openMenu, setOpenMenu] = useState(null);
  const [focusedIndex, setFocusedIndex] = useState(0);
  const [openSubmenu, setOpenSubmenu] = useState(null);
  const [submenuPos, setSubmenuPos] = useState(null);
  const [activeSubmenuItem, setActiveSubmenuItem] = useState(null);
  const menuBarRef = useRef(null);
  const submenuTimerRef = useRef(null);
  const { pickFile } = useFilePicker();
  const { recentItems } = useWorkspace();

  // Listen for menu:action custom events (from global keyboard shortcuts)
  // This MUST be defined after handleAction to avoid temporal dead zone
  // (it's reassigned below after handleAction is defined)

  const handleAction = useCallback((actionId) => {
    setOpenMenu(null);
    setOpenSubmenu(null);
    setActiveSubmenuItem(null);
    setSubmenuPos(null);
    const state = useWorkspace.getState();
    const terminal = useTerminal.getState();

    switch (actionId) {
      case 'new-file': {
        // Create an untitled tab directly in the editor (like VS Code)
        const group = state.getActiveGroup();
        const untitledCount = state.editorGroups.reduce(
          (count, g) => count + g.openTabs.filter((t) => t.id?.startsWith('untitled-')).length,
          0
        );
        const untitledFile = {
          id: `untitled-${Date.now()}`,
          name: `Untitled-${untitledCount + 1}`,
          path: `Untitled-${untitledCount + 1}`,
          type: 'file',
          isUntitled: true,
        };
        state.openFile(untitledFile, group?.id);
        break;
      }
      case 'new-window': {
        window.open(window.location.origin, '_blank');
        break;
      }
      case 'open-file': {
        if (!state.workspace?._id) {
          console.warn('[Import] No workspace loaded');
          break;
        }
        (async () => {
          try {
            console.log('[Import] Opening file picker...');
            const file = await pickFile();
            if (!file) {
              console.log('[Import] No file selected (cancelled)');
              return;
            }
            console.log('[Import] File selected:', file.name, `(${file.content.length} chars)`);
            const created = await state.createFile(file.name, 'file');
            console.log('[Import] createFile result:', created ? { id: created.id, name: created.name } : null);
            if (created?.id) {
              console.log('[Import] Saving content...');
              await state.saveFileContent(created.id, file.content);
              console.log('[Import] Opening tab...');
              state.openFile({
                id: created.id,
                name: created.name,
                path: created.path || created.name,
                type: 'file',
              });
              console.log('[Import] ✅ Done');
            } else {
              console.warn('[Import] File created but no ID returned — duplicate name?');
            }
          } catch (err) {
            console.error('[Import] Error:', err);
          }
        })();
        break;
      }
      case 'open-folder': {
        if (!state.workspace?._id) {
          console.warn('[Import] No workspace loaded');
          break;
        }
        useWorkspace.getState().setImportModalOpen(true);
        break;
      }
      case 'save': {
        const group = state.getActiveGroup();
        const fileId = group?.activeFile?.id;
        if (fileId) {
          state.saveFileContent(fileId, group.code || '');
        }
        break;
      }
      case 'save-as': {
        const group = state.getActiveGroup();
        const activeFile = group?.activeFile;
        if (!activeFile?.id) break;

        // Always prompt for a new name (VS Code behavior: duplicate with new name)
        const defaultName = activeFile.isUntitled
          ? (activeFile.name || 'Untitled')
          : activeFile.name;
        const name = prompt('Save As:', defaultName);
        if (!name) break;

        (async () => {
          try {
            const created = await state.createFile(name, 'file');
            if (!created?.id) {
              console.warn('Save As: could not create file');
              return;
            }
            const code = group?.code || '';
            // Save content to the new file
            await state.saveFileContent(created.id, code);
            // If the original was untitled, close that placeholder tab
            if (activeFile.isUntitled) {
              state.closeTab(activeFile.id, group?.id);
            }
            // Open the new file in the current group
            state.openFile({
              id: created.id,
              name: created.name,
              path: created.path || created.name,
              type: 'file',
            }, group?.id);
          } catch (err) {
            console.error('Save As failed:', err);
          }
        })();
        break;
      }
      case 'save-all': {
        // Save all dirty files (VS Code behavior)
        const dirtyIds = state.getDirtyFileIds();
        if (dirtyIds.length === 0) break;

        (async () => {
          // First pass: collect all files that need saving
          const groups = state.editorGroups;
          const filesToSave = []; // { fileId, code, isUntitled, name }

          // Save all dirty active files across all editor groups
          // (g.code only tracks the active file's content per group)
          groups.forEach((g) => {
            const af = g.activeFile;
            if (af?.id && dirtyIds.includes(af.id) && g.code != null) {
              filesToSave.push({
                fileId: af.id,
                code: g.code,
                isUntitled: !!af.isUntitled,
                name: af.name || 'Untitled',
                groupId: g.id,
              });
            }
          });

          // Second pass: process each dirty file
          for (const item of filesToSave) {
            if (item.isUntitled) {
              // Prompt for a name for untitled files (VS Code behavior)
              const name = prompt(`Save "${item.name}" as:`, item.name);
              if (!name) continue;
              try {
                const created = await state.createFile(name, 'file');
                if (created?.id) {
                  await state.saveFileContent(created.id, item.code);
                  // Replace untitled tab with real file
                  state.closeTab(item.fileId, item.groupId);
                  state.openFile({
                    id: created.id,
                    name: created.name,
                    path: created.path || created.name,
                    type: 'file',
                  }, item.groupId);
                }
              } catch (err) {
                console.error('Save All: untitled save failed:', err);
              }
            } else {
              // Regular dirty file — save directly
              await state.saveFileContent(item.fileId, item.code);
            }
          }
        })();
        break;
      }
      case 'revert-file': {
        const group = state.getActiveGroup();
        const fileId = group?.activeFile?.id;
        if (fileId && confirm('Revert to last saved version? This will discard unsaved changes.')) {
          state.revertFile(fileId);
        }
        break;
      }

      case 'auto-save':
      case 'auto-save-off':
        state.setAutoSaveMode('off');
        break;
      case 'auto-save-afterDelay':
        state.setAutoSaveMode('afterDelay');
        break;
      case 'auto-save-onFocusChange':
        state.setAutoSaveMode('onFocusChange');
        break;
      case 'auto-save-onWindowChange':
        state.setAutoSaveMode('onWindowChange');
        break;
      case 'themes': {
        state.setRightPanelTab('settings');
        break;
      }
      case 'preferences':
      case 'settings': {
        useWorkspace.getState().setRightPanelTab('settings');
        break;
      }
      case 'close-tab': {
        const group = state.getActiveGroup();
        if (group?.activeTabId) {
          state.closeTab(group.activeTabId, group.id);
        }
        break;
      }
      case 'close-all-tabs': {
        const group = state.getActiveGroup();
        if (group) state.closeAllTabs(group.id);
        break;
      }
      case 'close-other-tabs': {
        const group = state.getActiveGroup();
        if (group?.activeTabId) {
          state.closeOtherTabs(group.activeTabId, group.id);
        }
        break;
      }
      case 'close-folder':
        navigate('/dashboard');
        break;
      case 'exit':
        // Navigate to landing page
        navigate('/');
        break;
      case 'toggle-command-palette':
      case 'command-palette':
        state.toggleCommandPalette();
        break;
      case 'go-dashboard':
        navigate('/dashboard');
        break;
      case 'find':
        // Trigger Monaco find via dispatched event (handled in EditorArea)
        window.dispatchEvent(new CustomEvent('editor:action', { detail: { action: 'find' } }));
        break;
      case 'undo':
        window.dispatchEvent(new CustomEvent('editor:action', { detail: { action: 'undo' } }));
        break;
      case 'redo':
        window.dispatchEvent(new CustomEvent('editor:action', { detail: { action: 'redo' } }));
        break;
      case 'cut':
        window.dispatchEvent(new CustomEvent('editor:action', { detail: { action: 'cut' } }));
        break;
      case 'copy':
        window.dispatchEvent(new CustomEvent('editor:action', { detail: { action: 'copy' } }));
        break;
      case 'paste':
        window.dispatchEvent(new CustomEvent('editor:action', { detail: { action: 'paste' } }));
        break;
      case 'select-all':
        window.dispatchEvent(new CustomEvent('editor:action', { detail: { action: 'selectAll' } }));
        break;
      case 'toggle-line-comment':
        window.dispatchEvent(new CustomEvent('editor:action', { detail: { action: 'toggleLineComment' } }));
        break;
      case 'toggle-block-comment':
        window.dispatchEvent(new CustomEvent('editor:action', { detail: { action: 'toggleBlockComment' } }));
        break;
      case 'format-document':
        window.dispatchEvent(new CustomEvent('editor:action', { detail: { action: 'formatDocument' } }));
        break;
      case 'format-selection':
        window.dispatchEvent(new CustomEvent('editor:action', { detail: { action: 'formatSelection' } }));
        break;
      case 'indent':
        window.dispatchEvent(new CustomEvent('editor:action', { detail: { action: 'indent' } }));
        break;
      case 'outdent':
        window.dispatchEvent(new CustomEvent('editor:action', { detail: { action: 'outdent' } }));
        break;
      case 'move-line-up':
        window.dispatchEvent(new CustomEvent('editor:action', { detail: { action: 'moveLineUp' } }));
        break;
      case 'move-line-down':
        window.dispatchEvent(new CustomEvent('editor:action', { detail: { action: 'moveLineDown' } }));
        break;
      case 'copy-line-up':
        window.dispatchEvent(new CustomEvent('editor:action', { detail: { action: 'copyLineUp' } }));
        break;
      case 'copy-line-down':
        window.dispatchEvent(new CustomEvent('editor:action', { detail: { action: 'copyLineDown' } }));
        break;
      case 'toggle-word-wrap':
        window.dispatchEvent(new CustomEvent('editor:action', { detail: { action: 'toggleWordWrap' } }));
        break;
      case 'replace':
        window.dispatchEvent(new CustomEvent('editor:action', { detail: { action: 'replace' } }));
        break;
      case 'find-in-files':
        state.setActiveSidebarView('search');
        break;
      case 'show-extensions':
        state.setActiveSidebarView('extensions');
        break;
      case 'toggle-tab-bar':
        state.updateSetting('showTabBar', !state.settings.showTabBar);
        break;
      case 'toggle-status-bar':
        state.updateSetting('showStatusBar', !state.settings.showStatusBar);
        break;
      case 'show-output':
        state.setActiveBottomPanel('output');
        break;
      case 'go-to-file':
        state.toggleCommandPalette();
        break;
      case 'go-to-symbol':
        window.dispatchEvent(new CustomEvent('editor:action', { detail: { action: 'goToSymbol' } }));
        break;
      case 'go-to-symbol-workspace':
        state.toggleCommandPalette();
        break;
      case 'go-to-definition':
        window.dispatchEvent(new CustomEvent('editor:action', { detail: { action: 'goToDefinition' } }));
        break;
      case 'go-to-type-definition':
        window.dispatchEvent(new CustomEvent('editor:action', { detail: { action: 'goToTypeDefinition' } }));
        break;
      case 'go-to-implementation':
        window.dispatchEvent(new CustomEvent('editor:action', { detail: { action: 'goToImplementation' } }));
        break;
      case 'go-to-references':
        window.dispatchEvent(new CustomEvent('editor:action', { detail: { action: 'goToReferences' } }));
        break;
      case 'peek-definition':
        window.dispatchEvent(new CustomEvent('editor:action', { detail: { action: 'peekDefinition' } }));
        break;
      case 'peek-type-definition':
        window.dispatchEvent(new CustomEvent('editor:action', { detail: { action: 'peekTypeDefinition' } }));
        break;
      case 'peek-implementation':
        window.dispatchEvent(new CustomEvent('editor:action', { detail: { action: 'peekImplementation' } }));
        break;
      case 'peek-references':
        window.dispatchEvent(new CustomEvent('editor:action', { detail: { action: 'peekReferences' } }));
        break;
      case 'go-to-bracket':
        window.dispatchEvent(new CustomEvent('editor:action', { detail: { action: 'goToBracket' } }));
        break;
      case 'next-problem':
        window.dispatchEvent(new CustomEvent('editor:action', { detail: { action: 'nextProblem' } }));
        break;
      case 'previous-problem':
        window.dispatchEvent(new CustomEvent('editor:action', { detail: { action: 'previousProblem' } }));
        break;
      case 'go-to-last-edit-location':
        window.dispatchEvent(new CustomEvent('editor:action', { detail: { action: 'goToLastEditLocation' } }));
        break;
      case 'go-to-breadcrumb':
        window.dispatchEvent(new CustomEvent('editor:action', { detail: { action: 'focusBreadcrumbs' } }));
        break;
      case 'toggle-sidebar':
        state.toggleSidebar();
        break;
      case 'toggle-bottom-panel':
        state.toggleBottomPanel();
        break;
      case 'toggle-right-panel':
        state.toggleRightPanel();
        break;
      case 'show-explorer':
        state.setActiveSidebarView('explorer');
        break;
      case 'show-search':
        state.setActiveSidebarView('search');
        break;
      case 'show-source-control':
        state.setActiveSidebarView('source-control');
        break;
      case 'show-debug':
        state.setActiveSidebarView('debug');
        break;
      case 'toggle-minimap':
        state.updateSetting('minimap', !state.settings.minimap);
        break;
      case 'toggle-breadcrumbs':
        state.updateSetting('breadcrumbs', !state.settings.breadcrumbs);
        break;
      case 'toggle-sticky-scroll':
        state.updateSetting('stickyScroll', !state.settings.stickyScroll);
        window.dispatchEvent(new CustomEvent('editor:action', { detail: { action: 'toggleStickyScroll' } }));
        break;
      case 'toggle-render-whitespace': {
        const cycle = { 'selection': 'boundary', 'boundary': 'all', 'all': 'trailing', 'trailing': 'none', 'none': 'selection' };
        const next = cycle[state.settings.renderWhitespace] || 'selection';
        state.updateSetting('renderWhitespace', next);
        window.dispatchEvent(new CustomEvent('editor:action', { detail: { action: 'toggleRenderWhitespace', value: next } }));
        break;
      }
      case 'show-problems':
        state.setActiveBottomPanel('problems');
        break;
      case 'show-terminal':
        state.setActiveBottomPanel('terminal');
        break;
      case 'show-debug-console':
        state.setActiveBottomPanel('debug-console');
        break;
      case 'open-view':
        state.openViewPicker();
        break;
      case 'show-activity-bar':
        state.toggleActivityBar();
        break;
      case 'toggle-centered-layout':
        state.updateSetting('centeredLayout', !state.settings.centeredLayout);
        break;
      case 'zen-mode':
        state.toggleZenMode();
        break;
      case 'fullscreen':
        if (document.fullscreenElement) {
          document.exitFullscreen();
        } else {
          document.documentElement.requestFullscreen();
        }
        break;
      case 'split-right':
      case 'split-down':
        state.splitEditor(actionId === 'split-down' ? 'vertical' : 'horizontal');
        break;
      case 'split-left':
        state.splitEditor('horizontal', true);
        break;
      case 'split-up':
        state.splitEditor('vertical', true);
        break;
      case 'layout-single':
        state.setEditorLayoutMode('single');
        break;
      case 'layout-two-columns':
        state.setEditorLayoutMode('two-columns');
        break;
      case 'layout-three-columns':
        state.setEditorLayoutMode('three-columns');
        break;
      case 'layout-two-rows':
        state.setEditorLayoutMode('two-rows');
        break;
      case 'layout-three-rows':
        state.setEditorLayoutMode('three-rows');
        break;
      case 'layout-grid':
        state.setEditorLayoutMode('grid');
        break;
      case 'flip-layout':
        state.flipLayout();
        break;
      case 'go-to-line':
        window.dispatchEvent(new CustomEvent('editor:action', { detail: { action: 'go-to-line' } }));
        break;
      case 'go-back':
        window.dispatchEvent(new CustomEvent('editor:action', { detail: { action: 'cursorUndo' } }));
        break;
      case 'go-forward':
        window.dispatchEvent(new CustomEvent('editor:action', { detail: { action: 'cursorRedo' } }));
        break;
      case 'run':
        state.runCode();
        break;
      case 'start-debugging':
        state.startDebugging();
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
      case 'enable-all-breakpoints':
        state.enableAllBreakpoints();
        break;
      case 'disable-all-breakpoints':
        state.disableAllBreakpoints();
        break;
      case 'remove-all-breakpoints':
        state.removeAllBreakpoints();
        break;
      case 'add-configuration': {
        // Open a new untitled launch.json in the editor
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
      case 'toggle-breakpoint': {
        // Use active line from a shared cursor position if available
        const activeLine = window.__editorCursorLine || 1;
        const existing = state.breakpoints.find(
          (b) => b.fileId === state.activeFile?.id && b.line === activeLine
        );
        if (existing) state.removeBreakpoint(activeLine);
        else state.addBreakpoint(activeLine);
        break;
      }
      case 'new-terminal':
        state.setActiveBottomPanel('terminal');
        terminal.createTerminal();
        break;
      case 'split-terminal':
        terminal.splitTerminal();
        break;
      case 'run-task': {
        // Detect tasks from package.json and show in command palette
        const scripts = terminal.getScriptTasks();
        if (scripts.length === 0) {
          // No tasks found, offer to configure
          const createConfig = confirm('No tasks found in workspace. Would you like to create a tasks.json configuration?');
          if (createConfig) {
            const g = state.getActiveGroup();
            const taskFile = {
              id: 'untitled-tasks-' + Date.now(),
              name: 'tasks.json',
              path: '.vscode/tasks.json',
              type: 'file',
              isUntitled: true,
            };
            state.openFile(taskFile, g?.id);
            state.updateCode(JSON.stringify({
              version: '2.0.0',
              tasks: [{
                label: 'build',
                type: 'shell',
                command: 'echo hello',
                group: 'build',
                presentation: { reveal: 'always' },
              }],
            }, null, 2), g?.id);
          }
        } else {
          // Build a pick list from package.json scripts
          const taskNames = scripts.map(function(s) { return s.name + ' - ' + s.command; }).join('\n');
          const picked = prompt('Select a task to run:\n\n' + taskNames + '\n\nEnter task name:');
          if (picked) {
            const script = scripts.find(function(s) { return s.name === picked.trim(); });
            if (script) {
              terminal.runTask(script.name, script.command);
            }
          }
        }
        break;
      }
      case 'run-build-task': {
        // Run the default build task if configured
        const defaultTask = terminal.defaultBuildTask;
        if (defaultTask) {
          terminal.runTask(defaultTask, defaultTask);
        } else {
          // Try to detect and run the first 'build' script
          const scripts = terminal.getScriptTasks();
          const buildScript = scripts.find(function(s) { return s.name === 'build'; });
          if (buildScript) {
            terminal.runTask(buildScript.name, buildScript.command);
          } else if (scripts.length > 0) {
            terminal.runTask(scripts[0].name, scripts[0].command);
          } else {
            alert('No build task configured. Use Terminal > Configure Default Build Task... to set one up.');
          }
        }
        break;
      }
      case 'run-active-file': {
        // Run the currently active file
        if (state.activeFile) {
          state.runCode();
        }
        break;
      }
      case 'run-selected-text': {
        // Dispatch event to get selected text from editor and run it in terminal
        window.dispatchEvent(new CustomEvent('editor:action', {
          detail: { action: 'runSelectedText' },
        }));
        break;
      }
      case 'show-running-tasks': {
        const tasks = terminal.runningTasks;
        if (tasks.length === 0) {
          alert('No running tasks.');
        } else {
          const taskList = tasks.map(function(t) { return t.name + ' (' + t.status + ')'; }).join('\n');
          alert('Running Tasks:\n\n' + taskList);
        }
        break;
      }
      case 'restart-running-task': {
        const tasks = terminal.runningTasks.filter(function(t) { return t.status === 'running'; });
        if (tasks.length === 0) {
          alert('No running tasks to restart.');
        } else if (tasks.length === 1) {
          terminal.restartTask(tasks[0].id);
        } else {
          const taskList = tasks.map(function(t, i) { return (i + 1) + '. ' + t.name; }).join('\n');
          const picked = prompt('Select task to restart:\n\n' + taskList + '\n\nEnter number:');
          const idx = parseInt(picked || '0') - 1;
          if (idx >= 0 && idx < tasks.length) {
            terminal.restartTask(tasks[idx].id);
          }
        }
        break;
      }
      case 'terminate-task': {
        const tasks = terminal.runningTasks.filter(function(t) { return t.status === 'running'; });
        if (tasks.length === 0) {
          alert('No running tasks to terminate.');
        } else if (tasks.length === 1) {
          terminal.terminateTask(tasks[0].id);
        } else {
          const taskList = tasks.map(function(t, i) { return (i + 1) + '. ' + t.name; }).join('\n');
          const picked = prompt('Select task to terminate:\n\n' + taskList + '\n\nEnter number:');
          const idx = parseInt(picked || '0') - 1;
          if (idx >= 0 && idx < tasks.length) {
            terminal.terminateTask(tasks[idx].id);
          }
        }
        break;
      }
      case 'configure-tasks': {
        // Open or create .vscode/tasks.json
        const existingTaskFile = state.files.find(function(f) {
          return f.path === '.vscode/tasks.json' || f.name === 'tasks.json';
        });
        const g = state.getActiveGroup();
        if (existingTaskFile) {
          state.openFile(existingTaskFile, g?.id);
        } else {
          const taskFile = {
            id: 'untitled-tasks-' + Date.now(),
            name: 'tasks.json',
            path: '.vscode/tasks.json',
            type: 'file',
            isUntitled: true,
          };
          state.openFile(taskFile, g?.id);
          state.updateCode(JSON.stringify({
            version: '2.0.0',
            tasks: [{
              label: 'build',
              type: 'shell',
              command: 'echo hello',
              group: 'build',
              presentation: { reveal: 'always' },
            }],
          }, null, 2), g?.id);
        }
        break;
      }
      case 'configure-default-build-task': {
        const scripts = terminal.getScriptTasks();
        if (scripts.length === 0) {
          alert('No scripts found in package.json. Add scripts first, then set the default build task.');
        } else {
          const taskList = scripts.map(function(s, i) { return (i + 1) + '. ' + s.name + ' - ' + s.command; }).join('\n');
          const picked = prompt('Select default build task:\n\n' + taskList + '\n\nEnter number (or leave empty to clear):');
          const idx = parseInt(picked || '') - 1;
          if (idx >= 0 && idx < scripts.length) {
            terminal.setDefaultBuildTask(scripts[idx].name);
          } else if (picked === '' || picked === null) {
            terminal.setDefaultBuildTask(null);
          }
        }
        break;
      }
      case 'kill-terminal': {
        if (terminal.activeTerminalId) {
          terminal.killTerminal(terminal.activeTerminalId);
        }
        break;
      }
      case 'configure-terminal-settings': {
        state.setRightPanelTab('settings');
        break;
      }
      case 'about':
        alert('AetherStudio \u2014 AI-Powered Collaborative IDE\n\nVersion: 1.0.0\n\nBuilt with React, Monaco Editor, and Socket.IO');
        break;
      case 'keyboard-shortcuts':
        state.toggleCommandPalette();
        break;
      case 'documentation':
        window.open('https://codebuff.com/docs', '_blank');
        break;
      case 'report-issue':
        window.open('https://github.com/codebuff-org/codebuff/issues', '_blank');
        break;
      default:
        // Handle recent-* action IDs (Open Recent submenu)
        if (typeof actionId === 'string' && actionId.startsWith('recent-')) {
          const itemId = actionId.replace('recent-', '');
          const recItem = state.recentItems.find(i => i.id === itemId);
          if (recItem?.type === 'file' && recItem.workspaceId) {
            // File item — if already on the right workspace, open in editor
            if (state.workspace?._id === recItem.workspaceId) {
              state.openFile({ id: recItem.id, name: recItem.name, type: 'file' });
              state.fetchFileContent(recItem.id).then(content => {
                if (content) {
                  const group = state.getActiveGroup();
                  if (group) state.updateCode(content, group.id);
                }
              });
            } else {
              navigate(`/workspace/${recItem.workspaceId}`);
            }
          } else {
            // Workspace item — navigate directly
            navigate(`/workspace/${itemId}`);
          }
        }
        break;
    }
  }, [navigate, pickFile]);

  // ── Register keyboard shortcut listener AFTER handleAction is defined ──
  useEffect(() => {
    const handler = (e) => {
      const { actionId } = e.detail;
      if (actionId) {
        handleAction(actionId);
      }
    };
    window.addEventListener('menu:action', handler);
    return () => window.removeEventListener('menu:action', handler);
  }, [handleAction]);

  // Dynamic File menu items (uses recentItems from store)
  const fileMenuItems = useMemo(() => [
    { id: 'new-file', label: 'New File', shortcut: 'Ctrl+N', icon: FilePlus },
    { id: 'new-window', label: 'New Window', shortcut: 'Ctrl+Shift+N', icon: FilePlus },
    { type: 'divider' },
    { id: 'open-file', label: 'Open File...', shortcut: 'Ctrl+O', icon: FolderOpen },
    { id: 'open-folder', label: 'Open Folder...', shortcut: 'Ctrl+K Ctrl+O', icon: FolderOpen },
    {
      id: 'open-recent', label: 'Open Recent', icon: FolderOpen,
      children: recentItems.length > 0
        ? recentItems.map((item) => ({
            id: `recent-${item.id}`,
            label: item.name,
            icon: item.type === 'file' ? FileEdit : item.type === 'workspace' ? LayoutDashboard : FolderOpen,
          }))
        : [{ id: 'no-recent', label: '(empty)', disabled: true }],
    },
    { type: 'divider' },
    { id: 'save', label: 'Save', shortcut: 'Ctrl+S', icon: Save },
    { id: 'save-as', label: 'Save As...', shortcut: 'Ctrl+Shift+S', icon: Save },
    { id: 'save-all', label: 'Save All', shortcut: 'Ctrl+K S', icon: Save },
    { id: 'revert-file', label: 'Revert File', shortcut: '', icon: Undo2 },
    { type: 'divider' },
    {
      id: 'auto-save', label: 'Auto Save', icon: Save,
      children: [
        { id: 'auto-save-off', label: 'Off', icon: XCircle },
        { id: 'auto-save-afterDelay', label: 'After Delay', icon: Save },
        { id: 'auto-save-onFocusChange', label: 'On Focus Change', icon: FileEdit },
        { id: 'auto-save-onWindowChange', label: 'On Window Change', icon: PanelTop },
      ],
    },
    {
      id: 'preferences', label: 'Preferences', icon: Settings,
      children: [
        { id: 'settings', label: 'Settings', shortcut: 'Ctrl+,', icon: Settings },
        { id: 'keyboard-shortcuts', label: 'Keyboard Shortcuts', shortcut: 'Ctrl+K Ctrl+S', icon: Keyboard },
        { id: 'show-extensions', label: 'Extensions', shortcut: 'Ctrl+Shift+X', icon: Spline },
        { id: 'themes', label: 'Color Theme', icon: Eye },
      ],
    },
    { type: 'divider' },
    { id: 'close-tab', label: 'Close Tab', shortcut: 'Ctrl+W', icon: X },
    { id: 'close-other-tabs', label: 'Close Others', shortcut: 'Ctrl+Shift+W', icon: XCircle },
    { id: 'close-all-tabs', label: 'Close All', shortcut: '', icon: XCircle },
    { type: 'divider' },
    { id: 'close-folder', label: 'Close Folder', shortcut: '', icon: ArrowLeft },
    { id: 'exit', label: 'Exit', shortcut: 'Alt+F4', icon: XCircle },
  ], [recentItems]);

  // Close submenu when main menu closes
  useEffect(() => {
    if (!openMenu) {
      setOpenSubmenu(null);
      setActiveSubmenuItem(null);
      setSubmenuPos(null);
    }
  }, [openMenu]);

  // Close menu on outside click
  useEffect(() => {
    const handleClick = (e) => {
      if (menuBarRef.current && !menuBarRef.current.contains(e.target)) {
        setOpenMenu(null);
        setOpenSubmenu(null);
        setActiveSubmenuItem(null);
        setSubmenuPos(null);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Keyboard navigation within open menu
  const handleMenuKeyDown = useCallback((e, menuName) => {
    // Use merged menu items so File uses the dynamic version
    const allItems = { ...menuItems, File: fileMenuItems };
    const items = allItems[menuName].filter(i => i.type !== 'divider');
    const currentIdx = focusedIndex;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setFocusedIndex(Math.min(currentIdx + 1, items.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setFocusedIndex(Math.max(currentIdx - 1, 0));
        break;
      case 'ArrowRight': {
        e.preventDefault();
        const menuNames = Object.keys(menuItems);
        const idx = menuNames.indexOf(menuName);
        const nextMenu = menuNames[(idx + 1) % menuNames.length];
        setOpenMenu(nextMenu);
        setFocusedIndex(0);
        break;
      }
      case 'ArrowLeft': {
        e.preventDefault();
        const menuNames = Object.keys(menuItems);
        const idx = menuNames.indexOf(menuName);
        const prevMenu = menuNames[(idx - 1 + menuNames.length) % menuNames.length];
        setOpenMenu(prevMenu);
        setFocusedIndex(0);
        break;
      }
      case 'Enter':
        e.preventDefault();
        if (items[currentIdx]) {
          handleAction(items[currentIdx].id);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setOpenMenu(null);
        break;
    }
  }, [focusedIndex, handleAction, fileMenuItems]);

  return (
    <div ref={menuBarRef} className="flex items-center relative z-50">
      <span className="flex items-center gap-0.5">
        {Object.entries({ ...menuItems, File: fileMenuItems }).map(([name, items], i) => (
          <React.Fragment key={name}>
            {i > 0 && (
              <div className="w-px h-3 mx-0.5" style={{ background: 'rgba(255,255,255,0.06)' }} />
            )}
            <div className="relative">
              <motion.button
                whileHover={{
                  color: 'rgba(255,255,255,0.5)',
                  backgroundColor: 'rgba(255,255,255,0.04)',
                }}
                whileTap={{ scale: 0.97 }}
                onClick={() => {
                  setOpenMenu(openMenu === name ? null : name);
                  setFocusedIndex(0);
                }}
                onMouseEnter={() => {
                  if (openMenu && openMenu !== name) {
                    setOpenMenu(name);
                    setFocusedIndex(0);
                  }
                }}                className={`px-2.5 py-0.5 rounded-[4px] text-[11px] leading-none transition-all duration-75 select-none ${
  openMenu === name
    ? 'text-[rgba(255,255,255,0.5)]'
    : 'text-[rgba(255,255,255,0.3)] hover:text-[rgba(255,255,255,0.5)]'
}`}
                style={{
                  background: openMenu === name ? 'rgba(255,255,255,0.04)' : 'transparent',
                }}
              >
                {name}
              </motion.button>
              <AnimatePresence>
                {openMenu === name && (
                  <motion.div
                    initial={{ opacity: 0, y: -4, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -4, scale: 0.96 }}
                    transition={{ duration: 0.12, ease: [0.25, 0.1, 0.25, 1] }}
                    className="absolute left-0 top-full mt-0.5 min-w-[240px] overflow-y-auto"
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
                    onKeyDown={(e) => handleMenuKeyDown(e, name)}
                  >
                    <div className="py-1">
                      {items.map((item, idx) => {
                        if (item.type === 'divider') {
                          return (
                            <div
                              key={`divider-${idx}`}
                              className="my-1 mx-3"
                              style={{ height: '1px', background: 'rgba(255,255,255,0.06)' }}
                            />
                          );
                        }
                        const isSelected = focusedIndex === idx;
                        const Icon = item.icon;
                        const hasSubmenu = item.children && item.children.length > 0;

                        // ── Submenu item ──
                        if (hasSubmenu) {
                          return (
                            <div
                              key={item.id}
                              className="relative"
                              onMouseEnter={(e) => {
                                if (submenuTimerRef.current) { clearTimeout(submenuTimerRef.current); submenuTimerRef.current = null; }
                                const rect = e.currentTarget.getBoundingClientRect();
                                setSubmenuPos({ top: rect.top, left: rect.right + 4 });
                                setActiveSubmenuItem(item);
                                setOpenSubmenu(item.id);
                              }}
                              onMouseLeave={() => {
                                submenuTimerRef.current = setTimeout(() => {
                                  setOpenSubmenu((current) => current === item.id ? null : current);
                                  setActiveSubmenuItem(null);
                                  setSubmenuPos(null);
                                  submenuTimerRef.current = null;
                                }, 300);
                              }}
                            >
                              <motion.button
                                onClick={(e) => {
                                  if (openSubmenu === item.id) {
                                    setOpenSubmenu(null);
                                    setActiveSubmenuItem(null);
                                    setSubmenuPos(null);
                                  } else {
                                    const rect = e.currentTarget.getBoundingClientRect();
                                    setSubmenuPos({ top: rect.top, left: rect.right + 4 });
                                    setOpenSubmenu(item.id);
                                    setActiveSubmenuItem(item);
                                  }
                                }}
                                className="w-full flex items-center gap-2.5 px-3 py-1.5 text-[12px] transition-all duration-75 cursor-pointer"
                                style={{
                                  color: openSubmenu === item.id ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.4)',
                                  background: openSubmenu === item.id ? 'rgba(255,255,255,0.04)' : 'transparent',
                                }}
                              >
                                {Icon && (
                                  <Icon size={13} style={{ color: 'rgba(255,255,255,0.2)' }} />
                                )}
                                <span className="flex-1 text-left">{item.label}</span>
                                <ChevronRight size={11} style={{ color: 'rgba(255,255,255,0.15)' }} />
                              </motion.button>
                            </div>
                          );
                        }

                        // ── Regular menu item ──
                        return (
                          <motion.button
                            key={item.id}
                            onClick={() => handleAction(item.id)}
                            onMouseEnter={() => setFocusedIndex(idx)}
                            ref={isSelected ? (el) => el?.scrollIntoView?.({ block: 'nearest' }) : undefined}
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
          </React.Fragment>
        ))}
      </span>
      {/* Submenu portal — rendered at document.body to avoid CSS overflow clipping */}
      {openSubmenu && activeSubmenuItem && submenuPos && document.body && createPortal(
        <motion.div
          initial={{ opacity: 0, x: -4, scale: 0.96 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          transition={{ duration: 0.1 }}
          onMouseDown={(e) => e.stopPropagation()}
          onMouseEnter={() => {
            if (submenuTimerRef.current) { clearTimeout(submenuTimerRef.current); submenuTimerRef.current = null; }
          }}
          onMouseLeave={() => {
            setOpenSubmenu(null);
            setActiveSubmenuItem(null);
            setSubmenuPos(null);
          }}
          style={{
            position: 'fixed',
            top: submenuPos.top,
            left: submenuPos.left,
            zIndex: 9999,
            minWidth: '200px',
            background: 'rgba(18,18,22,0.95)',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: '8px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.6), 0 2px 8px rgba(0,0,0,0.4)',
            backdropFilter: 'blur(40px)',
            WebkitBackdropFilter: 'blur(40px)',
            maxHeight: '50vh',
            overflowY: 'auto',
          }}
        >
          <div className="py-1">
            {activeSubmenuItem.children.map((child) => {
              const ChildIcon = child.icon;
              return (
                <motion.button
                  key={child.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAction(child.id);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-1.5 text-[12px] transition-all duration-75 cursor-pointer"
                  style={{
                    color: 'rgba(255,255,255,0.4)',
                    opacity: child.disabled ? 0.3 : 1,
                  }}
                  whileHover={{
                    background: child.disabled ? 'transparent' : 'rgba(255,255,255,0.04)',
                    color: child.disabled ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.5)',
                  }}
                >
                  {ChildIcon && (
                    <ChildIcon size={13} style={{ color: 'rgba(255,255,255,0.2)' }} />
                  )}
                  <span className="flex-1 text-left">{child.label}</span>
                  {child.shortcut && (
                    <kbd style={{ color: 'rgba(255,255,255,0.15)', fontSize: '10px', fontFamily: 'inherit' }}>{child.shortcut}</kbd>
                  )}
                </motion.button>
              );
            })}
          </div>
        </motion.div>,
        document.body
      )}
    </div>
  );
}
