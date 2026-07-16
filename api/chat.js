// Vercel Serverless Function：/api/chat
// 从 server/llm-proxy.js 迁移而来，多轮对话调整工作流

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

function buildChatPrompt(payload) {
  const { currentGraph, currentAnnotations, answers, userMessage } = payload;
  const uploadedData = payload.uploadedData || {};

  const graphJson = JSON.stringify(currentGraph, null, 2);
  const annotationsJson = JSON.stringify(currentAnnotations || [], null, 2);

  return [
    '你是一位资深的组织架构和流程优化顾问。用户想让你基于当前的 AI 改造方案，进行对话式调整。',
    '',
    `【业务背景】`,
    `行业：${answers?.industry || '未指定'}`,
    `团队类型：${answers?.teamType || '未指定'}`,
    `团队规模：${answers?.teamSize || '未指定'}`,
    '',
    `【当前 After 流程图（JSON）】`,
    graphJson,
    '',
    `【当前节点注解（JSON）】`,
    annotationsJson,
    '',
    uploadedData.rowCount ? `【已上传的业务数据】：${uploadedData.rowCount} 条记录，${uploadedData.columnCount} 个字段` : '',
    '',
    `【用户的修改意见】`,
    userMessage,
    '',
    `【输出要求】`,
    `请以 JSON 格式返回，包含以下字段：`,
    `{`,
    `  "reply": "用自然语言回复用户，解释你做了哪些调整（100字以内，口语化）",`,
    `  "optimizedGraph": {`,
    `    "nodes": [`,
    `      {`,
    `        "id": "节点唯一id",`,
    `        "label": "节点名称",`,
    `        "input": "该节点输入",`,
    `        "output": "该节点输出",`,
    `        "kind": "stage 或 ai",`,
    `        "changeType": "added / modified / merged / same",`,
    `        "mergedFrom": ["如果是merged，列出被合并的Before节点id"],`,
    `        "changeNote": "一句话简述这个节点的变化原因，可选"`,
    `      }`,
    `    ],`,
    `    "edges": [{"id": "边的唯一id", "source": "源节点id", "target": "目标节点id"}]`,
    `  },`,
    `  "annotations": [`,
    `    {`,
    `      "nodeId": "对应 optimizedGraph 里的节点 id",`,
    `      "label": "节点名称",`,
    `      "mechanism": ["skill", "workflow"],`,
    `      "rationale": "为什么这样设计",`,
    `      "action": "该节点实际做什么",`,
    `      "replaceAction": "它替代/改造了原来的哪些动作",`,
    `      "caseRef": "行业共性参考，不要伪造具体客户名",`,
    `      "capabilitySummary": "该环节里 AI 的能力边界",`,
    `      "changeSummary": "与现状相比发生了什么变化",`,
    `      "ownership": "human 或 hybrid 或 ai",`,
    `      "isAiNode": false,`,
    `      "isCore": false`,
    `    }`,
    `  ],`,
    `  "readiness": [`,
    `    { "label": "工具基建", "score": 75, "summary": "该维度的结论" },`,
    `    { "label": "组织基建", "score": 60, "summary": "该维度的结论" },`,
    `    { "label": "人才能力", "score": 55, "summary": "该维度的结论" },`,
    `    { "label": "文化治理", "score": 50, "summary": "该维度的结论" }`,
    `  ]`,
    `}`,
    '',
    `注意：`,
    `- 必须返回完整的 optimizedGraph（全量节点+边），不是增量的`,
    `- 可以新增、删除、合并、调整节点，也可以修改节点内容`,
    `- 流程结构要清晰易读，尽量保持从左到右的线性主流程，并行分支不超过 2 条`,
    `- reply 要简洁友好，告诉用户你改了什么`,
    `- 只返回 JSON，不要有其他文字说明`,
    `- 如果用户的要求不合理或无法实现，在 reply 里解释原因，optimizedGraph 返回当前的不变`,
    `- annotations 数组要和 optimizedGraph.nodes 一一对应，每个节点都要有对应的 annotation`,
  ].filter(Boolean).join('\n');
}

async function requestChat(payload) {
  const API_KEY = process.env.LLM_API_KEY;
  const BASE_URL = (process.env.LLM_BASE_URL || DEFAULT_BASE_URL).replace(/\/$/, '');
  const MODEL = process.env.LLM_MODEL || DEFAULT_MODEL;

  const messages = [
    {
      role: 'system',
      content: '你是资深组织架构和流程优化顾问，擅长通过对话调整 AI 原生工作流。输出必须是严格的 JSON。',
    },
    {
      role: 'user',
      content: buildChatPrompt(payload),
    },
  ];

  const response = await fetch(`${BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({
      model: MODEL,
      temperature: 0.6,
      messages,
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
    const result = await requestChat(payload);
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown proxy error',
    });
  }
}

export const config = {
  maxDuration: 60,
};
