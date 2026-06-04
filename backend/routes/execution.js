import express from 'express';
import { executeCode } from '../services/executionService.js';

const router = express.Router();

router.post('/', async (req, res, next) => {
  try {
    const { language, code } = req.body;

    if (!code) {
      return res.status(400).json({ error: 'Code required' });
    }

    const result = await executeCode(language || 'javascript', code);

    if (result.error) {
      return res.status(500).json({ error: result.error, output: result.output });
    }

    res.json({ output: result.output, error: null });
  } catch (err) {
    err.status = err.status || 500;
    next(err);
  }
});

export default router;