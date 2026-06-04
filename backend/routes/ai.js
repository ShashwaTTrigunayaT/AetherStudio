import express from 'express';
import { getCodeCompletion, analyzeCode, chatWithContext } from '../services/aiService.js';

const router = express.Router();

router.post('/complete', async (req, res, next) => {
  try {
    const { code, language } = req.body;

    if (!code) {
      return res.status(400).json({ error: 'Code required' });
    }

    const completion = await getCodeCompletion(code, language || 'javascript');
    res.json({ completion });
  } catch (err) {
    err.status = err.status || 500;
    next(err);
  }
});

router.post('/analyze', async (req, res, next) => {
  try {
    const { code, language } = req.body;

    if (!code) {
      return res.status(400).json({ error: 'Code required' });
    }

    const analysis = await analyzeCode(code, language || 'javascript');
    res.json({ analysis });
  } catch (err) {
    err.status = err.status || 500;
    next(err);
  }
});

router.post('/chat', async (req, res, next) => {
  try {
    const { message, code, language } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message required' });
    }

    const reply = await chatWithContext(message, code || '', language || 'javascript', {});
    res.json({ reply });
  } catch (err) {
    err.status = err.status || 500;
    next(err);
  }
});

export default router;