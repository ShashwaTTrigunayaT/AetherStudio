import { useState, useRef, useEffect } from 'react';

export default function AnimatedCounter({ value, suffix = '', prefix = '', duration = 2 }) {
  const [display, setDisplay] = useState('0');
  const ref = useRef(null);
  const [isInView, setIsInView] = useState(false);
  const prevValue = useRef(0);
  const rafRef = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setIsInView(true); observer.disconnect(); } },
      { threshold: 0.3 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isInView) return;
    const numeric = typeof value === 'number' ? value : 0;
    const start = prevValue.current;
    const end = numeric;
    const startTime = performance.now();
    const dur = duration || 1.5;
    const animate = (now) => {
      const elapsed = (now - startTime) / (dur * 1000);
      const progress = Math.min(elapsed, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.floor(start + (end - start) * eased);
      setDisplay(current.toLocaleString());
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      } else {
        prevValue.current = end;
      }
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, [isInView, value, duration]);

  return <span ref={ref}>{prefix}{display}{suffix}</span>;
}
