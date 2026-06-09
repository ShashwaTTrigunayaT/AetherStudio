import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { LogOut, Share2, Settings, ChevronLeft, Code2, Github, MoreHorizontal, Copy, ExternalLink } from 'lucide-react';
import { useAuth } from '../../stores/useAuth';
import { useNavigate, Link } from 'react-router-dom';
import Badge from './Badge';
import Avatar from './Avatar';
import Dropdown, { DropdownItem } from './Dropdown';
import Breadcrumb from './Breadcrumb';
import { toast } from 'sonner';
import InviteModal from '../Collaboration/InviteModal';

export default function Header({ workspace, collaborators = [], onToggleSidebar, onToggleTerminal, onToggleRightPanel }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [inviteModalOpen, setInviteModalOpen] = useState(false);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success('Link copied to clipboard');
  };

  const breadcrumbItems = workspace
    ? [
        { label: 'Workspaces', href: '/dashboard' },
        { label: workspace.name || 'Workspace', icon: Code2 },
      ]
    : [];

  return (
    <motion.header
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
      className="h-[48px] bg-[rgba(22,22,24,0.9)] backdrop-blur-xl border-b border-[rgba(255,255,255,0.06)] flex items-center justify-between px-3 select-none flex-shrink-0"
    >
      {/* Left section */}
      <div className="flex items-center gap-2 min-w-0">
        {/* MacOS-style traffic light dots with hover animation */}
        <div className="hidden md:flex items-center gap-1.5 mr-1" aria-hidden="true">
          <motion.div whileHover={{ scale: 1.2, backgroundColor: '#ff453a' }} className="w-2.5 h-2.5 rounded-full bg-[rgba(255,255,255,0.08)] cursor-pointer" />
          <motion.div whileHover={{ scale: 1.2, backgroundColor: '#ffd60a' }} className="w-2.5 h-2.5 rounded-full bg-[rgba(255,255,255,0.08)] cursor-pointer" />
          <motion.div whileHover={{ scale: 1.2, backgroundColor: '#30d158' }} className="w-2.5 h-2.5 rounded-full bg-[rgba(255,255,255,0.08)] cursor-pointer" />
        </div>

        {/* Back */}
        <Link to="/dashboard" className="btn-ghost p-1.5">
          <ChevronLeft size={15} />
        </Link>

        {/* Breadcrumb */}
        <Breadcrumb items={breadcrumbItems} />

        {/* Collaboration status */}
        {collaborators.length > 0 && (
          <Badge variant="success" size="xs" dot pulse className="ml-2 hidden sm:inline-flex">
            {collaborators.length} online
          </Badge>
        )}
      </div>

      {/* Center - Collaborator avatars */}
      <div className="hidden md:flex items-center">
        {collaborators.length > 0 && (
          <div className="flex items-center">
            <div className="flex -space-x-2 mr-2">
              {collaborators.slice(0, 5).map((peer) => (
                <Avatar
                  key={peer.socketId}
                  name={peer.name}
                  size="xs"
                  status="online"
                  className="border-2 border-[rgba(22,22,24,0.9)]"
                />
              ))}
              {collaborators.length > 5 && (
                <div className="w-6 h-6 rounded-full bg-[rgba(255,255,255,0.08)] flex items-center justify-center text-[9px] font-medium text-[rgba(255,255,255,0.5)] border-2 border-[rgba(22,22,24,0.9)]">
                  +{collaborators.length - 5}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Right section */}
      <div className="flex items-center gap-0.5">
        <button onClick={() => setInviteModalOpen(true)} className="btn-ghost p-1.5" title="Share workspace">
          <Share2 size={15} />
        </button>
        <button
          onClick={() => navigate('/profile')}
          className="btn-ghost p-1.5"
          title="Settings"
        >
          <Settings size={15} />
        </button>
        <Dropdown
          trigger={
            <button className="btn-ghost p-1.5" title="More">
              <MoreHorizontal size={15} />
            </button>
          }
          align="right"
        >
          <DropdownItem icon={ExternalLink}>Open in new tab</DropdownItem>
          <DropdownItem icon={Copy} onClick={handleCopyLink}>Copy workspace link</DropdownItem>
          <DropdownItem divider />
          <DropdownItem
            icon={LogOut}
            danger
            onClick={() => { logout(); navigate('/login'); }}
          >
            Sign out
          </DropdownItem>
        </Dropdown>
        <div className="w-px h-4 bg-[rgba(255,255,255,0.06)] mx-1" />
        <Avatar name={user?.name} email={user?.email} size="xs" status="online" />
      </div>

      {/* Invite Modal */}
      <InviteModal
        isOpen={inviteModalOpen}
        onClose={() => setInviteModalOpen(false)}
        workspaceId={workspace?._id}
        isOwner={workspace?.ownerId === user?._id}
      />
    </motion.header>
  );
}
