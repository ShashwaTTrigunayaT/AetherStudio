import React, { useRef, useState, useMemo, useCallback } from 'react';
import { motion, useMotionValue, useTransform, useSpring } from 'framer-motion';
import {
  Folder, Users, Clock, ChevronRight, MoreHorizontal,
  Star, GitBranch, FileText, Zap,
} from 'lucide-react';
import Badge from '../Common/Badge';
import Dropdown, { DropdownItem } from '../Common/Dropdown';

const GRADIENT_PRESETS = [
  { from: '#b89450', to: '#d4bc80', glow: 'rgba(184,148,80,0.15)', borderGlow: 'rgba(184,148,80,0.4)' },
  { from: '#a07840', to: '#c0a078', glow: 'rgba(160,120,64,0.15)', borderGlow: 'rgba(160,120,64,0.4)' },
  { from: '#30d158', to: '#dcccb5', glow: 'rgba(48,209,88,0.15)', borderGlow: 'rgba(48,209,88,0.4)' },
  { from: '#ff9f0a', to: '#ffcc00', glow: 'rgba(255,159,10,0.15)', borderGlow: 'rgba(255,159,10,0.4)' },
  { from: '#ff453a', to: '#ff6961', glow: 'rgba(255,69,58,0.15)', borderGlow: 'rgba(255,69,58,0.4)' },
  { from: '#bf5af2', to: '#d48aff', glow: 'rgba(191,90,242,0.15)', borderGlow: 'rgba(191,90,242,0.4)' },
];

const LANGUAGE_BADGES = {
  javascript: { label: 'JS', color: '#f0db4f', bg: 'rgba(240,219,79,0.15)' },
  typescript: { label: 'TS', color: '#3178c6', bg: 'rgba(49,120,198,0.15)' },
  python: { label: 'PY', color: '#3572A5', bg: 'rgba(53,114,165,0.15)' },
  jsx: { label: 'JSX', color: '#61dafb', bg: 'rgba(97,218,251,0.15)' },
  tsx: { label: 'TSX', color: '#3178c6', bg: 'rgba(49,120,198,0.15)' },
  html: { label: 'HTML', color: '#e34c26', bg: 'rgba(227,76,38,0.15)' },
  css: { label: 'CSS', color: '#563d7c', bg: 'rgba(86,61,124,0.15)' },
  json: { label: 'JSON', color: '#292929', bg: 'rgba(41,41,41,0.15)' },
};

