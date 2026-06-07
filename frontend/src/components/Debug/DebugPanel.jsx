import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bug, Square, Play, Pause,
  StepForward, CornerDownRight, CornerUpLeft,
  Settings, Trash2, Eye, EyeOff, Plus,
} from 'lucide-react';
import { useWorkspace } from '../../stores/useWorkspace';

// ── Debug config selector dropdown ──
const debugConfigs = [
  { id: 'node', label: 'Node.js' },
  { id: 'python', label: 'Python' },
  { id: 'browser', label: 'Browser (Edge/Chrome)' },
];

function ConfigSelector() {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(debugConfigs[0]);
  const ref = useRef(null);

  useEffect(() => {
    const handleClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    if (open) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  const openLaunchConfig = () => {
    const state = useWorkspace.getState();
    const g = state.getActiveGroup();
    const launchFile = {
      id: `untitled-launch-${Date.now()}`,
      name: 'launch.json',
      path: '.vscode/launch.json',
      type: 'file',
      isUntitled: true,
    };
    state.openFile(launchFile, g?.id);
    state.updateCode(JSON.stringify({
      version: '0.2.0',
      configurations: [{
        type: selected.id,
        request: 'launch',
        name: `Launch ${selected.label}`,
        program: selected.id === 'node' ? '${file}' : undefined,
      }],
    }, null, 2), g?.id);
  };

  return (
    <div ref={ref} className="relative flex items-center gap-0.5 px-2 py-1.5 border-b border-[rgba(255,255,255,0.04)]">
      <motion.button
        whileHover={{ background: 'rgba(255,255,255,0.04)' }}
        onClick={() => setOpen(!open)}
        className="flex-1 flex items-center gap-1.5 text-[11px] py-0.5 px-1 rounded transition-colors"
        style={{ color: 'rgba(255,255,255,0.5)' }}
      >
        <Bug size={11} />
        <span className="flex-1 text-left">{selected.label}</span>
        <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.4 }}>
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </motion.button>

      <motion.button
        whileHover={{ background: 'rgba(255,255,255,0.08)' }}
        whileTap={{ scale: 0.9 }}
        onClick={openLaunchConfig}
        className="p-1 rounded transition-colors"
        style={{ color: 'rgba(255,255,255,0.25)' }}
        title="Open launch.json"
      >
        <Settings size={12} />
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.96 }}
            transition={{ duration: 0.12 }}
            className="absolute left-0 top-full mt-0.5 min-w-[160px] z-50"
            style={{
              background: 'rgba(18,18,22,0.95)',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: '6px',
              boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
              backdropFilter: 'blur(40px)',
            }}
          >
            <div className="py-1">
              {debugConfigs.map((cfg) => (
                <motion.button
                  key={cfg.id}
                  onClick={() => { setSelected(cfg); setOpen(false); }}
                  className="w-full flex items-center gap-2 px-3 py-1.5 text-[11px] transition-all"
                  style={{
                    color: cfg.id === selected.id ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.4)',
                    background: cfg.id === selected.id ? 'rgba(255,255,255,0.04)' : 'transparent',
                  }}
                >
                  <Bug size={11} />
                  <span>{cfg.label}</span>
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Section row ──
function ToolButton({ icon: Icon, onClick, disabled, active, title, className }) {
  return (
    <motion.button
      whileHover={{ background: disabled ? undefined : 'rgba(255,255,255,0.08)' }}
      whileTap={disabled ? undefined : { scale: 0.88 }}
      onClick={onClick}
      disabled={disabled}
      className={`p-1 rounded transition-all ${className || ''}`}
      style={{
        color: active ? 'rgba(74,222,128,0.9)' : disabled ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.4)',
        background: active ? 'rgba(74,222,128,0.08)' : 'transparent',
        cursor: disabled ? 'not-allowed' : 'pointer',
      }}
      title={title}
    >
      <Icon size={14} />
    </motion.button>
  );
}

// ── Debug toolbar ──
function DebugToolbar() {
  const {
    isDebugging, debugState,
    startDebugging, stopDebugging, continueExecution, stepOver, stepInto, stepOut,
  } = useWorkspace();

  const isPaused = debugState === 'paused';
  const isRunning = isDebugging && !isPaused;

  return (
    <div className="flex items-center gap-0.5 px-2 py-1.5 border-b border-[rgba(255,255,255,0.04)]">
      {isDebugging ? (
        <ToolButton icon={Square} onClick={stopDebugging} title="Stop (Shift+F5)" className="!text-[#f87171]" />
      ) : (
        <ToolButton icon={Play} onClick={startDebugging} title="Start Debugging (F5)" active />
      )}

      <div className="w-px h-4 mx-0.5 bg-[rgba(255,255,255,0.04)]" />

      <ToolButton
        icon={isPaused ? Play : Pause}
        onClick={isPaused ? continueExecution : () => {}}
        disabled={!isDebugging}
        title={isPaused ? 'Continue (F5)' : 'Pause (F6)'}
        active={isPaused}
      />
      <ToolButton icon={StepForward} onClick={stepOver} disabled={!isPaused} title="Step Over (F10)" />
      <ToolButton icon={CornerDownRight} onClick={stepInto} disabled={!isPaused} title="Step Into (F11)" />
      <ToolButton icon={CornerUpLeft} onClick={stepOut} disabled={!isPaused} title="Step Out (Shift+F11)" />

      <div className="flex-1" />

      {/* State indicator */}
      <div className="flex items-center gap-1.5 px-1.5 py-0.5 rounded" style={{ background: 'rgba(255,255,255,0.03)' }}>
        <span className={`w-1.5 h-1.5 rounded-full ${
          debugState === 'running' ? 'bg-[#4ade80]' :
          debugState === 'paused' ? 'bg-[#fbbf24]' :
          'bg-[rgba(255,255,255,0.2)]'
        }`} />
        <span className="text-[9px] font-medium tracking-wider uppercase" style={{ color: 'rgba(255,255,255,0.35)' }}>
          {debugState === 'running' ? 'Running' : debugState === 'paused' ? 'Paused' : 'Idle'}
        </span>
      </div>
    </div>
  );
}

// ── Section component ──
function Section({ title, count, actions, children, defaultOpen = true }) {
  const [collapsed, setCollapsed] = useState(!defaultOpen);

  return (
    <div>
      <div className="flex items-center gap-1 px-2 py-1 border-b border-[rgba(255,255,255,0.03)] sticky top-0 z-10"
        style={{ background: 'rgba(12,12,14,0.95)' }}
      >
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => setCollapsed(!collapsed)}
          className="flex items-center gap-1 flex-1"
        >
          <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            style={{
              color: 'rgba(255,255,255,0.25)',
              transform: collapsed ? 'rotate(-90deg)' : 'rotate(0deg)',
              transition: 'transform 0.15s',
            }}
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
          <span className="text-[9px] font-semibold uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.3)' }}>
            {title}
          </span>
          {count !== undefined && (
            <span className="text-[9px]" style={{ color: 'rgba(255,255,255,0.15)' }}>{count}</span>
          )}
        </motion.button>
        {actions && <div className="flex items-center gap-0.5">{actions}</div>}
      </div>
      {!collapsed && children}
    </div>
  );
}

