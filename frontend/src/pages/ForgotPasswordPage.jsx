import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../stores/useAuth';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Mail, ArrowLeft, CheckCircle2, Eye, EyeOff } from 'lucide-react';
import AuthBrandPanel from '../components/Common/AuthBrandPanel';
import FormInput from '../components/Common/FormInput';
import { validateEmail } from '../lib/api';

// ─── Code Digit Input ───────────────────────────────────────
function CodeInput({ value, onChange, error }) {
  const inputs = useRef([]);

  useEffect(() => {
    if (inputs.current[0]) inputs.current[0].focus();
  }, []);

  const digits = value.split('').concat(Array(6 - value.length).fill(''));

  const handleChange = (index, char) => {
    if (!/^\d*$/.test(char)) return;
    const newDigits = [...digits];
    newDigits[index] = char.slice(-1);
    onChange(newDigits.join('').slice(0, 6));
    if (char && index < 5 && inputs.current[index + 1]) inputs.current[index + 1].focus();
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) inputs.current[index - 1].focus();
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted) onChange(pasted);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-center gap-2">
        {[0, 1, 2, 3, 4, 5].map(i => (
          <input
            key={i}
            ref={el => inputs.current[i] = el}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={digits[i] || ''}
            onChange={e => handleChange(i, e.target.value)}
            onKeyDown={e => handleKeyDown(i, e)}
            onPaste={i === 0 ? handlePaste : undefined}
            className="w-[42px] h-[48px] text-center text-lg font-semibold rounded-[8px] transition-all outline-none"
            style={{
              background: digits[i] ? 'rgba(200,200,208,0.06)' : 'rgba(255,255,255,0.02)',
              border: error
                ? '1px solid rgba(255,69,58,0.3)'
                : digits[i]
                  ? '1px solid rgba(200,200,208,0.2)'
                  : '1px solid rgba(255,255,255,0.06)',
              color: '#f5f5f7',
            }}
          />
        ))}
      </div>
      {error && (
        <p className="text-[11px] text-center font-medium text-[#ff453a]">{error}</p>
      )}
    </div>
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

