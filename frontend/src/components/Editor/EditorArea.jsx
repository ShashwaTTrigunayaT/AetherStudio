import React, { useState, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useWorkspace } from '../../stores/useWorkspace';
import EditorGroup from './EditorGroup';

function getSplitDirection(layout, depth = 0) {
  if (layout && layout.direction) return layout.direction;
  return depth % 2 === 0 ? 'horizontal' : 'vertical';
}

/**
 * Renders the split layout tree using plain CSS flexbox.
 * Each SplitContainer uses flex-direction to stack children
 * either horizontally (row) or vertically (column).
 */
function renderLayout(layout, editorGroups, depth = 0, sizes = null) {
  if (!layout) return null;

  if (layout.type === 'group') {
    const group = editorGroups.find((g) => g.id === layout.id);
    if (!group) return null;
    return (
      <div key={group.id} className="w-full flex-1 flex flex-col relative overflow-hidden">
        <EditorGroup groupId={group.id} />
      </div>
    );
  }

  if (layout.type === 'split') {
    const dir = getSplitDirection(layout, depth);
    const isHorizontal = dir === 'horizontal';
    const childSizes = sizes || layout.sizes;

    return (
      <SplitContainer
        key={`split-${depth}`}
        direction={dir}
        layout={layout}
        editorGroups={editorGroups}
        depth={depth}
        childSizes={childSizes}
      >
        {layout.children.map((child, idx) => (
          <SplitPane
            key={idx}
            index={idx}
            count={layout.children.length}
            direction={dir}
            defaultSize={childSizes?.[idx] || (100 / layout.children.length)}
          >
            {renderLayout(child, editorGroups, depth + 1, null)}
          </SplitPane>
        ))}
      </SplitContainer>
    );
  }

  return null;
}

/**
 * A flex container that stacks children either horizontally or vertically.
 * Stores sizes in a ref to persist across re-renders for the same layout node.
 */
function SplitContainer({ direction, layout, editorGroups, depth, childSizes, children }) {
  const isHorizontal = direction === 'horizontal';
  const containerRef = useRef(null);
  const sizesRef = useRef(childSizes ? [...childSizes] : null);
  const draggingRef = useRef(null);

  const handleMouseDown = useCallback((e, index) => {
    e.preventDefault();
    const container = containerRef.current;
    if (!container) return;

    const startPos = isHorizontal ? e.clientX : e.clientY;
    const containerSize = isHorizontal ? container.offsetWidth : container.offsetHeight;
    const currentSizes = sizesRef.current;
    if (!currentSizes) return;

    const startSizeLeft = currentSizes[index] || 0;
    const startSizeRight = currentSizes[index + 1] || 0;

    draggingRef.current = { index, startPos, containerSize, startSizeLeft, startSizeRight };

    const onMouseMove = (me) => {
      const drag = draggingRef.current;
      if (!drag) return;

      const currentPos = isHorizontal ? me.clientX : me.clientY;
      const delta = currentPos - drag.startPos;
      const deltaPercent = (delta / drag.containerSize) * 100;

      let newLeft = Math.max(10, Math.min(90, drag.startSizeLeft + deltaPercent));
      let newRight = Math.max(10, Math.min(90, drag.startSizeRight - deltaPercent));

      // Clamp so total is ~100%
      const total = newLeft + newRight;
      if (total > 0) {
        newLeft = (newLeft / total) * 100;
        newRight = (newRight / total) * 100;
      }

      const newSizes = [...currentSizes];
      newSizes[drag.index] = Math.round(newLeft * 100) / 100;
      newSizes[drag.index + 1] = Math.round(newRight * 100) / 100;
      sizesRef.current = newSizes;

      // Apply sizes directly to DOM for responsive feel
      const panels = container.querySelectorAll('[data-panel-id]');
      panels.forEach((panel, i) => {
        if (i < newSizes.length) {
          if (isHorizontal) {
            panel.style.width = `${newSizes[i]}%`;
          } else {
            panel.style.height = `${newSizes[i]}%`;
          }
        }
      });

      // Force handles to update their positions
      const handles = container.querySelectorAll('[data-resize-handle]');
      handles.forEach((handle) => {
        // handles are between panels, positioned by flexbox
      });
    };

    const onMouseUp = () => {
      draggingRef.current = null;
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    document.body.style.cursor = isHorizontal ? 'col-resize' : 'row-resize';
    document.body.style.userSelect = 'none';
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  }, [isHorizontal]);

  return (
    <div
      ref={containerRef}
      className="flex-1 w-full overflow-hidden flex"
      style={{ flexDirection: isHorizontal ? 'row' : 'column' }}
    >
      {React.Children.map(children, (child, idx) => {
        const isLast = idx === React.Children.count(children) - 1;
        return (
          <>
            {child}
            {!isLast && (
              <ResizeHandle
                index={idx}
                direction={direction}
                onMouseDown={(e) => handleMouseDown(e, idx)}
              />
            )}
          </>
        );
      })}
    </div>
  );
}

function SplitPane({ index, count, direction, defaultSize, children }) {
  const isHorizontal = direction === 'horizontal';
  return (
    <div
      data-panel-id={index}
      className="flex flex-col overflow-hidden relative"
      style={{
        flex: '0 0 auto',
        [isHorizontal ? 'width' : 'height']: `${defaultSize}%`,
        minWidth: isHorizontal ? '30px' : undefined,
        minHeight: !isHorizontal ? '30px' : undefined,
      }}
    >
      {children}
    </div>
  );
}

function ResizeHandle({ index, direction, onMouseDown }) {
  const [isHovered, setIsHovered] = useState(false);
  const isHorizontal = direction === 'horizontal';

  return (
    <div
      data-resize-handle={index}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onMouseDown={onMouseDown}
      className="relative group flex items-center justify-center flex-shrink-0"
      style={{
        cursor: isHorizontal ? 'col-resize' : 'row-resize',
        [isHorizontal ? 'width' : 'height']: '4px',
        [isHorizontal ? 'height' : 'width']: '100%',
      }}
    >
      <motion.div
        animate={{
          backgroundColor: isHovered ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.03)',
          boxShadow: isHovered ? '0 0 8px rgba(255,255,255,0.1)' : 'none',
        }}
        transition={{ duration: 0.2 }}
        className="rounded-full relative"
        style={{
          [isHorizontal ? 'width' : 'height']: '4px',
          [isHorizontal ? 'height' : 'width']: '100%',
        }}
      />
    </div>
  );
}

export default function EditorArea() {
  const { editorLayout, editorGroups } = useWorkspace();

  return (
    <div className="flex-1 w-full flex flex-col overflow-hidden">
      {renderLayout(editorLayout, editorGroups)}
    </div>
  );
}
