import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../stores/useAuth';
import { api } from '../lib/api';
import {
  Plus, RefreshCw, Folder, Users, FileText, Activity,
  Rocket, Clock, Layout, Search,
  Loader2, AlertTriangle, Zap, Bell, Home,
} from 'lucide-react';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import WelcomeBanner from '../components/Dashboard/WelcomeBanner';
import StatsGrid from '../components/Dashboard/StatsGrid';
import QuickActions from '../components/Dashboard/QuickActions';
import WorkspaceCard from '../components/Dashboard/WorkspaceCard';
import CreateWorkspaceModal from '../components/Dashboard/CreateWorkspaceModal';
import RecentActivity from '../components/Dashboard/RecentActivity';
import Modal from '../components/Common/Modal';
import Badge from '../components/Common/Badge';
import { SkeletonCard } from '../components/Common/Skeleton';
import Avatar from '../components/Common/Avatar';
import Navbar from '../components/Common/Navbar';
import AnimatedCounter from '../components/Common/AnimatedCounter';
import LandingFooter from '../components/Landing/LandingFooter';

// ─── Particle System ──────────────────────────────────────────
function ParticleField({ count = 35 }) {
  const particles = useMemo(() =>
    Array.from({ length: count }, (_, i) => ({
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: 1 + (i % 4),
      delay: (i * 0.08) % 5,
      duration: 3 + (i % 6) * 0.8,
      drift: (i % 2 === 0 ? 20 : -20),
      color: i % 3 === 0 ? 'rgba(255,255,255,0.15)' : i % 3 === 1 ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.08)',
    })), [count]);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {particles.map((p, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            width: p.size,
            height: p.size,
            left: `${p.x}%`,
            top: `${p.y}%`,
            background: p.color,
            filter: `blur(${i % 2 === 0 ? 0 : 1}px)`,
          }}
          animate={{
            opacity: [0, 0.4, 0.1, 0.5, 0],
            scale: [1, 1.8, 0.7, 1.4, 1],
            x: [0, p.drift * 0.4, -p.drift * 0.3, p.drift * 0.6, 0],
            y: [0, -12 - (i % 8), 8 + (i % 6), -18 - (i % 4), 0],
          }}
          transition={{
            duration: p.duration + 1,
            delay: p.delay,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
}

// ─── Enhanced Background Orbs ─────────────────────────────────
function AmbientOrbs() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden">
      {/* Large floating blues */}
      <motion.div
        animate={{ x: [0, 80, -40, 60, 0], y: [0, -60, 40, -50, 0] }}
        transition={{ duration: 25, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute top-[5%] left-[3%] w-[600px] h-[600px] rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(255,255,255,0.03), transparent)',
          filter: 'blur(120px)',
        }}
      />
      <motion.div
        animate={{ x: [0, -60, 70, -40, 0], y: [0, 50, -60, 40, 0] }}
        transition={{ duration: 30, repeat: Infinity, ease: 'easeInOut', delay: 5 }}
        className="absolute bottom-[15%] right-[5%] w-[500px] h-[500px] rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(255,255,255,0.02), transparent)',
          filter: 'blur(100px)',
        }}
      />
      {/* Green accent */}
      <motion.div
        animate={{ scale: [1, 1.25, 0.9, 1], opacity: [0.03, 0.07, 0.03, 0.03] }}
        transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
        className="absolute top-[30%] right-[25%] w-[350px] h-[350px] rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(48,209,88,0.04), transparent)',
          filter: 'blur(90px)',
        }}
      />
      {/* Warm accent */}
      <motion.div
        animate={{ x: [0, 30, -20, 15, 0], opacity: [0.02, 0.05, 0.02, 0.04, 0.02] }}
        transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut', delay: 8 }}
        className="absolute top-[55%] left-[60%] w-[280px] h-[280px] rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(255,159,10,0.03), transparent)',
          filter: 'blur(80px)',
        }}
      />
      {/* Subtle grid overlay */}
      <div
        className="absolute inset-0"
        style={{
          opacity: 0.015,
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.06) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
        }}
      />
    </div>
  );
}

