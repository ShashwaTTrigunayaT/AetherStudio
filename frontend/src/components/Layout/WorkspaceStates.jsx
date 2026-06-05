import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import NebulaBackground from './NebulaBackground';

export function LoadingState({ mounted }) {
  return (
    <div className="h-screen w-screen bg-[#000000] flex items-center justify-center relative overflow-hidden">
      <NebulaBackground />
      <div className="text-center relative z-10">
        <motion.div
          animate={{ scale: [1, 1.05, 1], opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          className="w-14 h-14 rounded-2xl mx-auto mb-5 relative"
          style={{
            background: 'linear-gradient(135deg, #c8c8d0, #dedee4)',
            boxShadow: '0 0 30px rgba(200,200,208,0.3), 0 0 60px rgba(200,200,208,0.1)',
          }}
        >
          <Loader2 size={28} className="animate-spin text-white absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
        </motion.div>
        <p className="text-[rgba(255,255,255,0.3)] text-sm font-medium tracking-wide">
          Loading workspace...
        </p>
      </div>
    </div>
  );
}

export function ErrorState({ error, onRetry, onDashboard }) {
  return (
    <div className="h-screen w-screen bg-[#000000] flex flex-col items-center justify-center px-6 relative overflow-hidden">
      <NebulaBackground />
      <div className="relative z-10 text-center max-w-sm">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15 }}
          className="w-14 h-14 rounded-2xl mx-auto mb-5 flex items-center justify-center relative"
          style={{
            background: 'rgba(248,113,113,0.1)',
            border: '1px solid rgba(248,113,113,0.15)',
          }}
        >
          <motion.div
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          >
            <AlertCircle size={24} className="text-[#f87171]" />
          </motion.div>
        </motion.div>
        <motion.h2
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-xl font-semibold text-[#f5f5f7] mb-2"
        >
          Could not load workspace
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="text-[rgba(255,255,255,0.3)] text-sm mb-6"
        >
          {error || 'Unable to fetch workspace data.'}
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex gap-3 justify-center"
        >
          <button onClick={onRetry} className="btn-apple gap-2">
            <RefreshCw size={16} /> Retry
          </button>
          <button onClick={onDashboard} className="btn-apple-secondary gap-2">
            Dashboard
          </button>
        </motion.div>
      </div>
    </div>
  );
}
