import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Home, Folder, Calendar, Code2, Users, ArrowLeft,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { api } from '../lib/api';
import Avatar from '../components/Common/Avatar';
import Badge from '../components/Common/Badge';
import LandingFooter from '../components/Landing/LandingFooter';
import Navbar from '../components/Common/Navbar';

function ParticleField({ count = 25 }) {
  const particles = useMemo(() =>
    Array.from({ length: count }, (_, i) => ({
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: 1 + (i % 4),
      delay: (i * 0.08) % 5,
      duration: 3 + (i % 6) * 0.8,
      drift: (i % 2 === 0 ? 20 : -20),
      color: i % 3 === 0 ? '#b89450' : i % 3 === 1 ? '#a07840' : '#d4bc80',
    })), [count]);
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {particles.map((p, i) => (
        <motion.div key={i} className="absolute rounded-full"
          style={{ width: p.size, height: p.size, left: p.x + '%', top: p.y + '%', background: p.color, filter: 'blur(' + (i % 2 === 0 ? 0 : 1) + 'px)' }}
          animate={{ opacity: [0, 0.4, 0.1, 0.5, 0], scale: [1, 1.8, 0.7, 1.4, 1], x: [0, p.drift * 0.4, -p.drift * 0.3, p.drift * 0.6, 0], y: [0, -12 - (i % 8), 8 + (i % 6), -18 - (i % 4), 0] }}
          transition={{ duration: p.duration + 1, delay: p.delay, repeat: Infinity, ease: 'easeInOut' }}
        />
      ))}
    </div>
  );
}

