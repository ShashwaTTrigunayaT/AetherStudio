import React, { useRef, useState, useMemo, useCallback, useEffect } from 'react';
import { motion, useMotionValue, useTransform, useSpring } from 'framer-motion';
import { Clock, Sun, SunDim, Sunset, Moon, Flag, PartyPopper, Users, Shield, Heart, Atom, Flower2, Smile, Ship, BookOpen, Globe, Wrench, Cpu, Leaf, Building2, Plane, Compass } from 'lucide-react';
import Badge from '../Common/Badge';

// ═══════════════════════════════════════════════════════════
//  DATE/TIME UTILITY
// ═══════════════════════════════════════════════════════════

const SPECIAL_DATES = [
  // Format: { month, day, name, greeting, icon: Lucide component }
  { month: 1,  day: 1,  name: "New Year's Day",          greeting: 'Happy New Year',               icon: PartyPopper },
  { month: 1,  day: 12, name: 'National Youth Day',       greeting: 'Empower the Youth',            icon: Users },
  { month: 1,  day: 15, name: 'Army Day',                 greeting: 'Saluting Our Brave Soldiers',  icon: Shield },
  { month: 1,  day: 25, name: 'National Tourism Day',     greeting: 'Wander & Explore',              icon: Compass },
  { month: 1,  day: 26, name: 'Republic Day',             greeting: 'Happy Republic Day',            icon: Flag },
  { month: 2,  day: 14, name: "Valentine's Day",          greeting: 'Love & Code',                  icon: Heart },
  { month: 2,  day: 28, name: 'National Science Day',     greeting: 'Science for Progress',          icon: Atom },
  { month: 3,  day: 8,  name: "International Women's Day", greeting: 'Celebrating Brilliant Minds', icon: Flower2 },
  { month: 4,  day: 1,  name: "April Fools' Day",         greeting: 'Keep Smiling',                 icon: Smile },
  { month: 4,  day: 5,  name: 'National Maritime Day',    greeting: 'Oceans of Possibilities',       icon: Ship },
  { month: 4,  day: 14, name: 'Ambedkar Jayanti',         greeting: 'Building a Better Nation',      icon: BookOpen },
  { month: 4,  day: 22, name: 'Earth Day',                greeting: 'Protect Our Planet',            icon: Globe },
  { month: 5,  day: 1,  name: 'Labour Day',               greeting: 'Celebrating Hard Work',         icon: Wrench },
  { month: 5,  day: 11, name: 'National Technology Day',  greeting: 'Tech for Tomorrow',             icon: Cpu },
  { month: 6,  day: 5,  name: 'World Environment Day',    greeting: 'Green is the Future',           icon: Leaf },
  { month: 6,  day: 21, name: 'International Yoga Day',   greeting: 'Peace & Wellness',              icon: Sun },
  { month: 7,  day: 26, name: 'Kargil Vijay Diwas',       greeting: 'Remembering Our Heroes',        icon: Shield },
  { month: 8,  day: 15, name: 'Independence Day',         greeting: 'Happy Independence Day',        icon: Flag },
  { month: 9,  day: 5,  name: "Teachers' Day",            greeting: 'Gratitude to All Teachers',     icon: BookOpen },
  { month: 9,  day: 15, name: "Engineer's Day",           greeting: 'Building the Future',           icon: Building2 },
  { month: 10, day: 2,  name: 'Gandhi Jayanti',           greeting: 'Peace & Harmony',               icon: Heart },
  { month: 10, day: 8,  name: 'Indian Air Force Day',     greeting: 'Soaring High',                  icon: Plane },
  { month: 10, day: 31, name: 'Halloween',                greeting: 'Spooky Vibes',                  icon: Moon },
  { month: 11, day: 7,  name: 'National Cancer Awareness', greeting: 'Hope & Strength',              icon: Heart },
  { month: 11, day: 14, name: "Children's Day",           greeting: "Happy Children's Day",          icon: Smile },
  { month: 11, day: 26, name: 'Constitution Day',         greeting: 'Celebrating Democracy',          icon: BookOpen },
  { month: 12, day: 25, name: 'Christmas',                greeting: 'Merry Christmas',               icon: PartyPopper },
];

