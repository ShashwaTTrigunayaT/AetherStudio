import React, { useState } from 'react';
import { Group as PanelGroup, Panel, Separator as PanelResizeHandle } from 'react-resizable-panels';
import { motion } from 'framer-motion';
import { useWorkspace } from '../../stores/useWorkspace';
import EditorGroup from './EditorGroup';

function getSplitDirection(layout, depth = 0) {
  // Alternate direction for nested splits
  if (layout && layout.direction) return layout.direction;
  return depth % 2 === 0 ? 'horizontal' : 'vertical';
}

function ResizeHandle() {
  const [isHovered, setIsHovered] = useState(false);
  return (      <PanelResizeHandle
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="relative group flex items-center justify-center"
      >
        <motion.div
          animate={{
            backgroundColor: isHovered ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.03)',
            boxShadow: isHovered ? '0 0 8px rgba(255,255,255,0.1)' : 'none',
          }}
          transition={{ duration: 0.2 }}
          className="w-[4px] h-full rounded-full relative"
        />
      </PanelResizeHandle>
  );
}

function ResizeHandleHorizontal() {
  const [isHovered, setIsHovered] = useState(false);
  return (
    <PanelResizeHandle
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="relative group flex items-center justify-center"
    >
      <motion.div
        animate={{
          backgroundColor: isHovered ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.03)',
          boxShadow: isHovered ? '0 0 8px rgba(255,255,255,0.1)' : 'none',
        }}
        transition={{ duration: 0.2 }}
        className="h-[4px] w-full rounded-full relative"
      />
    </PanelResizeHandle>
  );
}

function renderLayout(layout, editorGroups, depth = 0) {
  if (!layout) return null;

  if (layout.type === 'group') {
    const group = editorGroups.find((g) => g.id === layout.id);
    if (!group) return null;
    // Height-forcing wrapper so Panel sizing propagates to children
    return (
      <div key={group.id} className="w-full flex-1 flex flex-col relative overflow-hidden">
        <EditorGroup groupId={group.id} />
      </div>
    );
  }

  if (layout.type === 'split') {
    // Alternate direction for nested splits vs automatic
    const dir = getSplitDirection(layout, depth);
    const isHorizontal = dir === 'horizontal';
    return (
      <PanelGroup
        direction={dir}
        className="flex-1"
      >
        {layout.children.map((child, idx) => (
          <React.Fragment key={idx}>
            {idx > 0 && (
              isHorizontal ? <ResizeHandle /> : <ResizeHandleHorizontal />
            )}
            <Panel defaultSize={layout.sizes?.[idx] || (100 / layout.children.length)} minSize={15} className="flex flex-col">
              {renderLayout(child, editorGroups, depth + 1)}
            </Panel>
          </React.Fragment>
        ))}
      </PanelGroup>
    );
  }

  return null;
}

export default function EditorArea() {
  const { editorLayout, editorGroups } = useWorkspace();

  return (
    <div className="flex-1 w-full flex flex-col overflow-hidden">
      {renderLayout(editorLayout, editorGroups)}
    </div>
  );
}
