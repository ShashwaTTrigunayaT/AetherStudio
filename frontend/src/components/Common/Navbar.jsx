import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronDown, ExternalLink, BookOpen, FileText,
  HelpCircle, BookMarked, Shield, Mail, Menu, X, ArrowRight, Layout, Folder, Home,
} from 'lucide-react';
import { useAuth } from '../../stores/useAuth';
import AetherStudioLogo from './AetherStudioLogo';
import Avatar from './Avatar';

const RESOURCES_SUBLINKS = [
  { label: 'Documentation', href: '/docs', icon: BookOpen, desc: 'Guides & API reference' },
  { label: 'Blog', href: '/blog', icon: FileText, desc: 'News & updates' },
];

const COMPANY_SUBLINKS = [
  { label: 'About', href: '/about', icon: HelpCircle, desc: 'Our story & team' },
  { label: 'Roadmap', href: '/roadmap', icon: BookMarked, desc: "What's coming next" },
  { label: 'Status', href: '/status', icon: Shield, desc: 'System health' },
  { label: 'Contact', href: '/contact', icon: Mail, desc: 'Get in touch' },
];

function DropdownMenu({ label, items, isOpen, onToggle, onClose }) {
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) onClose();
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  const handleItemClick = (href) => {
    onClose();
    navigate(href);
  };

  return (
    <div ref={dropdownRef} className="relative">
      <button
        onClick={onToggle}
        className="flex items-center gap-1 px-4 py-2 text-[13px] font-medium rounded-lg transition-all"
        style={{ color: isOpen ? '#f5f5f7' : 'rgba(255,255,255,0.45)', background: isOpen ? 'rgba(255,255,255,0.04)' : 'transparent' }}
        onMouseEnter={(e) => { if (!isOpen) { e.currentTarget.style.color = '#f5f5f7'; e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; } }}
        onMouseLeave={(e) => { if (!isOpen) { e.currentTarget.style.color = 'rgba(255,255,255,0.45)'; e.currentTarget.style.background = 'transparent'; } }}
      >
        {label}
        <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown size={12} />
        </motion.div>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.96 }}
            transition={{ duration: 0.15, ease: [0.25, 0.1, 0.25, 1] }}
            className="absolute top-full left-0 mt-1.5 w-[260px] rounded-[12px] overflow-hidden border"
            style={{
              background: 'rgba(18,18,22,0.98)',
              borderColor: 'rgba(255,255,255,0.06)',
              backdropFilter: 'blur(40px) saturate(1.8)',
              boxShadow: '0 16px 48px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.04)',
            }}
          >
            <div className="p-2">
              {items.map((item, i) => (
                <button key={i} onClick={() => handleItemClick(item.href)}
                  className="w-full flex items-start gap-3 px-3 py-2.5 rounded-[8px] transition-all text-left group/dropdown"
                  style={{ color: 'rgba(255,255,255,0.5)', background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 'inherit' }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = '#f5f5f7'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.5)'; }}
                >
                  <div className="w-8 h-8 rounded-[8px] flex items-center justify-center flex-shrink-0 mt-0.5"
                    style={{ background: 'rgba(255,255,255,0.04)' }}
                  ><item.icon size={14} style={{ color: 'rgba(255,255,255,0.3)' }} /></div>
                  <div className="min-w-0 flex-1">
                    <div className="text-[12px] font-medium text-left">{item.label}</div>
                    <div className="text-[10px] mt-0.5 text-left" style={{ color: 'rgba(255,255,255,0.2)' }}>{item.desc}</div>
                  </div>
                  <ExternalLink size={10} className="mt-1 opacity-0 group-hover/dropdown:opacity-100 transition-opacity flex-shrink-0" style={{ color: 'rgba(255,255,255,0.2)' }} />
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function Navbar({ rightContent, onGetStarted, transparent = false, hideNavLinks = false, tabs, activeTab, onTabChange, user: propUser, onProfileClick }) {
  const { user: authUser } = useAuth();
  const user = propUser ?? authUser;
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState(null);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const closeDropdown = useCallback(() => setOpenDropdown(null), []);

  const scrollToSection = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    setMobileMenuOpen(false);
  };

  const navLinks = [
    { label: 'Features', href: '#features', type: 'scroll' },
    { label: 'Stats', href: '#stats', type: 'scroll' },
  ];

  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled || !transparent
          ? 'bg-[rgba(0,0,0,0.8)] backdrop-blur-xl border-b border-[rgba(200,200,208,0.12)]'
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center justify-between h-[64px] md:h-[72px]">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group/logo">
            <motion.div whileHover={{ scale: 1.05 }} transition={{ type: 'spring', stiffness: 400 }}>
              <AetherStudioLogo size={32} animated glow />
            </motion.div>
            <span className="text-[16px] font-bold text-[#f5f5f7] tracking-tight hidden sm:inline group-hover/logo:opacity-80 transition-opacity">
              AetherStudio
            </span>
          </Link>

          {/* Desktop nav - center */}
          {!tabs && (
            <div className="hidden md:flex items-center gap-1">
              {!hideNavLinks && navLinks.map((link) => (
                <button key={link.href} onClick={() => scrollToSection(link.href.replace('#', ''))}
                  className="px-4 py-2 text-[13px] font-medium rounded-lg transition-all"
                  style={{ color: 'rgba(255,255,255,0.45)' }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = '#f5f5f7'; e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.45)'; e.currentTarget.style.background = 'transparent'; }}
                >{link.label}</button>
              ))}

              {!hideNavLinks && <div className="w-px h-5 mx-1" style={{ background: 'rgba(255,255,255,0.06)' }} />}

              <DropdownMenu label="Resources" items={RESOURCES_SUBLINKS}
                isOpen={openDropdown === 'resources'} onToggle={() => setOpenDropdown(openDropdown === 'resources' ? null : 'resources')}
                onClose={() => setOpenDropdown(null)}
              />
              <DropdownMenu label="Company" items={COMPANY_SUBLINKS}
                isOpen={openDropdown === 'company'} onToggle={() => setOpenDropdown(openDropdown === 'company' ? null : 'company')}
                onClose={() => setOpenDropdown(null)}
              />
            </div>
          )}

          {/* Dashboard tabs + nav links */}
          {hideNavLinks && tabs && (
            <div className="hidden md:flex items-center gap-1">
              {tabs.map((tab) => {
                const isActive = activeTab === tab.value;
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.value}
                    onClick={() => onTabChange?.(tab.value)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-medium rounded-[7px] transition-all duration-200 ${
                      isActive
                        ? 'text-[#f5f5f7]'
                        : 'text-[rgba(255,255,255,0.3)] hover:text-[rgba(255,255,255,0.55)]'
                    }`}
                    style={{
                      background: isActive ? 'rgba(255,255,255,0.06)' : 'transparent',
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.background = 'transparent';
                      }
                    }}
                  >
                    {Icon && <Icon size={13} />}
                    {tab.label}
                  </button>
                );
              })}

              <div className="w-px h-5 mx-1" style={{ background: 'rgba(255,255,255,0.06)' }} />

              <DropdownMenu label="Resources" items={RESOURCES_SUBLINKS}
                isOpen={openDropdown === 'resources'} onToggle={() => setOpenDropdown(openDropdown === 'resources' ? null : 'resources')}
                onClose={() => setOpenDropdown(null)}
              />
              <DropdownMenu label="Company" items={COMPANY_SUBLINKS}
                isOpen={openDropdown === 'company'} onToggle={() => setOpenDropdown(openDropdown === 'company' ? null : 'company')}
                onClose={() => setOpenDropdown(null)}
              />
            </div>
          )}

          {/* Actions - right */}
          <div className="flex items-center gap-2">
            {rightContent || (user ? (
              <>
                <motion.button onClick={() => navigate('/')} whileHover={{ scale: 1.05, background: 'rgba(255,255,255,0.07)' }} whileTap={{ scale: 0.95 }}
                  className="w-8 h-8 rounded-[9px] flex items-center justify-center transition-all duration-200"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.25)' }}
                  title="Home"
                ><Home size={13} /></motion.button>
                <motion.button onClick={() => navigate('/dashboard')} whileHover={{ scale: 1.03, y: -1 }} whileTap={{ scale: 0.97 }}
                  className="relative inline-flex items-center gap-2 px-4 py-2 rounded-[10px] text-[12px] font-semibold text-white overflow-hidden"
                  style={{ background: 'linear-gradient(135deg, #c8c8d0, #dedee4)', boxShadow: '0 4px 16px rgba(200,200,208,0.25)' }}
                >
                  <motion.div className="absolute inset-0 pointer-events-none"
                    style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent)', transform: 'translateX(-100%)' }}
                    animate={{ transform: ['translateX(-100%)', 'translateX(100%)'] }} transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                  />
                  Dashboard <ArrowRight size={13} />
                </motion.button>
                <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                  onClick={() => navigate('/profile')}
                >
                  <Avatar
                    name={user?.name}
                    email={user?.email}
                    src={user?.avatar}
                    size="sm"
                    className="cursor-pointer ring-2 ring-transparent hover:ring-[rgba(255,255,255,0.08)] transition-all duration-300"
                  />
                </motion.button>
              </>
            ) : (
              <>
                <Link to="/login"
                  className="hidden sm:inline-flex text-[13px] font-medium px-4 py-2 rounded-lg transition-all"
                  style={{ color: 'rgba(255,255,255,0.5)' }}
                  onMouseEnter={(e) => e.currentTarget.style.color = '#f5f5f7'}
                  onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(255,255,255,0.5)'}
                >Sign In</Link>

                <motion.button onClick={onGetStarted} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                  className="relative inline-flex items-center gap-2 px-4 py-2 rounded-[10px] text-[12px] font-semibold text-white overflow-hidden"
                  style={{ background: 'linear-gradient(135deg, #c8c8d0, #dedee4)', boxShadow: '0 4px 16px rgba(200,200,208,0.25)' }}
                >
                  <motion.div className="absolute inset-0 pointer-events-none"
                    style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent)', transform: 'translateX(-100%)' }}
                    animate={{ transform: ['translateX(-100%)', 'translateX(100%)'] }} transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                  />
                  Get Started <ArrowRight size={13} />
                </motion.button>
              </>
            ))}

            {/* Mobile menu toggle */}
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg" style={{ color: 'rgba(255,255,255,0.5)' }}
            >
              {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden overflow-hidden border-t border-[rgba(255,255,255,0.04)]"
            style={{ background: 'rgba(0,0,0,0.95)', backdropFilter: 'blur(20px)' }}
          >
            <div className="px-6 py-4 space-y-1">
              {/* Scroll links — landing page only */}
              {!hideNavLinks && (
                <>
                  <p className="text-[9px] font-semibold uppercase tracking-[2px] px-3 py-2" style={{ color: 'rgba(255,255,255,0.15)' }}>On this page</p>
                  {navLinks.map((link) => (
                    <button key={link.href} onClick={() => scrollToSection(link.href.replace('#', ''))}
                      className="block w-full text-left px-3 py-2.5 rounded-lg text-[14px] font-medium transition-all"
                      style={{ color: 'rgba(255,255,255,0.5)' }}
                      onMouseEnter={(e) => { e.currentTarget.style.color = '#f5f5f7'; e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.5)'; e.currentTarget.style.background = 'transparent'; }}
                    >{link.label}</button>
                  ))}
                  <div className="h-px my-3" style={{ background: 'rgba(255,255,255,0.04)' }} />
                </>
              )}

              {/* Resources — always shown */}
              {!tabs && (
                <>
                  <p className="text-[9px] font-semibold uppercase tracking-[2px] px-3 py-2" style={{ color: 'rgba(255,255,255,0.15)' }}>Resources</p>
                  {RESOURCES_SUBLINKS.map((item, i) => (
                    <Link key={i} to={item.href} onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-[14px] font-medium transition-all"
                      style={{ color: 'rgba(255,255,255,0.5)' }}
                      onMouseEnter={(e) => { e.currentTarget.style.color = '#f5f5f7'; e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.5)'; e.currentTarget.style.background = 'transparent'; }}
                    ><item.icon size={14} /><span>{item.label}</span></Link>
                  ))}

                  <div className="h-px my-3" style={{ background: 'rgba(255,255,255,0.04)' }} />

                  <p className="text-[9px] font-semibold uppercase tracking-[2px] px-3 py-2" style={{ color: 'rgba(255,255,255,0.15)' }}>Company</p>
                  {COMPANY_SUBLINKS.map((item, i) => (
                    <Link key={i} to={item.href} onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-[14px] font-medium transition-all"
                      style={{ color: 'rgba(255,255,255,0.5)' }}
                      onMouseEnter={(e) => { e.currentTarget.style.color = '#f5f5f7'; e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.5)'; e.currentTarget.style.background = 'transparent'; }}
                    ><item.icon size={14} /><span>{item.label}</span></Link>
                  ))}

                  <div className="h-px my-3" style={{ background: 'rgba(255,255,255,0.04)' }} />
                  <Link to="/login" onClick={() => setMobileMenuOpen(false)}
                    className="block px-3 py-2.5 rounded-lg text-[14px] font-medium" style={{ color: 'rgba(255,255,255,0.5)' }}
                  >Sign In</Link>
                </>
              )}
              {hideNavLinks && tabs && rightContent && (
                <div className="px-3 py-2">
                  <p className="text-[9px] font-semibold uppercase tracking-[2px] mb-2" style={{ color: 'rgba(255,255,255,0.15)' }}>Menu</p>
                  {rightContent}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}
