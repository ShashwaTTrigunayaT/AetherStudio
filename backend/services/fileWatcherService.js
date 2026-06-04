import chokidar from 'chokidar';
import fs from 'fs/promises';
import path from 'path';
import Workspace from '../models/Workspace.js';
import { getWorkspacePath, getWorkspacesDir, isWatcherDisabled, slugify } from './workspaceFileSync.js';
import logger from '../config/logger.js';

/**
 * File Watcher Service
 *
 * Watches workspace directories on disk for changes (file create, modify, delete, rename)
 * and syncs them back to the MongoDB fileTree. Uses debouncing per workspace to avoid
 * flooding MongoDB during bulk operations.
 *
 * The syncing guard is maintained by workspaceFileSync.js to prevent loops.
 */

// ── Watcher state ──

let _watcher = null;
let _io = null;
const _workspaceDirs = new Map(); // workspaceId -> { slug, debounceTimer }

// ── Pre-populate workspace dirs on startup ──
// This ensures existing workspaces are watched without waiting for a user to join
async function prePopulateWorkspaceDirs() {
  try {
    const workspaces = await Workspace.find({}, { _id: 1, name: 1 }).lean();
    for (const ws of workspaces) {
      const idStr = ws._id.toString();
      if (!_workspaceDirs.has(idStr)) {
        const slug = slugify(ws.name);
        _workspaceDirs.set(idStr, { slug, debounceTimer: null });
        logger.debug(`[FileWatcher] Pre-populated workspace: ${idStr} (slug: ${slug})`);
      }
    }
    logger.info(`[FileWatcher] Pre-populated ${workspaces.length} workspace(s) from DB`);
  } catch (err) {
    logger.warn('[FileWatcher] Failed to pre-populate workspace dirs:', err.message);
  }
}

const DEBOUNCE_MS = 800;

// File extensions to treat as text — binary files are skipped
const TEXT_EXTENSIONS = new Set([
  'txt', 'md', 'js', 'jsx', 'ts', 'tsx', 'json', 'html', 'css', 'scss', 'less',
  'py', 'rb', 'go', 'rs', 'java', 'c', 'cpp', 'h', 'hpp', 'cs', 'php', 'swift',
  'kt', 'kts', 'sql', 'sh', 'bash', 'zsh', 'yaml', 'yml', 'toml', 'ini', 'cfg',
  'conf', 'xml', 'svg', 'vue', 'svelte', 'graphql', 'gql', 'proto', 'gradle',
  'env', 'gitignore', 'dockerfile', 'makefile', 'cmake', 'lock', 'log',
  'yml', 'yaml', 'pl', 'pm', 'lua', 'r', 'm', 'mm', 'dart', 'fs', 'fsx',
  'ex', 'exs', 'clj', 'cljs', 'edn', 'erl', 'hrl', 'hs', 'lhs', 'nim',
  'crystal', 'zig', 'wgsl', 'frag', 'vert', 'glsl',
]);

const MAX_FILE_SIZE = 1024 * 1024; // 1MB

function isTextFile(filePath) {
  const ext = path.extname(filePath).replace('.', '').toLowerCase();
  return TEXT_EXTENSIONS.has(ext);
}

// Files/directories to always ignore
const IGNORE_PATTERNS = [
  /[/\\]node_modules[/\\]/,
  /[/\\]\.git[/\\]/,
  /[/\\]\.next[/\\]/,
  /[/\\]\.cache[/\\]/,
  /[/\\]__pycache__[/\\]/,
  /[/\\]\.DS_Store$/,
  /[/\\]Thumbs\.db$/,
  /~$/, // editor temp files
  /^\.#/, // lock files
];

function shouldIgnore(filePath) {
  return IGNORE_PATTERNS.some((p) => p.test(filePath));
}

// ── Directory tree scanner ──

/**
 * Recursively scan a directory and build a fileTree structure matching the MongoDB schema.
 * Returns null if the directory doesn't exist.
 */
