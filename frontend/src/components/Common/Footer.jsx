import React from 'react';
import { motion } from 'framer-motion';
import { Github, Twitter, Mail, Heart, ExternalLink } from 'lucide-react';
import AetherStudioLogo from './AetherStudioLogo';
import { Link } from 'react-router-dom';

export default function Footer({ minimal = false, className = '' }) {
  const currentYear = new Date().getFullYear();

  if (minimal) {
    return (
      <motion.footer
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.4 }}
        className={`flex items-center justify-center py-4 px-6 text-center ${className}`}
      >
        <motion.p
          className="text-[11px] text-[rgba(255,255,255,0.2)] flex items-center gap-1"
          whileHover={{ color: 'rgba(255,255,255,0.4)' }}
        >
          Built with{' '}
          <motion.span
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 3 }}
          >
            <Heart size={10} className="text-[#ff453a]" />
          </motion.span>{' '}
          by AetherStudio · {currentYear}
        </motion.p>
      </motion.footer>
    );
  }

  return (
    <motion.footer
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
      className="relative border-t border-[rgba(255,255,255,0.06)] bg-[rgba(22,22,24,0.4)] backdrop-blur-xl overflow-hidden"
    >
      {/* Gold accent glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(184,148,80,0.25), rgba(212,188,128,0.4), rgba(184,148,80,0.25), transparent)' }} />
      <div className="absolute top-[-60px] left-1/2 -translate-x-1/2 w-[400px] h-[100px]" style={{ background: 'radial-gradient(ellipse, rgba(184,148,80,0.03), transparent)', filter: 'blur(30px)' }} />
      <div className="max-w-7xl mx-auto px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1, duration: 0.4 }}
            className="md:col-span-1"
          >
            <Link to="/dashboard" className="flex items-center gap-2.5 mb-4">
              <motion.div
                whileHover={{ rotate: 10, scale: 1.05 }}
                transition={{ type: 'spring', stiffness: 300 }}
              >
                <AetherStudioLogo size={36} animated={false} />
              </motion.div>
              <span className="text-[15px] font-bold text-[#f5f5f7]">AetherStudio</span>
            </Link>
            <p className="text-[12px] text-[rgba(255,255,255,0.35)] leading-relaxed max-w-[220px]">
              Collaborative IDE platform for modern development teams. Code together in real-time.
            </p>
            <div className="flex items-center gap-2 mt-4">
              {[
                { icon: Github, label: 'GitHub' },
                { icon: Twitter, label: 'Twitter' },
                { icon: Mail, label: 'Email' },
              ].map((social, i) => (
                <motion.a
                  key={social.label}
                  href="#"
                  whileHover={{ y: -2, backgroundColor: 'rgba(255,255,255,0.12)' }}
                  whileTap={{ scale: 0.9 }}
                  className="w-8 h-8 rounded-lg bg-[rgba(255,255,255,0.04)] flex items-center justify-center"
                  title={social.label}
                >
                  <social.icon size={14} className="text-[rgba(255,255,255,0.4)]" />
                </motion.a>
              ))}
            </div>
          </motion.div>

          {/* Product */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.4 }}
          >
            <h4 className="text-[11px] font-semibold text-[rgba(255,255,255,0.3)] uppercase tracking-wider mb-4 flex items-center gap-2">
              <span className="w-[2px] h-3 rounded-full" style={{ background: 'linear-gradient(to bottom, #b89450, #d4bc80)' }} />
              Product
            </h4>
            <ul className="space-y-2.5">
              {[
                { label: 'Features', href: '/' },
                { label: 'Documentation', href: '/docs' },
                { label: 'Roadmap', href: '/roadmap' },
              ].map((item, i) => (
                <motion.li
                  key={item.label}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.25 + i * 0.03, duration: 0.3 }}
                >
                  {item.href.startsWith('/') ? (
                    <motion.span whileHover={{ x: 3 }}>
                      <Link to={item.href} className="text-[13px] text-[rgba(255,255,255,0.45)] transition-colors inline-block"
                        onMouseEnter={(e) => e.currentTarget.style.color = '#f5f5f7'}
                        onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(255,255,255,0.45)'}
                      >{item.label}</Link>
                    </motion.span>
                  ) : (
                    <motion.a href={item.href} whileHover={{ x: 3, color: '#f5f5f7' }}
                      className="text-[13px] text-[rgba(255,255,255,0.45)] transition-colors inline-block"
                    >{item.label}</motion.a>
                  )}
                </motion.li>
              ))}
            </ul>
          </motion.div>

          {/* Resources */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25, duration: 0.4 }}
          >
            <h4 className="text-[11px] font-semibold text-[rgba(255,255,255,0.3)] uppercase tracking-wider mb-4 flex items-center gap-2">
              <span className="w-[2px] h-3 rounded-full" style={{ background: 'linear-gradient(to bottom, #d4bc80, #b89450)' }} />
              Resources
            </h4>
            <ul className="space-y-2.5">
              {[
                { label: 'Documentation', href: '/docs' },
                { label: 'Status', href: '/status' },
                { label: 'Contact', href: '/contact' },
              ].map((item, i) => (
                <motion.li
                  key={item.label}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + i * 0.03, duration: 0.3 }}
                >
                  <motion.span whileHover={{ x: 3 }}>
                    <Link to={item.href} className="text-[13px] text-[rgba(255,255,255,0.45)] transition-colors inline-block"
                      onMouseEnter={(e) => e.currentTarget.style.color = '#f5f5f7'}
                      onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(255,255,255,0.45)'}
                    >{item.label}</Link>
                  </motion.span>
                </motion.li>
              ))}
            </ul>
          </motion.div>

          {/* Company */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.4 }}
          >
            <h4 className="text-[11px] font-semibold text-[rgba(255,255,255,0.3)] uppercase tracking-wider mb-4 flex items-center gap-2">
              <span className="w-[2px] h-3 rounded-full" style={{ background: 'linear-gradient(to bottom, #b89450, #a07840)' }} />
              Company
            </h4>
            <ul className="space-y-2.5">
              {[
                { label: 'About', href: '/about' },
                { label: 'Contact', href: '/contact' },
              ].map((item, i) => (
                <motion.li
                  key={item.label}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.35 + i * 0.03, duration: 0.3 }}
                >
                  <motion.span whileHover={{ x: 3 }}>
                    <Link to={item.href} className="text-[13px] text-[rgba(255,255,255,0.45)] transition-colors inline-block"
                      onMouseEnter={(e) => e.currentTarget.style.color = '#f5f5f7'}
                      onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(255,255,255,0.45)'}
                    >{item.label}</Link>
                  </motion.span>
                </motion.li>
              ))}
            </ul>
          </motion.div>
        </div>

        {/* Bottom bar */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.4 }}
          className="mt-10 pt-6 border-t border-[rgba(255,255,255,0.04)] flex flex-col md:flex-row items-center justify-between gap-4"
        >
          <p className="text-[11px] text-[rgba(255,255,255,0.2)]">
            © {currentYear} AetherStudio. All rights reserved.
          </p>
          <p className="text-[11px] text-[rgba(255,255,255,0.2)] flex items-center gap-1">
            Built with{' '}
            <motion.span
              animate={{ scale: [1, 1.3, 1] }}
              transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 4 }}
            >
              <Heart size={10} className="text-[#ff453a]" />
            </motion.span>{' '}
            by the AetherStudio Team
          </p>
        </motion.div>
      </div>
    </motion.footer>
  );
}
