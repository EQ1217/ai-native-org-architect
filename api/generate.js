// Vercel Serverless Function：/api/generate
// 从 server/llm-proxy.js 迁移而来，完整生成 AI 设计版报告

const DEFAULT_BASE_URL = 'https://api.openai.com/v1';
const DEFAULT_MODEL = 'gpt-4o-mini';

function extractTextContent(content) {
  if (typeof content === 'string') {
    return content;
  }
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

function buildGeneratePrompt(payload) {
  const answers = payload.answers || {};
  // Before 图：前端放在 answers.flowGraph（与 server/llm-proxy.js 一致），兼容旧字段 beforeGraph
  const flowGraph = answers.flowGraph || payload.beforeGraph || { nodes: [], edges: [] };
  // 初步就绪度：前端放在 fallbackReport.readiness，兼容旧字段 fallbackReadiness
  const fallbackReadiness = payload.fallbackReport?.readiness || payload.fallbackReadiness || [];
  const uploadedData = answers.uploadedData;

  const dataContext = [];
  if (uploadedData) {
    dataContext.push('【用户上传的业务数据摘要】');
    dataContext.push(`数据类型：${uploadedData.dataType || '未指定'}`);
    dataContext.push(`文件名：${uploadedData.fileName || '未命名'}`);
    dataContext.push(`数据行数：${uploadedData.rowCount || 0}`);
    dataContext.push(`列数：${uploadedData.columnCount || 0}`);
    dataContext.push(`列名：${(uploadedData.columns || []).join('、')}`);
    if (uploadedData.numericColumns && uploadedData.numericColumns.length > 0) {
      dataContext.push('数值列统计：');
      uploadedData.numericColumns.forEach((col) => {
        dataContext.push(`  - ${col.name}：最小值 ${col.min}，最大值 ${col.max}，平均值 ${col.avg}`);
      });
    }
    if (uploadedData.sampleRows && uploadedData.sampleRows.length > 0) {
      dataContext.push('数据样例（前几行）：');
      uploadedData.sampleRows.forEach((row, idx) => {
        const values = Object.entries(row)
          .slice(0, 5)
          .map(([k, v]) => `${k}=${v}`)
          .join(', ');
        dataContext.push(`  第${idx + 1}行：${values}`);
      });
    }
    dataContext.push('');
  }

  const beforeContext = [];
  beforeContext.push('【当前业务流程（Before 图）】');
  if (flowGraph.nodes && flowGraph.nodes.length > 0) {
    beforeContext.push(`节点列表（共 ${flowGraph.nodes.length} 个）：`);
    flowGraph.nodes.forEach((node, idx) => {
      beforeContext.push(
        `  ${idx + 1}. ${node.label}（id: ${node.id}, 输入: ${node.input || '无'}, 输出: ${node.output || '无'}）`,
      );
    });
  }
  if (flowGraph.edges && flowGraph.edges.length > 0) {
    beforeContext.push(`连接关系（共 ${flowGraph.edges.length} 条）：`);
    flowGraph.edges.forEach((edge) => {
      const sourceNode = flowGraph.nodes?.find((n) => n.id === edge.source);
      const targetNode = flowGraph.nodes?.find((n) => n.id === edge.target);
      beforeContext.push(`  ${sourceNode?.label || edge.source} → ${targetNode?.label || edge.target}`);
    });
  }
  beforeContext.push('');

  const readinessContext = [];
  if (fallbackReadiness && fallbackReadiness.length > 0) {
    readinessContext.push('【规则引擎给出的初步就绪度评估（仅供参考，请在此基础上深化）】');
    fallbackReadiness.forEach((item) => {
      readinessContext.push(`- ${item.label}：${item.summary}`);
    });
    readinessContext.push('');
  }

  return [
    '你是资深的组织 AI 改造顾问，擅长为不同行业的团队设计 AI 原生工作流程。',
    '请基于用户的行业、团队、当前业务流程，以及上传的业务数据（如有），设计一套完整的 AI 改造后的工作流程（After 图），并给出每个环节的详细诊断说明。',
    '',
    '设计要求：',
    '1. 不要简单地给每个节点加一个 AI 副本。要从流程结构层面重新设计，考虑哪些环节可以自动化、哪些需要人机协作、哪些需要新增 AI 节点（如 Agent、Evaluator、质量把关、知识库等）。',
    '2. 可以新增节点、合并节点、调整顺序、增加并行分支、增加审批/回环等结构变化。',
    '3. 【重要】流程结构要清晰易读，尽量保持从左到右的线性主流程，并行分支不要超过 2 条，避免过多交叉连线。如果有回环，尽量放在单个节点内部描述，不要画成循环连线。',
    '4. 每个节点要明确：谁负责（human / hybrid / ai）、输入输出是什么、用了什么 AI 机制。',
    '5. 机制类型可选：skill（技能点）、copilot（副驾驶）、workflow（工作流）、agent（智能体）、routing（路由分发）、parallelization（并行化）、evaluator（评估器）、knowledge（知识库）、human_gate（人工把关）、loop（回环迭代）。',
    '6. 如果有上传的业务数据，请结合数据中的具体发现来支撑你的设计，引用数据点让结论更有说服力。',
    '7. 输出必须是合法 JSON，严格匹配下面的 schema，不要输出 markdown，不要加解释。',
    '8. 【重要】每个 optimizedGraph 的节点必须填写 changeType，表示相对于 Before 图的结构变化：',
    '   - added：新增的节点（Before 图中完全没有）',
    '   - modified：保留的节点但内容/职责有重大调整',
    '   - merged：由 Before 图中多个节点合并而来',
    '   - same：基本保留，没有实质性变化',
    '   如果是 merged，请在 mergedFrom 里列出被合并的 Before 节点 id；changeNote 用一句话简述变化原因。',
    '',
    ...dataContext,
    ...beforeContext,
    ...readinessContext,
    'JSON Schema（请输出完整的 report 对象）：',
    JSON.stringify(
      {
        reportHeadline: '一句顾问式的报告标题，概括整体改造方向',
        reportNarrative: '一段 2-3 句的整体判断，说明为什么这样设计',
        readiness: [
          { label: '工具基建', score: 75, summary: '该维度的结论', note: '更深入的后续分析提示，可选' },
          { label: '组织基建', score: 60, summary: '该维度的结论', note: '可选' },
          { label: '人才能力', score: 55, summary: '该维度的结论', note: '可选' },
          { label: '文化治理', score: 50, summary: '该维度的结论', note: '可选' },
        ],
        optimizedGraph: {
          nodes: [
            {
              id: '节点唯一id，建议用英文+数字',
              label: '节点名称',
              input: '该节点输入',
              output: '该节点输出',
              kind: 'stage 或 ai',
              changeType: 'added / modified / merged / same，相对于 Before 图的变化类型',
              mergedFrom: ['如果是merged，列出被合并的Before节点id，否则不要这个字段'],
              changeNote: '一句话简述这个节点的变化原因，可选',
            },
          ],
          edges: [{ id: '边的唯一id', source: '源节点id', target: '目标节点id' }],
        },
        optimizedAnnotations: [
          {
            nodeId: '对应 optimizedGraph 里的节点 id',
            label: '节点名称',
            mechanism: ['skill', 'workflow'],
            rationale: '为什么这样设计',
            action: '该节点实际做什么',
            replaceAction: '它替代/改造了原来的哪些动作',
            caseRef: '行业共性参考，不要伪造具体客户名',
            capabilitySummary: '该环节里 AI 的能力边界',
            changeSummary: '与现状相比发生了什么变化',
            ownership: 'human 或 hybrid 或 ai',
            isAiNode: false,
            isCore: false,
          },
        ],
        modelNotes: ['3-5 条额外的顾问提醒或注意事项'],
      },
      null,
      2,
    ),
  ].join('\n');
}

async function requestGenerate(payload) {
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
      temperature: 0.4,
      messages: [
        {
          role: 'system',
          content: '你是资深的组织 AI 改造顾问。输出必须是合法 JSON，且严格匹配用户给定 schema。要从结构层面重新设计工作流，不要简单复制原有节点。',
        },
        { role: 'user', content: buildGeneratePrompt(payload) },
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
    const payload =
      typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};
    const report = await requestGenerate(payload);
    res.status(200).json({ report });
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown proxy error',
    });
  }
}

export const config = {
  maxDuration: 60,
};
