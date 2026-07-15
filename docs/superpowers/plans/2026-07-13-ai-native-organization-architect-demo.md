# AI 原生组织架构师 Demo Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 构建一个可运行的高保真网页 Demo，完整演示“AI 顾问轻问诊 -> 顾问工作台 -> 结构化诊断结果 -> 深度咨询入口”的核心产品流程。

**Architecture:** 使用 `Vite + React + TypeScript` 构建单页应用，采用本地静态样板数据驱动页面与交互，不依赖后端。应用通过一个中心化的诊断状态存储串联首页问诊、工作台、结果页和行业案例/方法论展示，并用模块化组件保证后续扩展到其他行业模板时不需要重构页面骨架。

**Tech Stack:** Vite, React, TypeScript, CSS Modules, Vitest, React Testing Library

---

> **Git note:** 当前工作目录不是 git 仓库。执行本计划时，如果目录仍未初始化 git，则所有 `git add` / `git commit` 步骤都改为执行同一任务里的测试与构建命令作为检查点，不阻塞开发推进。

## 文件结构

### 新建文件

- `package.json`：项目脚本与依赖定义
- `tsconfig.json`：TypeScript 配置
- `tsconfig.node.json`：Vite 配置文件的 TypeScript 支持
- `vite.config.ts`：Vite 与测试配置
- `index.html`：应用入口 HTML
- `src/main.tsx`：React 应用挂载入口
- `src/App.tsx`：应用顶层路由与场景切换
- `src/styles/global.css`：全局视觉样式与设计 token
- `src/data/demoProfile.ts`：默认样板企业、行业案例、方法论与结果文案数据
- `src/types/diagnostic.ts`：问诊、诊断与页面数据类型
- `src/store/useDiagnosticState.ts`：本地状态、轻问诊与深诊断数据更新逻辑
- `src/utils/diagnosticEngine.ts`：根据问诊输入生成洞察摘要、机制判断与 readiness 结果
- `src/utils/diagnosticEngine.test.ts`：诊断逻辑单测
- `src/components/sections/LandingHero.tsx`：首页首屏与 AI 顾问引导区域
- `src/components/sections/TrustPanel.tsx`：首页能力卡片与产品价值展示
- `src/components/questionnaire/QuestionStepCard.tsx`：轻问诊单步卡片
- `src/components/questionnaire/ProgressRail.tsx`：问诊进度与阶段提示
- `src/components/dashboard/WorkflowMap.tsx`：业务流地图组件
- `src/components/dashboard/InsightMetrics.tsx`：组织洞察指标组件
- `src/components/dashboard/MechanismMatrix.tsx`：AI 落地机制判断图
- `src/components/dashboard/ReadinessRadar.tsx`：组织基建 readiness 可视化
- `src/components/dashboard/CaseLibrary.tsx`：案例库推荐组件
- `src/components/results/ResultSummary.tsx`：诊断结果总览
- `src/components/results/RoadmapTimeline.tsx`：30/60/90 天路线图
- `src/components/results/ConsultingCTA.tsx`：深度咨询入口
- `src/components/layout/AppShell.tsx`：工作台整体布局
- `src/components/layout/SectionHeader.tsx`：模块标题组件
- `src/App.test.tsx`：核心流程集成测试
- `README.md`：运行说明与 Demo 功能说明

### 修改文件

- 无，当前项目为空白目录

## 任务拆分

### Task 1: 初始化前端工程骨架

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `tsconfig.node.json`
- Create: `vite.config.ts`
- Create: `index.html`
- Create: `src/main.tsx`
- Create: `src/App.tsx`
- Create: `src/styles/global.css`

- [ ] **Step 1: 写出工程配置文件**

