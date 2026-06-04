import React, { useRef, useCallback, useState } from 'react';
import { motion } from 'framer-motion';
import { GitBranch, ArrowUpDown } from 'lucide-react';
import { useWorkspace } from '../../stores/useWorkspace';

// Simplified file icon map used in diff header
function getFileExt(name) {
  return name?.split('.').pop()?.toLowerCase() || '';
}

export default function DiffEditor({ originalContent, modifiedContent, language, originalLabel, modifiedLabel }) {
  const { settings } = useWorkspace();

  const handleEditorMount = useCallback((editor, monaco) => {
    try {
      monaco.editor.defineTheme('diff-nexus', {
        base: 'vs-dark',
        inherit: true,
        rules: [],
        colors: {
          'editor.background': '#000000',
          'editor.foreground': '#C9D1D9',
          'diffEditor.insertedTextBackground': '#23863620',
          'diffEditor.removedTextBackground': '#DA363320',
          'diffEditor.insertedLineBackground': '#23863610',
          'diffEditor.removedLineBackground': '#DA363310',
          'diffEditorGutter.insertedLineBackground': '#23863630',
          'diffEditorGutter.removedLineBackground': '#DA363330',
          'scrollbarSlider.background': '#6E768133',
          'scrollbarSlider.hoverBackground': '#6E768166',
          'scrollbarSlider.activeBackground': '#6E768199',
        },
      });
      monaco.editor.setTheme('diff-nexus');
    } catch (e) {
      console.warn('Failed to set diff theme:', e);
    }
  }, []);

  return (
    <div className="h-full w-full flex flex-col bg-[#000000]">
      {/* Diff Info Bar */}
      <div className="flex items-center gap-3 px-3 py-1.5 border-b border-[rgba(255,255,255,0.04)] bg-[rgba(16,16,18,0.4)] text-[11px]">
        <div className="flex items-center gap-1.5 text-[rgba(255,255,255,0.4)]">
          <GitBranch size={12} />
          <span className="text-[rgba(255,255,255,0.3)]">Diff</span>
        </div>
        <div className="flex items-center gap-2 ml-auto">
          <span className="px-1.5 py-0.5 rounded bg-[rgba(35,134,54,0.15)] text-[#4ade80] text-[10px] font-medium">
            + Added
          </span>
          <span className="px-1.5 py-0.5 rounded bg-[rgba(218,54,51,0.15)] text-[#f87171] text-[10px] font-medium">
            - Removed
          </span>
        </div>
      </div>

      {/* Monaco Diff Editor Placeholder */}
      {originalContent !== undefined && modifiedContent !== undefined ? (
        <div className="flex-1">
          <MonacoDiff
            original={originalContent}
            modified={modifiedContent}
            language={language || 'plaintext'}
            theme="diff-nexus"
            options={{
              fontSize: settings.fontSize || 14,
              fontFamily: settings.fontFamily,
              readOnly: true,
              renderSideBySide: true,
              enableSplitViewResizing: false,
              automaticLayout: true,
              minimap: { enabled: false },
              scrollBeyondLastLine: false,
              lineNumbers: 'on',
              renderIndicators: true,
              renderOverviewRuler: true,
              ignoreTrimWhitespace: true,
            }}
            onMount={handleEditorMount}
          />
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <ArrowUpDown size={24} className="text-[rgba(255,255,255,0.1)] mx-auto mb-2" />
            <p className="text-[12px] text-[rgba(255,255,255,0.3)]">No changes to compare</p>
          </div>
        </div>
      )}
    </div>
  );
}

// Lazy wrapper to avoid import issues
function MonacoDiff(props) {
  const DiffEditor = React.lazy(() =>
    import('@monaco-editor/react').then((mod) => ({ default: mod.DiffEditor }))
  );

  return (
    <React.Suspense
      fallback={
        <div className="h-full w-full flex items-center justify-center">
          <div className="w-5 h-5 rounded-full border-2 border-[rgba(255,255,255,0.1)] border-t-[#b89450] animate-spin" />
        </div>
      }
    >
      <DiffEditor {...props} />
    </React.Suspense>
  );
}
