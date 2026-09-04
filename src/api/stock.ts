import request from "@/utils/request"

/** 股票行情接口 */
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
