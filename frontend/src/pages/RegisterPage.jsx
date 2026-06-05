import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../stores/useAuth';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, ArrowRight } from 'lucide-react';
import AuthBrandPanel from '../components/Common/AuthBrandPanel';
import FormInput from '../components/Common/FormInput';
import { validateEmail, verifyEmailReal } from '../lib/api';

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

// ─── Disposable email detection ─────────────────────────────
const DISPOSABLE = new Set([
  'mailinator.com', 'guerrillamail.com', '10minutemail.com', 'tempmail.com',
  'temp-mail.org', 'yopmail.com', 'sharklasers.com', 'trashmail.com',
  'maildrop.cc', 'getnada.com', 'burnermail.io', 'tempemail.co',
  'tempmail.net', 'tempinbox.com', 'spamgourmet.com',
  'mailmetrash.com', 'fakemailgenerator.com', 'throwaway.email',
  'dispostable.com', 'mailet.com', 'temp-mail.io',
  'guerrillamail.org', 'guerrillamail.net', 'guerrillamail.biz',
  'grr.la', 'spambox.us', 'mintemail.com', 'moakt.com',
  'nowmymail.com', 'wegwerfmail.de', 'wegwerfmail.net',
  'wegwerfmail.org', 'whyspam.me', 'yopmail.fr', 'yopmail.net',
  'temp-mail.org', 'mail.tm', 'tempmail.ninja', 'tempr.email',
  'tempemail.net', 'mailnator.com',
]);

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

