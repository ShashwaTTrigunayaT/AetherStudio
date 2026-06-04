import { useRef, useCallback, useEffect } from 'react';

/**
 * useMouseGlow — Tracks mouse position relative to a container element and
 * updates CSS custom properties (`--mouse-x`, `--mouse-y`) so child elements
 * can follow the cursor with a radial-gradient spotlight effect.
 *
 * Usage:
 *   const glowRef = useMouseGlow();
 *   <div ref={glowRef} className="mouse-glow-container">
 *     <div className="mouse-spotlight" />
 *   </div>
 *
 * CSS companion (already in index.css):
 *   .mouse-spotlight::before {
 *     background: radial-gradient(
 *       600px circle at var(--mouse-x, 50%) var(--mouse-y, 50%),
 *       rgba(0, 240, 255, 0.03) 0%, transparent 60%
 *     );
 *     pointer-events: none;
 *   }
 */
export function useMouseGlow() {
  const ref = useRef(null);
  const handleMouseMove = useCallback((e) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    ref.current.style.setProperty('--mouse-x', `${x}%`);
    ref.current.style.setProperty('--mouse-y', `${y}%`);
  }, []);

  const handleMouseLeave = useCallback(() => {
    if (!ref.current) return;
    ref.current.style.setProperty('--mouse-x', '50%');
    ref.current.style.setProperty('--mouse-y', '50%');
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.addEventListener('mousemove', handleMouseMove);
    el.addEventListener('mouseleave', handleMouseLeave);
    return () => {
      el.removeEventListener('mousemove', handleMouseMove);
      el.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [handleMouseMove, handleMouseLeave]);

  return ref;
}

/**
 * MouseGlowSpotlight — renders a radial-gradient spotlight that follows the
 * mouse position. The parent must set `--mouse-x` and `--mouse-y` via useMouseGlow.
 */
export function MouseGlowSpotlight({ className = '', children, size = 500, color = 'rgba(0,240,255,0.04)' }) {
  return (
    <div className={`relative overflow-hidden ${className}`}>
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(${size}px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), ${color} 0%, transparent 60%)`,
          transition: 'background 0.08s ease-out',
        }}
      />
      {children}
    </div>
  );
}
