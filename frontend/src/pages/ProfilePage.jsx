import React, { useState, useRef, useCallback, useMemo } from 'react';
import { useAuth } from '../stores/useAuth';
import { useNavigate } from 'react-router-dom';
import {
  LogOut, User, Code2, Bell, Palette, Camera, Upload,
  Key, Globe, Smartphone, ChevronRight, Home, Zap,
  Folder, Users, Calendar, CheckCircle,
} from 'lucide-react';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import Avatar from '../components/Common/Avatar';
import Navbar from '../components/Common/Navbar';
import LandingFooter from '../components/Landing/LandingFooter';
import { toast } from 'sonner';
import AvatarCropModal from '../components/Dashboard/AvatarCropModal';

// ─── Particle System ──────────────────────────────────────────
function ParticleField({ count = 25 }) {
  const particles = useMemo(() =>
    Array.from({ length: count }, (_, i) => ({
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: 1 + (i % 4),
      delay: (i * 0.08) % 5,
      duration: 3 + (i % 6) * 0.8,
      drift: (i % 2 === 0 ? 20 : -20),
      color: i % 3 === 0 ? '#c8c8d0' : i % 3 === 1 ? '#b0b0bc' : '#dedee4',
    })), [count]);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {particles.map((p, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            width: p.size, height: p.size,
            left: `${p.x}%`, top: `${p.y}%`,
            background: p.color,
            filter: `blur(${i % 2 === 0 ? 0 : 1}px)`,
          }}
          animate={{
            opacity: [0, 0.4, 0.1, 0.5, 0],
            scale: [1, 1.8, 0.7, 1.4, 1],
            x: [0, p.drift * 0.4, -p.drift * 0.3, p.drift * 0.6, 0],
            y: [0, -12 - (i % 8), 8 + (i % 6), -18 - (i % 4), 0],
          }}
          transition={{ duration: p.duration + 1, delay: p.delay, repeat: Infinity, ease: 'easeInOut' }}
        />
      ))}
    </div>
  );
}

// ─── Ambient Orbs ─────────────────────────────────────────────
function AmbientOrbs() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden">
      <motion.div animate={{ x: [0, 80, -40, 60, 0], y: [0, -60, 40, -50, 0] }} transition={{ duration: 25, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute top-[5%] left-[3%] w-[600px] h-[600px] rounded-full"
        style={{ background: 'radial-gradient(circle, rgba(200,200,208,0.06), rgba(222,222,228,0.02), transparent)', filter: 'blur(120px)' }}
      />
      <motion.div animate={{ x: [0, -60, 70, -40, 0], y: [0, 50, -60, 40, 0] }} transition={{ duration: 30, repeat: Infinity, ease: 'easeInOut', delay: 5 }}
        className="absolute bottom-[15%] right-[5%] w-[500px] h-[500px] rounded-full"
        style={{ background: 'radial-gradient(circle, rgba(176,176,188,0.05), rgba(144,137,255,0.02), transparent)', filter: 'blur(100px)' }}
      />
      <motion.div animate={{ scale: [1, 1.25, 0.9, 1], opacity: [0.03, 0.07, 0.03, 0.03] }} transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
        className="absolute top-[30%] right-[25%] w-[350px] h-[350px] rounded-full"
        style={{ background: 'radial-gradient(circle, rgba(48,209,88,0.04), transparent)', filter: 'blur(90px)' }}
      />
      <motion.div animate={{ x: [0, 30, -20, 15, 0], opacity: [0.02, 0.05, 0.02, 0.04, 0.02] }} transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut', delay: 8 }}
        className="absolute top-[55%] left-[60%] w-[280px] h-[280px] rounded-full"
        style={{ background: 'radial-gradient(circle, rgba(255,159,10,0.03), transparent)', filter: 'blur(80px)' }}
      />
      <div className="absolute inset-0" style={{ opacity: 0.015, backgroundImage: `linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.06) 1px, transparent 1px)`, backgroundSize: '60px 60px' }} />
    </div>
  );
}

