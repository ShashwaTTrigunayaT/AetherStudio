import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Code2, Home, Terminal, Cpu, Globe } from 'lucide-react';
import { motion } from 'framer-motion';

function CodeRain() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationId;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const chars = '10{}[]()<>/\\=+-#*&^%$@!~:;,.';
    const fontSize = 14;
    const columns = Math.floor(canvas.width / (fontSize * 1.2));
    const drops = Array(columns).fill(0).map(() => Math.random() * -100);

    const draw = () => {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.font = `${fontSize}px "SF Mono", "Fira Code", monospace`;

      for (let i = 0; i < drops.length; i++) {
        const char = chars[Math.floor(Math.random() * chars.length)];
        const x = i * fontSize * 1.2;
        const y = drops[i] * fontSize;

        // Gradient fade
        const alpha = Math.max(0, Math.min(0.5, 1 - y / canvas.height));
        const gradient = ctx.createLinearGradient(x, y - 20, x, y + 20);
        gradient.addColorStop(0, `rgba(0, 113, 227, 0)`);
        gradient.addColorStop(0.5, `rgba(0, 113, 227, ${alpha * 0.3})`);
        gradient.addColorStop(1, `rgba(64, 169, 255, 0)`);
        ctx.fillStyle = gradient;
        ctx.fillText(char, x, y);

        drops[i]++;
        if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
          drops[i] = 0;
        }
        if (y > canvas.height) {
          drops[i] = 0;
        }
      }
      animationId = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0 opacity-30"
    />
  );
}

function FloatingTerminal() {
  return (
    <motion.div
      animate={{ y: [0, -15, 0], rotate: [0, -2, 2, 0] }}
      transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
      className="absolute top-[20%] right-[15%] hidden md:block"
    >
      <div className="relative">
        <div className="w-32 h-24 rounded-xl bg-[rgba(12,12,14,0.9)] border border-[rgba(255,255,255,0.06)] overflow-hidden shadow-2xl backdrop-blur-xl">
          <div className="flex items-center gap-1 px-2 py-1.5 border-b border-[rgba(255,255,255,0.06)]">
            <div className="w-1.5 h-1.5 rounded-full bg-[#ff453a]" />
            <div className="w-1.5 h-1.5 rounded-full bg-[#ffd60a]" />
            <div className="w-1.5 h-1.5 rounded-full bg-[#30d158]" />
          </div>
          <div className="p-2 font-mono text-[8px] leading-relaxed">
            <span className="text-[#30d158]">$ </span>
            <span className="text-[rgba(255,255,255,0.5)] animate-neon-pulse">_</span>
          </div>
        </div>
        {/* Glow */}
        <div className="absolute -inset-4 rounded-xl opacity-20 blur-xl"
          style={{
            background: 'radial-gradient(ellipse at center, rgba(184,148,80,0.2), transparent 70%)',
          }}
        />
      </div>
    </motion.div>
  );
}

