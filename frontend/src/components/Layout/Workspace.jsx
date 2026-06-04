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
    importModalOpen, setImportModalOpen,
  } = useWorkspace();

  const [mounted, setMounted] = useState(false);
  const [peerCount, setPeerCount] = useState(0);
  const [sidebarWidth, setSidebarWidth] = useState(SIDEBAR_WIDTH);
  const [draggingSidebar, setDraggingSidebar] = useState(false);
  const sidebarWidthRef = useRef(SIDEBAR_WIDTH);

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
      useWorkspace.getState().setCallStack([]);
      useWorkspace.getState().setVariables([]);
    };
    socket.on('debug-started', onDebugStarted);

    const onDebugPaused = (event) => {
      console.log('[Workspace] Debug paused:', event);
      useWorkspace.getState().pauseDebugging();
      if (event.callFrames) {
        useWorkspace.getState().setCallStack(event.callFrames);
      }
    };
    socket.on('debug-paused', onDebugPaused);

    const onDebugResumed = () => {
      console.log('[Workspace] Debug resumed');
      useWorkspace.setState({ debugState: 'running' });
    };
    socket.on('debug-resumed', onDebugResumed);

    const onDebugOutput = (output) => {
      console.log('[Workspace] Debug output:', output);
      useWorkspace.setState((prev) => ({
        executionOutput: (prev.executionOutput || '') + output.data,
      }));
    };
    socket.on('debug-output', onDebugOutput);

    const onDebugError = (err) => {
      console.error('[Workspace] Debug error:', err);
      useWorkspace.setState({ executionError: err.error || err });
    };
    socket.on('debug-error', onDebugError);

    const onDebugExit = (exitInfo) => {
      console.log('[Workspace] Debug session exited:', exitInfo);
      useWorkspace.getState().stopDebugging();
    };
    socket.on('debug-exit', onDebugExit);

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
      socket.off('peer-joined', onPeerJoined);
      socket.off('peer-left', onPeerLeft);
      socket.off('workspace-filetree-update', onFiletreeUpdate);
      socket.off('connect', handleReconnect);
      disconnectSocket();
      destroyYjs();
    };
  }, [id, user]);

  const { glowRef, glowX, glowY, handleMouseMove } = useMouseGlow();



  // Global keyboard shortcuts
  const handleKeyDown = useCallback((e) => {
    const tag = e.target?.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'p') {
      e.preventDefault();
      toggleCommandPalette();
    }
    if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
      e.preventDefault();
      useWorkspace.getState().toggleSidebar();
    }
    if ((e.ctrlKey || e.metaKey) && e.key === '`') {
      e.preventDefault();
      useWorkspace.getState().setActiveBottomPanel('terminal');
    }
    if ((e.ctrlKey || e.metaKey) && e.key === 'w') {
      e.preventDefault();
      const state = useWorkspace.getState();
      const activeGroup = state.getActiveGroup();
      if (activeGroup?.activeTabId) {
        state.closeTab(activeGroup.activeTabId, activeGroup.id);
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
        {/* Activity Bar — connected flush */}
        <ActivityBar />

        {/* Sidebar — flush */}
        <AnimatePresence>
          {sidebarOpen && (
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
        <div className="flex-1 flex flex-col min-w-0 relative">
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

          {/* Bottom Panel — flush */}
          <div className="flex-shrink-0">
            <BottomPanel />
          </div>
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
      <div className="flex-shrink-0" style={{ zIndex: 1 }}>
        <StatusBar left={statusLeft} right={statusRight} />
      </div>
    </div>
  );
}
