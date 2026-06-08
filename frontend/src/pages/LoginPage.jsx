import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../stores/useAuth';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, ArrowRight } from 'lucide-react';
import AuthBrandPanel from '../components/Common/AuthBrandPanel';
import FormInput from '../components/Common/FormInput';
import { validateEmail, checkEmailExists } from '../lib/api';

// ─── Social Button ──────────────────────────────────────────
function SocialButton({ provider, icon, label }) {
  return (
    <motion.button
      type="button"
      whileHover={{ scale: 1.01, background: 'rgba(255,255,255,0.07)' }}
      whileTap={{ scale: 0.98 }}
      className="flex items-center justify-center gap-2.5 w-full py-[10px] rounded-[10px] text-[12px] font-medium transition-all duration-200 select-none"
      style={{
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.06)',
        color: 'rgba(255,255,255,0.5)',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.background = 'rgba(255,255,255,0.07)';
        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
        e.currentTarget.style.color = 'rgba(255,255,255,0.7)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)';
        e.currentTarget.style.color = 'rgba(255,255,255,0.5)';
      }}
    >
      {icon}
      {label}
    </motion.button>
  );
}

// ─── Shake Wrapper ──────────────────────────────────────────
function Shake({ children, trigger }) {
  return (
    <motion.div
      key={trigger}
      animate={trigger > 0 ? { x: [0, -4, 4, -3, 3, -1, 1, 0] } : {}}
      transition={{ duration: 0.35, ease: 'easeInOut' }}
    >
      {children}
    </motion.div>
  );
}

// ─── Error Alert ────────────────────────────────────────────
function ErrorAlert({ message }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={{ duration: 0.2 }}
      className="flex items-start gap-2.5 px-3.5 py-2.5 rounded-[8px] border"
      style={{
        background: 'rgba(255,69,58,0.06)',
        borderColor: 'rgba(255,69,58,0.12)',
      }}
    >
      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="mt-0.5 flex-shrink-0">
        <circle cx="6" cy="6" r="5" stroke="#ff453a" strokeWidth="1.5" opacity="0.5" />
        <path d="M4 4L8 8M8 4L4 8" stroke="#ff453a" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
      <p className="text-[11px] text-[#ff453a] font-medium leading-relaxed">{message}</p>
    </motion.div>
  );
}

