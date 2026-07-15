import { getIndustryProfile } from '../data/industryProfiles';
import type {
  DiagnosticReport,
  FlowGraph,
  FlowNode,
  IndustryCase,
  InitialInsight,
  MechanismRecommendation,
  NodeAnnotation,
  QuestionnaireAnswer,
  ReadinessScore,
  StageHint,
  TeamSize,
} from '../types/diagnostic';
import { MECHANISM_LABELS } from './mechanismLabels';

const RESEARCH_PATTERNS = ['研究', '调研', '分析', '监控', '清洗', '识别', '检索', '优化'];
const PRODUCTION_PATTERNS = [
  '生产',
  '制作',
  '生成',
  '文案',
  '脚本',
  '设计',
  '编码',
  '实现',
  '话术',
  '详情',
];
const GATE_PATTERNS = ['审核', '发布', '复核', '上线', '质检', '把关', '评审', '测试', '验证'];
const REVIEW_PATTERNS = ['复盘', '归档', '总结'];

const TEAM_SIZE_ORG_PENALTY: Record<TeamSize, number> = {
  '1-10': 0,
  '11-30': -5,
  '31-100': -12,
  '100+': -18,
};

const TEAM_SIZE_CULTURE_BONUS: Record<TeamSize, number> = {
  '1-10': 8,
  '11-30': 4,
  '31-100': 0,
  '100+': -4,
};

const TEAM_SIZE_LABEL: Record<TeamSize, string> = {
  '1-10': '1-10 人',
  '11-30': '11-30 人',
  '31-100': '31-100 人',
  '100+': '100 人以上',
};

function includesMechanism(
  mechanisms: MechanismRecommendation['mechanism'],
  type: MechanismRecommendation['mechanism'][number],
): boolean {
  return mechanisms.includes(type);
}

