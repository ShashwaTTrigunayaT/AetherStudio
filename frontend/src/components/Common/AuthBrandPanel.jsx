import { motion, useTransform } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import AetherStudioLogo from './AetherStudioLogo';

// ─────────────────────────────────────────────────────────
//  Animated Gradient Orb (Parallax-responsive)
// ─────────────────────────────────────────────────────────
function GradientOrb({ size = 500, pos, gradient, delay = 0, speed = 20, mouseX, mouseY }) {
  const x = mouseX ? useTransform(mouseX, [0, 1], [-24, 24]) : 0;
  const y = mouseY ? useTransform(mouseY, [0, 1], [-24, 24]) : 0;

  return (
    <motion.div
      className="absolute pointer-events-none"
      style={{
        width: size,
        height: size,
        top: pos?.top,
        left: pos?.left,
        right: pos?.right,
        bottom: pos?.bottom,
        transform: 'translate(-50%, -50%)',
        x,
        y,
      }}
      animate={{
        scale: [1, 1.08, 0.95, 1.05, 1],
        opacity: [0.35, 0.45, 0.3, 0.4, 0.35],
      }}
      transition={{
        duration: speed + delay,
        repeat: Infinity,
        ease: 'easeInOut',
        delay,
      }}
    >
      <div
        className="w-full h-full rounded-full"
        style={{ background: gradient, opacity: 0.35, filter: 'blur(120px)' }}
      />
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────
//  Grid Overlay
// ─────────────────────────────────────────────────────────
function GridOverlay({ className = '' }) {
  return (
    <div
      className={`absolute inset-0 pointer-events-none z-[1] ${className}`}
      style={{
        maskImage: 'radial-gradient(ellipse 60% 60% at 50% 50%, black 20%, transparent 70%)',
        WebkitMaskImage: 'radial-gradient(ellipse 60% 60% at 50% 50%, black 20%, transparent 70%)',
      }}
    >
      <div
        className="w-full h-full opacity-[0.025]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.08) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px)
          `,
          backgroundSize: '56px 56px',
        }}
      />
    </div>
  );
}

// ─────────────────────────────────────────────────────────
//  Floating Code Particles
// ─────────────────────────────────────────────────────────
const CODE_LINES = [
  'npm create devnexus',
  'git push origin main',
  'const App = () => {}',
  '<CollaborativeUI />',
  'console.log("hello")',
  '$ docker compose up',
  'import { sync } from',
  'export default nexus',
  'async function deploy',
  'npx devnexus init',
  'socket.emit("code")',
  'yjs.connect(room)',
];

function CodeParticles() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {CODE_LINES.map((line, i) => (
        <motion.div
          key={i}
          className="absolute select-none"
          style={{
            left: `${3 + (i * 8) % 88}%`,
            top: 0,
            width: 'auto',
          }}
          initial={{
            y: '100vh',
            opacity: 0,
          }}
          animate={{
            y: '-15vh',
            opacity: [0, 0.35, 0.45, 0.25, 0],
            x: [0, (i % 2 === 0 ? 6 : -6), 0],
          }}
          transition={{
            duration: 18 + (i % 4) * 5,
            delay: (i % 6) * 2.5,
            repeat: Infinity,
            ease: 'linear',
            times: [0, 0.06, 0.25, 0.5, 1],
          }}
        >
          <span
            className="font-mono font-medium tracking-tight whitespace-nowrap"
            style={{
              fontSize: `${11 + (i % 3) * 3}px`,
              color: `hsl(${210 + (i * 35) % 120}, 70%, ${55 + (i % 3) * 10}%)`,
              opacity: 0.5,
              textShadow: '0 0 8px rgba(184,148,80,0.08)',
            }}
          >
            <span style={{ opacity: 0.3 }}>$</span> {line}
          </span>
        </motion.div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────
//  Subtle Grain Overlay
// ─────────────────────────────────────────────────────────
function GrainOverlay() {
  return (
    <div
      className="absolute inset-0 pointer-events-none z-[1] opacity-[0.02]"
      style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E")`,
        backgroundRepeat: 'repeat',
        backgroundSize: '256px 256px',
      }}
    />
  );
}

