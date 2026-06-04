import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, MessageSquare, Github, Twitter, Send } from 'lucide-react';
import { useAuth } from '../stores/useAuth';
import LandingNav from '../components/Common/LandingNav';
import LandingFooter from '../components/Landing/LandingFooter';

const CONTACT_CHANNELS = [
  { icon: Mail, title: 'Email Us', desc: 'support@aetherstudio.dev', action: 'Send email', href: 'mailto:support@aetherstudio.dev', color: '#b89450' },
  { icon: MessageSquare, title: 'Discord Community', desc: 'Join 5,000+ developers', action: 'Join Discord', href: '#', color: '#a07840' },
  { icon: Github, title: 'GitHub', desc: 'Open source issues & PRs', action: 'View on GitHub', href: '#', color: '#f5f5f7' },
  { icon: Twitter, title: 'X / Twitter', desc: 'Follow for updates', action: 'Follow @aetherstudio', href: '#', color: '#d4bc80' },
];

export default function ContactPage() {
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
        <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse 60% 50% at 50% 0%, rgba(184,148,80,0.06) 0%, transparent 60%), radial-gradient(ellipse 50% 40% at 50% 100%, rgba(160,120,64,0.04) 0%, transparent 50%)' }} />
        <div className="relative max-w-4xl mx-auto px-6 text-center">
          <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.7 }}
            className="text-[40px] md:text-[56px] font-bold text-[#f5f5f7] tracking-tight"
          >We&apos;d love to <span className="bg-clip-text text-transparent" style={{ backgroundImage: 'linear-gradient(135deg, #b89450, #d4bc80)' }}>hear from you</span></motion.h1>
          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.5 }}
            className="text-[15px] mt-5 max-w-lg mx-auto leading-relaxed" style={{ color: 'rgba(255,255,255,0.35)' }}
          >Have a question, feedback, or want to partner with us?</motion.p>
        </div>
      </section>
      <section className="relative pb-24">
        <div className="max-w-4xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-4">
            {CONTACT_CHANNELS.map((channel, i) => (
              <motion.a key={channel.title} href={channel.href} target="_blank" rel="noopener noreferrer"
                initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                transition={{ delay: i * 0.06 }}
                className="group relative p-5 rounded-[14px] border transition-all duration-300 flex items-start gap-4"
                style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.05)' }}
              >
                <div className="w-10 h-10 rounded-[10px] flex items-center justify-center flex-shrink-0" style={{ background: `${channel.color}12` }}>
                  <channel.icon size={18} style={{ color: channel.color }} />
                </div>
                <div className="flex-1">
                  <h3 className="text-[14px] font-bold text-[#f5f5f7]">{channel.title}</h3>
                  <p className="text-[12px] mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>{channel.desc}</p>
                  <div className="flex items-center gap-1 mt-2 text-[11px] font-medium transition-all group-hover:gap-2" style={{ color: channel.color }}>
                    {channel.action} <Send size={10} />
                  </div>
                </div>
              </motion.a>
            ))}
          </div>
        </div>
      </section>
      <LandingFooter />
    </div>
  );
}