const TIME_PERIODS = [
  // Morning (5-12)
  { start: 5,  end: 12,  id: 'morning',  label: 'morning',   greeting: 'Good morning',       icon: Sun,      subtitle: 'Fresh light, fresh ideas. Your workspace is ready.' },
  // Noon (12-17)
  { start: 12, end: 17,  id: 'noon',     label: 'afternoon', greeting: 'Good afternoon',     icon: SunDim,   subtitle: 'Peak daylight — time to build something great.' },
  // Night (17-21)
  { start: 17, end: 21,  id: 'night',    label: 'evening',   greeting: 'Good evening',       icon: Sunset,   subtitle: 'The golden hour is prime coding time.' },
  // Midnight (21-5)
  { start: 21, end: 24,  id: 'midnight', label: 'night',     greeting: 'Late night coding',  icon: Moon,     subtitle: 'The stars are out and so is your focus.' },
  { start: 0,  end: 5,   id: 'midnight', label: 'night',     greeting: 'Late night coding',  icon: Moon,     subtitle: 'Night mode engaged. Your workspace never sleeps.' },
];

function getCurrentOccasion() {
  const now = new Date();
  const month = now.getMonth() + 1;
  const day = now.getDate();
  const hour = now.getHours();

  // Check for special dates first
  const special = SPECIAL_DATES.find(d => d.month === month && d.day === day);
  if (special) return { ...special, isSpecial: true };

  // Fall back to time-based period
  const period = TIME_PERIODS.find(p => hour >= p.start && hour < p.end) || TIME_PERIODS[0]; // default morning
  return { ...period, isSpecial: false };
}

