import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../stores/useAuth';
import { Loader2, ArrowLeft, Code2 } from 'lucide-react';
import { motion } from 'framer-motion';
import Workspace from '../components/Layout/Workspace';

export default function WorkspacePage() {
  const { id } = useParams();
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login');
    }
  }, [user, loading, navigate]);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-[#000000] flex items-center justify-center">
        <div className="text-center">
          <Loader2 size={28} className="animate-spin text-[rgba(255,255,255,0.3)] mx-auto mb-4" />
          <p className="text-[rgba(255,255,255,0.4)] text-sm">Loading…</p>
        </div>
      </div>
    );
  }

  // Not authenticated
  if (!user) {
    return null;
  }

  // Invalid workspace ID
  if (!id) {
    return (
      <div className="min-h-screen bg-[#000000] flex flex-col items-center justify-center px-6">
        <div className="fixed inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[40%] h-[40%] bg-gradient-to-br from-[#ff453a]/3 to-transparent rounded-full blur-[100px]" />
        </div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative text-center"
        >
          <h1 className="text-2xl font-bold text-[#f5f5f7] mb-2">Invalid Workspace</h1>
          <p className="text-[rgba(255,255,255,0.4)] text-sm mb-8">
            No workspace ID provided.
          </p>
          <motion.button
            onClick={() => navigate('/dashboard')}
            className="btn-apple gap-2"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <ArrowLeft size={16} />
            Back to Dashboard
          </motion.button>
        </motion.div>
      </div>
    );
  }

  return <Workspace />;
}
