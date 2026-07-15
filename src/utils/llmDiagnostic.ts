import type {
  DiagnosticReport,
  FlowEdge,
  LlmGeneratedNode,
  LlmReportEnhancement,
  NodeAnnotation,
  QuestionnaireAnswer,
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

  enhancement.readiness?.forEach((item) => {
    const target = merged.readiness.find((entry) => entry.label === item.label);
    if (!target) {
      return;
    }

    if (item.summary) {
      target.summary = item.summary;
    }

    if (item.note) {
      target.evidence.note = item.note;
    }
  });

  enhancement.annotations?.forEach((item) => {
    const target = merged.annotations.find((entry) => entry.nodeId === item.nodeId);
    if (!target) {
      return;
    }

    if (item.rationale) {
      target.rationale = item.rationale;
    }
    if (item.action) {
      target.action = item.action;
    }
    if (item.replaceAction) {
      target.replaceAction = item.replaceAction;
    }
    if (item.caseRef) {
      target.caseRef = item.caseRef;
    }
    if (item.capabilitySummary) {
      target.capabilitySummary = item.capabilitySummary;
    }
    if (item.changeSummary) {
      target.changeSummary = item.changeSummary;
    }
    if (item.ownership) {
      target.ownership = item.ownership;
    }
  });

  enhancement.generatedNodes?.forEach((item, index) => {
    applyGeneratedNode(merged, item, index);
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

  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), 30000);

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