// ─── Floating micro-particles ───
function MicroParticles() {
  const particles = useMemo(() =>
    Array.from({ length: 16 }, (_, i) => ({
      size: 1 + (i % 3),
      baseX: 5 + (i * 7.5) % 90,
      baseY: 10 + (i * 12) % 80,
      delay: i * 0.35,
      duration: 3.5 + (i % 4) * 0.7,
    })), []);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {particles.map((p, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            width: p.size, height: p.size,
            left: `${p.baseX}%`, top: `${p.baseY}%`,
            background: `rgba(255,255,255,${0.06 + (i % 5) * 0.02})`,
          }}
          animate={{
            opacity: [0, 0.25, 0.05, 0.18, 0],
            y: [0, -10 - (i % 6), 0],
          }}
          transition={{
            duration: p.duration, delay: p.delay,
            repeat: Infinity, ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
}

// ─── Greeting icon (Lucide React only) ───
function GreetingIcon({ Icon, isSpecial }) {
  return (
    <motion.span
      className="inline-flex items-center justify-center select-none"
      animate={{ 
        rotate: isSpecial ? [0, -12, 12, -6, 0] : [0, -8, 8, -4, 0],
        scale: [1, 1.15, 1],
      }}
      transition={{ duration: 2.5, delay: 0.5, ease: 'easeInOut' }}
    >
      <Icon
        size={22}
        strokeWidth={1.5}
        className={isSpecial
          ? 'text-[rgba(255,200,50,0.8)] drop-shadow-[0_0_8px_rgba(255,200,50,0.3)]'
          : 'text-[rgba(255,255,255,0.5)] drop-shadow-[0_0_6px_rgba(255,255,255,0.15)]'
        }
      />
    </motion.span>
  );
}

// ─── Ambient glow (adjusted for occasion) ───
function AmbientGlow({ mouseX, mouseY, isSpecial, occasionId }) {
  const topRightX = useTransform(mouseX, [-0.5, 0.5], [-10, 10]);
  const topRightY = useTransform(mouseY, [-0.5, 0.5], [-10, 10]);

  const glowColor = isSpecial
    ? 'rgba(255,200,50,0.08)' // warm gold for special days
    : occasionId === 'night' || occasionId === 'midnight'
      ? 'rgba(255,255,255,0.04)' // cool white for night/midnight
      : 'rgba(255,255,255,0.06)'; // silver for daytime

  return (
    <>
      <motion.div
        animate={{ scale: [1, 1.15, 1], opacity: [0.04, 0.07, 0.04] }}
        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute -top-20 -right-20 w-64 h-64 rounded-full pointer-events-none"
        style={{
          background: `radial-gradient(circle, ${glowColor}, transparent)`,
          filter: 'blur(70px)',
          x: topRightX, y: topRightY,
        }}
      />
      <motion.div
        animate={{ scale: [1, 1.2, 1], opacity: [0.02, 0.05, 0.02] }}
        transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
        className="absolute -bottom-16 -left-16 w-52 h-52 rounded-full pointer-events-none"
        style={{
          background: `radial-gradient(circle, ${glowColor.replace('0.08','0.03').replace('0.06','0.03').replace('0.04','0.02')}, transparent)`,
          filter: 'blur(60px)',
        }}
      />
      <motion.div
        animate={{ scale: [1, 1.1, 1], opacity: [0.01, 0.03, 0.01] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full pointer-events-none"
        style={{
          background: `radial-gradient(circle, ${glowColor.replace('0.08','0.02').replace('0.06','0.02').replace('0.04','0.01')}, transparent)`,
          filter: 'blur(80px)',
        }}
      />
    </>
  );
}

// ─── Grid texture overlay ───
function GridTexture() {
  return (
    <div
      className="absolute inset-0 pointer-events-none opacity-[0.015]"
      style={{
        backgroundImage: [
          'linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px)',
          'linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)',
        ].join(', '),
        backgroundSize: '32px 32px',
      }}
    />
  );
}

// ─── Scanline overlay ───
function ScanlineOverlay() {
  return (
    <div
      className="absolute inset-0 pointer-events-none overflow-hidden opacity-[0.015]"
      style={{ mixBlendMode: 'overlay' }}
    >
      <div
        className="w-full h-full"
        style={{
          background: 'repeating-linear-gradient(0deg, transparent, transparent 1px, rgba(255,255,255,0.03) 1px, rgba(255,255,255,0.03) 2px)',
          backgroundSize: '100% 2px',
        }}
      />
    </div>
  );
}

// ─── Corner accents ───
function CornerAccents() {
  return (
    <>
      <div className="absolute top-0 left-0 w-10 h-10 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-0 w-[1px] h-7 bg-gradient-to-b from-[rgba(255,255,255,0.12)] to-transparent" />
        <div className="absolute top-0 left-0 w-7 h-[1px] bg-gradient-to-r from-[rgba(255,255,255,0.12)] to-transparent" />
      </div>
      <div className="absolute top-0 right-0 w-10 h-10 pointer-events-none overflow-hidden">
        <div className="absolute top-0 right-0 w-[1px] h-7 bg-gradient-to-b from-[rgba(255,255,255,0.12)] to-transparent" />
        <div className="absolute top-0 right-0 w-7 h-[1px] bg-gradient-to-l from-[rgba(255,255,255,0.12)] to-transparent" />
      </div>
      <div className="absolute bottom-0 left-0 w-10 h-10 pointer-events-none overflow-hidden">
        <div className="absolute bottom-0 left-0 w-[1px] h-7 bg-gradient-to-t from-[rgba(255,255,255,0.08)] to-transparent" />
        <div className="absolute bottom-0 left-0 w-7 h-[1px] bg-gradient-to-r from-[rgba(255,255,255,0.08)] to-transparent" />
      </div>
      <div className="absolute bottom-0 right-0 w-10 h-10 pointer-events-none overflow-hidden">
        <div className="absolute bottom-0 right-0 w-[1px] h-7 bg-gradient-to-t from-[rgba(255,255,255,0.08)] to-transparent" />
        <div className="absolute bottom-0 right-0 w-7 h-[1px] bg-gradient-to-l from-[rgba(255,255,255,0.08)] to-transparent" />
      </div>
    </>
  );
}

// ─── Animated gradient greeting text ───
function AnimatedGreeting({ text }) {
  return (
    <span
      className="bg-clip-text text-transparent"
      style={{
        backgroundImage: 'linear-gradient(135deg, #f5f5f7 0%, #ffffff 25%, #a0a8b4 50%, #ffffff 75%, #f5f5f7 100%)',
        backgroundSize: '200% 100%',
        animation: 'gradient-shift 5s ease-in-out infinite',
      }}
    >
      {text}
    </span>
  );
}

// ═══════════════════════════════════════════════════════════
//  MAIN COMPONENT
// ═══════════════════════════════════════════════════════════
export default function WelcomeBanner({ user, workspaceCount }) {
  const [isHovered, setIsHovered] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Live clock
  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  // Determine current occasion (recomputes on clock tick so it updates on the hour)
  const occasion = useMemo(() => getCurrentOccasion(), [currentTime.getHours(), currentTime.getMonth(), currentTime.getDate()]);

  // 3D tilt
  const ref = useRef(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [3, -3]), { stiffness: 300, damping: 30 });
  const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-3, 3]), { stiffness: 300, damping: 30 });

  const handleMouseMove = useCallback((e) => {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    mouseX.set(x);
    mouseY.set(y);
  }, [mouseX, mouseY]);

  // Greeting text
  const greetingText = occasion.isSpecial
    ? `${occasion.greeting}${user?.name ? `, ${user.name}` : ''}!`
    : `${occasion.greeting}${user?.name ? `, ${user.name}` : ''}`;

  // Subtitle
  const subtitle = occasion.isSpecial
    ? `Celebrating ${occasion.name} — a special day to build something meaningful.`
    : occasion.subtitle;

  const sessionLabel = currentTime.getHours() < 12 ? 'AM' : 'PM';

  // Show special date badge
  const showDateBadge = occasion.isSpecial;

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 24, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => { setIsHovered(false); mouseX.set(0); mouseY.set(0); }}
      onMouseMove={handleMouseMove}
      style={{ rotateX, rotateY, transformStyle: 'preserve-3d', perspective: 1200, borderColor: 'rgba(184,148,80,0.35)' }}
      whileHover={{ y: -4, transition: { duration: 0.3, ease: [0.25, 0.1, 0.25, 1] } }}
      className="relative group overflow-hidden rounded-[16px] border border-[rgba(255,255,255,0.05)] min-h-[140px]"
    >
      {/* ── Premium dark overlay ── */}
      <div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(168deg, rgba(10,10,14,0.92) 0%, rgba(4,4,6,0.80) 40%, rgba(0,0,0,0.75) 100%)`,
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.03)',
        }}
      />

      {/* ── Glass surface ── */}
      <div
        className="absolute inset-0"
        style={{
          background: 'rgba(255,255,255,0.01)',
          backdropFilter: 'blur(1px)',
          WebkitBackdropFilter: 'blur(1px)',
        }}
      />

      {/* ── Ambient glows ── */}
      <AmbientGlow mouseX={mouseX} mouseY={mouseY} isSpecial={occasion.isSpecial} occasionId={occasion.id} />

      <GridTexture />
      <ScanlineOverlay />
      <MicroParticles />
      <CornerAccents />

      {/* ── Hover sweep shimmer ── */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'linear-gradient(105deg, transparent 20%, rgba(255,255,255,0.015) 35%, rgba(255,255,255,0.025) 45%, rgba(255,255,255,0.015) 55%, transparent 70%)',
          transform: 'translateX(-100%)',
        }}
        animate={{ x: isHovered ? '100%' : '-100%' }}
        transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1] }}
      />

      {/* ── Breathing border glow ── */}
      <motion.div
        className="absolute inset-0 rounded-[16px] pointer-events-none"
        animate={{
          opacity: isHovered ? 1 : 0.4,
          boxShadow: isHovered
            ? 'inset 0 0 0 1px rgba(255,255,255,0.08), 0 0 40px rgba(255,255,255,0.03)'
            : 'inset 0 0 0 1px rgba(255,255,255,0.03)',
        }}
        transition={{ duration: 0.5 }}
      >
        <motion.div
          className="absolute inset-0 rounded-[16px]"
          animate={{
            boxShadow: [
              'inset 0 0 0 1px rgba(255,255,255,0.02)',
              'inset 0 0 0 1px rgba(255,255,255,0.04)',
              'inset 0 0 0 1px rgba(255,255,255,0.02)',
            ],
          }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        />
      </motion.div>

      {/* ── Animated top accent bar ── */}
      <motion.div
        className="absolute top-0 left-4 right-4 h-[1.5px] rounded-full pointer-events-none"
        style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent)' }}
        animate={{ opacity: [0.3, 0.7, 0.3], scaleX: [1, 1.02, 1] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* ── Grain texture ── */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.012]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.5'/%3E%3C/svg%3E")`,
          backgroundSize: '128px 128px',
        }}
      />

      {/* ── Content ── */}
      <div
        className="relative z-[1] flex flex-col gap-4 p-6 md:p-8"
        style={{ transform: 'translateZ(20px)' }}
      >
        <div className="flex-1 min-w-0 max-w-2xl">
          {/* Badges row */}
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            <motion.div
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.15, duration: 0.3 }}
            >
              <Badge variant={showDateBadge ? 'accent' : 'neutral'} size="sm" dot={!showDateBadge}>
                {showDateBadge ? occasion.name : `${workspaceCount} workspace${workspaceCount !== 1 ? 's' : ''}`}
              </Badge>
            </motion.div>
            {!showDateBadge && (
              <motion.div
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2, duration: 0.3 }}
              >
                <Badge variant="neutral" size="sm" dot>
                  All systems nominal
                </Badge>
              </motion.div>
            )}
            <motion.div
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.25, duration: 0.3 }}
              className="hidden sm:flex items-center gap-1.5 px-2 py-0.5 rounded-full"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.04)' }}
            >
              <Clock size={9} className="text-[rgba(255,255,255,0.2)]" />
              <span className="text-[9px] font-medium" style={{ color: 'rgba(255,255,255,0.2)' }}>
                {sessionLabel} session
              </span>
            </motion.div>
          </div>

          {/* Greeting with Lucide icon */}
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.4 }}
            className="text-[24px] md:text-[30px] font-bold tracking-tight leading-tight flex items-center gap-3 flex-wrap"
          >
            <AnimatedGreeting text={greetingText} />
            <GreetingIcon Icon={occasion.icon} isSpecial={occasion.isSpecial} />
          </motion.h1>

          {/* Subtitle with staggered reveal */}
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.4 }}
            className="text-[13px] mt-1.5 max-w-xl leading-relaxed"
            style={{ color: 'rgba(255,255,255,0.35)' }}
          >
            {subtitle.split(' ').map((word, i) => (
              <motion.span
                key={i}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + i * 0.03, duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
                className="inline-block mr-[0.3em]"
              >
                {word}
              </motion.span>
            ))}
          </motion.p>
        </div>
      </div>

      {/* ── Bottom status bar ── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6, duration: 0.4 }}
        className="relative z-[1] flex items-center gap-1 px-6 pb-3"
        style={{ transform: 'translateZ(10px)' }}
      >
        <motion.div
          className="w-1.5 h-1.5 rounded-full"
          animate={{ opacity: [0.3, 0.8, 0.3], scale: [1, 1.2, 1] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          style={{ background: 'rgba(255,255,255,0.2)' }}
        />
        <span className="text-[9px] font-medium" style={{ color: 'rgba(255,255,255,0.12)' }}>Ready</span>
        <span className="text-[9px]" style={{ color: 'rgba(255,255,255,0.06)' }}>•</span>
        <motion.span
          className="text-[9px] font-mono tabular-nums"
          style={{ color: 'rgba(255,255,255,0.08)' }}
          animate={{ opacity: [0.06, 0.1, 0.06] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        >
          {currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}
        </motion.span>
      </motion.div>
    </motion.div>
  );
}