```json
{
  "name": "ai-native-organization-architect-demo",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1"
  },
  "devDependencies": {
    "@testing-library/jest-dom": "^6.6.3",
    "@testing-library/react": "^16.1.0",
    "@testing-library/user-event": "^14.5.2",
    "@types/react": "^18.3.12",
    "@types/react-dom": "^18.3.1",
    "@vitejs/plugin-react": "^4.3.4",
    "jsdom": "^25.0.1",
    "typescript": "^5.6.3",
    "vite": "^5.4.10",
    "vitest": "^2.1.4"
  }
}
```

```ts
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.ts'
  }
});
```

- [ ] **Step 2: 创建应用入口并确认能渲染占位页面**

```tsx
// src/main.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/global.css';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

```tsx
// src/App.tsx
export default function App() {
  return (
    <main>
      <h1>AI 原生组织架构师</h1>
      <p>Demo scaffold ready.</p>
    </main>
  );
}
```

- [ ] **Step 3: 安装依赖**

Run: `npm install`  
Expected: 成功安装依赖，输出包含 `added` 与 `audited` 字样，无 install error

- [ ] **Step 4: 运行基础测试与构建命令验证工程可用**

Run: `npm run build`  
Expected: PASS，输出包含 `vite v` 和 `dist/index.html`

Run: `npm test`  
Expected: PASS，当前无测试文件或 0 tests，不报环境错误

- [ ] **Step 5: 提交当前初始化变更**

```bash
git add package.json tsconfig.json tsconfig.node.json vite.config.ts index.html src
git commit -m "feat: initialize demo frontend scaffold"
```

### Task 2: 建立诊断领域模型与静态样板数据

**Files:**
- Create: `src/types/diagnostic.ts`
- Create: `src/data/demoProfile.ts`
- Create: `src/store/useDiagnosticState.ts`

- [ ] **Step 1: 先写出领域类型定义**

```ts
// src/types/diagnostic.ts
export type OptimizationGoal =
  | 'efficiency'
  | 'quality'
  | 'stability'
  | 'cost'
  | 'visibility';

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

export interface QuestionnaireAnswer {
  industry: string;
  teamType: string;
  primaryGoal: OptimizationGoal;
  workflowStages: string[];
  lowEfficiencyStages: string[];
  currentAiUsage: string[];
}

export interface MechanismRecommendation {
  stage: string;
  mechanism: MechanismType[];
  rationale: string;
  whyNotOthers: string;
}

export interface ReadinessScore {
  label: '工具基建' | '组织基建' | '人才能力' | '文化治理';
  score: number;
  summary: string;
}
```

- [ ] **Step 2: 写入默认企业样板、行业案例和预置结果文案**

```ts
// src/data/demoProfile.ts
import type { QuestionnaireAnswer } from '../types/diagnostic';

export const defaultAnswers: QuestionnaireAnswer = {
  industry: '内容营销',
  teamType: '品牌内容增长团队',
  primaryGoal: 'efficiency',
  workflowStages: ['需求提报', '趋势研究', '内容策划', '内容生产', '审核发布', '数据复盘'],
  lowEfficiencyStages: ['趋势研究', '内容生产', '审核发布'],
  currentAiUsage: ['内容改写', '标题生成']
};

export const industryCases = [
  {
    id: 'case-content-01',
    title: '消费品牌内容团队从“散点用 AI”到流程级协同',
    summary: '通过 brief 结构化、选题 agent 和复盘 loop，将周产能提升 40%。'
  }
];
```

- [ ] **Step 3: 实现本地状态管理 Hook，支持更新答案与切换场景**

```ts
// src/store/useDiagnosticState.ts
import { useMemo, useState } from 'react';
import { defaultAnswers } from '../data/demoProfile';
import type { QuestionnaireAnswer } from '../types/diagnostic';

export type AppView = 'landing' | 'dashboard' | 'results';

