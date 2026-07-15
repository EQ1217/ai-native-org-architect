# AI 原生组织架构师 - V4 方案（流程图编辑器 + 极简首页 + 标注嵌入）

## 一、本次两个核心需求

1. **首页极简化**：删掉右侧"业务流预览"，第一页只要一个干净的"开始诊断"按钮 + 动态效果背景，好看。
2. **业务流图形化**：
   - 问诊里改成**流程图编辑器**（react-flow）：节点可拖、可双击改名、可增删、可分叉/合并
   - 用户直接在图形上改文字，不再用文本框列表
   - 诊断结果**嵌入流程图**：每个步骤节点下方标注该用哪种 AI 方式（Skill/Copilot/Agent…），且**具体到替代哪个生产环节 + 行业最佳案例**，不能太粗

## 二、首页（极简 + 动态）
- 全屏居中：主标题"别让 AI 只当聊天框。" + 副标题一句 + 一个"开始诊断"按钮
- 动态背景：CSS 渐变流动 + 浮动光斑 + 按钮呼吸光晕（纯 CSS 动画，轻量）
- 删 [LandingHero](src/components/sections/LandingHero.tsx) 的 hero-preview
- 点击"开始诊断"自动滚动到问诊

## 三、业务流图形编辑器（react-flow）

### 依赖
`npm install @xyflow/react dagre @types/dagre`
- @xyflow/react = react-flow v12（节点拖拽/连线/增删/缩放）
- dagre = 自动布局（初始排布，用户可再拖）

### FlowEditor（问诊 Step2，可编辑）
- 选行业后用 dagre 预填一个默认流程图（含 1 个分叉示例，演示可分叉合并）
- 节点：双击 inline 改名；选中可删除
- 连线：拖 handle 连线（onConnect）；选中边可删
- 增节点："+ 添加步骤"按钮追加；"从选中节点分叉"按钮创建分支节点 + 连线
- 数据存 `answers.flowGraph = { nodes, edges }`（react-flow 的 Node/Edge 结构，label 存 data.label）
- 同时让用户**点选一个节点为核心环节**（answers.coreNodeId）

### FlowDiagram（只读，初步洞察 + 深度报告用）
- 同一 react-flow 画布，只读模式（不可拖拽/编辑，可缩放平移）
- 自定义节点：上方环节名 + 下方标注块（机制标签 + 替代动作 + 案例引用）
- 初步洞察：只标注核心环节
- 深度报告：标注所有节点

## 四、诊断标注（具体到生产环节 + 行业案例）

### 数据：每行业配 stageHints
```ts
interface StageHint {
  stage: string;        // 环节关键词
  replaceAction: string;// 具体替代哪个生产环节
  caseRef: string;      // 行业最佳案例引用
}
```
IndustryProfile 加 `stageHints: StageHint[]`，每行业配 4-5 个常见环节。

例（内容营销·趋势研究）：
- replaceAction: `用 agent 自动抓取抖音/小红书热点 + 竞品账号更新，替代人工每天翻 30 个账号做选题`
- caseRef: `参考案例：消费品牌新媒体团队，热点研究 agent 化后选题命中率提升 XX%`

### 引擎
- 节点标注 = 机制（buildMechanismRecommendation by label）+ 匹配 stageHints 的 replaceAction/caseRef；无匹配用机制通用 action
- buildPriorityStages 改用 flowGraph：核心节点 + 其相邻节点（边相连）
- buildInitialInsight / buildDiagnosticReport 适配 flowGraph

## 五、数据结构变化

### QuestionnaireAnswer
- 删 `workflowStages`、`coreStage`
- 加 `flowGraph: { nodes: FlowNode[]; edges: FlowEdge[] }`、`coreNodeId: string`
- 保留 industry/teamType/teamSize/stageInputText/stageOutputText/currentAiUsage

### FlowNode = { id, label }（映射 react-flow Node.data）
### FlowEdge = { id, source, target }（映射 react-flow Edge）

## 六、文件改动清单

### 依赖 / 类型 / 数据 / 引擎
- `package.json`：+ @xyflow/react, dagre, @types/dagre
- `types/diagnostic.ts`：FlowNode/FlowEdge/FlowGraph + QuestionnaireAnswer 改 + StageHint + IndustryProfile 加 stageHints
- `data/industryProfiles.ts`：5 行业默认 flowGraph + stageHints
- `utils/diagnosticEngine.ts`：flowGraph 邻居 + 节点标注（机制+替代+案例）

### 流程图组件（新增）
- `components/flow/FlowEditor.tsx`：react-flow 可编辑 + dagre 布局
- `components/flow/FlowDiagram.tsx`：react-flow 只读 + 节点标注
- `components/flow/StageNode.tsx`：自定义节点（编辑态/只读态）
- `components/flow/dagreLayout.ts`：nodes/edges -> dagre 布局 -> 带位置 nodes

### 问诊
- `components/questionnaire/QuestionStepCard.tsx`：Step2 改用 FlowEditor；Step3 选核心节点 + IO 文本框保留
- `ProgressRail.tsx`：标签（行业团队规模 / 业务流图 / 核心环节与IO / AI使用）

### 首页
- `components/sections/LandingHero.tsx`：极简 + 动态背景

### 初步洞察 / 深度报告
- `components/insight/PreliminaryInsight.tsx`：核心机制卡 + FlowDiagram（标注核心环节）+ 打码案例 + 上传
- 深度报告：新增 FlowDiagram（标注所有节点）替代/补充 MechanismMatrix；MechanismMatrix 可保留或并入 FlowDiagram
- `App.tsx`：流程适配

### 样式
- `styles/global.css`：react-flow 节点样式、首页动态背景、标注气泡样式
- import '@xyflow/react/dist/style.css'

### 测试
- `App.test.tsx`：适配（FlowEditor 交互难测，简化为：填默认图 -> 选核心节点 -> IO -> 生成 -> 上传 -> 报告）；react-flow 在 jsdom render 基本可用，拖拽/改名不测
- `diagnosticEngine.test.ts`：适配 flowGraph

## 七、验证
1. `npm install` 装依赖
2. `npm test` 全绿
3. `npm run build` 通过
4. `npm run dev` 走查：首页(极简动态) -> 流程图编辑(拖/改名/分叉) -> 选核心 -> 初步洞察(图上标注) -> 上传 -> 深度报告(全节点标注+具体替代+案例)

## 八、风险
- react-flow v12 API 与 dagre 集成需调试
- jsdom 下 react-flow 测试可能警告（用简化测试规避）
- 工作量大（流程图编辑器 + 标注嵌入 + 数据），是迄今最大改动

## 九、待确认
- `TrustPanel.tsx` / `demoProfile.ts` 废弃文件本轮一并删？
