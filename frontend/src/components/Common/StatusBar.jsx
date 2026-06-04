import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Bell, X } from 'lucide-react';
import { onAwarenessChange } from '../../lib/yjs-provider';

export default function StatusBar({
  left = [],
  right = [],
  className = '',
}) {
  const [peerCount, setPeerCount] = useState(0);
  const [peers, setPeers] = useState([]);
  const [localUser, setLocalUser] = useState(null);

  useEffect(() => {
    const unsub = onAwarenessChange((state) => {
      setPeerCount(state.peers.length);
      setPeers(state.peers);
      setLocalUser(state.localUser);
    });
    return unsub;
  }, []);

  return (
    <div
      className={`h-[22px] flex items-center select-none text-[12px] flex-shrink-0 relative ${className}`}
      style={{
        background: 'rgba(14,14,18,0.85)',
        backdropFilter: 'blur(16px) saturate(1.4)',
        WebkitBackdropFilter: 'blur(16px) saturate(1.4)',
        borderTop: '1px solid rgba(255,255,255,0.04)',
        color: 'rgba(255,255,255,0.35)',
        boxShadow: [
          '0 -2px 4px rgba(0,0,0,0.15)',
          '0 -8px 16px rgba(0,0,0,0.1)',
          'inset 0 1px 0 rgba(255,255,255,0.03)',
        ].join(','),
      }}
    >
      {/* Left section */}
      <div className="flex items-center h-full">
        {left.map((item, idx) => (
          <StatusBarItem key={`l-${idx}`} {...item} />
        ))}
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Right section */}
      <div className="flex items-center h-full">
        {/* Avatar group — local user + peers */}
        {localUser && (
          <div className="flex items-center px-2 h-full" style={{ borderRight: '1px solid rgba(255,255,255,0.03)' }}>
            {/* Local user avatar */}
            <div
              className="relative flex items-center justify-center"
              title={`${localUser.name || 'You'} (you)`}
            >
              {localUser.avatar ? (
                <img
                  src={localUser.avatar}
                  alt={localUser.name}
                  className="w-[16px] h-[16px] rounded-full object-cover"
                  style={{
                    border: '1.5px solid rgba(255,255,255,0.3)',
                    boxShadow: '0 0 4px rgba(255,255,255,0.08)',
                  }}
                />
              ) : (
                <div
                  className="w-[16px] h-[16px] rounded-full flex items-center justify-center"
                  style={{
                    background: 'rgba(255,255,255,0.15)',
                    fontSize: '7px',
                    fontWeight: 700,
                    color: '#fff',
                    border: '1.5px solid rgba(255,255,255,0.3)',
                  }}
                >
                  {(localUser.name || 'U').charAt(0).toUpperCase()}
                </div>
              )}
              {/* Online dot */}
              <span
                className="absolute -bottom-[1px] -right-[1px] w-[5px] h-[5px] rounded-full"
                style={{
                  backgroundColor: '#30d158',
                  boxShadow: '0 0 4px rgba(48,209,88,0.5)',
                  border: '1px solid rgba(14,14,18,0.95)',
                }}
              />
            </div>

            {/* Peer avatars */}
            {peers.slice(0, 5).map((peer, idx) => (
              <div
                key={peer.socketId || idx}
                className="relative flex items-center justify-center"
                title={`${peer.user?.name || 'Anonymous'} - ${peer.status || 'online'}`}
                style={{ marginLeft: '-5px' }}
              >
                {peer.user?.avatar ? (
                  <img
                    src={peer.user.avatar}
                    alt={peer.user.name}
                    className="w-[16px] h-[16px] rounded-full object-cover"
                    style={{
                      border: '1.5px solid rgba(14,14,18,0.95)',
                    }}
                  />
                ) : (
                  <div
                    className="w-[16px] h-[16px] rounded-full flex items-center justify-center"
                    style={{
                      background: peer.color?.cursor || 'rgba(255,255,255,0.15)',
                      fontSize: '7px',
                      fontWeight: 700,
                      color: '#fff',
                      border: '1.5px solid rgba(14,14,18,0.95)',
                    }}
                  >
                    {(peer.user?.name || '?').charAt(0).toUpperCase()}
                  </div>
                )}
                {peer.status === 'online' && (
                  <span
                    className="absolute -bottom-[1px] -right-[1px] w-[5px] h-[5px] rounded-full"
                    style={{
                      backgroundColor: '#30d158',
                      boxShadow: '0 0 4px rgba(48,209,88,0.5)',
                      border: '1px solid rgba(14,14,18,0.95)',
                    }}
                  />
                )}
              </div>
            ))}
            {peers.length > 5 && (
              <span
                className="text-[10px] font-medium ml-0.5"
                style={{ color: 'rgba(255,255,255,0.25)' }}
              >
                +{peers.length - 5}
              </span>
            )}
          </div>
        )}

        {right.map((item, idx) => (
          <StatusBarItem key={`r-${idx}`} {...item} />
        ))}
      </div>
    </div>
  );
}

function StatusBarItem({
  icon: Icon,
  label,
  onClick,
  active = true,
  dot,
  dotColor,
  className = '',
}) {
  return (
    <button
      onClick={onClick}
      className={`
        flex items-center gap-1 px-2 h-full transition-all duration-100 whitespace-nowrap text-[11px] leading-none font-medium
        ${onClick ? 'cursor-pointer' : 'cursor-default'}
        ${className}
      `}
      style={{
        color: active ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.15)',
        borderRight: '1px solid rgba(255,255,255,0.03)',
      }}
      onMouseEnter={(e) => {
        if (onClick) {
          e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
          e.currentTarget.style.color = 'rgba(255,255,255,0.6)';
        }
      }}
      onMouseLeave={(e) => {
        if (onClick) {
          e.currentTarget.style.background = 'transparent';
          e.currentTarget.style.color = active ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.15)';
        }
      }}
    >
      {dot && (
        <span
          className="w-[6px] h-[6px] rounded-full flex-shrink-0"
          style={{
            backgroundColor: dotColor || 'rgba(255,255,255,0.1)',
            boxShadow: dotColor ? `0 0 6px ${dotColor}40` : 'none',
          }}
        />
      )}
      {Icon && <Icon size={11} className="flex-shrink-0" style={{ opacity: 0.6 }} />}
      {label && <span className="truncate max-w-[180px]">{label}</span>}
    </button>
  );
}
