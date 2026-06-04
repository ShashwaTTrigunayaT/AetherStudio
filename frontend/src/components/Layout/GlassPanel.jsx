import React from 'react';

export default function GlassPanel({ children, className = '', style = {}, ...props }) {
  return (
    <div
      className={`relative ${className}`}
      style={{
        background: 'rgba(20,20,26,0.85)',
        backdropFilter: 'blur(20px) saturate(1.5)',
        WebkitBackdropFilter: 'blur(20px) saturate(1.5)',
        borderRight: '1px solid rgba(255,255,255,0.06)',
        borderLeft: '1px solid rgba(255,255,255,0.06)',
        ...style,
      }}
      {...props}
    >
      {children}
    </div>
  );
}
