import type { Market } from "@/utils/tradingTime"
import { create } from "zustand"
import { persist } from "zustand/middleware"

interface StockState {
  /** 当前股票市场 */
  market: Market
  /** 当前股票代码 */
  code: string
  /** 设置当前股票 */
  setStock: (market: Market, code: string) => void
}

const useStock = create<StockState>()(
  persist(
    (set) => ({
      market: "cn",
      code: "600519",
      setStock: (market, code) => set({ market, code }),
    }),
    {
      name: "stock",
    }
  )
)

export default useStock
