import express from 'express';
import logger from '../config/logger.js';
import Extension from '../models/Extension.js';
import Review from '../models/Review.js';
import User from '../models/User.js';
import { isLoggedIn } from '../middleware/auth.js';

const router = express.Router();

// ─── Seed default extensions into MongoDB ──────────────────
const DEFAULT_EXTENSIONS = [
  { extensionId: 'builtin-js', name: 'JavaScript Language Basics', publisher: 'AetherStudio', icon: '🟨', category: 'languages', isBuiltin: true, version: '1.2.0', description: 'Core JavaScript/TypeScript language support.', downloads: 9999999, rating: 5.0, ratingCount: 100, tags: ['javascript', 'built-in'], color: '#F0DB4F', isFeatured: true },
  { extensionId: 'builtin-html', name: 'HTML & CSS Support', publisher: 'AetherStudio', icon: '🌐', category: 'languages', isBuiltin: true, version: '1.1.0', description: 'HTML5, CSS3, SVG language support with Emmet.', downloads: 9999999, rating: 5.0, ratingCount: 90, tags: ['html', 'css', 'built-in'], color: '#E34F26', isFeatured: true },
  { extensionId: 'builtin-git', name: 'Git Integration', publisher: 'AetherStudio', icon: '🔀', category: 'devops', isBuiltin: true, version: '1.0.0', description: 'Built-in Git source control.', downloads: 9999999, rating: 5.0, ratingCount: 85, tags: ['git', 'built-in'], color: '#F05032' },
  { extensionId: 'builtin-markdown', name: 'Markdown Preview', publisher: 'AetherStudio', icon: '📝', category: 'productivity', isBuiltin: true, version: '1.0.5', description: 'Live Markdown preview.', downloads: 9999999, rating: 5.0, ratingCount: 80, tags: ['markdown', 'built-in'], color: '#083FA1' },
  { extensionId: 'python', name: 'Python', publisher: 'AetherStudio', icon: '🐍', category: 'languages', version: '2.1.0', latestVersion: '2.2.0', description: 'IntelliSense, linting, debugging for Python 3.', downloads: 12500000, rating: 4.8, ratingCount: 4500, tags: ['python', 'intellisense', 'jupyter'], color: '#306998', isFeatured: true },
  { extensionId: 'javascript-ts', name: 'JavaScript & TypeScript', publisher: 'AetherStudio', icon: '🟦', category: 'languages', version: '3.0.1', description: 'Rich IntelliSense for JS/TS.', downloads: 24100000, rating: 4.9, ratingCount: 8200, tags: ['javascript', 'typescript'], color: '#3178C6', isFeatured: true },
  { extensionId: 'go', name: 'Go for AetherStudio', publisher: 'Go Team', icon: '🔷', category: 'languages', version: '1.8.0', description: 'Go language support with debugging.', downloads: 5200000, rating: 4.7, ratingCount: 2100, tags: ['go', 'golang'], color: '#00ADD8' },
  { extensionId: 'rust', name: 'rust-analyzer', publisher: 'Rust Team', icon: '🦀', category: 'languages', version: '0.4.0', description: 'Rust language server.', downloads: 3800000, rating: 4.9, ratingCount: 1900, tags: ['rust', 'lsp'], color: '#DEA584', isFeatured: true },
  { extensionId: 'cpp', name: 'C/C++ Extension Pack', publisher: 'Microsoft', icon: '⚙️', category: 'languages', version: '1.12.0', description: 'C/C++ IntelliSense pack. 5 extensions.', downloads: 18300000, rating: 4.5, ratingCount: 5600, tags: ['c', 'cpp', 'pack'], color: '#00599C', isPack: true, packCount: 5 },
  { extensionId: 'nexus-dark', name: 'Nexus Dark Pro', publisher: 'Aether Themes', icon: '🌙', category: 'themes', version: '2.0.0', description: 'Premium dark theme with gold accents.', downloads: 892000, rating: 4.9, ratingCount: 1200, tags: ['theme', 'dark'], color: '#b89450', isFeatured: true },
  { extensionId: 'one-dark-pro', name: 'One Dark Pro', publisher: 'Binaryify', icon: '🎨', category: 'themes', version: '3.15.0', description: 'Atom One Dark theme.', downloads: 8700000, rating: 4.8, ratingCount: 3400, tags: ['theme', 'dark'], color: '#61AFEF' },
  { extensionId: 'github-theme', name: 'GitHub Theme', publisher: 'GitHub', icon: '🐙', category: 'themes', version: '1.1.0', description: 'GitHub official themes.', downloads: 15200000, rating: 4.7, ratingCount: 4200, tags: ['theme', 'github'], color: '#24292F' },
  { extensionId: 'material-theme', name: 'Material Theme Icons', publisher: 'Material', icon: '💎', category: 'themes', version: '4.8.0', description: 'Material Design file icons.', downloads: 11400000, rating: 4.6, ratingCount: 3800, tags: ['icons', 'material'], color: '#00BCD4' },
  { extensionId: 'gitlens', name: 'GitLens', publisher: 'GitKraken', icon: '🔍', category: 'productivity', version: '14.5.0', description: 'Git blame annotations and code lens.', downloads: 22100000, rating: 4.9, ratingCount: 9100, tags: ['git', 'blame'], color: '#F05133' },
  { extensionId: 'prettier', name: 'Prettier', publisher: 'Prettier', icon: '✨', category: 'productivity', version: '10.2.0', description: 'Opinionated code formatter.', downloads: 31500000, rating: 4.8, ratingCount: 11500, tags: ['formatting', 'prettier'], color: '#F7B93E' },
  { extensionId: 'eslint', name: 'ESLint', publisher: 'Microsoft', icon: '📐', category: 'productivity', version: '2.4.0', description: 'Integrates ESLint into AetherStudio.', downloads: 28400000, rating: 4.7, ratingCount: 9800, tags: ['linting', 'javascript'], color: '#4B32C3' },
  { extensionId: 'live-share', name: 'Live Share', publisher: 'Microsoft', icon: '🤝', category: 'productivity', version: '1.0.0', description: 'Real-time collaborative editing.', downloads: 9800000, rating: 4.6, ratingCount: 2100, tags: ['collaboration', 'remote'], color: '#9C27B0' },
  { extensionId: 'copilot', name: 'GitHub Copilot', publisher: 'GitHub', icon: '🤖', category: 'productivity', version: '1.80.0', description: 'AI-powered code completions.', downloads: 6300000, rating: 4.9, ratingCount: 5200, tags: ['ai', 'completions'], color: '#6CC644', isFeatured: true },
  { extensionId: 'todo-tree', name: 'Todo Tree', publisher: 'Gruntfuggly', icon: '📋', category: 'productivity', version: '1.0.0', description: 'Show TODO/FIXME as tree.', downloads: 4100000, rating: 4.7, ratingCount: 1500, tags: ['todos'], color: '#22C55E' },
  { extensionId: 'path-intellisense', name: 'Path Intellisense', publisher: 'CK', icon: '📁', category: 'productivity', version: '2.8.0', description: 'Auto-completes file paths.', downloads: 7200000, rating: 4.6, ratingCount: 2800, tags: ['paths', 'imports'], color: '#3B82F6' },
  { extensionId: 'debugger-chrome', name: 'Debugger for Chrome', publisher: 'Microsoft', icon: '🌐', category: 'debugging', version: '4.12.0', description: 'Debug JS in Chrome.', downloads: 13600000, rating: 4.4, ratingCount: 4100, tags: ['debugging', 'chrome'], color: '#4285F4' },
  { extensionId: 'jest', name: 'Jest Runner', publisher: 'firsttris', icon: '🃏', category: 'debugging', version: '5.0.0', description: 'Run Jest tests inline.', downloads: 3900000, rating: 4.5, ratingCount: 1100, tags: ['testing', 'jest'], color: '#C21325' },
  { extensionId: 'rest-client', name: 'REST Client', publisher: 'Mao', icon: '📮', category: 'debugging', version: '0.25.0', description: 'Send HTTP requests.', downloads: 5100000, rating: 4.6, ratingCount: 1800, tags: ['api', 'rest'], color: '#00BFA5' },
  { extensionId: 'docker', name: 'Docker', publisher: 'Microsoft', icon: '🐳', category: 'devops', version: '1.28.0', description: 'Dockerfile editing.', downloads: 14200000, rating: 4.6, ratingCount: 5300, tags: ['docker', 'containers'], color: '#2496ED' },
  { extensionId: 'remote-ssh', name: 'Remote SSH', publisher: 'Microsoft', icon: '🔗', category: 'devops', version: '0.106.0', description: 'Open folders on remote machines.', downloads: 9700000, rating: 4.5, ratingCount: 2900, tags: ['remote', 'ssh'], color: '#E65100' },
  { extensionId: 'thunder-client', name: 'Thunder Client', publisher: 'Ranga', icon: '⚡', category: 'devops', version: '2.10.0', description: 'Lightweight REST API client.', downloads: 2800000, rating: 4.7, ratingCount: 900, tags: ['api', 'rest', 'graphql'], color: '#FF6D00' },
];

