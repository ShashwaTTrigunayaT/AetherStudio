import { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Terminal, Code2, Users, Shield,
  GitBranch, Server, Globe, Zap, ArrowRight,
  ExternalLink, Search,
} from 'lucide-react';
import { useAuth } from '../stores/useAuth';
import LandingNav from '../components/Common/LandingNav';
import LandingFooter from '../components/Landing/LandingFooter';

const DOC_CATEGORIES = [
  {
    title: 'Getting Started',
    desc: 'Set up your first workspace and start collaborating in minutes.',
    icon: Terminal,
    color: '#c8c8d0',
    links: [
      { label: 'Quick Start Guide', href: '#' },
      { label: 'Creating a Workspace', href: '#' },
      { label: 'Inviting Collaborators', href: '#' },
      { label: 'Interface Overview', href: '#' },
    ],
  },
  {
    title: 'Real-Time Collaboration',
    desc: 'Learn how to code together with real-time sync and communication.',
    icon: Users,
    color: '#b0b0bc',
    links: [
      { label: 'Collaborative Editing', href: '#' },
      { label: 'Cursor & Presence', href: '#' },
      { label: 'WebRTC Video Calls', href: '#' },
      { label: 'Conflict Resolution', href: '#' },
    ],
  },
  {
    title: 'Code Execution',
    desc: 'Run code in sandboxed environments across multiple languages.',
    icon: Server,
    color: '#30d158',
    links: [
      { label: 'Supported Languages', href: '#' },
      { label: 'Running Code', href: '#' },
      { label: 'Environment Config', href: '#' },
      { label: 'Resource Limits', href: '#' },
    ],
  },
  {
    title: 'AI Assistance',
    desc: 'Supercharge your workflow with AI-powered code features.',
    icon: Zap,
    color: '#ff9f0a',
    links: [
      { label: 'AI Completions', href: '#' },
      { label: 'Smart Debugging', href: '#' },
      { label: 'Code Review Agent', href: '#' },
      { label: 'Prompt Library', href: '#' },
    ],
  },
  {
    title: 'Version Control',
    desc: 'Manage your code with built-in Git integration.',
    icon: GitBranch,
    color: '#ff453a',
    links: [
      { label: 'Git Integration', href: '#' },
      { label: 'Branch Management', href: '#' },
      { label: 'Visual Diff', href: '#' },
      { label: 'Merge Conflicts', href: '#' },
    ],
  },
  {
    title: 'API Reference',
    desc: 'Integrate AetherStudio into your own tools and workflows.',
    icon: Code2,
    color: '#dedee4',
    links: [
      { label: 'REST API Overview', href: '#' },
      { label: 'WebSocket Events', href: '#' },
      { label: 'Authentication', href: '#' },
      { label: 'Rate Limits', href: '#' },
    ],
  },
  {
    title: 'Security & Compliance',
    desc: 'Understand how we keep your code safe and private.',
    icon: Shield,
    color: '#dcccb5',
    links: [
      { label: 'Encryption', href: '#' },
      { label: 'Access Control', href: '#' },
      { label: 'Compliance', href: '#' },
      { label: 'Data Privacy', href: '#' },
    ],
  },
  {
    title: 'Deployment & DevOps',
    desc: 'Deploy AetherStudio on your own infrastructure.',
    icon: Globe,
    color: '#30d158',
    links: [
      { label: 'Self-Hosted Guide', href: '#' },
      { label: 'Docker Setup', href: '#' },
      { label: 'Kubernetes', href: '#' },
      { label: 'Environment Variables', href: '#' },
    ],
  },
];

function DocCard({ category, index }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.04, duration: 0.4 }}
      className="group relative p-5 rounded-[14px] border transition-all duration-300"
      style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.05)' }}
    >
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 rounded-[10px] flex items-center justify-center flex-shrink-0" style={{ background: `${category.color}12` }}>
          <category.icon size={18} style={{ color: category.color }} />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-[15px] font-bold text-[#f5f5f7]">{category.title}</h3>
          <p className="text-[12px] mt-1 leading-relaxed" style={{ color: 'rgba(255,255,255,0.4)' }}>{category.desc}</p>
          <ul className="mt-3 space-y-1.5">
            {category.links.map((link) => (
              <li key={link.label}>
                <a href={link.href}
                  className="flex items-center gap-2 text-[12px] transition-all py-1"
                  style={{ color: 'rgba(255,255,255,0.35)' }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = category.color; e.currentTarget.style.transform = 'translateX(4px)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.35)'; e.currentTarget.style.transform = 'translateX(0)'; }}
                >
                  <ArrowRight size={10} style={{ color: `${category.color}60` }} className="opacity-0 group-hover:opacity-100 transition-all" />
                  <span>{link.label}</span>
                  <ExternalLink size={9} className="ml-auto opacity-0 group-hover:opacity-40 transition-opacity flex-shrink-0" style={{ color: 'rgba(255,255,255,0.2)' }} />
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </motion.div>
  );
}

export default function DocsPage() {
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

      <section className="relative pt-32 pb-16">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse 60% 50% at 50% 0%, rgba(200,200,208,0.06) 0%, transparent 60%), radial-gradient(ellipse 40% 40% at 80% 80%, rgba(176,176,188,0.04) 0%, transparent 50%)' }} />
        </div>
        <div className="relative max-w-4xl mx-auto px-6 text-center">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.7 }}>
            <h1 className="text-[40px] md:text-[56px] font-bold text-[#f5f5f7] tracking-tight leading-[1.05]">
              Everything you need to{' '}
              <span className="bg-clip-text text-transparent" style={{ backgroundImage: 'linear-gradient(135deg, #c8c8d0, #dedee4, #b0b0bc)' }}>
                build with AetherStudio
              </span>
            </h1>
          </motion.div>
          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.5 }}
            className="text-[15px] mt-5 max-w-2xl mx-auto leading-relaxed" style={{ color: 'rgba(255,255,255,0.35)' }}
          >
            Comprehensive guides, API references, and tutorials to help you make the most of AetherStudio's collaborative IDE platform.
          </motion.p>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.5 }}
            className="inline-flex items-center gap-3 mt-8 px-4 py-2.5 rounded-[10px]"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}
          >
            <Search size={14} style={{ color: 'rgba(255,255,255,0.15)' }} />
            <span className="text-[12px] font-mono" style={{ color: 'rgba(255,255,255,0.2)' }}>Search documentation...</span>
            <kbd className="px-1.5 py-0.5 rounded text-[9px] font-medium" style={{ background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.15)' }}>Ctrl+K</kbd>
          </motion.div>
        </div>
      </section>

      <section className="relative pb-24">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-3">
            {DOC_CATEGORIES.map((cat, i) => (
              <DocCard key={cat.title} category={cat} index={i} />
            ))}
          </div>

          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
            className="mt-12 text-center"
          >
            <p className="text-[12px]" style={{ color: 'rgba(255,255,255,0.2)' }}>
              Can't find what you're looking for?{' '}
              <Link to="/contact" className="font-medium transition-colors" style={{ color: 'rgba(200,200,208,0.7)' }}
                onMouseEnter={(e) => e.currentTarget.style.color = '#c8c8d0'}
                onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(200,200,208,0.7)'}
              >Contact our team</Link>
            </p>
          </motion.div>
        </div>
      </section>

      <LandingFooter />
    </div>
  );
}
