import { GoogleGenerativeAI } from '@google/generative-ai';
import logger from '../config/logger.js';

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  logger.warn('GEMINI_API_KEY is not set — AI features will return fallback messages');
}

const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

function getModel() {
  if (!genAI) {
    throw new Error('Gemini API key is not configured. Set GEMINI_API_KEY in your environment.');
  }
  return genAI.getGenerativeModel({ model: 'gemini-pro' });
}

export async function getCodeCompletion(code, language, context = '') {
  try {
    const model = getModel();

    const prompt = `You are an expert ${language} developer. Complete the following code snippet with the best possible next lines.

Context: ${context}

Code to complete:
\`\`\`${language}
${code}
\`\`\`

Provide only the completion code without markdown formatting.`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();

    return text;
  } catch (err) {
    logger.error('AI completion error:', err);
    throw err;
  }
}

export async function analyzeCode(code, language) {
  try {
    const model = getModel();

    const prompt = `Analyze the following ${language} code and provide:
1. What it does
2. Time complexity
3. Space complexity
4. Any bugs or improvements

Code:
\`\`\`${language}
${code}
\`\`\``;

    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (err) {
    logger.error('AI analysis error:', err);
    throw err;
  }
}

export async function chatWithContext(message, code, language, workspace) {
  try {
    const model = getModel();

    const prompt = `You are an expert developer assisting with code collaboration.

Current workspace: ${workspace?.name || 'Unknown'}
Language: ${language}

Active code:
\`\`\`${language}
${code}
\`\`\`

User question: ${message}

Provide a helpful, concise response.`;

    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (err) {
    logger.error('AI chat error:', err);
    throw err;
  }
}