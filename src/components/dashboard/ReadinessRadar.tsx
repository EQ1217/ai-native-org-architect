import { SectionHeader } from '../layout/SectionHeader';
import type { ReadinessScore } from '../../types/diagnostic';

interface ReadinessRadarProps {
  readiness: ReadinessScore[];
}

export function ReadinessRadar({ readiness }: ReadinessRadarProps) {
  return (
    <section className="dashboard-section readiness-card">
      <SectionHeader
        title="深度洞察预览：你会得到什么"
        description="下面是脱敏样例预览，用来展示下一层会解锁哪些组织洞察、问题拆解与分析报表。"
        eyebrow="就绪度预览"
      />

      <div className="readiness-preview-callout">
        <p className="readiness-preview-title">这不是当前问答阶段的最终判断，而是补齐关键业务明细后会进一步生成的深度洞察样例。</p>
        <p className="readiness-preview-copy">
          届时系统会结合流程数据、协作记录、业务台账或内容明细，补充字段质量、协同链路、能力分布、门禁风险与优化优先级等更细的分析。
        </p>
      </div>

      <div className="readiness-compact">
        {readiness.map((item) => (
          <article key={item.label} className="readiness-chip">
            <div className="readiness-chip-top">
              <p>{item.label}</p>
              <strong>{item.score}</strong>
            </div>
            <div className="readiness-progress" aria-hidden="true">
              <span style={{ width: `${item.score}%` }} />
            </div>
            <p className="readiness-summary">{item.summary}</p>
          </article>
        ))}
      </div>

      <div className="readiness-details">
        {readiness.map((item) => (
          <details key={item.label} className="readiness-detail">
            <summary className="readiness-detail-summary">
              <span className="readiness-detail-title">{item.label}</span>
              <span className="readiness-detail-score">{item.score}</span>
              <span className="readiness-detail-hint">展开查看分析样例</span>
            </summary>

            <div className="readiness-detail-body">
              <p className="readiness-definition">{item.evidence.definition}</p>
              <ul className="readiness-signals">
                {item.evidence.signals.map((signal) => (
                  <li key={signal}>{signal}</li>
                ))}
              </ul>

              <div className="readiness-sample">
                <p className="readiness-sample-title">{item.evidence.sampleTitle}</p>
                <div className="readiness-sample-table-wrap">
                  <table className="readiness-sample-table">
                    <thead>
                      <tr>
                        <th scope="col">指标</th>
                        <th scope="col">脱敏示例值</th>
                        <th scope="col">解释</th>
                      </tr>
                    </thead>
                    <tbody>
                      {item.evidence.sampleRows.map((row) => (
                        <tr key={row.metric}>
                          <td>{row.metric}</td>
                          <td>{row.value}</td>
                          <td>{row.insight}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="readiness-note">{item.evidence.note}</p>
              </div>
            </div>
          </details>
        ))}
      </div>
    </section>
  );
}
