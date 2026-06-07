import React, { useEffect, useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../stores/useAuth';
import { useWorkspace } from '../../stores/useWorkspace';
import { connectSocket, disconnectSocket } from '../../lib/api';
import { initYjs, destroyYjs, getAwarenessState } from '../../lib/yjs-provider';
import ErrorBoundary from '../Common/ErrorBoundary';
import EditorArea from '../Editor/EditorArea';
import BottomPanel from '../Panels/BottomPanel';
import FileExplorer from '../FileExplorer/FileTree';
import StatusBar from '../Common/StatusBar';
import ActivityBar from '../Editor/ActivityBar';
import SearchPanel from '../Search/SearchPanel';
import SourceControlPanel from '../SourceControl/SourceControlPanel';
import DebugPanel from '../Debug/DebugPanel';
import ExtensionsPanel from '../Extensions/ExtensionsPanel';
import CommandPalette from '../CommandPalette/CommandPalette';
import { Bell, X } from 'lucide-react';
import TitleBar from './TitleBar';
import GlassPanel from './GlassPanel';
import NebulaBackground from './NebulaBackground';
import CodeParticles from './CodeParticles';
import MouseGlow, { useMouseGlow } from './MouseGlow';
import RightPanel from './RightPanel';
import ImportModal from '../Common/ImportModal';
import { LoadingState, ErrorState } from './WorkspaceStates';

const SIDEBAR_WIDTH = 270;
const RIGHT_PANEL_WIDTH = 300;

// ── Sidebar view components ────────────────────────────────
const sidebarViews = {
  explorer: FileExplorer,
  search: SearchPanel,
  'source-control': SourceControlPanel,
  debug: DebugPanel,
  extensions: ExtensionsPanel,
};

const sidebarViewNames = {
  explorer: 'Explorer',
  search: 'Search',
  'source-control': 'Source Control',
  debug: 'Run and Debug',
  extensions: 'Extensions',
};

export default function Workspace() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    workspace, loading, error, collaborators, addCollaborator, removeCollaborator,
    fetchWorkspace, activeFile, activeSidebarView, sidebarOpen,
    rightPanelOpen, setRightPanelTab, rightPanelTab,
    toggleCommandPalette, settings, problems, bottomPanelOpen,
    importModalOpen, setImportModalOpen, zenMode,
  } = useWorkspace();

  const [mounted, setMounted] = useState(false);
  const [peerCount, setPeerCount] = useState(0);
  const [sidebarWidth, setSidebarWidth] = useState(SIDEBAR_WIDTH);
  const [draggingSidebar, setDraggingSidebar] = useState(false);
  const sidebarWidthRef = useRef(SIDEBAR_WIDTH);
  const chordRef = useRef(null); // for Ctrl+K chord shortcuts

  useEffect(() => {
    // Subscribe to awareness for peer count badge
    const interval = setInterval(() => {
      const state = getAwarenessState();
      setPeerCount(state.peers.length + (state.localUser ? 1 : 0));
    }, 2000);
    // Initial count
    const state = getAwarenessState();
    setPeerCount(state.peers.length + (state.localUser ? 1 : 0));

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!user) return;
    setMounted(true);
    const socket = connectSocket(id);
    try {
      initYjs(id, {
        name: user?.name || 'Anonymous',
        avatar: user?.avatar || null,
        userId: user?._id || null,
      });
    } catch (e) { console.warn('Yjs init error:', e); }
    fetchWorkspace(id);

    // ── Debug event listeners ──
    const onDebugStarted = (result) => {
      console.log('[Workspace] Debug session started:', result);
      const store = useWorkspace.getState();
      store.setCallStack([]);
      store.setVariables([]);
      store.addDebugHistory('system', 'Debug session started');
      store.setShowDebugStatus(true);
    };
    socket.on('debug-started', onDebugStarted);

    const onDebugPaused = (event) => {
      console.log('[Workspace] Debug paused:', event);
      const store = useWorkspace.getState();
      store.pauseDebugging();
      if (event.callFrames) {
        store.setCallStack(event.callFrames);
        const top = event.callFrames[0];
        if (top) {
          const func = top.functionName || '<unknown>';
          const line = top.lineNumber || '?';
          const file = (top.url || 'unknown').split('/').pop();
          store.addDebugHistory('breakpoint', `Paused at ${func}() — ${file}:${line}`);
        }
      }
      // Request variables from the backend
      const wsId = store.workspace?._id;
      if (wsId) {
        socket.emit('debug-get-variables', { workspaceId: wsId });
      }
    };
    socket.on('debug-paused', onDebugPaused);

    const onDebugVariables = (data) => {
      if (data.variables) {
        console.log('[Workspace] Debug variables:', data.variables.length, 'variables');
        useWorkspace.getState().setVariables(data.variables);
      }
    };
    socket.on('debug-variables', onDebugVariables);

    const onDebugResumed = () => {
      console.log('[Workspace] Debug resumed');
      useWorkspace.setState({ debugState: 'running' });
      useWorkspace.getState().addDebugHistory('system', 'Execution resumed');
    };
    socket.on('debug-resumed', onDebugResumed);

    const onDebugOutput = (output) => {
      console.log('[Workspace] Debug output:', output);
      useWorkspace.setState((prev) => ({
        executionOutput: (prev.executionOutput || '') + output.data,
      }));
      useWorkspace.getState().addDebugHistory('output', output.data);
    };
    socket.on('debug-output', onDebugOutput);

    const onDebugError = (err) => {
      console.error('[Workspace] Debug error:', err);
      const msg = err.error || err;
      useWorkspace.setState({ executionError: msg });
      useWorkspace.getState().addDebugHistory('error', msg);
    };
    socket.on('debug-error', onDebugError);

    const onDebugExit = (exitInfo) => {
      console.log('[Workspace] Debug session exited:', exitInfo);
      const store = useWorkspace.getState();
      const code = exitInfo.code ?? '';
      store.addDebugHistory('system', `Debug session ended (exit code: ${code})`);
      store.stopDebugging();
      store.setShowDebugStatus(false);
    };
    socket.on('debug-exit', onDebugExit);

    // ── New debug event listeners ──

    const onDebugEvaluateResult = (result) => {
      const store = useWorkspace.getState();
      const history = [...store.debugReplHistory];
      // Match by evalId for precise pairing
      const matchIdx = result.evalId
        ? history.findIndex(e => e.evalId === result.evalId)
        : -1;
      if (matchIdx >= 0) {
        if (result.error) {
          history[matchIdx] = { ...history[matchIdx], result: result.error, type: 'error', error: true };
        } else {
          history[matchIdx] = {
            ...history[matchIdx],
            result: result.result,
            type: result.type || 'string',
            variablesReference: result.variablesReference,
          };
        }
        useWorkspace.setState({ debugReplHistory: history });
      }
    };
    socket.on('debug-evaluate-result', onDebugEvaluateResult);

    const onDebugChildren = (data) => {
      const store = useWorkspace.getState();
      store.setChildrenVariables(data.variablesReference, data.children || []);
    };
    socket.on('debug-children', onDebugChildren);

    const onDebugVariableSet = (data) => {
      const store = useWorkspace.getState();
      store.addDebugHistory('system', `Variable ${data.name} = ${data.value} (saved)`);
      // Refresh variables
      const wsId = store.workspace?._id;
      if (wsId) {
        socket.emit('debug-get-variables', { workspaceId: wsId });
      }
    };
    socket.on('debug-variable-set', onDebugVariableSet);

    const onDebugBreakpointAdded = (data) => {
      console.log('[Workspace] Conditional breakpoint added:', data);
      const store = useWorkspace.getState();
      if (data.condition) {
        store.addDebugHistory('system', `Conditional breakpoint set: line ${data.line}, condition: ${data.condition}`);
      }
    };
    socket.on('debug-breakpoint-added', onDebugBreakpointAdded);

    const onDebugLogpointAdded = (data) => {
      console.log('[Workspace] Logpoint added:', data);
      const store = useWorkspace.getState();
      store.addDebugHistory('system', `Logpoint set at line ${data.line}: "${data.logMessage}"`);
    };
    socket.on('debug-logpoint-added', onDebugLogpointAdded);

    const onPeerJoined = (peer) => addCollaborator(peer);
    socket.on('peer-joined', onPeerJoined);
    const onPeerLeft = (peerId) => removeCollaborator(peerId);
    socket.on('peer-left', onPeerLeft);
    const onFiletreeUpdate = () => {
      console.log('[Workspace] File tree update received from socket — re-fetching');
      fetchWorkspace(id);
    };
    socket.on('workspace-filetree-update', onFiletreeUpdate);

    const handleReconnect = () => {
      console.log('[Workspace] Socket reconnected — re-joining workspace room');
      socket.emit('join-workspace', { workspaceId: id, userId: user._id });
    };
    socket.on('connect', handleReconnect);

    socket.emit('join-workspace', { workspaceId: id, userId: user._id });

    const pollInterval = setInterval(() => {
      fetchWorkspace(id);
    }, 5000);

    return () => {
      clearInterval(pollInterval);
      socket.emit('leave-workspace', { workspaceId: id });
      socket.off('debug-started', onDebugStarted);
      socket.off('debug-paused', onDebugPaused);
      socket.off('debug-resumed', onDebugResumed);
      socket.off('debug-output', onDebugOutput);
      socket.off('debug-error', onDebugError);
      socket.off('debug-exit', onDebugExit);
      socket.off('debug-variables', onDebugVariables);
      socket.off('debug-evaluate-result', onDebugEvaluateResult);
      socket.off('debug-children', onDebugChildren);
      socket.off('debug-variable-set', onDebugVariableSet);
      socket.off('debug-breakpoint-added', onDebugBreakpointAdded);
      socket.off('debug-logpoint-added', onDebugLogpointAdded);
      socket.off('peer-joined', onPeerJoined);
      socket.off('peer-left', onPeerLeft);
      socket.off('workspace-filetree-update', onFiletreeUpdate);
      socket.off('connect', handleReconnect);
      disconnectSocket();
      destroyYjs();
    };
  }, [id, user]);

  const { glowRef, glowX, glowY, handleMouseMove } = useMouseGlow();



  // Global keyboard shortcuts (VS Code-style)
  const handleKeyDown = useCallback((e) => {
    const tag = e.target?.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

    const ctrl = (e.ctrlKey || e.metaKey);

    // ── Chord leader: Ctrl+K ──
    if (ctrl && !e.shiftKey && !e.altKey && e.key === 'k') {
      e.preventDefault();
      // Clear previous chord timeout to avoid stale timeout clearing new chord
      if (chordRef.current && chordRef.current.timer) {
        clearTimeout(chordRef.current.timer);
      }
      chordRef.current = {
        active: true,
        timer: setTimeout(() => { chordRef.current = null; }, 1500),
      };
      return;
    }

    // ── Chord completion (pressed after Ctrl+K) ──
    if (chordRef.current && chordRef.current.active) {
      chordRef.current = null; // consume

      // Ctrl+K Ctrl+O → Open Folder (import modal)
      if (ctrl && !e.shiftKey && !e.altKey && e.key === 'o') {
        e.preventDefault();
        useWorkspace.getState().setImportModalOpen(true);
        return;
      }
      // Ctrl+K S → Save All
      if (!ctrl && (e.key === 's' || e.key === 'S')) {
        e.preventDefault();
        window.dispatchEvent(new CustomEvent('menu:action', { detail: { actionId: 'save-all' } }));
        return;
      }
      // Not a chord completion — fall through
    }

    // ── File menu keyboard shortcuts ──
    // Ctrl+N → New File (prevent browser new window)
    if (ctrl && !e.shiftKey && !e.altKey && e.key === 'n') {
      e.preventDefault();
      window.dispatchEvent(new CustomEvent('menu:action', { detail: { actionId: 'new-file' } }));
      return;
    }
    // Ctrl+O → Open File (prevent browser file dialog)
    if (ctrl && !e.shiftKey && !e.altKey && e.key === 'o') {
      e.preventDefault();
      window.dispatchEvent(new CustomEvent('menu:action', { detail: { actionId: 'open-file' } }));
      return;
    }
    // Ctrl+Shift+S → Save As
    if (ctrl && e.shiftKey && !e.altKey && (e.key === 's' || e.key === 'S')) {
      e.preventDefault();
      window.dispatchEvent(new CustomEvent('menu:action', { detail: { actionId: 'save-as' } }));
      return;
    }
    // Ctrl+Shift+W → Close Other Tabs (prevent browser close)
    if (ctrl && e.shiftKey && !e.altKey && (e.key === 'w' || e.key === 'W')) {
      e.preventDefault();
      const state2 = useWorkspace.getState();
      const activeGroup2 = state2.getActiveGroup();
      if (activeGroup2?.activeTabId) {
        state2.closeOtherTabs(activeGroup2.activeTabId, activeGroup2.id);
      }
      return;
    }

    // ── Existing shortcuts ──
    if (ctrl && e.shiftKey && e.key === 'p') {
      e.preventDefault();
      toggleCommandPalette();
    }
    if (ctrl && !e.shiftKey && !e.altKey && e.key === 'b') {
      e.preventDefault();
      useWorkspace.getState().toggleSidebar();
    }
    if (ctrl && !e.shiftKey && !e.altKey && e.key === '`') {
      e.preventDefault();
      useWorkspace.getState().setActiveBottomPanel('terminal');
    }
    if (ctrl && !e.shiftKey && !e.altKey && e.key === 'w') {
      e.preventDefault();
      const state3 = useWorkspace.getState();
      const activeGroup3 = state3.getActiveGroup();
      if (activeGroup3?.activeTabId) {
        state3.closeTab(activeGroup3.activeTabId, activeGroup3.id);
      }
    }
  }, [toggleCommandPalette]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Loading state
  if (!workspace) {
    if (loading || !mounted) {
      return <LoadingState mounted={mounted} />;
    }
    return (
      <ErrorState
        error={error}
        onRetry={() => fetchWorkspace(id)}
        onDashboard={() => navigate('/dashboard')}
      />
    );
  }

  // Compute status bar items
  const language = activeFile?.name?.split('.').pop() || '';
  const langName = {
    js: 'JavaScript', jsx: 'JavaScript JSX', ts: 'TypeScript', tsx: 'TypeScript JSX',
    json: 'JSON', html: 'HTML', css: 'CSS', scss: 'SCSS', md: 'Markdown',
    py: 'Python', rb: 'Ruby', go: 'Go', rs: 'Rust', java: 'Java',
    cpp: 'C++', c: 'C', cs: 'C#', php: 'PHP',
    yml: 'YAML', yaml: 'YAML', xml: 'XML', sql: 'SQL',
    sh: 'Shell Script', bash: 'Shell Script',
  }[language] || (language ? language.toUpperCase() : 'Plain Text');

  const errorCount = problems.filter((p) => p.severity === 'error').length;
  const warningCount = problems.filter((p) => p.severity === 'warning').length;

  const statusLeft = [
    { icon: null, label: 'main', onClick: () => {} },
    ...(errorCount > 0 ? [{ icon: null, label: 'Errors: ' + errorCount, onClick: () => useWorkspace.getState().setActiveBottomPanel('problems') }] : []),
    ...(warningCount > 0 ? [{ icon: null, label: 'Warnings: ' + warningCount, onClick: () => useWorkspace.getState().setActiveBottomPanel('problems') }] : []),
  ];

  const statusRight = [
    ...(activeFile ? [
      { icon: null, label: 'Ln 1, Col 1' },
      { icon: null, label: 'Spaces: ' + settings.tabSize },
      { icon: null, label: 'UTF-8' },
      { icon: null, label: langName, onClick: () => {} },
    ] : []),
    { icon: Bell, label: 'Notifications', onClick: () => useWorkspace.getState().toggleBottomPanel?.() },
  ];

  const SidebarView = sidebarViews[activeSidebarView];

  return (
    <div
      className="h-screen w-screen overflow-hidden relative select-none flex flex-col"
      style={{ background: '#0c0c0e', color: '#e8e8e8' }}
      ref={glowRef}
      onMouseMove={handleMouseMove}
    >
      {/* ═══ Mouse-tracking glow ═══ */}
      <MouseGlow glowX={glowX} glowY={glowY} />

      {/* ═══ Living Nebula Background ═══ */}
      <NebulaBackground />

      {/* ═══ Floating code particles ═══ */}
      <CodeParticles />

      {/* ═══ Import Modal ═══ */}
      <ImportModal
        isOpen={importModalOpen}
        onClose={() => setImportModalOpen(false)}
      />

      {/* ═══ Command Palette Overlay ═══ */}
      <CommandPalette />

      {/* ── Premium Title Bar — full width ── */}
      <TitleBar />

      {/* ── Main Workbench Area — flush, no gaps ── */}
      <div className="flex-1 flex min-h-0" style={{ zIndex: 1 }}>
        {/* Activity Bar — connected flush (hidden in zen mode) */}
        {!zenMode && <ActivityBar />}

        {/* Sidebar — flush (hidden in zen mode) */}
        <AnimatePresence>
          {sidebarOpen && !zenMode && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: sidebarWidth, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={draggingSidebar ? { duration: 0 } : { type: 'spring', stiffness: 180, damping: 24 }}
              className="flex-shrink-0 overflow-hidden relative"
            >
              <GlassPanel className="h-full flex flex-col">
                {SidebarView ? (
                  <SidebarView workspace={workspace} />
                ) : (
                  <div className="flex flex-col items-center justify-center flex-1 text-center px-4">
                    <p className="text-[12px]" style={{ color: 'rgba(255,255,255,0.3)' }}>
                      {sidebarViewNames[activeSidebarView]} view coming soon
                    </p>
                  </div>
                )}
              </GlassPanel>

              {/* ── Sidebar Resize Handle ── */}
              <div
                onMouseDown={(e) => {
                  e.preventDefault();
                  setDraggingSidebar(true);
                  const startX = e.clientX;
                  const startWidth = sidebarWidth;

                  const handleMouseMove = (me) => {
                    const deltaX = me.clientX - startX;
                    // Allow width to go down to 20 during drag (no 150 floor)
                    const newWidth = Math.min(500, Math.max(20, startWidth + deltaX));
                    sidebarWidthRef.current = newWidth;
                    setSidebarWidth(newWidth);
                  };

                  const handleMouseUp = () => {
                    setDraggingSidebar(false);
                    document.removeEventListener('mousemove', handleMouseMove);
                    document.removeEventListener('mouseup', handleMouseUp);
                    document.body.style.cursor = '';
                    document.body.style.userSelect = '';
                    // Close sidebar if dragged below threshold
                    if (sidebarWidthRef.current < 80) {
                      setSidebarWidth(SIDEBAR_WIDTH);
                      useWorkspace.getState().toggleSidebar();
                    } else if (sidebarWidthRef.current < 150) {
                      // Snap back to minimum usable width
                      setSidebarWidth(150);
                    }
                  };

                  document.body.style.cursor = 'col-resize';
                  document.body.style.userSelect = 'none';
                  document.addEventListener('mousemove', handleMouseMove);
                  document.addEventListener('mouseup', handleMouseUp);
                }}
                className="absolute right-0 top-0 bottom-0 z-30 cursor-col-resize transition-colors duration-75"
                style={{
                  width: '6px',
                  background: draggingSidebar ? 'rgba(255,255,255,0.1)' : 'transparent',
                  boxShadow: draggingSidebar ? '0 0 12px rgba(255,255,255,0.1)' : 'none',
                }}
                onMouseEnter={(e) => {
                  if (!draggingSidebar) e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
                }}
                onMouseLeave={(e) => {
                  if (!draggingSidebar) e.currentTarget.style.background = 'transparent';
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Center: Editor + Bottom Panel */}
        <div className={`flex-1 flex flex-col min-w-0 relative ${settings.centeredLayout ? 'max-w-[960px] mx-auto' : ''}`}>
          {/* ── Drag-to-open strip — visible when sidebar is closed ── */}
          {!sidebarOpen && (
            <div
              onMouseDown={(e) => {
                e.preventDefault();
                const startX = e.clientX;

                const handleMouseMove = (me) => {
                  const deltaX = me.clientX - startX;
                  // Only react once dragged past 20px threshold
                  if (deltaX > 20) {
                    // Open sidebar and set width to match drag distance
                    const width = Math.min(500, Math.max(150, deltaX));
                    setSidebarWidth(width);
                    useWorkspace.getState().toggleSidebar();
                    // Clean up drag listeners — opening the sidebar re-triggers open animation
                    document.removeEventListener('mousemove', handleMouseMove);
                    document.removeEventListener('mouseup', handleMouseUp);
                  }
                };

                const handleMouseUp = () => {
                  document.removeEventListener('mousemove', handleMouseMove);
                  document.removeEventListener('mouseup', handleMouseUp);
                  document.body.style.cursor = '';
                  document.body.style.userSelect = '';
                };

                document.body.style.cursor = 'col-resize';
                document.body.style.userSelect = 'none';
                document.addEventListener('mousemove', handleMouseMove);
                document.addEventListener('mouseup', handleMouseUp);
              }}
              className="absolute left-0 top-0 bottom-0 z-40 cursor-col-resize"
              style={{
                width: '6px',
                background: 'transparent',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
              }}
            />
          )}
          {/* Editor Area — flush */}
          <GlassPanel className="flex-1 flex flex-col min-h-0">
            <ErrorBoundary>
              <div className="flex-1 flex flex-col overflow-hidden relative">
                <EditorArea />
              </div>
            </ErrorBoundary>
          </GlassPanel>

          {/* Bottom Panel — flush (hidden in zen mode) */}
          {!zenMode && (
            <div className="flex-shrink-0">
              <BottomPanel />
            </div>
          )}
        </div>

        {/* Right Panel — flush */}
        <AnimatePresence>
          {rightPanelOpen && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: RIGHT_PANEL_WIDTH, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 180, damping: 24 }}
              className="flex-shrink-0 overflow-hidden"
            >
              <GlassPanel className="h-full flex flex-col">
                <RightPanel
                  rightPanelTab={rightPanelTab}
                  setRightPanelTab={setRightPanelTab}
                  peerCount={peerCount}
                  workspaceOwnerId={workspace?.ownerId}
                />
              </GlassPanel>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Status Bar — full width at bottom ── */}
      {settings.showStatusBar && (
        <div className="flex-shrink-0" style={{ zIndex: 1 }}>
          <StatusBar left={statusLeft} right={statusRight} />
        </div>
      )}
    </div>
  );
}
