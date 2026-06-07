import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Trash2, Bug, Circle, Plus, X, Square, SkipForward, ArrowDown, ArrowUp, ArrowUpFromLine, Eye, Terminal, MessageSquare, Type } from 'lucide-react';
import { useWorkspace } from '../../stores/useWorkspace';
import { getSocket } from '../../lib/api';

export default function DebugConsole() {
  const {
    debugHistory, isDebugging, debugState,
    breakpoints, callStack, variables, executionOutput, executionError,
    clearExecutionOutput,
    addBreakpoint, removeBreakpoint, removeAllBreakpoints,
    addDebugHistory,
    watchExpressions, addWatchExpression, removeWatchExpression,
    continueExecution, stepOver, stepInto, stepOut, stopDebugging,
    debugReplHistory, debugReplInput, addDebugReplEntry, evaluateDebugExpression, clearDebugReplHistory,
    addConditionalBreakpoint, addLogpoint, toggleLogpoint,
  } = useWorkspace();
  const scrollRef = useRef(null);
  const replInputRef = useRef(null);
  const [showBreakpoints, setShowBreakpoints] = useState(true);
  const [newBpLine, setNewBpLine] = useState('');
  const [showAddBp, setShowAddBp] = useState(false);
  const [showWatch, setShowWatch] = useState(true);
  const [showAddWatch, setShowAddWatch] = useState(false);
  const [newWatchExpr, setNewWatchExpr] = useState('');
  const [replInput, setReplInput] = useState('');
  const [showRepl, setShowRepl] = useState(true);
  const [editingCondition, setEditingCondition] = useState(null); // line number
  const [conditionText, setConditionText] = useState('');
  const [editingLogMessage, setEditingLogMessage] = useState(null); // line number
  const [logMessageText, setLogMessageText] = useState('');

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [debugHistory, debugReplHistory]);

  const hasContent = debugHistory.length > 0 || isDebugging || executionError || debugReplHistory.length > 0;

  const handleAddBreakpoint = () => {
    const line = parseInt(newBpLine);
    if (line && line > 0) {
      addBreakpoint(line);
      addDebugHistory('system', `Breakpoint added at line ${line}`);
      setNewBpLine('');
      setShowAddBp(false);
    }
  };

  const handleRemoveBreakpoint = (line) => {
    removeBreakpoint(line);
    addDebugHistory('system', `Breakpoint removed at line ${line}`);
  };

  const handleRemoveAllBreakpoints = () => {
    removeAllBreakpoints();
    addDebugHistory('system', 'All breakpoints removed');
  };

  // ── Conditional Breakpoint ──
  const handleAddConditionalBreakpoint = (line) => {
    const trimmed = conditionText.trim();
    if (!trimmed) {
      // Remove condition, keep breakpoint
      addBreakpoint(line);
    } else {
      addConditionalBreakpoint(line, trimmed);
      addDebugHistory('system', `Conditional breakpoint at line ${line}: ${trimmed}`);
    }
    setEditingCondition(null);
    setConditionText('');
  };

  // ── Logpoint ──
  const handleAddLogpoint = (line) => {
    const trimmed = logMessageText.trim();
    if (!trimmed) {
      toggleLogpoint(line);
    } else {
      addLogpoint(line, trimmed);
      addDebugHistory('system', `Logpoint at line ${line}: "${trimmed}"`);
    }
    setEditingLogMessage(null);
    setLogMessageText('');
  };

  // ── REPL ──
  const handleReplSubmit = useCallback(() => {
    const trimmed = replInput.trim();
    if (!trimmed) return;
    evaluateDebugExpression(trimmed);
    setReplInput('');
  }, [replInput, evaluateDebugExpression]);

  const handleReplKeyDown = useCallback((e) => {
    if (e.key === 'Enter') {
      handleReplSubmit();
    }
  }, [handleReplSubmit]);

  // ── Watch helpers ──
  const handleAddWatchExpression = () => {
    const trimmed = newWatchExpr.trim();
    if (!trimmed) return;
    addWatchExpression(trimmed);
    // Try to evaluate against current variables
    const match = variables.find((v) => v.name === trimmed);
    if (match) {
      const state = useWorkspace.getState();
      const idx = state.watchExpressions.length - 1;
      state.updateWatchExpression(idx, match.value);
    }
    addDebugHistory('system', `Added watch: ${trimmed}`);
    setNewWatchExpr('');
    setShowAddWatch(false);
  };

  const handleRemoveWatch = (idx) => {
    const state = useWorkspace.getState();
    const expr = state.watchExpressions[idx]?.expression;
    removeWatchExpression(idx);
    if (expr) addDebugHistory('system', `Removed watch: ${expr}`);
  };

  // Evaluate watch expressions against current variables
  const evaluateWatch = (expression) => {
    if (!isDebugging || debugState !== 'paused') return '…';
    const match = variables.find((v) => v.name === expression);
    return match ? match.value : '…';
  };

  // ── Render a single debug history entry ──
  const renderDebugEntry = (entry, idx) => {
    const baseClass = 'whitespace-pre-wrap px-2 py-[1px] rounded font-mono text-[13px] leading-relaxed';

    switch (entry.type) {
      case 'system':
        return (
          <div key={idx} className={`${baseClass} text-[rgba(255,255,255,0.25)] italic`}>
            <span className="mr-1.5">ℹ</span>
            {entry.text}
          </div>
        );
      case 'breakpoint':
        return (
          <div key={idx} className={`${baseClass} text-[#4ade80] bg-[rgba(74,222,128,0.06)] border-l-2 border-[#4ade80] pl-2 ml-1 my-0.5`}>
            <span className="mr-1.5">●</span>
            {entry.text}
          </div>
        );
      case 'error':
        return (
          <div key={idx} className={`${baseClass} text-[#f87171] bg-[rgba(248,113,113,0.06)] border-l-2 border-[#f87171] pl-2 ml-1 my-0.5`}>
            <span className="mr-1.5">✕</span>
            {entry.text}
          </div>
        );
      case 'output':
      default:
        // Split multi-line output into individual lines (preserve empty lines for spacing)
        // Handle both \r\n (Windows) and \n (Unix) line endings
        const lines = entry.text.replace(/\r\n/g, '\n').split('\n');
        return lines.map((line, li) => (
          <div key={`${idx}-${li}`} className={`${baseClass} text-[rgba(255,255,255,0.7)]`}>
            {line || '\u00A0'}
          </div>
        ));
    }
  };

  return (
    <div className="h-full flex flex-col text-[12px] font-mono">
      {/* ═══ Header ═══ */}
      <div className="flex items-center px-3 py-1 border-b border-[rgba(255,255,255,0.04)] bg-[rgba(16,16,18,0.4)] flex-shrink-0">
        <Bug size={12} className="text-[rgba(255,255,255,0.25)] mr-2" />
        <span className="text-[10px] font-semibold text-[rgba(255,255,255,0.35)] uppercase">Debug Console</span>

        {/* Debug state badge */}
        {isDebugging && (
          <span className={`ml-2 text-[9px] uppercase font-bold px-1.5 py-0.5 rounded ${
            debugState === 'paused' ? 'text-[#facc15] bg-[rgba(250,204,21,0.12)]' :
            debugState === 'running' ? 'text-[#4ade80] bg-[rgba(74,222,128,0.12)] animate-pulse' :
            'text-[rgba(255,255,255,0.3)] bg-[rgba(255,255,255,0.05)]'
          }`}>
            {debugState}
          </span>
        )}

        {/* Debug controls (when paused) */}
        {isDebugging && debugState === 'paused' && (
          <div className="ml-2 flex items-center gap-0.5">
            <button onClick={continueExecution} className="p-1 rounded hover:bg-[rgba(255,255,255,0.08)] transition-colors" title="Continue (F5)">
              <SkipForward size={10} className="text-[#4ade80]" />
            </button>
            <button onClick={stepOver} className="p-1 rounded hover:bg-[rgba(255,255,255,0.08)] transition-colors" title="Step Over (F10)">
              <ArrowDown size={10} className="text-[rgba(255,255,255,0.6)]" />
            </button>
            <button onClick={stepInto} className="p-1 rounded hover:bg-[rgba(255,255,255,0.08)] transition-colors" title="Step Into (F11)">
              <ArrowUpFromLine size={10} className="text-[rgba(255,255,255,0.6)]" />
            </button>
            <button onClick={stepOut} className="p-1 rounded hover:bg-[rgba(255,255,255,0.08)] transition-colors" title="Step Out (Shift+F11)">
              <ArrowUp size={10} className="text-[rgba(255,255,255,0.6)]" />
            </button>
            <button onClick={stopDebugging} className="p-1 rounded hover:bg-[rgba(255,255,255,0.08)] transition-colors ml-1" title="Stop (Shift+F5)">
              <Square size={10} className="text-[#f87171]" />
            </button>
          </div>
        )}

        <div className="ml-auto flex items-center gap-1">
          {isDebugging && debugState === 'running' && (
            <span className="text-[10px] text-[#4ade80] mr-2 animate-pulse">Running...</span>
          )}
          <button
            onClick={clearExecutionOutput}
            className="p-1 rounded hover:bg-[rgba(255,255,255,0.06)] transition-colors"
            title="Clear Console"
          >
            <Trash2 size={11} className="text-[rgba(255,255,255,0.25)]" />
          </button>
        </div>
      </div>

      {/* ═══ Watch section ═══ */}
      <div className="border-b border-[rgba(255,255,255,0.04)] bg-[rgba(16,16,18,0.2)]">
        <button
          onClick={() => setShowWatch(!showWatch)}
          className="w-full flex items-center px-3 py-1 text-[10px] font-semibold text-[rgba(255,255,255,0.3)] hover:text-[rgba(255,255,255,0.5)] transition-colors"
        >
          <span className="mr-1.5 transition-transform" style={{ transform: showWatch ? 'rotate(90deg)' : 'rotate(0deg)' }}>
            ▶
          </span>
          WATCH
          <span className="ml-1.5 text-[9px] text-[rgba(255,255,255,0.2)]">({watchExpressions.length})</span>
        </button>
        {showWatch && (
          <div className="px-3 pb-1.5 space-y-0.5">
            {watchExpressions.length === 0 ? (
              <div className="text-[11px] text-[rgba(255,255,255,0.2)] italic py-0.5">
                No watch expressions. Add a variable name to watch.
              </div>
            ) : (
              watchExpressions.map((w, i) => {
                const val = evaluateWatch(w.expression);
                const match = isDebugging && debugState === 'paused'
                  ? variables.find((v) => v.name === w.expression)
                  : null;
                const valColor = match
                  ? ({ string: '#fbbf24', number: '#60a5fa', boolean: '#c084fc', object: '#34d399' }[match.type] || 'rgba(255,255,255,0.6)')
                  : 'rgba(255,255,255,0.3)';

                return (
                  <div key={i} className="flex items-center gap-2 py-[2px] group">
                    <Eye size={8} className="text-[rgba(255,255,255,0.2)] flex-shrink-0" />
                    <span className="text-[11px] font-mono text-[rgba(255,255,255,0.45)]">
                      {w.expression}
                    </span>
                    <span className="text-[rgba(255,255,255,0.15)]">=</span>
                    <span className="text-[11px] font-mono truncate" style={{ color: valColor }}>
                      {val}
                    </span>
                    {match?.type && (
                      <span className="text-[9px] text-[rgba(255,255,255,0.2)]">({match.type})</span>
                    )}
                    <button
                      onClick={() => handleRemoveWatch(i)}
                      className="ml-auto p-0.5 rounded opacity-0 group-hover:opacity-100 hover:bg-[rgba(248,113,113,0.15)] transition-all"
                      title="Remove watch expression"
                    >
                      <X size={10} className="text-[rgba(248,113,113,0.6)]" />
                    </button>
                  </div>
                );
              })
            )}
            {showAddWatch ? (
              <div className="flex items-center gap-1 pt-1">
                <input
                  type="text"
                  value={newWatchExpr}
                  onChange={(e) => setNewWatchExpr(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleAddWatchExpression(); if (e.key === 'Escape') { setShowAddWatch(false); setNewWatchExpr(''); } }}
                  placeholder="Variable name..."
                  className="w-32 px-1.5 py-0.5 text-[11px] bg-[rgba(255,255,255,0.06)] border border-[rgba(255,255,255,0.1)] rounded text-[rgba(255,255,255,0.7)] outline-none focus:border-[rgba(96,165,250,0.3)] font-mono"
                  autoFocus
                />
                <button onClick={handleAddWatchExpression} className="px-2 py-0.5 text-[10px] bg-[rgba(96,165,250,0.1)] text-[#60a5fa] rounded hover:bg-[rgba(96,165,250,0.2)] transition-colors">
                  Add
                </button>
                <button onClick={() => { setShowAddWatch(false); setNewWatchExpr(''); }} className="px-2 py-0.5 text-[10px] text-[rgba(255,255,255,0.3)] hover:text-[rgba(255,255,255,0.5)] transition-colors">
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowAddWatch(true)}
                className="flex items-center gap-1 text-[10px] text-[rgba(255,255,255,0.25)] hover:text-[rgba(96,165,250,0.6)] transition-colors pt-0.5"
              >
                <Plus size={10} />
                Add Expression
              </button>
            )}
          </div>
        )}
      </div>

      {/* ═══ Breakpoints section ═══ */}
      <div className="border-b border-[rgba(255,255,255,0.04)] bg-[rgba(16,16,18,0.2)]">
        <button
          onClick={() => setShowBreakpoints(!showBreakpoints)}
          className="w-full flex items-center px-3 py-1 text-[10px] font-semibold text-[rgba(255,255,255,0.3)] hover:text-[rgba(255,255,255,0.5)] transition-colors"
        >
          <span className="mr-1.5 transition-transform" style={{ transform: showBreakpoints ? 'rotate(90deg)' : 'rotate(0deg)' }}>
            ▶
          </span>
          BREAKPOINTS
          <span className="ml-1.5 text-[9px] text-[rgba(255,255,255,0.2)]">({breakpoints.length})</span>
        </button>
        {showBreakpoints && (
          <div className="px-3 pb-1.5 space-y-0.5">
            {breakpoints.length === 0 ? (
              <div className="text-[11px] text-[rgba(255,255,255,0.2)] italic py-0.5">
                No breakpoints set. Press F9 in the editor to add one.
              </div>
            ) : (
              breakpoints.map((bp, i) => (
                <div key={i}>
                  <div className="flex items-center gap-2 py-[2px] group">
                    {/* Logpoint indicator */}
                    {bp.isLogpoint ? (
                      <MessageSquare size={8} className="text-[#34d399] flex-shrink-0" />
                    ) : (
                      <Circle size={8} className="text-[#f87171] fill-[#f87171] flex-shrink-0" />
                    )}
                    <span className="text-[11px] text-[rgba(255,255,255,0.5)] font-mono">
                      Line {bp.line}
                    </span>
                    {bp.enabled === false && (
                      <span className="text-[9px] text-[rgba(255,255,255,0.2)] italic">disabled</span>
                    )}
                    {bp.condition && (
                      <span className="text-[9px] text-[#60a5fa] font-mono truncate max-w-[80px]" title={bp.condition}>
                        if {bp.condition}
                      </span>
                    )}
                    {bp.logMessage && (
                      <span className="text-[9px] text-[#34d399] font-mono truncate max-w-[80px]" title={bp.logMessage}>
                        log: {bp.logMessage}
                      </span>
                    )}
                    <div className="ml-auto flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-all">
                      {/* Toggle logpoint */}
                      <button
                        onClick={() => {
                          if (bp.isLogpoint) {
                            toggleLogpoint(bp.line);
                            addDebugHistory('system', `Converted logpoint at line ${bp.line} to breakpoint`);
                          } else {
                            setEditingLogMessage(bp.line);
                            setLogMessageText(bp.logMessage || '{expression}');
                          }
                        }}
                        className="p-0.5 rounded hover:bg-[rgba(52,211,153,0.15)] transition-all"
                        title={bp.isLogpoint ? 'Convert to breakpoint' : 'Convert to logpoint'}
                      >
                        <MessageSquare size={10} className={bp.isLogpoint ? 'text-[#34d399]' : 'text-[rgba(255,255,255,0.25)]'} />
                      </button>
                      {/* Add condition */}
                      {!bp.isLogpoint && (
                        <button
                          onClick={() => {
                            setEditingCondition(bp.line);
                            setConditionText(bp.condition || '');
                          }}
                          className="p-0.5 rounded hover:bg-[rgba(96,165,250,0.15)] transition-all"
                          title={bp.condition ? `Edit condition: ${bp.condition}` : 'Add condition'}
                        >
                          <Type size={10} className={bp.condition ? 'text-[#60a5fa]' : 'text-[rgba(255,255,255,0.25)]'} />
                        </button>
                      )}
                      <button
                        onClick={() => handleRemoveBreakpoint(bp.line)}
                        className="p-0.5 rounded hover:bg-[rgba(248,113,113,0.15)] transition-all"
                        title="Remove breakpoint"
                      >
                        <X size={10} className="text-[rgba(248,113,113,0.6)]" />
                      </button>
                    </div>
                  </div>
                  {/* Edit condition inline */}
                  {editingCondition === bp.line && (
                    <div className="flex items-center gap-1 pl-5 pb-1">
                      <span className="text-[9px] text-[rgba(255,255,255,0.3)] font-mono">if</span>
                      <input
                        type="text"
                        value={conditionText}
                        onChange={(e) => setConditionText(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleAddConditionalBreakpoint(bp.line);
                          if (e.key === 'Escape') { setEditingCondition(null); setConditionText(''); }
                        }}
                        placeholder="e.g. x > 5"
                        className="flex-1 px-1.5 py-0.5 text-[10px] bg-[rgba(255,255,255,0.06)] border border-[rgba(96,165,250,0.2)] rounded text-[rgba(255,255,255,0.7)] outline-none font-mono"
                        autoFocus
                      />
                      <button onClick={() => handleAddConditionalBreakpoint(bp.line)} className="px-1.5 py-0.5 text-[9px] bg-[rgba(96,165,250,0.1)] text-[#60a5fa] rounded hover:bg-[rgba(96,165,250,0.2)] transition-colors">
                        Set
                      </button>
                    </div>
                  )}
                  {/* Edit log message inline */}
                  {editingLogMessage === bp.line && (
                    <div className="flex items-center gap-1 pl-5 pb-1">
                      <span className="text-[9px] text-[rgba(255,255,255,0.3)] font-mono">log:</span>
                      <input
                        type="text"
                        value={logMessageText}
                        onChange={(e) => setLogMessageText(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleAddLogpoint(bp.line);
                          if (e.key === 'Escape') { setEditingLogMessage(null); setLogMessageText(''); }
                        }}
                        placeholder="e.g. x = {x}"
                        className="flex-1 px-1.5 py-0.5 text-[10px] bg-[rgba(255,255,255,0.06)] border border-[rgba(52,211,153,0.2)] rounded text-[rgba(255,255,255,0.7)] outline-none font-mono"
                        autoFocus
                      />
                      <button onClick={() => handleAddLogpoint(bp.line)} className="px-1.5 py-0.5 text-[9px] bg-[rgba(52,211,153,0.1)] text-[#34d399] rounded hover:bg-[rgba(52,211,153,0.2)] transition-colors">
                        Set
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
            {/* Add breakpoint input */}
            {showAddBp ? (
              <div className="flex items-center gap-1 pt-1">
                <input
                  type="number"
                  min="1"
                  value={newBpLine}
                  onChange={(e) => setNewBpLine(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleAddBreakpoint(); }}
                  placeholder="Line number..."
                  className="w-24 px-1.5 py-0.5 text-[11px] bg-[rgba(255,255,255,0.06)] border border-[rgba(255,255,255,0.1)] rounded text-[rgba(255,255,255,0.7)] outline-none focus:border-[rgba(74,222,128,0.3)] font-mono"
                  autoFocus
                />
                <button onClick={handleAddBreakpoint} className="px-2 py-0.5 text-[10px] bg-[rgba(74,222,128,0.1)] text-[#4ade80] rounded hover:bg-[rgba(74,222,128,0.2)] transition-colors">
                  Add
                </button>
                <button onClick={() => { setShowAddBp(false); setNewBpLine(''); }} className="px-2 py-0.5 text-[10px] text-[rgba(255,255,255,0.3)] hover:text-[rgba(255,255,255,0.5)] transition-colors">
                  Cancel
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 pt-0.5">
                <button
                  onClick={() => setShowAddBp(true)}
                  className="flex items-center gap-1 text-[10px] text-[rgba(255,255,255,0.25)] hover:text-[rgba(74,222,128,0.6)] transition-colors"
                >
                  <Plus size={10} />
                  Add
                </button>
                {breakpoints.length > 0 && (
                  <button
                    onClick={handleRemoveAllBreakpoints}
                    className="text-[10px] text-[rgba(255,255,255,0.25)] hover:text-[#f87171] transition-colors"
                  >
                    Clear All
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ═══ REPL history ═══ */}
      <div className="border-b border-[rgba(255,255,255,0.04)] bg-[rgba(16,16,18,0.2)]">
        <button
          onClick={() => setShowRepl(!showRepl)}
          className="w-full flex items-center px-3 py-1 text-[10px] font-semibold text-[rgba(255,255,255,0.3)] hover:text-[rgba(255,255,255,0.5)] transition-colors"
        >
          <span className="mr-1.5 transition-transform" style={{ transform: showRepl ? 'rotate(90deg)' : 'rotate(0deg)' }}>
            ▶
          </span>
          DEBUG REPL
          <Terminal size={10} className="ml-1.5 opacity-40" />
        </button>
        {showRepl && (
          <div className="px-2 pb-1.5">
            {debugReplHistory.length === 0 ? (
              <div className="text-[11px] text-[rgba(255,255,255,0.2)] italic py-0.5">
                Evaluate expressions while paused. Type an expression and press Enter.
              </div>
            ) : (
              <div className="max-h-[120px] overflow-y-auto space-y-0.5 mb-1">
                {debugReplHistory.map((entry, i) => (
                  <div key={i} className="font-mono text-[11px] leading-relaxed">
                    <div className="text-[rgba(130,170,255,0.6)]">
                      <span className="text-[rgba(255,255,255,0.2)] mr-1">&gt;</span>
                      {entry.expression}
                    </div>
                    <div className={{
                      pending: 'text-[rgba(255,255,255,0.3)] italic',
                      error: 'text-[#f87171]',
                      string: 'text-[#fbbf24]',
                      number: 'text-[#60a5fa]',
                      boolean: 'text-[#c084fc]',
                      object: 'text-[#34d399]',
                      function: 'text-[#f472b6]',
                      undefined: 'text-[rgba(255,255,255,0.3)]',
                    }[entry.type || 'string'] || 'text-[rgba(255,255,255,0.55)]'} pl-3>
                      {entry.error ? (
                        <span className="text-[#f87171]">✕ {entry.error}</span>
                      ) : (
                        <>{entry.result}</>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
            {/* REPL input */}
            <div className="flex items-center gap-1">
              <span className="text-[13px] text-[rgba(130,170,255,0.6)] font-mono">&gt;</span>
              <input
                ref={replInputRef}
                type="text"
                value={replInput}
                onChange={(e) => setReplInput(e.target.value)}
                onKeyDown={handleReplKeyDown}
                placeholder={isDebugging && debugState === 'paused' ? 'Evaluate expression...' : 'Start debugging to evaluate expressions...'}
                disabled={!isDebugging || debugState !== 'paused'}
                className="flex-1 px-1.5 py-0.5 text-[11px] bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.06)] rounded text-[rgba(255,255,255,0.7)] outline-none focus:border-[rgba(130,170,255,0.3)] font-mono disabled:opacity-40"
              />
              <button
                onClick={handleReplSubmit}
                disabled={!isDebugging || debugState !== 'paused' || !replInput.trim()}
                className="px-2 py-0.5 text-[10px] bg-[rgba(130,170,255,0.1)] text-[#82aaff] rounded hover:bg-[rgba(130,170,255,0.2)] transition-colors disabled:opacity-30"
              >
                Evaluate
              </button>
              <button
                onClick={clearDebugReplHistory}
                className="p-1 rounded hover:bg-[rgba(255,255,255,0.06)] transition-colors"
                title="Clear REPL history"
              >
                <Trash2 size={10} className="text-[rgba(255,255,255,0.2)]" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ═══ Debug output area ═══ */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto py-1">
        {!hasContent && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <Bug size={20} className="text-[rgba(255,255,255,0.08)] mb-2" />
            <p className="text-[12px] text-[rgba(255,255,255,0.2)]">Debug console</p>
            <p className="text-[10px] text-[rgba(255,255,255,0.12)] mt-1">Press F5 or Run → Start Debugging</p>
          </div>
        )}

        {/* Render debug history */}
        {debugHistory.map((entry, idx) => renderDebugEntry(entry, idx))}

        {/* Call stack indicator when paused — clickable */}
        {isDebugging && debugState === 'paused' && callStack.length > 0 && (
          <div className="mt-1 border-t border-[rgba(255,255,255,0.04)] pt-1">
            <div className="text-[9px] font-semibold text-[rgba(255,255,255,0.2)] uppercase px-2 mb-0.5">Call Stack</div>
            {callStack.slice(0, 5).map((frame, i) => {
              const fileName = frame.url?.split('/').pop() || 'unknown';
              const lineNum = frame.lineNumber || 1;
              return (
                <button
                  key={i}
                  onClick={() => {
                    // Navigate to file at line
                    const state = useWorkspace.getState();
                    const filePath = frame.url || '';
                    const fName = filePath.split('/').pop() || filePath.split('\\').pop();
                    const file = state.files.find(f => f.name === fName);
                    if (file) {
                      state.openFile({ ...file, id: file._id || file.id });
                      setTimeout(() => {
                        window.dispatchEvent(new CustomEvent('editor:action', {
                          detail: { action: 'revealLine', line: lineNum },
                        }));
                      }, 200);
                    }
                  }}
                  className="flex items-center gap-1.5 px-2 py-[1px] text-[11px] font-mono w-full text-left hover:bg-[rgba(255,255,255,0.03)] transition-colors cursor-pointer"
                  title={`Click to navigate to ${fileName}:${lineNum}`}
                >
                  <span className="text-[9px] text-[rgba(255,255,255,0.15)]">#{i}</span>
                  <span className="text-[rgba(255,255,255,0.55)]">{frame.functionName}</span>
                  <span className="text-[rgba(255,255,255,0.25)]">—</span>
                  <span className="text-[rgba(255,255,255,0.3)]">{fileName}:{lineNum}</span>
                </button>
              );
            })}
            {callStack.length > 5 && (
              <div className="text-[10px] text-[rgba(255,255,255,0.2)] px-2">... and {callStack.length - 5} more</div>
            )}
          </div>
        )}

        {/* Variables display when paused */}
        {isDebugging && debugState === 'paused' && variables.length > 0 && (
          <div className="mt-1 border-t border-[rgba(255,255,255,0.04)] pt-1">
            <div className="text-[9px] font-semibold text-[rgba(255,255,255,0.2)] uppercase px-2 mb-0.5">
              Variables ({variables.length})
            </div>
            {variables.map((v, i) => (
              <div key={i} className="flex items-start gap-2 px-2 py-[1px] text-[11px] font-mono">
                <span className="text-[rgba(130,170,255,0.7)] whitespace-nowrap">{v.name}</span>
                <span className="text-[rgba(255,255,255,0.25)]">=</span>
                <span className="text-[rgba(206,145,255,0.7)] break-all">{v.value}</span>
                {v.type && v.type !== 'unknown' && (
                  <span className="text-[9px] text-[rgba(255,255,255,0.2)] whitespace-nowrap">({v.type})</span>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Legacy execution output (for non-debug runs) */}
        {!isDebugging && executionOutput && (
          executionOutput.split('\n').map((line, idx) => (
            line.trim() ? (
              <div key={`legacy-${idx}`} className="whitespace-pre-wrap px-2 py-[1px] text-[13px] font-mono text-[rgba(255,255,255,0.55)]">
                {line}
              </div>
            ) : null
          ))
        )}

        {!isDebugging && executionError && (
          <div className="whitespace-pre-wrap px-2 py-[1px] text-[#f87171] text-[13px] font-mono">{executionError}</div>
        )}

        {/* Blinking cursor when running */}
        {isDebugging && debugState === 'running' && (
          <div className="text-[#4ade80] px-2 py-[1px] animate-pulse text-[13px] font-mono">|</div>
        )}
      </div>
    </div>
  );
}
