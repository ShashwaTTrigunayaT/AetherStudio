import { create } from 'zustand';
import { api, getSocket } from '../lib/api';

let groupCounter = 1;

function createGroupId() {
  return `editor-group-${groupCounter++}`;
}

function createDefaultGroup() {
  return {
    id: createGroupId(),
    openTabs: [],
    activeTabId: null,
    activeFile: null,
    code: '',
  };
}

// ── Layout tree helpers ──

function createLeafLayout(groupId) {
  return { type: 'group', id: groupId };
}

function createSplitLayout(direction, children, sizes) {
  return { type: 'split', direction, sizes, children };
}

function findGroupInLayout(layout, groupId) {
  if (!layout) return null;
  if (layout.type === 'group') return layout.id === groupId ? layout : null;
  for (const child of layout.children) {
    const found = findGroupInLayout(child, groupId);
    if (found) return found;
  }
  return null;
}

function replaceGroupInLayout(layout, groupId, replacement) {
  if (!layout) return layout;
  if (layout.type === 'group') {
    return layout.id === groupId ? replacement : layout;
  }
  return {
    ...layout,
    children: layout.children.map((c) => replaceGroupInLayout(c, groupId, replacement)),
  };
}

function collectGroupIds(layout) {
  if (!layout) return [];
  if (layout.type === 'group') return [layout.id];
  return layout.children.flatMap(collectGroupIds);
}

function getGroupById(groups, id) {
  return groups.find((g) => g.id === id);
}

function getActiveGroup(state) {
  return getGroupById(state.editorGroups, state.activeGroupId) || state.editorGroups[0];
}

