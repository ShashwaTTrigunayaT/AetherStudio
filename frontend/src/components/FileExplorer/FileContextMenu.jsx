import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { File, Folder, Edit3, Trash2 } from 'lucide-react';

const menuItems = [
  { id: 'new-file', label: 'New File', icon: File, shortcut: '' },
  { id: 'new-folder', label: 'New Folder', icon: Folder, shortcut: '' },
  { type: 'divider' },
  { id: 'rename', label: 'Rename', icon: Edit3, shortcut: 'F2' },
  { id: 'delete', label: 'Delete', icon: Trash2, shortcut: 'Delete', destructive: true },
];

export default function FileContextMenu({ x, y, node, onClose, onAction }) {
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
    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleClick);
      document.addEventListener('keydown', handleEsc);
    }, 0);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleEsc);
    };
  }, [onClose]);

  const adjustedX = Math.min(x, window.innerWidth - 220);
  const adjustedY = Math.min(y, window.innerHeight - 280);

  const isFolder = node?.type === 'folder';

  const visibleItems = menuItems.filter((item) => {
    if (item.type === 'divider') return true;
    if ((item.id === 'new-file' || item.id === 'new-folder') && !isFolder) return false;
    return true;
  });

  return (
    <AnimatePresence>
      <motion.div
        ref={menuRef}
        initial={{ opacity: 0, scale: 0.95, y: -4 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: -4 }}
        transition={{ duration: 0.12, ease: [0.25, 0.1, 0.25, 1] }}
        className="fixed z-[9999] w-[210px] overflow-hidden"
        style={{ left: adjustedX, top: adjustedY }}
      >
        {/* Pristine white frosted glass card */}
        <div className="relative rounded-xl bg-white/60 backdrop-blur-3xl border border-white/80 shadow-[0_8px_30px_rgba(0,0,0,0.08)] overflow-hidden">
          {/* Subtle inner shadow */}
          <div className="absolute inset-0 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] pointer-events-none" />

          {/* Menu items */}
          <div className="relative py-1">
            {/* Node name preview */}
            {node && (
              <div className="px-3 py-1.5 mb-0.5">
                <div className="flex items-center gap-2">
                  {node.type === 'folder' ? (
                    <Folder size={12} className="text-[#c8c8d0]" />
                  ) : (
                    <File size={12} className="text-[rgba(100,110,130,0.4)]" />
                  )}
                  <span className="text-[11px] font-medium text-[rgba(100,110,130,0.45)] truncate">
                    {node.name}
                  </span>
                </div>
              </div>
            )}

            {visibleItems.map((item, idx) => {
              if (item.type === 'divider') {
                return (
                  <div
                    key={idx}
                    className="h-px mx-3 my-1 bg-gradient-to-r from-[rgba(0,0,0,0.04)] via-[rgba(0,0,0,0.03)] to-transparent"
                  />
                );
              }
              const Icon = item.icon;
              return (
                <motion.button
                  key={item.id}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => onAction(item.id)}
                  className={`
                    relative w-full flex items-center gap-2.5 px-3 py-[7px] text-[12px] transition-colors duration-75
                    ${item.destructive
                      ? 'text-[#dc2626] hover:text-[#dc2626] hover:bg-[rgba(220,38,38,0.06)]'
                      : 'text-[rgba(60,70,90,0.6)] hover:text-[#c8c8d0] hover:bg-[rgba(200,200,208,0.04)]'
                    }
                    active:scale-[0.98]
                  `}
                >
                  <Icon
                    size={14}
                    className={`flex-shrink-0 transition-colors ${
                      item.destructive ? 'text-[rgba(220,38,38,0.5)]' : 'text-[rgba(100,110,130,0.35)]'
                    }`}
                  />
                  <span className="flex-1 text-left font-medium">{item.label}</span>
                  {item.shortcut && (
                    <kbd className="text-[9px] px-1.5 py-[2px] rounded font-mono bg-[rgba(0,0,0,0.03)] text-[rgba(100,110,130,0.3)] border border-[rgba(0,0,0,0.04)]">
                      {item.shortcut}
                    </kbd>
                  )}
                </motion.button>
              );
            })}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
