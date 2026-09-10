import request from "@/utils/request"

/** 股票行情接口（stock-sdk FullQuote） */
export interface StockQuote {
  code: string
  name: string
  price: number
  change: number
  changePercent: number
  open: number
  high: number
  low: number
  prevClose: number
  volume: number
  amount: number
  market: string
  /* 可选扩展字段 */
  marketId?: string
  time?: string
  timestamp?: number
  tz?: string
  turnoverRate?: number
  amplitude?: number
  volumeRatio?: number
  avgPrice?: number
  pe?: number
  pb?: number
  totalMarketCap?: number
  circulatingMarketCap?: number
  limitUp?: number
  limitDown?: number
  high52w?: number
  low52w?: number
  circulatingShares?: number
  totalShares?: number
  assetType?: string
  source?: string
}

/** K线数据接口（stock-sdk 原始格式） */
export interface KLineDto {
  code?: string
  name?: string
  date?: string
  /** 分钟K线（含分时）的时间字段，如 "2026-09-10 09:30" */
  time?: string
  timestamp?: number
  tz?: string
  open: number
  close: number
  high: number
  low: number
  volume?: number
  amount?: number
  change?: number
  changePercent?: number
  pctChg?: number
}

/** 批量获取股票行情（stock-sdk） */
export function getStockQuotes(market: string, codes: string[]) {
  return request.post<StockQuote[]>(`/stock-sdk/quotes/${market}`, { codes })
}

/** 获取历史K线数据（stock-sdk）
 * @param startDate 开始日期，格式 YYYYMMDD 或 YYYY-MM-DD（可选）
 * @param endDate 结束日期，格式 YYYYMMDD 或 YYYY-MM-DD（可选）
 */
export function getStockKLine(
  market: string,
  code: string,
  period: string = "daily",
  startDate?: string,
  endDate?: string
) {
  return request.get<KLineDto[]>(`/stock-sdk/kline/${market}/${code}`, {
    params: { period, startDate, endDate },
  })
}

/** 搜索结果接口 */
export interface SearchResult {
  code: string
  name: string
  market: string
  type: string
  category?: "stock" | "index" | "fund"
}

/** 搜索股票/指数/基金（stock-sdk） */
export function searchStock(keyword: string) {
  return request.get<SearchResult[]>("/stock-sdk/search", { params: { keyword } })
}

/** 指标信号接口 */
export interface StockSignal {
  /** 信号类型，如 ma_golden_cross / macd_death_cross / rsi_overbought */
  type: string
  date: string
  /** 信号发生K线的时间戳（毫秒） */
  timestamp: number
  close: number
  /** 附加信息，如 { fast: 5, slow: 20 } / { rsi: 81.6 } */
  detail?: Record<string, number>
}

/** 获取K线技术指标信号（stock-sdk）
 * @param period K线周期: daily / weekly / monthly，默认 daily
 * @param maFast MA 快线周期，默认 5
 * @param maSlow MA 慢线周期，默认 20
 */
export function getStockSignals(
  market: string,
  code: string,
  period: string = "daily",
  maFast: number = 5,
  maSlow: number = 20
) {
  return request.get<StockSignal[]>(`/stock-sdk/kline/${market}/${code}/signals`, {
    params: { period, maFast, maSlow },
  })
}
