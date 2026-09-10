import { searchStock, type SearchResult } from "@/api/stock"
import type { Market } from "@/utils/tradingTime"
import { useQuery } from "@tanstack/react-query"
import { AutoComplete, Spin } from "antd"
import { useEffect, useState } from "react"

/**
 * 股票搜索框
 * 防抖搜索、过滤基金、美股代码去除交易所后缀，选中后回调 market + code
 */
export default function StockSearch({
  onSelect,
  style,
}: {
  onSelect: (market: Market, code: string) => void
  style?: React.CSSProperties
}) {
  const [keyword, setKeyword] = useState("")
  // 防抖：输入停止 300ms 后再发起搜索请求
  const [debouncedKeyword, setDebouncedKeyword] = useState("")
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedKeyword(keyword), 300)
    return () => clearTimeout(timer)
  }, [keyword])

  const { data, isFetching } = useQuery({
    queryKey: ["stockSearch", debouncedKeyword],
    queryFn: () => searchStock(debouncedKeyword),
    enabled: debouncedKeyword.length > 0,
  })

  // 过滤基金，只保留股票/指数
  const results = ((data as unknown as { code: number; data: SearchResult[] })?.data ?? [])
    .filter((item) => item.category !== "fund")
    // 美股代码去除 `.` 及后缀（如 usaapl.oq -> usaapl）
    .map((item) => ({
      ...item,
      code: item.market === "us" ? item.code.replace(/\..*$/, "") : item.code,
    }))

  const options = results.map((item) => ({
    value: item.code,
    label: `${item.name} ${item.code}`,
  }))

  const handleSelect = (value: string) => {
    const target = results.find((item) => item.code === value)
    if (!target) return
    const nextMarket: Market = target.market === "hk" ? "hk" : target.market === "us" ? "us" : "cn"
    onSelect(nextMarket, value)
  }

  return (
    <AutoComplete
      options={options}
      onSearch={setKeyword}
      onSelect={handleSelect}
      placeholder="输入代码或名称搜索"
      allowClear
      style={{ width: 320, ...style }}
      notFoundContent={isFetching ? <Spin size="small" /> : null}
    />
  )
}
