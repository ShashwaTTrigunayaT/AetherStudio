import { create } from 'zustand';
import { getSocket, connectSocket } from '../lib/api';
import { useWorkspace } from './useWorkspace';

let terminalCounter = 1;

function createTerminalId() {
  return `terminal-${Date.now()}-${terminalCounter++}`;
}

function createGroupId() {
  return `terminal-group-${Date.now()}-${terminalCounter++}`;
}

function getDefaultShellName() {
  // Backend runs in a Docker/Linux container — default to bash.
  // Windows-native shells (powershell, cmd) are not available on the backend.
  return 'bash';
}

const SHELL_OPTIONS = [
  { id: 'bash', label: 'bash', description: 'GNU Bourne-Again Shell (recommended)' },
  { id: 'sh', label: 'sh', description: 'Bourne Shell (minimal)' },
  { id: 'zsh', label: 'zsh', description: 'Z Shell' },
  { id: 'fish', label: 'fish', description: 'Friendly Interactive Shell' },
  { id: 'powershell', label: 'powershell', description: 'PowerShell Core (Docker only)' },
  { id: 'pwsh', label: 'pwsh', description: 'PowerShell 7+' },
  { id: 'cmd', label: 'cmd', description: 'Windows Command Prompt (Docker only)' },
];

// ── Terminal Profiles ──
const DEFAULT_PROFILES = [
  { id: 'bash-default', name: 'Bash (default)', shell: 'bash', env: {} },
  { id: 'bash-power', name: 'Bash (developer)', shell: 'bash', env: { NODE_ENV: 'development', EDITOR: 'vim' } },
  { id: 'zsh-default', name: 'Zsh (default)', shell: 'zsh', env: {} },
  { id: 'sh-minimal', name: 'Sh (minimal)', shell: 'sh', env: {} },
  { id: 'fish-default', name: 'Fish (default)', shell: 'fish', env: {} },
  { id: 'powershell-core', name: 'PowerShell Core', shell: 'powershell', env: {} },
  { id: 'cmd-win', name: 'Command Prompt', shell: 'cmd', env: {} },
];