// ─── MAIN ────────────────────────────────────────────────────
export default function LoginPage() {
  const { login, loading, error, clearError } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const prefillEmail = location.state?.email || '';

  const [email, setEmail] = useState(prefillEmail);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [step, setStep] = useState(prefillEmail ? 2 : 1);
  const [shake, setShake] = useState(0);
  const [mxStatus, setMxStatus] = useState({ loading: false, valid: null, error: null });
  const [emailCheckLoading, setEmailCheckLoading] = useState(false);
  const [emailCheckError, setEmailCheckError] = useState('');

  useEffect(() => {
    clearError();
  }, []);

  // Debounced MX lookup
  useEffect(() => {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setMxStatus({ loading: false, valid: null, error: null });
      return;
    }
    const timer = setTimeout(async () => {
      setMxStatus(s => ({ ...s, loading: true }));
      try {
        const { valid } = await validateEmail(email);
        setMxStatus({ loading: false, valid, error: valid ? null : 'This domain does not appear to accept email' });
      } catch {
        setMxStatus({ loading: false, valid: null, error: null });
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [email]);

  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const emailError = email.length > 0 && !isEmailValid
    ? 'Enter a valid email address'
    : isEmailValid && mxStatus.valid === false
      ? mxStatus.error
      : null;
  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    if (!isEmailValid) { setShake(s => s + 1); return; }

    setEmailCheckLoading(true);
    setEmailCheckError('');
    try {
      const { exists } = await checkEmailExists(email);
      if (!exists) {
        setEmailCheckError('No account found with this email address');
        setShake(s => s + 1);
        return;
      }
      setStep(2);
    } catch {
      // Network error — let them through rather than blocking
      setStep(2);
    } finally {
      setEmailCheckLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      await login(email, password);
      // Check for redirect from invite flow or other paths
      const redirectTo = location.state?.redirect || '/dashboard';
      navigate(redirectTo);
    } catch {
      setShake(s => s + 1);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#000000]">
      {/* ── Left Brand Panel ── */}
      <AuthBrandPanel />

      {/* ── Right Form Side ── */}
      <div className="flex-1 flex items-center justify-center p-6 md:p-8 lg:p-12 relative overflow-hidden">
        {/* Side gradient */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `
              radial-gradient(ellipse 600px 80% at 0% 50%, rgba(200,200,208,0.03) 0%, transparent 60%),
              radial-gradient(ellipse 300px 300px at 80% 20%, rgba(176,176,188,0.02) 0%, transparent 60%)
            `,
          }}
        />

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
          className="relative z-10 w-full max-w-[400px]"
        >
          {/* Header */}
          <div className="mb-8">
            <motion.h1
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.4 }}
              className="text-[28px] font-bold text-[#f5f5f7] tracking-tight"
            >
              Welcome back
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.18, duration: 0.4 }}
              className="text-[13px] mt-1.5"
              style={{ color: 'rgba(255,255,255,0.3)' }}
            >
              Sign in to continue to AetherStudio
            </motion.p>
          </div>

          {/* Card */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.22, duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
            className="rounded-[14px] border overflow-hidden"
            style={{
              background: 'rgba(18,18,22,0.6)',
              borderColor: 'rgba(255,255,255,0.06)',
              boxShadow: '0 8px 40px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.03)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
            }}
          >
            <div className="p-6 md:p-8">
              {/* Error Alert */}
              <AnimatePresence mode="wait">
                {error && (
                  <div className="mb-5">
                    <ErrorAlert message={error} />
                  </div>
                )}
              </AnimatePresence>

              {/* Social Buttons */}
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.28, duration: 0.4 }}
                className="space-y-2 mb-6"
              >
                <SocialButton
                  provider="google"
                  icon={
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    </svg>
                  }
                  label="Continue with Google"
                />
                <SocialButton
                  provider="github"
                  icon={
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
                    </svg>
                  }
                  label="Continue with GitHub"
                />
              </motion.div>

              {/* Divider */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.32, duration: 0.4 }}
                className="flex items-center gap-4 mb-6"
              >
                <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.04)' }} />
                <span className="text-[10px] font-medium" style={{ color: 'rgba(255,255,255,0.15)' }}>
                  OR
                </span>
                <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.04)' }} />
              </motion.div>

              {/* Form */}
              <AnimatePresence mode="wait">
                {step === 1 && (
                  <motion.div
                    key="step-email"
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 8 }}
                    transition={{ duration: 0.2 }}
                  >
                    <form onSubmit={handleEmailSubmit} className="space-y-4">
                      <Shake trigger={shake}>
                        <FormInput
                          id="login-email"
                          type="email"
                          value={email}
                          onChange={e => { setEmail(e.target.value); clearError(); setEmailCheckError(''); }}
                          label="Email address"
                          autoComplete="email"
                          autoFocus
                          valid={isEmailValid && mxStatus.valid === true}
                          error={emailError}
                        />
                      </Shake>

                      {emailCheckError && (
                        <div className="mb-0">
                          <ErrorAlert message={emailCheckError} />
                        </div>
                      )}

                      <motion.button
                        type="submit"
                        disabled={!email || emailCheckLoading}
                        className="w-full py-[10px] rounded-[8px] text-[13px] font-semibold transition-all duration-200 select-none"
                        style={{
                          background: email && !emailCheckLoading ? 'rgba(200,200,208,1)' : 'rgba(255,255,255,0.04)',
                          color: email && !emailCheckLoading ? '#fff' : 'rgba(255,255,255,0.15)',
                          cursor: email && !emailCheckLoading ? 'pointer' : 'not-allowed',
                        }}
                        whileHover={email && !emailCheckLoading ? { background: 'rgba(200,200,208,0.9)' } : {}}
                        whileTap={email && !emailCheckLoading ? { scale: 0.98 } : {}}
                      >
                        {emailCheckLoading ? (
                          <span className="flex items-center justify-center gap-2">
                            <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none">
                              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.25" />
                              <path d="M12 2C6.477 2 2 6.477 2 12" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                            </svg>
                            Checking…
                          </span>
                        ) : (
                          <span className="flex items-center justify-center gap-1.5">
                            Continue <ArrowRight size={14} />
                          </span>
                        )}
                      </motion.button>
                    </form>
                  </motion.div>
                )}

                {step === 2 && (
                  <motion.div
                    key="step-password"
                    initial={{ opacity: 0, x: 8 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -8 }}
                    transition={{ duration: 0.2 }}
                  >
                    <form onSubmit={handleLogin} className="space-y-4">
                      {/* Email pill */}
                      <div className="flex items-center gap-2 pb-1">
                        <div
                          className="flex items-center gap-1.5 px-2.5 py-1 rounded-[6px] text-[11px]"
                          style={{ background: 'rgba(200,200,208,0.06)', color: 'rgba(200,200,208,0.6)' }}
                        >
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="2" y="4" width="20" height="16" rx="2"/>
                            <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
                          </svg>
                          <span className="truncate max-w-[180px]">{email}</span>
                          <button
                            type="button"
                            onClick={() => setStep(1)}
                            className="ml-0.5 font-medium transition-colors"
                            style={{ color: 'rgba(200,200,208,0.4)' }}
                            onMouseEnter={e => e.currentTarget.style.color = 'rgba(200,200,208,0.8)'}
                            onMouseLeave={e => e.currentTarget.style.color = 'rgba(200,200,208,0.4)'}
                          >
                            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                              <path d="M2 2L8 8M8 2L2 8" />
                            </svg>
                          </button>
                        </div>
                      </div>

                      <Shake trigger={shake}>
                        <FormInput
                          id="login-password"
                          type={showPassword ? 'text' : 'password'}
                          value={password}
                          onChange={e => { setPassword(e.target.value); clearError(); }}
                          label="Password"
                          autoComplete="current-password"
                          autoFocus
                          valid={password.length >= 1}
                          hint="At least 8 characters"
                        >
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="p-0.5 transition-colors"
                            style={{ color: 'rgba(255,255,255,0.15)' }}
                            onMouseEnter={e => e.currentTarget.style.color = 'rgba(255,255,255,0.35)'}
                            onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.15)'}
                            tabIndex={-1}
                          >
                            {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                          </button>
                        </FormInput>
                      </Shake>

                      <div className="flex justify-end">
                        <Link
                          to="/forgot-password"
                          state={{ email }}
                          className="text-[11px] font-medium transition-colors"
                          style={{ color: 'rgba(200,200,208,0.5)' }}
                          onMouseEnter={e => e.currentTarget.style.color = 'rgba(200,200,208,0.8)'}
                          onMouseLeave={e => e.currentTarget.style.color = 'rgba(200,200,208,0.5)'}
                        >
                          Forgot password?
                        </Link>
                      </div>

                      <motion.button
                        type="submit"
                        disabled={!password || loading}
                        className="w-full py-[10px] rounded-[8px] text-[13px] font-semibold transition-all duration-200 select-none"
                        style={{
                          background: password && !loading ? 'rgba(200,200,208,1)' : 'rgba(255,255,255,0.04)',
                          color: password && !loading ? '#fff' : 'rgba(255,255,255,0.15)',
                          cursor: password && !loading ? 'pointer' : 'not-allowed',
                        }}
                        whileHover={password && !loading ? { background: 'rgba(200,200,208,0.9)' } : {}}
                        whileTap={password && !loading ? { scale: 0.98 } : {}}
                      >
                        {loading ? (
                          <span className="flex items-center justify-center gap-2">
                            <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none">
                              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.25" />
                              <path d="M12 2C6.477 2 2 6.477 2 12" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                            </svg>
                            Signing in…
                          </span>
                        ) : (
                          <span className="flex items-center justify-center gap-1.5">
                            Sign In <ArrowRight size={14} />
                          </span>
                        )}
                      </motion.button>
                    </form>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>

          {/* Footer */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.45, duration: 0.4 }}
            className="mt-6 text-center text-[12px]"
            style={{ color: 'rgba(255,255,255,0.15)' }}
          >
            Don&apos;t have an account?{' '}
            <Link
              to="/register"
              state={{ redirect: location.state?.redirect }}
              className="font-medium transition-colors"
              style={{ color: 'rgba(200,200,208,0.5)' }}
              onMouseEnter={e => e.currentTarget.style.color = 'rgba(200,200,208,0.8)'}
              onMouseLeave={e => e.currentTarget.style.color = 'rgba(200,200,208,0.5)'}
            >
              Create one
            </Link>
          </motion.p>
        </motion.div>
      </div>
    </div>
  );
}
