import React from 'react';
import { ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { useWorkspace } from '../../stores/useWorkspace';
import {
  VscFile,
  VscJson,
  VscMarkdown,
  VscFileMedia,
  VscTerminal,
  VscFolder,
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
  return <IconComponent size={12} style={{ color }} />;
}

export default function Breadcrumbs({ groupId }) {
  const { getGroupById, workspace } = useWorkspace();
  const group = getGroupById(groupId);
  const activeFile = group?.activeFile;

  if (!activeFile || !workspace?.fileTree) return null;

  const buildPath = () => {
    const segments = [];
    const findPath = (node, targetId, path = []) => {
      if (!node) return null;
      const currentPath = [...path, node];
      if (node.id === targetId) return currentPath;
      if (node.children) {
        for (const child of node.children) {
          const result = findPath(child, targetId, currentPath);
          if (result) return result;
        }
      }
      return null;
    };
    return findPath(workspace.fileTree, activeFile.id) || [];
  };

  const path = buildPath();

  return (
    <div className="h-[24px] flex items-center px-3 select-none flex-shrink-0 overflow-x-auto scrollbar-none relative"
      style={{
        background: 'rgba(10,10,18,0.95)',
        borderBottom: '1px solid rgba(255,255,255,0.03)',
      }}
    >
      {path.map((node, idx) => {
        const isLast = idx === path.length - 1;
        const isFolder = node.type === 'folder';
        return (
          <motion.div
            key={node.id}
            initial={{ opacity: 0, x: -4 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.03, duration: 0.15 }}
            className="flex items-center gap-0.5 text-[11px]"
          >
            {idx > 0 && (
              <ChevronRight
                size={10}
                className="mx-0.5 flex-shrink-0"
                strokeWidth={1.5}
                style={{ color: isLast ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.08)' }}
              />
            )}
            <span                className={`
                flex items-center gap-1 px-1.5 py-0.5 rounded cursor-pointer transition-all duration-150
                ${isLast
                  ? 'text-[rgba(245,245,247,0.65)] font-medium'
                  : 'text-[rgba(255,255,255,0.2)] hover:text-[rgba(255,255,255,0.4)] hover:bg-[rgba(255,255,255,0.03)]'
                }
              `}
            >
              {isFolder ? (
                <VscFolder size={12} className={isLast ? 'text-[rgba(255,255,255,0.3)]' : 'text-[rgba(255,255,255,0.12)]'} />
              ) : (
                <FileIcon name={node.name} />
              )}
              <span className="whitespace-nowrap">{node.name}</span>
            </span>
            {isLast && (
              <span className="w-[3px] h-[3px] rounded-full ml-1" style={{ background: 'rgba(255,255,255,0.3)' }} />
            )}
          </motion.div>
        );
      })}
    </div>
  );
}
