# 架构

## 入口与 Provider

- `src/main.tsx` — 应用入口：next-themes 的 `ThemeProvider`（`attribute="data-theme"`，默认跟随系统）包裹 `App`
- `src/App.tsx` — 顶层 Provider 组合（antd `ConfigProvider`：中文语言包 + 亮/暗算法、`QueryClientProvider`、`Toaster`）及路由定义

## 路由与认证

- `ProtectedRoute` 组件检查 Zustand 认证状态，未认证用户重定向至 `/login`
- 路由：
  - `/login` — 登录页
  - `/register` — 注册页
  - `/` — 重定向到 `/dashboard`
  - `/dashboard` — 仪表盘页（需认证）
  - `/stock-detail` — 股票详情页（需认证）
  - `/stock-signals` — 指标信号页（需认证）
  - `*` — 404页面

## 状态管理

- `src/zustand/useAuth.ts` — 认证 store（accessToken、refreshToken、isAuthenticated、username 及 login/logout/updateTokens），持久化至 localStorage（key: `auth`）
- `src/zustand/useStock.ts` — 当前股票 store（market、code 及 setStock），持久化至 localStorage（key: `stock`）；由仪表盘点击指数卡片或页内搜索写入，股票详情页/指标信号页读取

## 服务端状态

- `src/queryClient.ts` — TanStack Query 全局客户端（retry 1、关闭窗口聚焦重取、staleTime 10s）
- `src/hooks/useTradingStatus.ts` — 交易状态与轮询间隔：交易时段返回 5 秒、非交易时段返回 `false`，结果直接传给查询的 `refetchInterval`
- `StockQuoteCard` 在多页面复用同一 queryKey `["stockQuote", market, code]`，共享缓存

## API 层

- `src/utils/request.ts` — axios 实例（超时 10s）：
  - baseURL 取 `import.meta.env.VITE_BASE_URL`，未配置时回退 `/api`（走 Vite 代理）
  - 请求拦截器自动附加 `accessToken`（从 Zustand store 获取）
  - 响应拦截器解包统一结构 `{ code, message, data }` 直接返回 `data`；错误通过 toast 提示
  - 401 时自动刷新 token（并发请求进入等待队列，刷新后统一重试），刷新失败则清空登录态并跳转登录页
- `src/api/auth.ts` — 认证接口：`login`、`register`
- `src/api/stock.ts` — 股票接口：
  - `getStockQuotes(market, codes)` — 批量获取行情（POST `/stock-sdk/quotes/:market`）
  - `getStockKLine(market, code, period, startDate?, endDate?)` — 历史K线（GET `/stock-sdk/kline/:market/:code`）
  - `searchStock(keyword)` — 搜索股票/指数/基金（GET `/stock-sdk/search`）
  - `getStockSignals(market, code, period, maFast, maSlow)` — K线技术指标信号（GET `/stock-sdk/kline/:market/:code/signals`）

## 布局

- `src/layout/BaseLayout.tsx` — 已认证页面外壳：顶部栏（Logo + 主题切换 + 用户下拉菜单）、侧边栏菜单、面包屑、内容区（Card 包裹 `Outlet`）
- `src/layout/menus.tsx` — `MENU_ITEMS` 数组同时驱动侧边栏和面包屑，key 即路由路径：
  - `/dashboard` — 仪表盘
  - `/stock-detail` — 股票详情
  - `/stock-signals` — 指标信号

## 公共组件

- `src/components/StockPicker.tsx` — 股票选择区（搜索框 + 当前股票行情卡片），股票详情页与指标信号页共用
- `src/components/StockSearch.tsx` — 股票搜索框（300ms 防抖、过滤基金、美股代码去交易所后缀，选中回调 `(market, code)`）
- `src/components/StockQuoteCard.tsx` — 行情详情卡片（名称/代码/市场标签、现价与涨跌、12 项关键指标）
- `src/components/ThemeSegmented.tsx` — 主题下拉切换组件（浅色/深色/系统），基于 next-themes

## 工具函数

- `src/utils/tradingTime.ts` — 交易时间判断与市场归一化（`isTradingTime`、`getNextTradingTime`、`toMarket`），`Market` 类型为 `cn`/`hk`/`us`
- `src/utils/format.ts` — 数值格式化与涨跌色：`formatNum`、`formatAmount`（万/亿）、`formatPercent`、`getColor`、`UP_COLOR`/`DOWN_COLOR`（红涨绿跌）、`MARKET_LABEL`

## 图表

- `src/pages/StockDetail.tsx` 使用 lightweight-charts v5：主图为 CandlestickSeries（分时/五日为 LineSeries），副图为 HistogramSeries（成交量，面板 1）
- 时间处理：接口返回交易所本地时间，统一按"墙钟时间当作 UTC"解析并以 UTC 渲染，避免时区偏移

## 主题

- `src/index.css` — blanksheet 重置 + Tailwind v4 引入、自定义滚动条、`--bg-color`/`--text-color` CSS 变量通过 `[data-theme="dark"]` 切换
- `src/antd-css-var.css` — antd 设计令牌的 CSS 变量全集；为静态值（浅色模式默认），不会随主题自动切换 — 暗色模式由 antd 自身算法通过 `ConfigProvider` 处理
