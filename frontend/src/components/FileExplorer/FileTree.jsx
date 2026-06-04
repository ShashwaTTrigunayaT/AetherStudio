import React, { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useWorkspace } from '../../stores/useWorkspace';
import {
  ChevronRight, ChevronDown,
  Plus, MoreHorizontal, RefreshCw,
} from 'lucide-react';
import {
  VscFile,
  VscJson,
  VscMarkdown,
  VscFileMedia,
  VscTerminal,
  VscFolder,
  VscFolderOpened,
} from 'react-icons/vsc';
import {
  SiJavascript,
  SiTypescript,
  SiReact,
  SiCplusplus,    // 1. Keep 'pp' lowercase! (Simple Icons handles 'plusplus' as one word)
  SiC,
  SiPython,
  SiGo,
  SiRust,
  SiRuby,
  SiPhp,
  SiSwift,
  SiKotlin,
  SiDart,
  SiDotnet,
  SiOpenjdk,
  SiHtml5,
  SiCss,          // 3. Just 'Css' (No 3)
  SiSass,
  SiTailwindcss,  // 4. Lowercase 'css' here
  SiVuedotjs,     // 5. Lowercase 'dotjs'
  SiSvelte,
  SiDocker,
  SiPrisma,
  SiGraphql,
  SiNodedotjs,    // 6. Lowercase 'dotjs'
  SiMongodb,
  SiRedis,
  SiPostgresql,
} from 'react-icons/si';
import CreateFileModal from './CreateFileModal';
import FileContextMenu from './FileContextMenu';
import RenameInput from './RenameInput';

// ── File type icons (VS Code Material Icon Theme-style) ──
const FILE_ICONS = {
  // JavaScript
  js:       { icon: SiJavascript, color: '#f7df1e' },
  mjs:      { icon: SiJavascript, color: '#f7df1e' },
  cjs:      { icon: SiJavascript, color: '#f7df1e' },
  // TypeScript
  ts:       { icon: SiTypescript, color: '#3178c6' },
  mts:      { icon: SiTypescript, color: '#3178c6' },
  tsx:      { icon: SiTypescript, color: '#3178c6' },
  // React
  jsx:      { icon: SiReact, color: '#61dafb' },
  // Web
  html:     { icon: SiHtml5, color: '#e34f26' },
  css:      { icon: SiCss, color: '#1572b6' },
  scss:     { icon: SiSass, color: '#c6538c' },
  sass:     { icon: SiSass, color: '#c6538c' },
  less:     { icon: SiCss, color: '#1d365d' },
  tailwind: { icon: SiTailwindcss, color: '#06b6d4' },
  // Config / Data
  json:     { icon: VscJson, color: '#b3935a' },
  yml:      { icon: VscJson, color: '#cb171e' },
  yaml:     { icon: VscJson, color: '#cb171e' },
  xml:      { icon: VscFile, color: '#f26522' },
  toml:     { icon: VscFile, color: '#9f9f9f' },
  env:      { icon: SiNodedotjs, color: '#7c8a9e' },
  // Node
  nvmrc:    { icon: SiNodedotjs, color: '#339933' },
  node:     { icon: SiNodedotjs, color: '#339933' },
  // Languages
  py:       { icon: SiPython, color: '#3776ab' },
  rb:       { icon: SiRuby, color: '#cc342d' },
  go:       { icon: SiGo, color: '#00add8' },
  rs:       { icon: SiRust, color: '#dea584' },
  java:     { icon: SiOpenjdk, color: '#b07219' },
  cpp:      { icon: SiCplusplus, color: '#00599c' },
  c:        { icon: SiC, color: '#00599c' },
  cs:       { icon: SiDotnet, color: '#178600' },
  php:      { icon: SiPhp, color: '#777bb4' },
  swift:    { icon: SiSwift, color: '#f05138' },
  kt:       { icon: SiKotlin, color: '#7f52ff' },
  dart:     { icon: SiDart, color: '#0175c2' },
  // Shell / Scripts
  sh:       { icon: VscTerminal, color: '#4d4d4d' },
  bash:     { icon: VscTerminal, color: '#4d4d4d' },
  zsh:      { icon: VscTerminal, color: '#4d4d4d' },
  bat:      { icon: VscTerminal, color: '#4d4d4d' },
  ps1:      { icon: VscTerminal, color: '#4d4d4d' },
  // SQL / DB
  sql:      { icon: SiPostgresql, color: '#336791' },
  prisma:   { icon: SiPrisma, color: '#2d3748' },
  // Docs
  md:       { icon: VscMarkdown, color: '#7c8a9e' },
  mdx:      { icon: VscMarkdown, color: '#7c8a9e' },
  txt:      { icon: VscFile, color: 'rgba(255,255,255,0.25)' },
  // Media
  svg:      { icon: VscFileMedia, color: '#ffb13b' },
  png:      { icon: VscFileMedia, color: '#4fc3f7' },
  jpg:      { icon: VscFileMedia, color: '#4fc3f7' },
  jpeg:     { icon: VscFileMedia, color: '#4fc3f7' },
  gif:      { icon: VscFileMedia, color: '#4fc3f7' },
  webp:     { icon: VscFileMedia, color: '#4fc3f7' },
  ico:      { icon: VscFileMedia, color: '#4fc3f7' },
  // Frameworks
  vue:      { icon: SiVuedotjs, color: '#42b883' },
  svelte:   { icon: SiSvelte, color: '#ff3e00' },
  // Config files (by full name)
  dockerfile: { icon: SiDocker, color: '#2496ed' },
  makefile: { icon: VscTerminal, color: '#e34f26' },
  // Git
  gitignore: { icon: VscFile, color: '#f05033' },
  gitmodules: { icon: VscFile, color: '#f05033' },
  // GraphQL
  graphql:  { icon: SiGraphql, color: '#e10098' },
  gql:      { icon: SiGraphql, color: '#e10098' },
  // DB config files
  mongodb:  { icon: SiMongodb, color: '#47A248' },
  redis:    { icon: SiRedis, color: '#DC382D' },
  postgres: { icon: SiPostgresql, color: '#336791' },
};

