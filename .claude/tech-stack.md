# 技术栈

- **React 19** + **Vite 8**，已启用 React Compiler（`@rolldown/plugin-babel` + `babel-plugin-react-compiler`）
- **Ant Design 6** — 唯一 UI 组件库；antd CSS 变量定义在 `src/antd-css-var.css`，用于亮/暗主题
- **Tailwind CSS 4**，通过 `@tailwindcss/vite` 插件（使用 v4 的 `@import "tailwindcss"` 语法，非 v3 配置文件）
- **Zustand 5**，使用 `persist` 中间件进行客户端状态持久化
- **TanStack React Query 5** 用于服务端状态缓存
- **next-themes** 主题切换（浅色/深色/跟随系统），通过 `data-theme` 属性作用于 `<html>`
- **axios**，带请求/响应拦截器的 API 调用封装
- **react-hot-toast** 全局通知
- **blanksheet** CSS 重置