// ── Predefined Terminal Themes ──
const TERMINAL_THEMES = {
  'aether-light': {
    name: 'Aether Light', background: 'rgba(255,255,255,0.85)', foreground: '#1f2937',
    cursor: '#007acc', cursorAccent: '#ffffff', selectionBackground: 'rgba(0, 122, 204, 0.25)',
    black: '#1f2937', red: '#dc2626', green: '#16a34a', yellow: '#ca8a04',
    blue: '#2563eb', magenta: '#9333ea', cyan: '#0891b2', white: '#f8fafc',
    brightBlack: '#475569', brightRed: '#ef4444', brightGreen: '#22c55e',
    brightYellow: '#eab308', brightBlue: '#6b7280', brightMagenta: '#a855f7',
    brightCyan: '#06b6d4', brightWhite: '#ffffff',
  },
  'cyberpunk-neon': {
    name: 'Cyberpunk Neon', background: '#000000', foreground: '#d0d0d0',
    cursor: '#00f0ff', cursorAccent: '#000000', selectionBackground: 'rgba(0, 240, 255, 0.25)',
    black: '#101018', red: '#ff2d95', green: '#00ff41', yellow: '#ffd300',
    blue: '#0088ff', magenta: '#ff00ff', cyan: '#00f0ff', white: '#d0d0d0',
    brightBlack: '#303048', brightRed: '#ff5fa0', brightGreen: '#40ff7a',
    brightYellow: '#ffe040', brightBlue: '#40a0ff', brightMagenta: '#ff40ff',
    brightCyan: '#40f4ff', brightWhite: '#f0f0f0',
  },
  'dracula': {
    name: 'Dracula', background: '#282a36', foreground: '#f8f8f2',
    cursor: '#ff79c6', cursorAccent: '#282a36', selectionBackground: 'rgba(255, 121, 198, 0.25)',
    black: '#21222c', red: '#ff5555', green: '#50fa7b', yellow: '#f1fa8c',
    blue: '#bd93f9', magenta: '#ff79c6', cyan: '#8be9fd', white: '#f8f8f2',
    brightBlack: '#6272a4', brightRed: '#ff6e6e', brightGreen: '#69ff94',
    brightYellow: '#ffffa5', brightBlue: '#d6acff', brightMagenta: '#ff92df',
    brightCyan: '#a4ffff', brightWhite: '#ffffff',
  },
  'nord': {
    name: 'Nord', background: '#2e3440', foreground: '#d8dee9',
    cursor: '#88c0d0', cursorAccent: '#2e3440', selectionBackground: 'rgba(136, 192, 208, 0.25)',
    black: '#3b4252', red: '#bf616a', green: '#a3be8c', yellow: '#ebcb8b',
    blue: '#81a1c1', magenta: '#b48ead', cyan: '#88c0d0', white: '#e5e9f0',
    brightBlack: '#4c566a', brightRed: '#bf616a', brightGreen: '#a3be8c',
    brightYellow: '#ebcb8b', brightBlue: '#81a1c1', brightMagenta: '#b48ead',
    brightCyan: '#8fbcbb', brightWhite: '#eceff4',
  },
  'one-dark': {
    name: 'One Dark', background: '#1e1e1e', foreground: '#abb2bf',
    cursor: '#528bff', cursorAccent: '#1e1e1e', selectionBackground: 'rgba(82, 139, 255, 0.25)',
    black: '#1e1e1e', red: '#e06c75', green: '#98c379', yellow: '#d19a66',
    blue: '#61afef', magenta: '#c678dd', cyan: '#56b6c2', white: '#abb2bf',
    brightBlack: '#5c6370', brightRed: '#e06c75', brightGreen: '#98c379',
    brightYellow: '#d19a66', brightBlue: '#61afef', brightMagenta: '#c678dd',
    brightCyan: '#56b6c2', brightWhite: '#ffffff',
  },
  'solarized-dark': {
    name: 'Solarized Dark', background: '#002b36', foreground: '#839496',
    cursor: '#859900', cursorAccent: '#002b36', selectionBackground: 'rgba(133, 153, 0, 0.25)',
    black: '#073642', red: '#dc322f', green: '#859900', yellow: '#b58900',
    blue: '#268bd2', magenta: '#d33682', cyan: '#2aa198', white: '#eee8d5',
    brightBlack: '#586e75', brightRed: '#cb4b16', brightGreen: '#859900',
    brightYellow: '#b58900', brightBlue: '#268bd2', brightMagenta: '#d33682',
    brightCyan: '#2aa198', brightWhite: '#fdf6e3',
  },
};

// ── Load persisted data ──
function loadPersistedProfiles() {
  try {
    const saved = localStorage.getItem('aether-terminal-profiles');
    if (saved) return JSON.parse(saved);
  } catch { /*ignore*/ }
  return [];
}

function loadActiveProfile() {
  try {
    return localStorage.getItem('aether-active-terminal-profile') || 'bash-default';
  } catch { return 'bash-default'; }
}

export { TERMINAL_THEMES };

