import React from 'react';
import { motion } from 'framer-motion';

// ─── Studio Logo ─────────────────────────────────────────
// A minimal, ethereal "A" monogram — clean, modern letterform
// Represents "Aether" (upper sky/space) through an elegant single
// letterform with a subtle star accent at the apex.
//
// Variants:
//   icon  – icon only (default)
//   full  – icon + "AetherStudio" wordmark

export default function AetherStudioLogo({
  size = 32,
  variant = 'icon',
  className = '',
  animated = true,
  glow = false,
}) {
  const iconSize = variant === 'full' ? Math.round(size * 0.72) : size;

  const LogoMark = () => (
    <svg
      width={iconSize}
      height={iconSize}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="block"
      style={glow ? { filter: 'drop-shadow(0 0 16px rgba(255,255,255,0.12))' } : {}}
    >
      <defs>
        {/* Background glow */}
        <radialGradient id="aetherBg" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="rgba(255,255,255,0.07)" />
          <stop offset="60%" stopColor="rgba(255,255,255,0.02)" />
          <stop offset="100%" stopColor="transparent" />
        </radialGradient>

        {/* Stroke gradient — subtle silver sheen */}
        <linearGradient id="aetherStroke" x1="0" y1="0" x2="64" y2="64">
          <stop offset="0%" stopColor="rgba(255,255,255,0.85)" />
          <stop offset="50%" stopColor="rgba(255,255,255,0.55)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0.4)" />
        </linearGradient>

        {/* Accent glow */}
        <radialGradient id="aetherAccent" cx="50%" cy="30%" r="40%">
          <stop offset="0%" stopColor="rgba(255,255,255,0.15)" />
          <stop offset="100%" stopColor="transparent" />
        </radialGradient>
      </defs>

      {/* Background glow orb */}
      <motion.circle
        cx="32" cy="32" r="28"
        fill="url(#aetherBg)"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      />

      {/* Accent highlight — top area */}
      <ellipse cx="32" cy="16" rx="18" ry="14" fill="url(#aetherAccent)" />

      {/* ── The 'A' letterform ── */}

      {/* Left leg */}
      <motion.path
        d="M 32 8 L 12 58"
        stroke="url(#aetherStroke)"
        strokeWidth="1.6"
        strokeLinecap="round"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      />

      {/* Right leg */}
      <motion.path
        d="M 32 8 L 52 58"
        stroke="url(#aetherStroke)"
        strokeWidth="1.6"
        strokeLinecap="round"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
      />

      {/* Crossbar */}
      <motion.line
        x1="17" y1="42" x2="47" y2="42"
        stroke="rgba(255,255,255,0.35)"
        strokeWidth="1.2"
        strokeLinecap="round"
        initial={{ scaleX: 0, opacity: 0 }}
        animate={{ scaleX: 1, opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
        style={{ originX: 0.5, originY: 1 }}
      />

      {/* Apex star/sparkle */}
      <motion.g
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.25, ease: [0.34, 1.56, 0.64, 1] }}
      >
        {/* Outer glow ring */}
        <circle cx="32" cy="5" r="5" fill="white" opacity={0.08} />
        {/* Inner dot */}
        <motion.circle
          cx="32" cy="5" r="2.5"
          fill="white"
          opacity={0.7}
          animate={animated ? {
            opacity: [0.7, 1, 0.7],
            r: [2.5, 3, 2.5],
          } : { opacity: 0.7 }}
          transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
        />
      </motion.g>

      {/* Subtle floating particles */}
      {animated && [0, 1, 2].map((i) => (
        <motion.circle
          key={i}
          cx={20 + i * 12}
          cy={10 + i * 8}
          r={0.8}
          fill="white"
          opacity={0.15}
          animate={{
            opacity: [0.15, 0.4, 0.15],
            y: [-1, -3, -1],
            x: [0, i === 1 ? 1 : -1, 0],
          }}
          transition={{
            duration: 3 + i * 0.5,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: i * 0.6,
          }}
        />
      ))}
    </svg>
  );

  if (variant === 'full') {
    return (
      <div className={`flex items-center gap-3 ${className}`}>
        <LogoMark />
        <span
          className="font-semibold tracking-tight"
          style={{
            fontSize: Math.round(size * 0.36),
            color: '#f5f5f7',
            letterSpacing: '-0.02em',
          }}
        >
          AetherStudio
        </span>
      </div>
    );
  }

  return <LogoMark />;
}
