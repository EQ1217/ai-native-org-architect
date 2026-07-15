import { SectionHeader } from '../layout/SectionHeader';
import type { TeamSize } from '../../types/diagnostic';

interface InsightMetricsProps {
  teamSize: TeamSize | '';
  coreStage: string;
  aiUsageCount: number;
  caseCount: number;
}

const TEAM_SIZE_LABEL: Record<TeamSize, string> = {
  '1-10': '1-10 人',
  '11-30': '11-30 人',
  '31-100': '31-100 人',
  '100+': '100 人以上',
};

export function InsightMetrics({
  teamSize,
  coreStage,
  aiUsageCount,
  caseCount,
}: InsightMetricsProps) {
  const metrics = [
    {
      label: '团队规模',
      value: teamSize ? TEAM_SIZE_LABEL[teamSize] : '-',
      detail: '判断组织基建复杂度',
    },
    {
      label: '核心环节',
      value: coreStage || '-',
      detail: '由你在业务流图中点击指定的优先诊断环节',
    },
    {
      label: '已用 AI 场景',
      value: `${aiUsageCount} 项`,
      detail: '团队已有的 AI 使用基础',
    },
    {
      label: '匹配案例',
      value: `${caseCount} 组`,
      detail: '同行业可参考的落地案例',
    },
  ];

  return (
    <section className="dashboard-section insight-card">
      <SectionHeader
        title="关键指标"
        description="一眼看清本轮诊断的关键数字。"
        eyebrow="Insights"
      />

      <div className="insight-metrics-grid">
        {metrics.map((metric) => (
          <article key={metric.label} className="insight-metric-item">
            <p>{metric.label}</p>
            <strong>{metric.value}</strong>
            <span>{metric.detail}</span>
          </article>
        ))}
      </div>
    </section>
  );
}