export function useDiagnosticState() {
  const [view, setView] = useState<AppView>('landing');
  const [answers, setAnswers] = useState<QuestionnaireAnswer>(defaultAnswers);

  const updateAnswers = (patch: Partial<QuestionnaireAnswer>) => {
    setAnswers((current) => ({ ...current, ...patch }));
  };

  return useMemo(
    () => ({
      view,
      answers,
      setView,
      updateAnswers
    }),
    [view, answers]
  );
}
```

- [ ] **Step 4: 运行 TypeScript 构建验证类型和数据文件通过**

Run: `npm run build`  
Expected: PASS，无 TypeScript 类型错误

- [ ] **Step 5: 提交领域模型与样板数据**

```bash
git add src/types/diagnostic.ts src/data/demoProfile.ts src/store/useDiagnosticState.ts
git commit -m "feat: add diagnostic domain model and demo data"
```

### Task 3: 先用测试锁定诊断引擎输出

**Files:**
- Create: `src/utils/diagnosticEngine.ts`
- Create: `src/utils/diagnosticEngine.test.ts`

- [ ] **Step 1: 先写失败测试，定义轻问诊如何映射到机制建议**

```ts
// src/utils/diagnosticEngine.test.ts
import { describe, expect, it } from 'vitest';
import { defaultAnswers } from '../data/demoProfile';
import { buildDiagnosticReport } from './diagnosticEngine';

describe('buildDiagnosticReport', () => {
  it('returns mechanism recommendations for low-efficiency stages', () => {
    const report = buildDiagnosticReport(defaultAnswers);

    expect(report.priorityStages).toContain('趋势研究');
    expect(report.mechanismMatrix.some((item) => item.stage === '趋势研究')).toBe(true);
    expect(report.mechanismMatrix.find((item) => item.stage === '趋势研究')?.mechanism).toContain('agent');
  });

  it('returns four readiness scores', () => {
    const report = buildDiagnosticReport(defaultAnswers);

    expect(report.readiness).toHaveLength(4);
    expect(report.readiness[0].label).toBe('工具基建');
  });
});
```

- [ ] **Step 2: 运行测试确认它先失败**

Run: `npm test -- src/utils/diagnosticEngine.test.ts`  
Expected: FAIL，报错包含 `Cannot find module './diagnosticEngine'` 或 `buildDiagnosticReport is not defined`

- [ ] **Step 3: 实现最小诊断引擎让测试通过**

```ts
// src/utils/diagnosticEngine.ts
import { industryCases } from '../data/demoProfile';
import type {
  MechanismRecommendation,
  QuestionnaireAnswer,
  ReadinessScore
} from '../types/diagnostic';

export interface DiagnosticReport {
  priorityStages: string[];
  mechanismMatrix: MechanismRecommendation[];
  readiness: ReadinessScore[];
  recommendedCases: typeof industryCases;
}

const mechanismMap: Record<string, MechanismRecommendation> = {
  趋势研究: {
    stage: '趋势研究',
    mechanism: ['agent', 'knowledge'],
    rationale: '需要综合外部趋势、竞品和历史案例，因此适合 agent 配合知识层。',
    whyNotOthers: '单纯 skill 无法处理多源信息搜集与综合判断。'
  },
  内容生产: {
    stage: '内容生产',
    mechanism: ['skill', 'copilot', 'parallelization'],
    rationale: '高重复、多变体产出适合 skill 和 copilot 协同生成。',
    whyNotOthers: '纯 workflow 只能流转任务，不能直接提升内容产能。'
  },
  审核发布: {
    stage: '审核发布',
    mechanism: ['workflow', 'evaluator', 'human_gate'],
    rationale: '该节点需要流转、校验与发布前人工把关。',
    whyNotOthers: '纯 agent 不适合承担最终责任节点。'
  }
};