// ── Empty state row ──
function EmptyRow({ icon: Icon, text }) {
  return (
    <div className="flex items-center gap-2 px-3 py-2 text-[10px]" style={{ color: 'rgba(255,255,255,0.2)' }}>
      {Icon && <Icon size={10} />}
      <span>{text}</span>
    </div>
  );
}

// ── Variable row with tree expansion + inline editing ──
function VariableRow({ name, value, type, indent = 0, variablesReference, onSetValue }) {
  const {
    expandedVariables, fetchChildrenVariables, setChildrenVariables,
  } = useWorkspace();
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState('');
  const [children, setChildren] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const colorMap = {
    string: '#fbbf24',
    number: '#60a5fa',
    boolean: '#c084fc',
    object: '#34d399',
    function: '#f472b6',
    undefined: 'rgba(255,255,255,0.3)',
  };
  const isExpandable = variablesReference && (
    (typeof variablesReference === 'number' && variablesReference > 0) ||
    (typeof variablesReference === 'string' && variablesReference.length > 0)
  );
  const valColor = colorMap[type] || 'rgba(255,255,255,0.5)';

  const handleToggle = async () => {
    if (children) {
      // Collapse
      setChildren(null);
    } else {
      // Expand
      setIsLoading(true);
      const state = useWorkspace.getState();
      state.fetchChildrenVariables(variablesReference);
      // Poll for children to be loaded
      const check = setInterval(() => {
        const expanded = useWorkspace.getState().expandedVariables[variablesReference];
        if (expanded) {
          if (!expanded.loading) {
            clearInterval(check);
            setChildren(expanded.children);
            setIsLoading(false);
          }
        } else {
          clearInterval(check);
          setIsLoading(false);
        }
      }, 100);
      // Safety timeout
      setTimeout(() => {
        clearInterval(check);
        setIsLoading(false);
      }, 5000);
    }
  };

  const handleDoubleClick = () => {
    if (onSetValue) {
      setEditValue(value || '');
      setEditing(true);
    }
  };

  const handleEditSubmit = () => {
    if (onSetValue && editValue !== value) {
      onSetValue(name, editValue, variablesReference);
    }
    setEditing(false);
  };

  const handleEditKeyDown = (e) => {
    if (e.key === 'Enter') handleEditSubmit();
    if (e.key === 'Escape') setEditing(false);
  };

  return (
    <div>
      <div
        className="flex items-center gap-1.5 px-3 py-0.5 hover:bg-[rgba(255,255,255,0.02)] transition-colors group"
        style={{ paddingLeft: `${12 + indent * 12}px` }}
      >
        {/* Expand/collapse arrow for compound types */}
        {isExpandable ? (
          <button
            onClick={handleToggle}
            className="p-0.5 rounded hover:bg-[rgba(255,255,255,0.06)] transition-colors flex-shrink-0"
          >
            {isLoading ? (
              <span className="inline-block w-[10px] text-center text-[8px] animate-spin">⟳</span>
            ) : (
              <svg
                width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                style={{
                  color: 'rgba(255,255,255,0.2)',
                  transform: children ? 'rotate(90deg)' : 'rotate(0deg)',
                  transition: 'transform 0.12s',
                }}
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            )}
          </button>
        ) : (
          <span className="w-[10px] flex-shrink-0" />
        )}

        <span className="text-[10px] font-mono truncate max-w-[100px]" style={{ color: 'rgba(255,255,255,0.6)' }}>{name}</span>
        <span className="text-[9px]" style={{ color: 'rgba(255,255,255,0.15)' }}>=</span>

        {editing ? (
          <input
            type="text"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={handleEditSubmit}
            onKeyDown={handleEditKeyDown}
            className="flex-1 px-1 py-0.5 text-[10px] font-mono bg-[rgba(255,255,255,0.06)] border border-[rgba(255,255,255,0.15)] rounded outline-none text-[rgba(255,255,255,0.7)]"
            autoFocus
          />
        ) : (
          <span
            className="text-[10px] font-mono truncate flex-1 cursor-text"
            style={{ color: valColor }}
            onDoubleClick={handleDoubleClick}
            title="Double-click to edit"
          >
            {value}
          </span>
        )}

        {type && !editing && (
          <span className="text-[8px]" style={{ color: 'rgba(255,255,255,0.15)' }}>{type}</span>
        )}

        {/* Inline edit hint */}
        {onSetValue && !editing && (
          <button
            onClick={handleDoubleClick}
            className="p-0.5 rounded opacity-0 group-hover:opacity-100 hover:bg-[rgba(255,255,255,0.06)] transition-all ml-auto"
            title="Edit value"
          >
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'rgba(255,255,255,0.2)' }}>
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
          </button>
        )}
      </div>
      {/* Expanded children */}
      {children && children.map((child, i) => (
        <VariableRow
          key={`${child.name}-${i}`}
          name={child.name}
          value={child.value}
          type={child.type}
          indent={indent + 1}
          variablesReference={child.variablesReference}
          onSetValue={onSetValue}
        />
      ))}
    </div>
  );
}

