import React from 'react';
import { motion } from 'framer-motion';

const snippets = [
  { text: 'import React from "react"', color: '#dedee4' },
  { text: 'const App = () => {}', color: '#ff9f0a' },
  { text: 'npm run dev', color: '#30d158' },
  { text: 'git push origin main', color: '#c8c8d0' },
  { text: 'docker compose up', color: '#b0b0bc' },
  { text: 'console.log("hello")', color: '#dcccb5' },
  { text: 'export default App', color: '#ff9f0a' },
  { text: 'yarn add react', color: '#30d158' },
];

export default function CodeParticles() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 0 }}>
      {snippets.map((s, i) => (
        <motion.div
          key={i}
          className="absolute select-none font-mono font-medium tracking-tight whitespace-nowrap"
          initial={{ x: (5 + (i * 12) % 85) + 'vw', y: '110vh', opacity: 0 }}
          animate={{
            y: '-20vh',
            opacity: [0, 0.08, 0.12, 0.06, 0],
            x: [
              (5 + (i * 12) % 85) + 'vw',
              (5 + (i * 12) % 85 + (i % 2 === 0 ? -3 : 3)) + 'vw',
            ],
          }}
          transition={{
            duration: 25 + (i % 4) * 5,
            delay: (i % 6) * 3.5,
            repeat: Infinity,
            ease: 'linear',
            times: [0, 0.08, 0.3, 0.6, 1],
          }}
        >
          <span style={{
            fontSize: (8 + (i % 3) * 2) + 'px',
            color: s.color,
            opacity: 0.4,
          }}>
            <span style={{ opacity: 0.15 }}>$</span> {s.text}
          </span>
        </motion.div>
      ))}
    </div>
  );
}
