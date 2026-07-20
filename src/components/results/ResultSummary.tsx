import { SectionHeader } from '../layout/SectionHeader';
import type { NodeAnnotation, ReadinessScore } from '../../types/diagnostic';

interface ResultSummaryProps {
  teamType: string;
  coreAnnotation: NodeAnnotation;
  readiness: ReadinessScore[];
  aiUsageCount: number;
}

function buildStageAssessment(aiUsageCount: number): string {
  if (aiUsageCount <= 0) {
    return '团队还在零散试探阶段，先围绕核心环节建一个稳定样板。';
  }
  return '团队已有初步 AI 使用习惯，下一步把单点提效收成可复用流程。';
}

function buildReadinessConclusion(readiness: ReadinessScore[]): string {
  const sorted = [...readiness].sort((left, right) => right.score - left.score);
  return `组织处于"工具先行、组织补课"阶段：${sorted[0].label} 领先，${sorted[sorted.length - 1].label} 是规模化改造前最该补的短板。`;
}

export function ResultSummary({
  teamType,
  coreAnnotation,
  readiness,
  aiUsageCount,
}: ResultSummaryProps) {
  const stageAssessment = buildStageAssessment(aiUsageCount);
  const readinessConclusion = buildReadinessConclusion(readiness);

  return (
    <section className="dashboard-section result-summary-card">
      <SectionHeader
        title="当前状态评估"
        description={`基于 ${teamType} 的业务流、AI 使用习惯与组织准备度。`}
        eyebrow="现状评估"
      />

      <div className="result-summary-grid">
        <article className="result-assessment-highlight">
          <p className="result-assessment-label">阶段判断</p>
          <h3>{stageAssessment}</h3>
          <p>
            核心环节「{coreAnnotation.label}」先用对应机制建样板，验证能稳定接住再扩面。
          </p>
        </article>

        <article className="result-assessment-panel">
          <p className="result-assessment-label">核心环节方案</p>
          <ul className="result-priority-list">
            <li>
              <strong>{coreAnnotation.label}</strong>
              <span>{coreAnnotation.replaceAction}</span>
              <small className="result-priority-rationale">{coreAnnotation.caseRef}</small>
            </li>
          </ul>
        </article>

        <article className="result-assessment-panel">
          <p className="result-assessment-label">准备度总结</p>
          <p className="result-readiness-conclusion">{readinessConclusion}</p>
          <div className="result-readiness-tags" aria-label="组织准备度评分">
            {readiness.map((item) => (
              <span key={item.label}>
                {item.label} {item.score}
              </span>
            ))}
          </div>
        </article>
      </div>
    </section>
  );
}
