import React from 'react';
import { motion } from 'framer-motion';
import { Bot, Users, FileText } from 'lucide-react';
import AIChatPanel from '../AI/ChatPanel';
import CollaboratorList from '../Collaboration/CollaboratorList';
import OutlinePanel from '../Outline/OutlinePanel';

const tabs = [
  { id: 'ai', icon: Bot, label: 'AI' },
  { id: 'collab', icon: Users, label: null },
  { id: 'outline', icon: FileText, label: 'Outline' },
];

export default function RightPanel({
  rightPanelTab,
  setRightPanelTab,
  peerCount,
  workspaceOwnerId,
}) {
  const renderContent = () => {
    switch (rightPanelTab) {
      case 'ai': return <AIChatPanel />;
      case 'collab': return <CollaboratorList workspaceOwnerId={workspaceOwnerId} />;
      case 'outline': return <OutlinePanel />;
      default: return null;
    }
  };

  return (
    <>
      {/* Tab bar */}
      <div className="flex h-[30px] flex-shrink-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
        {tabs.map((tab) => {
          const isActive = rightPanelTab === tab.id;
          const Icon = tab.icon;
          const label = tab.id === 'collab'
            ? `People (${peerCount})`
            : tab.label;
          return (
            <motion.button
              key={tab.id}
              onClick={() => setRightPanelTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1 text-[11px] transition-colors relative ${
                isActive
                  ? 'text-[rgba(255,255,255,0.5)]'
                  : 'text-[rgba(255,255,255,0.3)] hover:text-[rgba(255,255,255,0.5)]'
              }`}
              whileHover={!isActive ? { background: 'rgba(255,255,255,0.02)' } : undefined}
            >
              {isActive && (
                <motion.div
                  layoutId="activeRightPanelIndicator"
                  className="absolute top-0 left-2 right-2 h-px"
                  style={{
                    background: 'linear-gradient(135deg, #4a9eff 0%, #7cb8ff 50%, #a8d0ff 100%)',
                    boxShadow: '0 0 12px rgba(74,158,255,0.9), 0 0 30px rgba(74,158,255,0.5)',
                  }}
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                />
              )}
              <Icon size={12} />
              <span>{label}</span>
            </motion.button>
          );
        })}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-hidden">
        {renderContent()}
      </div>
    </>
  );
}
