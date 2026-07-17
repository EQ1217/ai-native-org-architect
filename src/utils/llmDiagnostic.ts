import type {
  DiagnosticReport,
  FlowEdge,
  FlowGraph,
  FlowNode,
  LlmGeneratedNode,
  LlmReportEnhancement,
  NodeAnnotation,
  NodeChangeType,
  QuestionnaireAnswer,
  ReadinessDimension,
  ReadinessScore,
} from '../types/diagnostic';

interface LlmEnhanceResponse {
  enhancement?: LlmReportEnhancement;
}

function cloneReport(report: DiagnosticReport): DiagnosticReport {
  return {
    annotations: report.annotations.map((item) => ({ ...item })),
    readiness: report.readiness.map((item) => ({
      ...item,
      evidence: {
        ...item.evidence,
        signals: [...item.evidence.signals],
        sampleRows: item.evidence.sampleRows.map((row) => ({ ...row })),
      },
    })),
    recommendedCases: [...report.recommendedCases],
    optimizedGraph: {
      nodes: report.optimizedGraph.nodes.map((node) => ({ ...node })),
      edges: report.optimizedGraph.edges.map((edge) => ({ ...edge })),
    },
    optimizedAnnotations: report.optimizedAnnotations.map((item) => ({ ...item })),
  };
}

function applyGeneratedNode(
  report: DiagnosticReport,
  generated: LlmGeneratedNode,
  index: number,
) {
  const anchorId = `optimized-${generated.anchorNodeId}-human`;
  const anchorNode = report.optimizedGraph.nodes.find((node) => node.id === anchorId);

  if (!anchorNode) {
    return;
  }

  const newNodeId = `optimized-${generated.anchorNodeId}-llm-${index}`;
  if (report.optimizedGraph.nodes.some((node) => node.id === newNodeId)) {
    return;
  }

  report.optimizedGraph.nodes.push({
    id: newNodeId,
    label: generated.label,
    input: generated.input,
    output: generated.output,
    kind: 'ai',
  });

  const oldOutgoing = report.optimizedGraph.edges.filter((edge) => edge.source === anchorId);
  const retainedEdges = report.optimizedGraph.edges.filter((edge) => edge.source !== anchorId);
  const rewiredOutgoing: FlowEdge[] = oldOutgoing.map((edge) => ({
    ...edge,
    source: newNodeId,
  }));

  report.optimizedGraph.edges = [
    ...retainedEdges,
    {
      id: `${anchorId}-${newNodeId}`,
      source: anchorId,
      target: newNodeId,
    },
    ...rewiredOutgoing,
  ];

  const annotation: NodeAnnotation = {
    nodeId: newNodeId,
    label: generated.label,
    input: generated.input,
    output: generated.output,
    mechanism: generated.mechanism,
    rationale: generated.rationale,
    action: generated.action,
    replaceAction: generated.replaceAction,
    caseRef: generated.caseRef,
    capabilitySummary: generated.capabilitySummary,
    changeSummary: generated.changeSummary,
    ownership: generated.ownership,
    isAiNode: true,
    isCore: false,
  };

  report.optimizedAnnotations.push(annotation);
}