function AmbientOrbs() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden">
      <motion.div animate={{ x: [0, 80, -40, 60, 0], y: [0, -60, 40, -50, 0] }} transition={{ duration: 25, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute top-[5%] left-[3%] w-[600px] h-[600px] rounded-full"
        style={{ background: 'radial-gradient(circle, rgba(184,148,80,0.06), rgba(212,188,128,0.02), transparent)', filter: 'blur(120px)' }}
      />
      <motion.div animate={{ x: [0, -60, 70, -40, 0], y: [0, 50, -60, 40, 0] }} transition={{ duration: 30, repeat: Infinity, ease: 'easeInOut', delay: 5 }}
        className="absolute bottom-[15%] right-[5%] w-[500px] h-[500px] rounded-full"
        style={{ background: 'radial-gradient(circle, rgba(160,120,64,0.05), rgba(144,137,255,0.02), transparent)', filter: 'blur(100px)' }}
      />
      <motion.div animate={{ scale: [1, 1.25, 0.9, 1], opacity: [0.03, 0.07, 0.03, 0.03] }} transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
        className="absolute top-[30%] right-[25%] w-[350px] h-[350px] rounded-full"
        style={{ background: 'radial-gradient(circle, rgba(48,209,88,0.04), transparent)', filter: 'blur(90px)' }}
      />
      <div className="absolute inset-0" style={{ opacity: 0.015, backgroundImage: 'linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.06) 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
    </div>
  );
}

function GlassCard({ children, className = '', hover = true, ...props }) {
  return (
    <div
      className={'relative group overflow-hidden rounded-[14px] border ' + (hover ? 'transition-all duration-300' : '') + ' ' + className}
      style={{
        background: 'rgba(14,14,18,0.7)',
        borderColor: 'rgba(184,148,80,0.2)',
        boxShadow: '0 8px 40px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.03)',
        backdropFilter: 'blur(16px) saturate(1.4)',
        WebkitBackdropFilter: 'blur(16px) saturate(1.4)',
      }}
      {...props}
    >
      {hover && (
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
          style={{ background: 'linear-gradient(135deg, rgba(184,148,80,0.03) 0%, transparent 50%)' }}
        />
      )}
      {children}
    </div>
  );
}

export default function UserPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setError(null);
    api.get('/users/' + id)
      .then(({ data }) => { setProfile(data); setLoading(false); })
      .catch((err) => { setError(err.response?.data?.error || 'User not found'); setLoading(false); });
  }, [id]);

  const memberDate = profile?.memberSince
    ? new Date(profile.memberSince).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    : '---';

  return (
    <div className="min-h-screen bg-[#000000]">
      <AmbientOrbs />
      <ParticleField />

      {/* Navbar */}
      <Navbar
        hideNavLinks
        onProfileClick={() => navigate('/profile')}
      />

      <div className="relative max-w-7xl mx-auto px-6 pt-32 pb-6 animate-fade-in">

        <motion.button
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 mb-6 text-[12px] font-medium transition-all duration-200 hover:text-[#f5f5f7]"
          style={{ color: 'rgba(255,255,255,0.3)' }}
          onMouseEnter={e => e.currentTarget.style.color = '#f5f5f7'}
          onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.3)'}
        >
          <ArrowLeft size={14} /> Back
        </motion.button>

        {loading ? (
          <div className="max-w-2xl mx-auto">
            <GlassCard hover={false}>
              <div className="p-8 text-center">
                <div className="w-[100px] h-[100px] rounded-full mx-auto skeleton" />
                <div className="h-8 w-48 skeleton rounded-xl mx-auto mt-5" />
                <div className="h-4 w-32 skeleton rounded-xl mx-auto mt-2" />
                <div className="h-12 w-64 skeleton rounded-xl mx-auto mt-4" />
              </div>
            </GlassCard>
          </div>
        ) : error ? (
          <div className="max-w-md mx-auto text-center py-20">
            <GlassCard hover={false}>
              <div className="p-10">
                <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }}
                  className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5"
                  style={{ background: 'rgba(255,255,255,0.02)' }}
                >
                  <Users size={28} style={{ color: 'rgba(255,255,255,0.12)' }} />
                </motion.div>
                <h3 className="text-[16px] font-semibold text-[#f5f5f7] mb-1.5">User not found</h3>
                <p className="text-[12px] max-w-xs mx-auto" style={{ color: 'rgba(255,255,255,0.3)' }}>{error}</p>
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  onClick={() => navigate('/dashboard')}
                  className="mt-5 px-5 py-2.5 rounded-[9px] text-[12px] font-semibold transition-all inline-flex items-center gap-2"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)' }}
                >
                  <Home size={13} /> Go to Dashboard
                </motion.button>
              </div>
            </GlassCard>
          </div>
        ) : (
          <div className="max-w-2xl mx-auto">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}>
              <GlassCard>
                <div className="p-8 md:p-10 text-center">
                  <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.1, type: 'spring', stiffness: 200, damping: 15 }}
                    className="relative inline-block"
                  >
                    <motion.div className="absolute -inset-1 rounded-full opacity-30"
                      animate={{ scale: [1, 1.08, 1], rotate: [0, 180, 360] }}
                      transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
                      style={{ background: 'conic-gradient(from 0deg, #b89450, #d4bc80, #a07840, #b89450)', filter: 'blur(4px)' }}
                    />
                    <Avatar name={profile?.name} email={profile?.email} src={profile?.avatar} size="xxl" />
                  </motion.div>

                  <motion.h1 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15, duration: 0.4 }}
                    className="text-[28px] md:text-[32px] font-bold text-[#f5f5f7] tracking-tight mt-5"
                  >{profile?.name}</motion.h1>

                  <motion.div initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ delay: 0.2, duration: 0.5 }}
                    className="w-16 h-[2px] mx-auto mt-2 mb-4 rounded-full"
                    style={{ background: 'linear-gradient(90deg, #b89450, #d4bc80, transparent)' }}
                  />

                  {profile?.bio && (
                    <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.4 }}
                      className="text-[14px] max-w-md mx-auto leading-relaxed"
                      style={{ color: 'rgba(255,255,255,0.4)' }}
                    >{profile.bio}</motion.p>
                  )}

                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }}
                    className="flex items-center justify-center gap-2 mt-4 flex-wrap"
                  >
                    <Badge variant="accent" dot>Developer</Badge>
                    <Badge variant="neutral" dot>Joined {memberDate}</Badge>
                  </motion.div>
                </div>
              </GlassCard>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.4 }}
              className="grid grid-cols-2 gap-3 mt-4"
            >
              <GlassCard hover={false}>
                <div className="flex items-center gap-4 p-5">
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(184,148,80,0.12)' }}>
                    <Folder size={18} style={{ color: '#b89450' }} />
                  </div>
                  <div>
                    <p className="text-[22px] font-bold text-[#f5f5f7] leading-none">{profile?.workspaceCount || 0}</p>
                    <p className="text-[11px] font-medium mt-1" style={{ color: 'rgba(255,255,255,0.3)' }}>Workspaces</p>
                  </div>
                </div>
              </GlassCard>

              <GlassCard hover={false}>
                <div className="flex items-center gap-4 p-5">
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(212,188,128,0.12)' }}>
                    <Calendar size={18} style={{ color: '#d4bc80' }} />
                  </div>
                  <div>
                    <p className="text-[16px] font-bold text-[#f5f5f7] leading-none">{memberDate}</p>
                    <p className="text-[11px] font-medium mt-1" style={{ color: 'rgba(255,255,255,0.3)' }}>Member Since</p>
                  </div>
                </div>
              </GlassCard>
            </motion.div>

            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
              className="text-center pt-8"
            >
              <div className="inline-flex items-center gap-2" style={{ color: 'rgba(255,255,255,0.1)' }}>
                <Code2 size={14} />
                <span className="text-[11px] font-medium">AetherStudio</span>
              </div>
            </motion.div>
          </div>
        )}
      </div>

      <LandingFooter />
    </div>
  );
}
