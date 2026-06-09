import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../stores/useAuth';
import { api } from '../lib/api';
import { toast } from 'sonner';
import { Users, Code2, ArrowRight, Loader2, Check, LogIn } from 'lucide-react';

const STATUS_MAP = {
  loading: { label: 'Checking invite…', icon: Loader2, spin: true },
  not_found: { label: 'Invite not found', icon: null, spin: false },
  owner: { label: 'You own this workspace', icon: Check, spin: false },
  collaborator: { label: 'You are already a member', icon: Check, spin: false },
  ready: { label: 'Join this workspace', icon: ArrowRight, spin: false },
};

export default function InvitePage() {
  const { token } = useParams();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  const [status, setStatus] = useState('loading');
  const [data, setData] = useState(null);
  const [accepting, setAccepting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate('/login', { state: { redirect: '/invite/' + token } });
      return;
    }

    (async () => {
      try {
        const res = await api.get('/invite/' + token);
        const d = res.data;
        setData(d);
        if (d.isOwner) {
          setStatus('owner');
        } else if (d.isCollaborator) {
          setStatus('collaborator');
        } else {
          setStatus('ready');
        }
      } catch (err) {
        setStatus('not_found');
        setError(err.response?.data?.error || 'Could not load invite');
      }
    })();
  }, [token, user, authLoading, navigate]);

  const handleAccept = async () => {
    setAccepting(true);
    try {
      const res = await api.post('/invite/' + token + '/accept');
      const { workspaceId } = res.data;
      toast.success('Joined workspace!');
      navigate('/workspace/' + workspaceId);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to join workspace');
      setAccepting(false);
    }
  };

  const handleGoToWorkspace = () => {
    if (data?.workspace?._id) {
      navigate('/workspace/' + data.workspace._id);
    }
  };

  const currentStatus = STATUS_MAP[status];
  const Icon = currentStatus?.icon;

  return (
    <div className="min-h-screen bg-[#000000] flex items-center justify-center p-6 relative overflow-hidden">
      {/* Ambient glow */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60%] h-[60%] bg-gradient-to-br from-[#4a9eff]/5 to-transparent rounded-full blur-[120px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
        className="relative w-full max-w-md"
      >
        {/* Card */}
        <div
          className="rounded-2xl overflow-hidden"
          style={{
            background: 'rgba(22,22,24,0.85)',
            backdropFilter: 'blur(40px)',
            WebkitBackdropFilter: 'blur(40px)',
            border: '1px solid rgba(255,255,255,0.06)',
            boxShadow: '0 24px 80px rgba(0,0,0,0.5)',
          }}
        >
          {/* Header */}
          <div className="p-8 pb-6 text-center">
            {status === 'loading' ? (
              <>
                <div className="w-16 h-16 rounded-2xl bg-[rgba(255,255,255,0.04)] flex items-center justify-center mx-auto mb-4">
                  <Loader2 size={28} className="animate-spin text-[rgba(255,255,255,0.3)]" />
                </div>
                <h1 className="text-xl font-semibold text-[#f5f5f7]">Checking invite…</h1>
              </>
            ) : status === 'not_found' ? (
              <>
                <div className="w-16 h-16 rounded-2xl bg-[rgba(255,69,58,0.1)] flex items-center justify-center mx-auto mb-4">
                  <LogIn size={28} className="text-[#ff453a]" />
                </div>
                <h1 className="text-xl font-semibold text-[#f5f5f7]">Invite not found</h1>
                <p className="text-[13px] text-[rgba(255,255,255,0.4)] mt-2">
                  {error || 'This invite link is invalid or has expired.'}
                </p>
              </>
            ) : (
              <>
                {/* Workspace icon */}
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#4a9eff]/20 to-[#7cb8ff]/10 flex items-center justify-center mx-auto mb-4">
                  <Code2 size={28} className="text-[#4a9eff]" />
                </div>

                <h1 className="text-xl font-semibold text-[#f5f5f7]">
                  {data?.workspace?.name || 'Workspace'}
                </h1>

                {data?.workspace?.description && (
                  <p className="text-[13px] text-[rgba(255,255,255,0.4)] mt-2">
                    {data.workspace.description}
                  </p>
                )}

                {/* Owner info */}
                {data?.owner && (
                  <div className="flex items-center justify-center gap-2 mt-4">
                    <div className="w-6 h-6 rounded-full bg-[rgba(255,255,255,0.08)] flex items-center justify-center text-[10px] font-medium text-[rgba(255,255,255,0.5)]">
                      {data.owner.name?.[0]?.toUpperCase() || '?'}
                    </div>
                    <span className="text-[12px] text-[rgba(255,255,255,0.35)]">
                      Created by <span className="text-[rgba(255,255,255,0.5)]">{data.owner.name}</span>
                    </span>
                  </div>
                )}

                {/* Collaborator count */}
                <div className="flex items-center justify-center gap-1.5 mt-3">
                  <Users size={12} className="text-[rgba(255,255,255,0.25)]" />
                  <span className="text-[11px] text-[rgba(255,255,255,0.3)]">
                    {data?.collaboratorCount || 0} collaborator{(data?.collaboratorCount || 0) !== 1 ? 's' : ''}
                  </span>
                </div>
              </>
            )}
          </div>

          {/* Divider */}
          <div className="mx-8 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent)' }} />

          {/* Footer */}
          <div className="p-6 pt-5">
            {status === 'ready' && (
              <motion.button
                onClick={handleAccept}
                disabled={accepting}
                className="w-full py-2.5 rounded-xl font-medium text-[14px] relative overflow-hidden group"
                style={{
                  background: 'linear-gradient(135deg, #4a9eff 0%, #7cb8ff 100%)',
                  color: '#fff',
                  boxShadow: '0 4px 20px rgba(74,158,255,0.3)',
                }}
                whileHover={{ scale: 1.02, boxShadow: '0 6px 28px rgba(74,158,255,0.4)' }}
                whileTap={{ scale: 0.98 }}
              >
                {accepting ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 size={16} className="animate-spin" />
                    Joining…
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <ArrowRight size={16} />
                    Accept Invite
                  </span>
                )}
              </motion.button>
            )}

            {(status === 'owner' || status === 'collaborator') && (
              <motion.button
                onClick={handleGoToWorkspace}
                className="w-full py-2.5 rounded-xl font-medium text-[14px]"
                style={{
                  background: 'rgba(255,255,255,0.06)',
                  color: '#f5f5f7',
                  border: '1px solid rgba(255,255,255,0.1)',
                }}
                whileHover={{ background: 'rgba(255,255,255,0.1)' }}
                whileTap={{ scale: 0.98 }}
              >
                <span className="flex items-center justify-center gap-2">
                  <ArrowRight size={16} />
                  Go to workspace
                </span>
              </motion.button>
            )}

            {status === 'not_found' && (
              <Link to="/dashboard">
                <motion.button
                  className="w-full py-2.5 rounded-xl font-medium text-[14px]"
                  style={{
                    background: 'rgba(255,255,255,0.06)',
                    color: '#f5f5f7',
                    border: '1px solid rgba(255,255,255,0.1)',
                  }}
                  whileHover={{ background: 'rgba(255,255,255,0.1)' }}
                  whileTap={{ scale: 0.98 }}
                >
                  Back to Dashboard
                </motion.button>
              </Link>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
