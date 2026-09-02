## 项目规则

1. 从不自动提交任何代码;
2. docker-compose 默认已执行过;
3. web 端和 api 端服务默认已启动 (从不自动启动任何服务, 需要启动其他服务时, 要进行授权确认);
4. 只允许使用 antd 组件库;
5. antd-css-var 中的 css 变量会跟随亮/暗主题变化, 优先使用 antd-css-var 中的 css 变量;
6. tailwind 统一使用 v4 版本的语法;
7. 只允许使用 zustand 状态管理;
8. 请求使用 axios + axios 自定义拦截器 + react-query 缓存;
9. 图表库使用 lightweight-charts;
10. react-hot-toast 作为全局 toast 提示;
