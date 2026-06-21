import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../stores/useAuth';
import { api } from '../lib/api';
import { MapPin, Briefcase, GraduationCap, Camera, LogOut, ChevronDown, ChevronUp, User, Key, Globe, Palette, Bell, Smartphone, ChevronRight, Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import AetherStudioLogo from '../components/Common/AetherStudioLogo';
import Avatar from '../components/Common/Avatar';
import Navbar from '../components/Common/Navbar';
import LandingFooter from '../components/Landing/LandingFooter';
import AvatarCropModal from '../components/Dashboard/AvatarCropModal';
import { toast } from 'sonner';

function SettingsCard({ item, navigate, toast: t, Zap: Z }) {
  const handleClick = () => {
    if (item.action === 'scroll-top') window.scrollTo({ top: 0, behavior: 'smooth' });
    else if (item.action === 'forgot-password') navigate('/forgot-password');
    else if (item.action === 'coming-soon') {
      t('Coming soon!', {
        description: 'This feature is not yet available.',
        icon: <Z size={14} />,
        style: { background: 'rgba(30,30,32,0.95)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.1)', color: '#f5f5f7', fontSize: '14px' },
      });
    }
  };
  return (
    <button
      onClick={handleClick}
      className="w-full text-left group transition-all duration-200"
      style={{
        background: 'rgba(255,255,255,0.02)',
        border: '1px solid rgba(255,255,255,0.04)',
        borderRadius: '12px',
        cursor: 'pointer',
        fontFamily: 'inherit',
        fontSize: 'inherit',
        padding: 0,
      }}
      onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
      onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
    >
      <div className="flex items-center gap-3.5 px-4 py-3.5">
        <div className="w-9 h-9 rounded-[10px] flex items-center justify-center flex-shrink-0"
          style={{ background: 'rgba(255,255,255,0.04)' }}
        >
          <item.icon size={16} style={{ color: 'rgba(255,255,255,0.35)' }} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-semibold" style={{ color: 'rgba(255,255,255,0.6)' }}>{item.label}</p>
          <p className="text-[11px] mt-0.5" style={{ color: 'rgba(255,255,255,0.25)' }}>{item.description}</p>
        </div>
        <ChevronRight size={14} style={{ color: 'rgba(255,255,255,0.12)', strokeWidth: 1.5 }} />
      </div>
    </button>
  );
}

export default function ProfilePage() {
  const { user: authUser, logout, uploadAvatar } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = React.useRef(null);

  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState({ workspaces: 0, collaborations: 0, files: 0 });
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [cropImageSrc, setCropImageSrc] = useState(null);
  const [bioExpanded, setBioExpanded] = useState(false);
  const [activeSection, setActiveSection] = useState('bio');
  const [bioEditing, setBioEditing] = useState(false);
  const [bioDraft, setBioDraft] = useState('');
  const [savingBio, setSavingBio] = useState(false);

  const BIO_SUGGESTIONS = [
    'Full-stack developer passionate about building elegant solutions and exploring new technologies.',
    'Open-source enthusiast contributing to projects that make development more accessible for everyone.',
    'Creative problem-solver who loves turning complex challenges into simple, intuitive experiences.',
    'Design-minded engineer focused on bridging the gap between beautiful interfaces and robust architecture.',
    'Building the future of collaborative development — one commit at a time.',
  ];

  const SETTINGS_SECTIONS = [
    {
      id: 'account', label: 'Account',
      items: [
        { icon: User, label: 'Personal Info', description: 'Name, email, and profile picture', action: 'scroll-top' },
        { icon: Key, label: 'Password & Security', description: 'Update password and security settings', action: 'forgot-password' },
        { icon: Globe, label: 'Language & Region', description: 'Timezone and locale preferences', action: 'coming-soon' },
      ],
    },
    {
      id: 'preferences', label: 'Preferences',
      items: [
        { icon: Palette, label: 'Appearance', description: 'Theme, font size, and layout options', action: 'coming-soon' },
        { icon: Bell, label: 'Notifications', description: 'Email and in-app notification settings', action: 'coming-soon' },
        { icon: Smartphone, label: 'Devices', description: 'Manage connected devices and sessions', action: 'coming-soon' },
      ],
    },
    {
      id: 'activity', label: 'Activity',
      items: [
        { icon: Zap, label: 'Recent Activity', description: 'View your coding history and contributions', action: 'coming-soon' },
        { icon: Zap, label: 'Coding Streaks', description: 'Track your daily coding consistency', action: 'coming-soon' },
        { icon: Zap, label: 'Contributions', description: 'Open-source and project contributions', action: 'coming-soon' },
      ],
    },
    {
      id: 'integrations', label: 'Integrations',
      items: [
        { icon: Zap, label: 'GitHub', description: 'Sync repositories and authenticate with GitHub', action: 'coming-soon' },
        { icon: Zap, label: 'Webhooks', description: 'Configure incoming and outgoing webhooks', action: 'coming-soon' },
      ],
    },
  ];

  useEffect(() => {
    if (!authUser?._id) return;
    api.get(`/users/${authUser._id}`).then(({ data }) => {
      setProfile(data);
      setStats((s) => ({ ...s, workspaces: data.workspaceCount ?? 0 }));
    }).catch(() => {});
    api.get('/workspaces').then(({ data }) => {
      const workspaces = Array.isArray(data) ? data : [];
      const collabCount = workspaces.filter((w) =>
        w.collaboratorIds?.some((id) => String(id) === String(authUser._id))
      ).length;
      let fileCount = 0;
      const countFiles = (node) => {
        if (!node) return;
        if (node.type === 'file') fileCount++;
        (node.children || []).forEach(countFiles);
      };
      workspaces.forEach((w) => countFiles(w.fileTree));
      setStats((s) => ({ ...s, collaborations: collabCount, files: fileCount }));
    }).catch(() => {});
  }, [authUser?._id]);

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
  const handleSignOut = () => { logout(); navigate('/login'); };

  const handleSaveBio = async () => {
    if (!bioDraft.trim() || savingBio) return;
    setSavingBio(true);
    try {
      await api.patch('/users/bio', { bio: bioDraft });
      setProfile((prev) => ({ ...prev, bio: bioDraft }));
      setBioEditing(false);
      toast('Bio updated', { icon: '✅', style: { background: 'rgba(30,30,32,0.95)', border: '1px solid rgba(255,255,255,0.1)', color: '#f5f5f7' } });
    } catch {
      toast('Failed to save bio', { icon: '❌', style: { background: 'rgba(30,30,32,0.95)', border: '1px solid rgba(255,255,255,0.1)', color: '#f5f5f7' } });
    } finally {
      setSavingBio(false);
    }
  };

  const user = authUser;
  const bio = profile?.bio || '';
  const shouldTruncate = bio.length > 120;

  return (
    <div className="min-h-screen bg-[#0a0a0c]">
      <Navbar
        hideNavLinks
        user={user}
        onProfileClick={() => navigate('/profile')}
        rightContent={
          <div className="flex items-center gap-1.5 md:gap-2">
            <button onClick={() => navigate('/')}
              className="w-8 h-8 rounded-[9px] flex items-center justify-center transition-all duration-200"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.25)' }}
              title="Home"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
            </button>
            <button onClick={() => navigate('/dashboard')}
              className="px-3.5 py-1.5 rounded-[8px] text-[11px] font-semibold"
              style={{ background: '#d4d4d8', color: '#18181b' }}
            >Dashboard</button>
          </div>
        }
      />

      <AvatarCropModal
        isOpen={cropModalOpen}
        onClose={() => { setCropModalOpen(false); setCropImageSrc(null); }}
        imageSrc={cropImageSrc}
        onCropComplete={handleCropComplete}
      />

      {/* ═══ ANIMATED AETHERSTUDIO BANNER ═══ */}
      <section className="relative block overflow-hidden" style={{ height: '540px' }}>
        {/* Background */}
        <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, #0f0f14 0%, #1a1a24 30%, #12121a 60%, #0a0a0e 100%)' }}>
          {/* Subtle grid */}
          <div className="absolute inset-0" style={{ opacity: 0.03, backgroundImage: `linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.06) 1px, transparent 1px)`, backgroundSize: '60px 60px' }} />
          {/* Ambient orbs */}
          <motion.div animate={{ x: [0, 60, -30, 40, 0], y: [0, -40, 30, -30, 0] }} transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute top-[10%] left-[5%] w-[400px] h-[400px] rounded-full pointer-events-none"
            style={{ background: 'radial-gradient(circle, rgba(200,200,208,0.08), transparent 70%)', filter: 'blur(80px)' }} />
          <motion.div animate={{ x: [0, -40, 50, -20, 0], y: [0, 30, -40, 20, 0] }} transition={{ duration: 25, repeat: Infinity, ease: 'easeInOut', delay: 5 }}
            className="absolute bottom-[15%] right-[10%] w-[350px] h-[350px] rounded-full pointer-events-none"
            style={{ background: 'radial-gradient(circle, rgba(222,222,228,0.05), transparent 70%)', filter: 'blur(80px)' }} />
        </div>

        {/* ═══ Branding Content ═══ */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {/* Animated A logo */}
          <motion.div
            initial={{ opacity: 0, scale: 0.85, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          >
            <AetherStudioLogo size={100} animated glow />
          </motion.div>

          {/* Wordmark */}
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="text-[28px] font-bold tracking-tight mt-4"
            style={{ color: 'rgba(255,255,255,0.12)', letterSpacing: '-0.02em' }}
          >
            AetherStudio
          </motion.p>

          {/* Tagline */}
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.7 }}
            className="text-[10px] font-medium tracking-[3px] uppercase mt-2"
            style={{ color: 'rgba(255,255,255,0.06)' }}
          >
            Profile
          </motion.p>
        </div>

        {/* Floating particles */}
        {[0, 1, 2, 3, 4].map((i) => (
          <motion.div
            key={i}
            className="absolute rounded-full pointer-events-none"
            style={{
              width: 1.5 + (i % 3),
              height: 1.5 + (i % 3),
              left: `${12 + i * 18}%`,
              top: `${18 + (i * 8) % 60}%`,
              background: 'rgba(255,255,255,0.12)',
            }}
            animate={{ opacity: [0, 0.3, 0.1, 0.4, 0], y: [0, -6 - (i * 2), 4 + i, -10 - i, 0] }}
            transition={{ duration: 5 + i * 1.2, delay: i * 0.6, repeat: Infinity, ease: 'easeInOut' }}
          />
        ))}

        {/* Straight horizontal divider */}
        <div className="absolute bottom-0 left-0 right-0 pointer-events-none" style={{ height: '60px', background: '#0a0a0c' }} />
      </section>

      {/* ═══ PROFILE CARD ═══ */}
      <section className="relative pt-4" style={{ background: '#0a0a0c' }}>
        <div className="container mx-auto px-4">
          <div
            className="relative flex flex-col min-w-0 break-words w-full mb-6 rounded-lg -mt-32 shadow-lg"
            style={{ background: '#0c0c0e' }}
          >
            <div className="px-6">

              {/* ── Three-column row: Avatar | Button | Stats ── */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                className="flex flex-wrap justify-center"
              >

                {/* Avatar (center column — order 2) */}
                <div className="w-full lg:w-3/12 px-4 lg:order-2 flex justify-center">
                  <div className="relative">
                    <div className="relative group cursor-pointer inline-block" onClick={handleSelectClick}>
                      <div
                        className="rounded-full overflow-hidden absolute"
                        style={{ width: '112px', height: '112px', marginLeft: '-56px', marginTop: '-56px', left: '50%', border: '3px solid rgba(200,200,208,0.15)', boxShadow: '0 4px 16px rgba(0,0,0,0.3)' }}
                      >
                        <Avatar name={user?.name} email={user?.email} src={user?.avatar} size="xxxl" className="!w-full !h-full rounded-full" />
                        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelected} className="hidden" />
                        <div className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-200 cursor-pointer">
                          <div className="w-full h-full rounded-full bg-[rgba(0,0,0,0.55)] flex items-center justify-center">
                            {uploadingPhoto ? (
                              <svg className="animate-spin" width="22" height="22" viewBox="0 0 24 24" fill="none">
                                <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.3)" strokeWidth="3" />
                                <path d="M12 2a10 10 0 0 1 10 10" stroke="rgba(255,255,255,0.7)" strokeWidth="3" strokeLinecap="round" />
                              </svg>
                            ) : (
                              <Camera size={22} className="text-white" />
                            )}
                          </div>
                        </div>
                      </div>
                      {/* Spacer to reserve height for absolute avatar */}
                      <div style={{ height: '86px' }} />
                    </div>
                  </div>
                </div>

                {/* Sign Out button (right column — order 3) */}
                <div className="w-full lg:w-4/12 px-4 lg:order-3 lg:text-right lg:self-center">
                  <div className="py-6 px-3 mt-32 sm:mt-0">
                    <button onClick={handleSignOut}
                      className="px-4 py-2 rounded-full text-[11px] font-semibold shadow transition-all duration-150"
                      style={{ background: '#d4d4d8', color: '#18181b' }}
                      onMouseEnter={(e) => e.currentTarget.style.background = '#e4e4e7'}
                      onMouseLeave={(e) => e.currentTarget.style.background = '#d4d4d8'}
                    >
                      <span className="flex items-center gap-1.5"><LogOut size={11} /> Sign out</span>
                    </button>
                  </div>
                </div>

                {/* Stats (left column — order 1) */}
                <div className="w-full lg:w-4/12 px-4 lg:order-1">
                  <div className="flex justify-center py-4 lg:pt-4 pt-8">
                    {[
                      { value: stats.workspaces, label: 'Works' },
                      { value: stats.collaborations, label: 'Collabs' },
                      { value: stats.files, label: 'Files' },
                    ].map((stat, i) => (
                      <motion.div
                        key={stat.label}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.4, delay: 0.05 * i, ease: [0.16, 1, 0.3, 1] }}
                        className={`${i < 2 ? 'mr-4' : 'lg:mr-4'} p-3 text-center`}
                      >
                        <motion.span
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3, delay: 0.1 + 0.05 * i }}
                          className="text-xl font-bold block uppercase tracking-wide text-white"
                        >
                          {stat.value}
                        </motion.span>
                        <span className="text-sm" style={{ color: 'rgba(255,255,255,0.45)' }}>{stat.label}</span>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </motion.div>

              {/* ── Identity ── */}
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
                className="text-center mt-12"
              >
                <h3 className="text-4xl font-semibold leading-normal mb-2 text-white">{user?.name || 'User'}</h3>

                {profile?.location && (
                  <div className="text-sm leading-normal mt-0 mb-2 font-bold uppercase" style={{ color: 'rgba(255,255,255,0.4)' }}>
                    <MapPin size={14} className="inline mr-1.5" style={{ color: 'rgba(255,255,255,0.4)' }} />
                    {profile.location}
                  </div>
                )}

                <div className="mb-2 mt-10" style={{ color: 'rgba(255,255,255,0.35)' }}>
                  <Briefcase size={14} className="inline mr-1.5" style={{ color: 'rgba(255,255,255,0.35)' }} />
                  {profile?.role || 'Developer'}
                </div>

                <div className="mb-2" style={{ color: 'rgba(255,255,255,0.35)' }}>
                  <GraduationCap size={14} className="inline mr-1.5" style={{ color: 'rgba(255,255,255,0.35)' }} />
                  {profile?.education || 'AetherStudio'}
                </div>
              </motion.div>

              {/* ═══ VERTICAL SECTIONS: Bio | Settings | Preferences ═══ */}
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
                className="mt-10 py-10" style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                <div className="flex flex-col md:flex-row gap-6">

                  {/* ── Vertical Button Sidebar ── */}
                  <div className="flex md:flex-col gap-1 md:w-36 flex-shrink-0">
                    {[
                      { id: 'bio', label: 'Bio', icon: null },
                      { id: 'settings', label: 'Settings', icon: null },
                      { id: 'preferences', label: 'Preferences', icon: null },
                      { id: 'activity', label: 'Activity', icon: null },
                      { id: 'integrations', label: 'Integrations', icon: null },
                    ].map((section) => (
                      <button
                        key={section.id}
                        onClick={() => setActiveSection(section.id)}
                        className="text-left px-3.5 py-2.5 text-[12px] font-medium transition-all duration-200 rounded-[8px]"
                        style={{
                          background: activeSection === section.id ? 'rgba(255,255,255,0.04)' : 'transparent',
                          color: activeSection === section.id ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.35)',
                        }}
                        onMouseEnter={(e) => { if (activeSection !== section.id) { e.currentTarget.style.color = 'rgba(255,255,255,0.6)'; e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; }}}
                        onMouseLeave={(e) => { if (activeSection !== section.id) { e.currentTarget.style.color = 'rgba(255,255,255,0.35)'; e.currentTarget.style.background = 'transparent'; }}}
                      >
                        {section.label}
                      </button>
                    ))}
                  </div>

                  {/* ── Content Area ── */}
                  <div className="flex-1 min-w-0">

                    {activeSection === 'bio' && (
                      <div className="px-2">
                        {bioEditing ? (
                          <div className="space-y-3">
                            {(!bioDraft || bioDraft === bio) && (
                              <div className="flex flex-wrap gap-1.5 mb-2">
                                {BIO_SUGGESTIONS.map((s) => (
                                  <button
                                    key={s}
                                    onClick={() => setBioDraft(s)}
                                    className="text-[11px] leading-tight px-2.5 py-1.5 rounded-[7px] transition-all duration-200"
                                    style={{
                                      background: 'rgba(255,255,255,0.03)',
                                      border: '1px solid rgba(255,255,255,0.05)',
                                      color: 'rgba(255,255,255,0.35)',
                                    }}
                                    onMouseEnter={(e) => {
                                      e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
                                      e.currentTarget.style.color = 'rgba(255,255,255,0.55)';
                                    }}
                                    onMouseLeave={(e) => {
                                      e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
                                      e.currentTarget.style.color = 'rgba(255,255,255,0.35)';
                                    }}
                                  >
                                    {s.slice(0, 40)}...
                                  </button>
                                ))}
                              </div>
                            )}
                            <textarea
                              value={bioDraft}
                              onChange={(e) => setBioDraft(e.target.value)}
                              maxLength={500}
                              rows={3}
                              className="w-full text-[13px] leading-relaxed rounded-[10px] p-3 outline-none resize-none transition-all duration-200"
                              style={{
                                background: 'rgba(255,255,255,0.03)',
                                border: '1px solid rgba(255,255,255,0.08)',
                                color: 'rgba(255,255,255,0.7)',
                              }}
                              onFocus={(e) => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'}
                              onBlur={(e) => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'}
                              placeholder="Write something about yourself..."
                              autoFocus
                            />
                            <div className="flex items-center justify-between">
                              <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.2)' }}>{bioDraft.length}/500</span>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => { setBioEditing(false); setBioDraft(bio); }}
                                  className="px-3.5 py-1.5 rounded-[8px] text-[11px] font-medium transition-all"
                                  style={{ color: 'rgba(255,255,255,0.4)', background: 'rgba(255,255,255,0.03)' }}
                                  onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
                                  onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                                >Cancel</button>
                                <button
                                  onClick={handleSaveBio}
                                  disabled={!bioDraft.trim() || savingBio}
                                  className="px-3.5 py-1.5 rounded-[8px] text-[11px] font-semibold transition-all"
                                  style={{
                                    background: bioDraft.trim() ? '#d4d4d8' : 'rgba(255,255,255,0.06)',
                                    color: bioDraft.trim() ? '#18181b' : 'rgba(255,255,255,0.2)',
                                    cursor: bioDraft.trim() ? 'pointer' : 'not-allowed',
                                  }}
                                >{savingBio ? 'Saving...' : 'Save'}</button>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <>
                            {bio ? (
                              <>
                                <p className="mb-3 text-[14px] leading-relaxed" style={{ color: 'rgba(255,255,255,0.5)' }}>
                                  {bioExpanded || !shouldTruncate ? bio : `${bio.slice(0, 120)}...`}
                                </p>
                                <div className="flex items-center gap-3">
                                  {shouldTruncate && (
                                    <button onClick={() => setBioExpanded(!bioExpanded)}
                                      className="inline-flex items-center gap-1 text-[12px] font-medium transition-all"
                                      style={{ color: 'rgba(200,200,208,0.4)' }}
                                      onMouseEnter={(e) => e.currentTarget.style.color = 'rgba(200,200,208,0.7)'}
                                      onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(200,200,208,0.4)'}
                                    >
                                      {bioExpanded ? <>Show less <ChevronUp size={12} /></> : <>Show more <ChevronDown size={12} /></>}
                                    </button>
                                  )}
                                  <button onClick={() => { setBioDraft(bio); setBioEditing(true); }}
                                    className="inline-flex items-center gap-1 text-[12px] font-medium transition-all"
                                    style={{ color: 'rgba(200,200,208,0.3)' }}
                                    onMouseEnter={(e) => e.currentTarget.style.color = 'rgba(200,200,208,0.6)'}
                                    onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(200,200,208,0.3)'}
                                  >Edit</button>
                                </div>
                              </>
                            ) : (
                              <div className="text-center md:text-left">
                                <p className="mb-4 text-[14px]" style={{ color: 'rgba(255,255,255,0.2)' }}>No bio yet</p>
                                <button onClick={() => { setBioDraft(''); setBioEditing(true); }}
                                  className="px-3.5 py-1.5 rounded-[8px] text-[11px] font-semibold transition-all"
                                  style={{ background: '#d4d4d8', color: '#18181b' }}
                                  onMouseEnter={(e) => e.currentTarget.style.background = '#e4e4e7'}
                                  onMouseLeave={(e) => e.currentTarget.style.background = '#d4d4d8'}
                                >+ Add Bio</button>
                              </div>
                            )}
                          </>
                        )}

                      </div>
                    )}

                    {activeSection === 'settings' && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {SETTINGS_SECTIONS.find((s) => s.id === 'account')?.items.map((item) => (
                          <SettingsCard key={item.label} item={item} navigate={navigate} toast={toast} Zap={Zap} />
                        ))}
                      </div>
                    )}

                    {activeSection === 'preferences' && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {SETTINGS_SECTIONS.find((s) => s.id === 'preferences')?.items.map((item) => (
                          <SettingsCard key={item.label} item={item} navigate={navigate} toast={toast} Zap={Zap} />
                        ))}
                      </div>
                    )}

                    {activeSection === 'activity' && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {SETTINGS_SECTIONS.find((s) => s.id === 'activity')?.items.map((item) => (
                          <SettingsCard key={item.label} item={item} navigate={navigate} toast={toast} Zap={Zap} />
                        ))}
                      </div>
                    )}

                    {activeSection === 'integrations' && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {SETTINGS_SECTIONS.find((s) => s.id === 'integrations')?.items.map((item) => (
                          <SettingsCard key={item.label} item={item} navigate={navigate} toast={toast} Zap={Zap} />
                        ))}
                      </div>
                    )}

                  </div>
                </div>
              </motion.div>

            </div>
          </div>
        </div>
      </section>

      <div className="h-40" />
      <LandingFooter />
    </div>
  );
}
