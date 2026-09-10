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

/** 基金行情接口 */
export interface FundQuote {
  code: string
  name: string
  nav: number
  accNav: number
  change: number
  navDate: string
}

/** K线数据接口（stock-sdk 原始格式） */
export interface KLineDto {
  code?: string
  name?: string
  date?: string
  timestamp?: number
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

/** 获取单只股票行情（stock-api） */
export function getStockQuote(market: string, code: string) {
  return request.get<StockQuote>(`/stock-api/quote/${market}/${code}`)
}

/** 批量获取基金行情（stock-sdk） */
export function getFundQuotes(codes: string[]) {
  return request.post<FundQuote[]>("/stock-sdk/funds", { codes })
}

/** 获取历史K线数据（stock-sdk） */
export function getStockKLine(market: string, code: string, period: string = "daily") {
  return request.get<KLineDto[]>(`/stock-sdk/kline/${market}/${code}`, { params: { period } })
}