function CodeOrb() {
  return (
    <motion.div
      animate={{ scale: [1, 1.1, 0.95, 1], rotate: [0, 180, 360] }}
      transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
      className="absolute bottom-[15%] left-[10%] hidden md:block pointer-events-none"
    >
      <div className="relative">
        <motion.div
          animate={{ opacity: [0.15, 0.25, 0.15] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          className="w-40 h-40 rounded-full"
          style={{
            background: 'conic-gradient(from 0deg, #b89450, #a07840, #30d158, #ff9f0a, #b89450)',
            filter: 'blur(40px)',
          }}
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.div
            animate={{ rotate: [0, -180, -360] }}
            transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
          >
            <Cpu size={24} className="text-[rgba(255,255,255,0.08)]" />
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}

export default function NotFoundPage() {
  const [cmdText, setCmdText] = useState('');
  const fullCmd = '➜  ~ curl -s https://aetherstudio.dev/this-page\n';

  useEffect(() => {
    let i = 0;
    const interval = setInterval(() => {
      setCmdText(fullCmd.slice(0, i));
      i++;
      if (i > fullCmd.length) clearInterval(interval);
    }, 30);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-[#000000] flex flex-col items-center justify-center px-6 relative overflow-hidden">
      {/* Animated backgrounds */}
      <CodeRain />
      <FloatingTerminal />
      <CodeOrb />

      <div className="fixed inset-0 pointer-events-none z-[1]"
        style={{
          background: 'radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,0.7) 100%)',
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
        className="relative z-10 text-center max-w-lg"
      >
        {/* Large 404 with gradient */}
        <div className="relative mb-8">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.15, duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
            className="text-[150px] md:text-[200px] font-bold leading-none select-none tracking-tighter"
            style={{
              background: 'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(184,148,80,0.06) 50%, rgba(160,120,64,0.04) 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            404
          </motion.div>

          {/* Error indicator */}
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4, type: 'spring', stiffness: 300, damping: 15 }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
          >
            <div className="relative">
              <motion.div
                animate={{ scale: [1, 1.15, 1], opacity: [0.5, 0.8, 0.5] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                className="w-24 h-24 rounded-[28px] bg-gradient-to-br from-[rgba(255,69,58,0.08)] to-[rgba(255,69,58,0.02)] border border-[rgba(255,69,58,0.1)] flex items-center justify-center backdrop-blur-xl"
              >
                <Terminal size={36} className="text-[rgba(255,69,58,0.3)]" />
              </motion.div>
            </div>
          </motion.div>
        </div>

        {/* Terminal-style message */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.4 }}
          className="mb-8"
        >
          <div className="inline-block px-5 py-3 rounded-xl bg-[rgba(12,12,14,0.7)] border border-[rgba(255,255,255,0.06)] font-mono text-left min-w-[280px] backdrop-blur-xl">
            <div className="flex items-center gap-2 mb-2 pb-2 border-b border-[rgba(255,255,255,0.06)]">
              <div className="flex gap-1">
                <div className="w-2 h-2 rounded-full bg-[#ff453a]" />
                <div className="w-2 h-2 rounded-full bg-[#ffd60a]" />
                <div className="w-2 h-2 rounded-full bg-[#30d158]" />
              </div>
              <span className="text-[9px] text-[rgba(255,255,255,0.2)]">bash — 80×24</span>
            </div>
            <p className="text-[13px] leading-relaxed">
              <span className="text-[#30d158]">➜</span>{' '}
              <span className="text-[#d4bc80]">~</span>{' '}
              <span className="text-[rgba(255,255,255,0.3)]">{cmdText}</span>
              {cmdText.length < fullCmd.length && (
                <motion.span
                  animate={{ opacity: [1, 0] }}
                  transition={{ duration: 0.5, repeat: Infinity }}
                  className="text-[rgba(255,255,255,0.5)]"
                >█</motion.span>
              )}
              {cmdText.length >= fullCmd.length && (
                <>
                  <br />
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2, duration: 0.3 }}
                    className="text-[#ff453a]"
                  >
                    curl: (6) Could not resolve host
                  </motion.span>
                  <br />
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5, duration: 0.3 }}
                    className="text-[rgba(255,255,255,0.2)]"
                  >
                    <span className="text-[#30d158]">➜</span>{' '}
                    <span className="text-[#d4bc80]">~</span>{' '}
                    <motion.span
                      animate={{ opacity: [1, 0] }}
                      transition={{ duration: 0.5, repeat: Infinity }}
                      className="text-[rgba(255,255,255,0.3)]"
                    >█</motion.span>
                  </motion.span>
                </>
              )}
            </p>
          </div>
        </motion.div>

        {/* Title */}
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.3 }}
          className="text-[26px] font-bold text-[#f5f5f7] tracking-tight mb-2"
        >
          Page not found
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.3 }}
          className="text-[14px] text-[rgba(255,255,255,0.4)] mb-8 max-w-sm mx-auto leading-relaxed"
        >
          The page you're looking for has been moved, deleted, or never existed in this dimension.
        </motion.p>

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9, duration: 0.3 }}
          className="flex items-center justify-center gap-3"
        >
          <Link to="/">
            <motion.button
              whileHover={{ scale: 1.03, y: -1 }}
              whileTap={{ scale: 0.97 }}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm text-white transition-all"
              style={{
                background: 'linear-gradient(135deg, #b89450, #d4bc80)',
                boxShadow: '0 4px 20px rgba(0, 113, 227, 0.25)',
              }}
            >
              <Globe size={16} />
              Home Page
            </motion.button>
          </Link>
          <Link to="/dashboard">
            <motion.button
              whileHover={{ scale: 1.03, y: -1 }}
              whileTap={{ scale: 0.97 }}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all"
              style={{
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.08)',
                color: 'rgba(255,255,255,0.7)',
              }}
            >
              <Home size={16} />
              Dashboard
            </motion.button>
          </Link>
          <motion.button
            whileHover={{ scale: 1.03, y: -1 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => window.history.back()}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm text-[rgba(255,255,255,0.7)] transition-all"
            style={{
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.08)',
            }}
          >
            <ArrowLeft size={16} />
            Go Back
          </motion.button>
        </motion.div>
      </motion.div>

      {/* Footer */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
        className="fixed bottom-8 flex items-center gap-2 text-[rgba(255,255,255,0.08)]"
      >
        <Code2 size={14} />
        <span className="text-[10px] font-medium tracking-widest uppercase">AetherStudio — 404</span>
      </motion.div>
    </div>
  );
}
