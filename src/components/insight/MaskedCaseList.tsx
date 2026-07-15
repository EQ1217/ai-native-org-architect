import { MECHANISM_LABELS } from '../../utils/mechanismLabels';
import type { IndustryCase } from '../../types/diagnostic';

interface MaskedCaseListProps {
  cases: IndustryCase[];
}

function maskNumbers(text: string): string {
  return text.replace(/\d+/g, 'XX');
}

export function MaskedCaseList({ cases }: MaskedCaseListProps) {
  return (
    <section className="dashboard-section masked-case-card">
      <p className="section-eyebrow">同行业案例</p>
      <h2>和你情况类似的团队，已经这样改了</h2>
      <p className="masked-case-intro">关键数据已打码，继续下一步可解锁完整案例与对标。</p>

      <div className="masked-case-grid">
        {cases.map((item) => (
          <article key={item.id} className="masked-case-item">
            <div className="masked-case-tags">
              {item.recommendedMechanisms.map((mechanism) => (
                <span key={mechanism}>{MECHANISM_LABELS[mechanism] ?? mechanism}</span>
              ))}
            </div>
            <h3>{item.title}</h3>
            <p>{item.summary}</p>
            <ul>
              {item.painPoints.map((painPoint) => (
                <li key={painPoint}>{painPoint}</li>
              ))}
            </ul>
            <div className="masked-case-outcome">
              <span className="masked-case-outcome-label">效果</span>
              <span className="masked-case-outcome-text">{maskNumbers(item.outcome)}</span>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
