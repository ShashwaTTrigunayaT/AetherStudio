import React, { useCallback } from 'react';
import { motion, useMotionValue, useTransform } from 'framer-motion';

export function useMouseGlow() {
  const mouseX = useMotionValue(0.5);
  const mouseY = useMotionValue(0.5);
  const glowRef = React.useRef(null);

  const handleMouseMove = useCallback((e) => {
    const rect = glowRef.current?.getBoundingClientRect();
    if (!rect) return;
    mouseX.set((e.clientX - rect.left) / rect.width);
    mouseY.set((e.clientY - rect.top) / rect.height);
  }, [mouseX, mouseY]);

  const glowX = useTransform(mouseX, [0, 1], [-300, 300]);
  const glowY = useTransform(mouseY, [0, 1], [-300, 300]);

  return { glowRef, glowX, glowY, handleMouseMove };
}

export default function MouseGlow({ glowX, glowY }) {
  return (
    <motion.div
      className="fixed pointer-events-none rounded-full"
      style={{
        width: 600,
        height: 600,
        x: glowX,
        y: glowY,
        background: 'radial-gradient(circle, rgba(200,200,208,0.02), transparent)',
        filter: 'blur(100px)',
        left: '50%',
        top: '50%',
        transform: 'translate(-50%, -50%)',
      }}
    />
  );
}