async function ensureSeeded() {
  const count = await Extension.countDocuments();
  if (count === 0) {
    for (const ext of DEFAULT_EXTENSIONS) {
      await Extension.create(ext);
    }
    logger.info('[Extensions] Seeded ' + DEFAULT_EXTENSIONS.length + ' extensions');
  }
}
ensureSeeded().catch(e => logger.warn('[Extensions] Seed error:', e));

// GET /api/extensions — list/search/filter
router.get('/', async (req, res, next) => {
  try {
    const { search, category, sort, view, page = '1', limit = '50' } = req.query;
    const query = {};
    if (category && category !== 'all') query.category = category;
    if (view === 'builtin') query.isBuiltin = true;
    if (view === 'featured') query.isFeatured = true;
    if (search && search.trim()) {
      const q = search.trim();
      query['$or'] = [
        { name: { '$regex': q, '$options': 'i' } },
        { publisher: { '$regex': q, '$options': 'i' } },
        { description: { '$regex': q, '$options': 'i' } },
        { tags: { '$regex': q, '$options': 'i' } },
      ];
    }
    let sortObj = { downloads: -1 };
    if (sort === 'rating') sortObj = { rating: -1 };
    else if (sort === 'name') sortObj = { name: 1 };
    else if (sort === 'date') sortObj = { createdAt: -1 };
    const p = Math.max(1, parseInt(page));
    const l = Math.min(100, Math.max(1, parseInt(limit)));
    const total = await Extension.countDocuments(query);
    const extensions = await Extension.find(query).sort(sortObj).skip((p - 1) * l).limit(l).lean();
    res.json({ extensions, pagination: { page: p, limit: l, total, pages: Math.ceil(total / l) } });
  } catch (err) { next(err); }
});