export const useTerminal = create((set, get) => ({
  // ── Terminal Instances ──
  terminals: [],
  terminalGroups: [],
  terminalLayout: null,
  activeTerminalId: null,
  activeGroupId: null,

  // ── Multi-Select ──
  selectedTerminalIds: [],

  // ── Terminal Profiles ──
  terminalProfiles: [...DEFAULT_PROFILES, ...loadPersistedProfiles()],
  activeProfileId: loadActiveProfile(),

  // ── Per-Terminal Theme Override ──
  terminalThemeOverrides: {}, // { [terminalId]: themeKey }

  // ── Search ──
  searchVisible: false,
  searchQuery: '',
  searchCaseSensitive: false,
  searchWholeWord: false,
  searchRegex: false,
  searchResultIndex: 0,
  searchResultCount: 0,

  // ── Context Menu ──
  contextMenu: null, // { x, y, terminalId }
  renamingTerminalId: null,

  // ── Shell Options ──
  shellOptions: SHELL_OPTIONS,

  // ── Helper: emit terminal-create to socket, queueing if not yet connected ──
  _getWorkspaceId: () => {
    // 1) Try reading from the workspace store (most reliable, but async on first load)
    try {
      const wsId = useWorkspace.getState().workspace?._id;
      if (wsId) return wsId;
    } catch {
      // ignore
    }

    // 2) Fallback: parse workspace ID from URL path (/workspace/:id)
    // This handles the race condition on page load where the workspace store
    // hasn't been populated yet when the terminal is first created.
    try {
      const match = window.location.pathname.match(/^\/workspace\/([a-fA-F0-9]+)$/);
      if (match) return match[1];
    } catch {
      // ignore
    }

    return null;
  },

  _emitTerminalCreate: (terminalId, shell) => {
    const socket = getSocket();
    const workspaceId = get()._getWorkspaceId();
    const payload = { terminalId, shell, workspaceId };
    if (socket.connected) {
      socket.emit('terminal-create', payload);
    } else {
      // Socket isn't connected yet — queue emission for when it connects
      const onConnect = () => {
        socket.off('connect', onConnect);
        socket.emit('terminal-create', payload);
      };
      socket.on('connect', onConnect);
      // Also start connecting if not already
      connectSocket();
    }
  },

  // ── Helper: re-emit terminal-create for all terminals (used on socket reconnect) ──
  _resyncTerminals: () => {
    const state = get();
    const socket = getSocket();
    const workspaceId = get()._getWorkspaceId();
    if (socket.connected) {
      state.terminals.forEach((t) => {
        socket.emit('terminal-create', { terminalId: t.id, shell: t.shell, workspaceId });
      });
    }
  },

  // ── Multi-Select Actions ──
  toggleTerminalSelection: (terminalId) => {
    set((state) => {
      const selected = state.selectedTerminalIds;
      if (selected.includes(terminalId)) {
        return { selectedTerminalIds: selected.filter((id) => id !== terminalId) };
      }
      return { selectedTerminalIds: [...selected, terminalId] };
    });
  },

  clearTerminalSelection: () => {
    set({ selectedTerminalIds: [] });
  },

  killSelectedTerminals: () => {
    const state = get();
    const ids = state.selectedTerminalIds.length > 0
      ? state.selectedTerminalIds
      : (state.activeTerminalId ? [state.activeTerminalId] : []);
    const socket = getSocket();
    ids.forEach((id) => {
      if (socket?.connected) socket.emit('terminal-kill', { terminalId: id });
    });
    const remaining = state.terminals.filter((t) => !ids.includes(t.id));
    let newActive = state.activeTerminalId;
    if (ids.includes(state.activeTerminalId)) {
      newActive = remaining.length > 0 ? remaining[remaining.length - 1].id : null;
    }
    set({
      terminals: remaining,
      selectedTerminalIds: [],
      activeTerminalId: newActive,
    });
  },

  clearSelectedTerminals: () => {
    const state = get();
    const ids = state.selectedTerminalIds.length > 0
      ? state.selectedTerminalIds
      : (state.activeTerminalId ? [state.activeTerminalId] : []);
    ids.forEach((id) => {
      const socket = getSocket();
      if (socket?.connected) socket.emit('terminal-clear', { terminalId: id });
    });
    set({ selectedTerminalIds: [] });
  },

  // ── Terminal Profiles ──
  setActiveProfile: (profileId) => {
    set({ activeProfileId: profileId });
    localStorage.setItem('aether-active-terminal-profile', profileId);
  },

  getActiveProfile: () => {
    const state = get();
    return state.terminalProfiles.find((p) => p.id === state.activeProfileId) || state.terminalProfiles[0];
  },

  addCustomProfile: (profile) => {
    const newProfile = { ...profile, id: 'custom-' + Date.now() };
    set((state) => {
      const updated = [...state.terminalProfiles, newProfile];
      localStorage.setItem('aether-terminal-profiles', JSON.stringify(updated.filter((p) => p.id.startsWith('custom-'))));
      return { terminalProfiles: updated };
    });
    return newProfile.id;
  },

  removeCustomProfile: (profileId) => {
    set((state) => {
      const updated = state.terminalProfiles.filter((p) => p.id !== profileId);
      localStorage.setItem('aether-terminal-profiles', JSON.stringify(updated.filter((p) => p.id.startsWith('custom-'))));
      return { terminalProfiles: updated };
    });
  },

  // ── Per-Terminal Theme ──
  setTerminalTheme: (terminalId, themeKey) => {
    set((state) => ({
      terminalThemeOverrides: {
        ...state.terminalThemeOverrides,
        [terminalId]: themeKey,
      },
    }));
  },

  clearTerminalTheme: (terminalId) => {
    set((state) => {
      const overrides = { ...state.terminalThemeOverrides };
      delete overrides[terminalId];
      return { terminalThemeOverrides: overrides };
    });
  },

  // ── Create a new terminal ──
  createTerminal: (shellName, profileId) => {
    const state = get();
    const id = createTerminalId();

    // Determine shell from profile if provided
    let shell = shellName || getDefaultShellName();
    if (profileId) {
      const profile = state.terminalProfiles.find((p) => p.id === profileId);
      if (profile) shell = profile.shell;
    }

    const count = state.terminals.filter(t => t.groupId === state.activeGroupId).length + 1;
    const terminalName = count === 1 ? 'Terminal' : `Terminal ${count}`;

    state._emitTerminalCreate(id, shell);

    const newTerminal = {
      id,
      name: terminalName,
      shell,
      groupId: state.activeGroupId,
      created: Date.now(),
    };

    set((prev) => ({
      terminals: [...prev.terminals, newTerminal],
      activeTerminalId: id,
    }));

    return id;
  },

  // ── Create terminal in a specific group ──
  createTerminalInGroup: (groupId, shellName, profileId) => {
    const state = get();
    const id = createTerminalId();

    let shell = shellName || getDefaultShellName();
    if (profileId) {
      const profile = state.terminalProfiles.find((p) => p.id === profileId);
      if (profile) shell = profile.shell;
    }

    const count = state.terminals.filter(t => t.groupId === groupId).length + 1;
    const terminalName = count === 1 ? 'Terminal' : `Terminal ${count}`;

    state._emitTerminalCreate(id, shell);

    const newTerminal = {
      id,
      name: terminalName,
      shell,
      groupId,
      created: Date.now(),
    };

    set((prev) => ({
      terminals: [...prev.terminals, newTerminal],
      activeTerminalId: id,
      activeGroupId: groupId,
    }));

    return id;
  },

  // ── Kill a terminal ──
  killTerminal: (terminalId) => {
    const state = get();
    const terminal = state.terminals.find((t) => t.id === terminalId);
    if (!terminal) return;

    const groupTerminals = state.terminals.filter(
      (t) => t.groupId === terminal.groupId && t.id !== terminalId
    );

    // Notify backend
    const socket = getSocket();
    if (socket?.connected) {
      socket.emit('terminal-kill', { terminalId });
    }

    // If last terminal in group, remove the group too if there are other groups
    let newGroups = state.terminalGroups;
    let newLayout = state.terminalLayout;

    if (groupTerminals.length === 0 && state.terminalGroups.length > 1) {
      newGroups = state.terminalGroups.filter((g) => g.id !== terminal.groupId);
      newLayout = rebuildLayoutAfterGroupRemoval(state.terminalLayout, terminal.groupId, newGroups);
    }

    const newTerminals = state.terminals.filter((t) => t.id !== terminalId);

    // Determine new active terminal
    let newActiveId = state.activeTerminalId;
    if (state.activeTerminalId === terminalId) {
      if (groupTerminals.length > 0) {
        newActiveId = groupTerminals[groupTerminals.length - 1].id;
      } else if (newTerminals.length > 0) {
        newActiveId = newTerminals[newTerminals.length - 1].id;
      } else {
        newActiveId = null;
      }
    }

    set({
      terminals: newTerminals,
      terminalGroups: newGroups,
      terminalLayout: newLayout,
      activeTerminalId: newActiveId,
    });
  },

  // ── Set active terminal (clears selection unless Ctrl held) ──
  setActiveTerminal: (terminalId, keepSelection = false) => {
    const state = get();
    const terminal = state.terminals.find((t) => t.id === terminalId);
    if (terminal) {
      set({
        activeTerminalId: terminalId,
        activeGroupId: terminal.groupId,
        selectedTerminalIds: keepSelection ? state.selectedTerminalIds : [],
      });
    }
  },

  // ── Rename terminal ──
  renameTerminal: (terminalId, newName) => {
    set((state) => ({
      terminals: state.terminals.map((t) =>
        t.id === terminalId ? { ...t, name: newName } : t
      ),
    }));
  },

  // ── Start renaming ──
  startRenaming: (terminalId) => {
    set({ renamingTerminalId: terminalId });
  },

  // ── Finish renaming ──
  finishRenaming: () => {
    set({ renamingTerminalId: null });
  },

  // ── Reorder terminals ──
  moveTerminal: (fromIndex, toIndex) => {
    const state = get();
    const groupId = state.activeGroupId;
    const groupTerminals = state.terminals
      .filter((t) => t.groupId === groupId)
      .sort((a, b) => state.terminals.indexOf(a) - state.terminals.indexOf(b));

    const [moved] = groupTerminals.splice(fromIndex, 1);
    groupTerminals.splice(toIndex, 0, moved);

    const otherTerminals = state.terminals.filter((t) => t.groupId !== groupId);
    const newTerminals = [...otherTerminals, ...groupTerminals];

    set({ terminals: newTerminals });
  },

  // ── Move terminal to another group ──
  moveTerminalToGroup: (terminalId, targetGroupId) => {
    set((state) => {
      const terminal = state.terminals.find((t) => t.id === terminalId);
      if (!terminal) return state;

      // Don't move if it's the last terminal in a group and there are multiple groups
      const groupTerminals = state.terminals.filter((t) => t.groupId === terminal.groupId);
      if (groupTerminals.length <= 1 && state.terminalGroups.length > 1) return state;

      return {
        terminals: state.terminals.map((t) =>
          t.id === terminalId ? { ...t, groupId: targetGroupId } : t
        ),
        activeTerminalId: terminalId,
        activeGroupId: targetGroupId,
      };
    });
  },

  // ── Terminal Groups (for split terminals) ──
  initLayout: () => {
    const state = get();
    if (state.terminalGroups.length === 0) {
      const groupId = createGroupId();
      set({
        terminalGroups: [{ id: groupId, direction: 'horizontal' }],
        terminalLayout: { type: 'group', id: groupId },
        activeGroupId: groupId,
      });
    }
  },

  splitTerminal: () => {
    const state = get();
    if (!state.activeGroupId) return;

    const newGroupId = createGroupId();
    const currentGroup = state.terminalGroups.find((g) => g.id === state.activeGroupId);

    if (!currentGroup) return;

    // Create a new terminal in the new group
    const newGroup = { id: newGroupId, direction: 'horizontal' };

    // Build split layout
    const newLayout = {
      type: 'split',
      direction: 'horizontal',
      children: [
        { type: 'group', id: state.activeGroupId },
        { type: 'group', id: newGroupId },
      ],
      sizes: [50, 50],
    };

    let updatedLayout;
    if (state.terminalLayout.type === 'group') {
      updatedLayout = newLayout;
    } else {
      updatedLayout = replaceInLayout(state.terminalLayout, state.activeGroupId, {
        type: 'split',
        direction: 'horizontal',
        children: [
          { type: 'group', id: state.activeGroupId },
          { type: 'group', id: newGroupId },
        ],
        sizes: [50, 50],
      });
    }

    set({
      terminalGroups: [...state.terminalGroups, newGroup],
      terminalLayout: updatedLayout,
      activeGroupId: newGroupId,
    });

    // Create a default terminal in the new group
    state.createTerminalInGroup(newGroupId);
  },

  closeTerminalGroup: (groupId) => {
    const state = get();
    if (state.terminalGroups.length <= 1) return;

    const groupTerminals = state.terminals.filter((t) => t.groupId === groupId);

    // Kill all terminals in this group
    const socket = getSocket();
    groupTerminals.forEach((t) => {
      if (socket?.connected) {
        socket.emit('terminal-kill', { terminalId: t.id });
      }
    });

    const newGroups = state.terminalGroups.filter((g) => g.id !== groupId);
    const newTerminals = state.terminals.filter((t) => t.groupId !== groupId);
    const newLayout = rebuildLayoutAfterGroupRemoval(state.terminalLayout, groupId, newGroups);

    set({
      terminals: newTerminals,
      terminalGroups: newGroups,
      terminalLayout: newLayout,
      activeGroupId: newGroups[0]?.id || null,
      activeTerminalId: newTerminals[newTerminals.length - 1]?.id || null,
    });
  },

  // ── Search ──
  toggleSearch: () => {
    set((state) => ({
      searchVisible: !state.searchVisible,
      searchQuery: '',
      searchResultIndex: 0,
      searchResultCount: 0,
    }));
  },

  setSearchQuery: (query) => {
    set({ searchQuery: query });
  },

  setSearchResultIndex: (index) => {
    set({ searchResultIndex: index });
  },

  setSearchResultCount: (count) => {
    set({ searchResultCount: count });
  },

  updateSearchOptions: (options) => {
    set((state) => ({
      ...state,
      ...options,
    }));
  },

  // ── Context Menu ──
  showContextMenu: (x, y, terminalId) => {
    set({ contextMenu: { x, y, terminalId } });
  },

  hideContextMenu: () => {
    set({ contextMenu: null });
  },

  // ── Clear terminal ──
  clearTerminal: (terminalId) => {
    const socket = getSocket();
    if (socket?.connected) {
      socket.emit('terminal-clear', { terminalId });
    }
  },

  // ── Task Management (VS Code Terminal menu) ──
  runningTasks: [],
  defaultBuildTask: null,

  detectTasks: () => {
    // Scan workspace files for package.json scripts
    const workspace = useWorkspace.getState().workspace;
    if (!workspace?.fileTree) return [];

    const tasks = [];
    const findPackageJson = (node) => {
      if (!node) return;
      if (node.type === 'file' && node.name === 'package.json') {
        tasks.push({ file: node, path: node.path || node.name });
      }
      if (node.children) node.children.forEach(findPackageJson);
    };
    findPackageJson(workspace.fileTree);
    return tasks;
  },

  getScriptTasks: () => {
    // Return package.json scripts as runnable tasks
    const workspace = useWorkspace.getState().workspace;
    if (!workspace?.fileTree) return [];

    const scripts = [];
    // Look through files for a loaded package.json content
    const state = useWorkspace.getState();
    const files = state.files || [];
    // Check if any open file is package.json and parse its scripts
    files.forEach((f) => {
      if (f.name === 'package.json') {
        // The active group may have the content
        const groups = state.editorGroups;
        groups.forEach((g) => {
          const tab = g.openTabs.find((t) => t.id === f.id);
          if (tab && g.code) {
            try {
              const pkg = JSON.parse(g.code);
              if (pkg.scripts) {
                Object.entries(pkg.scripts).forEach(([name, cmd]) => {
                  scripts.push({ name, command: cmd, source: f.path || 'package.json' });
                });
              }
            } catch (e) { /* ignore parse errors */ }
          }
        });
      }
    });
    return scripts;
  },

  runTask: (taskName, command) => {
    const state = get();
    const id = 'task-' + Date.now();
    const newTask = { id, name: taskName, command, status: 'running', startedAt: Date.now() };

    // Create a terminal and run the command
    const termId = state.createTerminal();
    setTimeout(() => {
      const socket = getSocket();
      if (socket?.connected) {
        socket.emit('terminal-input', { terminalId: termId, data: command + '\n' });
      }
    }, 500);

    set((prev) => ({
      runningTasks: [...prev.runningTasks, newTask],
    }));

    return id;
  },

  terminateTask: (taskId) => {
    set((prev) => ({
      runningTasks: prev.runningTasks.map((t) =>
        t.id === taskId ? { ...t, status: 'terminated' } : t
      ),
    }));
  },

  restartTask: (taskId) => {
    const state = get();
    const task = state.runningTasks.find((t) => t.id === taskId);
    if (task) {
      state.runTask(task.name, task.command);
    }
  },

  setDefaultBuildTask: (taskName) => {
    set({ defaultBuildTask: taskName });
    localStorage.setItem('aether-default-build-task', taskName || '');
  },

  loadDefaultBuildTask: () => {
    const saved = localStorage.getItem('aether-default-build-task');
    if (saved) set({ defaultBuildTask: saved });
  },

  getActiveTerminalText: () => {
    // Placeholder: returns selected text from active terminal
    // In a real implementation, this would read from the xterm buffer
    return '';
  },

  // ── Initialize with default terminal ──
  initialize: () => {
    get().loadDefaultBuildTask();
    const state = get();
    if (state.terminals.length === 0) {
      state.initLayout();
      state.createTerminal();
    }

    // Ensure socket is connected
    connectSocket();

    // Re-sync terminals whenever socket (re)connects
    const socket = getSocket();
    if (!socket._terminalReconnectHandler) {
      socket._terminalReconnectHandler = () => {
        const s = get();
        if (s.terminals.length > 0) {
          s._resyncTerminals();
        }
      };
      socket.on('connect', socket._terminalReconnectHandler);
    }
  },
}));

// ── Helpers ──

function replaceInLayout(layout, groupId, replacement) {
  if (!layout) return layout;
  if (layout.type === 'group') {
    return layout.id === groupId ? replacement : layout;
  }
  return {
    ...layout,
    children: layout.children.map((c) => replaceInLayout(c, groupId, replacement)),
  };
}

function collectGroupIds(layout) {
  if (!layout) return [];
  if (layout.type === 'group') return [layout.id];
  return layout.children.flatMap(collectGroupIds);
}

function rebuildLayoutAfterGroupRemoval(layout, removedGroupId, remainingGroups) {
  if (!layout) {
    return remainingGroups.length > 0
      ? { type: 'group', id: remainingGroups[0].id }
      : null;
  }

  const removeFromLayout = (node) => {
    if (!node) return null;
    if (node.type === 'group') {
      return node.id === removedGroupId ? null : node;
    }
    const children = node.children.map(removeFromLayout).filter(Boolean);
    if (children.length === 0) return null;
    if (children.length === 1) return children[0];
    return { ...node, children };
  };

  let result = removeFromLayout(layout);
  if (!result && remainingGroups.length > 0) {
    result = { type: 'group', id: remainingGroups[0].id };
  }
  return result;
}

export { SHELL_OPTIONS };
