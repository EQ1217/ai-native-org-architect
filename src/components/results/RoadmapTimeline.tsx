import { SectionHeader } from '../layout/SectionHeader';
import type { NodeAnnotation, ReadinessScore } from '../../types/diagnostic';

interface RoadmapTimelineProps {
  annotations: NodeAnnotation[];
  readiness: ReadinessScore[];
}

interface RoadmapCard {
  phase: string;
  title: string;
  focus: string;
  actions: string[];
}

function buildRoadmapCards(
  annotations: NodeAnnotation[],
  readiness: ReadinessScore[],
): RoadmapCard[] {
  const core = annotations.find((item) => item.isCore) ?? annotations[0];
  const second = annotations.find((item) => item !== core) ?? annotations[1];
  const firstStage = core?.label ?? '高频业务节点';
  const secondStage = second?.label ?? '上下游协作节点';
  const weakestReadiness = [...readiness].sort((left, right) => left.score - right.score)[0]?.label ?? '组织基建';
  const firstMechanism =
    core?.mechanism.map((item) => item.toUpperCase()).join(' / ') ?? 'WORKFLOW / HUMAN GATE';

  return [
    {
      phase: '30 天',
      title: '试点收窄到能快速出结果的节点',
      focus: `围绕 ${firstStage} 建样板，不铺满全流程。`,
      actions: [
        `把 ${firstStage} 的输入、输出、责任人和审核标准整理成一页操作模板。`,
        `选 1 个典型业务样本，验证 ${firstMechanism} 能否稳定接住。`,
        `给 ${weakestReadiness} 指定 owner，补齐权限、协作节奏或验收口径。`,
      ],
    },
    {
      phase: '60 天',
      title: '从单点提效升级到流程协同',
      focus: `把 ${firstStage} 和 ${secondStage} 串起来，减少返工和等待。`,
      actions: [
        '固定上下游交接字段，避免每次重讲上下文。',
        '为关键节点配知识库、提示模板和异常回退规则，让协作可复制。',
        '周度复盘样板流程的产能、质量和人工介入点，决定哪里继续自动化。',
      ],
    },
    {
      phase: '90 天',
      title: '把试点沉淀成可持续迭代的机制',
      focus: '试点经验沉淀为标准机制，准备向更多岗位和场景扩展。',
      actions: [
        '把最佳实践沉淀为岗位 SOP、审核清单和案例库，不再依赖个人记忆。',
        '建立月度复盘 loop，持续看转化、质量和风险指标。',
        '带真实样本进专家诊断，定下一批可改造节点和职责重排方案。',
      ],
    },
  ];
}

export function RoadmapTimeline({ annotations, readiness }: RoadmapTimelineProps) {
  const roadmapCards = buildRoadmapCards(annotations, readiness);

  return (
    <section className="dashboard-section roadmap-card">
      <SectionHeader
        title="30 / 60 / 90 天改造路线图"
        description="沿着诊断出的核心与相邻节点，按试点、协同、扩面三步推进。"
        eyebrow="改造路线"
      />

      <div className="roadmap-grid">
        {roadmapCards.map((card) => (
          <article key={card.phase} className="roadmap-phase-card">
            <p className="roadmap-phase-label">{card.phase}</p>
            <h3>{card.title}</h3>
            <p className="roadmap-phase-focus">{card.focus}</p>
            <ul>
              {card.actions.map((action) => (
                <li key={action}>{action}</li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    </section>
  );
}
