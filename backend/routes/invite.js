import express from 'express';
import Workspace from '../models/Workspace.js';
import User from '../models/User.js';

const router = express.Router();

/**
 * GET /api/invite/:token
 * Resolve an invite token to workspace info (no auth needed beyond login).
 * Returns workspace name, description, owner info, and collaborator count.
 */
router.get('/:token', async (req, res, next) => {
  try {
    const { token } = req.params;
    const workspace = await Workspace.findOne({ inviteToken: token });

    if (!workspace) {
      return res.status(404).json({ error: 'Invalid or expired invite link' });
    }

    // Fetch owner info
    const owner = await User.findById(workspace.ownerId).select('name email avatar');

    // Check if user is already a collaborator
    const isOwner = workspace.ownerId.equals(req.user._id);
    const isCollaborator = workspace.collaboratorIds.some((id) => id.equals(req.user._id));

    res.json({
      workspace: {
        _id: workspace._id,
        name: workspace.name,
        description: workspace.description,
        isPublic: workspace.isPublic,
      },
      owner: owner
        ? { _id: owner._id, name: owner.name, email: owner.email, avatar: owner.avatar }
        : null,
      collaboratorCount: workspace.collaboratorIds.length,
      isOwner,
      isCollaborator,
    });
  } catch (err) {
    err.status = err.status || 500;
    next(err);
  }
});

/**
 * POST /api/invite/:token/accept
 * Accept an invite — adds the authenticated user as a collaborator.
 */
router.post('/:token/accept', async (req, res, next) => {
  try {
    const { token } = req.params;
    const workspace = await Workspace.findOne({ inviteToken: token });

    if (!workspace) {
      return res.status(404).json({ error: 'Invalid or expired invite link' });
    }

    // Check if user is the owner
    if (workspace.ownerId.equals(req.user._id)) {
      return res.status(400).json({ error: 'You are the owner of this workspace' });
    }

    // Check if already a collaborator
    if (workspace.collaboratorIds.some((id) => id.equals(req.user._id))) {
      return res.json({
        message: 'Already a collaborator',
        workspaceId: workspace._id,
      });
    }

    // Add as collaborator
    workspace.collaboratorIds.push(req.user._id);
    await workspace.save();

    res.json({
      message: 'Joined workspace',
      workspaceId: workspace._id,
      workspaceName: workspace.name,
    });
  } catch (err) {
    err.status = err.status || 500;
    next(err);
  }
});

export default router;
