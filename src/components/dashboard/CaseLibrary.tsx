import { SectionHeader } from '../layout/SectionHeader';
import type { IndustryCase, MechanismType } from '../../types/diagnostic';

interface CaseLibraryProps {
  cases: IndustryCase[];
}

const MECHANISM_LABELS: Record<MechanismType, string> = {
  skill: 'Skill',
  copilot: 'Copilot',
  workflow: 'Workflow',
  agent: 'Agent',
  routing: 'Routing',
  parallelization: 'Parallelization',
  evaluator: 'Evaluator',
  knowledge: 'Knowledge',
  human_gate: 'Human Gate',
  loop: 'Loop',
};

export function CaseLibrary({ cases }: CaseLibraryProps) {
  return (
    <section className="dashboard-section case-library-card">
      <SectionHeader
        title="案例库"
        description="同行业已验证的 AI 提效案例，机制和结果都可参考。"
        eyebrow="Cases"
      />

      {cases.length === 0 ? (
        <p className="dashboard-empty">选择行业后会匹配同行业案例。</p>
      ) : null}

      <div className="case-library-grid">
        {cases.map((item) => (
          <article key={item.id} className="case-library-item">
            <div className="case-library-meta">
              <span>{item.teamType}</span>
              <div className="case-library-tags">
                {item.recommendedMechanisms.map((mechanism) => (
                  <span key={mechanism}>{MECHANISM_LABELS[mechanism]}</span>
                ))}
              </div>
            </div>
            <h3>{item.title}</h3>
            <p>{item.summary}</p>
            <ul>
              {item.painPoints.map((painPoint) => (
                <li key={painPoint}>{painPoint}</li>
              ))}
            </ul>
            <strong>{item.outcome}</strong>
          </article>
        ))}
      </div>
    </section>
  );
}
