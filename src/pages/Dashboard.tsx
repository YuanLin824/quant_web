import { getStockQuotes } from "@/api/stock"
import { getNextTradingTime, isTradingTime, type Market } from "@/utils/tradingTime"
import useStock from "@/zustand/useStock"
import { useQuery } from "@tanstack/react-query"
import { Card, Col, Divider, Row, Spin, Tag, Typography } from "antd"
import { useNavigate } from "react-router"

const { Text, Title } = Typography

/** 股票数据类型（合并本地和API数据） */
interface StockData {
  code: string
  name: string
  price?: number
  changePercent?: number
  low?: number
  high?: number
  prevClose?: number
}

/** 涨跌颜色 */
const getColor = (percent?: number) => {
  if (percent == null) return "inherit"
  return percent > 0 ? "#f5222d" : percent < 0 ? "#52c41a" : "inherit"
}

/** 格式化数字 */
const formatNum = (val?: number) => val?.toFixed(2) ?? "-"

/** 格式化百分比 */
const formatPercent = (val?: number) => (val != null ? `${val.toFixed(2)}%` : "-")

/** A股指数列表 */
const A_SHARE_INDICES = [
  { code: "sh000001", name: "上证指数" },
  { code: "sz399001", name: "深证成指" },
  { code: "sz399006", name: "创业板指" },
  { code: "sh000680", name: "科创综指" },
  { code: "sh000688", name: "科创50" },
  { code: "sh000510", name: "中证A500" },
  { code: "sh000300", name: "沪深300" },
  { code: "sh000905", name: "中证500" },
  { code: "sh000906", name: "中证800" },
  { code: "sh000852", name: "中证1000" },
  { code: "sh000016", name: "上证50" },
  { code: "sh000010", name: "上证180" },
  { code: "sz399330", name: "深证100" },
]

/** 港股指数列表 */
const HK_INDICES = [
  { code: "hkHSI", name: "恒生指数" },
  { code: "hkHSCEI", name: "国企指数" },
  { code: "hkHSTECH", name: "恒生科技指数" },
]

/** 港股通指数列表 */
const HK_CONNECT_INDICES = [{ code: "sh000159", name: "沪股通" }]

/** 美股指数列表 */
const US_INDICES = [
  { code: "usDJI", name: "道琼斯" },
  { code: "usIXIC", name: "纳斯达克" },
  { code: "usINX", name: "标普500" },
  { code: "usHXC", name: "纳斯达克中国金龙指数" },
  { code: "usNDX", name: "纳斯达克100" },
]

/** 市场板块配置 */
const MARKET_SECTIONS = [
  { title: "A股", market: "cn" as Market, codes: A_SHARE_INDICES, color: "red" },
  { title: "港股", market: "hk" as Market, codes: HK_INDICES, color: "blue" },
  { title: "港股通", market: "cn" as Market, codes: HK_CONNECT_INDICES, color: "purple" },
  { title: "美股", market: "us" as Market, codes: US_INDICES, color: "green" },
]

/** 根据股票代码前缀判断所属市场：sh000001 -> cn */
function toMarket(code: string): "cn" | "hk" | "us" {
  if (code.startsWith("sh") || code.startsWith("sz")) return "cn"
  if (code.startsWith("hk")) return "hk"
  if (code.startsWith("us")) return "us"
  return "cn"
}

/** 渲染单个指数卡片 */
function IndexCard({ data, onClick }: { data: StockData; onClick?: () => void }) {
  const color = getColor(data.changePercent)

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
            {formatNum(data.price)}
          </Title>
          <Text style={{ color, fontSize: 14, fontWeight: 500 }}>
            {formatPercent(data.changePercent)}
          </Text>
        </div>
        <div className="flex justify-between" style={{ fontSize: 12, color: "#999" }}>
          <span>高: {formatNum(data.high)}</span>
          <span>低: {formatNum(data.low)}</span>
          <span>昨收: {formatNum(data.prevClose)}</span>
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
}: {
  title: string
  market: Market
  codes: { code: string; name: string }[]
  color: string
}) {
  const navigate = useNavigate()
  const setStock = useStock((s) => s.setStock)
  const codeList = codes.map((c) => c.code)
  const trading = isTradingTime(market)

  const { data, isLoading } = useQuery({
    queryKey: ["stockQuotes", title],
    queryFn: () => getStockQuotes(market, codeList),
    refetchInterval: trading ? 5_000 : false,
  })

  // 合并 API 返回数据与本地代码列表
  const quotes = data ?? []
  const dataSource = codes.map((item) => {
    const quote = quotes.find((q) => item.name === q.name)
    return { ...quote, ...item }
  })

  const handleCardClick = (item: StockData) => {
    // 保存到 zustand（本地持久化），详情页从此读取
    setStock(toMarket(item.code), item.code)
    navigate("/stock-detail")
  }

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
              <IndexCard data={item} onClick={() => handleCardClick(item)} />
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
      {MARKET_SECTIONS.map((section) => (
        <MarketSection key={section.title} {...section} />
      ))}
    </div>
  )
}
