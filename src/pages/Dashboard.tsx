import { getStockQuotes, type StockQuote } from "@/api/stock"
import { getNextTradingTime, isTradingTime, type Market } from "@/utils/tradingTime"
import { useQuery } from "@tanstack/react-query"
import { Card, Col, Divider, Row, Spin, Tag, Typography } from "antd"
import { useNavigate } from "react-router"

const { Text, Title } = Typography

/** 表格数据类型（字段可选） */
interface StockRow {
  key: string
  code: string
  name: string
  now?: number
  percent?: number
  low?: number
  high?: number
  yesterday?: number
  source?: string
}

/** A股指数列表 */
const A_SHARE_INDICES = [
  { code: "SH000001", name: "上证指数" },
  { code: "SZ399001", name: "深证指数" },
  { code: "SZ399006", name: "创业板指" },
  { code: "SH000680", name: "科创综指" },
  { code: "SH000688", name: "科创50" },
  { code: "SH000510", name: "中证A500" },
  { code: "SH000300", name: "沪深300" },
  { code: "SH000905", name: "中证500" },
  { code: "SH000906", name: "中证800" },
  { code: "SH000852", name: "中证1000" },
  { code: "SH000016", name: "上证50" },
  { code: "SH000010", name: "上证180" },
  { code: "SZ399330", name: "深证100" },
]

/** 港股指数列表 */
const HK_INDICES = [
  { code: "HKHSI", name: "恒生指数" },
  { code: "HKHSCEI", name: "国企指数" },
  { code: "HKHSTECH", name: "恒生科技指数" },
]

/** 港股通指数列表 */
const HK_CONNECT_INDICES = [
  { code: "SH000159", name: "沪股通" },
  // { code: "SZBK0804", name: "深股通" },
  { code: "HKCES300", name: "沪深港300" },
]

/** 美股指数列表 */
const US_INDICES = [
  { code: "USDJI", name: "道琼斯" },
  { code: "USIXIC", name: "纳斯达克" },
  { code: "USINX", name: "标普500" },
  { code: "USHXC", name: "纳斯达克中国金龙指数" },
  { code: "USNDX", name: "纳斯达克100" },
]

/** 根据代码获取市场前缀 */
function getMarketFromCode(code: string): string {
  if (code.startsWith("SH") || code.startsWith("SZ")) return code.substring(0, 2)
  if (code.startsWith("HK")) return "HK"
  if (code.startsWith("US")) return "US"
  return ""
}

/** 渲染单个指数卡片 */
function IndexCard({ data, onClick }: { data: StockRow; onClick?: () => void }) {
  const percent = data.percent
  const percentText = percent != null ? (percent * 100).toFixed(2) + "%" : "-"
  const color =
    percent != null ? (percent > 0 ? "#f5222d" : percent < 0 ? "#52c41a" : "inherit") : "inherit"

  return (
    <Card size="small" hoverable onClick={onClick} className="cursor-pointer">
      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between">
          <Text strong style={{ fontSize: 14 }}>
            {data.name}
          </Text>
          <Text style={{ fontSize: 12, color: "#999" }}>{data.code}</Text>
        </div>
        <div className="flex items-baseline justify-between">
          <Title level={4} className="mb-0!" style={{ color }}>
            {data.now?.toFixed(2) ?? "-"}
          </Title>
          <Text style={{ color, fontSize: 14, fontWeight: 500 }}>{percentText}</Text>
        </div>
        <div className="flex justify-between" style={{ fontSize: 12, color: "#999" }}>
          <span>高: {data.high?.toFixed(2) ?? "-"}</span>
          <span>低: {data.low?.toFixed(2) ?? "-"}</span>
          <span>昨收: {data.yesterday?.toFixed(2) ?? "-"}</span>
        </div>
      </div>
    </Card>
  )
}

/** 渲染单个市场板块 */
function MarketSection({
  title,
  market,
  codes,
  color,
  clickable = true,
}: {
  title: string
  market: Market
  codes: { code: string; name: string }[]
  color: string
  clickable?: boolean
}) {
  const navigate = useNavigate()
  const codeList = codes.map((c) => c.code)
  const trading = isTradingTime(market)

  const { data, isLoading } = useQuery({
    queryKey: ["stockQuotes", title],
    queryFn: () => getStockQuotes(codeList),
    // 只在交易时间内轮询，否则不轮询
    refetchInterval: trading ? 5_000 : false,
  })

  // 合并 API 返回数据与本地名称
  // data 格式: { code: 200, data: StockQuote[], message: "..." }
  const quotes = (data as unknown as { code: number; data: StockQuote[] })?.data ?? []
  const dataSource: StockRow[] = codes.map((item) => {
    const quote = quotes.find((q) => q.code === item.code)
    return {
      key: item.code,
      code: item.code,
      name: quote?.name || item.name,
      now: quote?.now,
      percent: quote?.percent,
      low: quote?.low,
      high: quote?.high,
      yesterday: quote?.yesterday,
      source: quote?.source,
    }
  })

  const handleCardClick = clickable
    ? (item: StockRow) => {
        const marketPrefix = getMarketFromCode(item.code)
        const stockCode = item.code.substring(marketPrefix.length)
        navigate(
          `/dashboard/kline?code=${stockCode}&name=${encodeURIComponent(item.name)}&market=${marketPrefix}`
        )
      }
    : undefined

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <Tag color={color} style={{ fontSize: 20, fontWeight: "bold", padding: "8px 16px" }}>
          {title}
        </Tag>
        {!trading && (
          <Text type="secondary" style={{ fontSize: 20 }}>
            已休市，下次开盘：{getNextTradingTime(market)}
          </Text>
        )}
      </div>
      <Divider className="my-0!" />
      <Spin spinning={isLoading}>
        <Row gutter={[12, 12]}>
          {dataSource.map((item) => (
            <Col key={item.code} xs={24} lg={12} xl={8} xxl={6}>
              <IndexCard
                data={item}
                onClick={handleCardClick ? () => handleCardClick(item) : undefined}
              />
            </Col>
          ))}
        </Row>
      </Spin>
    </div>
  )
}

export default function Dashboard() {
  return (
    <div className="flex flex-col gap-6">
      <MarketSection title="A股" market="A" codes={A_SHARE_INDICES} color="red" />
      <MarketSection title="港股" market="HK" codes={HK_INDICES} color="blue" />
      <MarketSection title="港股通" market="HKConnect" codes={HK_CONNECT_INDICES} color="purple" />
      <MarketSection title="美股" market="US" codes={US_INDICES} color="green" clickable={false} />
    </div>
  )
}
