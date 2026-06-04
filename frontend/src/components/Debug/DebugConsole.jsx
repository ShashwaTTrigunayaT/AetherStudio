import React, { useRef, useEffect } from 'react';
import { Trash2, Bug } from 'lucide-react';
import { useWorkspace } from '../../stores/useWorkspace';

export default function DebugConsole() {
  const { executionOutput, executionError, clearExecutionOutput, isRunning } = useWorkspace();
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [executionOutput, executionError]);

  const lines = executionOutput ? executionOutput.split('\n') : [];
  const hasContent = lines.length > 0 || executionError || isRunning;

  return (
    <div className="h-full flex flex-col text-[12px] font-mono">
      <div className="flex items-center px-3 py-1 border-b border-[rgba(255,255,255,0.04)] bg-[rgba(16,16,18,0.4)] flex-shrink-0">
        <Bug size={12} className="text-[rgba(255,255,255,0.25)] mr-2" />
        <span className="text-[10px] font-semibold text-[rgba(255,255,255,0.35)] uppercase">Debug Console</span>
        <div className="ml-auto flex items-center gap-1">
          {isRunning && <span className="text-[10px] text-[#4ade80] mr-2">Running...</span>}
          <button onClick={clearExecutionOutput} className="p-1 rounded hover:bg-[rgba(255,255,255,0.06)] transition-colors" title="Clear Console">
            <Trash2 size={11} className="text-[rgba(255,255,255,0.25)]" />
          </button>
        </div>
      </div>
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 leading-relaxed">
        {!hasContent && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <Bug size={20} className="text-[rgba(255,255,255,0.08)] mb-2" />
            <p className="text-[12px] text-[rgba(255,255,255,0.2)]">Debug console</p>
            <p className="text-[10px] text-[rgba(255,255,255,0.12)] mt-1">Start a debug session to see output here</p>
          </div>
        )}
        {lines.map((line, idx) => (
          <div key={idx} className="whitespace-pre-wrap text-[rgba(255,255,255,0.55)] hover:bg-[rgba(255,255,255,0.02)] px-1 py-[1px] rounded">{line}</div>
        ))}
        {executionError && (
          <div className="whitespace-pre-wrap text-[#f87171] px-1 py-[1px] rounded">{executionError}</div>
        )}
        {isRunning && <div className="text-[#4ade80] px-1 py-[1px] animate-pulse">|</div>}
      </div>
    </div>
  );
}
