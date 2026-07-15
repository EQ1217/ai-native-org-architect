import { describe, expect, it } from 'vitest';
import { defaultAnswers, getIndustryProfile } from '../data/industryProfiles';
import type { FlowGraph, QuestionnaireAnswer } from '../types/diagnostic';
import { buildDiagnosticReport, buildInitialInsight } from './diagnosticEngine';

function buildLinearGraph(workflow: string[]): FlowGraph {
  return {
    nodes: workflow.map((label, index) => ({
      id: `stage-${index}`,
      label,
      input: index === 1 ? '热点趋势、竞品素材' : '',
      output: index === 1 ? '内容成稿、复盘结论' : '',
      kind: 'stage',
    })),
    edges: workflow.slice(1).map((_, index) => ({
      id: `edge-${index}`,
      source: `stage-${index}`,
      target: `stage-${index + 1}`,
    })),
  };
}

const contentAnswers: QuestionnaireAnswer = {
  industry: 'content-marketing',
  teamType: '新媒体增长团队',
  teamSize: '11-30',
  coreNodeId: 'stage-1',
  flowGraph: buildLinearGraph(getIndustryProfile('content-marketing')!.defaultWorkflow),
  currentAiUsage: ['爆款标题生成', '短视频口播稿改写'],
};

describe('buildInitialInsight', () => {
  it('returns core annotation with mechanism, replace action and case ref', () => {
    const insight = buildInitialInsight(contentAnswers);

    expect(insight.coreAnnotation.label).toBe('趋势研究');
    expect(insight.coreAnnotation.mechanism).toContain('agent');
    expect(insight.coreAnnotation.replaceAction).toContain('agent');
    expect(insight.coreAnnotation.caseRef).toContain('案例');
    expect(insight.coreAnnotation.input).toContain('热点趋势');
    expect(insight.coreAnnotation.isCore).toBe(true);
    expect(insight.readiness).toHaveLength(4);
    expect(insight.readiness[0].label).toBe('工具基建');
  });

  it('handles empty answers with fallback', () => {
    const insight = buildInitialInsight(defaultAnswers);

    expect(insight.coreAnnotation.label).toBe('核心环节');
    expect(insight.readiness).toHaveLength(4);
  });
});

describe('buildDiagnosticReport', () => {
  it('annotates every node and marks core', () => {
    const report = buildDiagnosticReport(contentAnswers);

    expect(report.annotations).toHaveLength(contentAnswers.flowGraph.nodes.length);
    const core = report.annotations.find((item) => item.isCore);
    expect(core?.label).toBe('趋势研究');
    expect(core?.replaceAction).toContain('agent');
    expect(report.optimizedGraph.nodes.length).toBe(contentAnswers.flowGraph.nodes.length * 2);
    expect(report.optimizedAnnotations.some((item) => item.isAiNode)).toBe(true);
    expect(report.optimizedAnnotations.some((item) => item.capabilitySummary?.includes('负责'))).toBe(true);
  });

  it('matches cases by industry', () => {
    const contentReport = buildDiagnosticReport(contentAnswers);
    const rdReport = buildDiagnosticReport({
      ...contentAnswers,
      industry: 'r-and-d',
      teamType: '产品研发团队',
      coreNodeId: 'stage-3',
      flowGraph: buildLinearGraph(getIndustryProfile('r-and-d')!.defaultWorkflow),
    });

    expect(
      contentReport.recommendedCases.every((item) => item.industry === 'content-marketing'),
    ).toBe(true);
    expect(rdReport.recommendedCases.every((item) => item.industry === 'r-and-d')).toBe(true);
  });

  it('returns empty annotations and cases for empty answers', () => {
    const report = buildDiagnosticReport(defaultAnswers);

    expect(report.annotations).toEqual([]);
    expect(report.recommendedCases).toEqual([]);
    expect(report.optimizedGraph.nodes).toEqual([]);
    expect(report.optimizedAnnotations).toEqual([]);
    expect(report.readiness).toHaveLength(4);
  });
});