export function buildDiagnosticReport(answers: QuestionnaireAnswer): DiagnosticReport {
  const mechanismMatrix = answers.lowEfficiencyStages.map(
    (stage) =>
      mechanismMap[stage] ?? {
        stage,
        mechanism: ['copilot'],
        rationale: '需要在人机协同中进一步判断最佳改造方式。',
        whyNotOthers: '当前信息不足，先以协同辅助方式起步。'
      }
  );

  return {
    priorityStages: answers.lowEfficiencyStages,
    mechanismMatrix,
    readiness: [
      { label: '工具基建', score: 72, summary: '已有文档和协作工具，但结构化流程不足。' },
      { label: '组织基建', score: 61, summary: '缺 AI owner 与跨部门落地机制。' },
      { label: '人才能力', score: 58, summary: '已有零散使用经验，但缺 workflow redesign 能力。' },
      { label: '文化治理', score: 64, summary: '愿意试用 AI，但缺评估和复盘闭环。' }
    ],
    recommendedCases: industryCases
  };
}
```

- [ ] **Step 4: 重新运行测试与构建**

Run: `npm test -- src/utils/diagnosticEngine.test.ts`  
Expected: PASS，2 tests passed

Run: `npm run build`  
Expected: PASS

- [ ] **Step 5: 提交诊断引擎**

```bash
git add src/utils/diagnosticEngine.ts src/utils/diagnosticEngine.test.ts
git commit -m "feat: add diagnostic engine with mechanism mapping"
```

### Task 4: 搭建首页与轻问诊体验

**Files:**
- Create: `src/components/sections/LandingHero.tsx`
- Create: `src/components/sections/TrustPanel.tsx`
- Create: `src/components/questionnaire/QuestionStepCard.tsx`
- Create: `src/components/questionnaire/ProgressRail.tsx`
- Modify: `src/App.tsx`
- Modify: `src/styles/global.css`

- [ ] **Step 1: 先写集成测试，覆盖首页到工作台的主流程**

```tsx
// src/App.test.tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';

it('moves from landing questionnaire to dashboard', async () => {
  const user = userEvent.setup();
  render(<App />);

  expect(screen.getByText('把你的业务流讲清楚')).toBeInTheDocument();

  await user.click(screen.getByRole('button', { name: '开始轻问诊' }));

  expect(screen.getByText('轻问诊')).toBeInTheDocument();

  await user.click(screen.getByRole('button', { name: '生成初步洞察' }));

  expect(screen.getByText('顾问工作台')).toBeInTheDocument();
});
```

- [ ] **Step 2: 运行测试确认首页流程尚未实现**

Run: `npm test -- src/App.test.tsx`  
Expected: FAIL，找不到 `把你的业务流讲清楚` 或 `顾问工作台`

- [ ] **Step 3: 实现首页与轻问诊组件**

```tsx
// src/components/sections/LandingHero.tsx
interface LandingHeroProps {
  onStart: () => void;
}

export function LandingHero({ onStart }: LandingHeroProps) {
  return (
    <section className="hero">
      <span className="eyebrow">AI 原生组织架构师</span>
      <h1>把你的业务流讲清楚，我们一起判断 AI 应该接管哪里。</h1>
      <p>
        先用几个轻量问题试试水，系统会基于行业特性、流程结构和组织 readiness
        给出第一版 AI 改造洞察。
      </p>
      <button onClick={onStart}>开始轻问诊</button>
    </section>
  );
}
```

```tsx
// src/components/questionnaire/QuestionStepCard.tsx
import type { QuestionnaireAnswer } from '../../types/diagnostic';

interface QuestionStepCardProps {
  answers: QuestionnaireAnswer;
  onSubmit: () => void;
}

export function QuestionStepCard({ answers, onSubmit }: QuestionStepCardProps) {
  return (
    <section className="question-card">
      <h2>轻问诊</h2>
      <p>我们先用有限信息换一版专业反馈。</p>
      <ul>
        <li>行业与团队：{answers.industry} / {answers.teamType}</li>
        <li>优化目标：{answers.primaryGoal}</li>
        <li>完整链路：{answers.workflowStages.join(' -> ')}</li>
        <li>重复或低效：{answers.lowEfficiencyStages.join('、')}</li>
      </ul>
      <button onClick={onSubmit}>生成初步洞察</button>
    </section>
  );
}
```

- [ ] **Step 4: 在 `App.tsx` 串联 landing 与 dashboard 场景**

```tsx
// src/App.tsx
import { LandingHero } from './components/sections/LandingHero';
import { QuestionStepCard } from './components/questionnaire/QuestionStepCard';
import { useDiagnosticState } from './store/useDiagnosticState';

