import express from 'express';
import fs from 'fs/promises';
import path from 'path';
import logger from '../config/logger.js';
import Workspace from '../models/Workspace.js';
import { syncWorkspaceToDisk, deleteWorkspaceFromDisk, getWorkspacesDir, slugify, getNodeRelativePath, deleteNodeFromDisk } from '../services/workspaceFileSync.js';
import { watchWorkspace, unwatchWorkspace } from '../services/fileWatcherService.js';

const router = express.Router();

// ─── Workspace CRUD ───────────────────────────────────────

router.post('/', async (req, res, next) => {
  try {
    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Workspace name required' });
    }

    // Enforce unique name per owner — case-sensitive
    const existing = await Workspace.findOne({ name, ownerId: req.user._id });
    if (existing) {
      return res.status(409).json({ error: `A workspace named "${name}" already exists` });
    }

    const workspace = new Workspace({
      name,
      description,
      ownerId: req.user._id,
      fileTree: {
        id: 'root',
        name,
        type: 'folder',
        children: [],
      },
    });

    await workspace.save();

    // Create the local folder and symlink on disk immediately
    try {
      await syncWorkspaceToDisk(workspace);
      // Start watching this workspace for disk changes
      watchWorkspace(workspace._id, workspace.name);
    } catch (e) { logger.warn('[FileSync] sync error on create:', e); }

    res.status(201).json(workspace);
  } catch (err) {
    err.status = err.status || 500;
    next(err);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const workspace = await Workspace.findById(req.params.id);

    if (!workspace) {
      return res.status(404).json({ error: 'Workspace not found' });
    }

    // Check access
    const isOwner = workspace.ownerId.equals(req.user._id);
    const isCollaborator = workspace.collaboratorIds.some((id) => id.equals(req.user._id));

    if (!isOwner && !isCollaborator && !workspace.isPublic) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json(workspace);
  } catch (err) {
    err.status = err.status || 500;
    next(err);
  }
});

router.get('/', async (req, res, next) => {
  try {
    const workspaces = await Workspace.find({
      $or: [
        { ownerId: req.user._id },
        { collaboratorIds: req.user._id },
      ],
    });

    res.json(workspaces);
  } catch (err) {
    err.status = err.status || 500;
    next(err);
  }
});

router.patch('/:id', async (req, res, next) => {
  try {
    const workspace = await Workspace.findById(req.params.id);

    if (!workspace) {
      return res.status(404).json({ error: 'Workspace not found' });
    }

    if (!workspace.ownerId.equals(req.user._id)) {
      return res.status(403).json({ error: 'Only owner can edit' });
    }

    const oldName = workspace.name;

    // If renaming, ensure the new name isn't taken by another workspace of this owner
    if (req.body.name && req.body.name !== oldName) {
      const duplicate = await Workspace.findOne({ name: req.body.name, ownerId: req.user._id });
      if (duplicate) {
        return res.status(409).json({ error: `A workspace named "${req.body.name}" already exists` });
      }
    }

    Object.assign(workspace, req.body);
    await workspace.save();

    // Rename the folder on disk if the name changed
    if (req.body.name && req.body.name !== oldName) {
      const oldSlug = slugify(oldName);
      const newSlug = slugify(workspace.name);

      // Only rename if the slug actually changed (e.g., "Hello" → "hello" both become "hello")
      if (oldSlug !== newSlug) {
        const workspacesDir = getWorkspacesDir();
        const oldDir = path.join(workspacesDir, oldSlug);
        const newDir = path.join(workspacesDir, newSlug);

        try {
          await fs.access(oldDir);
          await fs.rename(oldDir, newDir);
          logger.info(`[FileSync] Renamed workspace folder: ${oldSlug} → ${newSlug}`);
        } catch (e) {
          if (e.code !== 'ENOENT') {
            logger.warn('[FileSync] Folder rename error:', e);
          }
        }
      }

      // Unwatch with old path, rewatch with new path
      unwatchWorkspace(workspace._id);
      watchWorkspace(workspace._id, workspace.name);
    }

    res.json(workspace);
  } catch (err) {
    err.status = err.status || 500;
    next(err);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const workspace = await Workspace.findById(req.params.id);

    if (!workspace) {
      return res.status(404).json({ error: 'Workspace not found' });
    }

    if (!workspace.ownerId.equals(req.user._id)) {
      return res.status(403).json({ error: 'Only owner can delete' });
    }

    await workspace.deleteOne();

    // Stop watching this workspace
    unwatchWorkspace(workspace._id);

    // Clean up synced files and symlink from disk
    try { await deleteWorkspaceFromDisk(workspace._id, workspace.name); } catch (e) { logger.warn('[FileSync] cleanup error:', e); }

    res.json({ message: 'Workspace deleted' });
  } catch (err) {
    err.status = err.status || 500;
    next(err);
  }
});

