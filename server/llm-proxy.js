import { createServer } from 'node:http';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

function stripQuotes(value) {
  const trimmed = value.trim();
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
}

function loadEnvFileIfPresent(fileName) {
  try {
    const target = resolve(process.cwd(), fileName);
    const raw = readFileSync(target, 'utf-8');
    raw.split('\n').forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed) {
        return;
      }
      const normalized = trimmed.startsWith('export ') ? trimmed.slice(7) : trimmed;
      const idx = normalized.indexOf('=');
      if (idx <= 0) {
        return;
      }
      const key = normalized.slice(0, idx).trim();
      if (!key) {
        return;
      }
      if (process.env[key]) {
        return;
      }
      process.env[key] = stripQuotes(normalized.slice(idx + 1));
    });
  } catch {
    return;
  }
}

loadEnvFileIfPresent('.env.llm-proxy');

const PORT = Number(process.env.LLM_PROXY_PORT || 8787);
const API_KEY = process.env.LLM_API_KEY;
const BASE_URL = (process.env.LLM_BASE_URL || 'https://api.openai.com/v1').replace(/\/$/, '');
const MODEL = process.env.LLM_MODEL || 'gpt-4o-mini';

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  });
  res.end(JSON.stringify(payload));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', (chunk) => {
      raw += chunk;
    });
    req.on('end', () => {
      try {
        resolve(raw ? JSON.parse(raw) : {});
      } catch (error) {
        reject(error);
      }
    });
    req.on('error', reject);
  });
}

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
  const answers = payload.answers || {};
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
        dataContext.push(
          `  - ${col.name}：最小值 ${col.min}，最大值 ${col.max}，平均值 ${col.avg}`,
        );
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

    if (uploadedData.textPreview) {
      dataContext.push(`文本预览：${uploadedData.textPreview}`);
    }

    dataContext.push('');
    dataContext.push('请务必在你的诊断结论中引用上述数据中的具体发现，例如引用某列的数值范围、数据规模等，让结论更有说服力。');
    dataContext.push('');
  }

  return [
    '你是组织 AI 改造顾问。',
    '请基于用户的结构化问答、上传业务数据类型与前端规则引擎给出的 fallbackReport，生成更深一层的顾问式判断。',
    '你的任务不是重写全部报告，而是输出一个 enhancement JSON，用来增强现有报告。',
    '要求：',
    '1. 对每个业务环节都尽量给出更具体的结论，不要只聚焦单一核心节点。',
    '2. 允许提出新的 AI 节点，尤其是 Agent / Evaluator / Loop / Human Gate 等组织机制节点。',
    '3. 所有结论必须保持咨询报告语气，具体、克制、可执行。',
    uploadedData ? '4. 请务必结合用户上传的业务数据摘要进行分析，引用具体数据点来支撑你的判断。' : '4. 只输出 JSON，不要输出 markdown，不要加解释。',
    '5. 只输出 JSON，不要输出 markdown，不要加解释。',
    ...dataContext,
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
  const parsed = JSON.parse(extractJsonBlock(content));

  return parsed;
}