function buildMechanismRecommendation(stage: string): MechanismRecommendation {
  if (RESEARCH_PATTERNS.some((pattern) => stage.includes(pattern))) {
    return {
      stage,
      mechanism: ['agent', 'knowledge'],
      rationale: '需要整合多源信息并综合判断，适合 agent 调度配合知识沉淀。',
      action: '接入外部数据源与历史案例库，agent 先出研究草稿，人工确认结论后再流转。',
      whyNotOthers: '单点 skill 只能处理局部生成，无法完成多源研究与综合判断。',
    };
  }

  if (PRODUCTION_PATTERNS.some((pattern) => stage.includes(pattern))) {
    return {
      stage,
      mechanism: ['skill', 'copilot'],
      rationale: '高重复、多变体节点，适合 skill 标准化产出并由 copilot 辅助协同。',
      action: '沉淀标准提示模板，skill 批量产出草稿，copilot 辅助人工微调与定稿。',
      whyNotOthers: '纯 workflow 只完成流转，不直接提升生成效率。',
    };
  }

  if (GATE_PATTERNS.some((pattern) => stage.includes(pattern))) {
    return {
      stage,
      mechanism: ['workflow', 'evaluator', 'human_gate'],
      rationale: '涉及流程流转、规则校验与上线拍板，自动检查与人工把关协同。',
      action: 'workflow 自动流转加规则校验，evaluator 预检风险，人工只在关键节点拍板。',
      whyNotOthers: '让 agent 独立承担最终发布责任不符合风控要求。',
    };
  }

  if (REVIEW_PATTERNS.some((pattern) => stage.includes(pattern))) {
    return {
      stage,
      mechanism: ['loop', 'knowledge'],
      rationale: '复盘类节点需要持续回路与结论沉淀，适合 loop 配合知识库。',
      action: '建立周/月复盘 loop，结论写入知识库，下一轮自动复用，不再靠记忆。',
      whyNotOthers: '单次 skill 产出无法形成持续迭代闭环。',
    };
  }

  return {
    stage,
    mechanism: ['copilot'],
    rationale: '当前信息不足以定义自动化闭环，先从人机协同辅助切入。',
    action: '先从 copilot 人机协同切入，积累样本后再升级到更重机制。',
    whyNotOthers: '规则与责任边界不清晰时，引入更重机制会增加落地成本。',
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function buildReadinessEvidence(
  label: ReadinessScore['label'],
  answers: QuestionnaireAnswer,
): ReadinessScore['evidence'] {
  const aiUsageCount = answers.currentAiUsage.length;
  const teamSize = answers.teamSize || '1-10';
  const hasAiUsage = aiUsageCount > 0;

  if (label === '工具基建') {
    return {
      definition:
        '工具基建不是“有没有买大模型”，而是组织是否有一套能让 AI 稳定参与工作的底座：结构化数据、可追溯的流程状态、统一入口与权限、可复用的模板与知识。',
      signals: [
        '是否有结构化的业务台账（多维表格 / 数据库 / CRM），字段清晰、可关联、状态可追踪',
        '是否能把关键数据从工具里“拿出来用”（导出、API、统一命名、去重）',
        '是否有统一的 AI 使用入口与权限（避免个人各自试、结果不可复用）',
        '是否有基础的知识库与版本管理（术语、规范、模板、案例）',
        '是否具备基本的算力/模型接入与安全配置（脱敏、访问控制、审计）',
      ],
      sampleTitle: '样例数据分析（脱敏）：工具底座盘点',
      sampleRows: [
        {
          metric: '结构化台账覆盖率',
          value: hasAiUsage ? '约 65%（示例）' : '约 35%（示例）',
          insight: '越多环节的输入/输出以字段化方式沉淀，越适合把 AI 从聊天框搬进流程里。',
        },
        {
          metric: '可关联字段完整度',
          value: hasAiUsage ? '中（示例）' : '低（示例）',
          insight: '没有“唯一 ID + 关系字段”，agent 很难跨系统串起上下文，容易输出泛泛建议。',
        },
        {
          metric: '统一入口与权限',
          value: hasAiUsage ? '有但分散（示例）' : '暂无（示例）',
          insight: '建议先定义 1 个“团队默认入口”，把提示模板、数据源与审计放在一起。',
        },
      ],
      note:
        '以上为脱敏示例。进入深度诊断后会进一步给出：字段字典、缺失/重复检测、可自动化数据源清单与建议接入路径。',
    };
  }

  if (label === '组织基建') {
    return {
      definition:
        '组织基建关注“能不能把 AI 改造推进下去”：是否有明确 owner、跨角色协同机制、试点到扩面的节奏，以及把结论变成制度与流程的能力。',
      signals: [
        '是否明确 AI 改造 owner（业务 owner / 产品 / 运营 / IT / 数据）与决策口径',
        '是否有可执行的推进节奏（试点 → 复盘 → 标准化 → 扩面）',
        '跨部门协同链路是否清晰（谁提供数据、谁验收、谁承担风险）',
        '是否有“质量与风控”机制（抽检规则、发布门禁、人类拍板点）',
        '是否能把经验沉淀成模板/检查表，而不是只靠个人经验推进',
      ],
      sampleTitle: '样例数据分析（脱敏）：协同链路与责任分配',
      sampleRows: [
        {
          metric: '关键节点 owner 覆盖',
          value: teamSize === '100+' ? '约 55%（示例）' : '约 75%（示例）',
          insight: 'owner 不清晰时，AI 改造容易停在“各自试用”，很难形成流程级升级。',
        },
        {
          metric: '跨角色交接次数',
          value: teamSize === '100+' ? '高（示例）' : '中（示例）',
          insight: '交接越多，越需要 workflow + 规则校验 + 交付物标准，AI 才能接得住。',
        },
        {
          metric: '复盘闭环频率',
          value: hasAiUsage ? '月度（示例）' : '不固定（示例）',
          insight: '没有固定复盘节奏，AI 方案会“每次从零开始”，难以累积组织收益。',
        },
      ],
      note: '以上为脱敏示例。进入深度诊断后会进一步给出：推进角色图、RACI 草案、试点-扩面节奏建议。',
    };
  }

  if (label === '人才能力') {
    return {
      definition:
        '人才能力不是“会不会写提示词”这么简单，而是团队是否具备把 AI 变成稳定产能的综合能力：问题拆解、提示设计、质量评估、异常处理、以及让 AI 与流程协同。',
      signals: [
        '团队是否形成可复用的提示模板与规范（而不是每个人临时发挥）',
        '是否具备结果评估能力（抽检标准、质量阈值、A/B 对比）',
        '是否知道如何拆任务：skill/agent/workflow/loop/human gate 的边界',
        '是否能对失败案例做复盘（为什么错、怎么补数据/规则/门禁）',
        '是否有人能承担“AI 方案设计”角色（把零散使用变成体系）',
      ],
      sampleTitle: '样例数据分析（脱敏）：团队能力分布',
      sampleRows: [
        {
          metric: 'AI 使用活跃度',
          value: hasAiUsage ? '中高（示例）' : '低（示例）',
          insight: '活跃度决定推广成本；但“活跃”不等于“可控”，还要看是否可复用、可评估。',
        },
        {
          metric: '提示模板复用率',
          value: hasAiUsage ? '约 30%（示例）' : '约 0%（示例）',
          insight: '复用率低说明经验没沉淀，建议先把 TOP3 高价值场景标准化。',
        },
        {
          metric: '质检/门禁覆盖',
          value: '低（示例）',
          insight: '缺少门禁会导致“试用越多，风险越大”，建议为发布/对外环节加 evaluator + human gate。',
        },
      ],
      note: '以上为脱敏示例。进入深度诊断后会进一步给出：角色能力画像、训练清单、模板库优先级与示例提示。',
    };
  }

  return {
    definition:
      '文化治理对应的是组织“政治层面”的开放度与安全边界：允许试错但不失控，愿意用数据复盘而不是用立场争论，也能对 AI 责任边界达成共识。',
    signals: [
      '是否允许在低风险场景快速试点（明确“可试/不可试”范围）',
      '是否鼓励公开分享与复用（而不是个人藏经验、重复造轮子）',
      '是否对失败保持建设性（复盘原因与机制，而不是追责）',
      '是否对合规/风控有共识（数据脱敏、对外发布、用户沟通）',
      '是否能用指标讨论 AI 效果（质量、时效、返工率、成本），而不是凭感觉争论',
    ],
    sampleTitle: '样例数据分析（脱敏）：文化与治理信号',
    sampleRows: [
      {
        metric: '试点推进阻力',
        value: teamSize === '100+' ? '偏高（示例）' : '中（示例）',
        insight: '阻力大时建议先做“协同型 AI”，把权责留在人，降低政治成本。',
      },
      {
        metric: '复盘透明度',
        value: hasAiUsage ? '中（示例）' : '低（示例）',
        insight: '透明度越高，越容易形成可复制方法论，避免每次试点都“从零开始”。',
      },
      {
        metric: '风险边界清晰度',
        value: hasAiUsage ? '中（示例）' : '低（示例）',
        insight: '边界不清晰时，必须先定义 human gate，避免把 AI 直接推到对外责任位。',
      },
    ],
    note: '以上为脱敏示例。进入深度诊断后会进一步给出：风险分级建议、门禁点设计、复盘节奏与指标体系样例。',
  };
}

function buildReadiness(answers: QuestionnaireAnswer): ReadinessScore[] {
  const aiUsageCount = answers.currentAiUsage.length;
  const teamSize = answers.teamSize || '1-10';
  const orgPenalty = TEAM_SIZE_ORG_PENALTY[teamSize];
  const cultureBonus = TEAM_SIZE_CULTURE_BONUS[teamSize];

  const toolSummary =
    aiUsageCount === 0
      ? '尚未形成统一 AI 工具入口，团队各自试探。'
      : `已落地 ${aiUsageCount} 个 AI 场景，缺统一接入与权限管理。`;

  const orgSummary =
    teamSize === '100+' || teamSize === '31-100'
      ? `${TEAM_SIZE_LABEL[teamSize]} 规模，跨角色协同成本高，需明确 owner 与推进机制。`
      : '团队规模较小，协同链路短，可快速决策。';

  const talentSummary =
    aiUsageCount === 0
      ? '团队缺乏系统化提示与审核经验，需先建立基础能力。'
      : '已有上手经验，提示、审核与流程设计能力待系统化。';

  const cultureSummary =
    aiUsageCount === 0
      ? '组织有试用意愿，下一步需补评估标准与复盘节奏。'
      : '试用氛围已形成，需补齐评估标准、复盘节奏与风险边界。';

  return [
    {
      label: '工具基建',
      score: clamp(50 + aiUsageCount * 8, 40, 90),
      summary: toolSummary,
      evidence: buildReadinessEvidence('工具基建', answers),
    },
    {
      label: '组织基建',
      score: clamp(68 + orgPenalty + (aiUsageCount > 0 ? 5 : 0), 40, 85),
      summary: orgSummary,
      evidence: buildReadinessEvidence('组织基建', answers),
    },
    {
      label: '人才能力',
      score: clamp(48 + aiUsageCount * 7, 40, 85),
      summary: talentSummary,
      evidence: buildReadinessEvidence('人才能力', answers),
    },
    {
      label: '文化治理',
      score: clamp(55 + cultureBonus + (aiUsageCount > 0 ? 10 : 0), 40, 80),
      summary: cultureSummary,
      evidence: buildReadinessEvidence('文化治理', answers),
    },
  ];
}

function buildOwnership(
  mechanisms: MechanismRecommendation['mechanism'],
): NodeAnnotation['ownership'] {
  if (includesMechanism(mechanisms, 'human_gate')) {
    return 'hybrid';
  }

  if (
    includesMechanism(mechanisms, 'agent') ||
    includesMechanism(mechanisms, 'routing') ||
    includesMechanism(mechanisms, 'loop')
  ) {
    return 'ai';
  }

  if (
    includesMechanism(mechanisms, 'skill') ||
    includesMechanism(mechanisms, 'copilot') ||
    includesMechanism(mechanisms, 'workflow') ||
    includesMechanism(mechanisms, 'evaluator') ||
    includesMechanism(mechanisms, 'knowledge')
  ) {
    return 'hybrid';
  }

  return 'human';
}

function buildCapabilitySummary(
  stage: string,
  mechanisms: MechanismRecommendation['mechanism'],
): string {
  if (includesMechanism(mechanisms, 'agent')) {
    return `负责 ${stage} 所需的信息检索、比对判断与草稿生成。`;
  }

  if (includesMechanism(mechanisms, 'workflow') && includesMechanism(mechanisms, 'human_gate')) {
    return `负责自动流转、规则校验与异常拦截，人工只处理需要拍板的部分。`;
  }

  if (includesMechanism(mechanisms, 'skill')) {
    return `负责标准化批量生成，先给出可编辑初稿，再交给人工微调。`;
  }

  if (includesMechanism(mechanisms, 'loop')) {
    return `负责持续监测结果表现、沉淀复盘结论，并把经验回写到下一轮。`;
  }

  if (includesMechanism(mechanisms, 'copilot')) {
    return `负责在人工作业过程中提供建议、补全和风险提醒。`;
  }

  return `负责为该环节提供 AI 辅助判断与执行支持。`;
}

function buildStageAssessment(aiUsageCount: number, teamSize: TeamSize | ''): string {
  if (aiUsageCount === 0) {
    return '团队还在零散试探阶段，先围绕核心环节建一个稳定样板。';
  }
  if (teamSize === '100+' || teamSize === '31-100') {
    return '组织规模较大且 AI 已局部落地，下一步是把散点协同升级为流程级。';
  }
  return '团队已有初步 AI 使用习惯，下一步把单点提效收成可复用流程。';
}

function buildInsightHint(aiUsageCount: number): string {
  if (aiUsageCount === 0) {
    return '先围绕核心环节建一个可复制的样板，验证 AI 能稳定接住再扩面。';
  }
  return '已有 AI 使用基础，重点是把单点提效串成流程，并补齐组织准备度。';
}

function matchStageHint(label: string, hints: StageHint[]): StageHint | undefined {
  return hints.find((hint) => label.includes(hint.stage));
}

function buildNodeAnnotation(
  node: FlowNode,
  hints: StageHint[],
  coreNodeId: string,
): NodeAnnotation {
  const recommendation = buildMechanismRecommendation(node.label);
  const hint = matchStageHint(node.label, hints);
  return {
    nodeId: node.id,
    label: node.label,
    input: node.input?.trim() ?? '',
    output: node.output?.trim() ?? '',
    mechanism: recommendation.mechanism,
    rationale: recommendation.rationale,
    action: recommendation.action,
    replaceAction: hint?.replaceAction ?? recommendation.action,
    caseRef: hint?.caseRef ?? '暂无同行业精确案例，参考机制通用落地动作。',
    capabilitySummary: buildCapabilitySummary(node.label, recommendation.mechanism),
    ownership: buildOwnership(recommendation.mechanism),
    isCore: node.id === coreNodeId,
  };
}

const FALLBACK_ANNOTATION: NodeAnnotation = {
  nodeId: '',
  label: '核心环节',
  input: '',
  output: '',
  mechanism: ['copilot'],
  rationale: '选好核心环节后会给出具体接管机制与替代动作。',
  action: '先从 copilot 人机协同切入，积累样本后再升级。',
  replaceAction: '选好核心环节后会给出具体替代的生产环节。',
  caseRef: '暂无同行业精确案例，参考机制通用落地动作。',
  capabilitySummary: '负责先给出辅助建议，再帮助团队确认哪些环节值得优先改造。',
  ownership: 'hybrid',
  isCore: true,
};

export function buildInitialInsight(answers: QuestionnaireAnswer): InitialInsight {
  const aiUsageCount = answers.currentAiUsage.length;
  const hints = getIndustryProfile(answers.industry)?.stageHints ?? [];
  const coreNode = answers.flowGraph.nodes.find((node) => node.id === answers.coreNodeId);
  const coreAnnotation = coreNode
    ? buildNodeAnnotation(coreNode, hints, answers.coreNodeId)
    : FALLBACK_ANNOTATION;

  return {
    stageAssessment: buildStageAssessment(aiUsageCount, answers.teamSize),
    summary: buildInsightHint(aiUsageCount),
    coreAnnotation,
    readiness: buildReadiness(answers),
  };
}

function buildRecommendedCases(answers: QuestionnaireAnswer): IndustryCase[] {
  const profile = getIndustryProfile(answers.industry);
  return profile ? profile.cases : [];
}

function buildMechanismSummary(mechanisms: MechanismRecommendation['mechanism']): string {
  return mechanisms.map((item) => MECHANISM_LABELS[item] ?? item).join(' + ');
}

function buildOptimizedNodeLabel(base: NodeAnnotation): string {
  if (base.ownership === 'ai') {
    if (includesMechanism(base.mechanism, 'agent')) {
      return `${base.label} Agent`;
    }
    if (includesMechanism(base.mechanism, 'loop')) {
      return `${base.label} Loop`;
    }
    if (includesMechanism(base.mechanism, 'routing')) {
      return `${base.label} Routing`;
    }
    return `${base.label} AI 节点`;
  }

  if (includesMechanism(base.mechanism, 'workflow') && includesMechanism(base.mechanism, 'human_gate')) {
    return `${base.label} 把关台`;
  }

  if (includesMechanism(base.mechanism, 'skill')) {
    return `${base.label} AI 生产台`;
  }

  if (includesMechanism(base.mechanism, 'copilot')) {
    return `${base.label} 协同工作台`;
  }

  return `${base.label} 协同节点`;
}

function buildOptimizedInput(base: NodeAnnotation): string {
  if (base.input) {
    return base.input;
  }

  if (base.ownership === 'ai') {
    return `承接 ${base.label} 所需原始信息与上下文`;
  }

  return `承接 ${base.label} 所需输入，并由 AI 先做预处理`;
}

function buildOptimizedOutput(base: NodeAnnotation): string {
  if (base.output) {
    if (base.ownership === 'ai') {
      return `${base.output}（由 AI 先完成，可直接流转）`;
    }

    return `${base.output}（AI 预处理后交人工确认）`;
  }

  if (base.ownership === 'ai') {
    return `${base.label} 所需结论、草稿或决策建议`;
  }

  return `${base.label} 的待确认结果与流转记录`;
}

function buildOptimizedChangeSummary(base: NodeAnnotation): string {
  const mechanismSummary = buildMechanismSummary(base.mechanism);

  if (base.ownership === 'ai') {
    return mechanismSummary
      ? `该节点改为由 ${mechanismSummary} 直接承接，人工只看异常与高风险情况。`
      : '该节点改为由 AI 直接承接，人工只处理异常与高风险情况。';
  }

  if (base.ownership === 'hybrid') {
    return mechanismSummary
      ? `该节点保留人工 owner，由 ${mechanismSummary} 先完成预处理、生成或校验。`
      : '该节点保留人工 owner，由 AI 先完成预处理与辅助。';
  }

  return '该节点仍以人工为主，AI 暂时只提供弱辅助。';
}

function buildOptimizedCaseRef(base: NodeAnnotation): string {
  if (base.ownership === 'ai') {
    return `替代判断：${base.rationale}`;
  }

  return `保留理由：${base.rationale}`;
}

function buildOptimizedArtifacts(
  graph: FlowGraph,
  annotations: NodeAnnotation[],
): Pick<DiagnosticReport, 'optimizedGraph' | 'optimizedAnnotations'> {
  if (graph.nodes.length === 0) {
    return {
      optimizedGraph: { nodes: [], edges: [] },
      optimizedAnnotations: [],
    };
  }

  const optimizedGraph: FlowGraph = { nodes: [], edges: [] };
  const optimizedAnnotations: NodeAnnotation[] = [];
  const annotationMap = new Map(annotations.map((item) => [item.nodeId, item]));

  graph.nodes.forEach((node) => {
    const base = annotationMap.get(node.id);
    if (!base) {
      return;
    }

    const humanNodeId = `optimized-${node.id}-human`;
    const aiNodeId = `optimized-${node.id}-ai`;
    const aiLabel = buildOptimizedNodeLabel(base);

    optimizedGraph.nodes.push({
      id: humanNodeId,
      label: node.label,
      input: base.input ?? '',
      output: base.output ?? '',
      kind: 'stage',
    });
    optimizedGraph.nodes.push({
      id: aiNodeId,
      label: aiLabel,
      input: buildOptimizedInput(base),
      output: buildOptimizedOutput(base),
      kind: 'ai',
    });
    optimizedGraph.edges.push({
      id: `optimized-link-${node.id}`,
      source: humanNodeId,
      target: aiNodeId,
    });

    optimizedAnnotations.push({
      ...base,
      nodeId: humanNodeId,
      label: node.label,
      input: base.input ?? '',
      output: base.output ?? '',
      changeSummary: buildOptimizedChangeSummary(base),
      caseRef: buildOptimizedCaseRef(base),
      isAiNode: false,
      isCore: base.isCore,
    });
    optimizedAnnotations.push({
      ...base,
      nodeId: aiNodeId,
      label: aiLabel,
      input: buildOptimizedInput(base),
      output: buildOptimizedOutput(base),
      changeSummary:
        base.ownership === 'ai'
          ? '该节点由 AI Agent 直接承接，人工仅做抽检与异常处理。'
          : '该节点为 AI 介入层：先产出草稿 / 校验 / 建议，再交给人流转。',
      caseRef: `能力说明：${base.rationale}`,
      isAiNode: true,
      isCore: false,
    });
  });

  graph.edges.forEach((edge) => {
    optimizedGraph.edges.push({
      id: `optimized-flow-${edge.id}`,
      source: `optimized-${edge.source}-ai`,
      target: `optimized-${edge.target}-human`,
    });
  });

  return {
    optimizedGraph,
    optimizedAnnotations,
  };
}

export function buildDiagnosticReport(answers: QuestionnaireAnswer): DiagnosticReport {
  const hints = getIndustryProfile(answers.industry)?.stageHints ?? [];
  const annotations = answers.flowGraph.nodes.map((node) =>
    buildNodeAnnotation(node, hints, answers.coreNodeId),
  );
  const optimized = buildOptimizedArtifacts(answers.flowGraph, annotations);

  return {
    annotations,
    readiness: buildReadiness(answers),
    recommendedCases: buildRecommendedCases(answers),
    optimizedGraph: optimized.optimizedGraph,
    optimizedAnnotations: optimized.optimizedAnnotations,
  };
}
