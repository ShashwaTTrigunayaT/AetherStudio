import React from 'react';
import { motion } from 'framer-motion';
import {
  FileCode, Globe, Server, Smartphone, Database, Terminal, Cpu, Layers,
} from 'lucide-react';

const templates = [
  { name: 'React App', icon: FileCode, description: 'Modern React with Vite', color: 'text-[#61dafb]', bg: 'bg-[rgba(97,218,251,0.1)]' },
  { name: 'Node.js API', icon: Server, description: 'Express REST API', color: 'text-[#30d158]', bg: 'bg-[rgba(48,209,88,0.1)]' },
  { name: 'Python Script', icon: Terminal, description: 'Python 3 project', color: 'text-[#ffd60a]', bg: 'bg-[rgba(255,214,10,0.1)]' },
  { name: 'HTML/CSS', icon: Globe, description: 'Static website', color: 'text-[#ff7b72]', bg: 'bg-[rgba(255,123,114,0.1)]' },
  { name: 'Database', icon: Database, description: 'SQL schema + queries', color: 'text-[#b0b0bc]', bg: 'bg-[rgba(176,176,188,0.1)]' },
  { name: 'Mobile App', icon: Smartphone, description: 'React Native starter', color: 'text-[#bf5af2]', bg: 'bg-[rgba(191,90,242,0.1)]' },
  { name: 'Rust CLI', icon: Cpu, description: 'CLI application', color: 'text-[#dea584]', bg: 'bg-[rgba(222,165,132,0.1)]' },
  { name: 'Microservices', icon: Layers, description: 'Docker compose setup', color: 'text-[#dedee4]', bg: 'bg-[rgba(200,200,208,0.1)]' },
];

export default function TemplateGrid({ onSelect }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
      {templates.map((template, idx) => (
        <motion.button
          key={template.name}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: idx * 0.03, type: 'spring', stiffness: 400, damping: 25 }}
          whileHover={{ y: -4, scale: 1.02, borderColor: 'rgba(0, 113, 227, 0.3)', backgroundColor: 'rgba(0, 113, 227, 0.06)' }}
          whileTap={{ scale: 0.97 }}
          onClick={() => onSelect?.(template.name)}
          className="flex flex-col items-center gap-2.5 p-4 rounded-xl bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.06)] transition-all text-center"
        >
          <div className={`w-10 h-10 rounded-xl ${template.bg} flex items-center justify-center`}>
            <template.icon size={18} className={template.color} />
          </div>
          <div>
            <p className="text-[12px] font-semibold text-[#f5f5f7]">{template.name}</p>
            <p className="text-[10px] text-[rgba(255,255,255,0.35)] mt-0.5">{template.description}</p>
          </div>
        </motion.button>
      ))}
    </div>
  );
}
