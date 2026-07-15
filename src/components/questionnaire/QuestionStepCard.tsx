import { useCallback, useState } from 'react';
import {
  getIndustryProfile,
  industryProfiles,
  TEAM_SIZE_OPTIONS,
} from '../../data/industryProfiles';
import type {
  FlowGraph,
  IndustryKey,
  QuestionnaireAnswer,
  TeamSize,
} from '../../types/diagnostic';
import { FlowEditor } from '../flow/FlowEditor';
import { ProgressRail } from './ProgressRail';

interface QuestionStepCardProps {
  answers: QuestionnaireAnswer;
  updateAnswers: (patch: Partial<QuestionnaireAnswer>) => void;
  onBack: () => void;
  onGenerate: () => void;
}

const STEP_TITLES = ['选择行业与团队', '梳理业务流图', '确认 AI 使用现状'];
const STEP_INTROS = [
  '先告诉系统你的行业、团队形态和规模，后面按行业给你默认业务流图。',
  '在图上直接改环节名、拖动、拉手柄分叉或合并。每个节点里都可以直接补输入和输出，点击节点设为核心环节。',
  '勾选团队已经在用的 AI 场景，用来判断组织准备度。',
];

function buildDefaultFlowGraph(workflow: string[]): FlowGraph {
  return {
    nodes: workflow.map((label, index) => ({
      id: `stage-${index}`,
      label,
      input: '',
      output: '',
      kind: 'stage',
    })),
    edges: workflow.slice(1).map((_, index) => ({
      id: `edge-${index}`,
      source: `stage-${index}`,
      target: `stage-${index + 1}`,
    })),
  };
}

export function QuestionStepCard({
  answers,
  updateAnswers,
  onBack,
  onGenerate,
}: QuestionStepCardProps) {
  const [step, setStep] = useState(0);
  const profile = getIndustryProfile(answers.industry);

  const handleGraphChange = useCallback(
    (graph: FlowGraph) => updateAnswers({ flowGraph: graph }),
    [updateAnswers],
  );
  const handleCoreChange = useCallback(
    (nodeId: string) => updateAnswers({ coreNodeId: nodeId }),
    [updateAnswers],
  );

  const canProceed = () => {
    if (step === 0) return Boolean(answers.industry && answers.teamType && answers.teamSize);
    if (step === 1) {
      return answers.flowGraph.nodes.length >= 2 && Boolean(answers.coreNodeId);
    }
    return true;
  };

  const next = () => {
    if (step < 2) {
      setStep(step + 1);
    } else {
      onGenerate();
    }
  };

  const prev = () => {
    if (step > 0) {
      setStep(step - 1);
    } else {
      onBack();
    }
  };

  const selectIndustry = (key: IndustryKey) => {
    const nextProfile = getIndustryProfile(key);
    updateAnswers({
      industry: key,
      teamType: '',
      coreNodeId: '',
      currentAiUsage: [],
      flowGraph: nextProfile ? buildDefaultFlowGraph(nextProfile.defaultWorkflow) : { nodes: [], edges: [] },
    });
  };

  const toggleAiUsage = (value: string) => {
    const current = answers.currentAiUsage;
    updateAnswers({
      currentAiUsage: current.includes(value)
        ? current.filter((item) => item !== value)
        : [...current, value],
    });
  };

  return (
    <section className="questionnaire-layout" aria-labelledby="question-step-title">
      <ProgressRail currentStep={step} />
      <div className="question-step-card question-step-card-wide">
        <div className="question-step-header">
          <p className="section-eyebrow">诊断问诊 · 第 {step + 1} 步 / 共 3 步</p>
          <h2 id="question-step-title">{STEP_TITLES[step]}</h2>
          <p className="question-step-intro">{STEP_INTROS[step]}</p>
        </div>

        {step === 0 ? (
          <div className="question-step-body">
            <p className="question-field-label">你的行业</p>
            <div className="option-grid">
              {industryProfiles.map((item) => (
                <button
                  type="button"
                  key={item.key}
                  className={`option-card${answers.industry === item.key ? ' option-card-selected' : ''}`}
                  onClick={() => selectIndustry(item.key)}
                >
                  <strong>{item.label}</strong>
                  <span>{item.blurb}</span>
                </button>
              ))}
            </div>

            {profile ? (
              <>
                <p className="question-field-label">团队类型</p>
                <div className="option-row">
                  {profile.teamOptions.map((team) => (
                    <button
                      type="button"
                      key={team.value}
                      className={`option-chip${answers.teamType === team.value ? ' option-chip-selected' : ''}`}
                      onClick={() => updateAnswers({ teamType: team.value })}
                    >
                      {team.label}
                    </button>
                  ))}
                </div>

                <p className="question-field-label">团队规模</p>
                <div className="option-row">
                  {TEAM_SIZE_OPTIONS.map((option) => (
                    <button
                      type="button"
                      key={option.value}
                      className={`option-chip${answers.teamSize === option.value ? ' option-chip-selected' : ''}`}
                      onClick={() => updateAnswers({ teamSize: option.value as TeamSize })}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </>
            ) : null}
          </div>
        ) : null}

        {step === 1 ? (
          <div className="question-step-body">
            <p className="question-field-hint">
              节点卡片里可以直接填输入 / 输出；点击节点会设为核心环节。
            </p>
            <FlowEditor
              graph={answers.flowGraph}
              coreNodeId={answers.coreNodeId}
              onGraphChange={handleGraphChange}
              onCoreChange={handleCoreChange}
            />
          </div>
        ) : null}

        {step === 2 && profile ? (
          <div className="question-step-body">
            <p className="question-field-label">团队现在已经在用 AI 做哪些事</p>
            <p className="question-field-hint">可多选，没有可跳过</p>
            <div className="checklist">
              {profile.aiUsageOptions.map((item) => {
                const checked = answers.currentAiUsage.includes(item);
                return (
                  <button
                    type="button"
                    key={item}
                    className={`check-item${checked ? ' check-item-checked' : ''}`}
                    onClick={() => toggleAiUsage(item)}
                  >
                    <span className="check-mark" aria-hidden="true">
                      {checked ? '✓' : ''}
                    </span>
                    <span>{item}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ) : null}

        <div className="question-step-actions">
          <button className="secondary-button" type="button" onClick={prev}>
            {step === 0 ? '返回首页' : '上一步'}
          </button>
          <button
            className="primary-button"
            type="button"
            onClick={next}
            disabled={!canProceed()}
          >
            {step === 2 ? '生成初步洞察' : '下一步'}
          </button>
        </div>
      </div>
    </section>
  );
}