async function scanDirectory(dirPath) {
  try {
    await fs.access(dirPath);
  } catch {
    return null;
  }

  const entries = await fs.readdir(dirPath, { withFileTypes: true });
  const children = [];

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    if (shouldIgnore(fullPath)) continue;

    if (entry.isDirectory()) {
      const subChildren = await scanDirectory(fullPath);
      children.push({
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        name: entry.name,
        type: 'folder',
        children: subChildren || [],
      });
    } else if (entry.isFile()) {
      let content = '';
      if (isTextFile(entry.name)) {
        try {
          const stat = await fs.stat(fullPath);
          if (stat.size <= MAX_FILE_SIZE) {
            content = await fs.readFile(fullPath, 'utf-8');
          } else {
            logger.debug(`[FileWatcher] Skipping large file: ${fullPath} (${stat.size} bytes)`);
          }
        } catch (err) {
          logger.warn(`[FileWatcher] Could not read file ${fullPath}: ${err.message}`);
        }
      }
      children.push({
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        name: entry.name,
        type: 'file',
        content,
        language: entry.name.split('.').pop() || 'plaintext',
      });
    }
  }

  // Sort: folders first, then files, alphabetically
  children.sort((a, b) => {
    if (a.type !== b.type) return a.type === 'folder' ? -1 : 1;
    return a.name.localeCompare(b.name);
  });

  return children;
}

/**
 * Compare two file trees (arrays of children nodes) by name and type only (shallow).
 * Deep compare is expensive, so we do a quick structure check first.
 */
function treesEqual(a, b) {
  if (!a || !b) return a === b;
  if (a.length !== b.length) return false;
  return a.every((nodeA, i) => {
    const nodeB = b[i];
    if (nodeA.name !== nodeB.name) return false;
    if (nodeA.type !== nodeB.type) return false;
    return true;
  });
}

/**
 * Deep compare two file trees including nested children.
 */
function deepTreesEqual(aChildren, bChildren) {
  if (!treesEqual(aChildren, bChildren)) return false;
  return aChildren.every((nodeA, i) => {
    const nodeB = bChildren[i];
    if (nodeA.type === 'folder') {
      return deepTreesEqual(nodeA.children || [], nodeB.children || []);
    }
    // For files, also compare content
    return nodeA.content === nodeB.content;
  });
}

/**
 * Rebuild a workspace's MongoDB fileTree from the on-disk state.
 * Called after debounced file changes are detected.
 */
async function syncDiskToMongo(workspaceId) {
  if (isWatcherDisabled(workspaceId)) {
    logger.debug(`[FileWatcher] Skipping ${workspaceId} — syncing guard active`);
    return false;
  }

  try {
    const workspaceIdStr = workspaceId.toString();

    // Fetch workspace first to get the name for slug-based path
    const workspace = await Workspace.findById(workspaceIdStr);
    if (!workspace) {
      logger.warn(`[FileWatcher] Workspace not found in DB: ${workspaceIdStr}`);
      return false;
    }

    const workspacePath = getWorkspacePath(workspaceIdStr, workspace.name);

    // Scan the directory
    const children = await scanDirectory(workspacePath);
    if (children === null) {
      // Directory doesn't exist yet — nothing to sync
      return false;
    }
    // Compare with current fileTree to avoid unnecessary updates
    const currentChildren = workspace.fileTree?.children || [];
    if (deepTreesEqual(currentChildren, children)) {
      logger.debug(`[FileWatcher] No changes for ${workspace.name} — skipping update`);
      return false;
    }

    // Update the fileTree
    workspace.fileTree.children = children;
    workspace.markModified('fileTree');
    await workspace.save();

    logger.info(`[FileWatcher] Synced disk → MongoDB for "${workspace.name}" (${workspaceIdStr})`);

    // Notify all connected clients in this workspace
    if (_io) {
      _io.to(`workspace:${workspaceIdStr}`).emit('workspace-filetree-update', {
        workspaceId: workspaceIdStr,
        fileTree: workspace.fileTree,
      });
    }

    return true;
  } catch (err) {
    logger.error(`[FileWatcher] Error syncing disk → MongoDB for ${workspaceId}:`, err);
    return false;
  }
}

// ── Debounced watcher ──

function handleDiskChange(workspaceId) {
  const idStr = workspaceId.toString();
  const entry = _workspaceDirs.get(idStr);
  if (!entry) return;

  if (entry.debounceTimer) {
    clearTimeout(entry.debounceTimer);
  }

  entry.debounceTimer = setTimeout(() => {
    syncDiskToMongo(workspaceId);
  }, DEBOUNCE_MS);
}

// ── Public API ──

/**
 * Start watching all existing workspace directories.
 * Called once on server startup.
 */