// ─── Code Floaters ────────────────────────────────────────────
function CodeFloaters() {
  const snippets = useMemo(() => [
    { text: 'import React from "react"', color: '#dedee4' },
    { text: 'const App = () => {}', color: '#ff9f0a' },
    { text: 'npm run dev', color: '#30d158' },
    { text: 'git push origin main', color: '#c8c8d0' },
    { text: 'docker compose up', color: '#b0b0bc' },
    { text: 'console.log("hello")', color: '#dcccb5' },
    { text: 'export default App', color: '#ff9f0a' },
    { text: 'yarn add react', color: '#30d158' },
  ], []);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden">
      {snippets.map((s, i) => (
        <motion.div key={i} className="absolute select-none font-mono font-medium tracking-tight whitespace-nowrap"
          initial={{ x: `${5 + (i * 12) % 85}vw`, y: '110vh', opacity: 0 }}
          animate={{ y: '-20vh', opacity: [0, 0.25, 0.35, 0.2, 0], x: [`${5 + (i * 12) % 85}vw`, `${5 + (i * 12) % 85 + (i % 2 === 0 ? -4 : 4)}vw`] }}
          transition={{ duration: 18 + (i % 4) * 4, delay: (i % 6) * 2.5, repeat: Infinity, ease: 'linear', times: [0, 0.08, 0.3, 0.6, 1] }}
        >
          <span style={{ fontSize: `${9 + (i % 3) * 2}px`, color: s.color, opacity: 0.5, textShadow: `0 0 8px ${s.color}15` }}>
            <span style={{ opacity: 0.2 }}>$</span> {s.text}
          </span>
        </motion.div>
      ))}
    </div>
  );
}

// ─── Gradient Border Card ──────────────────────────────────────
function GradientBorderCard({ children, className = '', greenGlow = false, ...props }) {
  return (
    <div className={`relative group ${className}`} {...props}>
      {/* Gradient border layer */}
      <div
        className="absolute inset-0 rounded-[18px] transition-opacity duration-500"
        style={{
          background: greenGlow
            ? 'linear-gradient(135deg, rgba(16,185,129,0.25), rgba(200,200,208,0.08), transparent 60%)'
            : 'linear-gradient(135deg, rgba(200,200,208,0.06), rgba(255,255,255,0.02), transparent 50%)',
          opacity: 1,
        }}
      />
      {/* Soft glow overlay */}
      <div
        className="absolute inset-0 rounded-[18px] opacity-40 transition-opacity duration-500"
        style={{
          boxShadow: greenGlow
            ? '0 0 60px rgba(16,185,129,0.06)'
            : '0 0 40px rgba(200,200,208,0.03)',
        }}
      />
      {/* Content */}
      <div
        className="relative rounded-[17px] bg-[#0f1419] h-full"
        style={{
          margin: '1px',
          boxShadow: '0 12px 48px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.04)',
        }}
      >
        {children}
      </div>
    </div>
  );
}