// ─── File Operations ──────────────────────────────────────

/**
 * Helper: find a node in the file tree by ID
 */
function findNode(tree, nodeId) {
  if (!tree) return null;
  if (tree.id === nodeId) return tree;
  if (tree.children) {
    for (const child of tree.children) {
      const found = findNode(child, nodeId);
      if (found) return found;
    }
  }
  return null;
}

/**
 * Helper: find parent node of a given node ID
 */
function findParent(tree, nodeId, parent = null) {
  if (!tree) return null;
  if (tree.id === nodeId) return parent;
  if (tree.children) {
    for (const child of tree.children) {
      const found = findParent(child, nodeId, tree);
      if (found) return found;
    }
  }
  return null;
}

/**
 * POST /api/workspace/:id/files
 * Create a new file or folder
 * Body: { name, type: 'file'|'folder', parentId?: string }
 */
router.post('/:id/files', async (req, res, next) => {
  try {
    const { name, type, parentId } = req.body;
    const workspace = await Workspace.findById(req.params.id);

    if (!workspace) {
      return res.status(404).json({ error: 'Workspace not found' });
    }

    if (!name || !type) {
      return res.status(400).json({ error: 'Name and type required' });
    }

    if (type !== 'file' && type !== 'folder') {
      return res.status(400).json({ error: 'Type must be file or folder' });
    }

    const parent = parentId
      ? findNode(workspace.fileTree, parentId)
      : workspace.fileTree;

    if (!parent || parent.type !== 'folder') {
      return res.status(400).json({ error: 'Parent folder not found' });
    }

    // Check for duplicate name
    const duplicate = (parent.children || []).find((c) => c.name === name);
    if (duplicate) {
      return res.status(409).json({ error: `A ${type} named "${name}" already exists` });
    }

    const newItem = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      name,
      type,
      content: type === 'file' ? '' : undefined,
      language: type === 'file' ? name.split('.').pop() || 'plaintext' : undefined,
      children: type === 'folder' ? [] : undefined,
    };

    if (!parent.children) parent.children = [];
    parent.children.push(newItem);

    workspace.markModified('fileTree');
    await workspace.save();

    // Sync to disk so the terminal sees the new file/folder
    try { await syncWorkspaceToDisk(workspace); } catch (e) { logger.warn('[FileSync] sync error:', e); }

    res.status(201).json(newItem);
  } catch (err) {
    err.status = err.status || 500;
    next(err);
  }
});

/**
 * GET /api/workspace/:id/files/:fileId
 * Get file content
 */
router.get('/:id/files/:fileId', async (req, res, next) => {
  try {
    const workspace = await Workspace.findById(req.params.id);

    if (!workspace) {
      return res.status(404).json({ error: 'Workspace not found' });
    }

    const node = findNode(workspace.fileTree, req.params.fileId);

    if (!node) {
      return res.status(404).json({ error: 'File not found' });
    }

    if (node.type !== 'file') {
      return res.status(400).json({ error: 'Not a file' });
    }

    res.json({ content: node.content || '', name: node.name, id: node.id, language: node.language });
  } catch (err) {
    err.status = err.status || 500;
    next(err);
  }
});

/**
 * PUT /api/workspace/:id/files/:fileId
 * Save file content
 * Body: { content: string }
 */