export const useWorkspace = create((set, get) => {
  const mainGroup = createDefaultGroup();

  return {
  // Workspace data
  workspace: null,
  files: [],
  activeFile: null,
  code: '',
  collaborators: [],
  loading: false,
  error: null,

  // ── Editor Groups ──
  editorGroups: [mainGroup],
  activeGroupId: mainGroup.id,
  editorLayout: createLeafLayout(mainGroup.id),

  // Tab management (backward-compat — derived from active group)
  get openTabs() {
    const g = getActiveGroup(get());
    return g?.openTabs || [];
  },
  get activeTabId() {
    const g = getActiveGroup(get());
    return g?.activeTabId || null;
  },

  // Sidebar — pristine closed default for zen wide-open layout
  activeSidebarView: 'explorer',
  sidebarOpen: false,

  // Right panel
  rightPanelOpen: false,
  rightPanelTab: 'ai',

  // Bottom panel — defaults to closed for pristine initial state
  bottomPanelOpen: false,
  activeBottomPanel: 'terminal',
  bottomPanelHeight: typeof window !== 'undefined'
    ? Math.round(window.innerHeight * 0.25)
    : 220,
  minBottomPanelHeight: 80,
  maxBottomPanelHeight: Math.round(typeof window !== 'undefined' ? window.innerHeight * 0.9 : 500),

  // Search
  searchQuery: '',
  searchResults: [],
  isSearching: false,
  replaceText: '',
  searchIncludePattern: '',
  searchExcludePattern: '',

  // Problems
  problems: [],

  // Debug
  isDebugging: false,
  debugState: 'stopped',
  breakpoints: [],
  callStack: [],
  variables: [],
  watchExpressions: [],
  loadedScripts: [],

  // View state
  activityBarOpen: true,
  zenMode: false,

  // Command palette
  commandPaletteOpen: false,

  // Import modal
  importModalOpen: false,

  setImportModalOpen: (open) => set({ importModalOpen: open }),

  // Settings
  settings: {
    fontSize: 14,
    tabSize: 2,
    wordWrap: 'off',
    minimap: true,
    breadcrumbs: true,
    lineNumbers: true,
    autoSave: true,
    formatOnSave: false,
    fontFamily: "'SF Mono', 'Fira Code', 'Cascadia Code', 'JetBrains Mono', monospace",
    theme: 'nexus-dark',
    showTabBar: true,
    showStatusBar: true,
    centeredLayout: false,
    stickyScroll: true,
    renderWhitespace: 'selection',
  },

  // ==============================
  // Editor Group Actions
  // ==============================

  setActiveGroup: (groupId) => {
    const state = get();
    const group = getGroupById(state.editorGroups, groupId);
    if (group) {
      set({
        activeGroupId: groupId,
        activeFile: group.activeFile,
        code: group.code,
      });
    }
  },

  getGroupById: (groupId) => {
    return getGroupById(get().editorGroups, groupId);
  },

  getActiveGroup: () => {
    return getActiveGroup(get());
  },

  splitEditor: (direction) => {
    const state = get();
    const activeGroup = getActiveGroup(state);
    if (!activeGroup) return;

    const newGroup = createDefaultGroup();
    const newLayout = createSplitLayout(direction, [
      createLeafLayout(activeGroup.id),
      createLeafLayout(newGroup.id),
    ], [50, 50]);

    let updatedLayout;
    if (state.editorLayout.type === 'group' && state.editorLayout.id === activeGroup.id) {
      updatedLayout = newLayout;
    } else {
      updatedLayout = replaceGroupInLayout(state.editorLayout, activeGroup.id, newLayout);
    }

    set({
      editorGroups: [...state.editorGroups, newGroup],
      editorLayout: updatedLayout,
      activeGroupId: newGroup.id,
      activeFile: newGroup.activeFile,
      code: newGroup.code,
    });
  },

  closeEditorGroup: (groupId) => {
    const state = get();
    if (state.editorGroups.length <= 1) return; // can't close last group

    const groupIds = collectGroupIds(state.editorLayout);
    const remaining = groupIds.filter((id) => id !== groupId);
    if (remaining.length === 0) return;

    // Build new layout without the removed group
    const removeFromLayout = (layout) => {
      if (!layout) return null;
      if (layout.type === 'group') {
        return layout.id === groupId ? null : layout;
      }
      const children = layout.children.map(removeFromLayout).filter(Boolean);
      if (children.length === 0) return null;
      if (children.length === 1) return children[0];
      return { ...layout, children };
    };

    let newLayout = removeFromLayout(state.editorLayout);
    if (!newLayout) {
      newLayout = createLeafLayout(remaining[0]);
    }

    // If layout is a single group after removal, flatten it
    if (newLayout.type === 'split' && newLayout.children.length === 1) {
      newLayout = newLayout.children[0];
    }

    // Move tabs from closed group to first remaining group
    const closedGroup = getGroupById(state.editorGroups, groupId);
    const firstRemaining = getGroupById(state.editorGroups, remaining[0]);

    const newGroups = state.editorGroups
      .filter((g) => g.id !== groupId)
      .map((g) => {
        if (g.id === firstRemaining?.id && closedGroup?.openTabs?.length > 0) {
          // Merge tabs from closed group
          const existingIds = new Set(g.openTabs.map((t) => t.id));
          const newTabs = closedGroup.openTabs.filter((t) => !existingIds.has(t.id));
          return {
            ...g,
            openTabs: [...g.openTabs, ...newTabs],
            activeTabId: g.activeTabId || closedGroup.activeTabId,
            activeFile: g.activeFile || closedGroup.activeFile,
            code: g.code || closedGroup.code,
          };
        }
        return g;
      });

    const newActiveGroup = getGroupById(newGroups, remaining[0]);
    set({
      editorGroups: newGroups,
      editorLayout: newLayout,
      activeGroupId: newActiveGroup?.id || newGroups[0]?.id,
      activeFile: newActiveGroup?.activeFile || null,
      code: newActiveGroup?.code || '',
    });
  },

  moveTabToGroup: (tabId, fromGroupId, toGroupId) => {
    const state = get();
    const fromGroup = getGroupById(state.editorGroups, fromGroupId);
    const toGroup = getGroupById(state.editorGroups, toGroupId);
    if (!fromGroup || !toGroup) return;

    const tab = fromGroup.openTabs.find((t) => t.id === tabId);
    if (!tab) return;

    // Remove from source
    const newFromTabs = fromGroup.openTabs.filter((t) => t.id !== tabId);
    let newFromActiveId = fromGroup.activeTabId;
    if (fromGroup.activeTabId === tabId) {
      const closedIndex = fromGroup.openTabs.findIndex((t) => t.id === tabId);
      newFromActiveId = newFromTabs.length > 0
        ? newFromTabs[Math.min(closedIndex, newFromTabs.length - 1)]?.id || newFromTabs[0].id
        : null;
    }

    // Add to target
    const exists = toGroup.openTabs.find((t) => t.id === tabId);
    const newToTabs = exists ? toGroup.openTabs : [...toGroup.openTabs, tab];

    const newGroups = state.editorGroups.map((g) => {
      if (g.id === fromGroupId) {
        return {
          ...g,
          openTabs: newFromTabs,
          activeTabId: newFromActiveId,
          activeFile: newFromActiveId ? g.openTabs.find((t) => t.id === newFromActiveId) || null : null,
          code: g.id === toGroupId ? g.code : g.code,
        };
      }
      if (g.id === toGroupId) {
        return {
          ...g,
          openTabs: newToTabs,
          activeTabId: tab.id,
          activeFile: tab,
        };
      }
      return g;
    });

    const activeGrp = getGroupById(newGroups, toGroupId);
    set({
      editorGroups: newGroups,
      activeGroupId: toGroupId,
      activeFile: activeGrp?.activeFile || null,
      code: activeGrp?.code || '',
    });
  },

  // ==============================
  // Workspace actions
  // ==============================

  createWorkspace: async (name, description) => {
    set({ loading: true });
    try {
      const { data } = await api.post('/workspace', { name, description });
      set({ workspace: data, loading: false });
      return data;
    } catch (err) {
      set({ error: err.message, loading: false });
      throw err;
    }
  },

  fetchWorkspace: async (id) => {
    set({ loading: true, error: null });
    try {
      const { data } = await api.get(`/workspace/${id}`);
      const flattenFiles = (node) => {
        if (!node) return [];
        if (node.type === 'file') return [node];
        return (node.children || []).flatMap(flattenFiles);
      };
      set({
        workspace: data,
        files: flattenFiles(data.fileTree),
        loading: false,
        error: null,
      });
      return data;
    } catch (err) {
      set({ error: err.response?.data?.error || err.message, loading: false });
      return null;
    }
  },

  updateCode: (code, groupId) => {
    const state = get();
    const gid = groupId || state.activeGroupId;
    set({
      code,
      editorGroups: state.editorGroups.map((g) =>
        g.id === gid ? { ...g, code } : g
      ),
    });
  },

  // ==============================
  // File operations
  // ==============================

  createFile: async (name, type, parentId) => {
    const state = get();
    if (!state.workspace?._id) return null;
    try {
      const { data } = await api.post(`/workspace/${state.workspace._id}/files`, {
        name, type, parentId,
      });
      await state.fetchWorkspace(state.workspace._id);
      return data;
    } catch (err) {
      console.error('Create file error:', err);
      return null;
    }
  },

  deleteFile: async (fileId) => {
    const state = get();
    if (!state.workspace?._id) return;
    try {
      await api.delete(`/workspace/${state.workspace._id}/files/${fileId}`);
      // Close tab in all groups if deleted file was open
      const newGroups = state.editorGroups.map((g) => {
        const tab = g.openTabs.find((t) => t.id === fileId);
        if (!tab) return g;
        const newTabs = g.openTabs.filter((t) => t.id !== fileId);
        let newActiveId = g.activeTabId;
        if (g.activeTabId === fileId) {
          const idx = g.openTabs.findIndex((t) => t.id === fileId);
          newActiveId = newTabs.length > 0
            ? newTabs[Math.min(idx, newTabs.length - 1)]?.id || newTabs[0].id
            : null;
        }
        return {
          ...g,
          openTabs: newTabs,
          activeTabId: newActiveId,
          activeFile: newActiveId ? newTabs.find((t) => t.id === newActiveId) || null : null,
        };
      });
      set({ editorGroups: newGroups });
      await state.fetchWorkspace(state.workspace._id);
    } catch (err) {
      console.error('Delete file error:', err);
    }
  },

  renameFile: async (fileId, newName) => {
    const state = get();
    if (!state.workspace?._id) return;
    try {
      await api.put(`/workspace/${state.workspace._id}/files/${fileId}/rename`, { name: newName });
      // Update name in open tabs
      const newGroups = state.editorGroups.map((g) => ({
        ...g,
        openTabs: g.openTabs.map((t) =>
          t.id === fileId ? { ...t, name: newName } : t
        ),
        activeFile: g.activeFile?.id === fileId
          ? { ...g.activeFile, name: newName }
          : g.activeFile,
      }));
      set({ editorGroups: newGroups });
      await state.fetchWorkspace(state.workspace._id);
    } catch (err) {
      console.error('Rename file error:', err);
    }
  },

  fetchFileContent: async (fileId) => {
    const state = get();
    if (!state.workspace?._id) return '';
    try {
      const { data } = await api.get(`/workspace/${state.workspace._id}/files/${fileId}`);
      return data.content || '';
    } catch (err) {
      console.error('Fetch content error:', err);
      return '';
    }
  },

  saveFileContent: async (fileId, content) => {
    const state = get();
    if (!state.workspace?._id) return;
    try {
      await api.put(`/workspace/${state.workspace._id}/files/${fileId}`, { content });
    } catch (err) {
      console.error('Save file error:', err);
    }
  },

  importFiles: async (files) => {
    const state = get();
    if (!state.workspace?._id) {
      console.error('[Import] ❌ No workspace ID found. Are you logged in?');
      return null;
    }
    try {
      const response = await api.post(`/workspace/${state.workspace._id}/import`, { files });
      return response.data;
    } catch (err) {
      console.error('[Import] ❌ API call failed:', err.response?.status, err.response?.data);
      return null;
    }
  },

  // ==============================
  // Tab actions (per-group)
  // ==============================

  openFile: (file, groupId) => {
    const state = get();
    const gid = groupId || state.activeGroupId;
    const group = getGroupById(state.editorGroups, gid);
    if (!group) return;

    const exists = group.openTabs.find((t) => t.id === file.id);
    const newGroups = state.editorGroups.map((g) => {
      if (g.id !== gid) return g;
      if (!exists) {
        return {
          ...g,
          openTabs: [...g.openTabs, file],
          activeTabId: file.id,
          activeFile: file,
        };
      }
      return { ...g, activeTabId: file.id, activeFile: file };
    });

    const activeGrp = getGroupById(newGroups, gid);
    set({
      editorGroups: newGroups,
      activeGroupId: gid,
      activeFile: activeGrp?.activeFile || null,
      code: activeGrp?.code || '',
    });
  },

  closeTab: (fileId, groupId) => {
    const state = get();
    const gid = groupId || state.activeGroupId;
    const group = getGroupById(state.editorGroups, gid);
    if (!group) return;

    const tabs = group.openTabs.filter((t) => t.id !== fileId);
    let newActiveId = group.activeTabId;
    if (group.activeTabId === fileId) {
      const closedIndex = group.openTabs.findIndex((t) => t.id === fileId);
      newActiveId = tabs.length > 0
        ? tabs[Math.min(closedIndex, tabs.length - 1)]?.id || tabs[0].id
        : null;
    }

    const newGroups = state.editorGroups.map((g) => {
      if (g.id !== gid) return g;
      const newActiveFile = newActiveId
        ? tabs.find((t) => t.id === newActiveId) || null
        : null;
      return {
        ...g,
        openTabs: tabs,
        activeTabId: newActiveId,
        activeFile: newActiveFile,
        code: newActiveFile ? g.code : '',
      };
    });

    const activeGrp = getGroupById(newGroups, gid);
    set({
      editorGroups: newGroups,
      activeFile: activeGrp?.activeFile || null,
      code: activeGrp?.code || '',
    });
  },

  setActiveTab: (fileId, groupId) => {
    const state = get();
    const gid = groupId || state.activeGroupId;
    const newGroups = state.editorGroups.map((g) => {
      if (g.id !== gid) return g;
      const file = g.openTabs.find((t) => t.id === fileId);
      return file ? { ...g, activeTabId: fileId, activeFile: file } : g;
    });
    const activeGrp = getGroupById(newGroups, gid);
    set({
      editorGroups: newGroups,
      activeFile: activeGrp?.activeFile || null,
    });
  },

  reorderTabs: (fromIndex, toIndex, groupId) => {
    const state = get();
    const gid = groupId || state.activeGroupId;
    const newGroups = state.editorGroups.map((g) => {
      if (g.id !== gid) return g;
      const tabs = [...g.openTabs];
      const [moved] = tabs.splice(fromIndex, 1);
      tabs.splice(toIndex, 0, moved);
      return { ...g, openTabs: tabs };
    });
    set({ editorGroups: newGroups });
  },

  closeAllTabs: (groupId) => {
    const state = get();
    const gid = groupId || state.activeGroupId;
    const newGroups = state.editorGroups.map((g) => {
      if (g.id !== gid) return g;
      return { ...g, openTabs: [], activeTabId: null, activeFile: null, code: '' };
    });
    const activeGrp = getGroupById(newGroups, gid);
    set({
      editorGroups: newGroups,
      activeFile: null,
      code: '',
    });
  },

  closeOtherTabs: (fileId, groupId) => {
    const state = get();
    const gid = groupId || state.activeGroupId;
    const group = getGroupById(state.editorGroups, gid);
    if (!group) return;

    const tab = group.openTabs.find((t) => t.id === fileId);
    const newGroups = state.editorGroups.map((g) => {
      if (g.id !== gid) return g;
      return {
        ...g,
        openTabs: tab ? [tab] : [],
        activeTabId: tab?.id || null,
        activeFile: tab || null,
        code: tab ? g.code : '',
      };
    });
    set({ editorGroups: newGroups, activeFile: tab || null });
  },

  closeTabsToTheRight: (fileId, groupId) => {
    const state = get();
    const gid = groupId || state.activeGroupId;
    const newGroups = state.editorGroups.map((g) => {
      if (g.id !== gid) return g;
      const idx = g.openTabs.findIndex((t) => t.id === fileId);
      if (idx === -1) return g;
      const tabs = g.openTabs.slice(0, idx + 1);
      const hasActive = tabs.find((t) => t.id === g.activeTabId);
      return {
        ...g,
        openTabs: tabs,
        activeTabId: hasActive ? g.activeTabId : tabs[tabs.length - 1]?.id || null,
        activeFile: hasActive ? g.activeFile : tabs[tabs.length - 1] || null,
      };
    });
    set({ editorGroups: newGroups });
  },

  // ==============================
  // Sidebar actions
  // ==============================

  setActiveSidebarView: (view) => {
    const state = get();
    if (state.activeSidebarView === view && state.sidebarOpen) {
      set({ sidebarOpen: false });
    } else {
      set({ activeSidebarView: view, sidebarOpen: true });
    }
  },

  toggleSidebar: () => {
    set((state) => ({ sidebarOpen: !state.sidebarOpen }));
  },

  // ==============================
  // Right panel actions
  // ==============================

  setRightPanelTab: (tab) => {
    const state = get();
    if (state.rightPanelTab === tab && state.rightPanelOpen) {
      set({ rightPanelOpen: false });
    } else {
      set({ rightPanelTab: tab, rightPanelOpen: true });
    }
  },

  toggleRightPanel: () => {
    set((state) => ({ rightPanelOpen: !state.rightPanelOpen }));
  },

  // ==============================
  // Bottom panel actions
  // ==============================

  setActiveBottomPanel: (panel) => {
    const state = get();
    if (state.activeBottomPanel === panel && state.bottomPanelOpen) {
      set({ bottomPanelOpen: false });
    } else {
      set({ activeBottomPanel: panel, bottomPanelOpen: true });
    }
  },

  setBottomPanelHeight: (height) => {
    set((state) => ({
      bottomPanelHeight: Math.min(state.maxBottomPanelHeight, Math.max(state.minBottomPanelHeight, height)),
    }));
  },

  toggleBottomPanel: () => {
    set((state) => ({ bottomPanelOpen: !state.bottomPanelOpen }));
  },

  // ==============================
  // View actions
  // ==============================

  toggleActivityBar: () => {
    set((state) => ({ activityBarOpen: !state.activityBarOpen }));
  },

  toggleZenMode: () => {
    set((state) => ({
      zenMode: !state.zenMode,
      sidebarOpen: state.zenMode ? true : false,
      bottomPanelOpen: false,
      rightPanelOpen: false,
    }));
  },

  openViewPicker: () => {
    // Opens command palette as a quick way to pick views
    get().toggleCommandPalette();
  },

  setEditorLayoutMode: (mode) => {
    const state = get();
    const mainGroup = state.editorGroups[0];

    const makeGroup = () => ({
      id: `editor-group-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      openTabs: [],
      activeTabId: null,
      activeFile: null,
      code: '',
    });

    let newGroups, newLayout;

    switch (mode) {
      case 'single':
        newGroups = [mainGroup];
        newLayout = { type: 'group', id: mainGroup.id };
        break;
      case 'two-columns': {
        const g1 = makeGroup();
        newGroups = [mainGroup, g1];
        newLayout = {
          type: 'split', direction: 'horizontal', sizes: [50, 50],
          children: [{ type: 'group', id: mainGroup.id }, { type: 'group', id: g1.id }],
        };
        break;
      }
      case 'two-rows': {
        const g1 = makeGroup();
        newGroups = [mainGroup, g1];
        newLayout = {
          type: 'split', direction: 'vertical', sizes: [50, 50],
          children: [{ type: 'group', id: mainGroup.id }, { type: 'group', id: g1.id }],
        };
        break;
      }
      case 'three-columns': {
        const g1 = makeGroup();
        const g2 = makeGroup();
        newGroups = [mainGroup, g1, g2];
        newLayout = {
          type: 'split', direction: 'horizontal', sizes: [33.33, 33.33, 33.34],
          children: [
            { type: 'group', id: mainGroup.id },
            { type: 'group', id: g1.id },
            { type: 'group', id: g2.id },
          ],
        };
        break;
      }
      case 'three-rows': {
        const g1 = makeGroup();
        const g2 = makeGroup();
        newGroups = [mainGroup, g1, g2];
        newLayout = {
          type: 'split', direction: 'vertical', sizes: [33.33, 33.33, 33.34],
          children: [
            { type: 'group', id: mainGroup.id },
            { type: 'group', id: g1.id },
            { type: 'group', id: g2.id },
          ],
        };
        break;
      }
      case 'grid': {
        const g1 = makeGroup();
        const g2 = makeGroup();
        const g3 = makeGroup();
        newGroups = [mainGroup, g1, g2, g3];
        newLayout = {
          type: 'split', direction: 'horizontal', sizes: [50, 50],
          children: [
            {
              type: 'split', direction: 'vertical', sizes: [50, 50],
              children: [{ type: 'group', id: mainGroup.id }, { type: 'group', id: g1.id }],
            },
            {
              type: 'split', direction: 'vertical', sizes: [50, 50],
              children: [{ type: 'group', id: g2.id }, { type: 'group', id: g3.id }],
            },
          ],
        };
        break;
      }
      default:
        return;
    }

    set({
      editorGroups: newGroups,
      editorLayout: newLayout,
      activeGroupId: mainGroup.id,
      activeFile: mainGroup.activeFile,
      code: mainGroup.code,
    });
  },

  flipLayout: () => {
    const state = get();
    if (state.editorLayout.type === 'split') {
      set({
        editorLayout: {
          ...state.editorLayout,
          direction: state.editorLayout.direction === 'horizontal' ? 'vertical' : 'horizontal',
        },
      });
    }
  },

  // ==============================
  // Search actions
  // ==============================

  setSearchQuery: (query) => set({ searchQuery: query }),
  setReplaceText: (text) => set({ replaceText: text }),

  performSearch: async (query) => {
    if (!query.trim()) {
      set({ searchResults: [], isSearching: false });
      return;
    }
    set({ isSearching: true, searchQuery: query });
    try {
      const { data } = await api.get(`/workspace/${get().workspace?._id}/search`, {
        params: { query },
      });
      set({ searchResults: data.results || [], isSearching: false });
    } catch {
      const state = get();
      const results = [];
      const searchInNode = (node, path = '') => {
        if (!node) return;
        const currentPath = path ? `${path}/${node.name}` : node.name;
        if (node.type === 'file') {
          results.push({ file: node, path: currentPath, matches: [] });
        }
        (node.children || []).forEach((child) => searchInNode(child, currentPath));
      };
      if (state.workspace?.fileTree) {
        searchInNode(state.workspace.fileTree);
      }
      set({ searchResults: results, isSearching: false });
    }
  },

  clearSearch: () => {
    set({ searchQuery: '', searchResults: [], isSearching: false });
  },

  // ==============================
  // Problems actions
  // ==============================

  setProblems: (problems) => set({ problems }),
  addProblem: (problem) => {
    set((state) => ({ problems: [...state.problems, problem] }));
  },
  clearProblems: () => set({ problems: [] }),

  // ==============================
  // Debug actions
  // ==============================

  // ── Code Execution (runs in terminal, VS Code-style) ──
  isRunning: false,
  executionOutput: '',
  executionError: null,

  // Map file extensions to run commands (relative to workspace)
  _extensionRunCommands: {
    js: 'node', mjs: 'node', cjs: 'node',
    ts: 'npx ts-node', tsx: 'npx ts-node',
    py: 'python3', rb: 'ruby', go: 'go run', rs: 'cargo run',
    java: 'javac', cpp: 'g++', c: 'gcc', cs: 'dotnet run',
    php: 'php', sh: 'bash', bash: 'bash', zsh: 'zsh',
    pl: 'perl', r: 'Rscript', swift: 'swift', kt: 'kotlin',
  },

  // ── Run active file in terminal (like VS Code) ──
  runCode: async () => {
    const state = get();
    const file = state.activeFile;
    if (!file) return;

    const ext = file.name?.split('.').pop()?.toLowerCase();
    const cmd = state._extensionRunCommands[ext];
    if (!cmd) {
      set({ executionError: `Cannot execute .${ext} files` });
      return;
    }

    // Build the file path — prefer path if available, else name
    const filePath = file.path || file.name;
    const quotedPath = filePath.includes(' ') ? `'${filePath}'` : filePath;
    const fullCommand = `${cmd} ${quotedPath}`;

    set({ isRunning: true, executionError: null });

    // Open the bottom panel to show terminal
    state.setActiveBottomPanel('terminal');

    // Use the terminal store to create a terminal and run the command
    const [{ useTerminal }, { getSocket }] = await Promise.all([
      import('./useTerminal.js'),
      import('../lib/api.js'),
    ]);
    const termState = useTerminal.getState();

    // Create a new terminal for this run
    const newTermId = termState.createTerminal();

    const socket = getSocket();
    if (!socket?.connected) {
      console.warn('[runCode] Socket not connected, cannot run in terminal');
      set({ isRunning: false, executionError: 'Terminal not connected. Please wait for connection.' });
      return;
    }

    // Listen for terminal-created to know when to send the command
    let timer;
    const onCreated = (data) => {
      if (data.terminalId === newTermId) {
        socket.off('terminal-created', onCreated);
        clearTimeout(timer);
        // Send the command after terminal is confirmed ready
        setTimeout(() => {
          socket.emit('terminal-input', { terminalId: newTermId, data: fullCommand + '\n' });
          set({ isRunning: false });
        }, 100);
      }
    };
    socket.on('terminal-created', onCreated);

    // Fallback: if terminal-created never fires, send after 2s anyway
    timer = setTimeout(() => {
      socket.off('terminal-created', onCreated);
      socket.emit('terminal-input', { terminalId: newTermId, data: fullCommand + '\n' });
      set({ isRunning: false });
    }, 2000);
  },

  stopExecution: () => set({ isRunning: false }),

  clearExecutionOutput: () => set({ executionOutput: '', executionError: null }),

  // ── Debug ──
  startDebugging: () => {
    const state = get();
    const workspaceId = state.workspace?._id;
    const code = state.code || '';
    const file = state.activeFile;
    const ext = file?.name?.split('.').pop()?.toLowerCase();
    const langMap = {
      js: 'javascript', jsx: 'javascript', ts: 'typescript', tsx: 'typescript',
      py: 'python', rb: 'ruby', go: 'go', rs: 'rust', java: 'java',
      cpp: 'cpp', c: 'c', cs: 'csharp', php: 'php',
    };
    const language = langMap[ext] || 'javascript';
    set({ isDebugging: true, debugState: 'running', executionOutput: '', executionError: null });
    const socket = getSocket(workspaceId);
    if (socket?.connected) {
      socket.emit('debug-start', {
        workspaceId,
        code,
        language,
        breakpoints: state.breakpoints.map(function(b) { return { line: b.line }; }),
      });
    }
  },
  stopDebugging: () => {
    const state = get();
    const workspaceId = state.workspace?._id;
    set({ isDebugging: false, debugState: 'stopped', callStack: [], variables: [] });
    const socket = getSocket(workspaceId);
    if (socket?.connected) {
      socket.emit('debug-stop', { workspaceId });
    }
  },
  pauseDebugging: () => set({ debugState: 'paused' }),
  continueExecution: () => {
    const state = get();
    const workspaceId = state.workspace?._id;
    set({ debugState: 'running' });
    const socket = getSocket(workspaceId);
    if (socket?.connected) {
      socket.emit('debug-continue', { workspaceId });
    }
  },
  stepOver: () => {
    const state = get();
    const socket = getSocket(state.workspace?._id);
    if (socket?.connected) {
      socket.emit('debug-step-over', { workspaceId: state.workspace?._id });
    }
  },
  stepInto: () => {
    const state = get();
    const socket = getSocket(state.workspace?._id);
    if (socket?.connected) {
      socket.emit('debug-step-into', { workspaceId: state.workspace?._id });
    }
  },
  stepOut: () => {
    const state = get();
    const socket = getSocket(state.workspace?._id);
    if (socket?.connected) {
      socket.emit('debug-step-out', { workspaceId: state.workspace?._id });
    }
  },

  addBreakpoint: (line) => {
    set((state) => ({
      breakpoints: [...state.breakpoints, { line, fileId: state.activeFile?.id }],
    }));
  },

  removeBreakpoint: (line) => {
    set((state) => ({
      breakpoints: state.breakpoints.filter(
        (b) => b.line !== line || b.fileId !== state.activeFile?.id
      ),
    }));
  },

  enableAllBreakpoints: () => {
    set((state) => ({
      breakpoints: state.breakpoints.map((b) => ({ ...b, enabled: true })),
    }));
  },

  disableAllBreakpoints: () => {
    set((state) => ({
      breakpoints: state.breakpoints.map((b) => ({ ...b, enabled: false })),
    }));
  },

  removeAllBreakpoints: () => set({ breakpoints: [] }),

  setCallStack: (callStack) => set({ callStack }),
  setVariables: (variables) => set({ variables }),
  setLoadedScripts: (scripts) => set({ loadedScripts: scripts }),

  // ── Watch Expressions ──
  addWatchExpression: (expression) => {
    set((state) => ({
      watchExpressions: [...state.watchExpressions, { expression, value: '…' }],
    }));
  },
  removeWatchExpression: (index) => {
    set((state) => ({
      watchExpressions: state.watchExpressions.filter((_, i) => i !== index),
    }));
  },
  updateWatchExpression: (index, value) => {
    set((state) => ({
      watchExpressions: state.watchExpressions.map((w, i) =>
        i === index ? { ...w, value } : w
      ),
    }));
  },

  // ==============================
  // Command palette
  // ==============================

  toggleCommandPalette: () => {
    set((state) => ({ commandPaletteOpen: !state.commandPaletteOpen }));
  },

  closeCommandPalette: () => set({ commandPaletteOpen: false }),

  // ==============================
  // Settings
  // ==============================

  updateSetting: (key, value) => {
    set((state) => ({
      settings: { ...state.settings, [key]: value },
    }));
  },

  // ==============================
  // Collaboration
  // ==============================

  addCollaborator: (peer) => {
    set((state) => ({
      collaborators: [...state.collaborators, peer],
    }));
  },

  removeCollaborator: (peerId) => {
    set((state) => ({
      collaborators: state.collaborators.filter((c) => c.id !== peerId),
    }));
  },
  };
});
