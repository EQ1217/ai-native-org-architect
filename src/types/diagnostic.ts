export type IndustryKey =
  | 'content-marketing'
  | 'ecommerce-ops'
  | 'customer-service'
  | 'r-and-d'
  | 'sales-sdr';

export type TeamSize = '1-10' | '11-30' | '31-100' | '100+';

export type MechanismType =
  | 'skill'
  | 'copilot'
  | 'workflow'
  | 'agent'
  | 'routing'
  | 'parallelization'
  | 'evaluator'
  | 'knowledge'
  | 'human_gate'
  | 'loop';

export interface IndustryCase {
  id: string;
  industry: IndustryKey;
  title: string;
  teamType: string;
  summary: string;
  painPoints: string[];
  recommendedMechanisms: MechanismType[];
  outcome: string;
}

export interface TeamOption {
  value: string;
  label: string;
}

export interface DataUploadType {
  type: string;
  format: string;
  fields: string[];
}

export interface UploadedDataSummary {
  fileName: string;
  dataType: string;
  rowCount: number;
  columnCount: number;
  columns: string[];
  sampleRows: Array<Record<string, string>>;
  allRows: Array<Record<string, string>>;
  numericColumns: Array<{ name: string; min?: number; max?: number; avg?: number }>;
  textPreview: string;
}

export interface StageHint {
  stage: string;
  replaceAction: string;
  caseRef: string;
}

export interface IndustryProfile {
  key: IndustryKey;
  label: string;
  blurb: string;
  teamOptions: TeamOption[];
  defaultWorkflow: string[];
  suggestedBottlenecks: string[];
  inputOptions: string[];
  outputOptions: string[];
  aiUsageOptions: string[];
  dataUploadTypes: DataUploadType[];
  stageHints: StageHint[];
  cases: IndustryCase[];
}

export type NodeChangeType = 'added' | 'modified' | 'merged' | 'same';

export interface FlowNode {
  id: string;
  label: string;
  input?: string;
  output?: string;
  kind?: 'stage' | 'ai';
  changeType?: NodeChangeType;
  mergedFrom?: string[];
  changeNote?: string;
}

export interface FlowEdge {
  id: string;
  source: string;
  target: string;
}

export interface FlowGraph {
  nodes: FlowNode[];
  edges: FlowEdge[];
}

export interface QuestionnaireAnswer {
  industry: IndustryKey | '';
  teamType: string;
  teamSize: TeamSize | '';
  coreNodeId: string;
  flowGraph: FlowGraph;
  currentAiUsage: string[];
  uploadedData?: UploadedDataSummary;
}

export interface MechanismRecommendation {
  stage: string;
  mechanism: MechanismType[];
  rationale: string;
  action: string;
  whyNotOthers: string;
}

export type ReadinessDimension =
  | '工具基建'
  | '组织基建'
  | '人才能力'
  | '文化治理';

export interface ReadinessSampleRow {
  metric: string;
  value: string;
  insight: string;
}

export interface ReadinessEvidence {
  definition: string;
  signals: string[];
  sampleTitle: string;
  sampleRows: ReadinessSampleRow[];
  note: string;
}

export interface ReadinessScore {
  label: ReadinessDimension;
  score: number;
  summary: string;
  evidence: ReadinessEvidence;
  isAiEnhanced?: boolean;
}

export interface NodeAnnotation {
  nodeId: string;
  label: string;
  input?: string;
  output?: string;
  mechanism: MechanismType[];
  rationale: string;
  action: string;
  replaceAction: string;
  caseRef: string;
  changeSummary?: string;
  capabilitySummary?: string;
  ownership?: 'human' | 'hybrid' | 'ai';
  isAiNode?: boolean;
  isCore: boolean;
  isAiEnhanced?: boolean;
  enhancedFields?: string[];
}

export interface InitialInsight {
  stageAssessment: string;
  summary: string;
  coreAnnotation: NodeAnnotation;
  readiness: ReadinessScore[];
}

export interface DiagnosticReport {
  annotations: NodeAnnotation[];
  readiness: ReadinessScore[];
  recommendedCases: IndustryCase[];
  optimizedGraph: FlowGraph;
  optimizedAnnotations: NodeAnnotation[];
  reportHeadline?: string;
  reportNarrative?: string;
  modelNotes?: string[];
  isAiEnhanced?: boolean;
}

export interface LlmReadinessEnhancement {
  label: ReadinessDimension;
  summary?: string;
  note?: string;
}

export interface LlmAnnotationEnhancement {
  nodeId: string;
  rationale?: string;
  action?: string;
  replaceAction?: string;
  caseRef?: string;
  capabilitySummary?: string;
  changeSummary?: string;
  ownership?: 'human' | 'hybrid' | 'ai';
}

export interface LlmGeneratedNode {
  anchorNodeId: string;
  label: string;
  input: string;
  output: string;
  mechanism: MechanismType[];
  rationale: string;
  action: string;
  replaceAction: string;
  caseRef: string;
  capabilitySummary: string;
  changeSummary: string;
  ownership: 'human' | 'hybrid' | 'ai';
}

export interface LlmReportEnhancement {
  reportHeadline?: string;
  reportNarrative?: string;
  readiness?: LlmReadinessEnhancement[];
  annotations?: LlmAnnotationEnhancement[];
  generatedNodes?: LlmGeneratedNode[];
  modelNotes?: string[];
}
