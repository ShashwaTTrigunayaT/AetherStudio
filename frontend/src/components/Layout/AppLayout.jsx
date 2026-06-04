import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../stores/useAuth';
import Badge from '../Common/Badge';
import Avatar from '../Common/Avatar';
import {
  LayoutDashboard, User, Settings, LogOut, ChevronLeft, ChevronRight,
  Terminal, Users, Bell, Search, Plus, Github, HelpCircle,
} from 'lucide-react';
import AetherStudioLogo from '../Common/AetherStudioLogo';
import { motion, AnimatePresence } from 'framer-motion';
import Footer from '../Common/Footer';

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/profile', label: 'Profile', icon: User },
];

export default function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarExpanded, setSidebarExpanded] = useState(true);

  return (
    <div className="h-screen flex bg-[#f8fafc] overflow-hidden">
      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{ width: sidebarExpanded ? 220 : 60 }}
        transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
        className="flex-shrink-0 flex flex-col overflow-hidden relative bg-white/60 backdrop-blur-3xl border border-white/80 shadow-[0_8px_30px_rgba(0,0,0,0.04)]"
      >
        {/* Logo */}
        <Link
          to="/dashboard"
          className={`flex items-center gap-3 px-4 ${sidebarExpanded ? 'py-4' : 'py-4 justify-center'}`}
          style={{ borderBottom: '1px solid rgba(0,0,0,0.04)' }}
        >
          <div className="flex-shrink-0">
            <AetherStudioLogo size={32} animated={false} />
          </div>
          <AnimatePresence>
            {sidebarExpanded && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-[15px] font-bold whitespace-nowrap text-[#1e293b]"
              >
                AetherStudio
              </motion.span>
            )}
          </AnimatePresence>
        </Link>

        {/* Navigation */}
        <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <motion.div
                key={item.path}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: navItems.indexOf(item) * 0.03 }}
              >
                <Link
                  to={item.path}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
                    isActive ? '' : ''
                  } ${sidebarExpanded ? '' : 'justify-center'}`}
                  style={{
                    background: isActive
                      ? 'rgba(184,148,80,0.06)'
                      : 'transparent',
                    color: isActive ? '#b89450' : 'rgba(100,110,130,0.5)',
                  }}
                  onMouseEnter={e => {
                    if (!isActive) {
                      e.currentTarget.style.background = 'rgba(0,0,0,0.02)';
                      e.currentTarget.style.color = 'rgba(60,70,90,0.7)';
                    }
                  }}
                  onMouseLeave={e => {
                    if (!isActive) {
                      e.currentTarget.style.background = 'transparent';
                      e.currentTarget.style.color = 'rgba(100,110,130,0.5)';
                    }
                  }}
                >
                  <item.icon size={18} className="flex-shrink-0" />
                  <AnimatePresence>
                    {sidebarExpanded && (
                      <motion.span
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="text-[13px] font-medium whitespace-nowrap"
                      >
                        {item.label}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </Link>
              </motion.div>
            );
          })}
        </nav>

        {/* User section */}
        <div className="p-2" style={{ borderTop: '1px solid rgba(0,0,0,0.04)' }}>
          <Link
            to="/profile"
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${sidebarExpanded ? '' : 'justify-center'}`}
            style={{ color: 'rgba(100,110,130,0.5)' }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'rgba(0,0,0,0.02)';
              e.currentTarget.style.color = 'rgba(60,70,90,0.7)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = 'rgba(100,110,130,0.5)';
            }}
          >
            <Avatar
              name={user?.name}
              email={user?.email}
              size="sm"
              status="online"
            />
            <AnimatePresence>
              {sidebarExpanded && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex-1 min-w-0"
                >
                  <p className="text-[12px] font-semibold truncate text-[#1e293b]">
                    {user?.name || 'User'}
                  </p>
                  <p className="text-[10px] truncate text-[rgba(100,110,130,0.4)]">
                    {user?.email}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </Link>

          {/* Toggle sidebar */}
          <button
            onClick={() => setSidebarExpanded(!sidebarExpanded)}
            className="w-full flex items-center justify-center py-2 mt-1 rounded-lg transition-all"
            style={{ color: 'rgba(100,110,130,0.25)' }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'rgba(0,0,0,0.02)';
              e.currentTarget.style.color = 'rgba(60,70,90,0.4)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = 'rgba(100,110,130,0.25)';
            }}
          >
            {sidebarExpanded ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
          </button>
        </div>
      </motion.aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        {/* Top bar */}
        <motion.header
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="h-[52px] flex-shrink-0 flex items-center justify-between px-4 relative"
          style={{
            background: 'rgba(255,255,255,0.75)',
            borderBottom: '1px solid rgba(0,0,0,0.04)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
          }}
        >
          <div className="flex items-center gap-3">
            <Link to="/dashboard" style={{ color: 'rgba(100,110,130,0.4)' }}>
              <LayoutDashboard size={16} />
            </Link>
          </div>
          <div className="flex items-center gap-1">
            <motion.button
              whileHover={{ scale: 1.05, backgroundColor: 'rgba(184,148,80,0.06)' }}
              whileTap={{ scale: 0.95 }}
              className="p-1.5 rounded-lg transition-all"
              style={{ color: 'rgba(100,110,130,0.4)' }}
            >
              <Bell size={15} />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05, backgroundColor: 'rgba(184,148,80,0.06)' }}
              whileTap={{ scale: 0.95 }}
              className="p-1.5 rounded-lg transition-all"
              style={{ color: 'rgba(100,110,130,0.4)' }}
            >
              <HelpCircle size={15} />
            </motion.button>
            <motion.button
              onClick={() => { logout(); navigate('/login'); }}
              whileHover={{ scale: 1.05, backgroundColor: 'rgba(255,45,149,0.06)' }}
              whileTap={{ scale: 0.95 }}
              className="p-1.5 rounded-lg transition-all"
              style={{ color: 'rgba(255,45,149,0.35)' }}
            >
              <LogOut size={15} />
            </motion.button>
          </div>
        </motion.header>

        {/* Page content */}
        <div className="flex-1 overflow-y-auto">
          <Outlet />
        </div>

        {/* Footer */}
        <Footer minimal />
      </div>
    </div>
  );
}
