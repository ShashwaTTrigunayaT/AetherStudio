import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, X, Puzzle, Check, RotateCw,
  Star, ExternalLink, Settings, Package, Tag,
  Bookmark, Trash2, MoreVertical, RefreshCw, Filter,
  SlidersHorizontal, AlertCircle, Download, Info,
  Eye, EyeOff, Globe, Layers, ArrowUpDown, Clock,
  ToggleLeft, ToggleRight, Upload,
} from 'lucide-react';
import {
  fetchExtensions, fetchFeaturedExtensions, fetchUserExtensionState, fetchExtensionDetails,
  installExtension, toggleExtension, setExtensionAutoUpdate,
  bulkEnableExtensions, submitReview, installVsix,
} from '../../lib/api';

// ═══════════════════════════════════════════════════════════
//  FALLBACK CATALOG (when API is unreachable)
// ═══════════════════════════════════════════════════════════

const FALLBACK_CATALOG = [
  { id: 'builtin-js', name: 'JavaScript Language Basics', publisher: 'AetherStudio', icon: '🟨', category: 'languages', builtin: true, version: '1.2.0', description: 'Core JavaScript/TypeScript language support.', downloads: 'Built-in', rating: 5.0, tags: ['javascript', 'built-in'], color: '#F0DB4F', isFeatured: true },
  { id: 'builtin-html', name: 'HTML & CSS Support', publisher: 'AetherStudio', icon: '🌐', category: 'languages', builtin: true, version: '1.1.0', description: 'HTML5, CSS3, SVG language support with Emmet.', downloads: 'Built-in', rating: 5.0, tags: ['html', 'css', 'built-in'], color: '#E34F26', isFeatured: true },
  { id: 'builtin-git', name: 'Git Integration', publisher: 'AetherStudio', icon: '🔀', category: 'devops', builtin: true, version: '1.0.0', description: 'Built-in Git source control.', downloads: 'Built-in', rating: 5.0, tags: ['git', 'built-in'], color: '#F05032' },
  { id: 'builtin-markdown', name: 'Markdown Preview', publisher: 'AetherStudio', icon: '📝', category: 'productivity', builtin: true, version: '1.0.5', description: 'Live Markdown preview.', downloads: 'Built-in', rating: 5.0, tags: ['markdown', 'built-in'], color: '#083FA1' },
  { id: 'python', name: 'Python', publisher: 'AetherStudio', icon: '🐍', category: 'languages', version: '2.1.0', description: 'IntelliSense, linting, debugging for Python 3.', downloads: '12.5M', rating: 4.8, tags: ['python'], color: '#306998', hasUpdate: true, latestVersion: '2.2.0' },
  { id: 'javascript-ts', name: 'JavaScript & TypeScript', publisher: 'AetherStudio', icon: '🟦', category: 'languages', version: '3.0.1', description: 'Rich IntelliSense for JS/TS.', downloads: '24.1M', rating: 4.9, tags: ['javascript', 'typescript'], color: '#3178C6', isFeatured: true },
  { id: 'rust', name: 'rust-analyzer', publisher: 'Rust Team', icon: '🦀', category: 'languages', version: '0.4.0', description: 'Rust language server.', downloads: '3.8M', rating: 4.9, tags: ['rust'], color: '#DEA584', isFeatured: true },
  { id: 'cpp', name: 'C/C++ Extension Pack', publisher: 'Microsoft', icon: '⚙️', category: 'languages', version: '1.12.0', description: 'C/C++ IntelliSense pack.', downloads: '18.3M', rating: 4.5, tags: ['c', 'cpp'], color: '#00599C', isPack: true, packCount: 5, hasUpdate: true, latestVersion: '1.13.0' },
  { id: 'nexus-dark', name: 'Nexus Dark Pro', publisher: 'Aether Themes', icon: '🌙', category: 'themes', version: '2.0.0', description: 'Premium dark theme with gold accents.', downloads: '892K', rating: 4.9, tags: ['theme'], color: '#b89450', isFeatured: true },
  { id: 'gitlens', name: 'GitLens', publisher: 'GitKraken', icon: '🔍', category: 'productivity', version: '14.5.0', description: 'Git blame annotations.', downloads: '22.1M', rating: 4.9, tags: ['git'], color: '#F05133' },
  { id: 'prettier', name: 'Prettier', publisher: 'Prettier', icon: '✨', category: 'productivity', version: '10.2.0', description: 'Opinionated code formatter.', downloads: '31.5M', rating: 4.8, tags: ['formatting'], color: '#F7B93E' },
  { id: 'copilot', name: 'GitHub Copilot', publisher: 'GitHub', icon: '🤖', category: 'productivity', version: '1.80.0', description: 'AI-powered code completions.', downloads: '6.3M', rating: 4.9, tags: ['ai'], color: '#6CC644', isFeatured: true },
  { id: 'docker', name: 'Docker', publisher: 'Microsoft', icon: '🐳', category: 'devops', version: '1.28.0', description: 'Dockerfile editing.', downloads: '14.2M', rating: 4.6, tags: ['docker'], color: '#2496ED' },
];

// ── Sort Options ──
const SORT_OPTIONS = [
  { id: 'rating', label: 'Sort by Rating', icon: Star },
  { id: 'downloads', label: 'Sort by Installs', icon: Download },
  { id: 'name', label: 'Sort by Name (A-Z)', icon: ArrowUpDown },
  { id: 'date', label: 'Sort by Published Date', icon: Clock },
];

// ── Filter Options ──
const FILTER_OPTIONS = [
  { id: 'all', label: 'All Extensions' },
  { id: 'installed', label: 'Installed' },
  { id: 'enabled', label: 'Enabled' },
  { id: 'disabled', label: 'Disabled' },
  { id: 'builtin', label: 'Built-in' },
  { id: 'updates', label: 'Has Updates' },
];

// ── View Modes ──
const VIEW_OPTIONS = [
  { id: 'marketplace', label: 'Marketplace', icon: Globe },
  { id: 'installed', label: 'Installed', icon: Download },
  { id: 'popular', label: 'Popular', icon: Star },
  { id: 'updates', label: 'Updates Available', icon: Clock },
  { id: 'builtin', label: 'Built-in', icon: Layers },
];

const CATEGORIES = [
  { id: 'all', label: 'All', icon: Package },
  { id: 'languages', label: 'Languages', icon: Tag },
  { id: 'themes', label: 'Themes', icon: Puzzle },
  { id: 'productivity', label: 'Productivity', icon: Star },
  { id: 'debugging', label: 'Debugging', icon: RotateCw },
  { id: 'devops', label: 'DevOps', icon: Settings },
];

// ═══════════════════════════════════════════════════════════
//  DROPDOWN COMPONENT (reusable VS Code-style)
// ═══════════════════════════════════════════════════════════

