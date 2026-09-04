# 架构

## 路由与认证

- `src/App.tsx` — 顶层 Provider 组合（antd `ConfigProvider`、`QueryClientProvider`、`ThemeProvider`、`Toaster`）及路由定义
- `ProtectedRoute` 组件检查 Zustand 认证状态，未认证用户重定向至 `/login`
- 路由：
  - `/login` — 登录页
  - `/register` — 注册页
  - `/` — 重定向到 `/dashboard`
  - `/dashboard` — 仪表盘页（需认证）
  - `*` — 404页面

## 状态管理

- `src/zustand/useAuth.ts` — 认证 store（token、用户名、登录/登出），持久化至 localStorage（key: `auth`）
- `src/zustand/useCounter.ts` — 计数器示例 store，持久化至 localStorage（key: `counter`）

## API 层

- `src/utils/request.ts` — axios 实例（`baseURL: /api`）；请求拦截器自动附加 `accessToken`（从 Zustand store 获取）；响应拦截器提取 `response.data` 并通过 toast 显示错误；401 错误自动刷新 token
- `src/api/auth.ts` — 认证接口（login、register、refresh、logout、getProfile）
- `src/api/stock.ts` — 股票行情接口：
  - `getStockQuotes(market, codes)` — 批量获取行情（POST `/stock-sdk/quotes/:market`）
  - `getStockQuote(market, code)` — 单只获取行情（GET `/stock-api/quote/:market/:code`）
  - `getFundQuotes(codes)` — 批量获取基金行情（POST `/stock-sdk/funds`）

## 布局

- `src/layout/BaseLayout.tsx` — 已认证页面外壳：顶部栏（Logo + 主题切换 + 用户下拉菜单）、侧边栏菜单、面包屑、内容区
- `src/layout/menus.tsx` — `MENU_ITEMS` 数组同时驱动侧边栏和面包屑，key 即路由路径：
  - `/dashboard` — 仪表盘
- `src/components/ThemeSegmented.tsx` — 主题下拉切换组件（浅色/深色/系统），基于 next-themes

## 工具函数

- `src/utils/tradingTime.ts` — 交易时间判断工具（isTradingTime、getNextTradingTime），支持 A股、港股、美股

## 主题

- `src/index.css` — 全局样式、自定义滚动条、`--bg-color`/`--text-color` CSS 变量通过 `[data-theme="dark"]` 切换
- `src/antd-css-var.css` — antd 设计令牌的 CSS 变量全集；为静态值（浅色模式默认），不会随主题自动切换 — 暗色模式由 antd 自身算法通过 `ConfigProvider` 处理
