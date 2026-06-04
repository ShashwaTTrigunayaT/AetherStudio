import React, { useRef, useCallback, useEffect, useState } from 'react';
import Editor from '@monaco-editor/react';
import { useWorkspace } from '../../stores/useWorkspace';

import { getSocket } from '../../lib/api';
import { getYjs, setLocalCursor, setTyping, onAwarenessChange } from '../../lib/yjs-provider';
import { Loader2 } from 'lucide-react';

const AETHER_DARK_THEME = {
  base: 'vs-dark',
  inherit: true,
  rules: [
    { token: 'comment', foreground: '6A9955', fontStyle: 'italic' },
    { token: 'string', foreground: 'CE9178' },
    { token: 'string.quoted', foreground: 'CE9178' },
    { token: 'number', foreground: 'B5CEA8' },
    { token: 'keyword', foreground: '569CD6' },
    { token: 'keyword.control', foreground: 'C586C0' },
    { token: 'keyword.operator', foreground: 'D4D4D4' },
    { token: 'type', foreground: '4EC9B0' },
    { token: 'type.identifier', foreground: '4EC9B0' },
    { token: 'function', foreground: 'DCDCAA' },
    { token: 'function.identifier', foreground: 'DCDCAA' },
    { token: 'variable', foreground: '9CDCFE' },
    { token: 'variable.identifier', foreground: '9CDCFE' },
    { token: 'parameter', foreground: '9CDCFE' },
    { token: 'property', foreground: 'CE9178' },
    { token: 'tag', foreground: '569CD6' },
    { token: 'delimiter', foreground: 'D4D4D4' },
    { token: 'attribute.name', foreground: '9CDCFE' },
    { token: 'attribute.value', foreground: 'CE9178' },
    { token: 'string.key', foreground: 'CE9178' },
    { token: 'string.value', foreground: 'CE9178' },
    { token: 'regexp', foreground: 'D16969' },
    { token: 'constant', foreground: '4FC1FF' },
    { token: 'constant.numeric', foreground: 'B5CEA8' },
    { token: 'operator', foreground: 'D4D4D4' },
    { token: 'meta.embedded', foreground: 'D4D4D4' },
    { token: 'variable.predefined', foreground: '569CD6' },
  ],
  colors: {
    'editor.background': '#121214',
    'editor.foreground': '#D4D4D4',
    'editor.lineHighlightBackground': '#1A1A1E',
    'editor.selectionBackground': '#264F78',
    'editor.inactiveSelectionBackground': '#1E3A5F',
    'editorCursor.foreground': '#AEAFAD',
    'editor.findMatchBackground': '#515C6A',
    'editor.findMatchHighlightBackground': '#3A3D41',
    'editorBracketMatch.background': '#1A1A1E',
    'editorBracketMatch.border': '#888888',
    'editorGutter.background': '#121214',
    'editorGutter.foreground': '#555555',
    'editorGutter.commentRangeForeground': '#555555',
    'editorLineNumber.foreground': '#555555',
    'editorLineNumber.activeForeground': '#888888',
    'editorIndentGuide.background': '#222226',
    'editorIndentGuide.activeBackground': '#3A3A3E',
    'editorWhitespace.foreground': '#2A2A2E',
    'editorWidget.background': '#1E1E22',
    'editorWidget.border': '#333338',
    'editorSuggestWidget.background': '#1E1E22',
    'editorSuggestWidget.border': '#333338',
    'editorSuggestWidget.foreground': '#D4D4D4',
    'editorSuggestWidget.selectedBackground': '#264F78',
    'editorBracketHighlight.foreground1': '#569CD6',
    'editorBracketHighlight.foreground2': '#DCDCAA',
    'editorBracketHighlight.foreground3': '#CE9178',
    'scrollbar.shadow': '#00000066',
    'scrollbarSlider.background': '#33333866',
    'scrollbarSlider.hoverBackground': '#42424299',
    'scrollbarSlider.activeBackground': '#555555CC',
    'minimap.background': '#121214',
    'minimapSlider.background': '#33333866',
    'minimapSlider.hoverBackground': '#42424299',
    'minimapSlider.activeBackground': '#555555CC',
  },
};

