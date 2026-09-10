import { getStockKLine, getStockQuotes, type StockQuote } from "@/api/stock"
import { isTradingTime, type Market } from "@/utils/tradingTime"
import { useQuery } from "@tanstack/react-query"
import { Radio, Typography } from "antd"
import { useState } from "react"
import { useSearchParams } from "react-router"

const { Text } = Typography

/** 图表周期选项 */
const CHART_OPTIONS = [
  { label: "分时", value: "trend" },
  { label: "五日", value: "5d" },
  { label: "日K", value: "daily" },
  { label: "周K", value: "weekly" },
  { label: "月K", value: "monthly" },
  { label: "1分", value: "1" },
  { label: "5分", value: "5" },
  { label: "15分", value: "15" },
  { label: "30分", value: "30" },
  { label: "60分", value: "60" },
]

/** 图表周期对应的接口参数 */
const CHART_OPTIONS_MAP: Record<string, string> = { trend: "1", "5d": "weekly" }

export default function StockDetail() {
  const [searchParams] = useSearchParams()
  const [params] = useState<[Market, string]>([
    (searchParams.get("market") || "cn") as Market,
    searchParams.get("code") || "000001",
  ])

  const trading = isTradingTime(params[0])
  const { data: stockData } = useQuery({
    queryKey: ["StockDetail", params[0], params[1]],
    queryFn: () => getStockQuotes(params[0], [params[1]]),
    refetchInterval: trading ? 5_000 : false,
  })
  const stock = (stockData as unknown as { code: number; data: StockQuote[] })?.data?.[0]

  const [select, setSelect] = useState(CHART_OPTIONS[0].value)

  useQuery({
    queryKey: ["StockDetail", params[0], params[1], select],
    queryFn: () => getStockKLine(params[0], params[1], CHART_OPTIONS_MAP[select] || select),
    refetchInterval: trading ? 10_000 : false,
  })

  return (
    <div className="flex flex-col gap-4">
      <div>搜索部分</div>

      <div className="flex items-center gap-3">
        <Text>代码: {params[1]}</Text>
        <Text>名称: {stock?.name}</Text>
      </div>

      <div>
        <Radio.Group value={select} onChange={(e) => setSelect(e.target.value)}>
          {CHART_OPTIONS.map((option) => (
            <Radio.Button key={option.value} value={option.value}>
              {option.label}
            </Radio.Button>
          ))}
        </Radio.Group>
      </div>
    </div>
  )
}
