import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../stores/useAuth';
import LandingNav from '../components/Common/LandingNav';
import LandingFooter from '../components/Landing/LandingFooter';

export default function AboutPage() {
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
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse 60% 50% at 50% 0%, rgba(184,148,80,0.06) 0%, transparent 60%), radial-gradient(ellipse 40% 40% at 80% 80%, rgba(160,120,64,0.04) 0%, transparent 50%)' }} />
        </div>
        <div className="relative max-w-4xl mx-auto px-6 text-center">
          <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.7 }}
            className="text-[40px] md:text-[56px] font-bold text-[#f5f5f7] tracking-tight leading-[1.05]"
          >
            Building the future of{' '}
            <span className="bg-clip-text text-transparent" style={{ backgroundImage: 'linear-gradient(135deg, #b89450, #d4bc80, #a07840)' }}>
              collaborative coding
            </span>
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.5 }}
            className="text-[15px] mt-5 max-w-2xl mx-auto leading-relaxed" style={{ color: 'rgba(255,255,255,0.35)' }}
          >
            AetherStudio was founded with a simple mission: make collaborative software development as seamless as working alone.
            We believe the best code is written together — in real-time, with AI assistance, and zero friction.
          </motion.p>
        </div>
      </section>
      <LandingFooter />
    </div>
  );
}