export default function App() {
  const state = useDiagnosticState();

  if (state.view === 'landing') {
    return (
      <main className="page-shell">
        <LandingHero onStart={() => state.setView('dashboard')} />
        <QuestionStepCard answers={state.answers} onSubmit={() => state.setView('dashboard')} />
      </main>
    );
  }

  return (
    <main className="page-shell">
      <h1>顾问工作台</h1>
    </main>
  );
}
```

- [ ] **Step 5: 运行集成测试并补齐样式**

Run: `npm test -- src/App.test.tsx`  
Expected: PASS

Run: `npm run build`  
Expected: PASS

```bash
git add src/App.tsx src/App.test.tsx src/components src/styles/global.css
git commit -m "feat: add landing page and light questionnaire flow"
```

### Task 5: 实现顾问工作台核心模块

**Files:**
- Create: `src/components/layout/AppShell.tsx`
- Create: `src/components/layout/SectionHeader.tsx`
- Create: `src/components/dashboard/WorkflowMap.tsx`
- Create: `src/components/dashboard/InsightMetrics.tsx`
- Create: `src/components/dashboard/MechanismMatrix.tsx`
- Create: `src/components/dashboard/ReadinessRadar.tsx`
- Create: `src/components/dashboard/CaseLibrary.tsx`
- Modify: `src/App.tsx`
- Modify: `src/styles/global.css`

- [ ] **Step 1: 先写工作台展示测试**

```tsx
// src/App.test.tsx
it('shows dashboard modules after generating the initial insight', async () => {
  const user = userEvent.setup();
  render(<App />);

  await user.click(screen.getByRole('button', { name: '开始轻问诊' }));
  await user.click(screen.getByRole('button', { name: '生成初步洞察' }));

  expect(screen.getByText('业务流地图')).toBeInTheDocument();
  expect(screen.getByText('AI 落地机制判断图')).toBeInTheDocument();
  expect(screen.getByText('组织基建 readiness')).toBeInTheDocument();
});
```

- [ ] **Step 2: 运行测试确认这些模块尚不存在**

Run: `npm test -- src/App.test.tsx`  
Expected: FAIL，缺少 `业务流地图` 等文本

- [ ] **Step 3: 基于诊断引擎实现工作台组件**

```tsx
// src/components/dashboard/MechanismMatrix.tsx
import type { MechanismRecommendation } from '../../types/diagnostic';

interface MechanismMatrixProps {
  items: MechanismRecommendation[];
}

export function MechanismMatrix({ items }: MechanismMatrixProps) {
  return (
    <section className="panel">
      <h2>AI 落地机制判断图</h2>
      {items.map((item) => (
        <article key={item.stage} className="mechanism-card">
          <h3>{item.stage}</h3>
          <p>推荐机制：{item.mechanism.join(' / ')}</p>
          <p>{item.rationale}</p>
          <p>{item.whyNotOthers}</p>
        </article>
      ))}
    </section>
  );
}
```

```tsx
// src/components/dashboard/ReadinessRadar.tsx
import type { ReadinessScore } from '../../types/diagnostic';