function FileIcon({ type, name }) {
  if (type === 'folder') return null;
  const ext = name?.split('.').pop()?.toLowerCase();
  const lowerName = name?.toLowerCase();
  const mapping = FILE_ICONS[lowerName] || FILE_ICONS[ext];
  const IconComponent = mapping?.icon || VscFile;
  const color = mapping?.color || 'rgba(255,255,255,0.2)';
  return <IconComponent size={14} style={{ color }} />;
}

// ── Folder Icons ──
function FolderIcon({ expanded }) {
  if (expanded) {
    return (
      <VscFolderOpened
        size={14}
        className="transition-all duration-200"
        style={{ color: 'rgba(255,255,255,0.3)' }}
      />
    );
  }
  return (
    <VscFolder
      size={14}
      className="transition-all duration-200"
      style={{ color: 'rgba(255,255,255,0.25)' }}
    />
  );
}

// ── Tree row variants ──
const rowVariants = {
  initial: { opacity: 0, x: -8 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 8 },
};

export default function FileExplorer({ workspace }) {
  const [expanded, setExpanded] = useState(new Set(['root']));
  const [contextMenu, setContextMenu] = useState(null);
  const [createModal, setCreateModal] = useState({ open: false, parentId: null });
  const [renamingId, setRenamingId] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [dragOverId, setDragOverId] = useState(null);
  const treeRef = useRef(null);
  const [newItemType, setNewItemType] = useState('file');
  const [hoveredNodeId, setHoveredNodeId] = useState(null);

  const { openFile, activeFile, createFile, deleteFile, renameFile, fetchWorkspace } = useWorkspace();

  const toggleFolder = useCallback((id) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  const handleContextMenu = useCallback((e, node) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ x: e.clientX, y: e.clientY, node });
  }, []);

  const handleContextAction = useCallback((action) => {
    const node = contextMenu?.node;
    setContextMenu(null);
    switch (action) {
      case 'new-file':
        setNewItemType('file');
        setCreateModal({ open: true, parentId: node?.id });
        break;
      case 'new-folder':
        setNewItemType('folder');
        setCreateModal({ open: true, parentId: node?.id });
        break;
      case 'rename':
        if (node) setRenamingId(node.id);
        break;
      case 'delete':
        if (node && window.confirm(`Delete "${node.name}"?`)) {
          deleteFile(node.id);
        }
        break;
    }
  }, [contextMenu, deleteFile]);

  const handleCreate = async (name, type, parentId) => {
    await createFile(name, type, parentId);
    if (parentId) {
      setExpanded((prev) => {
        const next = new Set(prev);
        next.add(parentId);
        return next;
      });
    }
  };

  const handleRenameSubmit = async (nodeId, newName) => {
    await renameFile(nodeId, newName);
    setRenamingId(null);
  };

  const isExpanded = (id) => expanded.has(id);

  const renderNode = (node, depth = 0, ancestors = []) => {
    if (!node) return null;
    const isFolder = node.type === 'folder';
    const nodeExpanded = isExpanded(node.id);
    const isActive = activeFile?.id === node.id;
    const isRenaming = renamingId === node.id;
    const isDragOver = dragOverId === node.id;
    const isHovered = hoveredNodeId === node.id;

    return (
      <motion.div
        key={node.id}
        variants={rowVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        transition={{ duration: 0.12, ease: [0.25, 0.1, 0.25, 1] }}
      >
        {/* ── Tree Row ── */}
        <div              className={`
            group relative flex items-center gap-1 py-[3px] pr-3 cursor-pointer
            select-none transition-all duration-100 ease-out
            hover:bg-white/[0.03] rounded-lg
            ${isActive
              ? 'text-[#f5f5f7]'
              : 'text-[rgba(255,255,255,0.35)] group-hover:text-[rgba(255,255,255,0.5)]'
            }
            ${isDragOver ? 'bg-[rgba(0, 113, 227, 0.06)]' : ''}
          `}
          style={{ paddingLeft: `${depth * 16 + 8}px` }}
          onClick={() => {
            if (isFolder) toggleFolder(node.id);
            else openFile(node);
          }}
          onContextMenu={(e) => handleContextMenu(e, node)}
          onMouseEnter={() => setHoveredNodeId(node.id)}
          onMouseLeave={() => setHoveredNodeId(null)}
          onDragOver={(e) => { e.preventDefault(); setDragOverId(node.id); }}
          onDragLeave={() => setDragOverId(null)}
        >
          {/* Active indicator — premium gradient bar */}
          {isActive && (
            <motion.div
              layoutId="activeFileIndicator"
              className="absolute left-0 top-0 bottom-0 w-[2px] rounded-r-full"
              style={{
                background: 'rgba(255,255,255,0.35)',
                boxShadow: '0 0 8px rgba(255,255,255,0.1)',
              }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            />
          )}

          {/* Indent guide lines — subtle cyan */}
          {ancestors.map((_, i) => (
            <div
              key={i}
              className="absolute w-px"
              style={{
                left: `${i * 16 + 8}px`,
                top: 0,
                bottom: 0,
                background: `linear-gradient(180deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.02) 100%)`,
              }}
            />
          ))}

          {/* Hovered indent guide highlight */}
          {ancestors.map((_, i) => (
            <div
              key={`hl-${i}`}
              className="absolute w-px transition-opacity duration-200"
              style={{
                left: `${i * 16 + 8}px`,
                top: 0,
                bottom: 0,
                background: 'rgba(255,255,255,0.06)',
                opacity: isHovered ? 1 : 0,
              }}
            />
          ))}

          {/* Background highlight — soft blue on active */}
          <div
            className={`
              absolute inset-0 rounded pointer-events-none transition-all duration-100
              ${isActive
                ? 'bg-[rgba(255,255,255,0.04)] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)]'
                : isDragOver
                  ? 'bg-[rgba(255,255,255,0.03)]'
                  : ''
              }
              ${!isActive && !isDragOver ? 'group-hover:bg-[rgba(255,255,255,0.02)]' : ''}
            `}
            style={{
              left: `${depth * 16 + 4}px`,
              right: '4px',
              top: '1px',
              bottom: '1px',
            }}
          />



          {/* Expand/Collapse Toggle */}
          <span className="relative z-10 w-4 h-4 flex items-center justify-center flex-shrink-0">
            {isFolder ? (
              <motion.span
                animate={{ rotate: nodeExpanded ? 0 : -90 }}
                transition={{ duration: 0.15, ease: [0.25, 0.1, 0.25, 1] }}
              >
                {nodeExpanded ? (
                  <ChevronDown
                    size={12}
                    className="text-[rgba(255,255,255,0.2)] group-hover:text-[rgba(255,255,255,0.4)] transition-colors"
                    strokeWidth={1.5}
                  />
                ) : (
                  <ChevronRight
                    size={12}
                    className="text-[rgba(255,255,255,0.15)] group-hover:text-[rgba(255,255,255,0.35)] transition-colors"
                    strokeWidth={1.5}
                  />
                )}
              </motion.span>
            ) : null}
          </span>

          {/* File/Folder Icon */}
          <motion.span
            className="relative z-10 flex-shrink-0 w-4 h-4 flex items-center justify-center"
            whileHover={{ scale: 1.15 }}
            transition={{ duration: 0.15 }}
          >
            {isFolder ? (
              <motion.span
                animate={{ scale: nodeExpanded ? 1 : 0.95 }}
                transition={{ duration: 0.2 }}
              >
                <FolderIcon expanded={nodeExpanded} />
              </motion.span>
            ) : (
              <FileIcon type={node.type} name={node.name} />
            )}
          </motion.span>

          {/* Name or Rename Input */}
          {isRenaming ? (
            <div className="relative z-10 flex-1">
              <RenameInput
                initialName={node.name}
                onSubmit={(newName) => handleRenameSubmit(node.id, newName)}
                onCancel={() => setRenamingId(null)}
              />
            </div>
          ) : (
            <span
              className={`
                relative z-10 truncate ml-1.5 leading-tight select-none
                transition-all duration-100 text-[13px] font-medium
                ${isActive
                  ? 'text-[#f5f5f7] font-semibold'
                  : ''
                }
              `}
            >
              {node.name}
            </span>
          )}

          {/* Hover Actions */}
          {isFolder && !isRenaming && (
            <span
              className="relative z-10 ml-auto flex-shrink-0 flex gap-px opacity-0 group-hover:opacity-100 transition-all duration-150"
              onClick={(e) => e.stopPropagation()}
            >
              <motion.button
                whileHover={{
                  scale: 1.1,
                  backgroundColor: 'rgba(255,255,255,0.05)',
                }}
                whileTap={{ scale: 0.9 }}
                onClick={() => {
                  setNewItemType('file');
                  setCreateModal({ open: true, parentId: node.id });
                }}
                className="p-0.5 rounded-sm transition-all"
                title="New file"
              >
                <Plus size={11} className="text-[rgba(255,255,255,0.25)] hover:text-[rgba(255,255,255,0.4)]" strokeWidth={2} />
              </motion.button>
            </span>
          )}
        </div>

        {/* ── Children ── */}
        {isFolder && nodeExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
            className="overflow-hidden"
          >
            {node.children?.length > 0 ? (
              <AnimatePresence mode="popLayout">
                {node.children.map((child) => renderNode(child, depth + 1, [...ancestors, node.id]))}
              </AnimatePresence>
            ) : (
              <div
                className="flex items-center gap-2 py-1 select-none"
                style={{ paddingLeft: `${(depth + 1) * 16 + 28}px` }}
              >
                <span className="w-px h-3 bg-[rgba(255,255,255,0.06)] flex-shrink-0" />
                <span className="text-[11px] italic text-[rgba(255,255,255,0.15)] select-none">
                  Empty folder
                </span>
              </div>
            )}
          </motion.div>
        )}
      </motion.div>
    );
  };

  if (!workspace?.fileTree) {
    return (
      <div className="flex flex-col h-full">
        <ExplorerHeader
          refreshing={refreshing}
          setRefreshing={setRefreshing}
          fetchWorkspace={fetchWorkspace}
          workspaceId={workspace?._id}
          setCreateModal={setCreateModal}
        />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center px-6">
            <VscFolder size={28} className="mx-auto mb-3 text-[rgba(255,255,255,0.06)]" />
            <p className="text-[12px] text-[rgba(255,255,255,0.2)] select-none">No files yet</p>
            <p className="text-[11px] text-[rgba(255,255,255,0.1)] mt-1 select-none">Create a new file to get started</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full relative" ref={treeRef}
      style={{
        background: 'rgba(14,14,18,0.7)',
        backdropFilter: 'blur(16px) saturate(1.4)',
        WebkitBackdropFilter: 'blur(16px) saturate(1.4)',
      }}>

      {/* ── Explorer Header ── */}
      <div className="relative z-10">
        <ExplorerHeader
          refreshing={refreshing}
          setRefreshing={setRefreshing}
          fetchWorkspace={fetchWorkspace}
          workspaceId={workspace._id}
          setCreateModal={setCreateModal}
        />
      </div>

      {/* ── File Tree ── */}
      <div
        className="flex-1 overflow-y-auto overflow-x-hidden py-1 relative z-20 scrollbar-glass"
        onContextMenu={(e) => e.preventDefault()}
      >
        <AnimatePresence>
          {renderNode(workspace.fileTree)}
        </AnimatePresence>
      </div>

      {/* ── Modals & Menu ── */}
      <AnimatePresence>
        {createModal.open && (
          <CreateFileModal
            isOpen={createModal.open}
            onClose={() => { setCreateModal({ open: false, parentId: null }); setNewItemType('file'); }}
            parentId={createModal.parentId}
            defaultType={newItemType}
            onCreate={handleCreate}
          />
        )}
      </AnimatePresence>

      {contextMenu && (
        <FileContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          node={contextMenu.node}
          onClose={() => setContextMenu(null)}
          onAction={handleContextAction}
        />
      )}
    </div>
  );
}

/* ── Explorer Header — Light Glass ── */
function ExplorerHeader({ refreshing, setRefreshing, fetchWorkspace, workspaceId, setCreateModal }) {
  return (
    <div className="flex-shrink-0 relative border-b border-white/[0.04]">
      {/* Main header bar */}
      <div className="flex items-center gap-2 px-3 py-[10px] select-none relative z-10">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {/* Label */}
          <span className="text-[10px] font-semibold uppercase tracking-[1.2px] text-[rgba(255,255,255,0.35)]">
            Explorer
          </span>

          {/* Separator dot */}
          <span className="text-[8px] text-[rgba(255,255,255,0.1)] font-mono">·</span>

          {/* Workspace ID */}
          <span className="text-[9px] text-[rgba(255,255,255,0.1)] truncate font-mono">
            {workspaceId?.slice(-6) || '------'}
          </span>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-0.5">
          <ToolbarButton
            onClick={async () => {
              if (refreshing) return;
              setRefreshing(true);
              try {
                await fetchWorkspace(workspaceId);
              } finally {
                setRefreshing(false);
              }
            }}
            disabled={refreshing}
            title="Refresh file tree"
          >
            <RefreshCw size={11} className={`${refreshing ? 'animate-spin text-[rgba(255,255,255,0.4)]' : ''}`} strokeWidth={1.5} />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => setCreateModal({ open: true, parentId: null })}
            title="New file/folder"
          >
            <Plus size={11} strokeWidth={1.5} />
          </ToolbarButton>
          <ToolbarButton title="More actions">
            <MoreHorizontal size={11} strokeWidth={1.5} />
          </ToolbarButton>
        </div>
      </div>
    </div>
  );
}

/* ── Small Toolbar Button — Light Glass ── */
function ToolbarButton({ children, onClick, disabled, title }) {
  return (
    <motion.button
      whileHover={{
        backgroundColor: 'rgba(255,255,255,0.04)',
      }}
      whileTap={{ scale: 0.9 }}
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`
        p-[5px] rounded-md relative
        text-[rgba(255,255,255,0.2)] hover:text-[rgba(255,255,255,0.4)]
        transition-all duration-100
        disabled:opacity-30 disabled:cursor-not-allowed disabled:active:scale-100
        focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[rgba(255,255,255,0.15)]
      `}
    >
      {children}
    </motion.button>
  );
}