// ── Variables section with scope grouping ──
function VariablesSection() {
  const variables = useWorkspace((s) => s.variables);
  const { isDebugging, debugState, setVariableValue, addDebugHistory } = useWorkspace();

  const handleSetValue = (name, value, variablesReference) => {
    setVariableValue(name, value, variablesReference);
    if (isDebugging && debugState === 'paused') {
      addDebugHistory('system', `Set ${name} = ${value}`);
    }
  };

  // Group variables by scope
  const scoped = {};
  variables.forEach((v) => {
    const scope = v.scope || 'Local';
    if (!scoped[scope]) scoped[scope] = [];
    scoped[scope].push(v);
  });

  const scopeNames = Object.keys(scoped);

  return (
    <Section title="Variables" count={variables.length}>
      {variables.length === 0 ? (
        <EmptyRow icon={Bug} text="No variables" />
      ) : (
        scopeNames.map((scope) => (
          <div key={scope}>
            <div className="px-3 py-0.5 text-[9px] font-medium uppercase tracking-wider cursor-default"
              style={{ color: 'rgba(255,255,255,0.2)' }}
            >
              {scope}
            </div>
            {scoped[scope].map((v, i) => (
              <VariableRow
                key={i}
                name={v.name}
                value={v.value}
                type={v.type}
                indent={1}
                variablesReference={v.variablesReference}
                onSetValue={isDebugging && debugState === 'paused' ? handleSetValue : null}
              />
            ))}
          </div>
        ))
      )}
    </Section>
  );
}