// GET /api/extensions/featured
router.get('/featured', async (req, res, next) => {
  try {
    const featured = await Extension.find({ isFeatured: true }).sort({ downloads: -1 }).limit(5).lean();
    res.json({ featured });
  } catch (err) { next(err); }
});

// GET /api/extensions/user/state
router.get('/user/state', isLoggedIn, async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.json({ installed: [], enabled: [], extensionSettings: [] });
    res.json({
      installed: (user.extensions || []).map(e => e.extensionId),
      enabled: (user.extensions || []).filter(e => e.enabled).map(e => e.extensionId),
      extensionSettings: user.extensions || [],
    });
  } catch (err) { next(err); }
});

// GET /api/extensions/:id — details + reviews
router.get('/:id', async (req, res, next) => {
  try {
    const ext = await Extension.findOne({ extensionId: req.params.id }).lean();
    if (!ext) return res.status(404).json({ error: 'Not found' });
    const reviews = await Review.find({ extensionId: req.params.id }).sort({ createdAt: -1 }).limit(20).lean();
    let userReview = null;
    if (req.user) userReview = await Review.findOne({ extensionId: req.params.id, userId: req.user._id }).lean();
    res.json({ extension: ext, reviews, userReview });
  } catch (err) { next(err); }
});

// POST /api/extensions/:id/install
router.post('/:id/install', isLoggedIn, async (req, res, next) => {
  try {
    const { action = 'install' } = req.body;
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    let exts = user.extensions || [];
    if (action === 'install') {
      if (!exts.find(e => e.extensionId === req.params.id)) {
        exts.push({ extensionId: req.params.id, version: '1.0.0', enabled: true, autoUpdate: true, disableScope: 'global' });
      }
    } else {
      exts = exts.filter(e => e.extensionId !== req.params.id);
    }
    user.extensions = exts;
    user.markModified('extensions');
    await user.save();
    res.json({
      installed: exts.map(e => e.extensionId),
      enabled: exts.filter(e => e.enabled).map(e => e.extensionId),
      extensionSettings: exts,
    });
  } catch (err) { next(err); }
});

