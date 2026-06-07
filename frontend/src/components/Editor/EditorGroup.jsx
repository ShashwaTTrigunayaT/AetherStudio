import React from 'react';
import { motion } from 'framer-motion';
import { useWorkspace } from '../../stores/useWorkspace';
import MonacoEditor from './MonacoEditor';
import TabBar from './TabBar';
import Breadcrumbs from './Breadcrumbs';
import ErrorBoundary from '../Common/ErrorBoundary';
import EmptyState from '../Common/EmptyState';
import { AlertCircle, RefreshCw } from 'lucide-react';

function EditorErrorFallback({ resetError }) {
  return (
    <div className="h-full w-full flex items-center justify-center" style={{ background: 'rgba(10,10,16,0.8)' }}>
      <div className="text-center px-6">
        <AlertCircle size={24} className="text-[#f87171] mx-auto mb-3" />
        <p className="text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>Editor crashed</p>
        <button
          onClick={resetError}
          className="mt-3 inline-flex items-center gap-2 px-4 py-2 rounded-lg text-[12px] font-medium transition-all"
          style={{
            background: 'rgba(255,255,255,0.06)',
            color: 'rgba(255,255,255,0.5)',
            border: '1px solid rgba(255,255,255,0.1)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
          }}
        >
          <RefreshCw size={12} />
          Reload editor
        </button>
      </div>
    </div>
  );
}

export default function EditorGroup({ groupId }) {
  const {
    getGroupById, activeGroupId, setActiveGroup,
    openTabs, settings, activeFile, setActiveSidebarView,
  } = useWorkspace();

  const group = getGroupById(groupId);
  if (!group) return null;

  const isActive = groupId === activeGroupId;
  const hasTabs = group.openTabs.length > 0;
  const groupActiveFile = group.activeFile;

  return (
    <div
      className={`flex-1 flex flex-col relative`}
      style={{ background: 'var(--bg-primary)' }}
      onClick={() => {
        if (!isActive) setActiveGroup(groupId);
      }}
    >
      {/* Tab Bar for this group (hidden when showTabBar is off) */}
      {settings.showTabBar !== false && hasTabs && <TabBar groupId={groupId} />}

      {/* Breadcrumbs */}
      {settings.breadcrumbs && groupActiveFile && <Breadcrumbs groupId={groupId} />}

      {/* Editor or empty state — flex-1 flex-col so children can use flex-1 for height */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        <ErrorBoundary fallback={EditorErrorFallback}>
          {hasTabs ? (
            <MonacoEditor groupId={groupId} />
          ) : (
            <EmptyState workspaceName={''} />
          )}
        </ErrorBoundary>
      </div>
    </div>
  );
}