// ── Watch Expressions section ──
function WatchSection() {
  const { watchExpressions, addWatchExpression, removeWatchExpression, updateWatchExpression } = useWorkspace();
  const [newExpr, setNewExpr] = useState('');
  const [editingIndex, setEditingIndex] = useState(-1);
  const inputRef = useRef(null);

  const handleAdd = () => {
    const trimmed = newExpr.trim();
    if (!trimmed) return;
    addWatchExpression(trimmed);
    setNewExpr('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleAdd();
    if (e.key === 'Escape') setNewExpr('');
  };

  useEffect(() => {
    if (editingIndex >= 0) inputRef.current?.focus();
  }, [editingIndex]);

  return (
    <Section
      title="Watch"
      count={watchExpressions.length}
      actions={
        <motion.button
          whileHover={{ color: 'rgba(255,255,255,0.5)' }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setEditingIndex(watchExpressions.length)}
          className="p-0.5 rounded"
          style={{ color: 'rgba(255,255,255,0.2)' }}
          title="Add expression"
        >
          <Plus size={11} />
        </motion.button>
      }
    >
      {watchExpressions.length === 0 && editingIndex < 0 ? (
        <EmptyRow icon={Eye} text="No watch expressions" />
      ) : (
        watchExpressions.map((w, i) => (
          <div key={i} className="flex items-center gap-1 px-2 py-0.5 group hover:bg-[rgba(255,255,255,0.02)]">
            {editingIndex === i ? (
              <input
                ref={inputRef}
                defaultValue={w.expression}
                onBlur={(e) => {
                  const val = e.target.value.trim();
                  if (val) {
                    updateWatchExpression(i, { ...w, expression: val });
                  } else {
                    removeWatchExpression(i);
                  }
                  setEditingIndex(-1);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') e.currentTarget.blur();
                  if (e.key === 'Escape') setEditingIndex(-1);
                }}
                className="w-full bg-transparent text-[10px] font-mono outline-none px-1 py-0.5 rounded"
                style={{
                  color: 'rgba(255,255,255,0.6)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  background: 'rgba(255,255,255,0.03)',
                }}
                autoFocus
              />
            ) : (
              <>
                <span
                  className="flex-1 text-[10px] font-mono truncate cursor-text"
                  style={{ color: 'rgba(255,255,255,0.5)' }}
                  onDoubleClick={() => setEditingIndex(i)}
                >
                  {w.expression}
                </span>
                <span className="text-[10px] font-mono truncate max-w-[80px]" style={{ color: '#60a5fa' }}>
                  {w.value || '…'}
                </span>
                <motion.button
                  whileHover={{ color: 'rgba(248,113,113,0.7)' }}
                  whileTap={{ scale: 0.8 }}
                  onClick={() => removeWatchExpression(i)}
                  className="p-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ color: 'rgba(255,255,255,0.15)' }}
                >
                  <Trash2 size={10} />
                </motion.button>
              </>
            )}
          </div>
        ))
      )}
      {editingIndex >= watchExpressions.length && (
        <div className="flex items-center gap-1 px-2 py-0.5">
          <input
            ref={inputRef}
            value={newExpr}
            onChange={(e) => setNewExpr(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={handleAdd}
            placeholder="Type expression and press Enter"
            className="w-full bg-transparent text-[10px] font-mono outline-none px-1 py-0.5 rounded"
            style={{
              color: 'rgba(255,255,255,0.6)',
              border: '1px solid rgba(255,255,255,0.1)',
              background: 'rgba(255,255,255,0.03)',
            }}
            autoFocus
          />
        </div>
      )}
    </Section>
  );
}

// ── Call Stack section with navigation ──
function CallStackSection() {
  const callStack = useWorkspace((s) => s.callStack);

  const handleFrameClick = (frame) => {
    // Try to open the file at the specified line via custom event
    const filePath = frame.url || frame.file || frame.name || '';
    const line = frame.lineNumber || frame.line || 1;
    const state = useWorkspace.getState();
    
    // Try to find the file by name in the workspace
    const fileName = filePath.split('/').pop() || filePath.split('\\').pop();
    const file = state.files.find(f => f.name === fileName);
    
    if (file) {
      // Open file and navigate to line
      state.openFile({ ...file, id: file._id || file.id });
      // Dispatch event to jump to line after editor mounts
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('editor:action', {
          detail: { action: 'goToLine', line },
        }));
      }, 200);
      // Also add a temporary highlight
      window.dispatchEvent(new CustomEvent('editor:action', {
        detail: { action: 'revealLine', line },
      }));
    }

    // Add to debug history
    state.addDebugHistory('system', `Navigated to ${fileName || filePath}:${line}`);
  };

  return (
    <Section title="Call Stack" count={callStack.length}>
      {callStack.length === 0 ? (
        <EmptyRow icon={LayersIcon} text="Not paused" />
      ) : (
        callStack.map((frame, i) => {
          const fileName = frame.file || frame.url?.split('/').pop() || 'unknown';
          const lineNum = frame.lineNumber || frame.line || 0;
          return (
            <div
              key={i}
              onClick={() => handleFrameClick(frame)}
              className="flex items-center gap-2 px-3 py-1 hover:bg-[rgba(255,255,255,0.03)] transition-colors cursor-pointer"
              title={`Click to navigate to ${fileName}:${lineNum}`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#c084fc]" style={{ opacity: i === 0 ? 1 : 0.3 }} />
              <span className="text-[10px] font-mono truncate" style={{ color: i === 0 ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.5)' }}>
                {frame.functionName || frame.function || '<anonymous>'}
              </span>
              <span className="text-[9px] ml-auto truncate" style={{ color: 'rgba(255,255,255,0.2)' }}>
                {fileName}:{lineNum}
              </span>
            </div>
          );
        })
      )}
    </Section>
  );
}

function LayersIcon({ size }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 22 8.5 12 15 2 8.5" />
      <polyline points="2 15.5 12 22 22 15.5" />
      <polyline points="2 11.5 12 18 22 11.5" />
    </svg>
  );
}

// ── Loaded Scripts section ──
function LoadedScriptsSection() {
  const loadedScripts = useWorkspace((s) => s.loadedScripts);

  return (
    <Section title="Loaded Scripts" count={loadedScripts.length}>
      {loadedScripts.length === 0 ? (
        <EmptyRow text="No scripts loaded" />
      ) : (
        loadedScripts.map((script, i) => (
          <div key={i} className="flex items-center gap-2 px-3 py-0.5 text-[10px] font-mono"
            style={{ color: 'rgba(255,255,255,0.4)' }}
          >
            <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ opacity: 0.3 }}>
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
            </svg>
            <span className="truncate">{script.name || script}</span>
          </div>
        ))
      )}
    </Section>
  );
}