// ─── Glass Card Wrapper ─────────────────────────────────────
function GlassCard({ children, className = '', hover = true, as = 'div', glow = false, ...props }) {
  const Tag = as;
  return (
    <Tag
      className={`relative group overflow-hidden rounded-[14px] border ${hover ? 'transition-all duration-300' : ''} ${className}`}
      style={{
        background: 'rgba(14,14,18,0.7)',
        borderColor: glow ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.05)',
        boxShadow: glow
          ? '0 8px 40px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.06), inset 0 1px 0 rgba(255,255,255,0.04)'
          : '0 8px 40px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.03)',
        backdropFilter: 'blur(16px) saturate(1.4)',
        WebkitBackdropFilter: 'blur(16px) saturate(1.4)',
      }}
      {...props}
    >
      {hover && (
        <div
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
          style={{
            background: 'linear-gradient(135deg, rgba(255,255,255,0.02) 0%, transparent 50%)',
          }}
        />
      )}
      {children}
    </Tag>
  );
}

// ─── Floating Code Particles ─────────────────────────────────
function CodeFloaters() {
  const snippets = useMemo(() => [
    { text: 'import React from "react"', color: '#dedee4' },
    { text: 'const App = () => {}', color: '#ff9f0a' },
    { text: 'npm run dev', color: '#30d158' },
    { text: 'git push origin main', color: 'rgba(255,255,255,0.2)' },
    { text: 'docker compose up', color: '#b0b0bc' },
    { text: 'console.log("hello")', color: '#dcccb5' },
    { text: 'export default App', color: '#ff9f0a' },
    { text: 'yarn add react', color: '#30d158' },
  ], []);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden">
      {snippets.map((s, i) => (
        <motion.div
          key={i}
          className="absolute select-none font-mono font-medium tracking-tight whitespace-nowrap"
          initial={{ x: `${5 + (i * 12) % 85}vw`, y: '110vh', opacity: 0 }}
          animate={{
            y: '-20vh',
            opacity: [0, 0.25, 0.35, 0.2, 0],
            x: [`${5 + (i * 12) % 85}vw`, `${5 + (i * 12) % 85 + (i % 2 === 0 ? -4 : 4)}vw`],
          }}
          transition={{
            duration: 18 + (i % 4) * 4,
            delay: (i % 6) * 2.5,
            repeat: Infinity,
            ease: 'linear',
            times: [0, 0.08, 0.3, 0.6, 1],
          }}
        >
          <span style={{
            fontSize: `${9 + (i % 3) * 2}px`,
            color: s.color,
            opacity: 0.5,
            textShadow: `0 0 8px ${s.color}15`,
          }}>
            <span style={{ opacity: 0.2 }}>$</span> {s.text}
          </span>
        </motion.div>
      ))}
    </div>
  );
}

// ─── Tab Data ─────────────────────────────────────────────────
const DASHBOARD_TABS = [
  { label: 'Overview', value: 'overview', icon: Layout },
  { label: 'Workspaces', value: 'workspaces', icon: Folder },
];

