import fs from 'fs/promises';
import fsSync from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import logger from '../config/logger.js';

// ── Syncing guard: prevents file watcher loops ──
// When syncWorkspaceToDisk writes files to disk, it sets this guard.
// The file watcher checks this before processing disk changes.

/** Map<workspaceId, number> — timestamp of last sync completion */
const _syncingGuard = new Map();
/** Safety delay (ms) after a sync completes before the watcher re-engages */
const SYNC_COOLDOWN_MS = 300;

/**
 * Enable/disable the file watcher syncing guard for a workspace.
 * Called by syncWorkspaceToDisk before/after writing to disk.
 */
export function setWatcherDisabled(workspaceId, disabled) {
  if (disabled) {
    _syncingGuard.set(workspaceId.toString(), Date.now());
  } else {
    _syncingGuard.set(workspaceId.toString(), 0);
  }
}

/**
 * Check if the watcher is currently disabled for a workspace (cooldown period active).
 */
export function isWatcherDisabled(workspaceId) {
  const val = _syncingGuard.get(workspaceId.toString());
  if (!val) return false;
  // numeric = timestamp when last sync finished
  return (Date.now() - val) < SYNC_COOLDOWN_MS;
}

/**
 * Workspace File Sync Service
 *
 * Resolves the workspace storage directory with the following priority:
 *   1. WORKSPACES_DIR environment variable
 *   2. /workspace/workspaces (Docker mount — check if it exists)
 *   3. ./workspaces relative to the project root (local dev, Windows compat)
 *
 * Once resolved, syncs a workspace's virtual file tree (stored in MongoDB) to
 * the actual filesystem at {WORKSPACES_DIR}/{slug}/ where slug is derived
 * from the workspace name.
 *
 * E.g. "Hello World" workspace:
 *   Files stored at: {WORKSPACES_DIR}/hello-world/
 *
 * On rename, the folder is renamed on disk to the new slug.
 */

let WORKSPACES_DIR = null;

function resolveWorkspacesDir() {
  // 1. Environment variable override
  if (process.env.WORKSPACES_DIR) {
    return path.resolve(process.env.WORKSPACES_DIR);
  }

  // 2. Docker mount path — check if it exists
  const dockerPath = '/workspace/workspaces';
  try {
    if (fsSync.statSync(dockerPath, { throwIfNoEntry: false })) {
      return dockerPath;
    }
  } catch {
    // statSync threw — path likely doesn't exist
  }

  // 3. Fall back to ./workspaces relative to project root
  // File is at backend/services/workspaceFileSync.js, so go up 2 levels
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const projectRoot = path.resolve(__dirname, '..', '..');
  const localPath = path.join(projectRoot, 'workspaces');

  // Ensure the directory exists
  try {
    fsSync.mkdirSync(localPath, { recursive: true });
  } catch (e) {
    logger.warn(`[FileSync] Could not create workspaces dir at ${localPath}: ${e.message}`);
  }

  return localPath;
}

// Lazy-init: resolve on first use so env vars are loaded by then
export function getWorkspacesDir() {
  if (!WORKSPACES_DIR) {
    WORKSPACES_DIR = resolveWorkspacesDir();
    logger.info(`[FileSync] Workspaces directory resolved to: ${WORKSPACES_DIR}`);
  }
  return WORKSPACES_DIR;
}

/**
 * Slugify a workspace name for use in filesystem paths.
 * Lowercases, replaces spaces with hyphens, strips non-alphanumeric chars.
 */
export function slugify(name) {
  return name
    .toLowerCase()
    .replace(/[\s_]+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 40) || 'workspace';
}


async function ensureDir(dirPath) {
  try {
    await fs.mkdir(dirPath, { recursive: true });
  } catch (err) {
    logger.error(`[FileSync] Failed to create directory ${dirPath}:`, err);
    throw err;
  }
}

/**
 * Recursively write a file-tree node and its children to disk.
 */
async function writeNode(basePath, node) {
  if (!node || !node.name) return;

  const nodePath = path.join(basePath, node.name);

  if (node.type === 'folder') {
    await ensureDir(nodePath);
    for (const child of (node.children || [])) {
      await writeNode(nodePath, child);
    }
  } else if (node.type === 'file') {
    await ensureDir(basePath);
    await fs.writeFile(nodePath, node.content || '', 'utf-8');
  }
}

/**
 * Sync a workspace's entire virtual file tree to disk.
 *
 * Workspace files are stored at {WORKSPACES_DIR}/{slug}/ where slug is
 * derived from the workspace name via slugify().
 *
 * On first sync of an existing workspace, migrates any old ID-based folder
 * to the new name-based slug path automatically.
 *
 * @param {object} workspace - A Mongoose workspace document (with _id, name, fileTree).
 * @returns {Promise<string>} The on-disk path of the synced workspace.
 */
