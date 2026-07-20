import { useCallback, useMemo, useState } from 'react';
import { Icon } from '../icons';
import type { QuestionnaireAnswer, UploadedDataSummary } from '../../types/diagnostic';
import {
  requestLlmDataAnalysis,
  type DataAnalysisResult,
} from '../../utils/llmDiagnostic';

interface DataSummaryCardProps {
  data: UploadedDataSummary;
  answers: QuestionnaireAnswer;
}

const CHART_COLORS = [
  'oklch(0.40 0.12 55)',
  'oklch(0.48 0.10 55)',
  'oklch(0.56 0.09 55)',
  'oklch(0.64 0.07 55)',
  'oklch(0.72 0.05 55)',
  'oklch(0.78 0.04 55)',
];

function classifyColumns(data: UploadedDataSummary) {
  const numericSet = new Set(data.numericColumns.map((c) => c.name));
  const categorical: Array<{ name: string; values: Array<{ value: string; count: number }> }> = [];

  if (data.allRows.length > 0 && data.columns.length > 0) {
    data.columns.forEach((col) => {
      if (numericSet.has(col)) return;
      const counts: Record<string, number> = {};
      data.allRows.forEach((row) => {
        const val = row[col]?.toString().trim() || '(空)';
        counts[val] = (counts[val] || 0) + 1;
      });
      const uniqueVals = Object.keys(counts).length;
      if (uniqueVals >= 2 && uniqueVals <= 10) {
        categorical.push({
          name: col,
          values: Object.entries(counts)
            .map(([value, count]) => ({ value, count }))
            .sort((a, b) => b.count - a.count),
        });
      }
    });
  }

  // 优先选更有业务含义的列（优先级/状态），不要选负责人这类
  categorical.sort((a, b) => {
    const priorityCols = ['优先级', '状态'];
    const aPriority = priorityCols.indexOf(a.name);
    const bPriority = priorityCols.indexOf(b.name);
    if (aPriority !== -1 && bPriority !== -1) return aPriority - bPriority;
    if (aPriority !== -1) return -1;
    if (bPriority !== -1) return 1;
    return 0;
  });

  return { numeric: data.numericColumns, categorical };
}

function computeDerivedInsights(data: UploadedDataSummary): Array<{ label: string; value: string; hint: string }> {
  const insights: Array<{ label: string; value: string; hint: string }> = [];

  const findCol = (keywords: string[]) =>
    data.numericColumns.find((c) =>
      keywords.some((k) => c.name.toLowerCase().includes(k.toLowerCase())),
    );

  const estimated = findCol(['预估', '预计', '计划', '预算']);
  const actual = findCol(['实际', '真实', '已用', '花费']);
  const bugs = findCol(['bug', '缺陷', '问题', '故障']);
  const codeLines = findCol(['代码行', '代码量', '行数', 'loc']);
  const size = findCol(['规模', '大小', 'story', '点数', '复杂度']);

  if (estimated && actual && estimated.avg !== undefined && actual.avg !== undefined) {
    const deviation = ((actual.avg - estimated.avg) / (estimated.avg || 1)) * 100;
    const sign = deviation >= 0 ? '+' : '';
    insights.push({
      label: '平均工期偏差',
      value: `${sign}${deviation.toFixed(1)}%`,
      hint: deviation >= 0 ? '实际耗时普遍超出预估' : '实际耗时普遍低于预估',
    });
  }

  if (bugs && codeLines && bugs.avg !== undefined && codeLines.avg !== undefined && codeLines.avg > 0) {
    const density = (bugs.avg / (codeLines.avg / 1000));
    insights.push({
      label: '千行代码缺陷率',
      value: `${density.toFixed(2)} 个/KLOC`,
      hint: '每千行代码平均引入的缺陷数量',
    });
  }

  if (codeLines && actual && codeLines.avg !== undefined && actual.avg !== undefined && actual.avg > 0) {
    const perDay = codeLines.avg / actual.avg;
    insights.push({
      label: '人均日产代码量',
      value: `${perDay.toFixed(0)} 行/人天`,
      hint: '按实际工时折算的日均代码产出',
    });
  }

  if (size && actual && size.avg !== undefined && actual.avg !== undefined && actual.avg > 0) {
    const throughput = size.avg / actual.avg;
    insights.push({
      label: '单位工时产出',
      value: `${throughput.toFixed(2)} /人天`,
      hint: '每人天平均完成的需求规模',
    });
  }

  return insights.slice(0, 4);
}

