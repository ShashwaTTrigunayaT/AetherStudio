import React from 'react';
import { motion } from 'framer-motion';
import { Clock, FileEdit, Plus, UserPlus, GitCommit, Trash2 } from 'lucide-react';

const activityIcons = {
  create: { icon: Plus, color: 'text-[#30d158]', bg: 'bg-[rgba(48,209,88,0.1)]' },
  edit: { icon: FileEdit, color: 'text-[#dedee4]', bg: 'bg-[rgba(200,200,208,0.1)]' },
  join: { icon: UserPlus, color: 'text-[#b0b0bc]', bg: 'bg-[rgba(176,176,188,0.1)]' },
  commit: { icon: GitCommit, color: 'text-[#ffd60a]', bg: 'bg-[rgba(255,214,10,0.1)]' },
  delete: { icon: Trash2, color: 'text-[#ff453a]', bg: 'bg-[rgba(255,69,58,0.1)]' },
};

export default function RecentActivity({ activities = [] }) {
  if (activities.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="w-12 h-12 rounded-2xl bg-[rgba(255,255,255,0.03)] flex items-center justify-center mx-auto mb-3">
          <Clock size={20} className="text-[rgba(255,255,255,0.2)]" />
        </div>
        <p className="text-[13px] text-[rgba(255,255,255,0.3)] font-medium">No recent activity</p>
        <p className="text-[11px] text-[rgba(255,255,255,0.2)] mt-1">Activity from your workspaces will appear here</p>
      </div>
    );
  }

  const getRelativeTime = (date) => {
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="space-y-1">
      {activities.map((activity, idx) => {
        const type = activityIcons[activity.type] || activityIcons.edit;
        const Icon = type.icon;
        return (
          <motion.div
            key={activity.id || idx}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.03, type: 'spring', stiffness: 400, damping: 25 }}
            whileHover={{ x: 4, backgroundColor: 'rgba(255,255,255,0.04)' }}
            className="flex items-center gap-3 p-3 rounded-xl transition-colors group"
          >
            <div className={`w-8 h-8 rounded-lg ${type.bg} flex items-center justify-center flex-shrink-0`}>
              <Icon size={14} className={type.color} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] text-[rgba(255,255,255,0.65)] truncate">
                {activity.message}
              </p>
              <p className="text-[11px] text-[rgba(255,255,255,0.25)] mt-0.5">
                {activity.workspace && `${activity.workspace} · `}{getRelativeTime(activity.timestamp)}
              </p>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
