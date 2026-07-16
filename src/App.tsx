import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { CaseLibrary } from './components/dashboard/CaseLibrary';
import { ChatPanel } from './components/chat/ChatPanel';
import { AppShell } from './components/layout/AppShell';
import { FlowDiagram } from './components/flow/FlowDiagram';
import { PreliminaryInsight } from './components/insight/PreliminaryInsight';
import { QuestionStepCard } from './components/questionnaire/QuestionStepCard';
import { ConsultingCTA } from './components/results/ConsultingCTA';
import { DataSummaryCard } from './components/results/DataSummaryCard';
import { ResultSummary } from './components/results/ResultSummary';
import { RoadmapTimeline } from './components/results/RoadmapTimeline';
import { LandingHero } from './components/sections/LandingHero';
import { getIndustryProfile } from './data/industryProfiles';
import { useDiagnosticState } from './store/useDiagnosticState';
import { buildDiagnosticReport, buildInitialInsight } from './utils/diagnosticEngine';
import { requestLlmFullGenerate } from './utils/llmDiagnostic';

type AnalysisMode = 'idle' | 'generating' | 'generated' | 'fallback';

export default function App() {
  const { answers, setView, updateAnswers, view } = useDiagnosticState();
  const [isQuestionnaireOpen, setQuestionnaireOpen] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('');
  const [diagnosisStatus, setDiagnosisStatus] = useState('');
  const [analysisMode, setAnalysisMode] = useState<AnalysisMode>('idle');
  const [showAiDesign, setShowAiDesign] = useState(true);
  const questionnaireRef = useRef<HTMLDivElement>(null);

  const initialInsight = useMemo(() => buildInitialInsight(answers), [answers]);
  const baseReport = useMemo(() => buildDiagnosticReport(answers), [answers]);
  const [report, setReport] = useState(baseReport);
  const [chatModifiedReport, setChatModifiedReport] =
    useState<typeof baseReport | null>(null);

  const aiReport = chatModifiedReport || report;
  const displayReport =
    analysisMode === 'generated' && showAiDesign ? aiReport : baseReport;
  const profile = getIndustryProfile(answers.industry);
  const coreAnnotation =
    displayReport.annotations.find((item) => item.isCore) ?? displayReport.annotations[0];
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

    window.scrollTo({ top: 0, behavior: 'smooth' });

    let cancelled = false;
    setReport(baseReport);
    setChatModifiedReport(null);
    setAnalysisMode('generating');

    requestLlmFullGenerate(answers, baseReport).then((generatedReport) => {
      if (cancelled) {
        return;
      }

      if (generatedReport) {
        setReport(generatedReport);
        setAnalysisMode('generated');
        return;
      }

      setAnalysisMode('fallback');
    });

    return () => {
      cancelled = true;
    };
  }, [answers, baseReport, view]);

  const handleChatUpdate = useCallback(
    (result: {
      optimizedGraph: typeof baseReport.optimizedGraph;
      annotations: typeof baseReport.annotations;
      readiness: typeof baseReport.readiness;
    }) => {
      setChatModifiedReport((prev) => {
        const base = prev || report;
        return {
          ...base,
          optimizedGraph: result.optimizedGraph,
          optimizedAnnotations: result.annotations,
          readiness: result.readiness,
          isAiEnhanced: true,
        };
      });
    },
    [report],
  );

  const handleChatReset = useCallback(() => {
    setChatModifiedReport(null);
  }, []);

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
          onUploaded={(summary) => {
            updateAnswers({ uploadedData: summary });
            setView('report');
          }}
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
      <>
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
          {coreAnnotation ? (
            <ResultSummary
              teamType={answers.teamType}
              coreAnnotation={coreAnnotation}
              readiness={displayReport.readiness}
              aiUsageCount={answers.currentAiUsage.length}
            />
          ) : null}

          {answers.uploadedData ? (
            <DataSummaryCard data={answers.uploadedData} answers={answers} />
          ) : null}

          <section className="dashboard-section flow-comparison-card">
            <p className="section-eyebrow">潜在提效方案</p>
            <h2>从现在的工作方式，到 AI 设计后的新工作方式</h2>

            <div className={`analysis-status-banner analysis-status-${analysisMode} flow-banner`}>
              <div className="analysis-banner-content">
                <span className="analysis-banner-text">
                  {analysisMode === 'generating' ? (
                    <>
                      <span className="enhancing-spinner" />
                      AI 正在为你设计 AI 原生工作流程与改造方案...
                    </>
                  ) : analysisMode === 'generated' ? (
                    <>
                      <span className="enhanced-check">✓</span>
                      当前为 AI 设计的完整改造方案。
                    </>
                  ) : (
                    'AI 设计暂不可用（请求超时、代理未启动或返回异常），当前展示为规则版诊断。'
                  )}
                </span>
                {analysisMode === 'generated' ? (
                  <div className="enhanced-toggle">
                    <button
                      type="button"
                      className={`toggle-btn${!showAiDesign ? ' toggle-active' : ''}`}
                      onClick={() => setShowAiDesign(false)}
                    >
                      规则版
                    </button>
                    <button
                      type="button"
                      className={`toggle-btn${showAiDesign ? ' toggle-active' : ''}`}
                      onClick={() => setShowAiDesign(true)}
                    >
                      AI 设计版
                    </button>
                  </div>
                ) : null}
              </div>
            </div>

            {analysisMode === 'generated' && showAiDesign && displayReport.optimizedGraph.nodes.some((n) => n.changeType) ? (
              <div className="structural-change-card">
                <p className="structural-change-title">结构变化总览</p>
                <div className="structural-change-stats">
                  <div className="change-stat added">
                    <span className="change-stat-num">
                      {displayReport.optimizedGraph.nodes.filter((n) => n.changeType === 'added').length}
                    </span>
                    <span className="change-stat-label">新增环节</span>
                  </div>
                  <div className="change-stat modified">
                    <span className="change-stat-num">
                      {displayReport.optimizedGraph.nodes.filter((n) => n.changeType === 'modified').length}
                    </span>
                    <span className="change-stat-label">改造环节</span>
                  </div>
                  <div className="change-stat merged">
                    <span className="change-stat-num">
                      {displayReport.optimizedGraph.nodes.filter((n) => n.changeType === 'merged').length}
                    </span>
                    <span className="change-stat-label">合并环节</span>
                  </div>
                  <div className="change-stat same">
                    <span className="change-stat-num">
                      {displayReport.optimizedGraph.nodes.filter((n) => n.changeType === 'same').length}
                    </span>
                    <span className="change-stat-label">保留环节</span>
                  </div>
                  <div className="change-stat total">
                    <span className="change-stat-num">
                      {answers.flowGraph.nodes.length} → {displayReport.optimizedGraph.nodes.length}
                    </span>
                    <span className="change-stat-label">节点总数变化</span>
                  </div>
                </div>
              </div>
            ) : null}

            <div className="flow-comparison-stack">
              <div className="flow-diagram-panel">
                <p className="flow-diagram-label">Before · 现在的工作方式</p>
                <FlowDiagram
                  graph={answers.flowGraph}
                  annotations={displayReport.annotations}
                  coreNodeId={answers.coreNodeId}
                />
              </div>
              <div className="flow-diagram-panel">
                <p className="flow-diagram-label">
                  After · {analysisMode === 'generated' && showAiDesign ? 'AI 设计的新工作方式' : 'AI 参与后的新工作方式'}
                </p>
                <FlowDiagram
                  graph={displayReport.optimizedGraph}
                  annotations={displayReport.optimizedAnnotations}
                  coreNodeId={optimizedCoreNodeId}
                  draggable
                />
              </div>
            </div>
          </section>

          <RoadmapTimeline
            annotations={displayReport.annotations}
            readiness={displayReport.readiness}
          />

          {displayReport.modelNotes && displayReport.modelNotes.length > 0 ? (
            <section className="dashboard-section model-notes-card">
              <p className="section-eyebrow">AI 顾问提醒</p>
              <h2>来自 AI 顾问的额外建议</h2>
              <ul className="model-notes-list">
                {displayReport.modelNotes.map((note, index) => (
                  <li key={index} className="model-note-item">
                    <span className="model-note-num">{index + 1}</span>
                    <p>{note}</p>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          <CaseLibrary cases={displayReport.recommendedCases} />

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

      {analysisMode === 'generated' && showAiDesign ? (
        <ChatPanel
          answers={answers}
          currentGraph={displayReport.optimizedGraph}
          currentAnnotations={displayReport.optimizedAnnotations}
          fallbackReadiness={report.readiness}
          onUpdate={handleChatUpdate}
          onReset={handleChatReset}
        />
      ) : null}
      </>
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
