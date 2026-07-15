# AI 原生组织架构师 - 产品逻辑重构 + UI 强化方案（V2）

## 一、本次要解决的 5 个问题

| # | 问题 | 根因 |
|---|---|---|
| 1 | UI 单薄、字体层次弱 | 字重/字号对比不足，卡片缺重量感 |
| 2 | 首页放"为什么这样做"没用；点击后不自动滚动 | 信息架构错位 + 缺交互 |
| 3 | 报告字太小、不专业；缺"轻量洞察->上传数据->深度诊断"递进 | 一上来就甩完整报告，没有价值递进 |
| 4 | "提效/降本/质量"目标选项互相矛盾 | 让用户选抽象目标，而非采集事实 |
| 5 | 问诊应采集团队规模/业务流/核心环节/环节IO，而非选选项 | 问诊设计错了 |

## 二、产品逻辑重构（核心）

### 新用户旅程
1. **首页**：Hero 直接开始 + 醒目 CTA。**删 TrustPanel**（用户进来不关心"为什么这样做"）。点击"开始诊断"后**自动滚动**到问诊区。
2. **结构化问诊（4 步事实采集，不再选目标）**：
   - Step1 行业 + 团队类型
   - Step2 团队规模（档位 1-10/11-30/31-100/100+）+ 核心生产环节（从该行业 workflow 选 1 个）
   - Step3 该核心环节的输入（多选预设）+ 输出（多选预设）
   - Step4 当前 AI 使用现状（多选）
3. **初步洞察页（轻量，问诊后直接到）**：
   - 一句话阶段判断（大字引文）
   - 核心环节适合的 AI 机制（突出大卡片，结论放大加粗）
   - 组织准备度雷达
   - **"想看深度组织改造方案？上传业务数据"** 强引导 CTA
4. **上传数据区**（初步洞察页内）：拖拽 + 选文件上传 -> 模拟"正在解析业务数据..."loading（约 2s）-> 跳深度报告
5. **深度诊断报告页（上传后）**：完整机制矩阵（核心+上下游环节）、30/60/90 路线图、案例对标、详细 readiness、专家咨询 CTA

### 删矛盾的"优化目标"
不再让用户选提效/降本/质量。改为事实采集，系统基于事实（团队规模、核心环节、IO）推断方向。InsightMetrics 的"优化目标"指标改为"团队规模"。

## 三、UI 强化（frontend-design）

- **字体层次**：h1 `clamp(2.6rem, 6vw, 4.6rem)` weight 800；h2 weight 800；指标数字 `2.4rem` weight 800；正文 weight 400 色 #5d6573。拉开对比。
- **卡片重量感**：阴影 `0 24px 60px rgba(77,58,35,0.12)`，圆角节奏统一 24/20/16。
- **大字结论**：机制判断、阶段判断用 1.5-1.8rem bold + 高亮底色，解决"AI 可改造的地方字太小"。
- **初步洞察页**：阶段判断做大号引文卡；核心机制卡占主视觉焦点。
- **自动滚动**：点击"开始诊断"后 `scrollIntoView({ behavior:'smooth' })` 到问诊。
- 暖米基调保留。

## 四、数据 / 引擎适配

### QuestionnaireAnswer 改造
- 删 `primaryGoal`
- 加 `teamSize: TeamSize | ''`、`coreStage: string`、`stageInputs: string[]`、`stageOutputs: string[]`
- 保留 industry/teamType/workflowStages/currentAiUsage；`lowEfficiencyStages` 弃用（深度报告改用 coreStage + 相邻环节）

### IndustryProfile 加字段
- `inputOptions: string[]`、`outputOptions: string[]`（行业级通用 IO 预设）
- 新增常量 `TEAM_SIZE_OPTIONS`

### 引擎
- `buildReadiness`：基于 teamSize + aiUsageCount（规模越大，组织基建要求越高）
- 新增 `buildInitialInsight(answers)`：返回阶段判断 + 核心环节机制（1 个）+ readiness
- `buildDiagnosticReport`：机制矩阵改为 coreStage + 其在 workflow 中的上下游环节
- 案例匹配按行业（不变）

## 五、文件改动清单

### 类型 / 数据 / 引擎 / store
- `types/diagnostic.ts`：QuestionnaireAnswer 改造 + TeamSize + IndustryProfile 加 IO 字段
- `data/industryProfiles.ts`：5 行业加 inputOptions/outputOptions + TEAM_SIZE_OPTIONS
- `utils/diagnosticEngine.ts`：buildInitialInsight + readiness 用 teamSize + 机制矩阵用 coreStage+相邻
- `store/useDiagnosticState.ts`：view 加 'insight'/'report' + isDataUploaded 状态

### 问卷
- `components/questionnaire/QuestionStepCard.tsx`：重写 4 步事实采集（删目标步，加规模/核心环节/IO 步）
- `ProgressRail.tsx`：4 步标签更新（行业团队 / 规模与核心环节 / 输入与输出 / AI 使用）

### 首页 / 流程
- `components/sections/LandingHero.tsx`：价值点精简融入 Hero，onStart 触发滚动
- **删除** `components/sections/TrustPanel.tsx` 的使用（App 不再渲染；文件是否删待确认）
- `App.tsx`：流程 landing -> questionnaire -> insight -> (upload) -> report；删 TrustPanel；加滚动

### 新增组件
- `components/insight/PreliminaryInsight.tsx`：初步洞察页（阶段判断 + 核心机制大卡 + readiness + 上传引导）
- `components/insight/DataUpload.tsx`：拖拽 + 选文件上传 + 模拟解析 loading
- `components/insight/CoreStageMechanism.tsx`：核心环节机制大卡（初步洞察用，结论大字）

### 复用 / 调整 dashboard & results
- `ReadinessRadar.tsx`：初步洞察 + 深度报告共用
- `MechanismMatrix.tsx`：深度报告用
- `RoadmapTimeline.tsx` / `CaseLibrary.tsx` / `ResultSummary.tsx` / `ConsultingCTA.tsx`：深度报告用
- `InsightMetrics.tsx`：删优化目标，加团队规模/核心环节
- `WorkflowMap.tsx`：初步洞察展示核心环节高亮

### 样式
- `styles/global.css`：字体层次、卡片重量、大字结论、上传区、滚动

### 测试
- `App.test.tsx` + `diagnosticEngine.test.ts`：同步重写（新问诊步 + insight -> upload -> report 流程）

## 六、验证
1. `npm test` 全绿
2. `npm run build` 通过
3. `npm run dev` 人工走查：首页(滚动) -> 4步事实问诊 -> 初步洞察 -> 上传数据(loading) -> 深度报告，确认字体层次、大字结论、无 AI 腔

## 七、待确认
- `TrustPanel.tsx` 文件首页不再用，是否删除？（删除文件需你确认）
- `demoProfile.ts`（V1 残留空壳）是否一并删除？