// POST /api/extensions/:id/toggle
router.post('/:id/toggle', isLoggedIn, async (req, res, next) => {
  try {
    const { enabled, disableScope } = req.body;
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    const ext = (user.extensions || []).find(e => e.extensionId === req.params.id);
    if (!ext) return res.status(404).json({ error: 'Not installed' });
    if (enabled !== undefined) ext.enabled = enabled;
    if (disableScope) ext.disableScope = disableScope;
    user.markModified('extensions');
    await user.save();
    res.json({
      installed: user.extensions.map(e => e.extensionId),
      enabled: user.extensions.filter(e => e.enabled).map(e => e.extensionId),
      extensionSettings: user.extensions,
    });
  } catch (err) { next(err); }
});

// POST /api/extensions/:id/auto-update
router.post('/:id/auto-update', isLoggedIn, async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    const ext = (user.extensions || []).find(e => e.extensionId === req.params.id);
    if (!ext) return res.status(404).json({ error: 'Not installed' });
    ext.autoUpdate = req.body.autoUpdate !== false;
    user.markModified('extensions');
    await user.save();
    res.json({ extensionId: req.params.id, autoUpdate: ext.autoUpdate });
  } catch (err) { next(err); }
});

// POST /api/extensions/bulk/enable
router.post('/bulk/enable', isLoggedIn, async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    for (const ext of (user.extensions || [])) {
      if (!ext.extensionId.startsWith('builtin-')) ext.enabled = req.body.enable !== false;
    }
    user.markModified('extensions');
    await user.save();
    res.json({
      installed: user.extensions.map(e => e.extensionId),
      enabled: user.extensions.filter(e => e.enabled).map(e => e.extensionId),
    });
  } catch (err) { next(err); }
});

// POST /api/extensions/:id/review
router.post('/:id/review', isLoggedIn, async (req, res, next) => {
  try {
    const { rating, title, text } = req.body;
    if (!rating || rating < 1 || rating > 5) return res.status(400).json({ error: 'Rating 1-5 required' });
    const review = await Review.findOneAndUpdate(
      { extensionId: req.params.id, userId: req.user._id },
      { rating, title, text, userName: req.user.name, updatedAt: new Date() },
      { upsert: true, new: true }
    );
    res.json({ review });
  } catch (err) { next(err); }
});

// POST /api/extensions/install-vsix
router.post('/install-vsix', isLoggedIn, async (req, res, next) => {
  try {
    const { fileName } = req.body;
    if (!fileName || !fileName.endsWith('.vsix')) return res.status(400).json({ error: 'Need .vsix file' });
    const extId = 'vsix-' + fileName.replace('.vsix', '').toLowerCase().replace(/[^a-z0-9]/g, '-');
    await Extension.create({
      extensionId: extId, name: fileName.replace('.vsix', ''), publisher: 'VSIX', icon: '📦',
      version: '1.0.0', description: 'Installed from ' + fileName, downloads: 1, tags: ['vsix'], color: '#8B5CF6',
    });
    const user = await User.findById(req.user._id);
    if (user) {
      user.extensions = [...(user.extensions || []), { extensionId: extId, enabled: true, autoUpdate: true, disableScope: 'global' }];
      user.markModified('extensions');
      await user.save();
    }
    res.json({ message: 'Installed ' + fileName });
  } catch (err) { next(err); }
});

export default router;
