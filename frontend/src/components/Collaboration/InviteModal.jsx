import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Copy, RefreshCw, Users, Trash2, Check, Link as LinkIcon } from 'lucide-react';
import { api } from '../../lib/api';
import { useAuth } from '../../stores/useAuth';
import { toast } from 'sonner';

export default function InviteModal({ isOpen, onClose, workspaceId, isOwner }) {
  const { user } = useAuth();
  const [inviteToken, setInviteToken] = useState(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [workspaceCollaborators, setWorkspaceCollaborators] = useState([]);
  const [removingId, setRemovingId] = useState(null);

  const inviteUrl = inviteToken
    ? window.location.origin + '/invite/' + inviteToken
    : null;

  // Fetch existing invite token on open
  useEffect(() => {
    if (!isOpen || !workspaceId) return;
    // We need to fetch the workspace to check if it has an inviteToken
    (async () => {
      try {
        const res = await api.get('/workspace/' + workspaceId);
        const ws = res.data;
        setInviteToken(ws.inviteToken || null);
        // Fetch collaborator details
        if (ws.collaboratorIds?.length > 0) {
          try {
            const userRes = await api.get('/users/batch', { params: { ids: ws.collaboratorIds.join(',') } });
            setWorkspaceCollaborators(userRes.data.users || []);
          } catch {
            setWorkspaceCollaborators([]);
          }
        } else {
          setWorkspaceCollaborators([]);
        }
      } catch (err) {
        console.error('Failed to fetch workspace:', err);
      }
    })();
  }, [isOpen, workspaceId]);

  const handleGenerateLink = async () => {
    setLoading(true);
    try {
      const res = await api.post('/workspace/' + workspaceId + '/invite');
      setInviteToken(res.data.token);
      toast.success('Invite link generated!');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to generate invite link');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = async () => {
    if (!inviteUrl) return;
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      toast.success('Link copied!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy');
    }
  };

  const handleRemoveCollaborator = async (userId) => {
    setRemovingId(userId);
    try {
      await api.delete('/workspace/' + workspaceId + '/collaborators/' + userId);
      setWorkspaceCollaborators((prev) => prev.filter((c) => c._id !== userId));
      toast.success('Collaborator removed');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to remove');
    } finally {
      setRemovingId(null);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-[rgba(0,0,0,0.6)] backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 20 }}
            transition={{ duration: 0.25, ease: [0.34, 1.56, 0.64, 1] }}
            className="relative w-full max-w-md rounded-2xl overflow-hidden"
            style={{
              background: 'rgba(22,22,24,0.95)',
              backdropFilter: 'blur(40px)',
              WebkitBackdropFilter: 'blur(40px)',
              border: '1px solid rgba(255,255,255,0.06)',
              boxShadow: '0 24px 80px rgba(0,0,0,0.5)',
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-5 pb-3 border-b border-[rgba(255,255,255,0.06)]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#4a9eff]/20 to-[#7cb8ff]/10 flex items-center justify-center">
                  <LinkIcon size={14} className="text-[#4a9eff]" />
                </div>
                <div>
                  <h2 className="text-[15px] font-semibold text-[#f5f5f7]">Share Workspace</h2>
                  <p className="text-[11px] text-[rgba(255,255,255,0.35)]">Invite collaborators to edit</p>
                </div>
              </div>
              <button onClick={onClose} className="btn-ghost p-1.5 hover:bg-[rgba(255,255,255,0.08)] rounded-lg">
                <X size={16} className="text-[rgba(255,255,255,0.4)]" />
              </button>
            </div>

            <div className="p-5 space-y-5">
              {/* Invite link section */}
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-[0.8px] text-[rgba(255,255,255,0.3)] mb-2">
                  Invite Link
                </label>

                {inviteToken ? (
                  <>
                    <div
                      className="flex items-center gap-2 p-2.5 rounded-xl cursor-pointer group"
                      style={{
                        background: 'rgba(255,255,255,0.04)',
                        border: '1px solid rgba(255,255,255,0.06)',
                      }}
                      onClick={handleCopyLink}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-[12px] font-mono text-[rgba(255,255,255,0.5)] truncate">
                          {inviteUrl}
                        </p>
                      </div>
                      <motion.button
                        onClick={(e) => { e.stopPropagation(); handleCopyLink(); }}
                        className="p-2 rounded-lg flex-shrink-0"
                        style={{
                          background: copied ? 'rgba(48,209,88,0.15)' : 'rgba(255,255,255,0.06)',
                        }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        {copied ? (
                          <Check size={14} className="text-[#30d158]" />
                        ) : (
                          <Copy size={14} className="text-[rgba(255,255,255,0.4)]" />
                        )}
                      </motion.button>
                    </div>

                    <button
                      onClick={handleGenerateLink}
                      disabled={loading}
                      className="mt-2 flex items-center gap-1.5 text-[11px] text-[rgba(255,255,255,0.3)] hover:text-[rgba(255,255,255,0.5)] transition-colors"
                    >
                      <RefreshCw size={11} />
                      Generate new link
                    </button>
                  </>
                ) : (
                  <motion.button
                    onClick={handleGenerateLink}
                    disabled={loading}
                    className="w-full py-2.5 rounded-xl font-medium text-[13px] flex items-center justify-center gap-2"
                    style={{
                      background: 'linear-gradient(135deg, #4a9eff 0%, #7cb8ff 100%)',
                      color: '#fff',
                      boxShadow: '0 4px 20px rgba(74,158,255,0.3)',
                    }}
                    whileHover={{ scale: 1.02, boxShadow: '0 6px 28px rgba(74,158,255,0.4)' }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <LinkIcon size={14} />
                    {loading ? 'Generating…' : 'Generate Invite Link'}
                  </motion.button>
                )}
              </div>

              {/* Collaborators section */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-[11px] font-semibold uppercase tracking-[0.8px] text-[rgba(255,255,255,0.3)]">
                    Collaborators
                  </label>
                  <span className="text-[10px] font-mono px-1.5 py-[1px] rounded-full"
                    style={{
                      background: 'rgba(255,255,255,0.05)',
                      color: 'rgba(255,255,255,0.3)',
                    }}
                  >
                    {workspaceCollaborators.length + 1}
                  </span>
                </div>

                <div className="space-y-1 max-h-[200px] overflow-y-auto">
                  {/* Owner (current user) */}
                  <div className="flex items-center gap-2.5 p-2.5 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)' }}>
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#ffd60a]/30 to-[#ffd60a]/10 flex items-center justify-center text-[10px] font-semibold text-[#ffd60a]">
                      {user?.name?.[0]?.toUpperCase() || '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="text-[13px] font-medium text-[rgba(255,255,255,0.7)] truncate">
                          {user?.name || 'You'}
                        </p>
                        <span className="text-[9px] font-medium px-1.5 py-[1px] rounded-full"
                          style={{
                            background: 'rgba(255,215,10,0.15)',
                            color: '#ffd60a',
                            border: '1px solid rgba(255,215,10,0.2)',
                          }}
                        >
                          Owner
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Collaborators */}
                  {workspaceCollaborators.length === 0 ? (
                    <div className="text-center py-6">
                      <Users size={18} className="mx-auto text-[rgba(255,255,255,0.1)] mb-2" />
                      <p className="text-[12px] text-[rgba(255,255,255,0.25)]">
                        No collaborators yet
                      </p>
                      <p className="text-[11px] text-[rgba(255,255,255,0.15)] mt-0.5">
                        Share the invite link to add people
                      </p>
                    </div>
                  ) : (
                    workspaceCollaborators.map((col) => (
                      <div
                        key={col._id}
                        className="flex items-center gap-2.5 p-2.5 rounded-xl group"
                        style={{ background: 'rgba(255,255,255,0.02)' }}
                      >
                        <div className="w-7 h-7 rounded-full bg-[rgba(255,255,255,0.06)] flex items-center justify-center text-[10px] font-medium text-[rgba(255,255,255,0.5)]">
                          {col.name?.[0]?.toUpperCase() || '?'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] font-medium text-[rgba(255,255,255,0.6)] truncate">
                            {col.name || 'Unknown'}
                          </p>
                          {col.email && (
                            <p className="text-[11px] text-[rgba(255,255,255,0.25)] truncate">{col.email}</p>
                          )}
                        </div>
                        {isOwner && (
                          <motion.button
                            onClick={() => handleRemoveCollaborator(col._id)}
                            disabled={removingId === col._id}
                            className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                            style={{ background: 'rgba(255,69,58,0.1)' }}
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                          >
                            <Trash2 size={12} className="text-[#ff453a]" />
                          </motion.button>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
