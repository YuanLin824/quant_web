import { getKLineData, type KLineData } from "@/api/stock"
import { ArrowLeftOutlined } from "@ant-design/icons"
import { useQuery } from "@tanstack/react-query"
import { Button, Card, Radio, Spin, Typography } from "antd"
import {
  CandlestickSeries,
  createChart,
  HistogramSeries,
  type IChartApi,
  type ISeriesApi,
} from "lightweight-charts"
import { useTheme } from "next-themes"
import { useEffect, useRef, useState } from "react"
import { useNavigate, useSearchParams } from "react-router"

const { Title } = Typography

/** K线周期选项 */
const PERIOD_OPTIONS = [
  { label: "日K", value: "day" },
  { label: "周K", value: "week" },
  { label: "月K", value: "month" },
]

/** 主题颜色配置 */
const THEME_COLORS = {
  light: {
    background: "#ffffff",
    text: "#333",
    grid: "#f0f0f0",
    tooltipBg: "#fff",
    tooltipBorder: "#d9d9d9",
    tooltipText: "rgba(0,0,0,0.88)",
  },
  dark: {
    background: "#141414",
    text: "rgba(255,255,255,0.85)",
    grid: "#303030",
    tooltipBg: "#1f1f1f",
    tooltipBorder: "#303030",
    tooltipText: "rgba(255,255,255,0.85)",
  },
}