// ─── Section Header ───────────────────────────────────────────
function SectionHeader({ icon: Icon, label, green = false }) {
  return (
    <div className="flex items-center gap-3 mb-5">
      <div
        className="w-[3px] h-5 rounded-full"
        style={{ background: green ? '#10b981' : 'rgba(255,255,255,0.15)' }}
      />
      <div className="flex items-center gap-2">
        {Icon && <Icon size={13} style={{ color: green ? '#10b981' : 'rgba(255,255,255,0.3)' }} />}
        <h2 className="text-[12px] font-semibold tracking-wider uppercase" style={{ color: green ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.35)' }}>{label}</h2>
      </div>
    </div>
  );
}

// ─── Settings Data ────────────────────────────────────────────
const SETTINGS_SECTIONS = [
  {
    id: 'account', label: 'Account',
    items: [
      { icon: User, label: 'Personal Info', description: 'Name, email, and profile picture', iconColor: '#10b981', iconBg: 'rgba(16,185,129,0.1)', action: 'scroll-top' },
      { icon: Key, label: 'Password & Security', description: 'Update password and 2FA settings', iconColor: '#c8c8d0', iconBg: 'rgba(200,200,208,0.08)', action: 'forgot-password' },
      { icon: Globe, label: 'Language & Region', description: 'Timezone and locale preferences', iconColor: '#b0b0bc', iconBg: 'rgba(176,176,188,0.08)', action: 'coming-soon' },
    ],
  },
  {
    id: 'preferences', label: 'Preferences',
    items: [
      { icon: Palette, label: 'Appearance', description: 'Theme, font size, and layout options', iconColor: '#dedee4', iconBg: 'rgba(222,222,228,0.08)', action: 'coming-soon' },
      { icon: Bell, label: 'Notifications', description: 'Email and in-app notification settings', iconColor: '#c8c8d0', iconBg: 'rgba(200,200,208,0.08)', action: 'coming-soon' },
      { icon: Smartphone, label: 'Devices', description: 'Manage connected devices and sessions', iconColor: '#b0b0bc', iconBg: 'rgba(176,176,188,0.08)', action: 'coming-soon' },
    ],
  },
];

export default function ProfilePage() {
  const { user, logout, uploadAvatar } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('account');
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [cropImageSrc, setCropImageSrc] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);

  const mouseX = useMotionValue(0.5);
  const mouseY = useMotionValue(0.5);
  const glowRef = useRef(null);
  const handleMouseMove = useCallback((e) => {
    const rect = glowRef.current?.getBoundingClientRect();
    if (!rect) return;
    mouseX.set((e.clientX - rect.left) / rect.width);
    mouseY.set((e.clientY - rect.top) / rect.height);
  }, [mouseX, mouseY]);
  const glowX = useTransform(mouseX, [0, 1], [-200, 200]);
  const glowY = useTransform(mouseY, [0, 1], [-200, 200]);

  const handleSelectClick = () => fileInputRef.current?.click();
  const handleFileSelected = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => { setCropImageSrc(event.target.result); setCropModalOpen(true); };
    reader.readAsDataURL(file);
    e.target.value = '';
  };
  const handleCropComplete = async (file) => {
    setUploadingPhoto(true);
    try { await uploadAvatar(file); }
    catch (err) { console.error('Failed to upload avatar:', err); }
    finally { setUploadingPhoto(false); }
  };
  const handleDragOver = useCallback((e) => { e.preventDefault(); e.stopPropagation(); setDragOver(true); }, []);
  const handleDragLeave = useCallback((e) => { e.preventDefault(); e.stopPropagation(); setDragOver(false); }, []);
  const handleDrop = useCallback((e) => {
    e.preventDefault(); e.stopPropagation(); setDragOver(false);
    const file = e.dataTransfer?.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (event) => { setCropImageSrc(event.target.result); setCropModalOpen(true); };
    reader.readAsDataURL(file);
  }, []);

  const statCards = [
    { label: 'WORKSPACES', value: user?.workspaceCount ?? '—', icon: Folder, color: '#c8c8d0', bg: 'rgba(200,200,208,0.08)' },
    { label: 'COLLABORATIONS', value: user?.collaborationCount ?? '—', icon: Users, color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
    { label: 'MEMBER SINCE', value: user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'short' }) : '—', icon: Calendar, color: 'rgba(255,255,255,0.4)', bg: 'rgba(255,255,255,0.04)' },
  ];

  // ── Tabs ──
  const tabs = [
    { label: 'Account', value: 'account', description: 'Manage your personal details and security' },
    { label: 'Preferences', value: 'preferences', description: 'Customize your editor and workspace' },
  ];

  return (
    <div className="min-h-screen bg-[#000000]" ref={glowRef} onMouseMove={handleMouseMove}>
      <AmbientOrbs />
      <ParticleField />
      <CodeFloaters />

      <motion.div className="fixed pointer-events-none rounded-full"
        style={{ width: 400, height: 400, x: glowX, y: glowY, background: 'radial-gradient(circle, rgba(200,200,208,0.03), transparent)', filter: 'blur(80px)', left: '50%', top: '50%', transform: 'translate(-50%, -50%)' }}
      />

      {/* ── Navbar ── */}
      <Navbar
        hideNavLinks
        user={user}
        onProfileClick={() => navigate('/profile')}
        rightContent={
          <div className="flex items-center gap-1.5 md:gap-2">
            <motion.button onClick={() => navigate('/')} whileHover={{ scale: 1.05, background: 'rgba(255,255,255,0.07)' }} whileTap={{ scale: 0.95 }}
              className="w-8 h-8 rounded-[9px] flex items-center justify-center transition-all duration-200"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.25)' }} title="Home"
            ><Home size={13} /></motion.button>
            <motion.button onClick={() => navigate('/dashboard')} whileHover={{ scale: 1.03, y: -1 }} whileTap={{ scale: 0.97 }}
              className="relative inline-flex items-center gap-2 px-4 py-2 rounded-[10px] text-[12px] font-semibold text-white overflow-hidden"
              style={{ background: 'linear-gradient(135deg, #c8c8d0, #dedee4)', boxShadow: '0 4px 16px rgba(200,200,208,0.25)' }}
            >
              <motion.div className="absolute inset-0 pointer-events-none"
                style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent)', transform: 'translateX(-100%)' }}
                animate={{ transform: ['translateX(-100%)', 'translateX(100%)'] }} transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              />
              Dashboard
            </motion.button>
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="relative" onClick={() => navigate('/profile')}>
              <Avatar name={user?.name} email={user?.email} src={user?.avatar} size="sm"
                className="cursor-pointer ring-2 ring-transparent hover:ring-[rgba(255,255,255,0.08)] transition-all duration-300"
              />
            </motion.button>
          </div>
        }
      />

      <AvatarCropModal
        isOpen={cropModalOpen}
        onClose={() => { setCropModalOpen(false); setCropImageSrc(null); }}
        imageSrc={cropImageSrc}
        onCropComplete={handleCropComplete}
      />

      <div className="relative max-w-6xl mx-auto px-6 pt-24 pb-6 space-y-10 animate-fade-in">

        {/* ═══════════════════════════════════════
            PROFILE HEADER CARD (Elevated)
           ═══════════════════════════════════════ */}
        <GradientBorderCard greenGlow>
          <div className="p-8 md:p-10">
            <div className="flex flex-col md:flex-row items-center md:items-start gap-8 md:gap-10 text-center md:text-left">

              {/* ── Avatar with green accent ring ── */}
              <div className="relative flex-shrink-0">
                <div
                  className={`relative rounded-full transition-all duration-300 ${dragOver ? 'scale-105' : ''}`}
                  onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}
                >
                  <div
                    className={`relative group cursor-pointer rounded-full ${dragOver ? 'ring-2 ring-[#10b981] ring-offset-2 ring-offset-[#0f1419]' : 'ring-[3px] ring-[#10b981] ring-offset-[3px] ring-offset-[#0f1419]'}`}
                    onClick={handleSelectClick}
                  >
                    <Avatar name={user?.name} email={user?.email} src={user?.avatar} size="xxxl" status="online" />
                    <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelected} className="hidden" />
                    <motion.div
                      className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 cursor-pointer"
                      initial={false}
                    >
                      <div className="w-full h-full rounded-full bg-[rgba(0,0,0,0.65)] backdrop-blur-[2px] flex flex-col items-center justify-center">
                        {uploadingPhoto ? (
                          <svg className="animate-spin" width="22" height="22" viewBox="0 0 24 24" fill="none">
                            <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.3)" strokeWidth="3" />
                            <path d="M12 2a10 10 0 0 1 10 10" stroke="rgba(255,255,255,0.7)" strokeWidth="3" strokeLinecap="round" />
                          </svg>
                        ) : (
                          <Camera size={22} className="text-[rgba(255,255,255,0.85)]" />
                        )}
                        <span className="text-[10px] font-semibold mt-1.5" style={{ color: 'rgba(255,255,255,0.55)' }}>
                          {uploadingPhoto ? 'Uploading...' : 'Change photo'}
                        </span>
                      </div>
                    </motion.div>
                  </div>
                </div>
                <AnimatePresence>
                  {dragOver && (
                    <motion.div key="drop-badge" initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                      className="absolute -bottom-7 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-2.5 py-1 rounded-[6px] whitespace-nowrap"
                      style={{ background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.2)', color: '#10b981' }}
                    >
                      <Upload size={10} />
                      <span className="text-[10px] font-semibold">Drop to crop</span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* ── Identity block ── */}
              <div className="flex-1 min-w-0">
                <h1 className="text-[30px] md:text-[34px] font-bold text-[#f5f5f7] tracking-tight leading-tight">
                  {user?.name || 'User'}
                </h1>
                <p className="text-[14px] mt-1.5" style={{ color: 'rgba(255,255,255,0.35)' }}>
                  {user?.email}
                </p>
                <div className="flex items-center justify-center md:justify-start gap-2 mt-4">
                  <span
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold"
                    style={{
                      background: 'rgba(16,185,129,0.1)',
                      color: '#10b981',
                      border: '1px solid rgba(16,185,129,0.15)',
                    }}
                  >
                    <CheckCircle size={11} />
                    Active
                  </span>
                </div>
              </div>

              {/* ── Sign Out button ── */}
              <motion.button
                whileHover={{ scale: 1.03, borderColor: 'rgba(255,69,58,0.25)', boxShadow: '0 4px 20px rgba(255,69,58,0.12)' }}
                whileTap={{ scale: 0.97 }}
                onClick={() => { logout(); navigate('/login'); }}
                className="flex items-center gap-2 px-4 py-2.5 rounded-[10px] text-[11px] font-semibold transition-all duration-300 flex-shrink-0 self-start"
                style={{
                  background: 'rgba(255,69,58,0.06)',
                  border: '1px solid rgba(255,69,58,0.12)',
                  color: 'rgba(255,69,58,0.6)',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,69,58,0.1)'; e.currentTarget.style.color = '#ff453a'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,69,58,0.06)'; e.currentTarget.style.color = 'rgba(255,69,58,0.6)'; }}
              >
                <LogOut size={13} />
                Sign Out
              </motion.button>
            </div>
          </div>
        </GradientBorderCard>

        {/* ═══════════════════════════════════════
            STATS ROW
           ═══════════════════════════════════════ */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
          className="grid grid-cols-1 sm:grid-cols-3 gap-4"
        >
          {statCards.map((stat, i) => (
            <motion.div key={stat.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 + i * 0.04 }}>
              <GradientBorderCard>
                <div className="p-5">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-[12px] flex items-center justify-center flex-shrink-0" style={{ background: stat.bg }}>
                      <stat.icon size={20} style={{ color: stat.color }} />
                    </div>
                    <div>
                      <p className="text-[26px] font-bold text-[#f5f5f7] leading-none tracking-tight">
                        {stat.value}
                      </p>
                      <p className="text-[10px] font-semibold tracking-wider mt-1.5" style={{ color: 'rgba(255,255,255,0.25)' }}>
                        {stat.label}
                      </p>
                    </div>
                  </div>
                </div>
              </GradientBorderCard>
            </motion.div>
          ))}
        </motion.div>

        {/* ═══════════════════════════════════════
            SETTINGS
           ═══════════════════════════════════════ */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <SectionHeader icon={User} label="Settings" />

          {/* ── Custom Tabs ── */}
          <div className="flex gap-1.5 p-1 rounded-[12px] mb-7" style={{ background: 'rgba(255,255,255,0.03)' }}>
            {tabs.map((tab) => {
              const isActive = activeTab === tab.value;
              return (
                <button
                  key={tab.value}
                  onClick={() => setActiveTab(tab.value)}
                  className="flex-1 relative group text-left"
                  style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', padding: 0 }}
                >
                  <div
                    className={`px-4 py-2.5 rounded-[10px] transition-all duration-300 ${
                      isActive ? '' : 'hover:bg-[rgba(255,255,255,0.03)]'
                    }`}
                    style={{
                      background: isActive
                        ? 'linear-gradient(135deg, rgba(16,185,129,0.12), rgba(16,185,129,0.06))'
                        : 'transparent',
                      border: isActive ? '1px solid rgba(16,185,129,0.15)' : '1px solid transparent',
                    }}
                  >
                    <p className={`text-[13px] font-semibold transition-colors duration-300 ${
                      isActive ? 'text-[#f5f5f7]' : 'text-[rgba(255,255,255,0.35)]'
                    }`}>
                      {tab.label}
                    </p>
                    <p className={`text-[10px] mt-0.5 transition-all duration-300 ${
                      isActive
                        ? 'text-[rgba(16,185,129,0.6)] opacity-100'
                        : 'text-[rgba(255,255,255,0.2)] opacity-0 group-hover:opacity-100'
                    }`}>
                      {tab.description}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* ── Settings Items ── */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {SETTINGS_SECTIONS.find((s) => s.id === activeTab)?.items.map((item, idx) => {
              const handleClick = () => {
                if (item.action === 'scroll-top') window.scrollTo({ top: 0, behavior: 'smooth' });
                else if (item.action === 'forgot-password') navigate('/forgot-password');
                else if (item.action === 'coming-soon') {
                  toast('Coming soon!', {
                    description: 'This feature is not yet available.',
                    icon: <Zap size={14} />,
                    style: { background: 'rgba(30,30,32,0.95)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.1)', color: '#f5f5f7', fontSize: '14px' },
                  });
                }
              };
              return (
                <motion.button
                  key={item.label}
                  onClick={handleClick}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.12 + idx * 0.06 }}
                  className="w-full text-left group"
                  style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 'inherit', padding: 0 }}
                >
                  <GradientBorderCard>
                    <div className="p-5">
                      <div className="flex items-center gap-4">
                        {/* Icon container with colored background */}
                        <div
                          className="w-11 h-11 rounded-[12px] flex items-center justify-center flex-shrink-0 transition-all duration-300 group-hover:scale-110 group-hover:shadow-lg"
                          style={{ background: item.iconBg }}
                        >
                          <item.icon size={19} style={{ color: item.iconColor, transition: 'all 0.3s' }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[14px] font-semibold transition-colors duration-300 text-[rgba(255,255,255,0.7)] group-hover:text-[#f5f5f7]">
                            {item.label}
                          </p>
                          <p className="text-[11px] mt-1.5 transition-colors duration-300" style={{ color: 'rgba(255,255,255,0.25)' }}>
                            {item.description}
                          </p>
                        </div>
                        <motion.div className="flex-shrink-0" transition={{ duration: 0.2 }}>
                          <ChevronRight size={14} className="transition-all duration-300 group-hover:translate-x-0.5" style={{ color: 'rgba(255,255,255,0.12)', strokeWidth: 1.5 }} />
                        </motion.div>
                      </div>
                    </div>
                  </GradientBorderCard>
                </motion.button>
              );
            })}
          </div>
        </motion.div>

        {/* ── Brand Footer ── */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="text-center pt-6">
          <div className="inline-flex items-center gap-2" style={{ color: 'rgba(255,255,255,0.08)' }}>
            <Code2 size={13} />
            <span className="text-[10px] font-medium">AetherStudio v2.0</span>
          </div>
        </motion.div>

        <div className="h-8" />
      </div>

      <LandingFooter />
    </div>
  );
}