export async function syncWorkspaceToDisk(workspace) {
  if (!workspace || !workspace._id || !workspace.fileTree) {
    logger.warn('[FileSync] Cannot sync — invalid workspace object');
    return null;
  }

  const workspaceId = workspace._id.toString();
  const slug = slugify(workspace.name);
  const workspacePath = path.join(getWorkspacesDir(), slug);

  // Migration: if old ID-based folder exists, move it to slug-based name
  const oldIdPath = path.join(getWorkspacesDir(), workspaceId);
  try {
    const oldExists = await fs.stat(oldIdPath).then(() => true).catch(() => false);
    if (oldExists) {
      logger.info(`[FileSync] Migrating workspace folder: ${oldIdPath} → ${workspacePath}`);
      try {
        await fs.rename(oldIdPath, workspacePath);
      } catch (renameErr) {
        // Cross-device rename fails (e.g., Docker volumes). Just ensure new dir exists.
        logger.warn(`[FileSync] Cross-device rename, ensuring new path exists: ${renameErr.message}`);
        await ensureDir(workspacePath);
      }
    }
  } catch {
    // stat failed — path doesn't exist, nothing to migrate
  }

  await ensureDir(workspacePath);

  // Disable the file watcher while we write to disk to prevent update loops
  setWatcherDisabled(workspaceId, true);

  // Write each direct child of the root fileTree node
  for (const child of (workspace.fileTree.children || [])) {
    await writeNode(workspacePath, child);
  }

  // Re-enable the file watcher after a cooldown
  setWatcherDisabled(workspaceId, false);

  logger.info(`[FileSync] Synced workspace "${workspace.name}" (${workspace._id}) → ${workspacePath}`);
  return workspacePath;
}

/**
 * Delete a workspace's synced files from disk.
 * Cleans up both the slug-based folder and any old ID-based folder.
 *
 * @param {string} workspaceId - MongoDB ObjectId as a string.
 * @param {string} [workspaceName] - Workspace name for the slug path.
 */
export async function deleteWorkspaceFromDisk(workspaceId, workspaceName) {
  // Delete the slug-based folder (primary location)
  if (workspaceName) {
    const slugPath = path.join(getWorkspacesDir(), slugify(workspaceName));
    try {
      await fs.rm(slugPath, { recursive: true, force: true });
      logger.info(`[FileSync] Deleted workspace files: ${slugPath}`);
    } catch (err) {
      if (err.code !== 'ENOENT') {
        logger.warn(`[FileSync] Failed to delete ${slugPath}:`, err);
      }
    }
  }

  // Also clean up old ID-based folder (backward compat for existing data)
  const idPath = path.join(getWorkspacesDir(), workspaceId.toString());
  try {
    await fs.rm(idPath, { recursive: true, force: true });
  } catch (err) {
    if (err.code !== 'ENOENT') {
      logger.warn(`[FileSync] Failed to delete old ID path ${idPath}:`, err);
    }
  }
}

/**
 * Get the on-disk path for a workspace's synced files.
 * Returns the slug-based path if a name is provided, otherwise falls back
 * to the ID-based path for backward compatibility.
 *
 * @param {string} workspaceId - MongoDB ObjectId as a string.
 * @param {string} [workspaceName] - Workspace name for the slug-based path.
 * @returns {string} The on-disk path.
 */
export function getWorkspacePath(workspaceId, workspaceName) {
  if (workspaceName) {
    return path.join(getWorkspacesDir(), slugify(workspaceName));
  }
  return path.join(getWorkspacesDir(), workspaceId.toString());
}

/**
 * Get the terminal cwd for a workspace.
 * Uses the name-based slug path if a name is available.
 *
 * @param {string} workspaceId - MongoDB ObjectId as a string.
 * @param {string} [workspaceName] - Workspace name for the slug path.
 * @returns {string}
 */
export function getWorkspaceDisplayPath(workspaceId, workspaceName) {
  return getWorkspacePath(workspaceId, workspaceName);
}

/**
 * Build the relative path from the workspace root to a node in the fileTree.
 * Returns an array of path segments, or null if not found.
 *
 * For a file at root level: ['index.js']
 * For a nested file: ['src', 'components', 'App.jsx']
 *
 * @param {object} tree - The fileTree node (start with workspace.fileTree).
 * @param {string} nodeId - The ID of the node to find.
 * @param {string[]} [segments] - Accumulated path segments (internal recursion).
 * @returns {string[]|null} Path segments from workspace root to node, or null.
 */
export function getNodeRelativePath(tree, nodeId, segments = []) {
  if (!tree) return null;

  if (tree.id === nodeId) {
    return segments;
  }

  if (tree.children) {
    for (const child of tree.children) {
      const result = getNodeRelativePath(child, nodeId, [...segments, child.name]);
      if (result) return result;
    }
  }

  return null;
}

/**
 * Delete a file/folder node from disk by its relative path.
 * Uses recursive deletion so folders with contents are cleaned up.
 *
 * @param {string|object} workspaceId - MongoDB ObjectId.
 * @param {string} workspaceName - Workspace name for slug resolution.
 * @param {string[]} pathSegments - Relative path segments (e.g. ['src', 'index.js']).
 */
export async function deleteNodeFromDisk(workspaceId, workspaceName, pathSegments) {
  if (!pathSegments || pathSegments.length === 0) return;

  const workspacePath = getWorkspacePath(workspaceId, workspaceName);
  const nodePath = path.join(workspacePath, ...pathSegments);

  try {
    await fs.rm(nodePath, { recursive: true, force: true });
    logger.debug(`[FileSync] Deleted from disk: ${nodePath}`);
  } catch (err) {
    if (err.code !== 'ENOENT') {
      logger.warn(`[FileSync] Failed to delete ${nodePath}: ${err.message}`);
    }
  }
}
