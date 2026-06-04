import React from 'react';
import { X, AlertTriangle, AlertCircle, Info } from 'lucide-react';
import { useWorkspace } from '../../stores/useWorkspace';

export default function ProblemsPanel() {
  const { problems } = useWorkspace();

  const errors = problems.filter((p) => p.severity === 'error');
  const warnings = problems.filter((p) => p.severity === 'warning');
  const infos = problems.filter((p) => p.severity === 'info');

  return (
    <div className="h-full flex flex-col text-[12px]">
      {/* Summary bar */}
      <div className="flex items-center gap-3 px-3 py-1.5 border-b border-[rgba(255,255,255,0.04)] bg-[rgba(16,16,18,0.3)]">
        <div className="flex items-center gap-1.5">
          <div className="w-[6px] h-[6px] rounded-full bg-[#f87171] shadow-[0_0_6px_rgba(248,113,113,0.4)]" />
          <span className="text-[11px] text-[#f87171] font-semibold tabular-nums">{errors.length}</span>
          <span className="text-[10px] text-[rgba(255,255,255,0.25)]">errors</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-[6px] h-[6px] rounded-full bg-[#fbbf24] shadow-[0_0_6px_rgba(251,191,36,0.3)]" />
          <span className="text-[11px] text-[#fbbf24] font-semibold tabular-nums">{warnings.length}</span>
          <span className="text-[10px] text-[rgba(255,255,255,0.25)]">warnings</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-[6px] h-[6px] rounded-full bg-[#60a5fa] shadow-[0_0_6px_rgba(96,165,250,0.3)]" />
          <span className="text-[11px] text-[#60a5fa] font-semibold tabular-nums">{infos.length}</span>
          <span className="text-[10px] text-[rgba(255,255,255,0.25)]">infos</span>
        </div>
        <span className="ml-auto text-[10px] text-[rgba(255,255,255,0.15)]">{problems.length} total</span>
      </div>

      {/* Problems list */}
      <div className="flex-1 overflow-y-auto panel-scroll">
        {problems.length === 0 ? (
            <div
              className="flex flex-col items-center justify-center h-full gap-2"
            >
              <div className="w-8 h-8 rounded-xl bg-[rgba(48,209,88,0.08)] flex items-center justify-center">
                <AlertCircle size={16} className="text-[rgba(48,209,88,0.3)]" />
              </div>
              <p className="text-[12px] text-[rgba(255,255,255,0.25)] font-medium">No problems detected</p>
              <p className="text-[10px] text-[rgba(255,255,255,0.15)]">Your code looks clean ✨</p>
            </div>
          ) : (
            problems.map((problem, idx) => (
              <div
                key={idx}
                className="flex items-start gap-2.5 px-3 py-1.5 hover:bg-[rgba(255,255,255,0.03)] cursor-pointer transition-colors border-b border-[rgba(255,255,255,0.02)] last:border-b-0"
              >
                {problem.severity === 'error' && (
                  <X size={13} className="text-[#f87171] mt-[3px] flex-shrink-0" strokeWidth={2} />
                )}
                {problem.severity === 'warning' && (
                  <AlertTriangle size={13} className="text-[#fbbf24] mt-[3px] flex-shrink-0" strokeWidth={2} />
                )}
                {problem.severity === 'info' && (
                  <Info size={13} className="text-[#60a5fa] mt-[3px] flex-shrink-0" strokeWidth={2} />
                )}
                <div className="flex-1 min-w-0">
                  <span className="text-[12px] text-[rgba(255,255,255,0.65)] leading-relaxed">{problem.message}</span>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {problem.code && (
                    <span className="text-[10px] font-mono text-[rgba(255,255,255,0.15)]">{problem.code}</span>
                  )}
                  <span className="text-[10px] text-[rgba(255,255,255,0.2)] font-mono tabular-nums">
                    [{problem.line},{problem.column}]
                  </span>
                </div>
              </div>
            ))
          )}
      </div>
    </div>
  );
}
