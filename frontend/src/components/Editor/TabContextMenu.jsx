import React, { useEffect, useRef } from 'react';
import {
  X, XCircle, ArrowRight, ArrowLeft,
  LayoutPanelLeft, LayoutPanelTop, Copy,
} from 'lucide-react';

const menuItems = [
  { id: 'close', label: 'Close', icon: X, shortcut: 'Ctrl+W' },
  { id: 'close-others', label: 'Close Others', icon: XCircle, shortcut: '' },
  { id: 'close-right', label: 'Close to the Right', icon: ArrowRight, shortcut: '' },
  { id: 'close-all', label: 'Close All', icon: ArrowLeft, shortcut: '' },
  { type: 'divider' },
  { id: 'split-right', label: 'Split Right', icon: LayoutPanelLeft, shortcut: '' },
  { id: 'split-down', label: 'Split Down', icon: LayoutPanelTop, shortcut: '' },
  { type: 'divider' },
  { id: 'copy-path', label: 'Copy Path', icon: Copy, shortcut: '' },
];

export default function TabContextMenu({ x, y, onClose, onAction }) {
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        onClose();
      }
    };
    const handleEsc = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleEsc);
    };
  }, [onClose]);

  const adjustedX = Math.min(x, window.innerWidth - 220);
  const adjustedY = Math.min(y, window.innerHeight - 350);

  return (
    <div
      ref={menuRef}
      className="fixed z-[9999] w-[200px] rounded-xl shadow-xl overflow-hidden py-1"
      style={{
        left: adjustedX,
        top: adjustedY,
        background: 'rgba(18,18,22,0.95)',
        backdropFilter: 'blur(16px) saturate(1.4)',
        WebkitBackdropFilter: 'blur(16px) saturate(1.4)',
        border: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      {menuItems.map((item, idx) => {
        if (item.type === 'divider') {
          return (
            <div key={idx} className="h-px bg-[rgba(255,255,255,0.04)] mx-2 my-1" />
          );
        }
        const Icon = item.icon;
        return (
          <button
            key={item.id}
            onClick={() => onAction(item.id)}
            className="w-full flex items-center gap-2.5 px-3 py-1.5 text-[12px] transition-colors"
            style={{ color: 'rgba(255,255,255,0.55)' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(184,148,80,0.06)';
              e.currentTarget.style.color = 'rgba(255,255,255,0.85)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = 'rgba(255,255,255,0.55)';
            }}
          >
            <Icon size={14} className="flex-shrink-0" style={{ opacity: 0.6 }} />
            <span className="flex-1 text-left">{item.label}</span>
            {item.shortcut && (
              <kbd
                className="text-[9px] px-1 py-0.5 rounded font-mono"
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  color: 'rgba(255,255,255,0.2)',
                }}
              >
                {item.shortcut}
              </kbd>
            )}
          </button>
        );
      })}
    </div>
  );
}