router.put('/:id/files/:fileId', async (req, res, next) => {
  try {
    const { content } = req.body;
    const workspace = await Workspace.findById(req.params.id);

    if (!workspace) {
      return res.status(404).json({ error: 'Workspace not found' });
    }

    const node = findNode(workspace.fileTree, req.params.fileId);

    if (!node) {
      return res.status(404).json({ error: 'File not found' });
    }

    if (node.type !== 'file') {
      return res.status(400).json({ error: 'Not a file' });
    }

    node.content = content ?? '';
    workspace.markModified('fileTree');
    await workspace.save();

    // Sync updated content to disk so the terminal sees changes
    try { await syncWorkspaceToDisk(workspace); } catch (e) { logger.warn('[FileSync] sync error:', e); }

    res.json({ message: 'File saved', id: node.id });
  } catch (err) {
    err.status = err.status || 500;
    next(err);
  }
});

/**
 * DELETE /api/workspace/:id/files/:fileId
 * Delete a file or folder
 */
router.delete('/:id/files/:fileId', async (req, res, next) => {
  try {
    const workspace = await Workspace.findById(req.params.id);

    if (!workspace) {
      return res.status(404).json({ error: 'Workspace not found' });
    }

    const parent = findParent(workspace.fileTree, req.params.fileId);

    if (!parent || !parent.children) {
      return res.status(404).json({ error: 'File not found' });
    }

    const idx = parent.children.findIndex((c) => c.id === req.params.fileId);
    if (idx === -1) {
      return res.status(404).json({ error: 'File not found' });
    }

    // Get the node's disk path BEFORE removing from fileTree
    const pathSegments = getNodeRelativePath(workspace.fileTree, req.params.fileId);

    parent.children.splice(idx, 1);
    workspace.markModified('fileTree');
    await workspace.save();

    // Delete from disk first to prevent the watcher from re-adding the file
    if (pathSegments) {
      try {
        await deleteNodeFromDisk(workspace._id, workspace.name, pathSegments);
      } catch (e) {
        logger.warn('[FileSync] Error deleting file from disk:', e);
      }
    }

    // Sync remaining files to disk
    try { await syncWorkspaceToDisk(workspace); } catch (e) { logger.warn('[FileSync] sync error:', e); }

    res.json({ message: 'Deleted' });
  } catch (err) {
    err.status = err.status || 500;
    next(err);
  }
});

/**
 * PUT /api/workspace/:id/files/:fileId/rename
 * Rename a file or folder
 * Body: { name: string }
 */
router.put('/:id/files/:fileId/rename', async (req, res, next) => {
  try {
    const { name } = req.body;
    const workspace = await Workspace.findById(req.params.id);

    if (!workspace) {
      return res.status(404).json({ error: 'Workspace not found' });
    }

    if (!name) {
      return res.status(400).json({ error: 'Name required' });
    }

    const node = findNode(workspace.fileTree, req.params.fileId);

    if (!node) {
      return res.status(404).json({ error: 'File not found' });
    }

    // Capture old path BEFORE modifying the node name
    const oldPathSegments = getNodeRelativePath(workspace.fileTree, req.params.fileId);

    // Check for duplicate in parent
    const parent = findParent(workspace.fileTree, req.params.fileId);
    if (parent && parent.children) {
      const duplicate = parent.children.find((c) => c.name === name && c.id !== req.params.fileId);
      if (duplicate) {
        return res.status(409).json({ error: `A file named "${name}" already exists` });
      }
    }

    node.name = name;
    if (node.type === 'file') {
      node.language = name.split('.').pop() || 'plaintext';
    }

    workspace.markModified('fileTree');
    await workspace.save();

    // Delete the OLD file/folder from disk to prevent watcher from re-adding it
    if (oldPathSegments) {
      try {
        await deleteNodeFromDisk(workspace._id, workspace.name, oldPathSegments);
      } catch (e) {
        logger.warn('[FileSync] Error deleting old path from disk:', e);
      }
    }

    // Sync renamed files to disk (writes the new name's file)
    try { await syncWorkspaceToDisk(workspace); } catch (e) { logger.warn('[FileSync] sync error:', e); }

    res.json({ message: 'Renamed', node });
  } catch (err) {
    err.status = err.status || 500;
    next(err);
  }
});

/**
 * POST /api/workspace/:id/import
 * Bulk import files preserving folder structure.
 * Body: { files: [{ path: "src/index.js", content: "..." }, ...] }
 */
function makeNodeId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