export function DataSummaryCard({ data, answers }: DataSummaryCardProps) {
  const { numeric, categorical } = useMemo(() => classifyColumns(data), [data]);
  const derivedInsights = useMemo(() => computeDerivedInsights(data), [data]);
  const maxNumericAvg = Math.max(...numeric.map((c) => c.avg ?? 0), 1);
  const topCategorical = categorical[0];
  const [analysis, setAnalysis] = useState<DataAnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await requestLlmDataAnalysis(answers);
      if (result) {
        setAnalysis(result);
      } else {
        setError('AI 解读暂时不可用，请稍后再试');
      }
    } catch {
      setError('AI 解读失败，请稍后再试');
    } finally {
      setLoading(false);
    }
  }, [answers]);

  return (
    <section className="data-summary-card data-summary-card-v2">
      <div className="data-summary-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div className="data-summary-icon" aria-hidden="true">
            <Icon name="flow" size={18} />
          </div>
          <div>
            <p className="section-eyebrow">业务数据分析</p>
            <h2 className="data-summary-title">{data.dataType} · {data.fileName}</h2>
          </div>
        </div>
        <button
          type="button"
          className="ai-analyze-button"
          onClick={handleAnalyze}
          disabled={loading}
        >
          {loading ? (
            <><span className="ai-analyze-spinner" /> AI 解读中…</>
          ) : analysis ? (
            <><Icon name="refresh" size={14} /> 重新解读</>
          ) : (
            <><Icon name="bot" size={14} /> AI 数据解读</>
          )}
        </button>
      </div>

      <div className="data-summary-stats">
        <div className="data-stat-item">
          <p className="data-stat-value">{data.rowCount.toLocaleString()}</p>
          <p className="data-stat-label">数据记录</p>
        </div>
        <div className="data-stat-item">
          <p className="data-stat-value">{data.columnCount}</p>
          <p className="data-stat-label">字段维度</p>
        </div>
        <div className="data-stat-item">
          <p className="data-stat-value">{numeric.length}</p>
          <p className="data-stat-label">数值指标</p>
        </div>
        {topCategorical ? (
          <div className="data-stat-item">
            <p className="data-stat-value">{topCategorical.values.length}</p>
            <p className="data-stat-label">分类维度</p>
          </div>
        ) : null}
      </div>

      <div className="data-charts-grid">
        {numeric.length > 0 ? (
          <div className="data-chart-card">
            <p className="data-chart-title">数值指标均值对比</p>
            <div className="bar-chart">
              {numeric.slice(0, 6).map((col, index) => {
                const width = ((col.avg ?? 0) / maxNumericAvg) * 100;
                const color = CHART_COLORS[index % CHART_COLORS.length];
                return (
                  <div key={col.name} className="bar-chart-row">
                    <span className="bar-chart-label">{col.name}</span>
                    <div className="bar-chart-track">
                      <div
                        className="bar-chart-bar"
                        style={{ width: `${Math.max(2, width)}%`, background: color }}
                      />
                    </div>
                    <span className="bar-chart-value">{col.avg ?? '-'}</span>
                  </div>
                );
              })}
            </div>
          </div>
        ) : null}

        {topCategorical ? (
          <div className="data-chart-card">
            <p className="data-chart-title">{topCategorical.name} 分布</p>
            <div className="donut-chart-wrapper">
              <DonutChart items={topCategorical.values.slice(0, 6)} />
            </div>
            <div className="donut-legend">
              {topCategorical.values.slice(0, 6).map((item, index) => {
                const color = CHART_COLORS[index % CHART_COLORS.length];
                return (
                  <div key={item.value} className="donut-legend-item">
                    <span className="donut-legend-dot" style={{ background: color }} />
                    <span className="donut-legend-label">{item.value}</span>
                    <span className="donut-legend-count">{item.count}</span>
                  </div>
                );
              })}
            </div>
          </div>
        ) : null}
      </div>

      {derivedInsights.length > 0 ? (
        <div className="data-insights-card">
          <p className="data-chart-title">
            <span className="insight-icon"><Icon name="bulb" size={16} /></span>
            数据洞察指标
          </p>
          <div className="insights-grid">
            {derivedInsights.map((insight) => (
              <div key={insight.label} className="insight-item">
                <p className="insight-value">{insight.value}</p>
                <p className="insight-label">{insight.label}</p>
                <p className="insight-hint">{insight.hint}</p>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {loading ? (
        <div className="ai-analysis-loading">
          <div className="ai-analysis-loading-content">
            <div className="ai-analysis-spinner" />
            <p>AI 正在分析数据，请稍候…</p>
          </div>
        </div>
      ) : null}

      {error && !loading ? (
        <div className="ai-analysis-error">
          <p><Icon name="warning" size={14} /> {error}</p>
        </div>
      ) : null}

      {analysis && !loading ? (
        <div className="ai-analysis-result">
          <div className="ai-analysis-summary">
            <span className="ai-analysis-summary-icon"><Icon name="chart" size={18} /></span>
            <p className="ai-analysis-summary-text">{analysis.summary}</p>
          </div>

          {analysis.efficiencyMetrics && analysis.efficiencyMetrics.length > 0 ? (
            <div className="ai-analysis-section">
              <p className="ai-analysis-section-title"><Icon name="bolt" size={14} /> 核心效率指标</p>
              <div className="ai-metrics-grid">
                {analysis.efficiencyMetrics.map((metric) => (
                  <div key={metric.name} className={`ai-metric-item ai-metric-${metric.status}`}>
                    <p className="ai-metric-value">{metric.value}</p>
                    <p className="ai-metric-name">{metric.name}</p>
                    <p className="ai-metric-benchmark">行业参考：{metric.benchmark}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {analysis.keyFindings && analysis.keyFindings.length > 0 ? (
            <div className="ai-analysis-section">
              <p className="ai-analysis-section-title"><Icon name="search" size={14} /> 关键发现</p>
              <div className="ai-findings-list">
                {analysis.keyFindings.map((finding, index) => (
                  <div key={index} className={`ai-finding-item ai-finding-${finding.level}`}>
                    <span className="ai-finding-dot" />
                    <div>
                      <p className="ai-finding-title">{finding.title}</p>
                      <p className="ai-finding-desc">{finding.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {analysis.bottlenecks && analysis.bottlenecks.length > 0 ? (
            <div className="ai-analysis-section">
              <p className="ai-analysis-section-title"><Icon name="warning" size={14} /> 主要瓶颈</p>
              <ul className="ai-bullet-list">
                {analysis.bottlenecks.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            </div>
          ) : null}

          {analysis.recommendations && analysis.recommendations.length > 0 ? (
            <div className="ai-analysis-section">
              <p className="ai-analysis-section-title"><Icon name="bulb" size={14} /> 改进建议</p>
              <ul className="ai-bullet-list">
                {analysis.recommendations.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            </div>
          ) : null}

          {analysis.aiOpportunities && analysis.aiOpportunities.length > 0 ? (
            <div className="ai-analysis-section ai-analysis-opp">
              <p className="ai-analysis-section-title"><Icon name="bot" size={14} /> AI 切入机会</p>
              <ul className="ai-bullet-list ai-opp-list">
                {analysis.aiOpportunities.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}

function DonutChart({ items }: { items: Array<{ value: string; count: number }> }) {
  const total = items.reduce((sum, item) => sum + item.count, 0) || 1;
  const size = 180;
  const strokeWidth = 30;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  let offset = 0;
  const segments = items.map((item, index) => {
    const fraction = item.count / total;
    const dashLength = fraction * circumference;
    const dashOffset = -offset;
    offset += dashLength;
    const color = CHART_COLORS[index % CHART_COLORS.length];
    return (
      <circle
        key={item.value}
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        strokeWidth={strokeWidth}
        strokeDasharray={`${dashLength} ${circumference - dashLength}`}
        strokeDashoffset={dashOffset}
        stroke={color}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        className="donut-segment"
        style={{
          animation: `donutPulse 3s ease-in-out infinite`,
          animationDelay: `${index * 0.2}s`,
        }}
      />
    );
  });

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="donut-chart">
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="var(--surface-3)" strokeWidth={strokeWidth} />
      {segments}
    </svg>
  );
}
