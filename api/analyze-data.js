// Vercel Serverless Function：/api/analyze-data
// 从 server/llm-proxy.js 迁移而来，AI 数据解读

const DEFAULT_BASE_URL = 'https://api.openai.com/v1';
const DEFAULT_MODEL = 'gpt-4o-mini';

function extractTextContent(content) {
  if (typeof content === 'string') return content;
  if (Array.isArray(content)) {
    return content
      .map((item) => {
        if (typeof item === 'string') return item;
        if (item && typeof item === 'object' && 'text' in item && typeof item.text === 'string') {
          return item.text;
        }
        return '';
      })
      .join('\n');
  }
  return '';
}

function extractJsonBlock(raw) {
  const fenced = raw.match(/```json\s*([\s\S]*?)```/i);
  if (fenced?.[1]) return fenced[1].trim();
  const start = raw.indexOf('{');
  const end = raw.lastIndexOf('}');
  if (start >= 0 && end > start) return raw.slice(start, end + 1);
  return raw;
}

function buildDataAnalysisPrompt(payload) {
  const uploadedData = payload.uploadedData || {};
  const answers = payload.answers || {};

  const sampleRowsText = (uploadedData.sampleRows || [])
    .slice(0, 8)
    .map((row) => JSON.stringify(row))
    .join('\n');

  const numericSummary = (uploadedData.numericColumns || [])
    .map((c) => `- ${c.name}: min=${c.min}, max=${c.max}, avg=${c.avg}`)
    .join('\n');

  return [
    '你是一位资深的业务数据分析顾问。请基于以下上传的业务数据，生成一份精炼而有洞察的数据分析报告。',
    '',
    `【业务背景】`,
    `行业：${answers.industry || '未指定'}`,
    `团队类型：${answers.teamType || '未指定'}`,
    `团队规模：${answers.teamSize || '未指定'}`,
    '',
    `【数据概览】`,
    `文件名：${uploadedData.fileName || '未上传'}`,
    `数据类型：${uploadedData.dataType || '未知'}`,
    `记录数：${uploadedData.rowCount || 0}`,
    `字段数：${uploadedData.columnCount || 0}`,
    `字段列表：${(uploadedData.columns || []).join('、')}`,
    '',
    `【数值字段统计】`,
    numericSummary || '（无数值字段）',
    '',
    `【数据样例（前 8 条）】`,
    sampleRowsText || '（无样例数据）',
    '',
    `【输出要求】`,
    `请以 JSON 格式返回，包含以下字段：`,
    `{`,
    `  "summary": "一句话总结这份数据反映的业务现状（不超过 30 字）",`,
    `  "keyFindings": [`,
    `    {`,
    `      "title": "发现点标题（简短）",`,
    `      "description": "具体描述，用数据说话",`,
    `      "level": "positive" | "negative" | "neutral"`,
    `    }`,
    `  ],`,
    `  "efficiencyMetrics": [`,
    `    {`,
    `      "name": "效率指标名称（如 平均工期偏差率）",`,
    `      "value": "计算出的具体数值",`,
    `      "benchmark": "行业参考值/健康值",`,
    `      "status": "excellent" | "good" | "warning" | "danger"`,
    `    }`,
    `  ],`,
    `  "bottlenecks": ["最突出的 2-3 个瓶颈问题，每个一句话"],`,
    `  "recommendations": ["3-5 条针对性改进建议，每条一句话"],`,
    `  "aiOpportunities": ["2-3 个 AI 可以切入的机会点，每个一句话"]`,
    `}`,
    '',
    `注意：`,
    `- 所有分析必须基于提供的数据，不要编造数据`,
    `- 如果数据不足以计算某个指标，可以跳过，不要硬算`,
    `- 语言要专业、精炼、有洞察，不要说空话`,
    `- 只返回 JSON，不要有其他文字说明`,
  ].join('\n');
}

async function requestDataAnalysis(payload) {
  const API_KEY = process.env.LLM_API_KEY;
  const BASE_URL = (process.env.LLM_BASE_URL || DEFAULT_BASE_URL).replace(/\/$/, '');
  const MODEL = process.env.LLM_MODEL || DEFAULT_MODEL;

  const response = await fetch(`${BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({
      model: MODEL,
      temperature: 0.5,
      messages: [
        { role: 'system', content: '你是资深业务数据分析顾问，擅长从业务数据中提炼洞察和改进建议。输出必须是严格的 JSON。' },
        { role: 'user', content: buildDataAnalysisPrompt(payload) },
      ],
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Upstream error: ${response.status} - ${text.slice(0, 200)}`);
  }

  const data = await response.json();
  const content = extractTextContent(data?.choices?.[0]?.message?.content);
  return JSON.parse(extractJsonBlock(content));
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  if (!process.env.LLM_API_KEY) {
    res.status(503).json({ error: 'LLM proxy not configured' });
    return;
  }

  try {
    const payload =
      typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};
    const analysis = await requestDataAnalysis(payload);
    res.status(200).json({ analysis });
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown proxy error',
    });
  }
}

export const config = {
  maxDuration: 30,
};