router.post('/:id/import', async (req, res, next) => {
  try {
    const { files } = req.body;
    const workspace = await Workspace.findById(req.params.id);

    if (!workspace) {
      return res.status(404).json({ error: 'Workspace not found' });
    }

    if (!Array.isArray(files) || files.length === 0) {
      return res.status(400).json({ error: 'Files array required' });
    }

    // ── Build directory tree from file paths ──
    const allDirs = new Set();
    for (const f of files) {
      if (!f.path) continue;
      const parts = f.path.split('/');
      if (parts.length > 1) {
        for (let i = 0; i < parts.length - 1; i++) {
          allDirs.add(parts.slice(0, i + 1).join('/'));
        }
      }
    }

    const sortedDirs = [...allDirs].sort(
      (a, b) => a.split('/').length - b.split('/').length
    );

    // ── Helper to find or create a path in the tree ──
    // Returns the node and whether it was newly created
    function ensurePath(tree, dirParts) {
      let current = tree;
      for (const part of dirParts) {
        let child = (current.children || []).find((c) => c.name === part && c.type === 'folder');
        if (!child) {
          child = {
            id: makeNodeId(),
            name: part,
            type: 'folder',
            children: [],
          };
          if (!current.children) current.children = [];
          current.children.push(child);
        }
        current = child;
      }
      return current;
    }

    // ── Create folders ──
    for (const dirPath of sortedDirs) {
      const parts = dirPath.split('/');
      ensurePath(workspace.fileTree, parts);
    }

    // ── Create files inside their folders ──
    const created = [];
    for (const f of files) {
      if (!f.path) continue;
      const parts = f.path.split('/');
      const name = parts[parts.length - 1];

      // Find parent folder
      let parent = workspace.fileTree;
      if (parts.length > 1) {
        const dirParts = parts.slice(0, -1);
        for (const part of dirParts) {
          const child = (parent.children || []).find(
            (c) => c.name === part && c.type === 'folder'
          );
          if (!child) break;
          parent = child;
        }
      }

      // Skip duplicates
      if ((parent.children || []).find((c) => c.name === name)) {
        continue;
      }

      const fileNode = {
        id: makeNodeId(),
        name,
        type: 'file',
        content: f.content ?? '',
        language: name.split('.').pop() || 'plaintext',
      };

      if (!parent.children) parent.children = [];
      parent.children.push(fileNode);
      created.push({ id: fileNode.id, name: fileNode.name, path: f.path });
    }

    workspace.markModified('fileTree');
    await workspace.save();

    // Sync to disk once
    try { await syncWorkspaceToDisk(workspace); } catch (e) { logger.warn('[FileSync] sync error:', e); }

    res.status(201).json({ imported: created.length, total: files.length, files: created });
  } catch (err) {
    err.status = err.status || 500;
    next(err);
  }
});

/**
 * GET /api/workspace/:id/search?query=xxx
 * Search file names and contents
 */
router.get('/:id/search', async (req, res, next) => {
  try {
    const { query } = req.query;
    const workspace = await Workspace.findById(req.params.id);

    if (!workspace) {
      return res.status(404).json({ error: 'Workspace not found' });
    }

    if (!query || query.trim().length === 0) {
      return res.json({ results: [] });
    }

    const q = query.toLowerCase();
    const results = [];

    function searchNode(node, path = '') {
      if (!node) return;
      const currentPath = path ? `${path}/${node.name}` : node.name;

      if (node.type === 'file') {
        const nameMatch = node.name.toLowerCase().includes(q);
        const contentMatch = (node.content || '').toLowerCase().includes(q);
        if (nameMatch || contentMatch) {
          const matches = [];
          if (node.content) {
            const lines = node.content.split('\n');
            lines.forEach((line, idx) => {
              if (line.toLowerCase().includes(q)) {
                matches.push({ line: idx + 1, content: line.trim() });
              }
            });
          }
          results.push({ file: { id: node.id, name: node.name, type: 'file' }, path: currentPath, matches });
        }
      }

      (node.children || []).forEach((child) => searchNode(child, currentPath));
    }

    searchNode(workspace.fileTree);
    res.json({ results });
  } catch (err) {
    err.status = err.status || 500;
    next(err);
  }
});

export default router;
