# AI 原生组织架构师 - V3 重构方案（主动输入 + 引导转化 + 针对性方案）

## 一、本次解决的 5 个问题

| # | 问题 | 解法 |
|---|---|---|
| 1 | 首页标题字体太蠢、不引人入胜 | 重做 hero：短冲击标题 + 业务流可视化预览 + 案例背书 |
| 2 | 问诊全是选选项，没让用户"主动输入" | 业务流预填+可编辑增删；IO 用文本框自由描述 |
| 3 | 初步报告缺平行案例吸引下单 | 加同行业打码案例区（数字+公司名打码） |
| 4 | 上传数据没引导、没格式要求 | 按行业归类数据类型 + 下拉选 + 格式说明 |
| 5 | 深度报告不够针对性 | 每环节基于特性给针对性方案，引用用户输入的 IO |

## 二、产品逻辑（确认后的完整旅程）

1. **首页**：冲击标题 + 业务流可视化预览（小卡片流 + AI 节点高亮 + 轻呼吸）+ "5 大行业 · 7 组案例"背书。点击"开始诊断"自动滚动。
2. **结构化问诊（4 步，主动输入）**：
   - Step1 行业 + 团队类型 + 团队规模
   - Step2 **业务流环节**：选行业预填默认流程，用户可改环节名、增删环节（主动输入）
   - Step3 **核心环节 + 其输入输出**：从流程选 1 个核心环节，文本框自由描述输入/输出
   - Step4 当前 AI 使用现状
3. **初步洞察页（轻量报告 + 平行打码案例）**：
   - 阶段判断（大字）+ 核心环节机制（大字，引用用户输入的 IO）
   - 准备度雷达
   - **同行业案例区**：标题/痛点可见，**outcome 数字打码成 XX%、团队/公司打码**，"查看完整案例"按钮引导上传
   - 上传数据引导 CTA
4. **上传数据（引导式）**：按行业归类数据类型下拉选 -> 显示格式要求（CSV，需要哪些字段）-> 上传 -> 模拟解析 -> 深度报告
5. **深度报告（针对性方案）**：每个环节基于特性给针对性机制方案（引用 IO）+ 完整 case（不打码）+ 30/60/90 路线图 + 专家咨询

## 三、关键设计

### 首页标题（替换"5 分钟看清…"）
- 主标题：**"别让 AI 只当聊天框。"**（短、冲击、直击中小企业 AI 只停在 chatbot 的痛点）
- 副标题：描述业务流和环节输入输出，拿到 AI 改造方案与同行业案例，上传数据出深度诊断。
- 右侧业务流可视化预览：5-6 个小卡片用箭头串起，其中 2 个标"AI 接管"、1 个标"人工把关"，轻呼吸动效。

### 业务流编辑器（Step2）
- 选行业后预填默认环节列表
- 每个环节：可编辑 input（改名）+ 删除按钮
- 底部"+ 添加环节"按钮
- 整体可增删改，真正"主动输入"

### IO 文本框（Step3）
- 核心环节选定后，两个 textarea：输入是什么、输出是什么
- 自由描述，引擎不强制结构化

### 打码案例（初步洞察页）
- 组件渲染时对 outcome 做正则打码：数字 -> `XX`，保留"提升/缩短"等词
- teamType 保留（团队类型有参考价值），不另设公司名字段
- "查看完整案例"点击 -> 滚动到上传区

### 上传引导（按行业）
- 每个 IndustryProfile 加 `dataUploadTypes: { type, format, fields[] }[]`
  - 如内容营销：`{ type:'内容生产明细', format:'CSV', fields:['日期','内容标题','环节','负责人','耗时'] }`
- 上传区：下拉选数据类型 -> 显示格式与字段要求 -> 选/拖文件上传 -> 解析 loading

### 深度报告针对性方案
- `buildMechanismRecommendation` 增强：rationale 引用核心环节 IO，给具体落地动作
- MechanismMatrix 每环节卡展示机制 + 针对性方案 + 该环节 IO（核心环节）

## 四、数据结构变化

### QuestionnaireAnswer
- `stageInputs: string[]` / `stageOutputs: string[]` -> `stageInputText: string` / `stageOutputText: string`（文本描述）
- 其余不变（industry/teamType/teamSize/coreStage/workflowStages/currentAiUsage）

### IndustryProfile 加字段
- `dataUploadTypes: DataUploadType[]`
- `DataUploadType = { type: string; format: string; fields: string[] }`

## 五、文件改动清单

### 类型 / 数据 / 引擎
- `types/diagnostic.ts`：QuestionnaireAnswer IO 改文本 + DataUploadType + IndustryProfile 加 dataUploadTypes
- `data/industryProfiles.ts`：5 行业加 dataUploadTypes
- `utils/diagnosticEngine.ts`：buildMechanismRecommendation 增强（引用 IO）+ 适配 stageInputText/OutputText

### 问诊
- `components/questionnaire/QuestionStepCard.tsx`：Step1 加规模；Step2 业务流编辑器（改名/增删）；Step3 核心环节+IO 文本框
- `ProgressRail.tsx`：4 步标签（行业团队规模 / 业务流环节 / 核心环节与IO / AI使用）

### 首页
- `components/sections/LandingHero.tsx`：新标题 + 业务流可视化预览
- `App.tsx`：保留滚动

### 初步洞察
- `components/insight/PreliminaryInsight.tsx`：核心机制卡引用 IO + 新增打码案例区
- 新增 `components/insight/MaskedCaseList.tsx`：打码案例列表
- `components/insight/DataUpload.tsx`：改引导式（行业数据类型下拉 + 格式说明）

### 深度报告
- `components/dashboard/MechanismMatrix.tsx`：每环节展示针对性方案 + IO
- `components/results/CaseLibrary.tsx`：完整案例（不打码）

### 样式
- `styles/global.css`：hero 视觉预览、业务流编辑器、打码样式、上传引导样式、标题字体设计感

### 测试
- `App.test.tsx` + `diagnosticEngine.test.ts`：同步（新问诊交互 + IO 文本 + 上传引导）

## 六、验证
1. `npm test` 全绿
2. `npm run build` 通过
3. `npm run dev` 走查：首页(滚动) -> 4步主动输入 -> 初步洞察(打码案例) -> 上传引导 -> 深度报告(针对性方案)

## 七、待确认
- `TrustPanel.tsx` / `demoProfile.ts` 两个废弃文件仍未删（上轮遗留），本轮一并清？
