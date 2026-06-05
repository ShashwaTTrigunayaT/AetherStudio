import { useRef, useState, useMemo, useCallback } from 'react';
import AnimatedCounter from '../Common/AnimatedCounter';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';

// ─── Background photos matching each stat topic ───
const BG_PHOTOS = [
  // Workspace / Desk — laptop & coffee setup
  'https://images.unsplash.com/photo-1499750310107-5fef28a66643?q=80&w=600&h=400&fit=crop',
  // Collaboration / Team — people working together
  'https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=600&h=400&fit=crop',
  // Files / Documents — organized paperwork
  'https://images.unsplash.com/photo-1568667256549-094345857637?w=600&h=400&fit=crop',
  // System / Network — global connectivity
  'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=600&h=400&fit=crop',
  // Code theme (fallback)
  'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?q=80&w=600&h=400&fit=crop',
  // Tech theme (fallback)
  'https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=600&h=400&fit=crop',
];

// ─── Premium dark overlay gradients ───
// These let the photo show through while giving a rich, dark, premium look
const DARK_OVERLAYS = [
  // Main vignette: deep black at corners, fades toward center
  'linear-gradient(135deg, rgba(0,0,0,0.92) 0%, rgba(6,6,10,0.7) 30%, rgba(0,0,0,0.25) 55%, rgba(0,0,0,0.85) 100%)',
  // Bottom-to-top shadow for depth
  'linear-gradient(0deg, rgba(0,0,0,0.5) 0%, transparent 35%, rgba(0,0,0,0.1) 80%)',
];

// ─── Wave SVG Overlay (premium subtle white) ───
function WaveOverlay({ id }) {
  const gradId = `waveGradDark-${id}`;
  return (
    <svg
      className="absolute bottom-0 left-0 w-full pointer-events-none"
      viewBox="0 0 400 120"
      preserveAspectRatio="none"
      style={{ height: '40%', opacity: 0.6 }}
    >
      <defs>
        <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.02" />
          <stop offset="50%" stopColor="#ffffff" stopOpacity="0.06" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0.01" />
        </linearGradient>
      </defs>
      <path d="M0,80 C80,30 160,100 240,50 C320,0 360,70 400,40 L400,120 L0,120 Z" fill={`url(#${gradId})`} />
      <path d="M0,95 C100,65 180,110 280,75 C340,55 380,85 400,65 L400,120 L0,120 Z" fill="#ffffff" opacity="0.025" />
    </svg>
  );
}

// ─── Grid Overlay ───
function GridOverlay() {
  return (
    <div
      className="absolute inset-0 pointer-events-none"
      style={{
        opacity: 0.05,
        backgroundImage: [
          'linear-gradient(rgba(255,255,255,0.08) 1px, transparent 1px)',
          'linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px)',
        ].join(', '),
        backgroundSize: '28px 28px',
      }}
    />
  );
}

// ─── Premium dark/white glowing orbs ───
function OrbOverlay() {
  return (
    <>
      <div
        className="absolute rounded-full pointer-events-none"
        style={{
          width: '180px', height: '180px',
          top: '-30%', right: '-15%',
          background: 'radial-gradient(circle, rgba(255,255,255,0.04), transparent)',
          filter: 'blur(60px)',
        }}
      />
      <div
        className="absolute rounded-full pointer-events-none"
        style={{
          width: '120px', height: '120px',
          bottom: '0%', left: '-20%',
          background: 'radial-gradient(circle, rgba(255,255,255,0.025), transparent)',
          filter: 'blur(50px)',
        }}
      />
    </>
  );
}

// ─── Floating Particles ───
function FloatingParticles({ count }) {
  const particles = useMemo(() =>
    Array.from({ length: count || 5 }, (_, i) => ({
      size: 1.5 + (i % 3),
      x: 10 + (i * 19) % 80,
      y: 15 + (i * 23) % 70,
      delay: i * 0.7,
      duration: 3.5 + (i % 3) * 0.8,
    })), [count]);
  return (
    <>
      {particles.map((p, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full pointer-events-none"
          style={{
            width: p.size, height: p.size,
            left: p.x + '%', top: p.y + '%',
            background: 'rgba(255,255,255,0.18)',
            filter: 'blur(0.5px)',
          }}
          animate={{
            opacity: [0, 0.5, 0.1, 0.35, 0],
            y: [0, -8, 5, -10, 0],
            x: [0, 4, -3, 5, 0],
          }}
          transition={{
            duration: p.duration, delay: p.delay,
            repeat: Infinity, ease: 'easeInOut',
          }}
        />
      ))}
    </>
  );
}

