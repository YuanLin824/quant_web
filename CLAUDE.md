# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

量化交易 Web 前端。后端 API 运行在 `localhost:3001`，Vite 开发服务器（端口 3000）将 `/api` 和 `/health` 代理到后端。

## 常用命令

```bash
npm run dev        # 启动开发服务器（端口 3000）
npm run build      # 类型检查（tsc -b）+ Vite 生产构建
npm run preview    # 预览生产构建
npm run lint       # ESLint 检查
npm run format     # Prettier 格式化
npm run commit     # czg 交互式提交（commitlint + lint-staged 约束）
```

暂未配置测试运行器。

## 技术栈

- **React 19** + **Vite 8**，已启用 React Compiler（`@rolldown/plugin-babel` + `babel-plugin-react-compiler`）
- **Ant Design 6** — 唯一 UI 组件库；antd CSS 变量定义在 `src/antd-css-var.css`，用于亮/暗主题
- **Tailwind CSS 4**，通过 `@tailwindcss/vite` 插件（使用 v4 的 `@import "tailwindcss"` 语法，非 v3 配置文件）
- **Zustand 5**，使用 `persist` 中间件进行客户端状态持久化
- **TanStack React Query 5** 用于服务端状态缓存
- **next-themes** 主题切换（浅色/深色/跟随系统），通过 `data-theme` 属性作用于 `<html>`
- **axios**，带请求/响应拦截器的 API 调用封装
- **react-hot-toast** 全局通知
- **blanksheet** CSS 重置

## 架构

### 路由与认证

- `src/App.tsx` — 顶层 Provider 组合（antd `ConfigProvider`、`QueryClientProvider`、`ThemeProvider`、`Toaster`）及路由定义
- `ProtectedRoute` 组件检查 Zustand 认证状态，未认证用户重定向至 `/login`
- 路由：`/login`、`/register`、`/`（需认证）、`*`（404）

### 状态管理

- `src/zustand/useAuth.ts` — 认证 store（token、用户名、登录/登出），持久化至 localStorage（key: `auth`）
- `src/zustand/useCounter.ts` — 计数器示例 store，持久化至 localStorage（key: `counter`）

### API 层

- `src/utils/request.ts` — axios 实例（`baseURL: /api`）；请求拦截器自动附加 `accessToken`；响应拦截器提取 `response.data` 并通过 toast 显示错误
- `src/api/auth.ts` — 认证接口（login、register、refresh、logout、getProfile）

### 布局

- `src/layout/BaseLayout.tsx` — 已认证页面外壳：顶部栏（Logo + 主题切换 + 用户下拉菜单）、侧边栏菜单、面包屑、内容区
- `src/layout/menus.tsx` — `MENU_ITEMS` 数组同时驱动侧边栏和面包屑，key 即路由路径
- `src/components/ThemeSegmented.tsx` — 主题下拉切换组件（浅色/深色/系统），基于 next-themes

### 主题

- `src/index.css` — 全局样式、自定义滚动条、`--bg-color`/`--text-color` CSS 变量通过 `[data-theme="dark"]` 切换
- `src/antd-css-var.css` — antd 设计令牌的 CSS 变量全集；为静态值（浅色模式默认），不会随主题自动切换 — 暗色模式由 antd 自身算法通过 `ConfigProvider` 处理

## 路径别名

`@/` 映射到 `src/`（在 tsconfig 和 Vite 的 `tsconfigPaths: true` 中配置）。

## 代码风格

- Prettier：无分号、双引号、100 字符宽、LF 换行、尾逗号（es5）
- Prettier 插件：`prettier-plugin-tailwindcss`（类名排序）、`prettier-plugin-organize-imports`、`prettier-plugin-css-order`、`prettier-plugin-packagejson`
- ESLint：typescript-eslint + react-hooks + react-refresh + prettier 集成
- 提交：使用 `npm run commit`（czg 交互式），commitlint + husky + lint-staged 强制格式

## 关键约定

- Antd 是唯一 UI 组件库 — 不引入 shadcn、MUI 等
- Zustand 是唯一状态管理 — 不使用 Redux、Jotai 等
- 所有 API 调用走 `src/utils/request.ts` — 不直接使用 fetch 或裸 axios
- 主题感知样式：CSS 中使用 `[data-theme="dark"]` 选择器，组件中使用 next-themes 的 `useTheme()` hook
- 从不自动提交任何代码
- DEVELOPMENT-PLAN.md 是开发计划文档，所有开发计划和任务都在此文档中列出
- commitlint.config.cjs 是 commitlint 的配置文件(按照这个格式 type(scope): emoji subject 生成提交信息)
- docker-compose 默认已执行过
- 不自动启动任何服务，需要启动其他服务时，要进行授权确认
