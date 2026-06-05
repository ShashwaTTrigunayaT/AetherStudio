import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Zap, Globe, Cpu, Users, Shield, GitBranch } from 'lucide-react';
import { useAuth } from '../stores/useAuth';
import LandingNav from '../components/Common/LandingNav';
import LandingFooter from '../components/Landing/LandingFooter';

const ROADMAP_ITEMS = [
  { quarter: 'Q2 2025', title: 'AI Code Completions', desc: 'Context-aware inline completions powered by Gemini Pro.', icon: Zap, status: 'In Progress', color: '#30d158' },
  { quarter: 'Q3 2025', title: 'Mobile Companion App', desc: 'Browse code, review PRs, and chat from your phone.', icon: Globe, status: 'Planned', color: '#c8c8d0' },
  { quarter: 'Q4 2025', title: 'Self-Hosted Deployment', desc: 'Deploy AetherStudio on your own infrastructure.', icon: Cpu, status: 'Planned', color: '#b0b0bc' },
  { quarter: 'Q1 2026', title: 'Team Analytics Dashboard', desc: 'Insights into team productivity and collaboration patterns.', icon: Users, status: 'Research', color: '#ff9f0a' },
  { quarter: 'Q2 2026', title: 'Enterprise SSO & RBAC', desc: 'SAML/OIDC SSO with granular role-based access control.', icon: Shield, status: 'Research', color: '#ff453a' },
  { quarter: 'Q3 2026', title: 'VS Code Extension', desc: 'Connect local VS Code to AetherStudio workspaces.', icon: GitBranch, status: 'Research', color: '#dedee4' },
];

export default function RoadmapPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    document.body.style.overflow = 'auto';
    return () => { document.body.style.overflow = 'hidden'; };
  }, []);

  const handleGetStarted = () => user ? navigate('/dashboard') : navigate('/register');

  return (
    <div className="min-h-screen bg-[#000000] overflow-x-hidden">
      <LandingNav onGetStarted={handleGetStarted} user={user} onLogout={logout} />
      <section className="relative pt-32 pb-20">
        <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse 60% 50% at 50% 0%, rgba(176,176,188,0.06) 0%, transparent 60%)' }} />
        <div className="relative max-w-4xl mx-auto px-6 text-center">
          <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.7 }}
            className="text-[40px] md:text-[56px] font-bold text-[#f5f5f7] tracking-tight"
          >Product <span className="bg-clip-text text-transparent" style={{ backgroundImage: 'linear-gradient(135deg, #b0b0bc, #c0c0cc)' }}>Roadmap</span></motion.h1>
          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.5 }}
            className="text-[15px] mt-5 max-w-xl mx-auto leading-relaxed" style={{ color: 'rgba(255,255,255,0.35)' }}
          >Here&apos;s what we&apos;re building next. Our roadmap is public and driven by community feedback.</motion.p>
        </div>
      </section>
      <section className="relative pb-24">
        <div className="max-w-4xl mx-auto px-6">
          <div className="space-y-4">
            {ROADMAP_ITEMS.map((item, i) => (
              <motion.div key={item.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                transition={{ delay: i * 0.06 }}
                className="group relative p-5 rounded-[14px] border transition-all duration-300 flex items-start gap-4"
                style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.05)' }}
              >
                <div className="w-10 h-10 rounded-[10px] flex items-center justify-center flex-shrink-0" style={{ background: `${item.color}12` }}>
                  <item.icon size={18} style={{ color: item.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <span className="text-[10px] font-semibold uppercase tracking-[1px]" style={{ color: 'rgba(255,255,255,0.2)' }}>{item.quarter}</span>
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-full" style={{ background: `${item.color}15`, color: item.color }}>{item.status}</span>
                  </div>
                  <h3 className="text-[15px] font-bold text-[#f5f5f7]">{item.title}</h3>
                  <p className="text-[12px] mt-1 leading-relaxed" style={{ color: 'rgba(255,255,255,0.4)' }}>{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
      <LandingFooter />
    </div>
  );
}
