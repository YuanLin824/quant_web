import StockQuoteCard from "@/components/StockQuoteCard"
import StockSearch from "@/components/StockSearch"
import useStock from "@/zustand/useStock"

/**
 * 股票选择区：搜索框 + 当前股票行情卡片
 * 读写全局股票状态（useStock），供股票详情页顶部使用
 */
export default function StockPicker() {
  const market = useStock((s) => s.market)
  const code = useStock((s) => s.code)
  const setStock = useStock((s) => s.setStock)

  return (
    <>
      <StockSearch onSelect={setStock} />
      <StockQuoteCard market={market} code={code} />
    </>
  )
}
