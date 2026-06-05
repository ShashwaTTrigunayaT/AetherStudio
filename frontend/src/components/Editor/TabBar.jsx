import React, { useRef, useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import { useWorkspace } from '../../stores/useWorkspace';
import TabContextMenu from './TabContextMenu';
import {
  VscFile,
  VscJson,
  VscMarkdown,
  VscFileMedia,
  VscTerminal,
} from 'react-icons/vsc';
import {
  SiJavascript,
  SiTypescript,
  SiReact,
  SiCplusplus,
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
  SiCss,
  SiSass,
  SiTailwindcss,
  SiVuedotjs,
  SiSvelte,
  SiDocker,
  SiPrisma,
  SiGraphql,
  SiNodedotjs,
  SiMongodb,
  SiRedis,
  SiPostgresql,
} from 'react-icons/si';

// ── File type icons (same as FileTree) ──
const FILE_ICONS = {
  js:       { icon: SiJavascript, color: '#f7df1e' },
  mjs:      { icon: SiJavascript, color: '#f7df1e' },
  cjs:      { icon: SiJavascript, color: '#f7df1e' },
  ts:       { icon: SiTypescript, color: '#3178c6' },
  mts:      { icon: SiTypescript, color: '#3178c6' },
  tsx:      { icon: SiTypescript, color: '#3178c6' },
  jsx:      { icon: SiReact, color: '#61dafb' },
  html:     { icon: SiHtml5, color: '#e34f26' },
  css:      { icon: SiCss, color: '#1572b6' },
  scss:     { icon: SiSass, color: '#c6538c' },
  sass:     { icon: SiSass, color: '#c6538c' },
  less:     { icon: SiCss, color: '#1d365d' },
  tailwind: { icon: SiTailwindcss, color: '#06b6d4' },
  json:     { icon: VscJson, color: '#b3935a' },
  yml:      { icon: VscJson, color: '#cb171e' },
  yaml:     { icon: VscJson, color: '#cb171e' },
  xml:      { icon: VscFile, color: '#f26522' },
  toml:     { icon: VscFile, color: '#9f9f9f' },
  env:      { icon: SiNodedotjs, color: '#7c8a9e' },
  nvmrc:    { icon: SiNodedotjs, color: '#339933' },
  node:     { icon: SiNodedotjs, color: '#339933' },
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
  sh:       { icon: VscTerminal, color: '#4d4d4d' },
  bash:     { icon: VscTerminal, color: '#4d4d4d' },
  zsh:      { icon: VscTerminal, color: '#4d4d4d' },
  bat:      { icon: VscTerminal, color: '#4d4d4d' },
  ps1:      { icon: VscTerminal, color: '#4d4d4d' },
  sql:      { icon: SiPostgresql, color: '#336791' },
  prisma:   { icon: SiPrisma, color: '#2d3748' },
  md:       { icon: VscMarkdown, color: '#7c8a9e' },
  mdx:      { icon: VscMarkdown, color: '#7c8a9e' },
  txt:      { icon: VscFile, color: 'rgba(255,255,255,0.25)' },
  svg:      { icon: VscFileMedia, color: '#ffb13b' },
  png:      { icon: VscFileMedia, color: '#4fc3f7' },
  jpg:      { icon: VscFileMedia, color: '#4fc3f7' },
  jpeg:     { icon: VscFileMedia, color: '#4fc3f7' },
  gif:      { icon: VscFileMedia, color: '#4fc3f7' },
  webp:     { icon: VscFileMedia, color: '#4fc3f7' },
  ico:      { icon: VscFileMedia, color: '#4fc3f7' },
  vue:      { icon: SiVuedotjs, color: '#42b883' },
  svelte:   { icon: SiSvelte, color: '#ff3e00' },
  dockerfile: { icon: SiDocker, color: '#2496ed' },
  makefile: { icon: VscTerminal, color: '#e34f26' },
  gitignore: { icon: VscFile, color: '#f05033' },
  gitmodules: { icon: VscFile, color: '#f05033' },
  graphql:  { icon: SiGraphql, color: '#e10098' },
  gql:      { icon: SiGraphql, color: '#e10098' },
  mongodb:  { icon: SiMongodb, color: '#47A248' },
  redis:    { icon: SiRedis, color: '#DC382D' },
  postgres: { icon: SiPostgresql, color: '#336791' },
};

function FileIcon({ name }) {
  const ext = name?.split('.').pop()?.toLowerCase();
  const lowerName = name?.toLowerCase();
  const mapping = FILE_ICONS[lowerName] || FILE_ICONS[ext];
  const IconComponent = mapping?.icon || VscFile;
  const color = mapping?.color || 'rgba(255,255,255,0.2)';
  return <IconComponent size={13} style={{ color }} />;
}

export default function TabBar({ groupId }) {
  const {
    getGroupById, activeGroupId, setActiveGroup, setActiveTab, closeTab,
    closeAllTabs, closeOtherTabs, closeTabsToTheRight,
    reorderTabs, splitEditor, moveTabToGroup, dirtyFiles,
  } = useWorkspace();

  const group = getGroupById(groupId);
  const { openTabs, activeTabId } = group || {};
  const isActive = groupId === activeGroupId;

  // ── All hooks moved BEFORE early return ──
  const scrollRef = useRef(null);
  const activeTabRef = useRef(null);
  const [contextMenu, setContextMenu] = useState(null);
  const [contextTabId, setContextTabId] = useState(null);
  const [dragOverGroup, setDragOverGroup] = useState(null);

  // Auto-scroll active tab into view
  useEffect(() => {
    if (activeTabRef.current) {
      activeTabRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
    }
  }, [activeTabId]);

  // ── Drag & Drop handlers ──
  const tabRefsMap = useRef({});

  const handleDragStart = useCallback((e, tabId, index) => {
    e.dataTransfer.setData('text/plain', JSON.stringify({ tabId, fromGroupId: groupId, index }));
    e.dataTransfer.effectAllowed = 'move';
    const el = tabRefsMap.current[tabId];
    if (el) {
      e.dataTransfer.setDragImage(el, e.clientX - el.getBoundingClientRect().left, 8);
    }
  }, [groupId]);

  const handleDragOver = useCallback((e, targetGroupId) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'move';
    setDragOverGroup(targetGroupId);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragOverGroup(null);
  }, []);

  const handleTabDragOver = useCallback((e) => {
    e.preventDefault();
  }, []);

  const handleDrop = useCallback((e, targetGroupId) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverGroup(null);
    try {
      const data = JSON.parse(e.dataTransfer.getData('text/plain'));
      if (data.fromGroupId !== targetGroupId) {
        moveTabToGroup(data.tabId, data.fromGroupId, targetGroupId);
      } else if (data.index !== undefined) {
        const tabElements = e.currentTarget.querySelectorAll('[data-tab-index]');
        let targetIndex = openTabs.length - 1;
        const mouseX = e.clientX;
        for (let i = 0; i < tabElements.length; i++) {
          const rect = tabElements[i].getBoundingClientRect();
          const midX = rect.left + rect.width / 2;
          if (mouseX < midX) {
            targetIndex = i;
            break;
          }
        }
        if (targetIndex !== data.index) {
          reorderTabs(data.index, targetIndex, groupId);
        }
      }
    } catch (e) {
      // ignore
    }
  }, [groupId, openTabs, moveTabToGroup, reorderTabs]);

  // ── Context menu handler ──
  const handleContextMenu = useCallback((e, tabId) => {
    e.preventDefault();
    setContextTabId(tabId);
    setContextMenu({ x: e.clientX, y: e.clientY });
  }, []);

  const handleContextAction = useCallback((action) => {
    const tabId = contextTabId;
    setContextMenu(null);
    if (!tabId) return;

    switch (action) {
      case 'close': closeTab(tabId, groupId); break;
      case 'close-others': closeOtherTabs(tabId, groupId); break;
      case 'close-right': closeTabsToTheRight(tabId, groupId); break;
      case 'close-all': closeAllTabs(groupId); break;
      case 'split-right': splitEditor('horizontal'); break;
      case 'split-down': splitEditor('vertical'); break;
      case 'copy-path': {
        const tab = openTabs.find((t) => t.id === tabId);
        if (tab?.path) navigator.clipboard?.writeText(tab.path);
        break;
      }
    }
  }, [contextTabId, groupId, closeTab, closeOtherTabs, closeTabsToTheRight, closeAllTabs, splitEditor, openTabs]);

  // ── Tab click handler ──
  const handleTabClick = useCallback((tabId) => {
    if (!isActive) setActiveGroup(groupId);
    setActiveTab(tabId, groupId);
  }, [isActive, groupId, setActiveGroup, setActiveTab]);

  // ═══ Early returns AFTER all hooks ═══
  if (!group) return null;
  if (!openTabs || openTabs.length === 0) return null;

  return (
    <div
      className={`flex items-center h-[35px] select-none flex-shrink-0 ${
        dragOverGroup === groupId ? 'ring-1 ring-inset' : ''
      }`}
      style={{
        background: 'rgba(10,10,18,0.95)',
        borderBottom: '1px solid rgba(255,255,255,0.04)',
        outline: dragOverGroup === groupId ? '1px solid rgba(255,255,255,0.3)' : 'none',
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.03), 0 1px 3px rgba(0,0,0,0.2)',
      }}
      onDragOver={(e) => handleDragOver(e, groupId)}
      onDragLeave={handleDragLeave}
      onDrop={(e) => handleDrop(e, groupId)}
    >
      <div
        ref={scrollRef}
        className="flex-1 flex items-center overflow-x-auto overflow-y-hidden scrollbar-none"
      >
        {openTabs.map((tab, index) => {
          const isTabActive = tab.id === activeTabId;
          const isTabActiveGroup = isTabActive && isActive;
          return (
            <div
              key={tab.id}
              ref={(el) => {
                tabRefsMap.current[tab.id] = el;
                if (isTabActive) activeTabRef.current = el;
              }}
              data-tab-index={index}
              className="group relative flex items-center gap-1.5 px-3 h-full cursor-pointer select-none whitespace-nowrap text-[13px]"
              style={{
                background: 'transparent',
                color: isTabActiveGroup ? '#f5f5f7' : 'rgba(255,255,255,0.25)',
                borderRight: '1px solid rgba(255,255,255,0.03)',
              }}
              onMouseEnter={(e) => {
                if (!isTabActiveGroup) e.currentTarget.style.color = 'rgba(255,255,255,0.5)';
              }}
              onMouseLeave={(e) => {
                if (!isTabActiveGroup) e.currentTarget.style.color = 'rgba(255,255,255,0.25)';
              }}
              onClick={() => handleTabClick(tab.id)}
              onMouseDown={(e) => {
                if (e.button === 1) {
                  e.preventDefault();
                  closeTab(tab.id, groupId);
                }
              }}
              onContextMenu={(e) => handleContextMenu(e, tab.id)}
              draggable
              onDragStart={(e) => handleDragStart(e, tab.id, index)}
              onDragOver={handleTabDragOver}
            >
              {/* Active glow bar — gold gradient line */}
              {isTabActiveGroup && (
                <motion.div
                  layoutId={`tab-active-indicator-${groupId}`}
                  className="absolute bottom-0 h-[1px]"
                  style={{
                    left: 0,
                    right: 0,
                    background: 'rgba(255,255,255,0.35)',
                    boxShadow: '0 0 2px rgba(255,255,255,0.15)',
                  }}
                  initial={{ scaleX: 0, opacity: 0 }}
                  animate={{ scaleX: 1, opacity: 1 }}
                  transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                />
              )}

              <FileIcon name={tab.name} />
              <span className="text-[12px]">{tab.name}</span>
              {tab.id && dirtyFiles[tab.id] && (
                <span className="ml-0.5 text-[11px]" style={{ color: 'rgba(255,255,255,0.4)' }}>•</span>
              )}

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  closeTab(tab.id, groupId);
                }}
                className={`
                  p-0.5 rounded-sm transition-all ml-0.5 flex-shrink-0
                  ${isTabActive
                    ? 'opacity-0 group-hover:opacity-60 hover:opacity-100'
                    : 'opacity-0 group-hover:opacity-40 hover:opacity-100'
                  }
                `}
                style={{ color: 'rgba(255,255,255,0.2)' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
                  e.currentTarget.style.color = 'rgba(255,255,255,0.6)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = 'rgba(255,255,255,0.2)';
                }}
              >
                <X size={11} strokeWidth={1.5} />
              </button>
            </div>
          );
        })}
      </div>

      {/* Tab Context Menu */}
      {contextMenu && (
        <TabContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          onClose={() => setContextMenu(null)}
          onAction={handleContextAction}
        />
      )}
    </div>
  );
}
