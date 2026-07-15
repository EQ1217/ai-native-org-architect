# AI 原生组织架构师 Demo

这是一个用于 Trae 创造力大赛的参赛 demo，演示“AI 原生组织架构师”产品概念：通过一轮轻问诊，把团队业务流收束成顾问工作台与结构化诊断结果。

## 启动方式

```bash
npm install
npm run dev
```

默认使用 Vite 本地开发服务器启动应用。

## 构建与测试

```bash
npm test
npm run build
```

可选的本地预览命令：

```bash
npm run preview
```

## Demo 核心演示路径

首页 -> 轻问诊 -> 工作台 -> 结果页

对应页面流转说明：

1. 首页：进入产品首屏，点击“开始轻问诊”
2. 轻问诊：查看默认样板问诊摘要，点击“生成初步洞察”
3. 工作台：查看业务流地图、机制判断、readiness 和案例库，点击“查看诊断结果”
4. 结果页：查看状态评估、30 / 60 / 90 天路线图，并体验深度咨询入口

## 技术栈

- Vite
- React 18
- TypeScript
- Vitest
- React Testing Library
