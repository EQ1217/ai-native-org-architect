# AI 原生组织架构师 Demo

Trae 创造力大赛参赛作品。演示"AI 原生组织架构师"的产品概念：让团队通过一轮轻问诊 + 业务数据上传，就能得到一份结构化的 AI 就绪度诊断报告，以及 Before/After 的业务流改造建议。

## 它做了什么

- **结构化轻问诊**：3 步问卷收敛行业、核心角色、业务流节点。
- **业务流工作台**：可视化画布上手改节点，前后向对比"当前工作方式 vs AI 参与后的新工作方式"。
- **规则 + AI 双层诊断**：本地规则引擎先出一版打底报告，随后异步调用火山方舟 Doubao 深度增强关键结论，页面顶部 banner 会从 `enhancing` 切到 `enhanced`。
- **数据解锁更深洞察**：上传业务明细（CSV / Excel / 文档）后，report 页会带上洞察摘要一起请求模型，生成更贴近你上下文的建议。

## 项目结构

```
src/                前端（Vite + React 18 + TS）
├── components/     landing / questionnaire / flow / insight / results
├── utils/          diagnosticEngine（规则）· llmDiagnostic（AI 增强合并）
├── store/          useDiagnosticState（视图状态机）
└── data/           行业画像等静态数据

server/llm-proxy.js Node 本地代理，读 .env.llm-proxy，向模型服务转发 /api/diagnose
vite.config.ts      /api → http://localhost:8787 的反代
```

## 本地启动

需要 Node 18+。

```bash
# 1. 装依赖
npm install

# 2. 配置模型 key（不会入库，已在 .gitignore）
cp .env.llm-proxy.example .env.llm-proxy   # 若已有 .env.llm-proxy 请跳过
# 编辑 .env.llm-proxy 填入：
# LLM_API_KEY=你的-key
# LLM_BASE_URL=https://ark.cn-beijing.volces.com/api/coding/v3
# LLM_MODEL=Doubao-Seed-2.0-lite
# LLM_PROXY_PORT=8787   # 可选

# 3. 起本地 LLM 代理（新开一个终端保持前台运行）
npm run llm:proxy

# 4. 起前端
npm run dev
```

打开 http://localhost:5173 即可体验。

### 健康检查

```bash
curl http://localhost:8787/api/health          # 期望 200，{ configured: true }
curl http://localhost:5173/api/health          # Vite 反代同一接口
```

不启动 llm-proxy 也能跑，只是 report 页会显示"模型增强暂不可用"，展示规则版结论。

## 常用脚本

```bash
npm run dev          # 前端开发
npm run llm:proxy    # 本地 LLM 反代
npm test             # Vitest 单测
npm run build        # tsc -b && vite build
npm run preview      # 预览生产构建
```

## Demo 演示路径

首页 → 轻问诊（3 步）→ 工作台（业务流编辑 + 上传业务数据）→ 报告页（Before/After + 就绪度 + 路线图）

report 页顶部有一条 banner：
- `enhancing`：AI 正在结合你的问诊 & 上传数据补充结论
- `enhanced`：AI 覆盖后的深度版结论已就绪（约 15–20 秒）
- `fallback`：模型超时或异常，展示规则版结论

## 技术栈

Vite · React 18 · TypeScript · @xyflow/react · dagre · Vitest · React Testing Library · Node（原生 http，无外部依赖）
