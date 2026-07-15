import type { MechanismType } from '../types/diagnostic';

export const MECHANISM_LABELS: Record<MechanismType, string> = {
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
