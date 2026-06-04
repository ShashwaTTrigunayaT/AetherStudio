import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle2, AlertCircle, Clock, Server, Cpu, Globe, Database } from 'lucide-react';
import { useAuth } from '../stores/useAuth';
import LandingNav from '../components/Common/LandingNav';
import LandingFooter from '../components/Landing/LandingFooter';

const SERVICES = [
  { name: 'API Server', status: 'operational', uptime: '99.99%', icon: Server },
  { name: 'Web App', status: 'operational', uptime: '99.98%', icon: Globe },
  { name: 'Real-Time Sync', status: 'operational', uptime: '99.95%', icon: Cpu },
  { name: 'Code Execution', status: 'degraded', uptime: '99.2%', icon: Database },
  { name: 'AI Assistance', status: 'operational', uptime: '99.9%', icon: Cpu },
  { name: 'File Storage', status: 'operational', uptime: '99.99%', icon: Database },
];

export default function StatusPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    document.body.style.overflow = 'auto';
    return () => { document.body.style.overflow = 'hidden'; };
  }, []);

  const handleGetStarted = () => user ? navigate('/dashboard') : navigate('/register');
  const operationalCount = SERVICES.filter(s => s.status === 'operational').length;

  return (
    <div className="min-h-screen bg-[#000000] overflow-x-hidden">
      <LandingNav onGetStarted={handleGetStarted} user={user} onLogout={logout} />
      <section className="relative pt-32 pb-20">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.7 }}
            className="text-[40px] md:text-[56px] font-bold text-[#f5f5f7] tracking-tight"
          >All Systems <span className="bg-clip-text text-transparent" style={{ backgroundImage: 'linear-gradient(135deg, #30d158, #34e859)' }}>Operational</span></motion.h1>
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3 }}
            className="inline-flex items-center gap-2 mt-6 px-4 py-2 rounded-[10px]"
            style={{ background: 'rgba(48,209,88,0.06)', border: '1px solid rgba(48,209,88,0.1)' }}
          >
            <CheckCircle2 size={16} style={{ color: '#30d158' }} />
            <span className="text-[13px] font-medium" style={{ color: 'rgba(48,209,88,0.8)' }}>{operationalCount} of {SERVICES.length} services operational</span>
          </motion.div>
        </div>
      </section>
      <section className="relative pb-24">
        <div className="max-w-3xl mx-auto px-6">
          <div className="space-y-2">
            {SERVICES.map((service, i) => (
              <motion.div key={service.name} initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                transition={{ delay: i * 0.04 }}
                className="flex items-center justify-between p-4 rounded-[12px] border"
                style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.04)' }}
              >
                <div className="flex items-center gap-3">
                  <service.icon size={16} style={{ color: 'rgba(255,255,255,0.2)' }} />
                  <span className="text-[13px] font-medium text-[#f5f5f7]">{service.name}</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-[11px]" style={{ color: 'rgba(255,255,255,0.2)' }}>{service.uptime} uptime</span>
                  <span className="text-[11px] font-medium px-2 py-0.5 rounded-full flex items-center gap-1"
                    style={{
                      color: service.status === 'operational' ? '#30d158' : '#ff9f0a',
                      background: service.status === 'operational' ? 'rgba(48,209,88,0.08)' : 'rgba(255,159,10,0.08)',
                    }}
                  >
                    {service.status === 'operational' ? <CheckCircle2 size={10} /> : <AlertCircle size={10} />}
                    {service.status === 'operational' ? 'Operational' : 'Degraded'}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
            className="mt-10 p-5 rounded-[14px] border text-center"
            style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.04)' }}
          >
            <Clock size={18} className="mx-auto mb-2" style={{ color: 'rgba(255,255,255,0.2)' }} />
            <p className="text-[12px]" style={{ color: 'rgba(255,255,255,0.35)' }}>No recent incidents. We continuously monitor all services 24/7.</p>
          </motion.div>
        </div>
      </section>
      <LandingFooter />
    </div>
  );
}