export function mergeLlmEnhancement(
  fallbackReport: DiagnosticReport,
  enhancement: LlmReportEnhancement,
): DiagnosticReport {
  const merged = cloneReport(fallbackReport);
  merged.isAiEnhanced = true;
  merged.reportHeadline = enhancement.reportHeadline ?? merged.reportHeadline;
  merged.reportNarrative = enhancement.reportNarrative ?? merged.reportNarrative;
  merged.modelNotes = enhancement.modelNotes ?? merged.modelNotes;

  enhancement.readiness?.forEach((item) => {
    const target = merged.readiness.find((entry) => entry.label === item.label);
    if (!target) {
      return;
    }

    let enhanced = false;

    if (item.summary) {
      target.summary = item.summary;
      enhanced = true;
    }

    if (item.note) {
      target.evidence.note = item.note;
      enhanced = true;
    }

    if (enhanced) {
      target.isAiEnhanced = true;
    }
  });

  enhancement.annotations?.forEach((item) => {
    const target = merged.annotations.find((entry) => entry.nodeId === item.nodeId);
    if (!target) {
      return;
    }

    const enhancedFields: string[] = [];

    if (item.rationale) {
      target.rationale = item.rationale;
      enhancedFields.push('rationale');
    }
    if (item.action) {
      target.action = item.action;
      enhancedFields.push('action');
    }
    if (item.replaceAction) {
      target.replaceAction = item.replaceAction;
      enhancedFields.push('replaceAction');
    }
    if (item.caseRef) {
      target.caseRef = item.caseRef;
      enhancedFields.push('caseRef');
    }
    if (item.capabilitySummary) {
      target.capabilitySummary = item.capabilitySummary;
      enhancedFields.push('capabilitySummary');
    }
    if (item.changeSummary) {
      target.changeSummary = item.changeSummary;
      enhancedFields.push('changeSummary');
    }
    if (item.ownership) {
      target.ownership = item.ownership;
      enhancedFields.push('ownership');
    }

    if (enhancedFields.length > 0) {
      target.isAiEnhanced = true;
      target.enhancedFields = enhancedFields;
    }
  });

  enhancement.generatedNodes?.forEach((item, index) => {
    applyGeneratedNode(merged, item, index);
  });

  merged.optimizedAnnotations.forEach((annotation) => {
    const baseId = annotation.nodeId.replace(/^optimized-/, '').replace(/-(human|ai)$/, '');
    const sourceAnnotation = merged.annotations.find((a) => a.nodeId === baseId);
    if (sourceAnnotation?.isAiEnhanced) {
      annotation.isAiEnhanced = true;
      annotation.enhancedFields = sourceAnnotation.enhancedFields;
    }
    if (annotation.nodeId.includes('-llm-')) {
      annotation.isAiEnhanced = true;
      annotation.enhancedFields = ['generated'];
    }
  });

  return merged;
}

export async function requestLlmEnhancedReport(
  answers: QuestionnaireAnswer,
  fallbackReport: DiagnosticReport,
): Promise<DiagnosticReport | null> {
  if (import.meta.env.MODE === 'test') {
    return null;
  }

  // 与后端 api/diagnose.js 的 maxDuration(60s) 对齐，避免前端先于后端 abort
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), 60000);

  try {
    const response = await fetch('/api/diagnose', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        answers,
        fallbackReport,
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      return null;
    }

    const payload = (await response.json()) as LlmEnhanceResponse;
    if (!payload.enhancement) {
      return null;
    }

    return mergeLlmEnhancement(fallbackReport, payload.enhancement);
  } catch {
    return null;
  } finally {
    window.clearTimeout(timeoutId);
  }
}

interface LlmGenerateResponse {
  report?: {
    reportHeadline?: string;
    reportNarrative?: string;
    readiness?: Array<{
      label: string;
      score?: number;
      summary?: string;
      note?: string;
    }>;
    optimizedGraph?: {
      nodes: Array<{
        id: string;
        label: string;
        input?: string;
        output?: string;
        kind?: string;
        changeType?: string;
        mergedFrom?: string[];
        changeNote?: string;
      }>;
      edges: Array<{ id: string; source: string; target: string }>;
    };
    optimizedAnnotations?: NodeAnnotation[];
    modelNotes?: string[];
  };
}

function normalizeReadinessScore(score: number | undefined): number {
  if (score === undefined || score === null) return 50;
  return Math.max(0, Math.min(100, Math.round(score)));
}

