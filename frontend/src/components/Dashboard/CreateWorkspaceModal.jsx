import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Loader2, Layout, ChevronRight, X } from 'lucide-react';
import Modal from '../Common/Modal';
import Tabs from '../Common/Tabs';
import TemplateGrid from './TemplateGrid';

export default function CreateWorkspaceModal({ isOpen, onClose, onCreate, creating }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [tab, setTab] = useState('blank');
  const [selectedTemplate, setSelectedTemplate] = useState(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    onCreate(name.trim(), description.trim(), selectedTemplate);
  };

  const handleTemplateSelect = (template) => {
    setSelectedTemplate(template);
    setName(`${template} Workspace`);
  };

  const tabs = [
    { label: 'Blank', value: 'blank' },
    { label: 'From Template', value: 'template' },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => { onClose(); setName(''); setDescription(''); setSelectedTemplate(null); }}
      title="Create Workspace"
      description="Start a new collaborative coding environment"
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Workspace Name */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
        >
          <label className="label-apple">Workspace Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., My Project"
            className="input-apple"
            autoFocus
            required
          />
        </motion.div>

        {/* Description */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
        >
          <label className="label-apple">Description (optional)</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What's this workspace about?"
            className="input-apple resize-none min-h-[80px]"
            rows={3}
          />
        </motion.div>

        {/* Template Selection */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.11 }}
        >
          <label className="label-apple">Start from a template</label>
          <Tabs tabs={tabs} activeTab={tab} onChange={setTab} variant="pills" className="mb-3" />
          {tab === 'template' && (
            <TemplateGrid onSelect={handleTemplateSelect} />
          )}
          {tab === 'blank' && (
            <div className="flex items-center gap-3 p-4 rounded-xl bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.06)]">
              <div className="w-10 h-10 rounded-xl bg-[rgba(200,200,208,0.1)] flex items-center justify-center">
                <Layout size={18} className="text-[#dedee4]" />
              </div>
              <div>
                <p className="text-[13px] font-semibold text-[#f5f5f7]">Start from scratch</p>
                <p className="text-[11px] text-[rgba(255,255,255,0.35)]">Empty workspace — add your own files</p>
              </div>
            </div>
          )}
        </motion.div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="btn-apple-secondary"
          >
            Cancel
          </button>
          <motion.button
            type="submit"
            disabled={creating || !name.trim()}
            className="btn-apple gap-2"
            whileHover={!creating ? { scale: 1.02 } : {}}
            whileTap={!creating ? { scale: 0.98 } : {}}
          >
            {creating ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Layout size={16} />
            )}
            {creating ? 'Creating…' : 'Create Workspace'}
          </motion.button>
        </div>
      </form>
    </Modal>
  );
}