function buildFullGeneratePrompt(payload) {
  const answers = payload.answers || {};
  const uploadedData = answers.uploadedData;
  const fallbackReport = payload.fallbackReport || {};
  const flowGraph = answers.flowGraph || { nodes: [], edges: [] };

  const dataContext = [];
  if (uploadedData) {
    dataContext.push('【用户上传的业务数据摘要】');
    dataContext.push(`数据类型：${uploadedData.dataType || '未指定'}`);
    dataContext.push(`数据行数：${uploadedData.rowCount || 0}`);
    dataContext.push(`列名：${(uploadedData.columns || []).join('、')}`);
    if (uploadedData.numericColumns && uploadedData.numericColumns.length > 0) {
      dataContext.push('数值列统计：');
      uploadedData.numericColumns.forEach((col) => {
        dataContext.push(
          `  - ${col.name}：最小值 ${col.min}，最大值 ${col.max}，平均值 ${col.avg}`,
        );
      });
    }
    if (uploadedData.sampleRows && uploadedData.sampleRows.length > 0) {
      dataContext.push('数据样例：');
      uploadedData.sampleRows.slice(0, 3).forEach((row, idx) => {
        const values = Object.entries(row)
          .slice(0, 4)
          .map(([k, v]) => `${k}=${v}`)
          .join(', ');
        dataContext.push(`  第${idx + 1}行：${values}`);
      });
    }
    dataContext.push('');
  }

  const beforeContext = [];
  beforeContext.push('【当前业务流程（Before）】');
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
      beforeContext.push(
        `  ${sourceNode?.label || edge.source} → ${targetNode?.label || edge.target}`,
      );
    });
  }
  beforeContext.push('');

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
    'JSON Schema（请输出完整的 report 对象）：',
    JSON.stringify(
      {
        reportHeadline: '一句顾问式的报告标题，概括整体改造方向',
        reportNarrative: '一段 2-3 句的整体判断，说明为什么这样设计',
        readiness: [
          {
            label: '工具基建',
            score: 75,
            summary: '该维度的结论',
            note: '更深入的后续分析提示，可选',
          },
          {
            label: '组织基建',
            score: 60,
            summary: '该维度的结论',
            note: '可选',
          },
          {
            label: '人才能力',
            score: 55,
            summary: '该维度的结论',
            note: '可选',
          },
          {
            label: '文化治理',
            score: 50,
            summary: '该维度的结论',
            note: '可选',
          },
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
          edges: [
            {
              id: '边的唯一id',
              source: '源节点id',
              target: '目标节点id',
            },
          ],
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
  const parsed = JSON.parse(extractJsonBlock(content));

  return parsed;
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
  const parsed = JSON.parse(extractJsonBlock(content));

  return parsed;
}

async function requestFullGenerate(payload) {
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
          content:
            '你是资深的组织 AI 改造顾问。输出必须是合法 JSON，且严格匹配用户给定 schema。要从结构层面重新设计工作流，不要简单复制原有节点。',
        },
        {
          role: 'user',
          content: buildFullGeneratePrompt(payload),
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
  const parsed = JSON.parse(extractJsonBlock(content));

  return parsed;
}

const server = createServer(async (req, res) => {
  if (!req.url) {
    sendJson(res, 404, { error: 'Not found' });
    return;
  }

  if (req.method === 'OPTIONS') {
    sendJson(res, 200, { ok: true });
    return;
  }

  if (req.method === 'GET' && req.url === '/api/health') {
    sendJson(res, 200, {
      ok: true,
      configured: Boolean(API_KEY),
      model: MODEL,
      baseUrl: BASE_URL,
    });
    return;
  }

  if (req.method === 'POST' && req.url === '/api/diagnose') {
    if (!API_KEY) {
      sendJson(res, 503, {
        error: 'LLM proxy not configured',
      });
      return;
    }

    try {
      const payload = await readBody(req);
      const enhancement = await requestEnhancement(payload);
      sendJson(res, 200, { enhancement });
    } catch (error) {
      sendJson(res, 500, {
        error: error instanceof Error ? error.message : 'Unknown proxy error',
      });
    }
    return;
  }

  if (req.method === 'POST' && req.url === '/api/generate') {
    if (!API_KEY) {
      sendJson(res, 503, {
        error: 'LLM proxy not configured',
      });
      return;
    }

    try {
      const payload = await readBody(req);
      const report = await requestFullGenerate(payload);
      sendJson(res, 200, { report });
    } catch (error) {
      sendJson(res, 500, {
        error: error instanceof Error ? error.message : 'Unknown proxy error',
      });
    }
    return;
  }

  if (req.method === 'POST' && req.url === '/api/analyze-data') {
    if (!API_KEY) {
      sendJson(res, 503, {
        error: 'LLM proxy not configured',
      });
      return;
    }

    try {
      const payload = await readBody(req);
      const analysis = await requestDataAnalysis(payload);
      sendJson(res, 200, { analysis });
    } catch (error) {
      sendJson(res, 500, {
        error: error instanceof Error ? error.message : 'Unknown proxy error',
      });
    }
    return;
  }

  if (req.method === 'POST' && req.url === '/api/chat') {
    console.log('[chat] request received');
    if (!API_KEY) {
      console.log('[chat] error: API key not configured');
      sendJson(res, 503, {
        error: 'LLM proxy not configured',
      });
      return;
    }

    try {
      const payload = await readBody(req);
      console.log('[chat] payload received, userMessage:', payload.userMessage);
      const result = await requestChat(payload);
      console.log('[chat] response generated successfully');
      sendJson(res, 200, result);
    } catch (error) {
      console.log('[chat] error:', error instanceof Error ? error.message : error);
      sendJson(res, 500, {
        error: error instanceof Error ? error.message : 'Unknown proxy error',
      });
    }
    return;
  }

  sendJson(res, 404, { error: 'Not found' });
});

server.listen(PORT, () => {
  console.log(`[llm-proxy] listening on http://localhost:${PORT}`);
});