export async function requestLlmFullGenerate(
  answers: QuestionnaireAnswer,
  fallbackReport: DiagnosticReport,
): Promise<DiagnosticReport | null> {
  if (import.meta.env.MODE === 'test') {
    return null;
  }

  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), 60000);

  try {
    const response = await fetch('/api/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        answers,
        fallbackReport,
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      return null;
    }

    const payload = (await response.json()) as LlmGenerateResponse;
    if (!payload.report) {
      return null;
    }

    const llmReport = payload.report;

    const readiness: ReadinessScore[] = (llmReport.readiness || []).map((item) => {
      const fallback = fallbackReport.readiness.find((r) => r.label === item.label);
      return {
        label: (item.label as ReadinessDimension) || fallback?.label || '工具基建',
        score: normalizeReadinessScore(item.score),
        summary: item.summary || fallback?.summary || '',
        evidence: {
          definition: fallback?.evidence.definition || '',
          signals: fallback?.evidence.signals || [],
          sampleTitle: fallback?.evidence.sampleTitle || '',
          sampleRows: fallback?.evidence.sampleRows || [],
          note: item.note || fallback?.evidence.note || '',
        },
        isAiEnhanced: true,
      };
    });

    const labels: ReadinessDimension[] = ['工具基建', '组织基建', '人才能力', '文化治理'];
    const existingLabels = new Set(readiness.map((r) => r.label));
    labels.forEach((label) => {
      if (!existingLabels.has(label)) {
        const fallback = fallbackReport.readiness.find((r) => r.label === label);
        if (fallback) {
          readiness.push(fallback);
        }
      }
    });

    const validChangeTypes: NodeChangeType[] = ['added', 'modified', 'merged', 'same'];

    const optimizedGraph: FlowGraph = {
      nodes: (llmReport.optimizedGraph?.nodes || fallbackReport.optimizedGraph.nodes).map(
        (node) => ({
          ...node,
          kind: (node.kind as FlowNode['kind']) || 'stage',
          changeType: validChangeTypes.includes(node.changeType as NodeChangeType)
            ? (node.changeType as NodeChangeType)
            : undefined,
          mergedFrom: node.mergedFrom && Array.isArray(node.mergedFrom)
            ? node.mergedFrom
            : undefined,
          changeNote: node.changeNote,
        }),
      ),
      edges: llmReport.optimizedGraph?.edges || fallbackReport.optimizedGraph.edges,
    };
    const optimizedAnnotations: NodeAnnotation[] = (llmReport.optimizedAnnotations || []).map(
      (annotation) => ({
        ...annotation,
        isAiEnhanced: true,
        enhancedFields: ['generated'],
      }),
    );

    const report: DiagnosticReport = {
      annotations: fallbackReport.annotations,
      readiness,
      recommendedCases: fallbackReport.recommendedCases,
      optimizedGraph,
      optimizedAnnotations,
      isAiEnhanced: true,
      reportHeadline: llmReport.reportHeadline,
      reportNarrative: llmReport.reportNarrative,
      modelNotes: llmReport.modelNotes,
    };

    return report;
  } catch {
    return null;
  } finally {
    window.clearTimeout(timeoutId);
  }
}

export interface DataAnalysisFinding {
  title: string;
  description: string;
  level: 'positive' | 'negative' | 'neutral';
}

export interface EfficiencyMetric {
  name: string;
  value: string;
  benchmark: string;
  status: 'excellent' | 'good' | 'warning' | 'danger';
}

export interface DataAnalysisResult {
  summary: string;
  keyFindings: DataAnalysisFinding[];
  efficiencyMetrics: EfficiencyMetric[];
  bottlenecks: string[];
  recommendations: string[];
  aiOpportunities: string[];
}

interface LlmDataAnalysisResponse {
  analysis?: DataAnalysisResult;
}

export async function requestLlmDataAnalysis(
  answers: QuestionnaireAnswer,
): Promise<DataAnalysisResult | null> {
  if (import.meta.env.MODE === 'test') {
    return null;
  }

  if (!answers.uploadedData) {
    return null;
  }

  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), 45000);

  try {
    const response = await fetch('/api/analyze-data', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        answers,
        uploadedData: answers.uploadedData,
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      return null;
    }

    const payload = (await response.json()) as LlmDataAnalysisResponse;
    return payload.analysis || null;
  } catch {
    return null;
  } finally {
    window.clearTimeout(timeoutId);
  }
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatResponse {
  reply: string;
  optimizedGraph: FlowGraph;
  annotations: NodeAnnotation[];
  readiness: ReadinessScore[];
}

