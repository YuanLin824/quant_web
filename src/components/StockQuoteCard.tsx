import { getStockQuotes, type StockQuote } from "@/api/stock"
import { formatAmount, formatNum, formatPercent, getColor, MARKET_LABEL } from "@/utils/format"
import { isTradingTime, type Market } from "@/utils/tradingTime"
import { useQuery } from "@tanstack/react-query"
import { Card, Tag, Typography } from "antd"

const { Text, Title } = Typography

/**
 * 股票行情详情卡片
 * 展示名称/代码/市场、现价与涨跌、以及今日关键指标
 * （多页面复用同一 queryKey，共享缓存）
 */
export default function StockQuoteCard({ market, code }: { market: Market; code: string }) {
  const trading = isTradingTime(market)
  const { data, isLoading } = useQuery({
    queryKey: ["stockQuote", market, code],
    queryFn: () => getStockQuotes(market, [code]),
    refetchInterval: trading ? 5_000 : false,
  })

  const stock = (data as unknown as { code: number; data: StockQuote[] })?.data?.[0]
  const changeColor = getColor(stock?.changePercent)

  return (
    <Card loading={isLoading}>
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <Title level={4} className="mb-0!">
          {stock?.name ?? "-"}
        </Title>
        <Text type="secondary">{stock?.code ?? code}</Text>
        <Tag color="blue">{MARKET_LABEL[market] ?? market}</Tag>
      </div>

      <div className="mt-2 flex flex-wrap items-baseline gap-x-4">
        <span className="text-3xl font-bold" style={{ color: changeColor }}>
          {formatNum(stock?.price)}
        </span>
        <span style={{ color: changeColor }}>
          {stock?.change != null && stock.change > 0 ? "+" : ""}
          {formatNum(stock?.change)}
        </span>
        <span style={{ color: changeColor }}>
          {stock?.changePercent != null && stock.changePercent > 0 ? "+" : ""}
          {formatPercent(stock?.changePercent)}
        </span>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-x-6 gap-y-2 sm:grid-cols-3 lg:grid-cols-6">
        {[
          { label: "今开", value: formatNum(stock?.open) },
          { label: "最高", value: formatNum(stock?.high) },
          { label: "最低", value: formatNum(stock?.low) },
          { label: "昨收", value: formatNum(stock?.prevClose) },
          { label: "成交量", value: formatAmount(stock?.volume) },
          { label: "成交额", value: formatAmount(stock?.amount) },
          { label: "换手率", value: formatPercent(stock?.turnoverRate) },
          { label: "振幅", value: formatPercent(stock?.amplitude) },
          { label: "量比", value: formatNum(stock?.volumeRatio) },
          { label: "市盈率", value: formatNum(stock?.pe) },
          { label: "市净率", value: formatNum(stock?.pb) },
          { label: "总市值", value: formatAmount(stock?.totalMarketCap) },
        ].map((item) => (
          <div key={item.label}>
            <Text type="secondary" className="block text-xs">
              {item.label}
            </Text>
            <Text>{item.value}</Text>
          </div>
        ))}
      </div>
    </Card>
  )
}
