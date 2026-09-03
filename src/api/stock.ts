import request from "@/utils/request"

export interface StockQuote {
  code: string
  name: string
  now: number
  percent: number
  low: number
  high: number
  yesterday: number
  source: string
}

export interface KLineData {
  date: string
  open: number
  close: number
  high: number
  low: number
  volume: number
  source: string
}

/** 批量获取股票行情 */
export function getStockQuotes(codes: string[]) {
  return request.post<StockQuote[]>("/stock/quotes", { codes })
}

/** 获取单只股票行情 */
export function getStockQuote(market: string, code: string) {
  return request.get<StockQuote>(`/stock/quote/${market}/${code}`)
}

/** 获取K线数据 */
export function getKLineData(
  market: string,
  code: string,
  period: string = "day",
  count: number = 360
) {
  return request.get<KLineData[]>(`/stock/kline/${market}/${code}`, { params: { period, count } })
}