// ─── Password Strength ──────────────────────────────────────
function PasswordStrength({ password }) {
  if (!password) return null;
  const checks = [
    { label: '8+ chars', met: password.length >= 8 },
    { label: 'Number', met: /\d/.test(password) },
    { label: 'Letter', met: /[a-zA-Z]/.test(password) },
    { label: 'Special', met: /[!@#$%^&*(),.?":{}|<>]/.test(password) },
  ];
  const strength = checks.filter(c => c.met).length;
  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className="mt-2 space-y-1.5 overflow-hidden"
    >
      <div className="flex gap-1">
        {[0, 1, 2, 3].map(i => (
          <div key={i} className="h-[2px] flex-1 rounded-full transition-all duration-300"
            style={{
              background: i <= strength - 1
                ? ['#ff453a', '#ff9f0a', '#c8c8d0', '#30d158'][Math.max(strength - 1, 0)]
                : 'rgba(255,255,255,0.04)',
            }}
          />
        ))}
      </div>
    </motion.div>
  );
}

// ─── MAIN ────────────────────────────────────────────────────
export default function ForgotPasswordPage() {
  const { forgotPassword, resetPassword, loading, error, clearError } = useAuth();
  const navigate = useNavigate();

  const location = useLocation();
  const [email, setEmail] = useState(location.state?.email || '');
  const [mxStatus, setMxStatus] = useState({ loading: false, valid: null, error: null });
  const [step, setStep] = useState('email');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [codeError, setCodeError] = useState('');

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
    ? 'Enter a valid email'
    : isEmailValid && mxStatus.valid === false
      ? mxStatus.error
      : null;
  const passwordsMatch = password === confirmPassword;
  const isPasswordValid = password.length >= 8;

  const handleSendCode = async (e) => {
    e.preventDefault();
    if (!isEmailValid) return;
    try {
      await forgotPassword(email);
      setStep('reset');
    } catch { /* handled */ }
  };

  const handleReset = async (e) => {
    e.preventDefault();
    if (!/^\d{6}$/.test(code) || !isPasswordValid || !passwordsMatch) return;
    setCodeError('');
    clearError();
    try {
      await resetPassword(email, code, password);
      setSubmitted(true);
    } catch (err) {
      const s = typeof err === 'string' ? err : String(err);
      if (s.toLowerCase().includes('code') || s.toLowerCase().includes('verif')) setCodeError(s);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#000000]">
      {/* ── Left Brand Panel ── */}
      <AuthBrandPanel
        tagline="Secure recovery, seamless access."
        description="Reset your password in a few simple steps. We'll send a verification code to your email."
        featurePills={[
          { label: 'Secure', color: '#30d158' },
          { label: 'Fast', color: '#c8c8d0' },
          { label: 'Reliable', color: '#b0b0bc' },
        ]}
      />

      {/* ── Right Form Side ── */}
      <div className="flex-1 flex items-center justify-center p-6 md:p-8 lg:p-12 relative overflow-hidden">
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
              Reset password
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.18, duration: 0.4 }}
              className="text-[13px] mt-1.5"
              style={{ color: 'rgba(255,255,255,0.3)' }}
            >
              {step === 'email' ? "We'll send you a verification code" : 'Enter the code and new password'}
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
              {/* Error */}
              <AnimatePresence mode="wait">
                {error && (
                  <div className="mb-4">
                    <ErrorAlert message={error} />
                  </div>
                )}
              </AnimatePresence>

              <AnimatePresence mode="wait">
                {step === 'email' && !submitted && (
                  <motion.div
                    key="email"
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 6 }}
                    transition={{ duration: 0.2 }}
                  >
                    <form onSubmit={handleSendCode} className="space-y-4">
                      <FormInput
                        id="forgot-email"
                        type="email"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        label="Email address"
                        autoComplete="email"
                        autoFocus
                        valid={isEmailValid && mxStatus.valid === true}
                        error={emailError}
                      />

                      <motion.button
                        type="submit"
                        disabled={!isEmailValid || loading}
                        className="w-full py-[10px] rounded-[8px] text-[13px] font-semibold transition-all duration-200 select-none"
                        style={{
                          background: isEmailValid && !loading ? 'rgba(200,200,208,1)' : 'rgba(255,255,255,0.04)',
                          color: isEmailValid && !loading ? '#fff' : 'rgba(255,255,255,0.15)',
                          cursor: isEmailValid && !loading ? 'pointer' : 'not-allowed',
                        }}
                        whileHover={isEmailValid && !loading ? { background: 'rgba(200,200,208,0.9)' } : {}}
                        whileTap={isEmailValid && !loading ? { scale: 0.98 } : {}}
                      >
                        {loading ? (
                          <span className="flex items-center justify-center gap-2">
                            <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none">
                              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.25" />
                              <path d="M12 2C6.477 2 2 6.477 2 12" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                            </svg>
                            Sending…
                          </span>
                        ) : (
                          <span className="flex items-center justify-center gap-1.5">
                            Send Code <ArrowRight size={14} />
                          </span>
                        )}
                      </motion.button>
                    </form>

                    <div className="mt-4 text-center">
                      <Link
                        to="/login"
                        className="text-[11px] font-medium transition-colors"
                        style={{ color: 'rgba(255,255,255,0.2)' }}
                        onMouseEnter={e => e.currentTarget.style.color = 'rgba(255,255,255,0.4)'}
                        onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.2)'}
                      >
                        <span className="flex items-center justify-center gap-1">
                          <ArrowLeft size={11} /> Back to sign in
                        </span>
                      </Link>
                    </div>
                  </motion.div>
                )}

                {step === 'reset' && !submitted && (
                  <motion.div
                    key="reset"
                    initial={{ opacity: 0, x: 6 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -6 }}
                    transition={{ duration: 0.2 }}
                  >
                    {/* Email pill */}
                    <div className="flex items-center gap-2 mb-4">
                      <div
                        className="flex items-center gap-1.5 px-2.5 py-1 rounded-[6px] text-[11px]"
                        style={{ background: 'rgba(200,200,208,0.06)', color: 'rgba(200,200,208,0.6)' }}
                      >
                        <Mail size={10} />
                        <span className="truncate max-w-[200px]">{email}</span>
                        <button
                          type="button"
                          onClick={() => setStep('email')}
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

                    <form onSubmit={handleReset} className="space-y-5">
                      <div>
                        <p className="text-[11px] font-medium mb-2" style={{ color: 'rgba(255,255,255,0.35)' }}>
                          Verification code
                        </p>
                        <CodeInput
                          value={code}
                          onChange={c => { setCode(c); setCodeError(''); clearError(); }}
                          error={codeError}
                        />
                      </div>

                      <div className="space-y-4">
                        <FormInput
                          id="reset-password"
                          type={showPassword ? 'text' : 'password'}
                          value={password}
                          onChange={e => setPassword(e.target.value)}
                          label="New password"
                          autoComplete="new-password"
                          valid={isPasswordValid}
                          error={password.length > 0 && !isPasswordValid ? 'Must be 8+ characters' : null}
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

                        <FormInput
                          id="reset-confirm"
                          type={showConfirm ? 'text' : 'password'}
                          value={confirmPassword}
                          onChange={e => setConfirmPassword(e.target.value)}
                          label="Confirm password"
                          autoComplete="new-password"
                          valid={confirmPassword.length === 0 || passwordsMatch}
                          error={confirmPassword.length > 0 && !passwordsMatch ? 'Passwords do not match' : null}
                        >
                          <button
                            type="button"
                            onClick={() => setShowConfirm(!showConfirm)}
                            className="p-0.5 transition-colors"
                            style={{ color: 'rgba(255,255,255,0.15)' }}
                            onMouseEnter={e => e.currentTarget.style.color = 'rgba(255,255,255,0.35)'}
                            onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.15)'}
                            tabIndex={-1}
                          >
                            {showConfirm ? <EyeOff size={14} /> : <Eye size={14} />}
                          </button>
                        </FormInput>
                      </div>

                      <motion.button
                        type="submit"
                        disabled={!/^\d{6}$/.test(code) || !isPasswordValid || !passwordsMatch || loading}
                        className="w-full py-[10px] rounded-[8px] text-[13px] font-semibold transition-all duration-200 select-none"
                        style={{
                          background: /^\d{6}$/.test(code) && isPasswordValid && passwordsMatch && !loading
                            ? 'rgba(200,200,208,1)' : 'rgba(255,255,255,0.04)',
                          color: /^\d{6}$/.test(code) && isPasswordValid && passwordsMatch && !loading
                            ? '#fff' : 'rgba(255,255,255,0.15)',
                          cursor: /^\d{6}$/.test(code) && isPasswordValid && passwordsMatch && !loading
                            ? 'pointer' : 'not-allowed',
                        }}
                        whileHover={/^\d{6}$/.test(code) && isPasswordValid && passwordsMatch && !loading ? { background: 'rgba(200,200,208,0.9)' } : {}}
                        whileTap={/^\d{6}$/.test(code) && isPasswordValid && passwordsMatch && !loading ? { scale: 0.98 } : {}}
                      >
                        {loading ? (
                          <span className="flex items-center justify-center gap-2">
                            <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none">
                              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.25" />
                              <path d="M12 2C6.477 2 2 6.477 2 12" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                            </svg>
                            Resetting…
                          </span>
                        ) : (
                          <span className="flex items-center justify-center gap-1.5">
                            Reset Password <ArrowRight size={14} />
                          </span>
                        )}
                      </motion.button>
                    </form>
                  </motion.div>
                )}

                {submitted && (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, scale: 0.97 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3 }}
                    className="text-center py-2"
                  >
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                      className="w-12 h-12 rounded-full mx-auto mb-4 flex items-center justify-center"
                      style={{ background: 'rgba(48,209,88,0.06)', border: '1px solid rgba(48,209,88,0.1)' }}
                    >
                      <CheckCircle2 size={24} className="text-[#30d158]" />
                    </motion.div>
                    <h2 className="text-[17px] font-semibold text-[#f5f5f7] mb-1">Password reset</h2>
                    <p className="text-[12px] mb-5" style={{ color: 'rgba(255,255,255,0.3)' }}>
                      Your password has been updated successfully.
                    </p>
                    <motion.button
                      type="button"
                      onClick={() => navigate('/login')}
                      className="w-full py-[10px] rounded-[8px] text-[13px] font-semibold text-white transition-all"
                      style={{ background: 'rgba(200,200,208,1)' }}
                      whileHover={{ background: 'rgba(200,200,208,0.9)' }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <span className="flex items-center justify-center gap-1.5">
                        Sign In <ArrowRight size={14} />
                      </span>
                    </motion.button>
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
            Remember your password?{' '}
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
