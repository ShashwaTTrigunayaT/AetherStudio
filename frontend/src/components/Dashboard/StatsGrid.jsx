import React from 'react';
import { motion } from 'framer-motion';
import ImageStatusCard from './ImageStatusCard';

// ─── Grid ──────────────────────────────────────────────────
export default function StatsGrid({ stats = [] }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3"
    >
      {stats.map((stat, idx) => (
        <ImageStatusCard key={stat.label} stat={stat} index={idx} />
      ))}
    </motion.div>
  );
}
