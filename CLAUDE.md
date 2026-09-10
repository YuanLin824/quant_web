# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

量化交易 Web 前端。接口基础路径由环境变量 `VITE_BASE_URL` 决定（在 `.env` 中配置，模板见 `.env.example`）；未配置时回退到 `/api`，此时由 Vite 开发服务器（端口 3000）将 `/api` 和 `/health` 代理到本地后端 `localhost:3001`。

## 常用命令

```bash
npm run dev        # 启动开发服务器（端口 3000）
npm run build      # 类型检查（tsc -b）+ Vite 生产构建
npm run preview    # 预览生产构建
npm run lint       # ESLint 检查
npm run format     # Prettier 格式化（仅 src 目录）
npm run commit     # czg 交互式提交（commitlint + lint-staged 约束）
```

## 代码风格

- Prettier：无分号、双引号、100 字符宽、LF 换行、尾逗号（es5）
- Prettier 插件：`prettier-plugin-tailwindcss`（类名排序）、`prettier-plugin-organize-imports`、`prettier-plugin-css-order`、`prettier-plugin-packagejson`
- ESLint：typescript-eslint + react-hooks + react-refresh + prettier 集成
- 提交：使用 `npm run commit`（czg 交互式），commitlint + husky + lint-staged 强制格式
- lint-staged（`.lintstagedrc`）对 js/jsx/ts/tsx/css/md/json 执行 Prettier —— 文档同样受格式约束

## 关键约定

- tailwind 使用 V4 版本的语法, 禁用 V3 版本语法
- Antd 是唯一 UI 组件库 — 不引入 shadcn、MUI 等
- Zustand 是唯一状态管理 — 不使用 Redux、Jotai 等
- 所有 API 调用走 `src/utils/request.ts` — 不直接使用 fetch 或裸 axios
- 响应拦截器已解包统一响应结构 `{ code, message, data }`，接口函数直接返回 `data`，调用处不再取 `.data`
- 服务端数据统一用 TanStack Query（`useQuery`）获取，交易时段轮询写在 `refetchInterval`
- 当前选中的股票由 `src/zustand/useStock.ts` 管理并持久化，页面间共享，不用 URL query 传参
- 主题感知样式：CSS 中使用 `[data-theme="dark"]` 选择器，组件中使用 next-themes 的 `useTheme()` hook
- 从不自动提交任何代码
- DEVELOPMENT-PLAN.md 是开发计划文档，所有开发计划和任务都在此文档中列出
- commitlint.config.cjs 是 commitlint 的配置文件(按照这个格式 type(scope): emoji subject 生成提交信息；scope 候选项由 `src/` 下的目录名自动生成)
- docker-compose 默认已执行过
- 不自动启动任何服务，需要启动其他服务时，要进行授权确认

## 更多文档

详细的技术栈、架构和路径别名配置请参阅 `.claude` 目录：

| 文档                                       | 说明                                                       |
| ------------------------------------------ | ---------------------------------------------------------- |
| [tech-stack.md](.claude/tech-stack.md)     | 技术栈详情（React、Vite、Ant Design、Tailwind CSS 等）     |
| [architecture.md](.claude/architecture.md) | 架构设计（路由、状态管理、API、布局、工具函数、主题）      |
| [path-alias.md](.claude/path-alias.md)     | 路径别名配置（`@/` → `src/`）                              |
| [API.md](API.md)                           | 后端接口文档索引（描述后端接口行为），各接口详情在 `docs/` |
