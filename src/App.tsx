import { useEffect, useMemo, useRef, useState } from 'react';
import { CaseLibrary } from './components/dashboard/CaseLibrary';
import { AppShell } from './components/layout/AppShell';
import { FlowDiagram } from './components/flow/FlowDiagram';
import { PreliminaryInsight } from './components/insight/PreliminaryInsight';
import { QuestionStepCard } from './components/questionnaire/QuestionStepCard';
import { ConsultingCTA } from './components/results/ConsultingCTA';
import { ResultSummary } from './components/results/ResultSummary';
import { RoadmapTimeline } from './components/results/RoadmapTimeline';
import { LandingHero } from './components/sections/LandingHero';
import { getIndustryProfile } from './data/industryProfiles';
import { useDiagnosticState } from './store/useDiagnosticState';
import { buildDiagnosticReport, buildInitialInsight } from './utils/diagnosticEngine';
import { requestLlmEnhancedReport } from './utils/llmDiagnostic';

type AnalysisMode = 'idle' | 'enhancing' | 'enhanced' | 'fallback';

export default function App() {
  const { answers, setView, updateAnswers, view } = useDiagnosticState();
  const [isQuestionnaireOpen, setQuestionnaireOpen] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('');
  const [diagnosisStatus, setDiagnosisStatus] = useState('');
  const [analysisMode, setAnalysisMode] = useState<AnalysisMode>('idle');
  const questionnaireRef = useRef<HTMLDivElement>(null);

  const initialInsight = useMemo(() => buildInitialInsight(answers), [answers]);
  const baseReport = useMemo(() => buildDiagnosticReport(answers), [answers]);
  const [report, setReport] = useState(baseReport);
  const profile = getIndustryProfile(answers.industry);
  const coreAnnotation =
    report.annotations.find((item) => item.isCore) ?? report.annotations[0];
  const optimizedCoreNodeId = answers.coreNodeId
    ? `optimized-${answers.coreNodeId}-human`
    : '';

  useEffect(() => {
    if (isQuestionnaireOpen && questionnaireRef.current) {
      questionnaireRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [isQuestionnaireOpen]);

  useEffect(() => {
    setReport(baseReport);
  }, [baseReport]);

  useEffect(() => {
    if (view !== 'report') {
      setAnalysisMode('idle');
      return;
    }

    let cancelled = false;
    setReport(baseReport);
    setAnalysisMode('enhancing');

    requestLlmEnhancedReport(answers, baseReport).then((enhancedReport) => {
      if (cancelled) {
        return;
      }

      if (enhancedReport) {
        setReport(enhancedReport);
        setAnalysisMode('enhanced');
        return;
      }

      setAnalysisMode('fallback');
    });

    return () => {
      cancelled = true;
    };
  }, [answers, baseReport, view]);

  if (view === 'insight') {
    return (
      <AppShell
        eyebrow="Initial Insight"
        title="初步洞察"
        description={`基于你的 ${profile?.label ?? '行业'} / ${answers.teamType} 答诊，先给你一个轻量判断。补齐关键业务明细后可生成完整改造方案。`}
      >
        <PreliminaryInsight
          answers={answers}
          insight={initialInsight}
          annotations={report.annotations}
          cases={report.recommendedCases}
          onUploaded={() => setView('report')}
          onBack={() => {
            setView('landing');
            setQuestionnaireOpen(true);
          }}
        />
      </AppShell>
    );
  }

  if (view === 'report') {
    return (
      <AppShell
        eyebrow="Deep Diagnosis"
        title="深度组织改造方案"
        description={`基于你补充的业务明细与 ${profile?.label ?? '行业'} 诊断，以下是每个环节的精细化机制方案、替代动作与案例对标。`}
        actions={(
          <div className="dashboard-footer-actions">
            <button
              type="button"
              className="secondary-button"
              onClick={() => setView('insight')}
            >
              返回初步洞察
            </button>
          </div>
        )}
      >
        <div className="dashboard-layout results-layout">
          <section className={`analysis-status-banner analysis-status-${analysisMode}`}>
            {analysisMode === 'enhancing'
              ? 'AI 正在结合业务明细补充更深一层的诊断结论...'
              : analysisMode === 'enhanced'
                ? '当前结果已切换为大模型增强诊断。'
                : '模型增强暂不可用（请求超时、代理未启动或返回异常），当前展示为规则版诊断。'}
          </section>

          {coreAnnotation ? (
            <ResultSummary
              teamType={answers.teamType}
              coreAnnotation={coreAnnotation}
              readiness={report.readiness}
              aiUsageCount={answers.currentAiUsage.length}
            />
          ) : null}

          <section className="dashboard-section flow-comparison-card">
            <p className="section-eyebrow">潜在提效方案</p>
            <h2>从现在的工作方式，到 AI 参与后的新工作方式</h2>
            <div className="flow-comparison-grid">
              <div className="flow-diagram-panel">
                <p className="flow-diagram-label">Before · 现在的工作方式</p>
                <FlowDiagram
                  graph={answers.flowGraph}
                  annotations={report.annotations}
                  coreNodeId={answers.coreNodeId}
                />
              </div>
              <div className="flow-diagram-panel">
                <p className="flow-diagram-label">After · AI 参与后的新工作方式</p>
                <FlowDiagram
                  graph={report.optimizedGraph}
                  annotations={report.optimizedAnnotations}
                  coreNodeId={optimizedCoreNodeId}
                />
              </div>
            </div>
          </section>

          <RoadmapTimeline annotations={report.annotations} readiness={report.readiness} />

          <CaseLibrary cases={report.recommendedCases} />

          <ConsultingCTA
            onUploadMoreData={() => {
              setUploadStatus('已记录"补充组织数据"，可继续完善团队信息。');
              setDiagnosisStatus('');
            }}
            onBookExpertDiagnosis={() => {
              setDiagnosisStatus('已收到你的咨询意向，下一步会接入专家匹配与预约确认。');
              setUploadStatus('');
            }}
            uploadStatus={uploadStatus}
            diagnosisStatus={diagnosisStatus}
          />
        </div>
      </AppShell>
    );
  }

  return (
    <main className="app-shell">
      <div className="app-frame">
        <LandingHero onStart={() => setQuestionnaireOpen(true)} />
        {isQuestionnaireOpen ? (
          <div ref={questionnaireRef}>
            <QuestionStepCard
              answers={answers}
              updateAnswers={updateAnswers}
              onBack={() => setQuestionnaireOpen(false)}
              onGenerate={() => {
                setQuestionnaireOpen(false);
                setView('insight');
              }}
            />
          </div>
        ) : null}
      </div>
    </main>
  );
}
