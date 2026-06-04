import React, { useRef, useEffect } from 'react';
import { Terminal, Trash2, Loader2 } from 'lucide-react';
import { useWorkspace } from '../../stores/useWorkspace';

export default function OutputPanel() {
  const { executionOutput, executionError, isRunning, clearExecutionOutput } = useWorkspace();
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [executionOutput, executionError]);

  const lines = executionOutput ? executionOutput.split('\n') : [];
  const hasContent = lines.length > 0 || executionError;

  return (
    <div className="h-full flex flex-col">
      {/* Toolbar */}
      <div className="flex items-center px-3 py-1 border-b border-[rgba(255,255,255,0.04)] bg-[rgba(16,16,18,0.4)] flex-shrink-0">
        <Terminal size={12} className="text-[rgba(255,255,255,0.25)] mr-2" />
        <span className="text-[10px] font-semibold text-[rgba(255,255,255,0.35)] uppercase">Output</span>
        {isRunning && <Loader2 size={11} className="text-[#4ade80] ml-2 animate-spin" />}
        <div className="ml-auto flex items-center gap-1">
          <button
            onClick={clearExecutionOutput}
            className="p-1 rounded hover:bg-[rgba(255,255,255,0.06)] transition-colors"
            title="Clear Output"
          >
            <Trash2 size={11} className="text-[rgba(255,255,255,0.25)]" />
          </button>
        </div>
      </div>

      {/* Output content */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 font-mono text-[11px] leading-relaxed">
        {!hasContent && !isRunning && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <Terminal size={20} className="text-[rgba(255,255,255,0.08)] mb-2" />
            <p className="text-[12px] text-[rgba(255,255,255,0.2)]">No output yet</p>
            <p className="text-[10px] text-[rgba(255,255,255,0.12)] mt-1">Run code or start debugging to see output here</p>
          </div>
        )}
        {isRunning && !hasContent && (
          <div className="flex items-center justify-center py-8">
            <Loader2 size={14} className="text-[#4ade80] animate-spin" />
            <span className="ml-2 text-[12px] text-[rgba(255,255,255,0.3)]">Running…</span>
          </div>
        )}
        {lines.map((line, idx) => (
          <div
            key={idx}
            className={`whitespace-pre-wrap ${
              line.toLowerCase().includes('error') ? 'text-[#f87171]' :
              line.toLowerCase().includes('warn') ? 'text-[#fbbf24]' :
              'text-[rgba(255,255,255,0.5)]'
            }`}
          >
            {line}
          </div>
        ))}
        {executionError && (
          <div className="whitespace-pre-wrap text-[#f87171] mt-2">{executionError}</div>
        )}
      </div>
    </div>
  );
}
