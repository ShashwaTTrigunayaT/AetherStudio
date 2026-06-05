import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { File, Folder, Loader2, X } from 'lucide-react';

export default function CreateFileModal({ isOpen, onClose, parentId, onCreate, defaultType }) {
  const [name, setName] = useState('');
  const [type, setType] = useState('file');
  const [creating, setCreating] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setName('');
      setType(defaultType || 'file');
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen, defaultType]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    setCreating(true);
    await onCreate(name.trim(), type, parentId);
    setCreating(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      className="fixed inset-0 z-[9999] flex items-center justify-center"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: -10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: -10 }}
        transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
        className="relative w-[400px] overflow-hidden rounded-xl bg-white/60 backdrop-blur-3xl border border-white/80 shadow-[0_8px_30px_rgba(0,0,0,0.08)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Blue accent bar at top */}
        <div
          className="absolute top-0 left-0 right-0 h-[2px] pointer-events-none"
          style={{
            background: 'linear-gradient(90deg, #c8c8d0, #b0b0bc, #c8c8d0)',
            backgroundSize: '200% 100%',
            boxShadow: '0 0 12px rgba(200,200,208,0.3)',
          }}
        />

        {/* Header */}
        <div className="relative flex items-center justify-between px-4 py-3 border-b border-[rgba(0,0,0,0.04)]">
          <div className="flex items-center gap-2">
            {type === 'file' ? (
              <File size={16} className="text-[#c8c8d0]" />
            ) : (
              <Folder size={16} className="text-[#c8c8d0]" />
            )}
            <span className="text-[14px] font-semibold text-[#1e293b]">
              New {type === 'file' ? 'File' : 'Folder'}
            </span>
          </div>
          <motion.button
            whileHover={{ scale: 1.1, backgroundColor: 'rgba(0,0,0,0.04)' }}
            whileTap={{ scale: 0.9 }}
            onClick={onClose}
            className="p-1 rounded transition-colors"
          >
            <X size={16} className="text-[rgba(100,110,130,0.3)] hover:text-[rgba(60,70,90,0.5)]" />
          </motion.button>
        </div>

        <form onSubmit={handleSubmit} className="relative p-4 space-y-4">
          {/* Type toggle */}
          <div className="flex gap-2">
            <motion.button
              type="button"
              whileHover={type !== 'file' ? { backgroundColor: 'rgba(200,200,208,0.04)' } : undefined}
              whileTap={{ scale: 0.97 }}
              onClick={() => setType('file')}
              className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-[12px] font-medium transition-all ${
                type === 'file'
                  ? 'bg-[rgba(200,200,208,0.06)] text-[#c8c8d0] border border-[rgba(200,200,208,0.2)]'
                  : 'bg-[rgba(0,0,0,0.02)] text-[rgba(100,110,130,0.4)] border border-[rgba(0,0,0,0.06)] hover:border-[rgba(200,200,208,0.12)]'
              }`}
            >
              <File size={14} />
              File
            </motion.button>
            <motion.button
              type="button"
              whileHover={type !== 'folder' ? { backgroundColor: 'rgba(200,200,208,0.04)' } : undefined}
              whileTap={{ scale: 0.97 }}
              onClick={() => setType('folder')}
              className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-[12px] font-medium transition-all ${
                type === 'folder'
                  ? 'bg-[rgba(200,200,208,0.06)] text-[#c8c8d0] border border-[rgba(200,200,208,0.2)]'
                  : 'bg-[rgba(0,0,0,0.02)] text-[rgba(100,110,130,0.4)] border border-[rgba(0,0,0,0.06)] hover:border-[rgba(200,200,208,0.12)]'
              }`}
            >
              <Folder size={14} />
              Folder
            </motion.button>
          </div>

          {/* Name input */}
          <div>
            <label className="block text-[11px] font-semibold text-[rgba(100,110,130,0.4)] uppercase tracking-wider mb-1.5">
              {type === 'file' ? 'File name' : 'Folder name'}
            </label>
            <input
              ref={inputRef}
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={type === 'file' ? 'e.g., index.js, App.tsx' : 'e.g., components'}
              className="w-full bg-[rgba(0,0,0,0.02)] border border-[rgba(0,0,0,0.08)] rounded-lg px-3 py-2 text-[13px] text-[#1e293b] placeholder:text-[rgba(100,110,130,0.25)] focus:outline-none focus:border-[#c8c8d0] focus:shadow-[0_0_0_3px_rgba(200,200,208,0.08)] focus:bg-white transition-all"
              autoFocus
              required
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-1">
            <motion.button
              type="button"
              whileHover={{ backgroundColor: 'rgba(0,0,0,0.03)' }}
              whileTap={{ scale: 0.97 }}
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg text-[12px] font-medium text-[rgba(100,110,130,0.5)] hover:text-[rgba(60,70,90,0.7)] transition-all"
            >
              Cancel
            </motion.button>
            <motion.button
              type="submit"
              disabled={creating || !name.trim()}
              whileHover={creating || !name.trim() ? undefined : {
                backgroundColor: 'rgba(200,200,208,0.1)',
                boxShadow: '0 0 16px rgba(200,200,208,0.25)',
              }}
              whileTap={creating || !name.trim() ? undefined : { scale: 0.97 }}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-white text-[12px] font-semibold transition-all disabled:opacity-30"
              style={{
                background: creating || !name.trim() ? 'rgba(200,200,208,0.08)' : 'linear-gradient(135deg, #c8c8d0, #b0b0bc)',
                boxShadow: creating || !name.trim() ? 'none' : '0 0 12px rgba(200,200,208,0.2)',
              }}
            >
              {creating ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <>
                  {type === 'file' ? <File size={14} /> : <Folder size={14} />}
                  Create {type === 'file' ? 'File' : 'Folder'}
                </>
              )}
            </motion.button>
          </div>
        </form>

        {/* Bottom accent line */}
        <div
          className="absolute bottom-0 left-4 right-4 h-[1px] pointer-events-none"
          style={{
            background: 'linear-gradient(90deg, transparent, rgba(200,200,208,0.08), transparent)',
          }}
        />
      </motion.div>
    </motion.div>
  );
}