export function ReadinessRadar({ items }: { items: ReadinessScore[] }) {
  return (
    <section className="panel">
      <h2>组织基建 readiness</h2>
      <div className="readiness-grid">
        {items.map((item) => (
          <article key={item.label}>
            <strong>{item.label}</strong>
            <span>{item.score}</span>
            <p>{item.summary}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
```

- [ ] **Step 4: 在 `App.tsx` 中生成报告并渲染完整工作台**

```tsx
// src/App.tsx
import { buildDiagnosticReport } from './utils/diagnosticEngine';
import { WorkflowMap } from './components/dashboard/WorkflowMap';
import { InsightMetrics } from './components/dashboard/InsightMetrics';
import { MechanismMatrix } from './components/dashboard/MechanismMatrix';
import { ReadinessRadar } from './components/dashboard/ReadinessRadar';
import { CaseLibrary } from './components/dashboard/CaseLibrary';

// inside component
const report = buildDiagnosticReport(state.answers);

if (state.view === 'dashboard') {
  return (
    <main className="dashboard-shell">
      <h1>顾问工作台</h1>
      <WorkflowMap stages={state.answers.workflowStages} />
      <InsightMetrics answers={state.answers} report={report} />
      <MechanismMatrix items={report.mechanismMatrix} />
      <ReadinessRadar items={report.readiness} />
      <CaseLibrary cases={report.recommendedCases} />
      <button onClick={() => state.setView('results')}>查看诊断结果</button>
    </main>
  );
}
```

- [ ] **Step 5: 跑测试与构建，确认工作台稳定**

Run: `npm test`  
Expected: PASS

Run: `npm run build`  
Expected: PASS

```bash
git add src/App.tsx src/components/dashboard src/components/layout src/styles/global.css
git commit -m "feat: add consultant dashboard modules"
```

### Task 6: 完成诊断结果页与咨询转化链路

**Files:**
- Create: `src/components/results/ResultSummary.tsx`
- Create: `src/components/results/RoadmapTimeline.tsx`
- Create: `src/components/results/ConsultingCTA.tsx`
- Modify: `src/App.tsx`
- Modify: `src/data/demoProfile.ts`

- [ ] **Step 1: 先写结果页测试**

```tsx
// src/App.test.tsx
it('shows result summary and consulting call-to-action', async () => {
  const user = userEvent.setup();
  render(<App />);

  await user.click(screen.getByRole('button', { name: '开始轻问诊' }));
  await user.click(screen.getByRole('button', { name: '生成初步洞察' }));
  await user.click(screen.getByRole('button', { name: '查看诊断结果' }));

  expect(screen.getByText('当前状态评估')).toBeInTheDocument();
  expect(screen.getByText('30 / 60 / 90 天改造路线图')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: '预约专家诊断' })).toBeInTheDocument();
});
```

- [ ] **Step 2: 运行测试确认结果页尚未接通**

Run: `npm test -- src/App.test.tsx`  
Expected: FAIL，缺少 `当前状态评估`

- [ ] **Step 3: 实现结果页组件**

```tsx
// src/components/results/ResultSummary.tsx
import type { DiagnosticReport } from '../../utils/diagnosticEngine';

export function ResultSummary({ report }: { report: DiagnosticReport }) {
  return (
    <section className="panel">
      <h2>当前状态评估</h2>
      <p>当前团队处于“AI 工具散点使用向流程级协同过渡”的阶段。</p>
      <ul>
        {report.priorityStages.map((stage) => (
          <li key={stage}>{stage}</li>
        ))}
      </ul>
    </section>
  );
}
```

```tsx
// src/components/results/ConsultingCTA.tsx
export function ConsultingCTA() {
  return (
    <section className="panel cta-panel">
      <h2>下一步行动</h2>
      <p>继续补充组织数据，获得更深度的自动化诊断与专家陪跑建议。</p>
      <div className="cta-actions">
        <button>上传更多组织数据</button>
        <button>预约专家诊断</button>
      </div>
    </section>
  );
}
```

- [ ] **Step 4: 在 `App.tsx` 串联 results 视图**

```tsx
// inside App component
if (state.view === 'results') {
  return (
    <main className="results-shell">
      <ResultSummary report={report} />
      <RoadmapTimeline />
      <ConsultingCTA />
    </main>
  );
}
```

- [ ] **Step 5: 运行完整测试与构建**

Run: `npm test`  
Expected: PASS

Run: `npm run build`  
Expected: PASS

```bash
git add src/App.tsx src/components/results src/data/demoProfile.ts
git commit -m "feat: add result page and consulting conversion flow"
```

### Task 7: 打磨视觉、补 README 并做最终验证

**Files:**
- Modify: `src/styles/global.css`
- Create: `src/test/setup.ts`
- Modify: `README.md`

- [ ] **Step 1: 补测试环境初始化文件**

```ts
// src/test/setup.ts
import '@testing-library/jest-dom';
```

- [ ] **Step 2: 完善全局样式，体现“温和未来感 + 咨询专业感 + SaaS 产品感”**

```css
/* src/styles/global.css */
:root {
  --bg: #f5f7fb;
  --panel: rgba(255, 255, 255, 0.78);
  --text: #162033;
  --muted: #60708a;
  --accent: #5568ff;
  --accent-soft: #eef1ff;
  --border: rgba(86, 104, 255, 0.12);
  --shadow: 0 20px 60px rgba(20, 32, 61, 0.08);
}

body {
  margin: 0;
  font-family: Inter, -apple-system, BlinkMacSystemFont, 'PingFang SC', sans-serif;
  color: var(--text);
  background:
    radial-gradient(circle at top left, rgba(85, 104, 255, 0.12), transparent 28%),
    linear-gradient(180deg, #f9fbff 0%, #f4f7fb 100%);
}

.panel {
  background: var(--panel);
  border: 1px solid var(--border);
  border-radius: 24px;
  box-shadow: var(--shadow);
  backdrop-filter: blur(18px);
}
```

- [ ] **Step 3: 编写 README，说明如何运行与演示主线**

```md
# AI 原生组织架构师 Demo

## 启动

```bash
npm install
npm run dev
```

## 核心演示路径

1. 首页查看 AI 顾问式引导
2. 点击“开始轻问诊”
3. 生成初步洞察进入顾问工作台
4. 查看业务流地图、AI 落地机制判断图、案例库与 readiness
5. 点击“查看诊断结果”进入结构化方案页
```
```

- [ ] **Step 4: 运行最终验证**

Run: `npm test`  
Expected: PASS，所有测试通过

Run: `npm run build`  
Expected: PASS，生成 `dist` 目录

Run: `npm run dev -- --host 0.0.0.0`  
Expected: 本地开发服务启动，输出访问地址

- [ ] **Step 5: 提交最终 polish 变更**

```bash
git add src/styles/global.css src/test/setup.ts README.md
git commit -m "docs: finalize demo styling and usage guide"
```

## 自检

### 1. Spec coverage

- `首页柔和引导`：Task 4
- `轻问诊两阶段漏斗中的第一阶段`：Task 4
- `AI 落地机制判断图`：Task 5
- `行业案例库`：Task 2, Task 5
- `组织基建 readiness`：Task 3, Task 5
- `结果页与 30/60/90 天路线图`：Task 6
- `深度咨询承接`：Task 6
- `视觉风格落地`：Task 7

当前计划覆盖 spec 的核心展示路径与实现边界，没有遗漏必需模块。

### 2. Placeholder scan

已检查计划中不存在以下占位写法：

- `TBD`
- `TODO`
- `implement later`
- `similar to task`

所有任务都给出了明确文件路径、命令与最小代码片段。

### 3. Type consistency

- `QuestionnaireAnswer`、`MechanismRecommendation`、`ReadinessScore` 在 Task 2 定义，并在 Task 3-6 复用
- `buildDiagnosticReport` 在 Task 3 定义，并在 Task 5 与 Task 6 使用
- `view` 状态固定为 `landing | dashboard | results`，在 Task 2 和 Task 4-6 保持一致

未发现命名和类型前后不一致问题。

## 执行交接

Plan complete and saved to `docs/superpowers/plans/2026-07-13-ai-native-organization-architect-demo.md`. Two execution options:

**1. Subagent-Driven (recommended)** - 我分任务派发执行并在关键节点回看，推进更快，也更稳。

**2. Inline Execution** - 我在当前会话里按计划连续实现，并在阶段点向你汇报。

Which approach?
