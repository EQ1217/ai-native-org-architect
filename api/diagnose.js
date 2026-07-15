// Vercel Serverless Function：/api/diagnose
// 从原生 Node 版 server/llm-proxy.js 迁移而来，
// 逻辑保持一致：拼 prompt → 调用 LLM → 解析出 enhancement JSON 返回。

const DEFAULT_BASE_URL = 'https://api.openai.com/v1';
const DEFAULT_MODEL = 'gpt-4o-mini';

function extractTextContent(content) {
  if (typeof content === 'string') {
    return content;
  }

  if (Array.isArray(content)) {
    return content
      .map((item) => {
        if (typeof item === 'string') {
          return item;
        }
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
  if (fenced?.[1]) {
    return fenced[1].trim();
  }

  const start = raw.indexOf('{');
  const end = raw.lastIndexOf('}');
  if (start >= 0 && end > start) {
    return raw.slice(start, end + 1);
  }

  return raw;
}

function buildPrompt(payload) {
  return [
    '你是组织 AI 改造顾问。',
    '请基于用户的结构化问答、上传业务数据类型与前端规则引擎给出的 fallbackReport，生成更深一层的顾问式判断。',
    '你的任务不是重写全部报告，而是输出一个 enhancement JSON，用来增强现有报告。',
    '要求：',
    '1. 对每个业务环节都尽量给出更具体的结论，不要只聚焦单一核心节点。',
    '2. 允许提出新的 AI 节点，尤其是 Agent / Evaluator / Loop / Human Gate 等组织机制节点。',
    '3. 所有结论必须保持咨询报告语气，具体、克制、可执行。',
    '4. 只输出 JSON，不要输出 markdown，不要加解释。',
    'JSON Schema：',
    JSON.stringify(
      {
        reportHeadline: '一句更像顾问报告标题的话，可选',
        reportNarrative: '一段 1-2 句整体判断，可选',
        readiness: [
          {
            label: '工具基建',
            summary: '对该维度的更深结论',
            note: '对该维度更深入的后续分析提示，可选',
          },
        ],
        annotations: [
          {
            nodeId: '用户原流程节点 id',
            rationale: '为什么这样设计',
            action: '建议动作',
            replaceAction: '替代/改造描述',
            caseRef: '可引用行业共性，不要伪造具体客户名',
            capabilitySummary: '该环节里 AI 的能力边界',
            changeSummary: '与现状相比发生了什么变化',
            ownership: 'human 或 hybrid 或 ai',
          },
        ],
        generatedNodes: [
          {
            anchorNodeId: '挂靠在哪个原流程节点后面',
            label: '例如 趋势研究 Agent',
            input: '该节点输入',
            output: '该节点输出',
            mechanism: ['agent'],
            rationale: '为什么要新增它',
            action: '它实际承担什么工作',
            replaceAction: '它替代或重构了哪些旧动作',
            caseRef: '行业共性参考',
            capabilitySummary: '该 AI 节点能力说明',
            changeSummary: '这个新节点让组织发生了什么变化',
            ownership: 'ai',
          },
        ],
        modelNotes: ['可选，1-3 条额外提醒'],
      },
      null,
      2,
    ),
    '输入数据如下：',
    JSON.stringify(payload),
  ].join('\n');
}

async function requestEnhancement(payload) {
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
      temperature: 0.3,
      messages: [
        {
          role: 'system',
          content:
            '你是严谨的组织 AI 改造顾问。输出必须是合法 JSON，且严格匹配用户给定 schema。',
        },
        {
          role: 'user',
          content: buildPrompt(payload),
        },
      ],
    }),
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Upstream error: ${response.status}`);
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
    // Vercel 会自动帮我们解析 JSON body，若解析失败会是字符串。
    const payload =
      typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};
    const enhancement = await requestEnhancement(payload);
    res.status(200).json({ enhancement });
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown proxy error',
    });
  }
}

// Vercel 默认 10s 超时，主流程 requestLlmEnhancedReport 前端也设了 30s，
// 这里配置 30s 给模型多留一点时间。
export const config = {
  maxDuration: 30,
};