function Dropdown({ trigger, items, onSelect, selectedId, align = 'left' }) {
  const [open, setOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(0);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const handleClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  const handleKeyDown = (e) => {
    switch (e.key) {
      case 'ArrowDown': e.preventDefault(); setFocusedIndex(i => Math.min(i + 1, items.length - 1)); break;
      case 'ArrowUp': e.preventDefault(); setFocusedIndex(i => Math.max(i - 1, 0)); break;
      case 'Enter': e.preventDefault(); if (items[focusedIndex]) { onSelect(items[focusedIndex].id); setOpen(false); } break;
      case 'Escape': e.preventDefault(); setOpen(false); break;
    }
  };

  return (
    <div ref={ref} className="relative">
      <div onClick={() => { setOpen(!open); setFocusedIndex(0); }}>{trigger}</div>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.96 }}
            transition={{ duration: 0.1, ease: [0.25, 0.1, 0.25, 1] }}
            className={`absolute ${align === 'right' ? 'right-0' : 'left-0'} top-full mt-0.5 min-w-[170px] z-50`}
            style={{
              background: 'rgba(18,18,22,0.95)',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: '8px',
              boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
              backdropFilter: 'blur(40px) saturate(1.8)',
            }}
            onKeyDown={handleKeyDown}
          >
            <div className="py-1">
              {items.map((item, idx) => {
                if (item.type === 'divider') {
                  return <div key={`d-${idx}`} className="my-1 mx-3" style={{ height: '1px', background: 'rgba(255,255,255,0.06)' }} />;
                }
                const isSelected = selectedId === item.id;
                const Icon = item.icon;
                const isFocused = focusedIndex === idx;
                return (
                  <motion.button
                    key={item.id}
                    onClick={() => { onSelect(item.id); setOpen(false); }}
                    onMouseEnter={() => setFocusedIndex(idx)}
                    className="w-full flex items-center gap-2.5 px-3 py-1.5 text-[11px] transition-all duration-75 cursor-pointer"
                    style={{
                      color: isFocused ? 'rgba(255,255,255,0.55)' : 'rgba(255,255,255,0.4)',
                      background: isFocused ? 'rgba(255,255,255,0.04)' : 'transparent',
                      borderLeft: isFocused ? '2px solid rgba(255,255,255,0.3)' : '2px solid transparent',
                    }}
                  >
                    {Icon && <Icon size={12} style={{ color: isSelected ? 'rgba(184,148,80,0.7)' : 'rgba(255,255,255,0.2)' }} />}
                    <span className="flex-1 text-left">{item.label}</span>
                    {isSelected && <Check size={10} style={{ color: 'rgba(184,148,80,0.6)' }} />}
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
//  EXTENSION DETAILS VIEW (inline)
// ═══════════════════════════════════════════════════════════

function ExtensionDetails({ extension, installed, enabled, onClose, onToggleInstall, onToggleEnable, onReviewSubmit, reviewForm, setReviewForm, submittingReview }) {
  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className="overflow-hidden"
    >
      <div
        className="mx-2 mb-2 rounded-xl p-4"
        style={{
          background: 'rgba(255,255,255,0.02)',
          border: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        {/* Close + header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div
              className="w-[40px] h-[40px] rounded-xl flex items-center justify-center text-[22px]"
              style={{ background: `${extension.color}15`, border: `1px solid ${extension.color}25` }}
            >
              {extension.icon}
            </div>
            <div>
              <p className="text-[13px] font-semibold" style={{ color: 'rgba(255,255,255,0.8)' }}>{extension.name}</p>
              <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.25)' }}>{extension.publisher} {extension.version && `• v${extension.version}`}</p>
            </div>
          </div>
          <motion.button
            whileHover={{ color: 'rgba(255,255,255,0.5)', background: 'rgba(255,255,255,0.06)' }}
            whileTap={{ scale: 0.9 }}
            onClick={onClose}
            className="p-1 rounded-md"
            style={{ color: 'rgba(255,255,255,0.2)' }}
          >
            <X size={12} />
          </motion.button>
        </div>

        {/* Description */}
        <p className="text-[11px] leading-relaxed mb-3" style={{ color: 'rgba(255,255,255,0.5)' }}>
          {extension.description}
        </p>

        {/* Tags */}
        <div className="flex flex-wrap gap-1 mb-3">
          {extension.tags.map((tag) => (
            <span key={tag} className="text-[9px] px-2 py-0.5 rounded-full"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.25)' }}>
              {tag}
            </span>
          ))}
          {extension.isPack && (
            <span className="text-[9px] px-2 py-0.5 rounded-full"
              style={{ background: 'rgba(184,148,80,0.1)', border: '1px solid rgba(184,148,80,0.15)', color: 'rgba(184,148,80,0.6)' }}>
              Extension Pack • {extension.packCount} extensions
            </span>
          )}
        </div>

        {/* Stats row */}
        <div className="flex items-center gap-4 mb-3">
          <span className="flex items-center gap-1 text-[10px]" style={{ color: 'rgba(255,255,255,0.3)' }}>
            <Star size={10} className="text-[#fbbf24]" fill="#fbbf24" />
            {extension.rating}
          </span>
          <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.2)' }}>
            <Download size={10} className="inline mr-0.5" />
            {extension.downloads} installs
          </span>
          {extension.version && (
            <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.2)' }}>
              v{extension.version}
            </span>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {!extension.builtin && (
            <>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => onToggleInstall(extension.id)}
                className="flex-1 py-1.5 rounded-lg text-[11px] font-semibold transition-all"
                style={{
                  background: installed ? 'rgba(48,209,88,0.1)' : 'rgba(184,148,80,0.15)',
                  border: `1px solid ${installed ? 'rgba(48,209,88,0.2)' : 'rgba(184,148,80,0.2)'}`,
                  color: installed ? 'rgba(48,209,88,0.9)' : 'rgba(184,148,80,0.8)',
                }}
              >
                {installed ? 'Uninstall' : 'Install'}
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => onToggleEnable(extension.id)}
                className="py-1.5 px-3 rounded-lg text-[11px] font-semibold transition-all"
                style={{
                  background: enabled ? 'rgba(48,209,88,0.08)' : 'rgba(255,255,255,0.04)',
                  border: `1px solid ${enabled ? 'rgba(48,209,88,0.15)' : 'rgba(255,255,255,0.06)'}`,
                  color: enabled ? 'rgba(48,209,88,0.8)' : 'rgba(255,255,255,0.3)',
                }}
              >
                {enabled ? 'Enabled' : 'Disabled'}
              </motion.button>
            </>
          )}
          {extension.builtin && (
            <span className="text-[10px] px-3 py-1.5 rounded-lg"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.3)' }}>
              Built-in Extension
            </span>
          )}
          {extension.hasUpdate && (
            <span
              onClick={() => onToggleInstall(extension.id)}
              className="flex items-center gap-1 text-[10px] px-3 py-1.5 rounded-lg cursor-pointer hover:bg-[rgba(255,214,10,0.12)] transition-all"
              style={{ background: 'rgba(255,214,10,0.08)', border: '1px solid rgba(255,214,10,0.15)', color: 'rgba(255,214,10,0.7)' }}>
              <Download size={10} />
              Update to v{extension.latestVersion}
            </span>
          )}
        </div>

        {/* ── Reviews Section ── */}
        <div className="mt-4 pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
          <p className="text-[10px] font-semibold mb-2" style={{ color: 'rgba(255,255,255,0.25)' }}>
            Rate this extension
          </p>
          {/* Star rating input */}
          <div className="flex items-center gap-1 mb-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <motion.button
                key={star}
                whileHover={{ scale: 1.2 }}
                whileTap={{ scale: 0.9 }}
                onClick={(e) => {
                  e.stopPropagation();
                  if (reviewForm && setReviewForm) {
                    setReviewForm(prev => ({ ...prev, rating: star }));
                  }
                }}
                className="p-0.5 transition-all"
                style={{
                  color: reviewForm && star <= reviewForm.rating ? '#fbbf24' : 'rgba(255,255,255,0.08)',
                }}
              >
                <Star size={11} fill={reviewForm && star <= reviewForm.rating ? '#fbbf24' : 'transparent'} />
              </motion.button>
            ))}
            <span className="text-[9px] ml-1" style={{ color: 'rgba(255,255,255,0.15)' }}>
              {extension.rating} ({extension.ratingCount || 0} reviews)
            </span>
          </div>

          {/* Review text input */}
          {!extension.builtin && (
            <>
              <input
                type="text"
                value={reviewForm?.title || ''}
                onChange={(e) => setReviewForm?.(prev => ({ ...prev, title: e.target.value }))}
                onClick={(e) => e.stopPropagation()}
                placeholder="Review title (optional)"
                className="w-full rounded-lg px-3 py-1.5 text-[10px] mb-1.5 outline-none transition-all"
                style={{
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  color: 'rgba(255,255,255,0.6)',
                }}
              />
              <textarea
                value={reviewForm?.text || ''}
                onChange={(e) => setReviewForm?.(prev => ({ ...prev, text: e.target.value }))}
                onClick={(e) => e.stopPropagation()}
                placeholder="Write a review..."
                rows={2}
                className="w-full rounded-lg px-3 py-1.5 text-[10px] mb-2 outline-none resize-none transition-all"
                style={{
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  color: 'rgba(255,255,255,0.6)',
                }}
              />
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                disabled={submittingReview}
                onClick={(e) => {
                  e.stopPropagation();
                  onReviewSubmit?.(extension.id);
                }}
                className="w-full py-1.5 rounded-lg text-[10px] font-semibold transition-all"
                style={{
                  background: submittingReview ? 'rgba(255,255,255,0.04)' : 'rgba(184,148,80,0.12)',
                  border: '1px solid rgba(184,148,80,0.2)',
                  color: submittingReview ? 'rgba(255,255,255,0.2)' : 'rgba(184,148,80,0.7)',
                }}
              >
                {submittingReview ? 'Submitting...' : 'Submit Review'}
              </motion.button>
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════
//  EXTENSION CARD
// ═══════════════════════════════════════════════════════════

function ExtensionCard({
  extension, installed, enabled, onToggleInstall, onToggleEnable, onShowDetails,
  isInstalling, activeMenuId, onSetActiveMenu, isExpanded, isRefreshing,
  isFocused = false, onContextMenu, reviewForm, setReviewForm, onReviewSubmit, submittingReview,
}) {
  const menuRef = useRef(null);
  const showMenu = activeMenuId === extension.id;
  const isBuiltin = extension.builtin;

  // Close on outside click
  useEffect(() => {
    if (!showMenu) return;
    const handleClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) onSetActiveMenu(null);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showMenu, onSetActiveMenu]);

  const menuItems = [];
  if (isBuiltin) {
    menuItems.push({ id: 'details', label: 'View Details', icon: Info });
    menuItems.push({ id: 'builtin-info', label: 'Built-in — cannot uninstall', icon: Layers, disabled: true });
  } else {
    menuItems.push({ id: 'details', label: 'View Details', icon: Info });
    menuItems.push({ id: 'enable-disable', label: enabled ? 'Disable' : 'Enable', icon: enabled ? EyeOff : Eye });
    if (enabled) menuItems.push({ id: 'disable-global', label: 'Disable (Globally)', icon: Globe });
    menuItems.push({ id: 'bookmark', label: installed ? 'Remove Bookmark' : 'Bookmark', icon: Bookmark });
    menuItems.push({ type: 'divider' });
    if (installed && extension.hasUpdate) {
      menuItems.push({ id: 'update', label: `Update to v${extension.latestVersion}`, icon: Download });
    }
    if (installed) {
      menuItems.push({ id: 'reinstall', label: 'Reinstall', icon: RotateCw });
      menuItems.push({ id: 'uninstall', label: 'Uninstall', icon: Trash2, danger: true });
    }
    if (extension.version) {
      menuItems.push({ type: 'divider' });
      menuItems.push({ id: 'version', label: `v${extension.version}${extension.hasUpdate ? ` → v${extension.latestVersion}` : ''}`, icon: Clock, disabled: true });
    }
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8, scale: 0.95 }}
      transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
      className="relative"
    >
      <motion.div
        data-focused={isFocused ? 'true' : 'false'}
        onClick={() => onShowDetails(extension.id)}
        onContextMenu={(e) => onContextMenu?.(e, extension.id)}
        className="group relative flex items-start gap-3 px-3 py-3 mx-2 rounded-xl transition-all cursor-pointer"
        style={{
          background: isFocused ? 'rgba(255,255,255,0.04)' : installed && isBuiltin ? 'rgba(160,120,64,0.03)' : installed ? 'rgba(48,209,88,0.03)' : isExpanded ? 'rgba(255,255,255,0.03)' : 'transparent',
          borderBottom: '1px solid rgba(255,255,255,0.03)',
          borderLeft: isFocused ? '2px solid rgba(184,148,80,0.4)' : isExpanded ? '2px solid rgba(184,148,80,0.3)' : '2px solid transparent',
        }}
        whileHover={{ background: 'rgba(255,255,255,0.03)' }}
      >
        {/* Icon with status dot */}
        <div className="relative flex-shrink-0">
          <div
            className="w-[34px] h-[34px] rounded-xl flex items-center justify-center text-[16px]"
            style={{
              background: `${extension.color}12`,
              border: `1px solid ${extension.color}20`,
            }}
          >
            {extension.icon}
          </div>
          {/* Enable/disable status indicator */}
          {installed && !isBuiltin && (
            <div
              className={`absolute -top-0.5 -right-0.5 w-[10px] h-[10px] rounded-full border-2 ${
                enabled ? 'bg-[#30d158]' : 'bg-[rgba(255,255,255,0.15)]'
              }`}
              style={{ borderColor: 'rgba(12,12,14,0.9)' }}
            />
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <p className="text-[12px] font-semibold truncate" style={{ color: 'rgba(255,255,255,0.7)' }}>
                  {extension.name}
                </p>
                {isBuiltin && (
                  <span className="text-[8px] px-1 py-[1px] rounded-full flex-shrink-0"
                    style={{ background: 'rgba(160,120,64,0.12)', border: '1px solid rgba(160,120,64,0.15)', color: 'rgba(160,120,64,0.5)' }}>
                    Built-in
                  </span>
                )}

              </div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-[9px]" style={{ color: 'rgba(255,255,255,0.2)' }}>{extension.publisher}</span>
                {installed && extension.version && (
                  <>
                    <span className="text-[7px]" style={{ color: 'rgba(255,255,255,0.1)' }}>•</span>
                    <span className="text-[9px] font-mono" style={{ color: 'rgba(255,255,255,0.15)' }}>v{extension.version}</span>
                  </>
                )}
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              {isRefreshing && (
                <motion.span animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  className="text-[10px]">◌</motion.span>
              )}

              {/* Enable/Disable toggle for installed */}
              {installed && !isBuiltin && (
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={(e) => { e.stopPropagation(); onToggleEnable(extension.id); }}
                  className="p-1 rounded-md"
                  style={{ color: enabled ? 'rgba(48,209,88,0.5)' : 'rgba(255,255,255,0.15)' }}
                  title={enabled ? 'Click to disable' : 'Click to enable'}
                >
                  {enabled ? <ToggleRight size={12} /> : <ToggleLeft size={12} />}
                </motion.button>
              )}

              {/* Update badge */}
              {!isBuiltin && extension.hasUpdate && installed && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={(e) => { e.stopPropagation(); onToggleInstall(extension.id); }}
                  className="px-2 py-0.5 rounded-lg text-[10px] font-semibold transition-all flex items-center gap-1"
                  style={{
                    background: 'rgba(255,214,10,0.1)',
                    border: '1px solid rgba(255,214,10,0.2)',
                    color: 'rgba(255,214,10,0.7)',
                  }}
                  title={`Update to v${extension.latestVersion}`}
                >
                  <Download size={9} />
                  Update
                </motion.button>
              )}

              {/* Install/Installed button */}
              {!isBuiltin && !extension.hasUpdate && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={(e) => { e.stopPropagation(); onToggleInstall(extension.id); }}
                  className="flex-shrink-0 px-2.5 py-0.5 rounded-lg text-[10px] font-semibold transition-all"
                  style={{
                    background: installed ? 'rgba(48,209,88,0.08)' : 'rgba(255,255,255,0.06)',
                    border: `1px solid ${installed ? 'rgba(48,209,88,0.15)' : 'rgba(255,255,255,0.08)'}`,
                    color: installed ? 'rgba(48,209,88,0.7)' : 'rgba(255,255,255,0.4)',
                  }}
                  disabled={isInstalling === extension.id}
                >
                  {isInstalling === extension.id ? '...' : installed ? <Check size={9} /> : 'Install'}
                </motion.button>
              )}
            </div>
          </div>

          <p className="text-[10px] mt-1 leading-relaxed line-clamp-1" style={{ color: 'rgba(255,255,255,0.3)' }}>
            {extension.description}
          </p>

          {/* Meta row */}
          <div className="flex items-center gap-2 mt-1.5">
            <span className="flex items-center gap-0.5 text-[9px]" style={{ color: 'rgba(255,255,255,0.2)' }}>
              <Star size={8} className="text-[#fbbf24]" fill="#fbbf24" />
              {extension.rating}
            </span>
            {!isBuiltin && (
              <span className="text-[9px]" style={{ color: 'rgba(255,255,255,0.12)' }}>
                {extension.downloads}
              </span>
            )}
            {extension.isPack && (
              <span className="text-[9px] flex items-center gap-0.5" style={{ color: 'rgba(184,148,80,0.4)' }}>
                <Layers size={8} />
                Pack • {extension.packCount}
              </span>
            )}
          </div>
        </div>

        {/* More menu (⋯) */}
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <div ref={menuRef} className="relative">
            <motion.button
              whileHover={{ color: 'rgba(255,255,255,0.5)', background: 'rgba(255,255,255,0.06)' }}
              whileTap={{ scale: 0.9 }}
              onClick={(e) => { e.stopPropagation(); onSetActiveMenu(showMenu ? null : extension.id); }}
              className="p-1 rounded-md transition-all"
              style={{ color: 'rgba(255,255,255,0.2)' }}
            >
              <MoreVertical size={11} />
            </motion.button>
            <AnimatePresence>
              {showMenu && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="absolute right-0 top-full mt-1 min-w-[160px] z-50"
                  style={{
                    background: 'rgba(18,18,22,0.95)',
                    border: '1px solid rgba(255,255,255,0.06)',
                    borderRadius: '8px',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
                    backdropFilter: 'blur(40px)',
                  }}
                >
                  <div className="py-1">
                    {menuItems.map((item, idx) => {
                      if (item.type === 'divider') {
                        return <div key={`d-${idx}`} className="my-1 mx-3" style={{ height: '1px', background: 'rgba(255,255,255,0.06)' }} />;
                      }
                      return (
                        <motion.button
                          key={item.id}
                          whileHover={{ background: 'rgba(255,255,255,0.04)' }}
                          onClick={(e) => {
                            e.stopPropagation();
                            onSetActiveMenu(null);
                            if (item.id === 'details') onShowDetails(extension.id);
                            if (item.id === 'uninstall') onToggleInstall(extension.id);
                            if (item.id === 'enable-disable') onToggleEnable(extension.id);
                            if (item.id === 'update') onToggleInstall(extension.id);
                          }}
                          className="w-full flex items-center gap-2 px-3 py-1.5 text-[10px] transition-all cursor-pointer"
                          style={{
                            color: item.danger ? 'rgba(248,113,113,0.6)' : item.disabled ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.4)',
                            cursor: item.disabled ? 'default' : 'pointer',
                          }}
                        >
                          {item.icon && <item.icon size={11} />}
                          <span className="flex-1 text-left">{item.label}</span>
                        </motion.button>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>

      {/* Inline Details */}
      <AnimatePresence>
        {isExpanded && (
          <ExtensionDetails
            extension={extension}
            installed={installed || isBuiltin}
            enabled={enabled}
            onClose={() => onShowDetails(null)}
            onToggleInstall={onToggleInstall}
            onToggleEnable={onToggleEnable}
            reviewForm={reviewForm}
            setReviewForm={setReviewForm}
            onReviewSubmit={onReviewSubmit}
            submittingReview={submittingReview}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════
//  SECTION HEADER
// ═══════════════════════════════════════════════════════════

function SectionHeader({ icon: Icon, title, count, actions }) {
  return (
    <div className="flex items-center gap-2 px-4 py-2 group">
      {Icon && <Icon size={10} style={{ color: 'rgba(255,255,255,0.18)' }} />}
      <span className="text-[9px] font-semibold uppercase tracking-[1px]" style={{ color: 'rgba(255,255,255,0.18)' }}>
        {title}
      </span>
      {count !== undefined && (
        <span
          className="text-[9px] font-mono px-1.5 py-[1px] rounded-full"
          style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.05)',
            color: 'rgba(255,255,255,0.15)',
          }}
        >
          {count}
        </span>
      )}
      {actions && <div className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity">{actions}</div>}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
//  FEATURED SPOTLIGHT
// ═══════════════════════════════════════════════════════════

function FeaturedSpotlight({ extensions, installedExtensions, onToggleInstall }) {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (extensions.length <= 1) return;
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % extensions.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [extensions.length]);

  const ext = extensions[current];
  if (!ext) return null;

  return (
    <div className="px-3 pt-1 pb-2 relative z-10">
      <motion.div
        key={ext.id}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        transition={{ duration: 0.3 }}
        className="rounded-xl overflow-hidden relative"
        style={{
          background: `linear-gradient(135deg, ${ext.color}12 0%, ${ext.color}05 100%)`,
          border: `1px solid ${ext.color}15`,
        }}
      >
        <div className="p-3">
          <div className="flex items-start gap-3">
            <div
              className="w-[36px] h-[36px] rounded-xl flex items-center justify-center text-[18px] flex-shrink-0"
              style={{ background: `${ext.color}15`, border: `1px solid ${ext.color}25` }}
            >
              {ext.icon}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[12px] font-bold" style={{ color: 'rgba(255,255,255,0.8)' }}>{ext.name}</p>
              <p className="text-[9px]" style={{ color: 'rgba(255,255,255,0.2)' }}>{ext.publisher}</p>
              <p className="text-[10px] mt-1 leading-relaxed line-clamp-2" style={{ color: 'rgba(255,255,255,0.35)' }}>
                {ext.description}
              </p>
              <div className="flex items-center gap-3 mt-2">
                <span className="flex items-center gap-0.5 text-[9px]" style={{ color: 'rgba(255,255,255,0.2)' }}>
                  <Star size={8} className="text-[#fbbf24]" fill="#fbbf24" />
                  {ext.rating}
                </span>
                <span className="text-[9px]" style={{ color: 'rgba(255,255,255,0.12)' }}>{ext.downloads}</span>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => onToggleInstall(ext.id)}
                  className="ml-auto px-2.5 py-0.5 rounded-lg text-[10px] font-semibold"
                  style={{
                    background: installedExtensions.has(ext.id) ? 'rgba(48,209,88,0.1)' : 'rgba(184,148,80,0.15)',
                    border: `1px solid ${installedExtensions.has(ext.id) ? 'rgba(48,209,88,0.2)' : 'rgba(184,148,80,0.2)'}`,
                    color: installedExtensions.has(ext.id) ? 'rgba(48,209,88,0.7)' : 'rgba(184,148,80,0.8)',
                  }}
                >
                  {installedExtensions.has(ext.id) ? 'Installed' : 'Install'}
                </motion.button>
              </div>
            </div>
          </div>
        </div>

        {/* Dot indicators */}
        {extensions.length > 1 && (
          <div className="flex justify-center gap-1 pb-2">
            {extensions.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                className="w-[4px] h-[4px] rounded-full transition-all"
                style={{
                  background: i === current ? 'rgba(184,148,80,0.5)' : 'rgba(255,255,255,0.08)',
                  width: i === current ? 12 : 4,
                }}
              />
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
//  MAIN EXTENSIONS PANEL
// ═══════════════════════════════════════════════════════════

export default function ExtensionsPanel() {
  // ── API state ──
  const [extensionsCatalog, setExtensionsCatalog] = useState(FALLBACK_CATALOG);
  const [loadingCatalog, setLoadingCatalog] = useState(true);
  const [apiError, setApiError] = useState(null);

  // ── Extension state from backend ──
  const [installedExtensions, setInstalledExtensions] = useState(new Set(['builtin-js', 'builtin-html', 'builtin-git', 'builtin-markdown']));
  const [enabledExtensions, setEnabledExtensions] = useState(new Set(['builtin-js', 'builtin-html', 'builtin-git', 'builtin-markdown']));
  const [extensionSettings, setExtensionSettings] = useState([]);

  // ── UI state ──
  const [searchQuery, setSearchQuery] = useState('');
  const [searchHistory, setSearchHistory] = useState(() => {
    try { return JSON.parse(localStorage.getItem('ext-search-history') || '[]'); }
    catch { return []; }
  });
  const [showSearchHistory, setShowSearchHistory] = useState(false);
  const [activeCategory, setActiveCategory] = useState('all');
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const [isInstalling, setIsInstalling] = useState(null);
  const [activeMenuId, setActiveMenuId] = useState(null);
  const [expandedExtension, setExpandedExtension] = useState(null);
  const [activeView, setActiveView] = useState('marketplace');
  const [sortBy, setSortBy] = useState('rating');
  const [filterBy, setFilterBy] = useState('all');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [autoUpdate, setAutoUpdate] = useState(true);

  // ── Context menu state ──
  const [contextMenu, setContextMenu] = useState(null); // { x, y, extensionId }

  // ── Review state ──
  const [reviewsCache, setReviewsCache] = useState({});
  const [reviewForm, setReviewForm] = useState({ rating: 5, title: '', text: '' });
  const [submittingReview, setSubmittingReview] = useState(false);

  // ── VSIX drop state ──
  const [isDragOver, setIsDragOver] = useState(false);

  const inputRef = useRef(null);
  const listRef = useRef(null);

  // ── Fetch catalog from API on mount ──
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [catalogRes, userState] = await Promise.all([
          fetchExtensions({ limit: 100 }),
          fetchUserExtensionState(),
        ]);
        if (cancelled) return;

        // Map API extensions to catalog format
        const apiExts = (catalogRes.extensions || []).map(e => ({
          id: e.extensionId,
          name: e.name,
          publisher: e.publisher,
          icon: e.icon,
          category: e.category,
          builtin: e.isBuiltin,
          version: e.version,
          latestVersion: e.latestVersion,
          hasUpdate: !!e.latestVersion && e.latestVersion !== e.version,
          description: e.description || e.shortDescription,
          downloads: e.downloads > 999999 ? (e.downloads / 1000000).toFixed(1) + 'M' : e.downloads > 999 ? (e.downloads / 1000).toFixed(1) + 'K' : String(e.downloads),
          rating: e.rating,
          ratingCount: e.ratingCount,
          tags: e.tags,
          color: e.color || '#888',
          isFeatured: e.isFeatured,
          isPack: e.isPack,
          packCount: e.packCount,
        }));

        // Ensure built-in extensions are always present
        const builtinIds = new Set(FALLBACK_CATALOG.filter(e => e.builtin).map(e => e.id));
        const existingIds = new Set(apiExts.map(e => e.id));
        for (const fb of FALLBACK_CATALOG) {
          if (fb.builtin && !existingIds.has(fb.id)) {
            apiExts.unshift(fb);
          }
        }

        setExtensionsCatalog(apiExts);

        // Apply user extension state
        if (userState.installed) {
          setInstalledExtensions(new Set([...userState.installed, ...builtinIds]));
        }
        if (userState.enabled) {
          setEnabledExtensions(new Set(userState.enabled));
        } else if (userState.installed) {
          // Default: all installed are enabled
          setEnabledExtensions(new Set(userState.installed));
        }
        setExtensionSettings(userState.extensionSettings || []);
      } catch (err) {
        console.warn('[Extensions] API fetch failed, using fallback catalog:', err);
        setApiError('Could not reach extension server. Using local catalog.');
      } finally {
        if (!cancelled) setLoadingCatalog(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // ── Save search history to localStorage ──
  useEffect(() => {
    localStorage.setItem('ext-search-history', JSON.stringify(searchHistory.slice(0, 10)));
  }, [searchHistory]);

  // ── Filter & Sort ──
  const filteredExtensions = useMemo(() => {
    let list = [...extensionsCatalog];

    // View mode
    switch (activeView) {
      case 'installed':
        list = list.filter(e => installedExtensions.has(e.id));
        break;
      case 'popular':
        list = list.filter(e => e.rating >= 4.7);
        break;
      case 'updates':
        list = list.filter(e => e.hasUpdate && installedExtensions.has(e.id));
        break;
      case 'builtin':
        list = list.filter(e => e.builtin);
        break;
      default:
        break;
    }

    // Category filter
    if (activeCategory !== 'all') {
      list = list.filter((ext) => ext.category === activeCategory);
    }

    // Additional filter
    switch (filterBy) {
      case 'installed':
        list = list.filter(e => installedExtensions.has(e.id));
        break;
      case 'enabled':
        list = list.filter(e => enabledExtensions.has(e.id));
        break;
      case 'disabled':
        list = list.filter(e => installedExtensions.has(e.id) && !enabledExtensions.has(e.id));
        break;
      case 'builtin':
        list = list.filter(e => e.builtin);
        break;
      case 'updates':
        list = list.filter(e => e.hasUpdate && installedExtensions.has(e.id));
        break;
      default:
        break;
    }

    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (ext) =>
          ext.name.toLowerCase().includes(q) ||
          ext.publisher.toLowerCase().includes(q) ||
          ext.description.toLowerCase().includes(q) ||
          ext.tags.some((t) => t.toLowerCase().includes(q))
      );
    }

    return list;
  }, [searchQuery, activeCategory, installedExtensions, enabledExtensions, activeView, filterBy]);

  const sortedExtensions = useMemo(() => {
    const list = [...filteredExtensions];
    list.sort((a, b) => {
      // Installed first (for marketplace view)
      if (activeView === 'marketplace') {
        const aInst = installedExtensions.has(a.id) ? -1 : 1;
        const bInst = installedExtensions.has(b.id) ? -1 : 1;
        if (aInst !== bInst) return aInst - bInst;
      }

      switch (sortBy) {
        case 'downloads': return parseInt((b.downloads || '0').replace(/[^0-9]/g, '')) - parseInt((a.downloads || '0').replace(/[^0-9]/g, ''));
        case 'name': return a.name.localeCompare(b.name);
        case 'date': return (b.installDate || '').localeCompare(a.installDate || '');
        case 'rating': default: return b.rating - a.rating;
      }
    });
    return list;
  }, [filteredExtensions, sortBy, activeView, installedExtensions]);

  // Featured extensions (non-installed, highest rated)
  const featuredExtensions = useMemo(() =>
    extensionsCatalog.filter(e => e.isFeatured),
  []);

  // ── Actions ──
  const handleToggleInstall = useCallback(async (id) => {
    const isInstalled = installedExtensions.has(id);
    setIsInstalling(id);
    try {
      const action = isInstalled ? 'uninstall' : 'install';
      const res = await installExtension(id, action);
      setInstalledExtensions(new Set(res.installed || []));
      setEnabledExtensions(new Set(res.enabled || res.installed || []));
    } catch (err) {
      console.error('[Extensions] Install error:', err);
    } finally {
      setIsInstalling(null);
    }
  }, [installedExtensions]);

  const handleToggleEnable = useCallback(async (id) => {
    const newEnabled = !enabledExtensions.has(id);
    try {
      const res = await toggleExtension(id, newEnabled, 'global');
      setEnabledExtensions(new Set(res.enabled || []));
    } catch (err) {
      console.error('[Extensions] Toggle error:', err);
    }
  }, [enabledExtensions]);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const [catalogRes, userState] = await Promise.all([
        fetchExtensions({ limit: 100 }),
        fetchUserExtensionState(),
      ]);
      const apiExts = (catalogRes.extensions || []).map(e => ({
        id: e.extensionId, name: e.name, publisher: e.publisher, icon: e.icon,
        category: e.category, builtin: e.isBuiltin, version: e.version,
        latestVersion: e.latestVersion,
        hasUpdate: !!e.latestVersion && e.latestVersion !== e.version,
        description: e.description || e.shortDescription,
        downloads: e.downloads > 999999 ? (e.downloads / 1000000).toFixed(1) + 'M' : e.downloads > 999 ? (e.downloads / 1000).toFixed(1) + 'K' : String(e.downloads),
        rating: e.rating, ratingCount: e.ratingCount, tags: e.tags,
        color: e.color || '#888', isFeatured: e.isFeatured, isPack: e.isPack, packCount: e.packCount,
      }));
      const builtinIds = new Set(FALLBACK_CATALOG.filter(e => e.builtin).map(e => e.id));
      const existingIds = new Set(apiExts.map(e => e.id));
      for (const fb of FALLBACK_CATALOG) {
        if (fb.builtin && !existingIds.has(fb.id)) apiExts.unshift(fb);
      }
      setExtensionsCatalog(apiExts);
      if (userState.installed) setInstalledExtensions(new Set([...userState.installed, ...builtinIds]));
      if (userState.enabled) setEnabledExtensions(new Set(userState.enabled));
      setExtensionSettings(userState.extensionSettings || []);
    } catch (err) {
      console.warn('[Extensions] Refresh failed:', err);
    } finally {
      setTimeout(() => setIsRefreshing(false), 400);
    }
  }, []);

  const handleEnableAll = useCallback(async () => {
    try {
      const res = await bulkEnableExtensions(true);
      setEnabledExtensions(new Set(res.enabled || []));
    } catch (err) {
      console.error('[Extensions] Enable all error:', err);
    }
  }, []);

  const handleDisableAll = useCallback(async () => {
    try {
      const res = await bulkEnableExtensions(false);
      setEnabledExtensions(new Set(res.enabled || []));
    } catch (err) {
      console.error('[Extensions] Disable all error:', err);
    }
  }, []);

  const handleShowDetails = useCallback((id) => {
    setExpandedExtension(prev => prev === id ? null : id);
    setActiveMenuId(null);
  }, []);

  const installedCount = useMemo(
    () => extensionsCatalog.filter(e => installedExtensions.has(e.id) || e.builtin).length,
    [extensionsCatalog, installedExtensions]
  );

  const enabledCount = useMemo(
    () => extensionsCatalog.filter(e => enabledExtensions.has(e.id)).length,
    [extensionsCatalog, enabledExtensions]
  );

  const updateCount = useMemo(
    () => extensionsCatalog.filter(e => e.hasUpdate && installedExtensions.has(e.id)).length,
    [extensionsCatalog, installedExtensions]
  );

  // ── Keyboard navigation handler ──
  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Escape') {
      if (contextMenu) { setContextMenu(null); return; }
      if (expandedExtension) { setExpandedExtension(null); return; }
      if (searchQuery) { setSearchQuery(''); return; }
      setShowSearchHistory(false);
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setFocusedIndex(prev => Math.min(prev + 1, sortedExtensions.length - 1));
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setFocusedIndex(prev => Math.max(prev - 1, 0));
    }
    if (e.key === 'Enter' && focusedIndex >= 0 && sortedExtensions[focusedIndex]) {
      e.preventDefault();
      const ext = sortedExtensions[focusedIndex];
      handleShowDetails(ext.id);
    }
  }, [sortedExtensions, focusedIndex, contextMenu, expandedExtension, searchQuery, handleShowDetails]);

  // Scroll focused item into view
  useEffect(() => {
    const el = listRef.current?.querySelector('[data-focused="true"]');
    el?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [focusedIndex]);

  // ── Search history ──
  const handleSearchChange = useCallback((value) => {
    setSearchQuery(value);
    setFocusedIndex(-1);
    setShowSearchHistory(false);
  }, []);

  const handleSearchSubmit = useCallback(() => {
    if (searchQuery.trim()) {
      setSearchHistory(prev => {
        const next = [searchQuery.trim(), ...prev.filter(s => s !== searchQuery.trim())];
        return next.slice(0, 10);
      });
    }
    setShowSearchHistory(false);
  }, [searchQuery]);

  const handleSearchFocus = useCallback(() => {
    if (!searchQuery && searchHistory.length > 0) {
      setShowSearchHistory(true);
    }
  }, [searchQuery, searchHistory]);

  // ── Right-click context menu ──
  const handleContextMenu = useCallback((e, extensionId) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ x: e.clientX, y: e.clientY, extensionId });
    setActiveMenuId(null);
  }, []);

  // Close context menu on outside click
  useEffect(() => {
    if (!contextMenu) return;
    const close = (e) => {
      if (!e.target.closest('[data-context-menu]')) setContextMenu(null);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [contextMenu]);

  // ── VSIX drag-and-drop ──
  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(async (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = Array.from(e.dataTransfer.files).filter(f => f.name.endsWith('.vsix'));
    for (const file of files) {
      try {
        await installVsix(file.name);
        handleRefresh();
      } catch (err) {
        console.error('[Extensions] VSIX install error:', err);
      }
    }
  }, [handleRefresh]);

  // ── Review submission ──
  const handleSubmitReview = useCallback(async (extensionId) => {
    if (submittingReview) return;
    setSubmittingReview(true);
    try {
      await submitReview(extensionId, reviewForm.rating, reviewForm.title, reviewForm.text);
      setReviewForm({ rating: 5, title: '', text: '' });
      // Refresh reviews
      const details = await fetchExtensionDetails(extensionId);
      setReviewsCache(prev => ({ ...prev, [extensionId]: details.reviews || [] }));
    } catch (err) {
      console.error('[Extensions] Review error:', err);
    } finally {
      setSubmittingReview(false);
    }
  }, [reviewForm, submittingReview]);

  const currentSort = SORT_OPTIONS.find(s => s.id === sortBy);
  const currentFilter = FILTER_OPTIONS.find(f => f.id === filterBy);

  return (
    <div className="flex flex-col h-full relative">
      {/* Ambient top glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[60%] h-[1px] pointer-events-none z-10"
        style={{ background: 'linear-gradient(90deg, transparent, rgba(184,148,80,0.2), transparent)', boxShadow: '0 0 30px rgba(184,148,80,0.1)' }} />

      {/* ── HEADER ── */}
      <div className="flex-shrink-0 relative z-10">
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: 'linear-gradient(180deg, rgba(12,12,24,0.95) 0%, rgba(0,0,0,0.95) 100%)' }} />
        <div className="flex items-center justify-between px-3 py-[10px] relative z-10">
          <div className="flex items-center gap-2">
            <Puzzle size={11} className="text-[rgba(255,255,255,0.3)]" />
            <span className="text-[10px] font-semibold uppercase tracking-[1.2px] text-[rgba(255,255,255,0.25)]">
              Extensions
            </span>
            <span className="text-[8px] text-[rgba(255,255,255,0.12)] font-mono">◆</span>
            <span className="text-[9px] font-mono" style={{ color: 'rgba(255,255,255,0.18)' }}>
              {installedCount}/{extensionsCatalog.length}
            </span>
          </div>
          <div className="flex items-center gap-1">
            {/* Enable count */}
            <span className="text-[8px] font-mono" style={{ color: 'rgba(48,209,88,0.4)' }}>{enabledCount} active</span>
            {/* Update badge */}
            {updateCount > 0 && (
              <span className="text-[8px] px-1.5 py-[1px] rounded-full font-mono"
                style={{ background: 'rgba(255,214,10,0.1)', border: '1px solid rgba(255,214,10,0.15)', color: 'rgba(255,214,10,0.6)' }}>
                {updateCount} update{updateCount !== 1 ? 's' : ''}
              </span>
            )}
          </div>
        </div>
        <div className="mx-3 h-px relative overflow-hidden">
          <div className="absolute inset-0" style={{ background: 'linear-gradient(90deg, transparent, rgba(184,148,80,0.15), rgba(255,255,255,0.06), transparent)' }} />
        </div>
      </div>

      {/* ── ACTION BAR (Search + Toolbar) ── */}
      <div className="flex-shrink-0 relative z-10 px-3 pt-2 pb-1">
        {/* Search */}
        <div className="relative group" style={{ position: 'relative' }}>
          <Search size={11} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[rgba(255,255,255,0.2)] group-focus-within:text-[rgba(255,255,255,0.5)] transition-colors" strokeWidth={1.5} />
          <input
            ref={inputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleSearchSubmit(); if (e.key === 'Escape') { setShowSearchHistory(false); setSearchQuery(''); } if (e.key === 'ArrowDown') { e.preventDefault(); setFocusedIndex(0); listRef.current?.focus(); } }}
            onFocus={handleSearchFocus}
            onBlur={() => setTimeout(() => setShowSearchHistory(false), 200)}
            placeholder="Search extensions..."
            className="w-full rounded-lg pl-8 pr-8 py-1.5 text-[11px] text-[rgba(255,255,255,0.7)] placeholder:text-[rgba(255,255,255,0.15)] transition-all outline-none"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}
          />
          {searchQuery && (
            <motion.button
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              onClick={() => { setSearchQuery(''); setShowSearchHistory(false); }}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 rounded transition-colors"
              style={{ color: 'rgba(255,255,255,0.2)' }}
              whileHover={{ color: 'rgba(255,255,255,0.6)', backgroundColor: 'rgba(255,255,255,0.08)' }}
            >
              <X size={10} strokeWidth={1.5} />
            </motion.button>
          )}

          {/* ── Search History Dropdown ── */}
          <AnimatePresence>
            {showSearchHistory && searchHistory.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                className="absolute top-full left-0 right-0 mt-1 z-50 overflow-hidden"
                style={{
                  background: 'rgba(18,18,22,0.95)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  borderRadius: '8px',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
                  backdropFilter: 'blur(40px)',
                }}
              >
                <div className="px-3 py-1.5 text-[8px] uppercase tracking-[0.5px]" style={{ color: 'rgba(255,255,255,0.12)' }}>
                  Recent Searches
                </div>
                {searchHistory.map((q, i) => (
                  <motion.button
                    key={q + i}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.02 }}
                    onClick={() => { setSearchQuery(q); handleSearchSubmit(); }}
                    className="w-full flex items-center gap-2 px-3 py-1.5 text-[11px] transition-all text-left"
                    style={{ color: 'rgba(255,255,255,0.4)' }}
                    whileHover={{ background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.6)' }}
                  >
                    <Clock size={10} style={{ color: 'rgba(255,255,255,0.12)' }} />
                    <span className="flex-1 truncate">{q}</span>
                    <X
                      size={9}
                      style={{ color: 'rgba(255,255,255,0.12)' }}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSearchHistory(prev => prev.filter((_, idx) => idx !== i));
                      }}
                    />
                  </motion.button>
                ))}
                <div className="px-3 py-1.5 border-t" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
                  <button
                    onClick={() => setSearchHistory([])}
                    className="text-[9px]"
                    style={{ color: 'rgba(248,113,113,0.4)' }}
                  >
                    Clear History
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Toolbar row */}
        <div className="flex items-center gap-1 mt-1.5">
          {/* View switcher */}
          <Dropdown
            align="left"
            selectedId={activeView}
            items={VIEW_OPTIONS}
            onSelect={setActiveView}
            trigger={
              <motion.button
                whileHover={{ background: 'rgba(255,255,255,0.04)' }}
                className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] transition-all"
                style={{ color: 'rgba(255,255,255,0.3)', background: 'rgba(255,255,255,0.02)' }}
              >
                <Globe size={10} />
                <span className="max-w-[60px] truncate">{VIEW_OPTIONS.find(v => v.id === activeView)?.label}</span>
                <svg width="6" height="6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="opacity-40"><polyline points="6 9 12 15 18 9" /></svg>
              </motion.button>
            }
          />

          {/* Sort dropdown */}
          <Dropdown
            align="left"
            selectedId={sortBy}
            items={SORT_OPTIONS}
            onSelect={setSortBy}
            trigger={
              <motion.button
                whileHover={{ background: 'rgba(255,255,255,0.04)' }}
                className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] transition-all"
                style={{ color: 'rgba(255,255,255,0.25)', background: 'rgba(255,255,255,0.02)' }}
                title={currentSort?.label}
              >
                <ArrowUpDown size={9} />
              </motion.button>
            }
          />

          {/* Filter dropdown */}
          <Dropdown
            align="left"
            selectedId={filterBy}
            items={FILTER_OPTIONS}
            onSelect={setFilterBy}
            trigger={
              <motion.button
                whileHover={{ background: 'rgba(255,255,255,0.04)' }}
                className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] transition-all"
                style={{ color: 'rgba(255,255,255,0.25)', background: 'rgba(255,255,255,0.02)' }}
                title={currentFilter?.label}
              >
                <Filter size={9} />
              </motion.button>
            }
          />

          <div className="flex-1" />

          {/* Refresh */}
          <motion.button
            whileHover={{ color: 'rgba(255,255,255,0.5)', background: 'rgba(255,255,255,0.04)' }}
            whileTap={{ scale: 0.9 }}
            onClick={handleRefresh}
            className="p-1 rounded-md transition-all"
            style={{ color: 'rgba(255,255,255,0.2)' }}
            title="Refresh Extensions"
          >
            <RefreshCw size={11} className={isRefreshing ? 'animate-spin' : ''} />
          </motion.button>

          {/* More Actions */}
          <Dropdown
            align="right"
            items={[
              { id: 'enable-all', label: 'Enable All Extensions', icon: Eye },
              { id: 'disable-all', label: 'Disable All Extensions', icon: EyeOff },
              { type: 'divider' },
              { id: 'auto-update', label: `Auto-Update: ${autoUpdate ? 'ON' : 'OFF'}`, icon: RotateCw },
              { type: 'divider' },
              { id: 'check-updates', label: 'Check for Updates', icon: Clock },
            ]}
            onSelect={(id) => {
              if (id === 'enable-all') handleEnableAll();
              if (id === 'disable-all') handleDisableAll();
              if (id === 'auto-update') setAutoUpdate(!autoUpdate);
              if (id === 'check-updates') handleRefresh();
            }}
            trigger={
              <motion.button
                whileHover={{ color: 'rgba(255,255,255,0.5)', background: 'rgba(255,255,255,0.04)' }}
                whileTap={{ scale: 0.9 }}
                className="p-1 rounded-md transition-all"
                style={{ color: 'rgba(255,255,255,0.2)' }}
                title="More Actions"
              >
                <SlidersHorizontal size={11} />
              </motion.button>
            }
          />
        </div>
      </div>

      {/* ── CATEGORY TABS ── */}
      <div className="px-3 pb-1 relative z-10">
        <div className="flex gap-1 flex-wrap">
          {CATEGORIES.map((cat) => {
            const isActive = activeCategory === cat.id;
            const Icon = cat.icon;
            return (
              <motion.button
                key={cat.id}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setActiveCategory(cat.id)}
                className="flex items-center gap-1 px-2 py-1 rounded-lg text-[9px] font-medium transition-all"
                style={{
                  background: isActive ? 'rgba(184,148,80,0.12)' : 'rgba(255,255,255,0.03)',
                  border: `1px solid ${isActive ? 'rgba(184,148,80,0.2)' : 'rgba(255,255,255,0.05)'}`,
                  color: isActive ? 'rgba(184,148,80,0.8)' : 'rgba(255,255,255,0.3)',
                }}
              >
                <Icon size={9} />
                {cat.label}
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* ── RESULTS COUNT ── */}
      {searchQuery && (
        <div className="px-4 py-0.5 relative z-10">
          <span className="text-[9px]" style={{ color: 'rgba(255,255,255,0.12)' }}>
            {sortedExtensions.length} result{sortedExtensions.length !== 1 ? 's' : ''} for "{searchQuery}"
            {filterBy !== 'all' && ` • Filter: ${currentFilter?.label}`}
            {activeView !== 'marketplace' && ` • View: ${VIEW_OPTIONS.find(v => v.id === activeView)?.label}`}
          </span>
        </div>
      )}

      {/* ── DIVIDER ── */}
      <div className="mx-3 h-px mb-1 relative z-10">
        <div className="absolute inset-0" style={{ background: 'rgba(255,255,255,0.03)' }} />
      </div>

      {/* ── VSIX Drop Zone ── */}
      <AnimatePresence>
        {isDragOver && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 flex items-center justify-center pointer-events-none"
            style={{
              background: 'rgba(184,148,80,0.08)',
              backdropFilter: 'blur(4px)',
            }}
          >
            <div className="flex flex-col items-center gap-2 p-6 rounded-2xl"
              style={{
                background: 'rgba(18,18,22,0.9)',
                border: '2px dashed rgba(184,148,80,0.3)',
              }}
            >
              <Upload size={28} style={{ color: 'rgba(184,148,80,0.5)' }} />
              <p className="text-[12px] font-semibold" style={{ color: 'rgba(184,148,80,0.7)' }}>Drop .vsix to Install</p>
              <p className="text-[9px]" style={{ color: 'rgba(255,255,255,0.2)' }}>Drop VSIX extension packages here</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Right-click Context Menu ── */}
      <AnimatePresence>
        {contextMenu && (
          <motion.div
            data-context-menu
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed z-[9999] min-w-[160px]"
            style={{
              left: contextMenu.x,
              top: contextMenu.y,
              background: 'rgba(18,18,22,0.95)',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: '8px',
              boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
              backdropFilter: 'blur(40px)',
            }}
          >
            <div className="py-1">
              {(() => {
                const ext = extensionsCatalog.find(e => e.id === contextMenu.extensionId);
                if (!ext) return null;
                const isInst = installedExtensions.has(ext.id);
                const isEnab = enabledExtensions.has(ext.id);
                const isBlt = ext.builtin;
                const items = [];
                items.push({ id: 'details', label: 'View Details', icon: Info });
                if (!isBlt) {
                  items.push({ id: 'enable-disable', label: isEnab ? 'Disable' : 'Enable', icon: isEnab ? EyeOff : Eye });
                  items.push({ type: 'divider' });
                  if (isInst && ext.hasUpdate) items.push({ id: 'update', label: `Update to v${ext.latestVersion}`, icon: Download });
                  items.push({ id: isInst ? 'uninstall' : 'install', label: isInst ? 'Uninstall' : 'Install', icon: isInst ? Trash2 : Download, danger: !isInst ? false : true });
                }
                return items.map((item, idx) => {
                  if (item.type === 'divider') {
                    return <div key={`d-${idx}`} className="my-1 mx-3" style={{ height: '1px', background: 'rgba(255,255,255,0.06)' }} />;
                  }
                  const Icon = item.icon;
                  return (
                    <motion.button
                      key={item.id}
                      whileHover={{ background: 'rgba(255,255,255,0.04)' }}
                      onClick={() => {
                        setContextMenu(null);
                        if (item.id === 'details') handleShowDetails(ext.id);
                        if (item.id === 'install' || item.id === 'uninstall' || item.id === 'update') handleToggleInstall(ext.id);
                        if (item.id === 'enable-disable') handleToggleEnable(ext.id);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-1.5 text-[10px] transition-all cursor-pointer"
                      style={{ color: item.danger ? 'rgba(248,113,113,0.6)' : 'rgba(255,255,255,0.4)' }}
                    >
                      {Icon && <Icon size={11} />}
                      <span className="flex-1 text-left">{item.label}</span>
                    </motion.button>
                  );
                });
              })()}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── EXTENSION LIST ── */}
      <div
        ref={listRef}
        className="flex-1 overflow-y-auto relative z-10"
        onKeyDown={handleKeyDown}
        tabIndex={0}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <AnimatePresence mode="wait">
          {sortedExtensions.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-12 px-6 text-center"
            >
              <div className="w-10 h-10 rounded-2xl flex items-center justify-center mb-3"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
                <Puzzle size={18} style={{ color: 'rgba(255,255,255,0.1)' }} />
              </div>
              <p className="text-[11px] font-medium" style={{ color: 'rgba(255,255,255,0.2)' }}>
                {searchQuery ? `No extensions found` : activeView === 'updates' ? 'All extensions are up to date' : 'No extensions in this view'}
              </p>
              <p className="text-[9px] mt-1" style={{ color: 'rgba(255,255,255,0.12)' }}>
                {searchQuery ? 'Try adjusting your search or filters' : 'Switch to a different view or category'}
              </p>
            </motion.div>
          ) : (
            <motion.div
              key="results"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="pb-4"
            >
              {/* Featured spotlight (marketplace view, no search, no category filter) */}
              {activeView === 'marketplace' && !searchQuery && activeCategory === 'all' && (
                <FeaturedSpotlight
                  extensions={featuredExtensions}
                  installedExtensions={installedExtensions}
                  onToggleInstall={handleToggleInstall}
                />
              )}

              {/* Updates Available section */}
              {activeView === 'marketplace' && updateCount > 0 && (
                <>
                  <SectionHeader
                    icon={AlertCircle}
                    title="Updates Available"
                    count={updateCount}
                    actions={
                      <motion.button
                        whileHover={{ color: 'rgba(255,214,10,0.6)' }}
                        onClick={handleRefresh}
                        className="text-[9px]"
                        style={{ color: 'rgba(255,214,10,0.3)' }}
                      >
                        Check All
                      </motion.button>
                    }
                  />
                  {extensionsCatalog.filter(e => e.hasUpdate && installedExtensions.has(e.id)).map((ext, idx) => (
                    <ExtensionCard
                      key={ext.id}
                      extension={ext}
                      installed={true}
                      enabled={enabledExtensions.has(ext.id)}
                      isInstalling={isInstalling}
                      activeMenuId={activeMenuId}
                      isExpanded={expandedExtension === ext.id}
                      isRefreshing={isRefreshing}
                      isFocused={focusedIndex >= 0 && sortedExtensions.indexOf(ext) === focusedIndex}
                      onContextMenu={handleContextMenu}
                      onSetActiveMenu={setActiveMenuId}
                      onToggleInstall={handleToggleInstall}
                      onToggleEnable={handleToggleEnable}
                      onShowDetails={handleShowDetails}
                      reviewForm={reviewForm}
                      setReviewForm={setReviewForm}
                      onReviewSubmit={handleSubmitReview}
                      submittingReview={submittingReview}
                    />
                  ))}
                  <div className="mx-4 my-2 h-px" style={{ background: 'rgba(255,255,255,0.03)' }} />
                </>
              )}

              {/* Installed section */}
              {sortedExtensions.some((e) => installedExtensions.has(e.id)) && (
                <>
                  <SectionHeader
                    icon={Check}
                    title="Installed"
                    count={sortedExtensions.filter(e => installedExtensions.has(e.id)).length}
                  />
                  {sortedExtensions
                    .filter((e) => installedExtensions.has(e.id))
                    .map((ext) => (
                      <ExtensionCard
                        key={ext.id}
                        extension={ext}
                        installed={true}
                        enabled={enabledExtensions.has(ext.id)}
                        isInstalling={isInstalling}
                        activeMenuId={activeMenuId}
                        isExpanded={expandedExtension === ext.id}
                        isRefreshing={isRefreshing}
                        isFocused={focusedIndex >= 0 && sortedExtensions.indexOf(ext) === focusedIndex}
                        onContextMenu={handleContextMenu}
                        onSetActiveMenu={setActiveMenuId}
                        onToggleInstall={handleToggleInstall}
                        onToggleEnable={handleToggleEnable}
                        onShowDetails={handleShowDetails}
                        reviewForm={reviewForm}
                        setReviewForm={setReviewForm}
                        onReviewSubmit={handleSubmitReview}
                        submittingReview={submittingReview}
                      />
                    ))}
                  <div className="mx-4 my-2 h-px" style={{ background: 'rgba(255,255,255,0.03)' }} />
                </>
              )}

              {/* Available / All section */}
              {activeView !== 'installed' && sortedExtensions.some(e => !installedExtensions.has(e.id)) && (
                <>
                  <SectionHeader
                    icon={activeView === 'builtin' ? Layers : Globe}
                    title={activeView === 'popular' ? 'Most Popular' : activeView === 'updates' ? 'Available Updates' : activeView === 'builtin' ? 'Built-in' : 'Available'}
                    count={sortedExtensions.filter(e => !installedExtensions.has(e.id) || (activeView === 'updates')).length}
                  />
                  {sortedExtensions
                    .filter((e) => !installedExtensions.has(e.id))
                    .map((ext) => (
                      <ExtensionCard
                        key={ext.id}
                        extension={ext}
                        installed={false}
                        enabled={true}
                        isInstalling={isInstalling}
                        activeMenuId={activeMenuId}
                        isExpanded={expandedExtension === ext.id}
                        isRefreshing={isRefreshing}
                        isFocused={focusedIndex >= 0 && sortedExtensions.indexOf(ext) === focusedIndex}
                        onContextMenu={handleContextMenu}
                        onSetActiveMenu={setActiveMenuId}
                        onToggleInstall={handleToggleInstall}
                        onToggleEnable={handleToggleEnable}
                        onShowDetails={handleShowDetails}
                        reviewForm={reviewForm}
                        setReviewForm={setReviewForm}
                        onReviewSubmit={handleSubmitReview}
                        submittingReview={submittingReview}
                      />
                    ))}
                </>
              )}

              {/* Built-in section at bottom for installed view */}
              {activeView === 'installed' && sortedExtensions.some(e => e.builtin) && (
                <>
                  <div className="mx-4 my-2 h-px" style={{ background: 'rgba(255,255,255,0.03)' }} />
                  <SectionHeader icon={Layers} title="Built-in" count={sortedExtensions.filter(e => e.builtin).length} />
                  {sortedExtensions.filter(e => e.builtin).map((ext) => (
                    <ExtensionCard
                      key={ext.id}
                      extension={ext}
                      installed={true}
                      enabled={enabledExtensions.has(ext.id)}
                      isInstalling={isInstalling}
                      activeMenuId={activeMenuId}
                      isExpanded={expandedExtension === ext.id}
                      isRefreshing={isRefreshing}
                      isFocused={focusedIndex >= 0 && sortedExtensions.indexOf(ext) === focusedIndex}
                      onContextMenu={handleContextMenu}
                      onSetActiveMenu={setActiveMenuId}
                      onToggleInstall={handleToggleInstall}
                      onToggleEnable={handleToggleEnable}
                      onShowDetails={handleShowDetails}
                      reviewForm={reviewForm}
                      setReviewForm={setReviewForm}
                      onReviewSubmit={handleSubmitReview}
                      submittingReview={submittingReview}
                    />
                  ))}
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── BOTTOM STATUS BAR ── */}
      <div className="flex-shrink-0 relative z-20 px-3 py-1.5 flex items-center justify-between"
        style={{
          background: 'rgba(12,12,14,0.95)',
          borderTop: '1px solid rgba(255,255,255,0.04)',
        }}
      >
        <div className="flex items-center gap-2">
          <span className="text-[8px] font-mono" style={{ color: 'rgba(255,255,255,0.1)' }}>
            {extensionsCatalog.length} total
          </span>
          <span className="text-[8px]" style={{ color: 'rgba(48,209,88,0.25)' }}>•</span>
          <span className="text-[8px] font-mono" style={{ color: 'rgba(48,209,88,0.3)' }}>
            {installedCount} installed
          </span>
          <span className="text-[8px]" style={{ color: 'rgba(255,255,255,0.1)' }}>•</span>
          <span className="text-[8px] font-mono" style={{ color: 'rgba(160,120,64,0.3)' }}>
            {extensionsCatalog.filter(e => e.builtin).length} built-in
          </span>
        </div>
        <div className="flex items-center gap-1">
          {updateCount > 0 && (
            <span className="flex items-center gap-1 text-[8px]" style={{ color: 'rgba(255,214,10,0.4)' }}>
              <Download size={8} />
              {updateCount} pending
            </span>
          )}
          <span className="text-[8px]" style={{ color: autoUpdate ? 'rgba(48,209,88,0.25)' : 'rgba(255,255,255,0.1)' }}>
            Auto-update: {autoUpdate ? 'ON' : 'OFF'}
          </span>
        </div>
      </div>
    </div>
  );
}