// ─── Animated Gradient Border ─────────────────────────────
function AnimatedBorder({ gradient, isHovered }) {
  return (
    <motion.div
      className="absolute inset-0 rounded-[16px] pointer-events-none"
      style={{ zIndex: 2 }}
      animate={{ opacity: isHovered ? 1 : 0 }}
      transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
    >
      {/* Rotating conic gradient border */}
      <motion.div
        className="absolute inset-0 rounded-[16px]"
        style={{
          background: `conic-gradient(from var(--angle, 0deg), ${gradient?.from}00 0%, ${gradient?.from}40 25%, ${gradient?.to}40 50%, ${gradient?.from}40 75%, ${gradient?.from}00 100%)`,
          WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
          WebkitMaskComposite: 'xor',
          maskComposite: 'exclude',
          padding: '1.5px',
        }}
        animate={{ '--angle': ['0deg', '360deg'] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
      />
      {/* Outer glow */}
      <div
        className="absolute inset-0 rounded-[16px] opacity-50"
        style={{ boxShadow: `0 0 40px ${gradient?.glow}, inset 0 0 20px ${gradient?.glow}` }}
      />
    </motion.div>
  );
}

// ─── Collaborator Avatars ─────────────────────────────────
function CollaboratorStrip({ count = 0 }) {
  if (count === 0) return null;

  const colors = ['#b89450', '#30d158', '#ff9f0a', '#ff453a', '#bf5af2', '#a07840'];
  const maxAvatars = Math.min(count, 4);

  return (
    <div className="flex items-center">
      <div className="flex -space-x-1.5">
        {Array.from({ length: maxAvatars }, (_, i) => (
          <div
            key={i}
            className="w-[18px] h-[18px] rounded-full border-2 border-[#0c0c10] flex items-center justify-center text-[7px] font-bold select-none"
            style={{
              background: colors[i % colors.length],
              zIndex: maxAvatars - i,
            }}
          >
            {String.fromCharCode(65 + i)}
          </div>
        ))}
      </div>
      {count > 4 && (
        <span className="ml-1 text-[9px] font-semibold" style={{ color: 'rgba(255,255,255,0.2)' }}>
          +{count - 4}
        </span>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────
export default function WorkspaceCard({ workspace, onClick, onDelete, index = 0 }) {
  const cardRef = useRef(null);
  const [isHovered, setIsHovered] = useState(false);

  // 3D tilt motion values
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [6, -6]), { stiffness: 300, damping: 30 });
  const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-6, 6]), { stiffness: 300, damping: 30 });

  const handleMouseMove = useCallback((e) => {
    const rect = cardRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    mouseX.set(x);
    mouseY.set(y);
  }, [mouseX, mouseY]);

  const handleMouseLeave = useCallback(() => {
    mouseX.set(0);
    mouseY.set(0);
    setIsHovered(false);
  }, [mouseX, mouseY]);

  const gradient = GRADIENT_PRESETS[index % GRADIENT_PRESETS.length];
  const collaboratorCount = workspace.collaboratorIds?.length || 0;
  const fileCount = workspace.fileCount || 0;

  // Relative time for last activity
  const lastActive = useMemo(() => {
    if (!workspace.updatedAt) return null;
    const diff = Date.now() - new Date(workspace.updatedAt).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    if (days < 7) return `${days}d ago`;
    return new Date(workspace.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }, [workspace.updatedAt]);

  const langHint = workspace.tags?.[0] || workspace.language || workspace.name?.split('.').pop();
  const langBadge = langHint ? LANGUAGE_BADGES[langHint.toLowerCase()] : null;

  return (
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0, y: 30, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: index * 0.05, duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
      onClick={onClick}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick?.(); } }}
      role="button"
      tabIndex={0}
      onMouseEnter={() => setIsHovered(true)}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        rotateX,
        rotateY,
        transformStyle: 'preserve-3d',
        perspective: 1200,
        background: 'rgba(10,10,14,0.85)',
        backdropFilter: 'blur(20px) saturate(1.5)',
        WebkitBackdropFilter: 'blur(20px) saturate(1.5)',
        borderColor: 'rgba(255,255,255,0.06)',
        boxShadow: '0 8px 40px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.03)',
      }}
      whileHover={{
        borderColor: `${gradient.from}40`,
        boxShadow: `0 32px 80px rgba(0,0,0,0.6), 0 0 0 1px ${gradient.from}20, 0 0 60px ${gradient.glow}, inset 0 1px 0 rgba(255,255,255,0.06)`,
        y: -10,
        scale: 1.015,
        transition: { type: 'spring', stiffness: 300, damping: 25, mass: 0.8 },
      }}
      className="group relative cursor-pointer overflow-hidden focus-within:z-10 rounded-[16px] border transition-colors duration-300"
    >
      {/* Grain texture */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.015] z-0"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'repeat',
          backgroundSize: '128px 128px',
        }}
      />

      {/* Animated gradient border */}
      <AnimatedBorder gradient={gradient} isHovered={isHovered} />

      {/* Background gradient overlay */}
      <motion.div
        className="absolute inset-0 rounded-[16px] pointer-events-none z-[1]"
        animate={{ opacity: isHovered ? 1 : 0 }}
        transition={{ duration: 0.5 }}
        style={{ background: `linear-gradient(145deg, ${gradient.from}10, transparent 50%, ${gradient.to}06)` }}
      />

      {/* Hover sweep shimmer */}
      <motion.div
        className="absolute inset-0 pointer-events-none z-[1]"
        style={{
          background: `linear-gradient(105deg, transparent 20%, ${gradient.from}06 35%, ${gradient.from}10 45%, ${gradient.from}06 55%, transparent 70%)`,
          transform: 'translateX(-100%)',
        }}
        animate={{ x: isHovered ? '100%' : '-100%' }}
        transition={{ duration: 0.7, ease: [0.25, 0.1, 0.25, 1] }}
      />

      {/* Top animated accent bar */}
      <motion.div
        className="absolute top-0 left-3 right-3 h-[2.5px] rounded-full z-[3]"
        style={{ background: `linear-gradient(90deg, ${gradient.from}, ${gradient.to})` }}
        animate={{
          opacity: [0.4, 0.9, 0.4],
          boxShadow: [
            `0 0 6px ${gradient.glow}`,
            `0 0 18px ${gradient.borderGlow}`,
            `0 0 6px ${gradient.glow}`,
          ],
        }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Corner glow dots */}
      <div
        className="absolute top-0 right-0 w-24 h-24 rounded-tr-[16px] pointer-events-none z-[1] transition-opacity duration-500"
        style={{
          opacity: isHovered ? 1 : 0,
          background: `radial-gradient(circle at top right, ${gradient.from}15, transparent 70%)`,
        }}
      />
      <div
        className="absolute bottom-0 left-0 w-20 h-20 rounded-bl-[16px] pointer-events-none z-[1] transition-opacity duration-500"
        style={{
          opacity: isHovered ? 1 : 0,
          background: `radial-gradient(circle at bottom left, ${gradient.to}10, transparent 70%)`,
        }}
      />

      {/* ── Content ── */}
      <div className="relative p-5 z-[3]">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="relative" style={{ transform: 'translateZ(30px)' }}>
            <motion.div
              className="w-12 h-12 rounded-[14px] flex items-center justify-center flex-shrink-0"
              animate={{
                scale: isHovered ? 1.12 : 1,
                boxShadow: isHovered
                  ? `0 0 32px ${gradient.glow}, 0 8px 24px rgba(0,0,0,0.3)`
                  : `0 0 20px ${gradient.glow}, 0 4px 12px rgba(0,0,0,0.2)`,
              }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              style={{ background: `linear-gradient(145deg, ${gradient.from}20, ${gradient.to}08)` }}
            >
              <motion.div
                animate={{ rotate: isHovered ? [-5, 5, -5, 0] : 0 }}
                transition={{ duration: 0.5, ease: 'easeInOut' }}
              >
                <Folder size={22} style={{ color: gradient.from }} />
              </motion.div>
            </motion.div>

            {langBadge && (
              <motion.div
                className="absolute -bottom-1.5 -right-1.5 px-1.5 py-[1px] rounded-md text-[8px] font-bold border-2 select-none"
                style={{ background: langBadge.bg, borderColor: '#0c0c10', color: langBadge.color }}
                animate={{ scale: isHovered ? 1.1 : 1 }}
                transition={{ type: 'spring', stiffness: 300, damping: 15 }}
              >
                {langBadge.label}
              </motion.div>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            <motion.div
              animate={{ opacity: isHovered ? 1 : 0, x: isHovered ? 0 : 8 }}
              transition={{ duration: 0.2 }}
            >
              <div onClick={(e) => e.stopPropagation()}>
                <Dropdown
                  trigger={
                    <motion.button
                      whileHover={{ scale: 1.05, background: 'rgba(255,255,255,0.08)' }}
                      whileTap={{ scale: 0.95 }}
                      className="w-8 h-8 rounded-[8px] flex items-center justify-center"
                      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}
                    >
                      <MoreHorizontal size={14} style={{ color: 'rgba(255,255,255,0.35)' }} />
                    </motion.button>
                  }
                  align="right"
                >
                  <DropdownItem icon={Star}>Favorite</DropdownItem>
                  <DropdownItem icon={Users}>Share</DropdownItem>
                  <DropdownItem icon={GitBranch}>Duplicate</DropdownItem>
                  <DropdownItem divider />
                  <DropdownItem danger onClick={onDelete}>Delete</DropdownItem>
                </Dropdown>
              </div>
            </motion.div>
            <motion.div animate={{ x: isHovered ? 4 : 0 }} transition={{ duration: 0.2 }}>
              <ChevronRight
                size={18}
                className="transition-all duration-200"
                style={{
                  color: isHovered ? `${gradient.from}60` : 'rgba(255,255,255,0.08)',
                }}
              />
            </motion.div>
          </div>
        </div>

        {/* Name */}
        <motion.h3
          className="text-[17px] font-bold mb-1.5 truncate"
          animate={{
            color: isHovered ? '#ffffff' : '#f5f5f7',
            letterSpacing: isHovered ? '-0.02em' : '-0.01em',
          }}
          transition={{ duration: 0.2 }}
          style={{ transform: 'translateZ(20px)' }}
        >
          {workspace.name}
        </motion.h3>

        {/* Description */}
        <motion.p
          className="text-[12px] mb-3 line-clamp-2 min-h-[2.4em] leading-relaxed"
          animate={{ color: isHovered ? 'rgba(255,255,255,0.45)' : 'rgba(255,255,255,0.35)' }}
        >
          {workspace.description || <span style={{ color: 'rgba(255,255,255,0.15)' }}>No description</span>}
        </motion.p>

        {/* Tags */}
        {workspace.tags && workspace.tags.length > 0 && (
          <motion.div className="flex flex-wrap gap-1.5 mb-3" animate={{ opacity: isHovered ? 1 : 0.7 }}>
            {workspace.tags.slice(0, 3).map((tag) => (
              <Badge key={tag} variant="neutral" size="xs">{tag}</Badge>
            ))}
            {workspace.tags.length > 3 && (
              <Badge variant="neutral" size="xs">+{workspace.tags.length - 3}</Badge>
            )}
          </motion.div>
        )}

        {/* Divider */}
        <motion.div
          className="h-px mb-3"
          animate={{
            background: isHovered
              ? `linear-gradient(90deg, ${gradient.from}20, rgba(255,255,255,0.03) 60%, transparent)`
              : 'rgba(255,255,255,0.04)',
          }}
        />

        {/* Footer */}
        <div className="flex items-center justify-between" style={{ transform: 'translateZ(15px)' }}>
          <div className="flex items-center gap-3">
            {collaboratorCount > 0 && (
              <motion.div className="flex items-center gap-1.5" animate={{ opacity: isHovered ? 1 : 0.6 }}>
                <CollaboratorStrip count={collaboratorCount} />
              </motion.div>
            )}
            {fileCount > 0 && (
              <motion.span
                className="flex items-center gap-1 text-[11px]"
                style={{ color: 'rgba(255,255,255,0.25)' }}
                animate={{ opacity: isHovered ? 0.8 : 0.5 }}
              >
                <FileText size={10} />
                {fileCount} files
              </motion.span>
            )}
            {lastActive && (
              <motion.span
                className="flex items-center gap-1 text-[11px]"
                style={{ color: 'rgba(255,255,255,0.14)' }}
                animate={{ opacity: isHovered ? 0.6 : 0.4 }}
              >
                <Clock size={10} />
                {lastActive}
              </motion.span>
            )}
          </div>

          {/* Open indicator */}
          <motion.div
            className="flex items-center gap-1.5 text-[10px] font-semibold"
            initial={{ opacity: 0, x: -4 }}
            animate={{
              opacity: isHovered ? 1 : 0,
              x: isHovered ? 0 : -4,
              color: gradient.from,
            }}
            transition={{ duration: 0.2, delay: isHovered ? 0.05 : 0 }}
          >
            <Zap size={10} />
            Open
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
