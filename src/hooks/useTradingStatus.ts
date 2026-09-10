import { isTradingTime, type Market } from "@/utils/tradingTime"
import { useMemo } from "react"

/** 交易时段内的轮询间隔（毫秒） */
const TRADING_POLL_INTERVAL = 5_000

/**
 * 交易状态与轮询间隔
 * 交易时间内给出 5 秒轮询间隔，非交易时段为 false（不轮询），可直接传给 React Query 的 refetchInterval
 *
 * trading 在每次渲染时重新求值（行情刷新会触发重渲染，收盘后随之停掉轮询）；
 * 返回对象用 useMemo 缓存，仅在 trading 变化时新建，可安全作为依赖项使用
 */
export default function useTradingStatus(market: Market) {
  const trading = isTradingTime(market)
  return useMemo(() => {
    // 显式标注类型，避免 false 被拓宽为 boolean（React Query 只接受 number | false）
    const refetchInterval: number | false = trading ? TRADING_POLL_INTERVAL : false
    return { trading, refetchInterval }
  }, [trading])
}
