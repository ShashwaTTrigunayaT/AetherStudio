import { Link } from 'react-router-dom';
import AetherStudioLogo from '../Common/AetherStudioLogo';
import { Github, Twitter, Mail } from 'lucide-react';

const FOOTER_LINKS = {
  Product: [
    { label: 'Features', href: '/' },
    { label: 'Roadmap', href: '/roadmap' },
  ],
  Resources: [
    { label: 'Documentation', href: '/docs' },
    { label: 'Status', href: '/status' },
  ],
  Company: [
    { label: 'About', href: '/about' },
    { label: 'Blog', href: '#' },
    { label: 'Careers', href: '#' },
    { label: 'Contact', href: '/contact' },
  ],
};

export default function LandingFooter() {
  return (
    <footer className="relative border-t py-12 overflow-hidden" style={{ borderColor: 'rgba(255,255,255,0.04)', background: 'rgba(0,0,0,0.6)' }}>
      {/* Gold accent glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[400px] h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(184,148,80,0.3), rgba(212,188,128,0.5), rgba(184,148,80,0.3), transparent)' }} />
      <div className="absolute top-[-40px] left-1/2 -translate-x-1/2 w-[300px] h-[80px]" style={{ background: 'radial-gradient(ellipse, rgba(184,148,80,0.04), transparent)', filter: 'blur(20px)' }} />
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
          <div className="col-span-2 md:col-span-1">
            <Link to="/" className="flex items-center gap-2.5 mb-4">
              <AetherStudioLogo size={28} animated={false} />
              <span className="text-[15px] font-bold text-[#f5f5f7]">AetherStudio</span>
            </Link>
            <p className="text-[11px] leading-relaxed max-w-[200px]" style={{ color: 'rgba(255,255,255,0.3)' }}>
              The collaborative IDE platform for modern development teams.
            </p>
          </div>
          {Object.entries(FOOTER_LINKS).map(([title, links]) => (
            <div key={title}>
              <h4 className="text-[10px] font-semibold uppercase tracking-[1.5px] mb-4 flex items-center gap-2" style={{ color: 'rgba(255,255,255,0.2)' }}>
                <span className="w-[2px] h-3 rounded-full" style={{ background: 'linear-gradient(to bottom, #b89450, #d4bc80)' }} />
                {title}
              </h4>
              <ul className="space-y-2.5">
                {links.map((link) => (
                  <li key={link.label}>
                    {link.href.startsWith('/') ? (
                      <Link to={link.href} className="text-[12px] transition-all inline-block" style={{ color: 'rgba(255,255,255,0.35)' }}
                        onMouseEnter={(e) => { e.currentTarget.style.color = '#f5f5f7'; e.currentTarget.style.transform = 'translateX(4px)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.35)'; e.currentTarget.style.transform = 'translateX(0)'; }}
                      >{link.label}</Link>
                    ) : (
                      <a href={link.href} className="text-[12px] transition-all inline-block" style={{ color: 'rgba(255,255,255,0.35)' }}
                        onMouseEnter={(e) => { e.currentTarget.style.color = '#f5f5f7'; e.currentTarget.style.transform = 'translateX(4px)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.35)'; e.currentTarget.style.transform = 'translateX(0)'; }}
                      >{link.label}</a>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="pt-8 border-t flex flex-col md:flex-row items-center justify-between gap-4" style={{ borderColor: 'rgba(255,255,255,0.04)', boxShadow: '0 -1px 0 rgba(184,148,80,0.06)' }}>
          <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.15)' }}>&copy; {new Date().getFullYear()} AetherStudio. All rights reserved.</p>
          <div className="flex items-center gap-3">
            {[{ icon: Github, href: '#' }, { icon: Twitter, href: '#' }, { icon: Mail, href: '#' }].map((social, i) => (
              <a key={i} href={social.href}
                className="w-7 h-7 rounded-lg flex items-center justify-center transition-all"
                style={{ background: 'rgba(255,255,255,0.03)', color: 'rgba(255,255,255,0.2)' }}
              ><social.icon size={12} /></a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
