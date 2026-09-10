import { isTradingTime, type Market } from "@/utils/tradingTime"

/** 交易时段内的轮询间隔（毫秒） */
const TRADING_POLL_INTERVAL = 5_000

/**
 * 交易状态与轮询间隔
 * 交易时间内给出 5 秒轮询间隔，非交易时段为 false（不轮询），可直接传给 React Query 的 refetchInterval
 */
export default function useTradingStatus(market: Market) {
  const trading = isTradingTime(market)
  // 显式标注类型，避免 false 被拓宽为 boolean（React Query 只接受 number | false）
  const refetchInterval: number | false = trading ? TRADING_POLL_INTERVAL : false
  return { trading, refetchInterval }
}
