// Vercel Serverless Function：/api/health
// 供前端与调试用，返回代理是否配置好 LLM key。

export default function handler(req, res) {
  const API_KEY = process.env.LLM_API_KEY;
  const BASE_URL = (process.env.LLM_BASE_URL || 'https://api.openai.com/v1').replace(/\/$/, '');
  const MODEL = process.env.LLM_MODEL || 'gpt-4o-mini';

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  res.status(200).json({
    ok: true,
    configured: Boolean(API_KEY),
    model: MODEL,
    baseUrl: BASE_URL,
  });
}
