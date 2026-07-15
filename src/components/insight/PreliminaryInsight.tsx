import { useRef } from 'react';
import { InsightMetrics } from '../dashboard/InsightMetrics';
import { ReadinessRadar } from '../dashboard/ReadinessRadar';
import { FlowDiagram } from '../flow/FlowDiagram';
import { DataUpload } from './DataUpload';
import { MaskedCaseList } from './MaskedCaseList';
import { MECHANISM_LABELS } from '../../utils/mechanismLabels';
import type { IndustryCase, InitialInsight, NodeAnnotation, QuestionnaireAnswer } from '../../types/diagnostic';

interface PreliminaryInsightProps {
  answers: QuestionnaireAnswer;
  insight: InitialInsight;
  annotations: NodeAnnotation[];
  cases: IndustryCase[];
  onUploaded: () => void;
  onBack: () => void;
}

export function PreliminaryInsight({
  answers,
  insight,
  annotations,
  cases,
  onUploaded,
  onBack,
}: PreliminaryInsightProps) {
  const uploadRef = useRef<HTMLDivElement>(null);
  const scrollToUpload = () => {
    uploadRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };
  const jumpToDeepStep = () => {
    scrollToUpload();
    window.requestAnimationFrame(() => {
      const firstChip = uploadRef.current?.querySelector<HTMLButtonElement>('.data-type-chip');
      firstChip?.focus();
    });
  };
  const core = insight.coreAnnotation;

  return (
    <div className="insight-layout">
      <InsightMetrics
        teamSize={answers.teamSize}
        coreStage={core.label}
        aiUsageCount={answers.currentAiUsage.length}
        caseCount={cases.length}
      />

      <section className="dashboard-section insight-assessment-card">
        <p className="section-eyebrow">阶段判断</p>
        <h2 className="insight-assessment-title">{insight.stageAssessment}</h2>
        <p className="insight-assessment-summary">{insight.summary}</p>
      </section>

      <section className="dashboard-section flow-diagram-card">
        <p className="section-eyebrow">潜在提效标注</p>
        <h2>先看一眼，哪些环节更值得优先引入 AI</h2>
        <FlowDiagram
          graph={answers.flowGraph}
          annotations={annotations}
          coreNodeId={answers.coreNodeId}
        />
      </section>

      <section className="dashboard-section core-mechanism-card">
        <p className="section-eyebrow">核心环节 AI 落地机制</p>
        <p className="core-mechanism-stage">{core.label}</p>
        <div className="core-mechanism-tags">
          {core.mechanism.map((item) => (
            <span key={item} className="mechanism-tag mechanism-tag-lg">
              {MECHANISM_LABELS[item] ?? item}
            </span>
          ))}
        </div>
        <p className="core-mechanism-rationale">{core.rationale}</p>
        <p className="core-mechanism-action">{core.action}</p>

        <div className="core-mechanism-replace">
          <span>具体替代</span>
          <p>{core.replaceAction}</p>
        </div>
        <div className="core-mechanism-case">
          <span>行业案例</span>
          <p>{core.caseRef}</p>
        </div>

        {core.input || core.output ? (
          <div className="core-mechanism-io">
            {core.input ? (
              <div className="core-mechanism-io-item">
                <span>输入</span>
                <p>{core.input}</p>
              </div>
            ) : null}
            {core.output ? (
              <div className="core-mechanism-io-item">
                <span>输出</span>
                <p>{core.output}</p>
              </div>
            ) : null}
          </div>
        ) : null}
      </section>

      <MaskedCaseList cases={cases} />

      <ReadinessRadar readiness={insight.readiness} />

      <section className="dashboard-section upload-cta-card" ref={uploadRef}>
        <div className="upload-cta-copy">
          <p className="section-eyebrow">深度诊断</p>
          <h2>继续这一步，即可开启组织的 AI 工作流迭代与升级</h2>
          <p>
            当前页面主要基于结构化问答做初步判断。补齐关键业务明细后，系统会进一步生成每个环节的精细化机制方案、
            协作链路问题拆解、准备度深度洞察报表、替代动作与完整案例对标。
          </p>
          <button
            type="button"
            className="primary-button upload-cta-trigger"
            onClick={jumpToDeepStep}
          >
            上传业务数据，解锁完整组织AI改造洞察分析
          </button>
        </div>
        <DataUpload industry={answers.industry} onUploaded={onUploaded} />
      </section>

      <div className="insight-footer-actions">
        <button className="secondary-button" type="button" onClick={onBack}>
          返回修改答诊
        </button>
      </div>
    </div>
  );
}
