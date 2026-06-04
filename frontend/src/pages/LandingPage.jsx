import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../stores/useAuth';
import {
  ArrowRight, Code2, Terminal, Globe, Cpu, Zap,
  Users, Shield, GitBranch, Play, ChevronDown,
  Check, Layers, Server, Clock,
} from 'lucide-react';
import { motion, useMotionValue, useTransform, useInView } from 'framer-motion';
import AetherStudioLogo from '../components/Common/AetherStudioLogo';
import LandingNav from '../components/Common/LandingNav';
import LandingFooter from '../components/Landing/LandingFooter';

// ═══════════════════════════════════════════════════════════════
//  CONSTANTS
// ═══════════════════════════════════════════════════════════════

const CODE_SNIPPETS = [
  { text: 'npm create aetherstudio', color: '#30d158' },
  { text: 'git push origin main', color: '#b89450' },
  { text: 'const App = () => {}', color: '#ff9f0a' },
  { text: '<CollaborativeEditor />', color: '#a07840' },
  { text: 'console.log("hello")', color: '#d4bc80' },
  { text: '$ docker compose up', color: '#30d158' },
  { text: 'import { sync } from', color: '#b89450' },
  { text: 'export default aether', color: '#ff9f0a' },
  { text: 'async function deploy', color: '#a07840' },
  { text: 'npx aetherstudio init', color: '#d4bc80' },
  { text: 'try { await code }', color: '#ff453a' },
  { text: 'class AetherEngine', color: '#30d158' },
  { text: 'socket.emit("code")', color: '#b89450' },
  { text: 'yjs.connect(room)', color: '#a07840' },
  { text: 'useSync() => effect', color: '#ff9f0a' },
];

const FEATURES = [
  {
    icon: Terminal,
    title: 'Real-Time Collaboration',
    description: 'Edit code together with zero-latency sync. See cursor positions, selections, and changes as they happen — like Google Docs for code.',
    color: '#b89450',
    gradient: 'from-[#b89450] to-[#d4bc80]',
    stats: 'Sub-50ms latency',
  },
  {
    icon: Server,
    title: 'Sandboxed Execution',
    description: 'Run code in isolated Docker containers. Supports JavaScript, Python, Java, Go, Rust, and 12+ languages with resource limits.',
    color: '#30d158',
    gradient: 'from-[#30d158] to-[#34e859]',
    stats: '12+ languages',
  },
  {
    icon: Cpu,
    title: 'AI-Powered Assistance',
    description: 'Get intelligent code completion, bug detection, and contextual suggestions powered by Gemini Pro. Your AI pair programmer.',
    color: '#a07840',
    gradient: 'from-[#a07840] to-[#c0a078]',
    stats: 'Gemini Pro powered',
  },
  {
    icon: Shield,
    title: 'Enterprise Security',
    description: '256-bit AES encryption, SOC 2 compliance, and role-based access control. Your code stays safe and private.',
    color: '#ff9f0a',
    gradient: 'from-[#ff9f0a] to-[#ffcc00]',
    stats: 'SOC 2 compliant',
  },
  {
    icon: GitBranch,
    title: 'Version Control',
    description: 'Built-in Git integration with visual diff, branch management, and conflict resolution. Never lose work again.',
    color: '#ff453a',
    gradient: 'from-[#ff453a] to-[#ff6961]',
    stats: 'Git integrated',
  },
  {
    icon: Globe,
    title: 'WebRTC Video Chat',
    description: 'Built-in peer-to-peer video and audio calls. Discuss code face-to-face without leaving the editor.',
    color: '#dcccb5',
    gradient: 'from-[#dcccb5] to-[#b89450]',
    stats: 'P2P video calls',
  },
];

const STATS = [
  { value: 50, suffix: 'k+', label: 'Active Developers', icon: Users },
  { value: 99.9, suffix: '%', label: 'Uptime SLA', icon: Clock },
  { value: 12, suffix: '+', label: 'Supported Languages', icon: Code2 },
  { value: 1, suffix: 'M+', label: 'Workspaces Created', icon: Layers },
];