// ─── Status Icon Wrapper (premium dark glass) ───
function StatusIcon({ icon: Icon, color, isHovered }) {
  return (
    <motion.div
      className="w-[38px] h-[38px] rounded-[10px] flex items-center justify-center flex-shrink-0"
      animate={{
        scale: isHovered ? 1.12 : 1,
      }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      style={{
        background: isHovered
          ? 'rgba(255,255,255,0.06)'
          : 'rgba(255,255,255,0.03)',
        backdropFilter: 'blur(12px) saturate(1.4)',
        WebkitBackdropFilter: 'blur(12px) saturate(1.4)',
        border: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      <Icon size={16} style={{ color, filter: 'drop-shadow(0 1px 4px rgba(0,0,0,0.3))' }} />
    </motion.div>
  );
}

// ─── Main Card Component ───
export default function ImageStatusCard({ stat, index }) {
  const [isHovered, setIsHovered] = useState(false);
  const ref = useRef(null);

  const idx = index || 0;
  const photoUrl = BG_PHOTOS[idx % BG_PHOTOS.length];
  const iconColor = stat.color || '#ffffff';
  const [imgError, setImgError] = useState(false);

  const darkBg = DARK_OVERLAYS.join(', ');

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [4, -4]), {
    stiffness: 350, damping: 25,
  });
  const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-4, 4]), {
    stiffness: 350, damping: 25,
  });

  const handleMouseMove = useCallback((e) => {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    mouseX.set(x);
    mouseY.set(y);
  }, [mouseX, mouseY]);

  const isNumeric = typeof stat.value === 'number';

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 24, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: idx * 0.06, duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        mouseX.set(0);
        mouseY.set(0);
      }}
      onMouseMove={handleMouseMove}
      style={{
        rotateX,
        rotateY,
        transformStyle: 'preserve-3d',
        perspective: 1000,
        borderColor: 'rgba(255,255,255,0.06)',
      }}
      whileHover={{
        y: -6,
        transition: { duration: 0.3, ease: [0.25, 0.1, 0.25, 1] },
      }}
      className="group relative overflow-hidden rounded-[14px] cursor-default border min-h-[230px]"
    >
      {/* ── Background layers ── */}
      <motion.div
        className="absolute inset-0"
        animate={{ scale: isHovered ? 1.08 : 1 }}
        transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
        style={{ willChange: 'transform' }}
      >
        {/* Photo layer */}
        {!imgError && (
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `url(${photoUrl})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              willChange: 'transform',
            }}
            onError={() => setImgError(true)}
          />
        )}
        {/* Premium dark gradient overlays */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: imgError
              ? 'linear-gradient(135deg, rgba(0,0,0,0.95) 0%, rgba(8,8,12,0.85) 100%)'
              : darkBg,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
      </motion.div>

      {/* ── Overlay Effects ── */}
      <WaveOverlay id={idx} />
      <GridOverlay />
      <OrbOverlay />
      <FloatingParticles count={5} />

      {/* White hover glow wash */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        animate={{ opacity: isHovered ? 1 : 0 }}
        transition={{ duration: 0.4 }}
        style={{
          background: 'linear-gradient(135deg, rgba(255,255,255,0.03), transparent 60%)',
        }}
      />

      {/* Silver sweep shimmer */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'linear-gradient(105deg, transparent 25%, rgba(255,255,255,0.02) 40%, rgba(255,255,255,0.04) 50%, rgba(255,255,255,0.02) 60%, transparent 75%)',
          transform: 'translateX(-100%)',
        }}
        animate={{ x: isHovered ? '100%' : '-100%' }}
        transition={{ duration: 0.7, ease: [0.25, 0.1, 0.25, 1] }}
      />

      {/* Silver border glow */}
      <motion.div
        className="absolute inset-0 rounded-[14px] pointer-events-none"
        animate={{
          opacity: isHovered ? 1 : 0,
          boxShadow: isHovered
            ? 'inset 0 0 0 1px rgba(255,255,255,0.12), 0 0 30px rgba(255,255,255,0.04)'
            : 'inset 0 0 0 1px rgba(255,255,255,0.04)',
        }}
        transition={{ duration: 0.3 }}
      />

      {/* Grain texture */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.025]"
        style={{
          backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\' opacity=\'0.5\'/%3E%3C/svg%3E")',
          backgroundSize: '128px 128px',
        }}
      />

      {/* ── Content ── */}
      <div
        className="relative z-[1] flex flex-col h-full p-5"
        style={{ transform: 'translateZ(24px)' }}
      >
        {/* Top row: icon + live dot */}
        <div className="flex items-center justify-between mb-auto">
          <StatusIcon icon={stat.icon} color={iconColor} isHovered={isHovered} />

          <motion.div
            className="w-[5px] h-[5px] rounded-full flex-shrink-0"
            animate={{
              opacity: isHovered ? 0.8 : 0.4,
              scale: isHovered ? [1, 1.3, 1] : 0.8,
            }}
            transition={{
              scale: {
                repeat: isHovered ? Infinity : 0,
                duration: 1.5,
              },
            }}
            style={{
              background: '#ffffff',
              boxShadow: '0 0 8px rgba(255,255,255,0.3)',
            }}
          />
        </div>

        {/* Value & Label */}
        <div className="mt-3">
          <p className="text-[30px] font-bold tracking-tight text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)]">
            {isNumeric ? <AnimatedCounter value={stat.value} /> : stat.value}
          </p>

          <p className="text-[13px] font-semibold mt-0.5 tracking-wide text-white/70 drop-shadow-[0_1px_4px_rgba(0,0,0,0.4)]">
            {stat.label}
          </p>
        </div>

        {/* Sub label */}
        {stat.sub && (
          <p
            className="text-[10px] mt-3 pt-2.5 border-t border-[rgba(255,255,255,0.06)] flex items-center gap-1.5 text-white/30 drop-shadow-[0_1px_3px_rgba(0,0,0,0.3)]"
          >
            <motion.span
              className="inline-block w-1.5 h-1.5 rounded-full"
              animate={{
                scale: isHovered ? [1, 1.5, 1] : 1,
                opacity: isHovered ? 0.6 : 0.3,
              }}
              transition={{ scale: { repeat: isHovered ? Infinity : 0, duration: 2 } }}
              style={{ background: 'rgba(255,255,255,0.5)' }}
            />
            {stat.sub}
          </p>
        )}
      </div>
    </motion.div>
  );
}