export default function KLine() {
  const [searchParams] = useSearchParams()
  const code = searchParams.get("code") || ""
  const name = searchParams.get("name") || ""
  const market = searchParams.get("market") || ""
  const { resolvedTheme } = useTheme()
  const navigate = useNavigate()

  const [period, setPeriod] = useState("day")
  const [tooltipData, setTooltipData] = useState<{
    date: string
    open: number
    high: number
    low: number
    close: number
    volume: number
  } | null>(null)
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number; containerWidth: number }>({
    x: 0,
    y: 0,
    containerWidth: 0,
  })
  const chartContainerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<IChartApi | null>(null)
  const candlestickSeriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null)
  const volumeSeriesRef = useRef<ISeriesApi<"Histogram"> | null>(null)
  const kLineDataRef = useRef<KLineData[]>([])

  const { data, isLoading } = useQuery({
    queryKey: ["kline", market, code, period],
    queryFn: () => getKLineData(market, code, period),
    enabled: !!code && !!market,
  })

  useEffect(() => {
    if (!chartContainerRef.current) return

    const themeColors = THEME_COLORS[resolvedTheme === "dark" ? "dark" : "light"]

    // 创建图表
    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { color: themeColors.background },
        textColor: themeColors.text,
        attributionLogo: false,
        panes: {
          separatorColor: "transparent",
          separatorHoverColor: "transparent",
          enableResize: false,
        },
      },
      grid: {
        vertLines: { color: themeColors.grid },
        horzLines: { color: themeColors.grid },
      },
      width: chartContainerRef.current.clientWidth,
      height: 500,
    })

    // 添加K线系列
    const candlestickSeries = chart.addSeries(CandlestickSeries, {
      upColor: "#f5222d",
      downColor: "#52c41a",
      borderDownColor: "#52c41a",
      borderUpColor: "#f5222d",
      wickDownColor: "#52c41a",
      wickUpColor: "#f5222d",
    })

    // 添加成交量系列（放在独立的面板）
    const volumeSeries = chart.addSeries(
      HistogramSeries,
      {
        color: "#26a69a",
        priceFormat: { type: "volume" },
        priceScaleId: "",
      },
      1
    )

    // 设置面板高度比例：K线图70%，成交量30%
    const panes = chart.panes()
    if (panes.length >= 2) {
      panes[0].setHeight(350)
      panes[1].setHeight(150)
    }

    chartRef.current = chart
    candlestickSeriesRef.current = candlestickSeries
    volumeSeriesRef.current = volumeSeries

    // 添加十字线移动事件
    chart.subscribeCrosshairMove((param) => {
      if (!param.time || !param.point) {
        setTooltipData(null)
        return
      }

      const candleData = param.seriesData.get(candlestickSeries) as
        { open: number; high: number; low: number; close: number } | undefined
      const volumeData = param.seriesData.get(volumeSeries) as { value: number } | undefined

      if (candleData) {
        const kLineItem = kLineDataRef.current.find((item) => item.date === param.time)
        setTooltipData({
          date: param.time as string,
          open: candleData.open,
          high: candleData.high,
          low: candleData.low,
          close: candleData.close,
          volume: volumeData?.value ?? kLineItem?.volume ?? 0,
        })
        setTooltipPos({
          x: param.point.x,
          y: param.point.y,
          containerWidth: chartContainerRef.current?.clientWidth ?? 0,
        })
      }
    })

    // 如果已有数据，重新设置
    if (kLineDataRef.current.length > 0) {
      const candleData = kLineDataRef.current.map((item) => ({
        time: item.date,
        open: item.open,
        high: item.high,
        low: item.low,
        close: item.close,
      }))

      const volumeData = kLineDataRef.current.map((item) => ({
        time: item.date,
        value: item.volume,
        color: item.close >= item.open ? "#f5222d50" : "#52c41a50",
      }))

      candlestickSeries.setData(candleData)
      volumeSeries.setData(volumeData)
      chart.timeScale().fitContent()
    }

    // 响应式调整
    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({ width: chartContainerRef.current.clientWidth })
      }
    }

    window.addEventListener("resize", handleResize)

    return () => {
      window.removeEventListener("resize", handleResize)
      chart.remove()
    }
  }, [resolvedTheme])

  useEffect(() => {
    if (!data || !candlestickSeriesRef.current || !volumeSeriesRef.current) return

    // 转换数据格式
    // data 格式: { code: 200, data: KLineData[], message: "..." }
    const kLineData = (data as unknown as { code: number; data: KLineData[] }).data ?? []
    kLineDataRef.current = kLineData

    const candleData = kLineData.map((item) => ({
      time: item.date,
      open: item.open,
      high: item.high,
      low: item.low,
      close: item.close,
    }))

    const volumeData = kLineData.map((item) => ({
      time: item.date,
      value: item.volume,
      color: item.close >= item.open ? "#f5222d50" : "#52c41a50",
    }))

    // 设置数据
    candlestickSeriesRef.current.setData(candleData)
    volumeSeriesRef.current.setData(volumeData)

    // 自动调整视图
    chartRef.current?.timeScale().fitContent()
  }, [data])

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate("/dashboard")}>
            返回
          </Button>
          <Title level={4} className="mb-0!">
            {name} ({code})
          </Title>
        </div>
        <Radio.Group
          options={PERIOD_OPTIONS}
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
          optionType="button"
          buttonStyle="solid"
        />
      </div>
      <Card styles={{ body: { padding: 0 } }}>
        <Spin spinning={isLoading}>
          <div ref={chartContainerRef} className="w-full relative">
            {tooltipData && (
              <div
                className="absolute z-10 pointer-events-none"
                style={{
                  left:
                    tooltipPos.x > tooltipPos.containerWidth / 2
                      ? tooltipPos.x - 220
                      : tooltipPos.x + 20,
                  top: Math.max(0, tooltipPos.y - 100),
                }}
              >
                <div
                  className="rounded-md shadow-lg p-3 text-sm"
                  style={{
                    background: THEME_COLORS[resolvedTheme === "dark" ? "dark" : "light"].tooltipBg,
                    border: `1px solid ${THEME_COLORS[resolvedTheme === "dark" ? "dark" : "light"].tooltipBorder}`,
                    color: THEME_COLORS[resolvedTheme === "dark" ? "dark" : "light"].tooltipText,
                  }}
                >
                  <div className="font-medium mb-2">{tooltipData.date}</div>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                    <span style={{ color: "#999" }}>开盘:</span>
                    <span>{tooltipData.open.toFixed(2)}</span>
                    <span style={{ color: "#999" }}>最高:</span>
                    <span style={{ color: "#f5222d" }}>{tooltipData.high.toFixed(2)}</span>
                    <span style={{ color: "#999" }}>最低:</span>
                    <span style={{ color: "#52c41a" }}>{tooltipData.low.toFixed(2)}</span>
                    <span style={{ color: "#999" }}>收盘:</span>
                    <span
                      style={{
                        color: tooltipData.close >= tooltipData.open ? "#f5222d" : "#52c41a",
                      }}
                    >
                      {tooltipData.close.toFixed(2)}
                    </span>
                    <span style={{ color: "#999" }}>成交量:</span>
                    <span>{(tooltipData.volume / 10000).toFixed(2)}万</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </Spin>
      </Card>
    </div>
  )
}
