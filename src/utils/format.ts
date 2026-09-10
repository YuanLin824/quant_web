/** 市场名称映射 */
export const MARKET_LABEL: Record<string, string> = { cn: "沪深", hk: "港股", us: "美股" }

/** 涨跌颜色（红涨绿跌） */
export function getColor(change?: number) {
  if (change == null) return "inherit"
  return change > 0 ? "#f5222d" : change < 0 ? "#52c41a" : "inherit"
}

/** 格式化金额（万/亿） */
export function formatAmount(val?: number) {
  if (val == null) return "-"
  if (Math.abs(val) >= 1e8) return `${(val / 1e8).toFixed(2)}亿`
  if (Math.abs(val) >= 1e4) return `${(val / 1e4).toFixed(2)}万`
  return val.toFixed(2)
}

/** 格式化数字 */
export function formatNum(val?: number, digits = 2) {
  return val == null ? "-" : val.toFixed(digits)
}

/** 格式化百分比 */
export function formatPercent(val?: number) {
  return val == null ? "-" : `${val.toFixed(2)}%`
}