export interface ChatResult {
  success: boolean;
  data?: ChatResponse;
  error?: string;
  errorType?: 'http' | 'parse' | 'network' | 'timeout' | 'unknown';
}

export async function requestLlmChat(
  answers: QuestionnaireAnswer,
  currentGraph: FlowGraph,
  currentAnnotations: NodeAnnotation[],
  userMessage: string,
  fallbackReadiness: ReadinessScore[],
): Promise<ChatResult> {
  if (import.meta.env.MODE === 'test') {
    return { success: false, error: '测试模式', errorType: 'unknown' };
  }

  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), 60000);

  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        answers,
        uploadedData: answers.uploadedData,
        currentGraph,
        currentAnnotations,
        userMessage,
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      console.error('[Chat API] HTTP error:', response.status, errorText);
      return {
        success: false,
        error: `HTTP ${response.status}: ${errorText || '请求失败'}`,
        errorType: 'http',
      };
    }

    const payload = (await response.json()) as ChatResponse;
    console.log('[Chat API] response payload:', payload);

    if (!payload || !payload.optimizedGraph) {
      console.error('[Chat API] invalid payload, missing optimizedGraph');
      return {
        success: false,
        error: '返回数据格式不正确',
        errorType: 'parse',
      };
    }

    const validChangeTypes: NodeChangeType[] = ['added', 'modified', 'merged', 'same'];

    const normalizedGraph: FlowGraph = {
      nodes: (payload.optimizedGraph.nodes || currentGraph.nodes).map((node) => ({
        ...node,
        kind: (node.kind as FlowNode['kind']) || 'stage',
        changeType: validChangeTypes.includes(node.changeType as NodeChangeType)
          ? (node.changeType as NodeChangeType)
          : undefined,
        mergedFrom: node.mergedFrom && Array.isArray(node.mergedFrom)
          ? node.mergedFrom
          : undefined,
        changeNote: node.changeNote,
      })),
      edges: payload.optimizedGraph.edges || currentGraph.edges,
    };

    const normalizedAnnotations: NodeAnnotation[] = (
      payload.annotations || currentAnnotations
    ).map((annotation) => ({
      ...annotation,
      isAiEnhanced: true,
      enhancedFields: ['generated'],
    }));

    const normalizedReadiness: ReadinessScore[] = (payload.readiness || []).map(
      (item) => {
        const fallback = fallbackReadiness.find((r) => r.label === item.label);
        const fallbackEvidence = fallback?.evidence;
        return {
          label: (item.label as ReadinessDimension) || fallback?.label || '工具基建',
          score: normalizeReadinessScore(item.score),
          summary: item.summary || fallback?.summary || '',
          evidence: {
            definition: fallbackEvidence?.definition || '',
            signals: fallbackEvidence?.signals || [],
            sampleTitle: fallbackEvidence?.sampleTitle || '',
            sampleRows: fallbackEvidence?.sampleRows || [],
            note: item.evidence?.note || fallbackEvidence?.note || '',
          },
          isAiEnhanced: true,
        };
      },
    );

    const labels: ReadinessDimension[] = ['工具基建', '组织基建', '人才能力', '文化治理'];
    const existingLabels = new Set(normalizedReadiness.map((r) => r.label));
    labels.forEach((label) => {
      if (!existingLabels.has(label)) {
        const fallback = fallbackReadiness.find((r) => r.label === label);
        if (fallback) {
          normalizedReadiness.push(fallback);
        }
      }
    });

    return {
      success: true,
      data: {
        reply: payload.reply || '已完成调整',
        optimizedGraph: normalizedGraph,
        annotations: normalizedAnnotations,
        readiness: normalizedReadiness,
      },
    };
  } catch (error) {
    console.error('[Chat API] request failed:', error);
    const message = error instanceof Error ? error.message : String(error);
    const isTimeout = message.includes('AbortError') || message.includes('timeout');
    return {
      success: false,
      error: message,
      errorType: isTimeout ? 'timeout' : 'unknown',
    };
  } finally {
    window.clearTimeout(timeoutId);
  }
}