// ─── Section Header ──────────────────────────────────────────
function SectionHeader({ icon: Icon, label, gradient = 'from-[rgba(255,255,255,0.08)] to-[rgba(255,255,255,0.04)]', badge }) {
  return (
    <div className="flex items-center gap-2.5 mb-4">
      <div className={`w-[3px] h-6 rounded-full bg-gradient-to-b ${gradient}`} />
      <div className="flex items-center gap-2">
        {Icon && <Icon size={14} className="text-[rgba(255,255,255,0.3)]" />}
        <h2 className="text-[13px] font-semibold tracking-wide" style={{ color: 'rgba(255,255,255,0.4)' }}>
          {label}
        </h2>
      </div>
      {badge && (
        <span className="ml-1 px-1.5 py-0.5 rounded text-[9px] font-semibold uppercase tracking-[0.5px]"
          style={{ background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.25)' }}
        >
          {badge}
        </span>
      )}
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────
export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [workspaces, setWorkspaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    fetchWorkspaces();
  }, [user, navigate]);

  const fetchWorkspaces = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/workspace');
      setWorkspaces(data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (name, description, template) => {
    setCreating(true);
    try {
      const { data } = await api.post('/workspace', { name, description });
      navigate(`/workspace/${data._id}`);
    } catch (err) {
      setError(err.message);
      setCreating(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/workspace/${deleteTarget._id}`);
      setWorkspaces((prev) => prev.filter((ws) => ws._id !== deleteTarget._id));
      setDeleteTarget(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setDeleting(false);
    }
  };

  const filteredWorkspaces = workspaces.filter((ws) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return ws.name?.toLowerCase().includes(q) || ws.description?.toLowerCase().includes(q);
  });

  // Mouse-reactive glow — MUST be before any conditional returns
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

  const quickStats = [
    { label: 'Workspaces', value: workspaces.length, icon: Folder, color: '#c8c8d0', bg: 'rgba(200,200,208,0.12)', sub: 'Active projects' },
    { label: 'Active Collaborators', value: workspaces.reduce((s, w) => s + (w.collaboratorIds?.length || 0), 0) || '—', icon: Users, color: '#30d158', bg: 'rgba(48,209,88,0.12)', sub: 'Team members' },
    { label: 'Files Created', value: workspaces.reduce((s, w) => s + (w.fileCount || 0), 0) || '—', icon: FileText, color: '#b0b0bc', bg: 'rgba(176,176,188,0.12)', sub: 'Across all projects' },
    { label: 'System', value: 'Online', icon: Activity, color: '#ffd60a', bg: 'rgba(255,214,10,0.12)', sub: 'All systems nominal' },
  ];

  // ─── Loading State ──────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-[#000000]" ref={glowRef} onMouseMove={handleMouseMove}>
        <AmbientOrbs />
        <ParticleField />
        <div className="relative max-w-7xl mx-auto px-6 pt-32 pb-8">
          <div className="space-y-2 mb-10">
            <div className="skeleton h-9 w-80 rounded-xl" />
            <div className="skeleton h-4 w-52 rounded-xl" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
            {[1,2,3,4].map(i => (
              <div key={i} className="rounded-[14px] overflow-hidden">
                <SkeletonCard />
              </div>
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1,2,3,4,5,6].map(i => (
              <div key={i} className="rounded-[14px] overflow-hidden">
                <SkeletonCard />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#000000]" ref={glowRef} onMouseMove={handleMouseMove}>
      <AmbientOrbs />
      <ParticleField />
      <CodeFloaters />

      {/* ── Mouse tracking glow ── */}
      <motion.div
        className="fixed pointer-events-none rounded-full"
        style={{
          width: 400,
          height: 400,
          x: glowX,
          y: glowY,
          background: 'radial-gradient(circle, rgba(255,255,255,0.02), transparent)',
          filter: 'blur(80px)',
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)',
        }}
      />

      {/* ── Navbar ── */}
      <Navbar
        hideNavLinks
        tabs={DASHBOARD_TABS}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        user={user}
        onProfileClick={() => navigate('/profile')}
        rightContent={
          <div className="flex items-center gap-1.5 md:gap-2">
            {/* Action buttons */}
            {[
              { icon: Home, onClick: () => navigate('/'), tooltip: 'Home' },
              { icon: RefreshCw, onClick: fetchWorkspaces, tooltip: 'Refresh' },
              { icon: Bell, tooltip: 'Notifications', dot: true },
            ].map((btn, i) => (
              <motion.button
                key={i}
                whileHover={{ scale: 1.05, background: 'rgba(255,255,255,0.07)' }}
                whileTap={{ scale: 0.95 }}
                onClick={btn.onClick}
                className="relative w-8 h-8 rounded-[9px] flex items-center justify-center transition-all duration-200"
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.05)',
                  color: 'rgba(255,255,255,0.25)',
                }}
                title={btn.tooltip}
              >
                <btn.icon size={13} />
                {btn.dot && (
                  <span
                    className="absolute top-[6px] right-[6px] w-[5px] h-[5px] rounded-full animate-pulse"
                    style={{ background: '#30d158', boxShadow: '0 0 6px rgba(48,209,88,0.5)' }}
                  />
                )}
              </motion.button>
            ))}

            {/* Profile icon */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/profile')}
              className="relative"
            >
              <Avatar
                name={user?.name}
                email={user?.email}
                src={user?.avatar}
                size="sm"
                className="cursor-pointer ring-2 ring-transparent hover:ring-[rgba(255,255,255,0.08)] transition-all duration-300"
              />
            </motion.button>
          </div>
        }
      />

      <div className="relative max-w-7xl mx-auto px-6 pt-32 pb-6 md:pb-8 space-y-8 animate-fade-in">

        {/* ── Tab Content ── */}
        <AnimatePresence mode="wait">
          {activeTab === 'overview' && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
              className="space-y-6"
            >
              {/* Welcome Banner */}
              <div className="mb-10">
                <WelcomeBanner user={user} workspaceCount={workspaces.length} />
              </div>

              {/* Quick Stats */}
              <div>
                <StatsGrid stats={quickStats} />
              </div>

              {/* Spacer */}
              <div className="relative" style={{ height: '60px' }} />

              {/* Quick Actions */}
              <div className="mb-6 relative">
                <div className="relative">
                  <SectionHeader icon={Zap} label="Quick Actions" gradient="from-[rgba(255,255,255,0.08)] to-[rgba(255,255,255,0.04)]" badge="hotkeys" />
                  <QuickActions onCreateWorkspace={() => setShowCreate(true)} />
                </div>
              </div>

              {/* Recent Activity */}
              <div className="relative pt-8">
                <SectionHeader icon={Clock} label="Recent Activity" gradient="from-[#30d158] to-[#dcccb5]" />
                <GlassCard hover={false} glow>
                  <div className="p-4 md:p-5">
                    <RecentActivity activities={[]} />
                  </div>
                </GlassCard>
              </div>
            </motion.div>
          )}

          {activeTab === 'workspaces' && (
            <motion.div
              key="workspaces"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
              className="space-y-6"
            >
              {/* Section Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-[3px] h-7 rounded-full bg-gradient-to-b from-[#c8c8d0] to-[#b0b0bc]" />
                  <h2 className="text-[18px] font-bold text-[#f5f5f7] tracking-tight whitespace-nowrap">
                    All Workspaces
                  </h2>
                  <Badge variant="accent" size="sm" dot pulse>
                    {workspaces.length} total
                  </Badge>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  {/* Mobile search */}
                  <div className="relative flex-1 sm:hidden">
                    <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'rgba(255,255,255,0.12)' }} />
                    <input
                      type="text"
                      placeholder="Search..."
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      className="w-full py-[7px] pl-8 pr-3 rounded-[8px] text-[12px] outline-none transition-all duration-200"
                      style={{
                        background: 'rgba(255,255,255,0.03)',
                        border: '1px solid rgba(255,255,255,0.05)',
                        color: 'rgba(255,255,255,0.6)',
                      }}
                      autoComplete="off"
                    />
                  </div>

                  {/* Refresh */}
                  <motion.button
                    whileHover={{ scale: 1.05, background: 'rgba(255,255,255,0.07)' }}
                    whileTap={{ scale: 0.95 }}
                    onClick={fetchWorkspaces}
                    className="w-7 h-7 rounded-[7px] flex items-center justify-center transition-all duration-200 flex-shrink-0"
                    style={{
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid rgba(255,255,255,0.05)',
                      color: 'rgba(255,255,255,0.25)',
                    }}
                    title="Refresh"
                  >
                    <RefreshCw size={11} />
                  </motion.button>
                </div>
              </div>

              {/* Error State */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="flex items-center gap-2.5 p-3.5 rounded-[10px]"
                    style={{
                      background: 'rgba(255,69,58,0.06)',
                      border: '1px solid rgba(255,69,58,0.12)',
                    }}
                  >
                    <div className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(255,69,58,0.1)' }}>
                      <AlertTriangle size={12} className="text-[#ff453a]" />
                    </div>
                    <p className="text-[12px] text-[#ff453a] font-medium flex-1">{error}</p>
                    <motion.button
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={fetchWorkspaces}
                      className="px-3 py-1.5 rounded-[7px] text-[11px] font-semibold text-white transition-all"
                      style={{
                        background: 'linear-gradient(135deg, #ff453a, #ff6961)',
                        boxShadow: '0 2px 8px rgba(255,69,58,0.2)',
                      }}
                    >
                      Retry
                    </motion.button>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Workspace Grid */}
              <AnimatePresence mode="wait">
                {filteredWorkspaces.length === 0 ? (
                  searchQuery ? (
                    <GlassCard className="p-10" hover={false}>
                      <div className="text-center py-10">
                        <motion.div
                          initial={{ scale: 0.8, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                          className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5"
                          style={{ background: 'rgba(255,255,255,0.02)' }}
                        >
                          <Search size={24} style={{ color: 'rgba(255,255,255,0.12)' }} />
                        </motion.div>
                        <h3 className="text-[16px] font-semibold text-[#f5f5f7] mb-1.5">No results found</h3>
                        <p className="text-[12px] max-w-xs mx-auto" style={{ color: 'rgba(255,255,255,0.3)' }}>
                          No workspaces match &ldquo;{searchQuery}&rdquo;. Try a different search term.
                        </p>
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => setSearchQuery('')}
                          className="mt-5 px-5 py-2.5 rounded-[9px] text-[12px] font-semibold transition-all"
                          style={{
                            background: 'rgba(255,255,255,0.04)',
                            border: '1px solid rgba(255,255,255,0.06)',
                            color: 'rgba(255,255,255,0.5)',
                          }}
                        >
                          Clear Search
                        </motion.button>
                      </div>
                    </GlassCard>
                  ) : (
                    <GlassCard className="p-10" hover={false}>
                      <div className="text-center py-10">
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.1 }}
                          className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5"
                          style={{ background: 'rgba(200,200,208,0.08)' }}
                        >
                          <Rocket size={28} style={{ color: '#dedee4' }} />
                        </motion.div>
                        <motion.h3
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.2 }}
                          className="text-[18px] font-semibold text-[#f5f5f7] mb-1.5"
                        >
                          Start your journey
                        </motion.h3>
                        <motion.p
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.25 }}
                          className="text-[12px] max-w-xs mx-auto" style={{ color: 'rgba(255,255,255,0.3)' }}
                        >
                          Create your first workspace and start coding collaboratively in real-time.
                        </motion.p>
                        <motion.button
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.3 }}
                          whileHover={{ scale: 1.03, y: -2 }}
                          whileTap={{ scale: 0.97 }}
                          onClick={() => setShowCreate(true)}
                          className="mt-6 inline-flex items-center gap-2 px-6 py-2.5 rounded-[10px] text-[13px] font-semibold text-white transition-all"
                          style={{
                            background: 'linear-gradient(135deg, #c8c8d0, #dedee4)',
                            boxShadow: '0 4px 24px rgba(200,200,208,0.25)',
                          }}
                          onMouseEnter={e => e.currentTarget.style.boxShadow = '0 6px 32px rgba(200,200,208,0.35)'}
                          onMouseLeave={e => e.currentTarget.style.boxShadow = '0 4px 24px rgba(200,200,208,0.25)'}
                        >
                          <Plus size={15} />
                          Create Workspace
                        </motion.button>
                      </div>
                    </GlassCard>
                  )
                ) : (
                  <motion.div
                    key="workspace-grid"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
                  >
                    {filteredWorkspaces.map((ws, index) => (
                      <WorkspaceCard
                        key={ws._id}
                        workspace={ws}
                        index={index}
                        onClick={() => navigate(`/workspace/${ws._id}`)}
                        onDelete={() => setDeleteTarget(ws)}
                      />
                    ))}
                    {/* Add workspace card */}
                    <motion.button
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: filteredWorkspaces.length * 0.04, type: 'spring', stiffness: 300, damping: 25 }}
                      whileHover={{
                        y: -6,
                        borderColor: 'rgba(200,200,208,0.35)',
                        background: 'rgba(200,200,208,0.04)',
                        boxShadow: '0 12px 40px rgba(200,200,208,0.1)',
                      }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => setShowCreate(true)}
                      className="rounded-[14px] border border-dashed p-5 flex flex-col items-center justify-center min-h-[200px] cursor-pointer transition-all duration-300 group"
                      style={{
                        background: 'rgba(14,14,18,0.4)',
                        borderColor: 'rgba(255,255,255,0.06)',
                        backdropFilter: 'blur(8px)',
                      }}
                    >
                      <motion.div
                        whileHover={{ rotate: 90 }}
                        transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
                        className="w-12 h-12 rounded-xl flex items-center justify-center mb-3 transition-colors"
                        style={{ background: 'rgba(200,200,208,0.08)' }}
                      >
                        <Plus size={22} style={{ color: '#dedee4' }} />
                      </motion.div>
                      <p className="text-[13px] font-medium" style={{ color: 'rgba(255,255,255,0.25)' }}>
                        New Workspace
                      </p>
                      <p className="text-[10px] mt-1" style={{ color: 'rgba(255,255,255,0.12)' }}>
                        Start from scratch or a template
                      </p>
                    </motion.button>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>

      </div>

      <LandingFooter />

      {/* Create Workspace Modal */}
      <CreateWorkspaceModal
        isOpen={showCreate}
        onClose={() => setShowCreate(false)}
        onCreate={handleCreate}
        creating={creating}
      />

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deleteTarget}
        onClose={() => !deleting && setDeleteTarget(null)}
        title="Delete Workspace"
        description={`Are you sure you want to delete "${deleteTarget?.name || ''}"? This will permanently remove all files and cannot be undone.`}
        size="sm"
        footer={
          <>
            <button
              onClick={() => setDeleteTarget(null)}
              disabled={deleting}
              className="px-4 py-2 rounded-[8px] text-[12px] font-semibold transition-all"
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.06)',
                color: 'rgba(255,255,255,0.5)',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
                e.currentTarget.style.color = 'rgba(255,255,255,0.7)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
                e.currentTarget.style.color = 'rgba(255,255,255,0.5)';
              }}
            >
              Cancel
            </button>
            <motion.button
              onClick={handleDelete}
              disabled={deleting}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-[8px] text-[12px] font-semibold text-white transition-all"
              style={{
                background: 'linear-gradient(135deg, #ff453a, #ff6961)',
                boxShadow: '0 4px 16px rgba(255,69,58,0.25)',
                opacity: deleting ? 0.6 : 1,
                cursor: deleting ? 'not-allowed' : 'pointer',
              }}
              whileHover={!deleting ? { scale: 1.02 } : {}}
              whileTap={!deleting ? { scale: 0.98 } : {}}
            >
              {deleting ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <AlertTriangle size={14} />
              )}
              {deleting ? 'Deleting…' : 'Delete'}
            </motion.button>
          </>
        }
      />
    </div>
  );
}
