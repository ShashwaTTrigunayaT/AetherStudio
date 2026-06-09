import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { api } from '../lib/api';

export default function VerifyEmailPage() {
  const { token } = useParams();
  const [status, setStatus] = useState('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('Invalid verification link.');
      return;
    }

    api.get('/auth/verify-email-confirm/' + token)
      .then(({ data }) => {
        setStatus('success');
        setMessage(data.message);
      })
      .catch((err) => {
        setStatus('error');
        setMessage(err.response?.data?.error || 'Verification failed. The link may have expired.');
      });
  }, [token]);

  return (
    <div className="flex min-h-screen bg-[#000000] items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
        className="w-full max-w-[420px]"
      >
        <div
          className="rounded-[14px] border overflow-hidden text-center"
          style={{
            background: 'rgba(18,18,22,0.6)',
            borderColor: 'rgba(255,255,255,0.06)',
            boxShadow: '0 8px 40px rgba(0,0,0,0.35)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
          }}
        >
          <div className="p-10">
            {status === 'loading' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center gap-4"
              >
                <svg className="animate-spin" width="32" height="32" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="rgba(200,200,208,0.15)" strokeWidth="3" />
                  <path d="M12 2C6.477 2 2 6.477 2 12" stroke="rgba(200,200,208,0.6)" strokeWidth="3" strokeLinecap="round" />
                </svg>
                <p className="text-[14px]" style={{ color: 'rgba(255,255,255,0.4)' }}>
                  Verifying your email…
                </p>
              </motion.div>
            )}

            {status === 'success' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center gap-4"
              >
                <div
                  className="w-14 h-14 rounded-full flex items-center justify-center"
                  style={{ background: 'rgba(48,209,88,0.1)' }}
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path d="M20 6L9 17l-5-5" stroke="#30d158" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <h1 className="text-[20px] font-bold text-[#f5f5f7]">Email verified!</h1>
                <p className="text-[13px]" style={{ color: 'rgba(255,255,255,0.4)' }}>
                  {message}
                </p>
                <Link
                  to="/login"
                  className="mt-4 inline-flex items-center gap-2 px-6 py-2.5 rounded-[8px] text-[13px] font-semibold"
                  style={{
                    background: 'rgba(200,200,208,1)',
                    color: '#000',
                  }}
                >
                  Sign in to AetherStudio
                </Link>
              </motion.div>
            )}

            {status === 'error' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center gap-4"
              >
                <div
                  className="w-14 h-14 rounded-full flex items-center justify-center"
                  style={{ background: 'rgba(255,69,58,0.1)' }}
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="#ff453a" strokeWidth="2" />
                    <path d="M8 8L16 16M16 8L8 16" stroke="#ff453a" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </div>
                <h1 className="text-[20px] font-bold text-[#f5f5f7]">Verification failed</h1>
                <p className="text-[13px]" style={{ color: 'rgba(255,255,255,0.4)' }}>
                  {message}
                </p>
                <Link
                  to="/register"
                  className="mt-4 inline-flex items-center gap-2 px-6 py-2.5 rounded-[8px] text-[13px] font-semibold"
                  style={{
                    background: 'rgba(255,255,255,0.06)',
                    color: 'rgba(255,255,255,0.6)',
                    border: '1px solid rgba(255,255,255,0.08)',
                  }}
                >
                  Create a new account
                </Link>
              </motion.div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