export default function MonacoEditor({ groupId }) {
  const editorRef = useRef(null);
  const monacoRef = useRef(null);
  const [content, setContent] = useState('');
  const [loadingContent, setLoadingContent] = useState(false);
  const [saveStatus, setSaveStatus] = useState('idle');
  const saveTimerRef = useRef(null);
  const decorationsRef = useRef(null);

  const {
    getGroupById, updateCode, activeFile, settings, setProblems,
    fetchFileContent, saveFileContent, editorGroups, activeGroupId,
    setActiveGroup,
  } = useWorkspace();

  const group = getGroupById(groupId);

  // Fetch file content when activeFile changes in this group
  useEffect(() => {
    if (!group?.activeFile?.id) {
      setContent('');
      return;
    }
    let cancelled = false;

    const loadContent = async () => {
      setLoadingContent(true);
      setSaveStatus('idle');
      try {
        const fileContent = await fetchFileContent(group.activeFile.id);
        if (!cancelled) {
          setContent(fileContent ?? '');
          updateCode(fileContent ?? '', groupId);
        }
      } catch (e) {
        if (!cancelled) {
          setContent('');
          updateCode('', groupId);
        }
      } finally {
        if (!cancelled) {
          setLoadingContent(false);
        }
      }
    };

    loadContent();
    return () => { cancelled = true; };
  }, [group?.activeFile?.id, groupId, fetchFileContent, updateCode]);

  // Sync code from store when not focused
  const groupCode = group?.code;

  // Auto-save with debounce (per-group)
  useEffect(() => {
    if (!group?.activeFile?.id || !settings.autoSave) return;
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);

    saveTimerRef.current = setTimeout(async () => {
      const state = useWorkspace.getState();
      const currentGroup = state.getGroupById(groupId);
      const currentCode = currentGroup?.code;
      if (currentCode !== undefined && currentCode !== null && currentCode !== '') {
        setSaveStatus('saving');
        try {
          await saveFileContent(group.activeFile.id, currentCode);
          setSaveStatus('saved');
          setTimeout(() => setSaveStatus('idle'), 2000);
        } catch {
          setSaveStatus('error');
        }
      }
    }, 1500);

    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [groupCode, group?.activeFile?.id, settings.autoSave, saveFileContent, groupId]);

  const handleEditorChange = useCallback((value) => {
    if (value === undefined || value === null) return;
    updateCode(value, groupId);
    setContent(value);

    try {
      const { yText } = getYjs() || {};
      if (yText && typeof value === 'string') {
        yText.delete(0, yText.length);
        yText.insert(0, value);
      }
    } catch (e) {
      // Yjs sync best-effort
    }
  }, [updateCode, groupId]);

  const disposablesRef = useRef([]);
  const remoteCursorsRef = useRef([]);
  const styleCleanupRef = useRef(null);

  const handleEditorMount = useCallback((editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;

    // Clean up previous disposables
    disposablesRef.current.forEach((d) => d?.dispose());
    disposablesRef.current = [];
    const disp = disposablesRef.current;

    // Activate group on editor focus
    disp.push(
      editor.onDidFocusEditorText(() => {
        const state = useWorkspace.getState();
        if (state.activeGroupId !== groupId) {
          state.setActiveGroup(groupId);
        }
        // Start broadcasting cursor when editor is focused
        const pos = editor.getPosition();
        if (pos) {
          setLocalCursor({ lineNumber: pos.lineNumber, column: pos.column });
        }
      })
    );

    // Stop broadcasting cursor when editor loses focus
    disp.push(
      editor.onDidBlurEditorText(() => {
        setLocalCursor(null);
      })
    );

    try {
      monaco.editor.defineTheme('aether-dark', AETHER_DARK_THEME);
      monaco.editor.setTheme('aether-dark');
    } catch (e) {
      console.warn('Failed to set editor theme:', e);
    }

    // ── VS Code-like keybindings & actions ──

    // Save (Ctrl+S)
    try {
      const saveAction = editor.addAction({
        id: 'save-action',
        label: 'Save',
        keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS],
        run: async (ed) => {
          const state = useWorkspace.getState();
          const currentGroup = state.getGroupById(groupId);
          const fileId = currentGroup?.activeFile?.id;
          const val = ed.getValue();
          if (fileId) {
            setSaveStatus('saving');
            try {
              await state.saveFileContent(fileId, val);
              setSaveStatus('saved');
              setTimeout(() => setSaveStatus('idle'), 2000);
            } catch {
              setSaveStatus('error');
            }
          }
        },
      });
      if (saveAction) disp.push({ dispose: () => saveAction.dispose?.() });
    } catch (e) { /* ignore */ }

    // Go to Line (Ctrl+G)
    try {
      const gotoLineAction = editor.addAction({
        id: 'actions.goToLine',
        label: 'Go to Line...',
        keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyG],
        run: (ed) => {
          ed.getAction('editor.action.gotoLine')?.run();
        },
      });
      if (gotoLineAction) disp.push({ dispose: () => gotoLineAction.dispose?.() });
    } catch (e) { /* ignore */ }

    // Quick Open (Ctrl+P) - opens command palette
    try {
      const quickOpenAction = editor.addAction({
        id: 'quick-open',
        label: 'Quick Open',
        keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyP],
        run: () => {
          useWorkspace.getState().toggleCommandPalette();
        },
      });
      if (quickOpenAction) disp.push({ dispose: () => quickOpenAction.dispose?.() });
    } catch (e) { /* ignore */ }

    // Go to Symbol in File (Ctrl+Shift+O)
    try {
      const goToSymbolAction = editor.addAction({
        id: 'actions.goToSymbol',
        label: 'Go to Symbol in File...',
        keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KeyO],
        run: (ed) => {
          ed.getAction('editor.action.quickOutline')?.run();
        },
      });
      if (goToSymbolAction) disp.push({ dispose: () => goToSymbolAction.dispose?.() });
    } catch (e) { /* ignore */ }

    // Rename Symbol (F2)
    try {
      const renameAction = editor.addAction({
        id: 'actions.renameSymbol',
        label: 'Rename Symbol',
        keybindings: [monaco.KeyCode.F2],
        run: (ed) => {
          ed.getAction('editor.action.rename')?.run();
        },
      });
      if (renameAction) disp.push({ dispose: () => renameAction.dispose?.() });
    } catch (e) { /* ignore */ }

    // Go to Definition (F12)
    try {
      const gotoDefAction = editor.addAction({
        id: 'actions.goToDefinition',
        label: 'Go to Definition',
        keybindings: [monaco.KeyCode.F12],
        run: (ed) => {
          ed.getAction('editor.action.goToDeclaration')?.run();
        },
      });
      if (gotoDefAction) disp.push({ dispose: () => gotoDefAction.dispose?.() });
    } catch (e) { /* ignore */ }

    // Peek Definition (Alt+F12)
    try {
      const peekDefAction = editor.addAction({
        id: 'actions.peekDefinition',
        label: 'Peek Definition',
        keybindings: [monaco.KeyMod.Alt | monaco.KeyCode.F12],
        run: (ed) => {
          ed.getAction('editor.action.peekImplementation')?.run();
        },
      });
      if (peekDefAction) disp.push({ dispose: () => peekDefAction.dispose?.() });
    } catch (e) { /* ignore */ }

    // Find All References (Shift+F12)
    try {
      const findRefsAction = editor.addAction({
        id: 'actions.findAllReferences',
        label: 'Find All References',
        keybindings: [monaco.KeyMod.Shift | monaco.KeyCode.F12],
        run: (ed) => {
          ed.getAction('editor.action.referenceSearch.trigger')?.run();
        },
      });
      if (findRefsAction) disp.push({ dispose: () => findRefsAction.dispose?.() });
    } catch (e) { /* ignore */ }

    // Format Document (Shift+Alt+F)
    try {
      const formatDocAction = editor.addAction({
        id: 'actions.formatDocument',
        label: 'Format Document',
        keybindings: [monaco.KeyMod.Shift | monaco.KeyMod.Alt | monaco.KeyCode.KeyF],
        run: (ed) => {
          ed.getAction('editor.action.formatDocument')?.execute();
        },
      });
      if (formatDocAction) disp.push({ dispose: () => formatDocAction.dispose?.() });
    } catch (e) { /* ignore */ }

    // Format Selection (Ctrl+K Ctrl+F)
    try {
      const formatSelAction = editor.addAction({
        id: 'actions.formatSelection',
        label: 'Format Selection',
        keybindings: [
          monaco.KeyMod.chord(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyK, monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyF),
        ],
        run: (ed) => {
          ed.getAction('editor.action.formatSelection')?.execute();
        },
      });
      if (formatSelAction) disp.push({ dispose: () => formatSelAction.dispose?.() });
    } catch (e) { /* ignore */ }

    // Toggle Comment (Ctrl+/)
    try {
      const toggleCommentAction = editor.addAction({
        id: 'actions.toggleComment',
        label: 'Toggle Line Comment',
        keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.Slash],
        run: (ed) => {
          ed.getAction('editor.action.commentLine')?.run();
        },
      });
      if (toggleCommentAction) disp.push({ dispose: () => toggleCommentAction.dispose?.() });
    } catch (e) { /* ignore */ }

    // Indent / Outdent
    try {
      const indentAction = editor.addAction({
        id: 'actions.indent',
        label: 'Indent',
        keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.BracketRight],
        run: (ed) => {
          ed.getAction('editor.action.indentLines')?.run();
        },
      });
      if (indentAction) disp.push({ dispose: () => indentAction.dispose?.() });
    } catch (e) { /* ignore */ }

    try {
      const outdentAction = editor.addAction({
        id: 'actions.outdent',
        label: 'Outdent',
        keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.BracketLeft],
        run: (ed) => {
          ed.getAction('editor.action.outdentLines')?.run();
        },
      });
      if (outdentAction) disp.push({ dispose: () => outdentAction.dispose?.() });
    } catch (e) { /* ignore */ }

    // Select Next Occurrence (Ctrl+D)
    try {
      const selectNextAction = editor.addAction({
        id: 'actions.selectNextOccurrence',
        label: 'Add Selection to Next Find Match',
        keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyD],
        run: (ed) => {
          ed.getAction('editor.action.addSelectionToNextFindMatch')?.run();
        },
      });
      if (selectNextAction) disp.push({ dispose: () => selectNextAction.dispose?.() });
    } catch (e) { /* ignore */ }

    // Move Line Up/Down (Alt+Up/Down)
    try {
      const moveUpAction = editor.addAction({
        id: 'actions.moveLineUp',
        label: 'Move Line Up',
        keybindings: [monaco.KeyMod.Alt | monaco.KeyCode.UpArrow],
        run: (ed) => {
          ed.getAction('editor.action.moveLinesUpAction')?.run();
        },
      });
      if (moveUpAction) disp.push({ dispose: () => moveUpAction.dispose?.() });
    } catch (e) { /* ignore */ }

    try {
      const moveDownAction = editor.addAction({
        id: 'actions.moveLineDown',
        label: 'Move Line Down',
        keybindings: [monaco.KeyMod.Alt | monaco.KeyCode.DownArrow],
        run: (ed) => {
          ed.getAction('editor.action.moveLinesDownAction')?.run();
        },
      });
      if (moveDownAction) disp.push({ dispose: () => moveDownAction.dispose?.() });
    } catch (e) { /* ignore */ }

    // Copy Line Up/Down (Shift+Alt+Up/Down)
    try {
      const copyUpAction = editor.addAction({
        id: 'actions.copyLineUp',
        label: 'Copy Line Up',
        keybindings: [monaco.KeyMod.Shift | monaco.KeyMod.Alt | monaco.KeyCode.UpArrow],
        run: (ed) => {
          ed.getAction('editor.action.copyLinesUpAction')?.run();
        },
      });
      if (copyUpAction) disp.push({ dispose: () => copyUpAction.dispose?.() });
    } catch (e) { /* ignore */ }

    try {
      const copyDownAction = editor.addAction({
        id: 'actions.copyLineDown',
        label: 'Copy Line Down',
        keybindings: [monaco.KeyMod.Shift | monaco.KeyMod.Alt | monaco.KeyCode.DownArrow],
        run: (ed) => {
          ed.getAction('editor.action.copyLinesDownAction')?.run();
        },
      });
      if (copyDownAction) disp.push({ dispose: () => copyDownAction.dispose?.() });
    } catch (e) { /* ignore */ }

    // ═══════════════════════════════════════════════════════════
    //  Additional VS Code-style shortcuts
    // ═══════════════════════════════════════════════════════════

    // Select All Occurrences (Ctrl+Shift+L)
    try {
      const selAllOccurrencesAction = editor.addAction({
        id: 'actions.selectAllOccurrences',
        label: 'Select All Occurrences of Find Match',
        keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KeyL],
        run: (ed) => {
          ed.getAction('editor.action.selectHighlights')?.run();
        },
      });
      if (selAllOccurrencesAction) disp.push({ dispose: () => selAllOccurrencesAction.dispose?.() });
    } catch (e) { /* ignore */ }

    // Cursor Undo — go back to previous cursor position (Ctrl+U)
    try {
      const cursorUndoAction = editor.addAction({
        id: 'actions.cursorUndo',
        label: 'Undo Cursor Position',
        keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyU],
        run: (ed) => {
          ed.getAction('cursorUndo')?.run();
        },
      });
      if (cursorUndoAction) disp.push({ dispose: () => cursorUndoAction.dispose?.() });
    } catch (e) { /* ignore */ }

    // Delete Line (Ctrl+Shift+K)
    try {
      const deleteLineAction = editor.addAction({
        id: 'actions.deleteLine',
        label: 'Delete Line',
        keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KeyK],
        run: (ed) => {
          ed.getAction('editor.action.deleteLines')?.run();
        },
      });
      if (deleteLineAction) disp.push({ dispose: () => deleteLineAction.dispose?.() });
    } catch (e) { /* ignore */ }

    // Insert Line Below (Ctrl+Enter)
    try {
      const insertLineBelowAction = editor.addAction({
        id: 'actions.insertLineBelow',
        label: 'Insert Line Below',
        keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter],
        run: (ed) => {
          ed.getAction('editor.action.insertLineAfter')?.run();
        },
      });
      if (insertLineBelowAction) disp.push({ dispose: () => insertLineBelowAction.dispose?.() });
    } catch (e) { /* ignore */ }

    // Insert Line Above (Ctrl+Shift+Enter)
    try {
      const insertLineAboveAction = editor.addAction({
        id: 'actions.insertLineAbove',
        label: 'Insert Line Above',
        keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.Enter],
        run: (ed) => {
          ed.getAction('editor.action.insertLineBefore')?.run();
        },
      });
      if (insertLineAboveAction) disp.push({ dispose: () => insertLineAboveAction.dispose?.() });
    } catch (e) { /* ignore */ }

    // Jump to Matching Bracket (Ctrl+Shift+\)
    try {
      const jumpToBracketAction = editor.addAction({
        id: 'actions.jumpToBracket',
        label: 'Go to Bracket',
        keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.Backslash],
        run: (ed) => {
          ed.getAction('editor.action.jumpToBracket')?.run();
        },
      });
      if (jumpToBracketAction) disp.push({ dispose: () => jumpToBracketAction.dispose?.() });
    } catch (e) { /* ignore */ }

    // Fold / Collapse (Ctrl+Shift+[)
    try {
      const foldAction = editor.addAction({
        id: 'actions.fold',
        label: 'Fold',
        keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.BracketLeft],
        run: (ed) => {
          ed.getAction('editor.action.fold')?.run();
        },
      });
      if (foldAction) disp.push({ dispose: () => foldAction.dispose?.() });
    } catch (e) { /* ignore */ }

    // Unfold / Expand (Ctrl+Shift+])
    try {
      const unfoldAction = editor.addAction({
        id: 'actions.unfold',
        label: 'Unfold',
        keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.BracketRight],
        run: (ed) => {
          ed.getAction('editor.action.unfold')?.run();
        },
      });
      if (unfoldAction) disp.push({ dispose: () => unfoldAction.dispose?.() });
    } catch (e) { /* ignore */ }

    // Toggle Word Wrap (Alt+Z)
    try {
      const toggleWordWrapAction = editor.addAction({
        id: 'actions.toggleWordWrap',
        label: 'Toggle Word Wrap',
        keybindings: [monaco.KeyMod.Alt | monaco.KeyCode.KeyZ],
        run: (ed) => {
          ed.getAction('editor.action.toggleWordWrap')?.run();
        },
      });
      if (toggleWordWrapAction) disp.push({ dispose: () => toggleWordWrapAction.dispose?.() });
    } catch (e) { /* ignore */ }

    // Change All Occurrences (Ctrl+F2)
    try {
      const changeAllAction = editor.addAction({
        id: 'actions.changeAll',
        label: 'Change All Occurrences',
        keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.F2],
        run: (ed) => {
          ed.getAction('editor.action.changeAll')?.run();
        },
      });
      if (changeAllAction) disp.push({ dispose: () => changeAllAction.dispose?.() });
    } catch (e) { /* ignore */ }

    // ═══════════════════════════════════════════════════════════
    //  Run / Debug shortcuts (F-keys)
    // ═══════════════════════════════════════════════════════════

    // Run (Ctrl+F5) — execute current file
    try {
      const runAction = editor.addAction({
        id: 'run-code',
        label: 'Run Code',
        keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.F5],
        run: () => {
          window.dispatchEvent(new CustomEvent('editor:action', { detail: { action: 'runCode' } }));
        },
      });
      if (runAction) disp.push({ dispose: () => runAction.dispose?.() });
    } catch (e) { /* ignore */ }

    // Start Debugging / Continue (F5)
    try {
      const startDebugAction = editor.addAction({
        id: 'start-debugging',
        label: 'Start Debugging',
        keybindings: [monaco.KeyCode.F5],
        run: () => {
          const state = useWorkspace.getState();
          if (state.debugState === 'paused') {
            window.dispatchEvent(new CustomEvent('editor:action', { detail: { action: 'continueExecution' } }));
          } else {
            window.dispatchEvent(new CustomEvent('editor:action', { detail: { action: 'startDebugging' } }));
          }
        },
      });
      if (startDebugAction) disp.push({ dispose: () => startDebugAction.dispose?.() });
    } catch (e) { /* ignore */ }

    // Stop Debugging (Shift+F5)
    try {
      const stopDebugAction = editor.addAction({
        id: 'stop-debugging',
        label: 'Stop Debugging',
        keybindings: [monaco.KeyMod.Shift | monaco.KeyCode.F5],
        run: () => {
          window.dispatchEvent(new CustomEvent('editor:action', { detail: { action: 'stopDebugging' } }));
        },
      });
      if (stopDebugAction) disp.push({ dispose: () => stopDebugAction.dispose?.() });
    } catch (e) { /* ignore */ }

    // Restart Debugging (Ctrl+Shift+F5)
    try {
      const restartDebugAction = editor.addAction({
        id: 'restart-debugging',
        label: 'Restart Debugging',
        keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.F5],
        run: () => {
          window.dispatchEvent(new CustomEvent('editor:action', { detail: { action: 'restartDebugging' } }));
        },
      });
      if (restartDebugAction) disp.push({ dispose: () => restartDebugAction.dispose?.() });
    } catch (e) { /* ignore */ }

    // Step Over (F10)
    try {
      const stepOverAction = editor.addAction({
        id: 'step-over',
        label: 'Step Over',
        keybindings: [monaco.KeyCode.F10],
        run: () => {
          window.dispatchEvent(new CustomEvent('editor:action', { detail: { action: 'stepOver' } }));
        },
      });
      if (stepOverAction) disp.push({ dispose: () => stepOverAction.dispose?.() });
    } catch (e) { /* ignore */ }

    // Step Into (F11)
    try {
      const stepIntoAction = editor.addAction({
        id: 'step-into',
        label: 'Step Into',
        keybindings: [monaco.KeyCode.F11],
        run: () => {
          window.dispatchEvent(new CustomEvent('editor:action', { detail: { action: 'stepInto' } }));
        },
      });
      if (stepIntoAction) disp.push({ dispose: () => stepIntoAction.dispose?.() });
    } catch (e) { /* ignore */ }

    // Step Out (Shift+F11)
    try {
      const stepOutAction = editor.addAction({
        id: 'step-out',
        label: 'Step Out',
        keybindings: [monaco.KeyMod.Shift | monaco.KeyCode.F11],
        run: () => {
          window.dispatchEvent(new CustomEvent('editor:action', { detail: { action: 'stepOut' } }));
        },
      });
      if (stepOutAction) disp.push({ dispose: () => stepOutAction.dispose?.() });
    } catch (e) { /* ignore */ }

    // Toggle Breakpoint (F9)
    try {
      const toggleBpAction = editor.addAction({
        id: 'toggle-breakpoint',
        label: 'Toggle Breakpoint',
        keybindings: [monaco.KeyCode.F9],
        run: () => {
          window.dispatchEvent(new CustomEvent('editor:action', { detail: { action: 'toggleBreakpoint' } }));
        },
      });
      if (toggleBpAction) disp.push({ dispose: () => toggleBpAction.dispose?.() });
    } catch (e) { /* ignore */ }

    // ── Collect problems from editor markers ──
    const updateProblems = () => {
      try {
        const markers = monaco.editor.getModelMarkers({});
        if (markers.length > 0) {
          const currentGroup = useWorkspace.getState().getGroupById(groupId);
          const problems = markers.map((m) => ({
            line: m.startLineNumber,
            column: m.startColumn,
            message: m.message,
            severity: m.severity === monaco.MarkerSeverity.Error ? 'error'
              : m.severity === monaco.MarkerSeverity.Warning ? 'warning'
              : 'info',
            fileId: currentGroup?.activeFile?.id,
            fileName: currentGroup?.activeFile?.name || 'unknown',
          }));
          setProblems(problems);
        } else {
          setProblems([]);
        }
      } catch (e) { /* ignore */ }
    };

    disp.push(
      monaco.editor.onDidChangeMarkers(() => {
        updateProblems();
      })
    );

    disp.push(
      editor.onDidDispose(() => {
        disposablesRef.current.forEach((d) => d?.dispose());
        disposablesRef.current = [];
        // Clean up injected cursor styles
        if (styleCleanupRef.current) {
          styleCleanupRef.current();
          styleCleanupRef.current = null;
        }
      })
    );

    // ── Listen for editor:action custom events from MenuBar ──
    const handleEditorAction = (e) => {
      const action = e.detail?.action;
      const ed = editorRef.current;
      if (!ed) return;

      // Ensure editor has focus so clipboard/selection actions work
      ed.focus();

      switch (action) {
        case 'undo':
          ed.trigger('menu', 'undo', null);
          break;
        case 'redo':
          ed.trigger('menu', 'redo', null);
          break;
        case 'cut':
          document.execCommand('cut');
          break;
        case 'copy':
          document.execCommand('copy');
          break;
        case 'paste':
          ed.trigger('menu', 'editor.action.clipboardPasteAction', null);
          break;
        case 'selectAll':
          ed.trigger('menu', 'editor.action.selectAll', null);
          break;
        case 'toggleLineComment':
          ed.getAction('editor.action.commentLine')?.run();
          break;
        case 'toggleBlockComment':
          ed.getAction('editor.action.blockComment')?.run();
          break;
        case 'formatDocument':
          ed.getAction('editor.action.formatDocument')?.execute();
          break;
        case 'formatSelection':
          ed.getAction('editor.action.formatSelection')?.execute();
          break;
        case 'indent':
          ed.getAction('editor.action.indentLines')?.run();
          break;
        case 'outdent':
          ed.getAction('editor.action.outdentLines')?.run();
          break;
        case 'toggleWordWrap':
          ed.getAction('editor.action.toggleWordWrap')?.run();
          break;
        case 'find':
          ed.getAction('actions.find')?.run();
          break;
        case 'replace':
          ed.getAction('editor.action.startFindReplaceAction')?.run();
          break;
        case 'go-to-line':
          ed.getAction('editor.action.gotoLine')?.run();
          break;
        case 'cursorUndo':
          ed.getAction('cursorUndo')?.run();
          break;
        case 'cursorRedo':
          ed.getAction('cursorRedo')?.run();
          break;
        case 'runCode':
          useWorkspace.getState().runCode();
          break;
        case 'startDebugging':
          useWorkspace.getState().startDebugging();
          break;
        case 'stopDebugging':
          useWorkspace.getState().stopDebugging();
          break;
        case 'restartDebugging':
          useWorkspace.getState().stopDebugging();
          setTimeout(() => useWorkspace.getState().startDebugging(), 100);
          break;
        case 'continueExecution':
          useWorkspace.getState().continueExecution();
          break;
        case 'stepOver':
          useWorkspace.getState().stepOver();
          break;
        case 'stepInto':
          useWorkspace.getState().stepInto();
          break;
        case 'stepOut':
          useWorkspace.getState().stepOut();
          break;
        case 'toggleBreakpoint': {
          const { activeFile, breakpoints, addBreakpoint, removeBreakpoint } = useWorkspace.getState();
          const activeLine = window.__editorCursorLine || 1;
          const existing = breakpoints.find(
            (b) => b.fileId === activeFile?.id && b.line === activeLine
          );
          if (existing) removeBreakpoint(activeLine);
          else addBreakpoint(activeLine);
          break;
        }
        case 'toggleStickyScroll': {
          const state = useWorkspace.getState();
          ed.updateOptions({ stickyScroll: { enabled: state.settings.stickyScroll } });
          break;
        }
        case 'toggleRenderWhitespace': {
          const value = e.detail?.value || 'selection';
          ed.updateOptions({ renderWhitespace: value });
          break;
        }
        case 'goToDefinition':
          ed.getAction('editor.action.goToDeclaration')?.run();
          break;
        case 'goToTypeDefinition':
          ed.getAction('editor.action.goToTypeDefinition')?.run();
          break;
        case 'goToImplementation':
          ed.getAction('editor.action.goToImplementation')?.run();
          break;
        case 'goToReferences':
          ed.getAction('editor.action.referenceSearch.trigger')?.run();
          break;
        case 'peekDefinition':
          ed.getAction('editor.action.peekDefinition')?.run();
          break;
        case 'peekTypeDefinition':
          ed.getAction('editor.action.peekTypeDefinition')?.run();
          break;
        case 'peekImplementation':
          ed.getAction('editor.action.peekImplementation')?.run();
          break;
        case 'peekReferences':
          ed.getAction('editor.action.referenceSearch.trigger')?.run();
          break;
        case 'goToBracket':
          ed.getAction('editor.action.jumpToBracket')?.run();
          break;
        case 'nextProblem':
          ed.getAction('editor.action.marker.next')?.run();
          break;
        case 'previousProblem':
          ed.getAction('editor.action.marker.prev')?.run();
          break;
        case 'goToLastEditLocation':
          ed.getAction('cursorUndo')?.run();
          break;
        case 'runSelectedText': {
          const selection = ed.getModel()?.getValueInRange(ed.getSelection());
          if (selection && selection.trim()) {
            const socket = getSocket();
            const termId = useTerminal.getState().activeTerminalId;
            if (socket?.connected && termId) {
              socket.emit('terminal-input', { terminalId: termId, data: selection + '\n' });
            }
          }
          break;
        }
      }
    };
    window.addEventListener('editor:action', handleEditorAction);
    disp.push({ dispose: () => window.removeEventListener('editor:action', handleEditorAction) });

    // ── Track cursor position & broadcast via awareness ──
    disp.push(
      editor.onDidChangeCursorPosition((e) => {
        window.__editorCursorLine = e.position.lineNumber;
        setLocalCursor({ lineNumber: e.position.lineNumber, column: e.position.column });
      })
    );

    // ── Track typing activity — fires on any content change ──
    disp.push(
      editor.onDidChangeModelContent(() => {
        setTyping();
      })
    );

    // ── Subscribe to remote cursor changes and render decorations ──
    const unsubAwareness = onAwarenessChange((state) => {
      const ed = editorRef.current;
      if (!ed || !monacoRef.current) return;

      const monaco = monacoRef.current;
      const model = ed.getModel();
      if (!model) return;

      // Inject/update dynamic cursor styles once
      let styleEl = document.getElementById('remote-cursor-styles');
      if (!styleEl) {
        styleEl = document.createElement('style');
        styleEl.id = 'remote-cursor-styles';
        document.head.appendChild(styleEl);
        // Store cleanup reference
        styleCleanupRef.current = () => {
          const el = document.getElementById('remote-cursor-styles');
          if (el) el.remove();
        };
      }

      // Build CSS and decorations
      let cursorStyles = '';
      const newDecorations = [];

      for (const peer of state.peers) {
        const cursor = peer.cursor;
        if (!cursor) continue;

        const { lineNumber, column } = cursor;
        const lineCount = model.getLineCount();
        const lineMaxCol = model.getLineMaxColumn(lineNumber);

        // Clamp to valid range
        const validLine = Math.max(1, Math.min(lineNumber, lineCount));
        const validCol = Math.max(1, Math.min(column, lineMaxCol));

        // Safe class name from socketId
        const safeId = (peer.socketId || 'unknown').replace(/[^a-zA-Z0-9-]/g, '');
        const cursorColor = peer.color?.cursor || '#E06C75';

        const beforeCls = `rc-before-${safeId}`;

        // Generate CSS rule for this peer's cursor (using beforeContentClassName)
        cursorStyles += `
          .${beforeCls} { display: inline-block; width: 2px; height: 1.1em; margin: 0; padding: 0; background: ${cursorColor}; position: relative; vertical-align: text-bottom; animation: remote-cursor-blink 1.2s ease-in-out infinite; }
          .${beforeCls}::after { content: '${(peer.user?.name?.[0] || '?').toUpperCase()}'; position: absolute; top: -15px; left: -3px; font-size: 9px; font-weight: 600; color: #fff; background: ${cursorColor}; padding: 0 5px; border-radius: 3px; white-space: nowrap; line-height: 14px; font-family: -apple-system, BlinkMacSystemFont, sans-serif; opacity: 0.95; pointer-events: none; z-index: 10; }
        `;

        // Cursor decoration — beforeContentClassName places the cursor before the text at this position
        newDecorations.push({
          range: new monaco.Range(validLine, validCol, validLine, validCol),
          options: {
            isWholeLine: false,
            beforeContentClassName: beforeCls,
            hoverMessage: { value: `**${peer.user?.name || 'Anonymous'}**` },
          },
        });
      }

      styleEl.textContent = cursorStyles;

      // Apply decorations efficiently
      const oldDecorations = remoteCursorsRef.current;
      remoteCursorsRef.current = ed.deltaDecorations(oldDecorations, newDecorations);
    });

    disp.push({ dispose: unsubAwareness });

    setTimeout(updateProblems, 1000);
  }, [setProblems, groupId]);

  // ═══ Early return after all hooks ═══
  if (!group) return null;

  const isActive = groupId === activeGroupId;

  // Determine language from file extension
  const getLanguage = () => {
    if (!group.activeFile?.name) return 'plaintext';
    const ext = group.activeFile.name.split('.').pop()?.toLowerCase();
    const langMap = {
      js: 'javascript', jsx: 'javascript', ts: 'typescript', tsx: 'typescript',
      json: 'json', html: 'html', css: 'css', scss: 'scss', md: 'markdown',
      py: 'python', rb: 'ruby', go: 'go', rs: 'rust', java: 'java',
      cpp: 'cpp', c: 'c', h: 'c', hpp: 'cpp', cs: 'csharp',
      php: 'php', swift: 'swift', kt: 'kotlin',
      yml: 'yaml', yaml: 'yaml', xml: 'xml', sql: 'sql',
      sh: 'shell', bash: 'shell', zsh: 'shell',
      txt: 'plaintext', gitignore: 'plaintext', env: 'plaintext',
    };
    return langMap[ext] || 'plaintext';
  };

  const language = getLanguage();

  // Show loading state while fetching content
  if (loadingContent) {
    return (
      <div className="h-full w-full flex items-center justify-center" style={{ background: '#121214' }}>
        <div className="text-center">
          <Loader2 size={20} className="animate-spin text-[rgba(255,255,255,0.3)] mx-auto mb-3" />
          <p className="text-xs text-[rgba(255,255,255,0.25)]">Opening file…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full flex flex-col relative">
      {/* Save indicator */}
      {saveStatus !== 'idle' && (
        <div className={`absolute top-2 right-3 z-10 flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium transition-opacity ${
          saveStatus === 'saving' ? 'bg-[rgba(255,255,255,0.08)] text-[rgba(255,255,255,0.5)]' :
          saveStatus === 'saved' ? 'bg-[rgba(48,209,88,0.15)] text-[#4ade80]' :
          'bg-[rgba(248,113,113,0.15)] text-[#f87171]'
        }`}>
          {saveStatus === 'saving' && <Loader2 size={10} className="animate-spin" />}
          {saveStatus === 'saving' ? 'Saving…' :
           saveStatus === 'saved' ? 'Saved' : 'Save failed'}
        </div>
      )}

      <Editor
        height="100%"
        language={language}
        value={content}
        onChange={handleEditorChange}
        onMount={handleEditorMount}
        loading={
          <div className="h-full w-full flex items-center justify-center" style={{ background: '#121214' }}>
            <div className="text-center">
              <div className="w-6 h-6 rounded-full border-2 border-[rgba(255,255,255,0.06)] border-t-[rgba(255,255,255,0.4)] animate-spin mx-auto mb-3" />
              <p className="text-xs text-[rgba(255,255,255,0.25)]">Loading editor…</p>
            </div>
          </div>
        }
        options={{
          fontSize: settings.fontSize,
          fontFamily: settings.fontFamily,
          tabSize: settings.tabSize,
          wordWrap: settings.wordWrap,
          minimap: {
            enabled: settings.minimap,
            size: 'fit',
            showSlider: 'mouseover',
          },
          lineNumbers: settings.lineNumbers ? 'on' : 'off',
          fontLigatures: true,
          fontSmoothing: 'antialiased',
          automaticLayout: true,
          padding: { top: 16, bottom: 16 },
          lineHeight: 1.6,
          smoothScrolling: true,
          cursorBlinking: 'phase',
          cursorSmoothCaretAnimation: 'on',
          bracketPairColorization: {
            enabled: true,
            independentColorPoolPerBracketType: true,
          },
          guides: { bracketPairs: true, indentation: true },
          inlineSuggest: { enabled: true },
          formatOnPaste: true,
          formatOnType: true,
          insertSpaces: true,
          renderWhitespace: settings.renderWhitespace,
          scrollBeyondLastLine: false,
          scrollbar: {
            verticalScrollbarSize: 8,
            horizontalScrollbarSize: 8,
            useShadows: false,
            alwaysConsumeMouseWheel: false,
          },
          overviewRulerBorder: false,
          hideCursorInOverviewRuler: true,
          selectionHighlight: true,
          occurrencesHighlight: 'singleFile',
          renderLineHighlight: 'all',
          renderLineHighlightOnlyWhenFocus: true,
          folding: true,
          foldingHighlight: true,
          foldingStrategy: 'indentation',
          showFoldingControls: 'always',
          matchBrackets: 'always',
          multiCursorModifier: 'alt',
          multiCursorMergeOverlapping: true,
          suggestOnTriggerCharacters: true,
          quickSuggestions: true,
          parameterHints: { enabled: true },
          autoClosingBrackets: 'always',
          autoClosingQuotes: 'always',
          autoIndent: 'full',
          renameOnType: true,
          // VS Code extras
          codeLens: true,
          colorDecorators: true,
          inlineHints: {
            enabled: true,
            fontSize: 11,
          },
          linkedEditing: true,
          gotoLocation: {
            multiple: 'goto',
            multipleDefinitions: 'goto',
            multipleTypeDefinitions: 'goto',
          },
          selectionClipboard: true,
          experimentalWhitespaceRendering: 'svg',
          stickyScroll: {
            enabled: settings.stickyScroll,
            maxLineCount: 5,
          },
          dropIntoEditor: {
            enabled: true,
          },
          emptySelectionClipboard: true,
          copyWithSyntaxHighlighting: true,
        }}
      />
    </div>
  );
}