const CODE_PREVIEW_LINES = [
  { content: 'import React, { useState } from "react";', color: '#6c7086' },
  { content: 'import { CollaborativeEditor } from "@aetherstudio/core";', color: '#6c7086' },
  { content: 'import { useSync } from "@aetherstudio/realtime";', color: '#6c7086' },
  { content: '', color: '#6c7086' },
  { content: 'function App() {', color: '#f5f5f7' },
  { content: '  const [code, setCode] = useState(`Hello World`);', color: '#f5f5f7' },
  { content: '  const { users, broadcast } = useSync("workspace-123");', color: '#f5f5f7' },
  { content: '', color: '#f5f5f7' },
  { content: '  return (', color: '#f5f5f7' },
  { content: '    <div className="app">', color: '#f5f5f7' },
  { content: '      <CollaborativeEditor', color: '#a07840' },
  { content: '        value={code}', color: '#d4bc80' },
  { content: '        onChange={setCode}', color: '#d4bc80' },
  { content: '        users={users}', color: '#d4bc80' },
  { content: '        language="jsx"', color: '#d4bc80' },
  { content: '      />', color: '#a07840' },
  { content: '      <p>{users.length} online</p>', color: '#f5f5f7' },
  { content: '    </div>', color: '#f5f5f7' },
  { content: '  );', color: '#f5f5f7' },
  { content: '}', color: '#f5f5f7' },
];

// ═══════════════════════════════════════════════════════════════
//  ANIMATED BACKGROUND COMPONENTS
// ═══════════════════════════════════════════════════════════════

function FloatingOrb({ index }) {
  const size = 250 + (index * 40) % 200;
  const xPos = 10 + (index * 23) % 80;
  const yPos = 10 + (index * 17) % 80;
  const colors = [
    'radial-gradient(circle, rgba(184,148,80,0.15), rgba(184,148,80,0.03), transparent)',
    'radial-gradient(circle, rgba(160,120,64,0.12), rgba(160,120,64,0.02), transparent)',
    'radial-gradient(circle, rgba(48,209,88,0.10), rgba(48,209,88,0.02), transparent)',
    'radial-gradient(circle, rgba(255,159,10,0.08), rgba(255,159,10,0.01), transparent)',
  ];

  return (
    <motion.div
      className="absolute pointer-events-none"
      style={{
        width: size, height: size, left: `${xPos}%`, top: `${yPos}%`,
        borderRadius: '50%', background: colors[index % colors.length],
        filter: `blur(${60 + (index * 10) % 40}px)`,
      }}
      animate={{
        x: [0, (index % 2 === 0 ? 60 : -60), (index % 3 === 0 ? -40 : 40), 0],
        y: [0, (index % 2 === 0 ? -50 : 50), (index % 3 === 0 ? 40 : -40), 0],
        scale: [1, 1.1 + (index * 0.02) % 0.15, 0.92 + (index * 0.03) % 0.12, 1],
      }}
      transition={{
        duration: 15 + (index * 2) % 10, repeat: Infinity, ease: 'easeInOut', delay: index * 1.2,
      }}
    />
  );
}

function ParticleField() {
  const particles = useMemo(() =>
    Array.from({ length: 60 }, (_, i) => ({
      x: 2 + (i * 6.5) % 95, y: 2 + (i * 11) % 95, size: 1 + (i % 4),
      delay: (i * 0.05) % 3, duration: 2 + (i % 5) * 0.6, drift: (i % 2 === 0) ? 15 : -15,
    })), []);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {particles.map((p, i) => (
        <motion.div key={i} className="absolute rounded-full"
          style={{ width: p.size, height: p.size, left: `${p.x}%`, top: `${p.y}%`, background: i % 3 === 0 ? '#b89450' : i % 3 === 1 ? '#a07840' : '#d4bc80' }}
          animate={{
            opacity: [0, 0.3 + (i % 5) * 0.1, 0.1, 0.4 + (i % 3) * 0.05, 0],
            scale: [1, 1.6, 0.7, 1.3, 1],
            x: [0, p.drift * 0.5, -p.drift * 0.3, p.drift * 0.7, 0],
            y: [0, -10 - (i % 10), 5 + (i % 8), -15 - (i % 6), 0],
          }}
          transition={{ duration: p.duration + 1, delay: p.delay, repeat: Infinity, ease: 'easeInOut' }}
        />
      ))}
    </div>
  );
}

