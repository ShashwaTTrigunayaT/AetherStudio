import React from 'react';

function SkeletonBlock({ className = '', style = {} }) {
  return (
    <div
      className={`skeleton rounded-[8px] ${className}`}
      style={{ animation: 'skeleton 1.5s ease-in-out infinite', ...style }}
    />
  );
}

export function SkeletonText({ lines = 3, className = '' }) {
  const widths = ['100%', '85%', '60%', '90%', '75%', '50%'];
  return (
    <div className={`space-y-2.5 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <SkeletonBlock
          key={i}
          className="h-3"
          style={{ width: widths[i % widths.length] }}
        />
      ))}
    </div>
  );
}

export function SkeletonCard({ className = '' }) {
  return (
    <div
      className={`p-6 space-y-4 rounded-[14px] border ${className}`}
      style={{
        background: 'rgba(18,18,22,0.6)',
        borderColor: 'rgba(255,255,255,0.06)',
        boxShadow: '0 8px 40px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.03)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
      }}
    >
      <div className="flex items-center gap-3">
        <SkeletonBlock className="w-10 h-10 rounded-xl flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <SkeletonBlock className="h-4 w-3/4" />
          <SkeletonBlock className="h-3 w-1/2" />
        </div>
      </div>
      <SkeletonText lines={2} />
      <div className="flex gap-3 pt-2">
        <SkeletonBlock className="h-8 flex-1 rounded-lg" />
        <SkeletonBlock className="h-8 flex-1 rounded-lg" />
      </div>
    </div>
  );
}

export function SkeletonAvatar({ size = 'md' }) {
  const sizes = { xs: 'w-6 h-6', sm: 'w-8 h-8', md: 'w-10 h-10', lg: 'w-12 h-12', xl: 'w-16 h-16' };
  return <SkeletonBlock className={`${sizes[size]} rounded-xl flex-shrink-0`} />;
}

export function SkeletonTable({ rows = 5, cols = 4, className = '' }) {
  return (
    <div className={`space-y-3 ${className}`}>
      {/* Header */}
      <div className="flex gap-4 pb-2">
        {Array.from({ length: cols }).map((_, i) => (
          <SkeletonBlock key={i} className="h-3 flex-1" />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex gap-4 border-t border-[rgba(255,255,255,0.04)] pt-3">
          {Array.from({ length: cols }).map((_, c) => (
            <SkeletonBlock key={c} className={`h-3 ${c === 0 ? 'w-1/4' : 'flex-1'}`} />
          ))}
        </div>
      ))}
    </div>
  );
}

export function SkeletonPage() {
  return (
    <div className="p-8 space-y-8 max-w-5xl">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <SkeletonBlock className="h-7 w-48" />
          <SkeletonBlock className="h-4 w-32" />
        </div>
        <SkeletonBlock className="h-10 w-36 rounded-lg" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
      <SkeletonCard className="!p-0">
        <div className="p-6">
          <SkeletonTable rows={4} />
        </div>
      </SkeletonCard>
    </div>
  );
}

export default SkeletonBlock;
