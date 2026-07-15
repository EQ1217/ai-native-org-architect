const steps = ['行业与团队', '业务流图', 'AI 使用现状'];

interface ProgressRailProps {
  currentStep: number;
}

export function ProgressRail({ currentStep }: ProgressRailProps) {
  return (
    <aside className="progress-rail" aria-label="诊断问诊进度">
      <p className="section-eyebrow">诊断进度</p>
      <ol className="progress-list">
        {steps.map((step, index) => {
          const state =
            index < currentStep ? 'done' : index === currentStep ? 'current' : 'upcoming';

          return (
            <li className={`progress-item progress-item-${state}`} key={step}>
              <span className="progress-index">{index + 1}</span>
              <span className="progress-label">{step}</span>
            </li>
          );
        })}
      </ol>
    </aside>
  );
}
