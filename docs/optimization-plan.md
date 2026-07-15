# AI 原生组织架构师 — 对客交付改造方案

## 一、诊断结论（问题本质）

不是视觉问题，是**产品视角 + 文案 + 假问诊**三个根因，导致它只能算 demo：

1. **视角错位**：产品定位"给中小企业管理者"，却满屏"顾问工作台""顾问预诊"——是给咨询顾问看的内部工具视角。管理者进来想看"我的组织怎么改"，看到的是"顾问工作台"。
2. **假问诊**：[QuestionStepCard.tsx](src/components/questionnaire/QuestionStepCard.tsx) 不让用户答题，只把 [demoProfile.ts](src/data/demoProfile.ts) 写死的样板摆出来点个按钮。
3. **AI腔文案**：每句都在自我修饰、绕弯、描述过程，不交付结论。
4. **单一行业写死**：只有"内容营销/新媒体团队"，与"任何业务流"定位自相矛盾。
5. **CTA暴露demo**：点"预约专家诊断"弹"专家诊断入口已为 demo 预留"。

## 二、改造策略

翻转视角：**从"顾问工具"→"管理者诊断报告"**。主角是用户的组织，不是"我们"。

三件事并行：
- **真问诊**：4 步输入，5 个行业样板驱动，不再展示写死答案
- **全量去AI腔**：结论式 / 数据式 / 动作式，砍掉"温和/低压/慢慢/先XX/我们一起"
- **暖色精修**：保留米色基调，加真数据可视化（SVG 雷达图、业务流箭头），统一卡片节奏，克制动效

## 三、真问诊设计（4 步）

| 步骤 | 内容 | 交互 |
|---|---|---|
| 1 | 选行业 + 团队类型 | 5 个行业卡片单选 → 该行业下团队类型单选 |
| 2 | 选优化目标 | 5 选 1（提效/质量/稳定/成本/可见性）|
| 3 | 确认业务流 + 勾选低效环节 | 行业默认环节展示，勾选哪些是瓶颈 |
| 4 | 选当前 AI 使用场景 | 多选 |

5 个行业样板：内容营销/新媒体、电商运营、客户服务、研发团队、销售SDR。每个配：团队类型选项、默认 workflow、低效环节建议、2 个案例、AI 场景选项。

完成后 → 生成诊断报告（dashboard）。

## 四、逐文件改动清单

### 数据层
- `src/data/demoProfile.ts` → 重写为 `src/data/industryProfiles.ts`：5 个行业完整配置 + 案例。导出 `defaultAnswers`（初始空态）+ `industryProfiles`。

### 类型层
- `src/types/diagnostic.ts`：加 `IndustryKey` 枚举、`IndustryProfile` 类型、`QuestionnaireAnswer` 增加可选字段。

### store
- `src/store/useDiagnosticState.ts`：初始 `answers` 为空态（行业未选），支持 `updateAnswers` 逐步填充；`view` 增加 `'questionnaire'` 独立态。

### 诊断引擎
- `src/utils/diagnosticEngine.ts`：
  - `buildReadiness` 按用户输入（AI 使用数、低效环节数、行业）动态算分
  - `buildRecommendedCases` 按行业精确匹配
  - `buildMechanismRecommendation` 保留逻辑，适配多行业环节名

### 问卷组件（重写）
- `src/components/questionnaire/QuestionStepCard.tsx`：重写为 4 步真表单，内部 `step` 状态切换，每步有"上一步/下一步"，第 4 步"生成诊断报告"。
- `src/components/questionnaire/ProgressRail.tsx`：改 4 步进度（行业→目标→环节→AI使用）。

### 首页
- `src/components/sections/LandingHero.tsx`：h1/lead/note 全量去AI腔。
- `src/components/sections/TrustPanel.tsx`：标题/描述全量去AI腔，删"温和引导体验"等。

### 布局 / 流程
- `src/App.tsx`：流程改为 landing → questionnaire → dashboard → results；视角翻转（"顾问工作台"→"诊断报告"）。
- `src/components/layout/AppShell.tsx`：description 翻转为用户视角。

### dashboard 组件（视角 + 文案 + 视觉）
- `InsightMetrics.tsx` / `WorkflowMap.tsx` / `MechanismMatrix.tsx` / `CaseLibrary.tsx`：文案去AI腔。
- `ReadinessRadar.tsx`：**改真 SVG 雷达图**（4 维：工具基建/组织基建/人才能力/文化治理），作为结果页主视觉焦点。
- `WorkflowMap.tsx`：环节间加流向箭头，优先节点更突出。

### results 组件
- `ResultSummary.tsx` / `RoadmapTimeline.tsx`：去AI腔。
- `ConsultingCTA.tsx`：删"demo预留"文案，CTA 真实化（不加新商业化入口，按用户要求）。

### 样式
- `src/styles/global.css`：新增雷达图样式、流向箭头、统一卡片节奏、克制淡入动效。保留暖米基调，提升精致度。

### 测试（必须同步重写）
- `src/App.test.tsx`：适配新文案 + 真问诊 4 步流程。
- `src/utils/diagnosticEngine.test.ts`：适配新数据结构（5 行业案例匹配）。

## 五、文案改写示例（旧 → 新）

| 位置 | 旧（AI腔） | 新（结论式） |
|---|---|---|
| Hero h1 | 把你的业务流慢慢讲清楚，我们一起判断 AI 更适合参与哪里。 | 5 分钟，看清你的业务流哪里该让 AI 接管、哪里必须人决策。 |
| Hero lead | 先别急着大改组织。我们用一轮低压的轻问诊… | 回答 4 个问题，拿到你团队的 AI 改造优先级清单——不重组组织，先找最高杠杆的环节。 |
| Hero note | 5 分钟内看见第一版判断，不需要先整理正式材料。 | 不需要准备材料，按行业直接出诊断。 |
| TrustPanel | 这更像温和的顾问预诊 | 从单点切入，不重组组织 |
| ReadinessRadar desc | 先不做复杂图形，用四类 readiness 卡片判断… | 四个维度评估你组织的 AI 落地准备度。 |
| QuestionStepCard | 这里先用默认样板答案演示一轮温和问诊。 | （删除——改为真问诊，无此句） |
| dashboard desc | 这是一版面向顾问的初步工作台：先把…放在同一个视图里。 | 基于你的回答生成的诊断结论。 |
| ConsultingCTA | 专家诊断入口已为 demo 预留 | （删除——改为真实引导文案） |

## 六、验证方式

1. `npm test` — 测试全绿
2. `npm run build` — 构建通过
3. `npm run dev` — 人工走查：landing → 4 步真问诊 → 报告 → 结果页，确认无 AI腔、无"demo"字样、视角为管理者

## 七、不做的事（边界）

- 不加后端、不接真 AI 调用（大赛 demo 前端模拟即可）
- 不加导出 PDF / 留资表单 / 付费墙（用户明确暂不加）
- 不推翻整体技术栈，复用现有 React + Vite + 纯 CSS 结构
- 视觉保留暖米基调，不换冷色
