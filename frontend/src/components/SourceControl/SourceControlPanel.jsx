import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  GitBranch, GitCommit, GitPullRequest, Plus, CheckCircle2,
  Circle, RefreshCw, File, Folder, ChevronRight, ChevronDown,
  ArrowUpCircle, ArrowDownCircle, MessageSquare,
} from 'lucide-react';

// Sample Git status data for demonstration
const SAMPLE_CHANGES = [
  { type: 'M', file: 'src/components/Editor/MonacoEditor.jsx', staged: false },
  { type: 'M', file: 'src/components/Layout/Workspace.jsx', staged: false },
  { type: 'A', file: 'src/components/Editor/TabBar.jsx', staged: true },
  { type: 'A', file: 'src/components/Editor/Breadcrumbs.jsx', staged: true },
  { type: 'U', file: 'src/styles/theme.css', staged: false },
  { type: 'D', file: 'src/old-components/legacy.jsx', staged: false },
];

const typeIcons = {
  M: { icon: ArrowUpCircle, color: '#fbbf24', label: 'Modified' },
  A: { icon: CheckCircle2, color: '#4ade80', label: 'Added' },
  D: { icon: ArrowDownCircle, color: '#f87171', label: 'Deleted' },
  U: { icon: RefreshCw, color: '#60a5fa', label: 'Untracked' },
  R: { icon: RefreshCw, color: '#c084fc', label: 'Renamed' },
};

export default function SourceControlPanel() {
  const [commitMessage, setCommitMessage] = useState('');
  const [expanded, setExpanded] = useState({ changes: true, staged: true });

  const stagedChanges = SAMPLE_CHANGES.filter((c) => c.staged);
  const unstagedChanges = SAMPLE_CHANGES.filter((c) => !c.staged);

  return (
    <div className="flex flex-col h-full relative">
      {/* Header */}
      <div className="panel-header">
        <GitBranch size={12} className="text-[rgba(255,255,255,0.3)]" />
        Source Control
      </div>

      {/* Branch info */}
      <div className="px-3 py-2 flex items-center gap-2 border-b border-[rgba(255,255,255,0.04)]">
        <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-[rgba(48,209,88,0.1)] text-[11px] font-medium text-[#4ade80]">
          <GitBranch size={12} />
          main
        </div>
        <button className="ml-auto p-1 rounded hover:bg-[rgba(255,255,255,0.06)] transition-colors">
          <RefreshCw size={12} className="text-[rgba(255,255,255,0.3)]" />
        </button>
      </div>

      {/* Commit area */}
      <div className="px-3 py-2 border-b border-[rgba(255,255,255,0.04)]">
        <div className="relative">
          <textarea
            value={commitMessage}
            onChange={(e) => setCommitMessage(e.target.value)}
            placeholder="Commit message (Ctrl+Enter to commit)"
            rows={2}
            className="w-full bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] rounded-lg px-3 py-2 text-[12px] text-[#f5f5f7] placeholder:text-[rgba(255,255,255,0.25)] focus:outline-none focus:border-[rgba(255,255,255,0.3)] transition-all resize-none"
          />
        </div>
        <div className="flex items-center gap-2 mt-2">
          <button
            className="flex-1 flex items-center justify-center gap-1.5 bg-[rgba(255,255,255,0.08)] hover:bg-[rgba(255,255,255,0.12)] text-white text-[11px] font-semibold py-1.5 rounded-lg transition-colors disabled:opacity-30 active:scale-[0.98]"
            disabled={!commitMessage.trim()}
          >
            <GitCommit size={12} />
            Commit
          </button>
          <button
            className="px-3 py-1.5 rounded-lg bg-[rgba(255,255,255,0.06)] hover:bg-[rgba(255,255,255,0.1)] text-[11px] font-medium text-[rgba(255,255,255,0.6)] transition-colors active:scale-[0.98]"
          >
            <GitPullRequest size={12} />
          </button>
        </div>
      </div>

      {/* Changes sections */}
      <div className="flex-1 overflow-y-auto">
        {/* Staged Changes */}
        <div className="border-b border-[rgba(255,255,255,0.04)]">
          <div
            onClick={() => setExpanded((s) => ({ ...s, staged: !s.staged }))}
            className="flex items-center gap-1 px-3 py-1.5 cursor-pointer hover:bg-[rgba(255,255,255,0.03)] transition-colors"
          >
            {expanded.staged ? (
              <ChevronDown size={11} className="text-[rgba(255,255,255,0.25)]" />
            ) : (
              <ChevronRight size={11} className="text-[rgba(255,255,255,0.25)]" />
            )}
            <span className="text-[10px] font-semibold text-[rgba(255,255,255,0.35)] uppercase tracking-wider">
              Staged Changes
            </span>
            <span className="ml-auto text-[10px] text-[rgba(255,255,255,0.2)]">{stagedChanges.length}</span>
          </div>
          {expanded.staged && stagedChanges.map((change, idx) => (
            <ChangeItem key={idx} change={change} />
          ))}
        </div>

        {/* Unstaged Changes */}
        <div>
          <div
            onClick={() => setExpanded((s) => ({ ...s, changes: !s.changes }))}
            className="flex items-center gap-1 px-3 py-1.5 cursor-pointer hover:bg-[rgba(255,255,255,0.03)] transition-colors"
          >
            {expanded.changes ? (
              <ChevronDown size={11} className="text-[rgba(255,255,255,0.25)]" />
            ) : (
              <ChevronRight size={11} className="text-[rgba(255,255,255,0.25)]" />
            )}
            <span className="text-[10px] font-semibold text-[rgba(255,255,255,0.35)] uppercase tracking-wider">
              Changes
            </span>
            <span className="ml-auto text-[10px] text-[rgba(255,255,255,0.2)]">{unstagedChanges.length}</span>
          </div>
          {expanded.changes && unstagedChanges.map((change, idx) => (
            <ChangeItem key={idx} change={change} />
          ))}
        </div>

        {/* Empty state */}
        {SAMPLE_CHANGES.length === 0 && (
          <div className="text-center py-12 px-4">
            <div className="w-10 h-10 rounded-2xl bg-[rgba(48,209,88,0.08)] flex items-center justify-center mx-auto mb-3">
              <CheckCircle2 size={20} className="text-[#4ade80]" />
            </div>
            <p className="text-[13px] text-[rgba(255,255,255,0.4)] font-medium">
              No changes yet
            </p>
            <p className="text-[11px] text-[rgba(255,255,255,0.2)] mt-0.5">
              Start editing files to see changes here
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function ChangeItem({ change }) {
  const info = typeIcons[change.type] || typeIcons.M;
  const Icon = info.icon;

  return (
    <div
      className="flex items-center gap-2 px-3 py-1 cursor-pointer hover:bg-[rgba(255,255,255,0.03)] transition-colors group"
    >
      <Icon size={11} style={{ color: info.color }} className="flex-shrink-0" />
      <span className="text-[12px] text-[rgba(255,255,255,0.55)] truncate flex-1">
        {change.file}
      </span>
      <span className="text-[9px] text-[rgba(255,255,255,0.2)] uppercase font-mono">
        {change.type}
      </span>
    </div>
  );
}