// ─────────────────────────────────────────────────────────
//  Brand Panel — Left side showcase for auth pages
// ─────────────────────────────────────────────────────────
export default function AuthBrandPanel({
  mouseX,
  mouseY,
  tagline = 'Code together, ship faster.',
  description = 'The collaborative IDE with real-time editing, AI-powered assistance, and sandboxed code execution.',
  featurePills = [
    { label: 'Real-time Sync', color: '#b89450' },
    { label: 'AI Assistant', color: '#a07840' },
    { label: 'Sandboxed', color: '#30d158' },
  ],
  logoSize = 100,
}) {
  return (
    <div className="relative hidden lg:flex w-[50%] h-screen flex-shrink-0 overflow-hidden bg-[#000000]">
      {/* Ambient orbs */}
      <div className="absolute inset-0 z-0">
        <div
          className="absolute inset-0"
          style={{
            background: `
              radial-gradient(ellipse 80% 50% at 50% 0%, rgba(184,148,80,0.05) 0%, transparent 60%),
              radial-gradient(ellipse 60% 40% at 80% 85%, rgba(160,120,64,0.04) 0%, transparent 50%),
              radial-gradient(ellipse 50% 50% at 20% 65%, rgba(48,209,88,0.03) 0%, transparent 50%),
              radial-gradient(ellipse 40% 40% at 50% 100%, rgba(255,159,10,0.025) 0%, transparent 40%)
            `,
          }}
        />
        <GradientOrb
          size={480}
          pos={{ top: '22%', left: '20%' }}
          gradient="radial-gradient(circle, #b89450, #d4bc80, transparent)"
          delay={0}
          speed={18}
          mouseX={mouseX}
          mouseY={mouseY}
        />
        <GradientOrb
          size={380}
          pos={{ bottom: '18%', right: '10%' }}
          gradient="radial-gradient(circle, #a07840, #c0a078, transparent)"
          delay={4}
          speed={22}
          mouseX={mouseX}
          mouseY={mouseY}
        />
        <GradientOrb
          size={260}
          pos={{ top: '60%', right: '35%' }}
          gradient="radial-gradient(circle, #30d158, transparent)"
          delay={8}
          speed={16}
          mouseX={mouseX}
          mouseY={mouseY}
        />
        <GradientOrb
          size={240}
          pos={{ top: '80%', left: '15%' }}
          gradient="radial-gradient(circle, #ff9f0a, transparent)"
          delay={12}
          speed={20}
          mouseX={mouseX}
          mouseY={mouseY}
        />
        <GridOverlay />
        <GrainOverlay />
        <div
          className="absolute inset-0 pointer-events-none z-[2]"
          style={{
            background: 'radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,0.6) 100%)',
          }}
        />
      </div>

      <CodeParticles />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center w-full h-full px-12 lg:px-16">
        {/* Back to home */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
          className="absolute top-10 left-10"
        >
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-medium transition-all duration-300 select-none"
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.06)',
              color: 'rgba(255,255,255,0.25)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.07)';
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
              e.currentTarget.style.color = 'rgba(255,255,255,0.5)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)';
              e.currentTarget.style.color = 'rgba(255,255,255,0.25)';
            }}
          >
            <motion.span
              animate={{ x: [0, -2, 0] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
              className="inline-flex"
            >
              <ArrowRight size={11} className="rotate-180" />
            </motion.span>
            Back to home
          </Link>
        </motion.div>

        {/* Center brand */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.25, 0.1, 0.25, 1] }}
          className="text-center"
        >
          <motion.div
            whileHover={{ scale: 1.04 }}
            transition={{ type: 'spring', stiffness: 300 }}
            className="inline-flex items-center justify-center mb-8"
          >
            <AetherStudioLogo size={logoSize} variant="full" animated glow />
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
            className="text-[32px] lg:text-[40px] font-bold text-[#f5f5f7] tracking-tight leading-[1.15]"
          >
            {tagline.split(' ').map((word, i, arr) =>
              i === arr.length - 1 ? (
                <span
                  key={i}
                  className="bg-clip-text text-transparent"
                  style={{
                    backgroundImage: 'linear-gradient(135deg, #b89450, #d4bc80, #a07840)',
                  }}
                >
                  {word}{' '}
                </span>
              ) : (
                <span key={i}>{word}{' '}</span>
              )
            )}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
            className="text-[14px] mt-4 max-w-md mx-auto leading-relaxed"
            style={{ color: 'rgba(255,255,255,0.35)' }}
          >
            {description}
          </motion.p>

          {/* Decorative line */}
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ delay: 0.45, duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
            className="w-16 h-[2px] mx-auto mt-8 rounded-full"
            style={{
              background: 'linear-gradient(90deg, transparent, rgba(184,148,80,0.5), rgba(160,120,64,0.5), transparent)',
            }}
          />

          {/* Feature pills */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
            className="flex flex-wrap items-center justify-center gap-2 mt-8"
          >
            {featurePills.map((pill) => (
              <span
                key={pill.label}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-medium"
                style={{
                  background: `${pill.color}12`,
                  border: `1px solid ${pill.color}20`,
                  color: pill.color,
                }}
              >
                <span className="w-1 h-1 rounded-full" style={{ background: pill.color }} />
                {pill.label}
              </span>
            ))}
          </motion.div>
        </motion.div>

        {/* Bottom decorative text */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7, duration: 0.5 }}
          className="absolute bottom-10 text-[10px] font-mono"
          style={{ color: 'rgba(255,255,255,0.08)' }}
        >
          <span style={{ color: 'rgba(184,148,80,0.2)' }}>▲</span> devnexus.com
        </motion.p>
      </div>
    </div>
  );
}