// ─── Password Strength ──────────────────────────────────────
function PasswordStrength({ password }) {
  if (!password) return null;

  const checks = [
    { label: '8+ characters', met: password.length >= 8 },
    { label: 'Number', met: /\d/.test(password) },
    { label: 'Letter', met: /[a-zA-Z]/.test(password) },
    { label: 'Special char', met: /[!@#$%^&*(),.?":{}|<>]/.test(password) },
  ];

  const strength = checks.filter(c => c.met).length;

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className="mt-3 space-y-2 overflow-hidden"
    >
      <div className="flex gap-1">
        {[0, 1, 2, 3].map(i => (
          <div
            key={i}
            className="h-[2px] flex-1 rounded-full transition-all duration-300"
            style={{
              background: i <= strength - 1
                ? ['#ff453a', '#ff9f0a', '#c8c8d0', '#30d158'][Math.max(strength - 1, 0)]
                : 'rgba(255,255,255,0.04)',
            }}
          />
        ))}
      </div>
      <div className="grid grid-cols-2 gap-y-0.5">
        {checks.map(check => (
          <div key={check.label} className="flex items-center gap-1.5">
            <svg width="6" height="6" viewBox="0 0 6 6" fill={check.met ? '#30d158' : 'rgba(255,255,255,0.1)'}>
              <circle cx="3" cy="3" r="2.5" />
            </svg>
            <span className={`text-[10px] ${check.met ? 'text-[rgba(255,255,255,0.3)]' : 'text-[rgba(255,255,255,0.12)]'}`}>
              {check.label}
            </span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

// ─── MAIN ────────────────────────────────────────────────────
export default function RegisterPage() {
  const { register, loading, error, clearError } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [mxStatus, setMxStatus] = useState({ loading: false, valid: null, error: null });
  const [emailRealStatus, setEmailRealStatus] = useState({ loading: false, verified: null, reason: null });

  useEffect(() => { clearError(); }, []);

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
        setMxStatus({ loading: false, valid, error: valid ? null : 'This domain does not accept email' });
      } catch {
        // If DNS lookup fails, we can't confirm — treat as potentially invalid
        setMxStatus({ loading: false, valid: false, error: 'Could not verify this email domain. Please try a different email.' });
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [email]);

  // Debounced real email verification (SMTP check — is this a real inbox?)
  useEffect(() => {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailRealStatus({ loading: false, verified: null, reason: null });
      return;
    }
    const timer = setTimeout(async () => {
      setEmailRealStatus(s => ({ ...s, loading: true }));
      try {
        const { verified, reason } = await verifyEmailReal(email);
        setEmailRealStatus({ loading: false, verified, reason });
      } catch {
        // SMTP check failed (e.g. port 25 blocked) — treat as inconclusive, show warning
        setEmailRealStatus({ loading: false, verified: null, reason: 'Could not verify inbox existence. Server may be unreachable.' });
      }
    }, 800); // Slightly longer debounce since SMTP check is slower
    return () => clearTimeout(timer);
  }, [email]);

  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const emailDomain = !email || !email.includes('@') ? null : email.split('@')[1]?.toLowerCase();
  const isDisposable = emailDomain ? DISPOSABLE.has(emailDomain) : false;

  // Combined email validation state
  const formatError = email.length > 0 && !isEmailValid
    ? 'Enter a valid email address'
    : null;
  const mxError = isEmailValid && mxStatus.valid === false ? mxStatus.error : null;
  const notReal = isEmailValid && emailRealStatus.verified === false;
  // SMTP inconclusive = couldn't verify (port 25 blocked etc.) — show warning but don't block
  const smtpInconclusive = isEmailValid && emailRealStatus.verified === null && emailRealStatus.reason && !formatError && !mxError && !isDisposable;

  // Is any email check in progress?
  const isVerifyingEmail = isEmailValid && (mxStatus.loading || emailRealStatus.loading);

  // Whether all email checks have completed successfully
  const emailChecksComplete = isEmailValid && !mxStatus.loading && !emailRealStatus.loading && mxStatus.valid === true && emailRealStatus.verified !== false;

  const emailError = formatError || mxError || (isDisposable ? 'Disposable emails not allowed' : null) || (notReal ? 'This email does not appear to exist. Please use a real email address.' : null);

  const isNameValid = name.trim().length >= 2;
  // Only allow submission when: format ok, not disposable, MX passed, SMTP didn't explicitly fail, and all checks done
  const isFormValid = isNameValid && isEmailValid && !isDisposable && password.length >= 8 && mxStatus.valid === true && !notReal && !isVerifyingEmail;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isFormValid) return;
    try {
      await register(email, password, name);
      navigate('/dashboard');
    } catch { /* handled */ }
  };

  return (
    <div className="flex min-h-screen bg-[#000000]">
      {/* ── Left Brand Panel ── */}
      <AuthBrandPanel
        tagline="Start building, together."
        description="Join thousands of developers collaborating in real-time with AI-powered assistance."
        featurePills={[
          { label: 'Free to start', color: '#30d158' },
          { label: 'AI Powered', color: '#b0b0bc' },
          { label: 'Real-time', color: '#c8c8d0' },
        ]}
      />

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
              Create account
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.18, duration: 0.4 }}
              className="text-[13px] mt-1.5"
              style={{ color: 'rgba(255,255,255,0.3)' }}
            >
              Start your collaborative coding journey
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
                  label="Sign up with Google"
                />
                <SocialButton
                  provider="github"
                  icon={
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
                    </svg>
                  }
                  label="Sign up with GitHub"
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
              <form onSubmit={handleSubmit} className="space-y-4">
                <FormInput
                  id="reg-name"
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  label="Full name"
                  autoComplete="name"
                  required
                  autoFocus
                  valid={isNameValid}
                  error={name.length > 0 && !isNameValid ? 'At least 2 characters' : null}
                />

                <FormInput
                  id="reg-email"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  label="Email address"
                  autoComplete="email"
                  required
                  valid={emailChecksComplete}
                  error={email.length > 0 && (!isEmailValid || isDisposable || mxStatus.valid === false || notReal) ? emailError : null}
                >
                  {/* Email verification loading indicator */}
                  {isVerifyingEmail && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex items-center gap-1"
                    >
                      <svg className="animate-spin" width="12" height="12" viewBox="0 0 24 24" fill="none">
                        <circle cx="12" cy="12" r="10" stroke="rgba(200,200,208,0.3)" strokeWidth="3" />
                        <path d="M12 2C6.477 2 2 6.477 2 12" stroke="#dedee4" strokeWidth="3" strokeLinecap="round" />
                      </svg>
                    </motion.div>
                  )}
                  {/* Warning when SMTP check is inconclusive */}
                  {smtpInconclusive && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      title="Inbox verification unavailable"
                    >
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                        <circle cx="7" cy="7" r="6" stroke="rgba(255,214,10,0.4)" strokeWidth="1.5" />
                        <path d="M7 4.5v3M7 9.5v.5" stroke="#ffd60a" strokeWidth="1.5" strokeLinecap="round" />
                      </svg>
                    </motion.div>
                  )}
                </FormInput>

                {/* Email verification hint text */}
                <AnimatePresence mode="wait">
                  {isVerifyingEmail && (
                    <motion.p
                      key="verifying"
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      transition={{ duration: 0.15 }}
                      className="text-[10px] text-[rgba(200,200,208,0.5)] font-medium flex items-center gap-1.5"
                    >
                      <svg className="animate-spin" width="10" height="10" viewBox="0 0 24 24" fill="none">
                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.3" />
                        <path d="M12 2C6.477 2 2 6.477 2 12" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                      </svg>
                      {mxStatus.loading ? 'Checking email domain…' : 'Verifying inbox exists…'}
                    </motion.p>
                  )}
                  {smtpInconclusive && !isVerifyingEmail && (
                    <motion.p
                      key="inconclusive"
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      transition={{ duration: 0.15 }}
                      className="text-[10px] text-[rgba(255,214,10,0.5)] font-medium flex items-center gap-1.5"
                    >
                      <svg width="10" height="10" viewBox="0 0 14 14" fill="none">
                        <circle cx="7" cy="7" r="6" stroke="#ffd60a" strokeWidth="1.5" opacity="0.5" />
                        <path d="M7 4.5v3M7 9.5v.5" stroke="#ffd60a" strokeWidth="1.5" strokeLinecap="round" />
                      </svg>
                      Inbox could not be verified — domain confirmed, you can proceed
                    </motion.p>
                  )}
                </AnimatePresence>

                <div>
                  <FormInput
                    id="reg-password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    label="Password"
                    autoComplete="new-password"
                    required
                    valid={password.length >= 8}
                    error={password.length > 0 && password.length < 8 ? 'Must be 8+ characters' : null}
                    hint="At least 8 characters with a number and letter"
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
                  <PasswordStrength password={password} />
                </div>

                <div className="pt-1">
                  <motion.button
                    type="submit"
                    disabled={!isFormValid || loading}
                    className="w-full py-[10px] rounded-[8px] text-[13px] font-semibold transition-all duration-200 select-none"
                    style={{
                      background: isFormValid && !loading ? 'rgba(200,200,208,1)' : 'rgba(255,255,255,0.04)',
                      color: isFormValid && !loading ? '#fff' : 'rgba(255,255,255,0.15)',
                      cursor: isFormValid && !loading ? 'pointer' : 'not-allowed',
                    }}
                    whileHover={isFormValid && !loading ? { background: 'rgba(200,200,208,0.9)' } : {}}
                    whileTap={isFormValid && !loading ? { scale: 0.98 } : {}}
                  >
                    {loading ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none">
                          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.25" />
                          <path d="M12 2C6.477 2 2 6.477 2 12" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                        </svg>
                        Creating account…
                      </span>
                    ) : (
                      <span className="flex items-center justify-center gap-1.5">
                        
                        Create Account
                      </span>
                    )}
                  </motion.button>
                </div>
              </form>
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
            Already have an account?{' '}
            <Link
              to="/login"
              className="font-medium transition-colors"
              style={{ color: 'rgba(200,200,208,0.5)' }}
              onMouseEnter={e => e.currentTarget.style.color = 'rgba(200,200,208,0.8)'}
              onMouseLeave={e => e.currentTarget.style.color = 'rgba(200,200,208,0.5)'}
            >
              Sign in
            </Link>
          </motion.p>
        </motion.div>
      </div>
    </div>
  );
}
