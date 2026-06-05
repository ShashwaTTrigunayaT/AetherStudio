import React from 'react';
import { motion } from 'framer-motion';

const orbs = [
  { x: '5%', y: '-5%', w: 500, h: 500, blur: 100, color: 'rgba(200,200,208,0.08)', duration: 14, delay: 0 },
  { x: '75%', y: '10%', w: 400, h: 400, blur: 90, color: 'rgba(222,222,228,0.05)', duration: 18, delay: 3 },
  { x: '-10%', y: '60%', w: 450, h: 450, blur: 95, color: 'rgba(176,176,188,0.06)', duration: 16, delay: 5 },
  { x: '60%', y: '70%', w: 600, h: 600, blur: 120, color: 'rgba(200,200,208,0.04)', duration: 20, delay: 7 },
  { x: '30%', y: '40%', w: 350, h: 350, blur: 80, color: 'rgba(222,222,228,0.03)', duration: 12, delay: 2 },
];

export default function NebulaBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" style={{ zIndex: 0 }}>
      {orbs.map((orb, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            width: orb.w, height: orb.h,
            left: orb.x, top: orb.y,
            background: `radial-gradient(circle, ${orb.color} 0%, transparent 60%)`,
            filter: `blur(${orb.blur}px)`,
          }}
          animate={{
            scale: [1, 1.08, 0.95, 1.03, 1],
            x: [0, 30, -20, 15, 0],
            y: [0, -20, 25, -10, 0],
          }}
          transition={{
            duration: orb.duration,
            delay: orb.delay,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      ))}
      <div
        className="absolute inset-0"
        style={{
          opacity: 0.012,
          backgroundImage: [
            'linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px)',
            'linear-gradient(90deg, rgba(255,255,255,0.06) 1px, transparent 1px)',
          ].join(','),
          backgroundSize: '60px 60px',
        }}
      />
    </div>
  );
}