// ── Breakpoints section ──
function BreakpointsSection() {
  const { breakpoints, addBreakpoint, removeBreakpoint, enableAllBreakpoints, disableAllBreakpoints, removeAllBreakpoints } = useWorkspace();
  const allEnabled = breakpoints.length > 0 && breakpoints.every((b) => b.enabled !== false);



  return (
    <Section
      title="Breakpoints"
      count={breakpoints.length}
      actions={
        breakpoints.length > 0 && (
          <div className="flex items-center gap-0.5">
            <motion.button
              whileHover={{ color: 'rgba(255,255,255,0.5)' }}
              whileTap={{ scale: 0.9 }}
              onClick={allEnabled ? disableAllBreakpoints : enableAllBreakpoints}
              className="p-0.5 rounded"
              style={{ color: 'rgba(255,255,255,0.2)' }}
              title={allEnabled ? 'Disable all breakpoints' : 'Enable all breakpoints'}
            >
              {allEnabled ? <EyeOff size={10} /> : <Eye size={10} />}
            </motion.button>
            <motion.button
              whileHover={{ color: 'rgba(248,113,113,0.7)' }}
              whileTap={{ scale: 0.9 }}
              onClick={removeAllBreakpoints}
              className="p-0.5 rounded"
              style={{ color: 'rgba(255,255,255,0.2)' }}
              title="Remove all breakpoints"
            >
              <Trash2 size={10} />
            </motion.button>
          </div>
        )
      }
    >
      {breakpoints.length === 0 ? (
        <EmptyRow icon={Bug} text="No breakpoints" />
      ) : (
        breakpoints.map((bp, i) => {
          const enabled = bp.enabled !== false;
          const fileName = bp.fileId?.split('/').pop() || bp.fileId || 'unknown';
          return (
            <div key={i} className="flex items-center gap-2 px-2 py-0.5 group hover:bg-[rgba(255,255,255,0.02)] transition-colors">
              <motion.button
                whileTap={{ scale: 0.8 }}
                onClick={() => {
                  if (enabled) removeBreakpoint(bp.line);
                }}
                className={`w-2.5 h-2.5 rounded-full flex-shrink-0 transition-colors ${
                  enabled ? 'bg-[#f87171] hover:bg-[#ef4444]' : 'bg-[rgba(255,255,255,0.1)]'
                }`}
                title={enabled ? 'Remove breakpoint' : 'Disabled'}
              />
              <span className="text-[10px] font-mono truncate flex-1" style={{ color: enabled ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.2)' }}>
                {fileName}
              </span>
              <span className="text-[9px]" style={{ color: enabled ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.1)' }}>
                {bp.line}
              </span>
            </div>
          );
        })
      )}
    </Section>
  );
}

// ── Main DebugPanel ──
export default function DebugPanel() {
  return (
    <div className="flex flex-col h-full text-[12px] overflow-y-auto" style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.08) transparent' }}>
      {/* Config selector */}
      <ConfigSelector />

      {/* Debug toolbar */}
      <DebugToolbar />

      {/* Variables */}
      <VariablesSection />

      {/* Watch */}
      <WatchSection />

      {/* Call Stack */}
      <CallStackSection />

      {/* Loaded Scripts */}
      <LoadedScriptsSection />

      {/* Breakpoints */}
      <BreakpointsSection />
    </div>
  );
}