function FloatingCodeParticles() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {CODE_SNIPPETS.map((snippet, i) => (
        <motion.div key={i} className="absolute select-none"
          initial={{ x: `${5 + (i * 6.5) % 85}vw`, y: '110vh', opacity: 0 }}
          animate={{
            y: '-20vh', opacity: [0, 0.35, 0.45, 0.3, 0],
            x: [`${5 + (i * 6.5) % 85}vw`, `${5 + (i * 6.5) % 85 + (i % 2 === 0 ? -6 : 6)}vw`],
          }}
          transition={{ duration: 14 + (i % 5) * 3, delay: (i % 8) * 1.8, repeat: Infinity, ease: 'linear', times: [0, 0.08, 0.3, 0.6, 1] }}
        >
          <div className="font-mono font-medium tracking-tight whitespace-nowrap"
            style={{ fontSize: `${9 + (i % 4) * 2}px`, color: snippet.color, opacity: 0.6, textShadow: `0 0 8px ${snippet.color}15` }}
          >
            <span style={{ opacity: 0.2 }}>$</span> {snippet.text}
          </div>
        </motion.div>
      ))}
    </div>
  );
}

function GridOverlay() {
  return (
    <div className="absolute inset-0 pointer-events-none"
      style={{
        maskImage: 'radial-gradient(ellipse 70% 60% at 50% 45%, black 30%, transparent 70%)',
        WebkitMaskImage: 'radial-gradient(ellipse 70% 60% at 50% 45%, black 30%, transparent 70%)',
      }}
    >
      <div className="w-full h-full opacity-[0.02]"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px)`,
          backgroundSize: '60px 60px',
        }}
      />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
//  HERO SUB-COMPONENTS
// ═══════════════════════════════════════════════════════════════

function TypewriterText({ texts, className = '' }) {
  const [index, setIndex] = useState(0);
  const [char, setChar] = useState(0);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const current = texts[index];
    const timer = setTimeout(() => {
      if (!deleting) {
        if (char < current.length) { setChar(c => c + 1); }
        else { setTimeout(() => setDeleting(true), 2000); }
      } else {
        if (char > 0) { setChar(c => c - 1); }
        else { setDeleting(false); setIndex((i) => (i + 1) % texts.length); }
      }
    }, deleting ? 20 : 40);
    return () => clearTimeout(timer);
  }, [char, deleting, index, texts]);

  return (
    <span className={className}>
      {texts[index].substring(0, char)}
      <motion.span animate={{ opacity: [1, 0] }} transition={{ duration: 0.5, repeat: Infinity }}
        className="inline-block w-[2px] h-[1em] ml-[1px] bg-[#b89450] align-middle"
      />
    </span>
  );
}

function CodePreview() {
  return (
    <motion.div initial={{ opacity: 0, y: 40, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: 0.6, duration: 0.8, ease: [0.25, 0.1, 0.25, 1] }}
      className="relative"
    >
      <motion.div className="absolute -inset-4 rounded-[20px] opacity-40"
        style={{ background: 'linear-gradient(135deg, rgba(184,148,80,0.2), rgba(160,120,64,0.1), transparent)', filter: 'blur(20px)' }}
        animate={{ opacity: [0.3, 0.5, 0.3] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
      />
      <div className="relative rounded-[14px] overflow-hidden border"
        style={{
          background: 'rgba(14,14,18,0.92)', borderColor: 'rgba(255,255,255,0.06)',
          backdropFilter: 'blur(40px) saturate(1.8)',
          boxShadow: '0 20px 60px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.04)',
        }}
      >
        <div className="flex items-center gap-2 px-4 py-3 border-b border-[rgba(255,255,255,0.04)]">
          <div className="flex items-center gap-1.5">
            <motion.div whileHover={{ scale: 1.3, backgroundColor: '#ff453a' }} className="w-2.5 h-2.5 rounded-full bg-[rgba(255,255,255,0.08)]" />
            <motion.div whileHover={{ scale: 1.3, backgroundColor: '#ffd60a' }} className="w-2.5 h-2.5 rounded-full bg-[rgba(255,255,255,0.08)]" />
            <motion.div whileHover={{ scale: 1.3, backgroundColor: '#30d158' }} className="w-2.5 h-2.5 rounded-full bg-[rgba(255,255,255,0.08)]" />
          </div>
          <div className="flex-1 flex justify-center">
            <div className="flex items-center gap-2 px-3 py-1 rounded-md bg-[rgba(255,255,255,0.03)]">
              <Code2 size={10} className="text-[rgba(255,255,255,0.2)]" />
              <span className="text-[10px] font-medium text-[rgba(255,255,255,0.2)]">App.jsx</span>
            </div>
          </div>
          <motion.div className="flex items-center gap-1 px-2 py-1 rounded-md" style={{ background: 'rgba(48,209,88,0.08)' }}>
            <motion.div animate={{ scale: [1, 1.3, 1] }} transition={{ duration: 2, repeat: Infinity }} className="w-1.5 h-1.5 rounded-full bg-[#30d158]" />
            <span className="text-[8px] font-medium text-[rgba(48,209,88,0.6)] uppercase tracking-[1px]">Synced</span>
          </motion.div>
        </div>
        <div className="p-4 md:p-5 font-mono text-[11px] md:text-[12px] leading-[1.7] overflow-hidden">
          {CODE_PREVIEW_LINES.map((line, i) => (
            <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.8 + i * 0.03, duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
              className="flex"
            >
              <span className="w-8 md:w-10 flex-shrink-0 text-right pr-3 md:pr-4 select-none" style={{ color: 'rgba(255,255,255,0.08)' }}>{i + 1}</span>
              <span style={{ color: line.color }} className="whitespace-pre">
                {line.content}
                {i === 6 && (
                  <motion.span className="inline-flex items-center gap-1 ml-2 px-1.5 py-0.5 rounded text-[8px] font-medium"
                    style={{ background: 'rgba(184,148,80,0.15)', color: '#d4bc80' }}
                    initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 2, duration: 0.3 }}
                  ><Users size={8} /> 3 online</motion.span>
                )}
                {i === 12 && (
                  <motion.span className="inline-block w-5 h-4 ml-1 rounded-sm align-middle"
                    style={{ background: 'rgba(212,188,128,0.2)', borderLeft: '2px solid #d4bc80' }}
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.5, duration: 0.2 }}
                  />
                )}
              </span>
            </motion.div>
          ))}
        </div>
        <div className="flex items-center justify-between px-4 py-2 border-t border-[rgba(255,255,255,0.04)]" style={{ background: 'rgba(255,255,255,0.02)' }}>
          <div className="flex items-center gap-3">
            <span className="text-[9px] text-[rgba(255,255,255,0.15)]">JSX</span>
            <span className="w-px h-3 bg-[rgba(255,255,255,0.04)]" />
            <span className="text-[9px] text-[rgba(255,255,255,0.15)]">Ln 20, Col 1</span>
            <span className="w-px h-3 bg-[rgba(255,255,255,0.04)]" />
            <motion.span className="text-[9px] flex items-center gap-1" style={{ color: 'rgba(48,209,88,0.4)' }}>
              <motion.div animate={{ scale: [1, 1.3, 1] }} transition={{ duration: 2, repeat: Infinity }} className="w-1 h-1 rounded-full bg-[#30d158]" />
              Connected
            </motion.span>
          </div>
          <div className="flex items-center gap-2">
            {[{ initial: 'A', color: '#b89450' }, { initial: 'B', color: '#a07840' }, { initial: 'C', color: '#30d158' }].map((user, i) => (
              <motion.div key={i} className="w-4 h-4 rounded-full flex items-center justify-center text-[7px] font-bold" style={{ background: user.color }}
                whileHover={{ scale: 1.3, y: -1 }} title={`User ${user.initial}`}>{user.initial}</motion.div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function AnimatedCounter({ value, suffix = '', prefix = '', duration = 2, start = 0 }) {
  const [display, setDisplay] = useState(start.toString());
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-50px' });
  const rafRef = useRef(null);

  useEffect(() => {
    if (!isInView) return;
    const startTime = performance.now();
    const animate = (now) => {
      const elapsed = (now - startTime) / (duration * 1000);
      const progress = Math.min(elapsed, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = start + (value - start) * eased;
      setDisplay(current.toLocaleString('en-US', { maximumFractionDigits: value % 1 === 0 ? 0 : 1 }));
      if (progress < 1) rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, [isInView, value, duration, start]);

  return <span ref={ref}>{prefix}{display}{suffix}</span>;
}

// ═══════════════════════════════════════════════════════════════
//  SECTION COMPONENTS
// ═══════════════════════════════════════════════════════════════

function FeatureCard({ feature, index }) {
  const cardRef = useRef(null);
  const isInView = useInView(cardRef, { once: true, margin: '-80px' });

  return (
    <motion.div ref={cardRef} initial={{ opacity: 0, y: 40 }} animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ delay: index * 0.08, duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
      whileHover={{ y: -8, transition: { duration: 0.2 } }} className="group relative"
    >
      <motion.div className="absolute -inset-2 rounded-[20px] opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
        style={{ background: `radial-gradient(ellipse at 50% 0%, ${feature.color}15, transparent 70%)` }}
      />
      <div className="relative p-5 md:p-6 rounded-[14px] h-full border transition-all duration-300 flex flex-col"
        style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.05)' }}
      >
        <div className="w-10 h-10 rounded-[10px] flex items-center justify-center mb-3 transition-all duration-300 group-hover:scale-110 group-hover:shadow-lg flex-shrink-0"
          style={{ background: `${feature.color}12`, boxShadow: `0 0 20px ${feature.color}08` }}
        ><feature.icon size={18} style={{ color: feature.color }} /></div>
        <h3 className="text-[15px] font-bold text-[#f5f5f7] mb-1.5 tracking-tight flex-shrink-0">{feature.title}</h3>
        <p className="text-[12px] leading-relaxed mb-3 flex-1" style={{ color: 'rgba(255,255,255,0.4)' }}>{feature.description}</p>
        <div className="flex items-center gap-1 flex-shrink-0">
          <div className="w-1.5 h-1.5 rounded-full" style={{ background: feature.color }} />
          <span className="text-[10px] font-medium" style={{ color: `${feature.color}99` }}>{feature.stats}</span>
        </div>
      </div>
    </motion.div>
  );
}

function StatsSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <div ref={ref} className="relative py-12 md:py-16 border-t" style={{ borderColor: 'rgba(255,255,255,0.03)' }}>
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0" style={{ background: `radial-gradient(ellipse 60% 50% at 50% 0%, rgba(160,120,64,0.04) 0%, transparent 60%), radial-gradient(ellipse 40% 40% at 50% 100%, rgba(48,209,88,0.02) 0%, transparent 50%)` }} />
      </div>
      <div className="relative max-w-6xl mx-auto px-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={isInView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.5 }} className="text-center mb-12">
          <h2 className="text-[28px] md:text-[36px] font-bold text-[#f5f5f7] tracking-tight">Trusted by developers worldwide</h2>
          <p className="text-[13px] mt-2" style={{ color: 'rgba(255,255,255,0.35)' }}>Powering collaborative development across teams of all sizes</p>
        </motion.div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {STATS.map((stat, i) => (
            <motion.div key={stat.label} initial={{ opacity: 0, y: 30 }} animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.15 + i * 0.08, duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
              className="text-center p-6 rounded-[16px]" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}
            >
              <div className="w-10 h-10 rounded-[10px] flex items-center justify-center mx-auto mb-3" style={{ background: 'rgba(184,148,80,0.08)' }}>
                <stat.icon size={18} style={{ color: 'rgba(184,148,80,0.5)' }} />
              </div>
              <p className="text-[28px] md:text-[32px] font-bold text-[#f5f5f7] tracking-tight">
                {isInView ? <AnimatedCounter value={stat.value} suffix={stat.suffix} duration={2 + i * 0.3} /> : `0${stat.suffix}`}
              </p>
              <p className="text-[11px] font-medium mt-1" style={{ color: 'rgba(255,255,255,0.3)' }}>{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

function CtaSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <div ref={ref} className="relative py-14 md:py-20 border-t" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <motion.div animate={{ scale: [1, 1.1, 1], rotate: [0, 2, -2, 0] }} transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full blur-[120px]"
          style={{ background: 'radial-gradient(circle, rgba(48,209,88,0.05), rgba(184,148,80,0.03), transparent)' }}
        />
      </div>
      <div className="relative max-w-3xl mx-auto px-6 text-center">
        <motion.h2 initial={{ opacity: 0, y: 30 }} animate={isInView ? { opacity: 1, y: 0 } : {}} transition={{ delay: 0.1, duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
          className="text-[32px] md:text-[44px] font-bold text-[#f5f5f7] tracking-tight leading-[1.1]"
        >
          {user ? 'Welcome back to' : 'Ready to build'}{' '}
          <span className="bg-clip-text text-transparent" style={{ backgroundImage: 'linear-gradient(135deg, #b89450, #d4bc80, #a07840)' }}>
            {user ? 'AetherStudio' : 'something amazing'}
          </span>?
        </motion.h2>          <motion.p initial={{ opacity: 0, y: 20 }} animate={isInView ? { opacity: 1, y: 0 } : {}} transition={{ delay: 0.2, duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
            className="text-[14px] mt-4 max-w-lg mx-auto leading-relaxed" style={{ color: 'rgba(255,255,255,0.35)' }}
          >
            {user
              ? 'Continue building in your workspace. Your projects, collaborators, and tools are waiting for you.'
              : 'Join thousands of developers who are already building together on AetherStudio. Start collaborating in seconds — no credit card required.'
            }
          </motion.p>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={isInView ? { opacity: 1, y: 0 } : {}} transition={{ delay: 0.3, duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
          className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-8"
        >
          {user ? (
            <motion.button onClick={() => navigate('/dashboard')} whileHover={{ scale: 1.03, y: -2 }} whileTap={{ scale: 0.97 }}
              className="relative group inline-flex items-center gap-2 px-7 py-3 rounded-[12px] text-[14px] font-semibold text-white overflow-hidden"
              style={{ background: 'linear-gradient(135deg, #b89450, #d4bc80)', boxShadow: '0 4px 24px rgba(184,148,80,0.3)' }}
              onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 8px 32px rgba(184,148,80,0.4)'}
              onMouseLeave={(e) => e.currentTarget.style.boxShadow = '0 4px 24px rgba(184,148,80,0.3)'}
            >
              <motion.div className="absolute inset-0 pointer-events-none"
                style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent)', transform: 'translateX(-100%)' }}
                animate={{ transform: ['translateX(-100%)', 'translateX(100%)'] }} transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
              />
              Go to Dashboard <ArrowRight size={16} />
            </motion.button>
          ) : (
            <motion.button onClick={() => navigate('/register')} whileHover={{ scale: 1.03, y: -2 }} whileTap={{ scale: 0.97 }}
              className="relative group inline-flex items-center gap-2 px-7 py-3 rounded-[12px] text-[14px] font-semibold text-white overflow-hidden"
              style={{ background: 'linear-gradient(135deg, #b89450, #d4bc80)', boxShadow: '0 4px 24px rgba(184,148,80,0.3)' }}
              onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 8px 32px rgba(184,148,80,0.4)'}
              onMouseLeave={(e) => e.currentTarget.style.boxShadow = '0 4px 24px rgba(184,148,80,0.3)'}
            >
              <motion.div className="absolute inset-0 pointer-events-none"
                style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent)', transform: 'translateX(-100%)' }}
                animate={{ transform: ['translateX(-100%)', 'translateX(100%)'] }} transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
              />
              Get Started Free <ArrowRight size={16} />
            </motion.button>
          )}
          {!user && (
            <motion.button onClick={() => navigate('/login')} whileHover={{ scale: 1.03, y: -2 }} whileTap={{ scale: 0.97 }}
              className="inline-flex items-center gap-2 px-7 py-3 rounded-[12px] text-[14px] font-semibold transition-all"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.6)' }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = 'rgba(255,255,255,0.8)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = 'rgba(255,255,255,0.6)'; }}
            >Sign In</motion.button>
          )}
        </motion.div>
        <motion.div initial={{ opacity: 0 }} animate={isInView ? { opacity: 1 } : {}} transition={{ delay: 0.5, duration: 0.5 }}
          className="flex flex-wrap items-center justify-center gap-6 mt-10 text-[10px]" style={{ color: 'rgba(255,255,255,0.12)' }}
        >
          <span className="flex items-center gap-1.5"><Check size={11} className="text-[rgba(48,209,88,0.4)]" /> No credit card required</span>
          <span className="flex items-center gap-1.5"><Check size={11} className="text-[rgba(48,209,88,0.4)]" /> 14-day free trial</span>
          <span className="flex items-center gap-1.5"><Check size={11} className="text-[rgba(48,209,88,0.4)]" /> Cancel anytime</span>
        </motion.div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
//  ENHANCED NAVIGATION — now imported from ../components/Common/LandingNav
// ═══════════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════════
//  MAIN LANDING PAGE
// ═══════════════════════════════════════════════════════════════

export default function LandingPage() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const heroRef = useRef(null);

  useEffect(() => {
    // Allow scrolling for the long landing page
    document.body.style.overflow = 'auto';
    return () => { document.body.style.overflow = 'hidden'; };
  }, []);

  const mouseX = useMotionValue(0.5);
  const mouseY = useMotionValue(0.5);

  const handleMouseMove = useCallback((e) => {
    const rect = heroRef.current?.getBoundingClientRect();
    if (!rect) return;
    mouseX.set((e.clientX - rect.left) / rect.width);
    mouseY.set((e.clientY - rect.top) / rect.height);
  }, [mouseX, mouseY]);

  const orbX = useTransform(mouseX, [0, 1], [-25, 25]);
  const orbY = useTransform(mouseY, [0, 1], [-25, 25]);

  const handleGetStarted = () => user ? navigate('/dashboard') : navigate('/register');
  const handleScrollToFeatures = () => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });

  return (
    <div className="min-h-screen bg-[#000000] overflow-x-hidden">
      {/* ───────── HERO ───────── */}
      <section ref={heroRef} onMouseMove={handleMouseMove} className="relative min-h-screen flex flex-col">
        <div className="absolute inset-0">
          <div className="absolute inset-0" style={{
            background: `radial-gradient(ellipse 80% 50% at 50% 0%, rgba(184,148,80,0.06) 0%, transparent 60%),
              radial-gradient(ellipse 60% 40% at 80% 80%, rgba(160,120,64,0.04) 0%, transparent 50%),
              radial-gradient(ellipse 50% 50% at 20% 70%, rgba(48,209,88,0.03) 0%, transparent 50%),
              radial-gradient(ellipse 40% 40% at 50% 100%, rgba(255,159,10,0.02) 0%, transparent 40%)`
          }} />
          {Array.from({ length: 5 }, (_, i) => <FloatingOrb key={i} index={i} />)}
          <motion.div className="absolute pointer-events-none" style={{ x: orbX, y: orbY, top: '25%', left: '15%', width: 500, height: 500 }}>
            <div className="w-full h-full rounded-full blur-[120px]" style={{ background: 'radial-gradient(circle, rgba(184,148,80,0.08), rgba(184,148,80,0.02), transparent)' }} />
          </motion.div>
          <motion.div className="absolute pointer-events-none"
            style={{ x: useTransform(mouseX, [0, 1], [20, -20]), y: useTransform(mouseY, [0, 1], [20, -20]), bottom: '20%', right: '10%', width: 400, height: 400 }}
          >
            <div className="w-full h-full rounded-full blur-[100px]" style={{ background: 'radial-gradient(circle, rgba(160,120,64,0.06), rgba(160,120,64,0.01), transparent)' }} />
          </motion.div>
          <ParticleField />
          <GridOverlay />
          <FloatingCodeParticles />
          <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,0.5) 100%)' }} />
        </div>

        <LandingNav onGetStarted={handleGetStarted} user={user} onLogout={logout} showSectionLinks />

        <div className="relative z-10 flex-1 flex items-center">
          <div className="w-full max-w-7xl mx-auto px-6 md:px-8 pt-14 sm:pt-16 md:pt-20 pb-6 sm:pb-8 md:pb-12">
            <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
              <div className="max-w-xl">
                <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.7, ease: [0.25, 0.1, 0.25, 1] }}
                  className="text-[40px] sm:text-[52px] md:text-[60px] lg:text-[68px] font-bold leading-[1.02] tracking-[-0.03em]"
                >
                  <span className="text-[#f5f5f7]">Code together,</span><br />
                  <span className="bg-clip-text text-transparent" style={{ backgroundImage: 'linear-gradient(135deg, #b89450, #d4bc80, #a07840, #c0a078)', backgroundSize: '200% 200%' }}>
                    <motion.span animate={{ backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'] }} transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
                      className="bg-clip-text text-transparent" style={{ backgroundImage: 'linear-gradient(135deg, #b89450, #d4bc80, #a07840, #c0a078)', backgroundSize: '200% 200%' }}
                    >ship faster.</motion.span>
                  </span>
                </motion.h1>

                <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
                  className="text-[15px] md:text-[16px] mt-5 leading-relaxed max-w-lg" style={{ color: 'rgba(255,255,255,0.35)' }}
                >{user ? 'Welcome back. Your workspaces, collaborators, and tools are ready.' : 'The collaborative IDE with real-time editing, AI-powered assistance, and sandboxed code execution — all in your browser.'}</motion.p>

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }} className="mt-6">
                  <div className="inline-flex items-center gap-2.5 px-4 py-2.5 rounded-[10px] font-mono text-[12px]"
                    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.4)' }}
                  >
                    <Terminal size={13} style={{ color: 'rgba(184,148,80,0.5)' }} />
                    <span className="opacity-40">$</span>
                    <TypewriterText texts={['npm create aetherstudio@latest', 'git clone collab-ide', 'docker compose up --build', 'code . --sync', 'npx aetherstudio init']} />
                  </div>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4, duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
                  className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mt-8"
                >
                  <motion.button onClick={handleGetStarted} whileHover={{ scale: 1.03, y: -2 }} whileTap={{ scale: 0.97 }}
                    className="relative group inline-flex items-center gap-2 px-6 py-3 rounded-[12px] text-[14px] font-semibold text-white overflow-hidden"
                    style={{ background: 'linear-gradient(135deg, #b89450, #d4bc80)', boxShadow: '0 4px 24px rgba(184,148,80,0.3)' }}
                    onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 8px 32px rgba(184,148,80,0.4)'}
                    onMouseLeave={(e) => e.currentTarget.style.boxShadow = '0 4px 24px rgba(184,148,80,0.3)'}
                  >
                    <motion.div className="absolute inset-0 pointer-events-none"
                      style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent)', transform: 'translateX(-100%)' }}
                      animate={{ transform: ['translateX(-100%)', 'translateX(100%)'] }} transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                    />{user ? 'Go to Dashboard' : 'Get Started Free'} <ArrowRight size={16} />
                  </motion.button>
                    <motion.button onClick={handleScrollToFeatures} whileHover={{ scale: 1.03, y: -2 }} whileTap={{ scale: 0.97 }}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-[12px] text-[14px] font-semibold transition-all"
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)' }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = 'rgba(255,255,255,0.8)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = 'rgba(255,255,255,0.5)'; }}
                  ><Play size={15} /> {user ? 'Explore Features' : 'See How It Works'}</motion.button>
                </motion.div>

                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6, duration: 0.5 }} className="flex items-center gap-4 mt-10">
                  <div className="flex -space-x-2">
                    {[{ initial: 'A', color: '#b89450' }, { initial: 'B', color: '#a07840' }, { initial: 'C', color: '#30d158' }, { initial: 'D', color: '#ff9f0a' }, { initial: 'E', color: '#ff453a' }]
                      .map((user, i) => (
                        <motion.div key={i} className="w-7 h-7 rounded-full flex items-center justify-center text-[9px] font-bold border-2 border-[#000]" style={{ background: user.color }}
                          initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.7 + i * 0.05, duration: 0.3 }}
                        >{user.initial}</motion.div>
                      ))}
                  </div>
                  <div>
                    <div className="flex items-center gap-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <motion.svg key={i} initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 0.9 + i * 0.05, duration: 0.2 }} width="12" height="12" viewBox="0 0 24 24" fill="#ff9f0a"
                        ><polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" /></motion.svg>
                      ))}
                    </div>
                    <p className="text-[10px] mt-0.5" style={{ color: 'rgba(255,255,255,0.2)' }}>Loved by 10k+ developers</p>
                  </div>
                </motion.div>
              </div>

              <div className="hidden lg:block"><CodePreview /></div>
            </div>
          </div>
        </div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2, duration: 0.5 }} className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10">
          <motion.button onClick={handleScrollToFeatures} whileHover={{ y: 3 }} className="flex flex-col items-center gap-1.5" style={{ color: 'rgba(255,255,255,0.15)' }}>
            <span className="text-[9px] font-medium uppercase tracking-[2px]">Scroll</span>
            <motion.div animate={{ y: [0, 6, 0] }} transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}><ChevronDown size={14} /></motion.div>
          </motion.button>
        </motion.div>
      </section>

      {/* ───────── FEATURES ───────── */}
      <section id="features" className="relative pt-6 md:pt-8 pb-8 md:pb-12 border-t scroll-mt-[80px]" style={{ borderColor: 'rgba(255,255,255,0.02)' }}>
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0" style={{ background: `radial-gradient(ellipse 60% 40% at 50% 0%, rgba(184,148,80,0.04) 0%, transparent 60%), radial-gradient(ellipse 50% 40% at 50% 100%, rgba(160,120,64,0.03) 0%, transparent 50%)` }} />
          <GridOverlay />
        </div>
        <div className="relative max-w-6xl mx-auto px-6">            <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }} className="text-center mb-6 md:mb-8"
          >
            <h2 className="text-[26px] md:text-[34px] font-bold text-[#f5f5f7] tracking-tight">
              Everything you need to{' '}
              <span className="bg-clip-text text-transparent" style={{ backgroundImage: 'linear-gradient(135deg, #b89450, #d4bc80)' }}>build together</span>
            </h2>
            <p className="text-[12px] mt-2 max-w-lg mx-auto" style={{ color: 'rgba(255,255,255,0.35)' }}>
              A complete collaborative development environment with real-time sync, AI assistance, and enterprise-grade security.
            </p>
          </motion.div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-2.5 md:gap-3">
            {FEATURES.map((feature, i) => <FeatureCard key={feature.title} feature={feature} index={i} />)}
          </div>
        </div>
      </section>

      <section id="stats" className="scroll-mt-[80px]"><StatsSection /></section>
      <section id="cta"><CtaSection /></section>
      <LandingFooter />
    </div>
  );
}
