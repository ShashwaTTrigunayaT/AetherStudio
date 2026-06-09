import express from 'express';
import User from '../models/User.js';
import Workspace from '../models/Workspace.js';
import logger from '../config/logger.js';
import { isLoggedIn } from '../middleware/auth.js';

const router = express.Router();

// GET /api/users/:id - Public profile
router.get('/:id', async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select('name avatar bio createdAt email');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    const workspaceCount = await Workspace.countDocuments({ ownerId: user._id });
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      bio: user.bio || '',
      workspaceCount,
      memberSince: user.createdAt,
    });
  } catch (err) {
    err.status = err.status || 500;
    next(err);
  }
});

// GET /api/users/batch?ids=id1,id2,id3 - Batch fetch users by IDs
router.get('/batch', isLoggedIn, async (req, res, next) => {
  try {
    const { ids } = req.query;
    if (!ids) {
      return res.status(400).json({ error: 'ids query parameter required' });
    }

    const idArray = ids.split(',').filter(Boolean);
    if (idArray.length === 0) {
      return res.json({ users: [] });
    }

    const users = await User.find({ _id: { $in: idArray } }).select('name email avatar');
    res.json({ users });
  } catch (err) {
    err.status = err.status || 500;
    next(err);
  }
});

// PATCH /api/users/bio - Update own bio
router.patch('/bio', isLoggedIn, async (req, res, next) => {
  try {
    const { bio } = req.body;
    if (typeof bio !== 'string') {
      return res.status(400).json({ error: 'Bio must be a string' });
    }
    if (bio.length > 500) {
      return res.status(400).json({ error: 'Bio must be 500 characters or less' });
    }
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { bio },
      { new: true }
    ).select('name avatar bio email');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    logger.info('Bio updated for user: ' + user.email);
    res.json({ bio: user.bio });
  } catch (err) {
    err.status = err.status || 500;
    next(err);
  }
});

export default router;