export async function startFileWatcher(io) {
  _io = io;

  if (_watcher) {
    logger.warn('[FileWatcher] Already started');
    return;
  }

  const workspacesDir = getWorkspacesDir();

  // Pre-populate workspace dirs from MongoDB so the watcher can map file paths immediately
  await prePopulateWorkspaceDirs();

  // On Windows (especially with OneDrive/Dropbox), native fs.watch can miss events.
  // Polling is more reliable cross-platform but uses more CPU.
  // Set CHOKIDAR_USEPOLLING=true env var to force polling, or 'auto' to detect Windows.
  const usePolling = process.env.CHOKIDAR_USEPOLLING === 'true' ||
    (process.env.CHOKIDAR_USEPOLLING !== 'false' && process.platform === 'win32');

  if (usePolling) {
    logger.info('[FileWatcher] Using polling mode (platform: ' + process.platform + ')');
  }

  // Watch the workspaces root directory for new workspace folders
  _watcher = chokidar.watch(workspacesDir, {
    ignored: (testPath) => {
      // Always ignore node_modules, .git, etc.
      if (shouldIgnore(testPath)) return true;
      return false;
    },
    persistent: true,
    ignoreInitial: true,
    depth: 6,
    usePolling,
    interval: 1000,
    binaryInterval: 3000,
    awaitWriteFinish: {
      stabilityThreshold: 200,
      pollInterval: 100,
    },
  });

  _watcher.on('add', (filePath) => {
    const workspaceId = getWorkspaceIdFromPath(filePath);
    if (workspaceId) handleDiskChange(workspaceId);
  });

  _watcher.on('change', (filePath) => {
    const workspaceId = getWorkspaceIdFromPath(filePath);
    if (workspaceId) handleDiskChange(workspaceId);
  });

  _watcher.on('unlink', (filePath) => {
    const workspaceId = getWorkspaceIdFromPath(filePath);
    if (workspaceId) handleDiskChange(workspaceId);
  });

  _watcher.on('addDir', (dirPath) => {
    const workspaceId = getWorkspaceIdFromPath(dirPath);
    if (workspaceId) handleDiskChange(workspaceId);
  });

  _watcher.on('unlinkDir', (dirPath) => {
    const workspaceId = getWorkspaceIdFromPath(dirPath);
    if (workspaceId) handleDiskChange(workspaceId);
  });

  logger.info(`[FileWatcher] Started watching: ${workspacesDir}`);
}

/**
 * Start watching a specific workspace directory.
 * Stores the slug for path matching so filesystem changes can be
 * mapped back to the correct workspace.
 *
 * @param {string|object} workspaceId - MongoDB ObjectId
 * @param {string} [workspaceName] - Workspace name for slug-based path
 */
export function watchWorkspace(workspaceId, workspaceName) {
  const idStr = workspaceId.toString();
  if (_workspaceDirs.has(idStr)) return; // already watching

  const slug = workspaceName ? slugify(workspaceName) : idStr;
  _workspaceDirs.set(idStr, { slug, debounceTimer: null });
  logger.debug(`[FileWatcher] Registered workspace for watching: ${idStr} (slug: ${slug})`);
}

/**
 * Stop watching a specific workspace directory (called when a workspace is deleted).
 */
export function unwatchWorkspace(workspaceId) {
  const idStr = workspaceId.toString();
  const entry = _workspaceDirs.get(idStr);
  if (entry?.debounceTimer) {
    clearTimeout(entry.debounceTimer);
  }
  _workspaceDirs.delete(idStr);
}

/**
 * Stop the file watcher entirely.
 */
export async function stopFileWatcher() {
  if (_watcher) {
    await _watcher.close();
    _watcher = null;
  }
  _workspaceDirs.clear();
  logger.info('[FileWatcher] Stopped');
}

// ── Helper ──

/**
 * Extract workspaceId from a file path within the workspaces directory.
 * E.g., /path/to/workspaces/my-project/src/index.js -> resolves to workspace ID
 *
 * Works by checking the first path segment against registered workspace slugs (or IDs).
 */
function getWorkspaceIdFromPath(filePath) {
  const workspacesDir = getWorkspacesDir();
  const relative = path.relative(workspacesDir, filePath);
  if (!relative || relative.startsWith('..')) return null;

  const parts = relative.split(path.sep);
  if (parts.length < 1) return null;

  const candidate = parts[0];
  // Match against registered workspace slugs OR IDs (for backward compat)
  for (const [idStr, entry] of _workspaceDirs) {
    if (candidate === entry.slug || candidate === idStr) return idStr;
  }

  return null;
}
