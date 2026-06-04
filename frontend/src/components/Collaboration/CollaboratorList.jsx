import React, { useEffect, useState, useCallback } from 'react';
import { Users, Wifi, Code2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { onAwarenessChange } from '../../lib/yjs-provider';

const STATUS_CONFIG = {
  online: { color: '#30d158', label: 'Online', pulse: true },
  away: { color: '#ffd60a', label: 'Away', pulse: true },
  idle: { color: 'rgba(255,255,255,0.15)', label: 'Idle', pulse: false },
};

function StatusDot({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.idle;
  return (
    <motion.span
      className="w-1.5 h-1.5 rounded-full inline-block flex-shrink-0"
      style={{
        backgroundColor: cfg.color,
        boxShadow: cfg.pulse ? `0 0 6px ${cfg.color}80, 0 0 12px ${cfg.color}30` : 'none',
      }}
      animate={cfg.pulse ? { opacity: [0.5, 1, 0.5] } : { opacity: 0.4 }}
      transition={cfg.pulse ? { duration: 2, repeat: Infinity, ease: 'easeInOut' } : {}}
    />
  );
}

function PeerRow({ peer, isLocal, index = 0, exit, isOwner }) {
  const name = peer.user?.name || 'Anonymous';
  const initial = name[0]?.toUpperCase() || '?';
  const cursorColor = peer.user?.color?.cursor || peer.color?.cursor || 'rgba(255,255,255,0.35)';
  const [imgError, setImgError] = useState(false);
  const showAvatar = peer.user?.avatar && !imgError;
  const status = peer.status || 'online';
  const statusCfg = STATUS_CONFIG[status] || STATUS_CONFIG.idle;

  const handleImgError = useCallback(() => setImgError(true), []);

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={exit || { opacity: 0, x: 10, transition: { duration: 0.15 } }}
      transition={{ delay: index * 0.03, type: 'spring', stiffness: 400, damping: 25 }}
      className="flex items-center gap-3 p-2.5 rounded-xl group cursor-pointer"
      style={{ backgroundColor: 'transparent' }}
      whileHover={{
        x: 4,
        backgroundColor: isLocal ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.04)',
        boxShadow: 'inset 0 0 20px rgba(255,255,255,0.04)',
      }}
    >
      {/* Avatar */}
      <div className="relative flex-shrink-0">
        {showAvatar ? (
          <img
            src={peer.user.avatar}
            alt={name}
            onError={handleImgError}
            className="w-9 h-9 rounded-xl object-cover"
            style={{
              boxShadow: `0 0 16px ${cursorColor}40, 0 0 32px ${cursorColor}15`,
              border: `1.5px solid ${cursorColor}40`,
              opacity: status === 'idle' ? 0.6 : 1,
              filter: status === 'idle' ? 'grayscale(0.5)' : 'none',
            }}
          />
        ) : (
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-semibold text-white relative"
            style={{
              background: `linear-gradient(135deg, ${cursorColor}, ${cursorColor}cc)`,
              boxShadow: `0 0 16px ${cursorColor}40`,
              opacity: status === 'idle' ? 0.5 : 1,
              filter: status === 'idle' ? 'saturate(0.4)' : 'none',
            }}
          >
            {initial}
          </div>
        )}
        {/* Status dot */}
        <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-white flex items-center justify-center">
          <div
            className="w-2.5 h-2.5 rounded-full"
            style={{
              backgroundColor: statusCfg.color,
              boxShadow: statusCfg.pulse
                ? `0 0 6px ${statusCfg.color}80, 0 0 12px ${statusCfg.color}30`
                : 'none',
            }}
          />
        </div>
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <p className="text-[13px] font-semibold text-[rgba(255,255,255,0.65)] truncate">
            {name}
          </p>
          {isOwner && (
            <span
              className="text-[9px] font-medium px-1.5 py-[1px] rounded-full flex-shrink-0"
              style={{
                background: 'rgba(255,255,255,0.12)',
                color: 'rgba(255,255,255,0.65)',
                border: '1px solid rgba(255,255,255,0.2)',
              }}
            >
              Owner
            </span>
          )}
          {isLocal && !isOwner && (
            <span
              className="text-[9px] font-medium px-1.5 py-[1px] rounded-full flex-shrink-0"
              style={{
                background: 'rgba(255,255,255,0.1)',
                color: 'rgba(255,255,255,0.6)',
                border: '1px solid rgba(255,255,255,0.15)',
              }}
            >
              You
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {peer.isTyping ? (
            <span className="flex items-center gap-1 text-[11px] font-medium" style={{ color: cursorColor }}>
              <motion.span
                animate={{ opacity: [0.4, 1, 0.4] }}
                transition={{ duration: 0.8, repeat: Infinity, ease: 'easeInOut' }}
              >
                Typing
              </motion.span>
              <motion.span
                animate={{ opacity: [0.2, 1, 0.2] }}
                transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut', delay: 0.2 }}
              >
                .
              </motion.span>
              <motion.span
                animate={{ opacity: [0.2, 1, 0.2] }}
                transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut', delay: 0.4 }}
              >
                .
              </motion.span>
              <motion.span
                animate={{ opacity: [0.2, 1, 0.2] }}
                transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut', delay: 0.6 }}
              >
                .
              </motion.span>
            </span>
          ) : (
            <>
              <span className="flex items-center gap-1 text-[11px] font-medium" style={{ color: statusCfg.color }}>
                <StatusDot status={status} />
                {statusCfg.label}
              </span>
              {peer.cursor ? (                  <span className="flex items-center gap-0.5 text-[10px] text-[rgba(255,255,255,0.3)]">
                  <Code2 size={10} />
                  <span>Ln {peer.cursor.lineNumber}, Col {peer.cursor.column}</span>
                </span>
              ) : null}
            </>
          )}
        </div>
      </div>

      {/* Color indicator dot */}
      <div
        className="w-2 h-2 rounded-full flex-shrink-0"
        style={{
          backgroundColor: cursorColor,
          boxShadow: `0 0 6px ${cursorColor}60`,
          opacity: status === 'idle' ? 0.3 : 1,
        }}
      />
    </motion.div>
  );
}

export default function CollaboratorList({ workspaceOwnerId }) {
  const [awareness, setAwareness] = useState({ localUser: null, peers: [] });

  useEffect(() => {
    const unsub = onAwarenessChange(setAwareness);
    return unsub;
  }, []);

  const { localUser, peers } = awareness;
  const activePeers = peers.filter((p) => p.user);

  // Determine if local user is workspace owner
  const localIsOwner = localUser?.userId && workspaceOwnerId
    ? localUser.userId === workspaceOwnerId
    : false;

  return (
    <div className="flex flex-col h-full relative">
      {/* Ambient gold line at top */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[60%] h-[1px] pointer-events-none z-10"
        style={{
          background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
          boxShadow: '0 0 30px rgba(255,255,255,0.15), 0 0 60px rgba(255,255,255,0.05)',
        }}
      />

      {/* Header */}
      <div className="flex-shrink-0 relative z-10">
        <div className="flex items-center gap-2 px-3 py-[10px] relative z-10">
          <div className="relative flex-shrink-0">
            <motion.div
              animate={{ scale: [1, 1.2, 1], opacity: [0.7, 1, 0.7] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              className="w-[5px] h-[5px] rounded-full"
              style={{ backgroundColor: 'rgba(255,255,255,0.35)' }}
            />
            <div
              className="absolute inset-0 blur-[6px] rounded-full"
              style={{ backgroundColor: 'rgba(255,255,255,0.35)', opacity: 0.9 }}
            />
            <div
              className="absolute -inset-[5px] rounded-full blur-[3px] opacity-60"
              style={{ border: '1.5px solid rgba(255,255,255,0.3)' }}
            />
          </div>

          <Users size={11} className="text-[rgba(255,255,255,0.3)]" />
          <span className="text-[10px] font-semibold uppercase tracking-[1.2px] text-[rgba(255,255,255,0.25)]">
            People
          </span>

          <span className="text-[8px] text-[rgba(255,255,255,0.2)] font-mono">◆</span>

          <span
            className="ml-auto text-[9px] font-mono px-1.5 py-[1px] rounded-full"
            style={{
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: 'rgba(255,255,255,0.4)',
            }}
          >
            {activePeers.length + (localUser ? 1 : 0)}
          </span>
        </div>

        <div className="mx-3 h-px relative overflow-hidden">
          <div
            className="absolute inset-0"
            style={{
              background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.12), transparent)',
            }}
          />
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-1 relative z-10">
        <AnimatePresence>
          {/* ── Local User (always shown first) ── */}
          {localUser && (
            <div key="local-user" className="mb-2">
              <PeerRow peer={{ user: localUser }} isLocal isOwner={localIsOwner} />
              {activePeers.length > 0 && (
                <div
                  className="mx-2 my-2 h-px"
                  style={{
                    background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent)',
                  }}
                />
              )}
            </div>
          )}

          {/* ── Remote Peers or Empty State ── */}
          {activePeers.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-8"
            >
              <div className="relative mx-auto mb-3 w-12 h-12 flex items-center justify-center">
                <div
                  className="absolute inset-0 rounded-2xl"
                  style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.06)',
                  }}
                />
                <Wifi size={20} className="text-[rgba(255,255,255,0.15)] relative" />
              </div>
              <p className="text-[13px] text-[rgba(255,255,255,0.25)] font-medium">
                No one else is here
              </p>
              <p className="text-[11px] text-[rgba(255,255,255,0.12)] mt-1">
                Share the workspace link to collaborate
              </p>
            </motion.div>
          ) : (
            activePeers.map((peer, idx) => (
              <PeerRow
                key={peer.socketId}
                peer={peer}
                isLocal={false}
                index={idx}
                isOwner={peer.user?.userId && workspaceOwnerId ? peer.user.userId === workspaceOwnerId : false}
              />
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
