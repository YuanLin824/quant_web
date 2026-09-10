import { getStockKLine, type KLineDto } from "@/api/stock"
import StockPicker from "@/components/StockPicker"
import {
  DOWN_COLOR,
  formatAmount,
  formatNum,
  formatPercent,
  getColor,
  UP_COLOR,
} from "@/utils/format"
import useStock from "@/zustand/useStock"
import { useQuery } from "@tanstack/react-query"
import { Card, Radio, Spin } from "antd"
import {
  CandlestickSeries,
  createChart,
  HistogramSeries,
  LineSeries,
  LineStyle,
  type ISeriesApi,
  type Time,
  type UTCTimestamp,
} from "lightweight-charts"
import { useTheme } from "next-themes"
import { useEffect, useLayoutEffect, useRef, useState } from "react"

/** 图表周期选项 */
const CHART_OPTIONS = [
  { label: "分时", value: "trend" },
  // 五日分时暂不展示（相关逻辑保留，取消注释即可恢复）
  // { label: "五日", value: "5d" },
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
const CHART_OPTIONS_MAP: Record<string, string> = { trend: "1" }

/** 默认显示最新 K 线条数 */
const DEFAULT_VISIBLE_BARS = 100
/** 最少显示 K 线条数 */
const MIN_VISIBLE_BARS = 30
/** 最多显示 K 线条数 */
const MAX_VISIBLE_BARS = 200

/** 分时图固定显示的时间窗口（含午间休市与收盘后余量） */
const TREND_START_TIME = "09:30"
const TREND_END_TIME = "15:30"

/**
 * 放大限制：可见条数不少于 30 条
 * 注意：maxBarSpacing 决定最小可见条数（间距越大可见条数越少）
 */
function getBarSpacingLimits(width: number, barCount: number) {
  return {
    maxBarSpacing: width / Math.min(MIN_VISIBLE_BARS, barCount || MIN_VISIBLE_BARS),
  }
}

/**
 * 转换为图表时间
 * 接口返回的时间为交易所本地时间（日K/周K/月K 用 `date`，分钟K 用 `date` 或 `time`），
 * 统一按"墙钟时间当作 UTC"解析，图表以 UTC 渲染，从而原样显示交易所本地时间。
 */
function toTime(item: KLineDto): Time {
  const raw = item.date ?? item.time ?? ""
  const matched = raw.match(/(\d{4})[-/](\d{2})[-/](\d{2})[ T](\d{2}):(\d{2})/)
  if (matched) {
    // 分钟K线：构造 UTC 时间戳，避免本地时区偏移
    const [, y, mo, d, h, mi] = matched
    return (Date.parse(`${y}-${mo}-${d}T${h}:${mi}:00Z`) / 1000) as UTCTimestamp
  }
  // 日K及以上：直接使用日期字符串（business day）
  if (raw) return raw.slice(0, 10)
  // 兜底：时间戳（毫秒）
  return Math.floor((item.timestamp ?? 0) / 1000) as UTCTimestamp
}

/** 各位补零 */
const pad = (n: number) => String(n).padStart(2, "0")

/** 格式化时间：日K及以上输出 YYYY-MM-DD，分钟K输出 YYYY-MM-DD HH:mm */
function formatTime(time: Time, date?: string, dateOnly = false): string {
  // 优先使用接口原始日期字符串
  const raw = date ?? (typeof time === "string" ? time : "")
  if (raw) {
    if (dateOnly) return raw.slice(0, 10)
    return raw.length > 10 ? raw.slice(0, 16) : `${raw} 00:00`
  }
  // 时间戳：图表按 UTC 渲染，保持一致
  const d = new Date(Number(time) * 1000)
  const day = `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`
  return dateOnly ? day : `${day} ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}`
}

/**
 * 横轴时间格式：
 * date → YY-MM-DD（日K及以上）；time → HH:mm（分时）；
 * fulldate → YYYY-MM-DD（分钟K）；mdhm → MM-DD HH:mm（五日）
 */
type AxisTimeFormat = "date" | "time" | "fulldate" | "mdhm"

function formatAxisTime(time: Time, format: AxisTimeFormat = "date"): string {
  if (typeof time === "string") {
    // "2024-01-15" -> "24-01-15" / "2024-01-15" / "01-15"
    const [y, m, d] = time.slice(0, 10).split("-")
    if (format === "fulldate") return `${y}-${m}-${d}`
    if (format === "mdhm") return `${m}-${d}`
    return `${y.slice(2)}-${m}-${d}`
  }
  if (typeof time === "number") {
    const d = new Date(time * 1000)
    const md = `${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`
    if (format === "time") return `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}`
    if (format === "mdhm") return `${md} ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}`
    if (format === "fulldate") {
      return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`
    }
    return `${String(d.getUTCFullYear()).slice(2)}-${md}`
  }
  // BusinessDay 对象
  return `${String(time.year).slice(2)}-${pad(time.month)}-${pad(time.day)}`
}

/** 获取 N 个自然日前的日期（YYYY-MM-DD） */
function getDateBefore(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() - days)
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

export default function StockDetail() {
  // 当前股票由 zustand 管理（本地持久化），通过上方 StockPicker 切换
  const market = useStock((s) => s.market)
  const code = useStock((s) => s.code)
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme === "dark"

  /* ---------- K线 ---------- */
  const [select, setSelect] = useState(CHART_OPTIONS[0].value)
  // 折线图（分时、五日），tooltip 显示内容一致
  const isLineChart = select === "trend" || select === "5d"
  const chartContainerRef = useRef<HTMLDivElement>(null)
  const { data: klineData, isLoading: klineLoading } = useQuery({
    queryKey: ["StockDetail", market, code, select],
    queryFn: () => {
      // 五日：取最近 5 个交易日的一分钟数据
      if (select === "5d") {
        return getStockKLine(market, code, "1", getDateBefore(7))
      }
      return getStockKLine(market, code, CHART_OPTIONS_MAP[select] || select)
    },
  })

  /* ---------- 悬浮提示 ---------- */
  const tooltipRef = useRef<HTMLDivElement>(null)
  const [tooltipHeight, setTooltipHeight] = useState(0)
  const [tooltip, setTooltip] = useState<{
    x: number
    y: number
    containerWidth: number
    containerHeight: number
    date: string
    open: number
    high: number
    low: number
    close: number
    volume: number
    changePercent?: number
  } | null>(null)

  // 测量提示框高度，用于底部边界限制
  useLayoutEffect(() => {
    if (tooltip) setTooltipHeight(tooltipRef.current?.offsetHeight ?? 0)
  }, [tooltip])

  /* ---------- 图表渲染 ---------- */
  useEffect(() => {
    const container = chartContainerRef.current
    if (!container) return

    const period = CHART_OPTIONS_MAP[select] || select
    const isTrend = select === "trend"
    // 五日：折线图，显示全部数据
    const isFiveDay = select === "5d"
    // 折线图（分时、五日）
    const isLine = isTrend || isFiveDay
    // 分钟K线（1/5/15/30/60分）
    const isMinuteK = !isLine && ["1", "5", "15", "30", "60"].includes(period)
    // 日K/周K/月K 只显示日期，分钟K显示到时分（tooltip 用）
    const dateOnly = ["daily", "weekly", "monthly"].includes(period)
    // 横轴时间格式：分时 → HH:mm；五日 → MM-DD HH:mm；分钟K → YYYY-MM-DD；日K及以上 → YY-MM-DD
    const axisTimeFormat: AxisTimeFormat = isTrend
      ? "time"
      : isFiveDay
        ? "mdhm"
        : isMinuteK
          ? "fulldate"
          : "date"

    const chart = createChart(container, {
      layout: {
        background: { color: isDark ? "#141414" : "#ffffff" },
        textColor: isDark ? "rgba(255,255,255,0.85)" : "#333",
        attributionLogo: false,
        panes: {
          separatorColor: "transparent",
          separatorHoverColor: "transparent",
          enableResize: false,
        },
      },
      grid: {
        vertLines: { color: isDark ? "#303030" : "#f0f0f0" },
        horzLines: { color: isDark ? "#303030" : "#f0f0f0" },
      },
      timeScale: {
        // 分时图固定显示时间窗口，不锁定边缘；其余周期锁定边缘避免留白
        fixLeftEdge: !isTrend,
        fixRightEdge: !isTrend,
        rightOffset: 0,
        lockVisibleTimeRangeOnResize: true,
        tickMarkFormatter: (time: Time) => formatAxisTime(time, axisTimeFormat),
        ...getBarSpacingLimits(container.clientWidth, 0),
      },
      localization: {
        // 十字光标在时间轴上的标签
        timeFormatter: (time: Time) => formatAxisTime(time, axisTimeFormat),
      },
      // 分时图固定显示 09:30~15:30，禁止缩放与滚动
      ...(isTrend
        ? {
            handleScroll: {
              mouseWheel: false,
              pressedMouseMove: false,
              horzTouchDrag: false,
              vertTouchDrag: false,
            },
            handleScale: {
              mouseWheel: false,
              pinch: false,
              axisPressedMouseMove: false,
              axisDoubleClickReset: false,
            },
          }
        : {}),
      width: container.clientWidth,
      height: 460,
    })

    // 主图：分时/五日用折线（open），其余用蜡烛图
    let lineSeries: ISeriesApi<"Line"> | null = null
    let candleSeries: ISeriesApi<"Candlestick"> | null = null
    if (isLine) {
      lineSeries = chart.addSeries(LineSeries, {
        color: UP_COLOR,
        lineWidth: 1,
      })
    } else {
      candleSeries = chart.addSeries(CandlestickSeries, {
        upColor: UP_COLOR,
        downColor: DOWN_COLOR,
        borderUpColor: UP_COLOR,
        borderDownColor: DOWN_COLOR,
        wickUpColor: UP_COLOR,
        wickDownColor: DOWN_COLOR,
      })
    }

    // 副图：成交量（使用面板默认右侧价格轴，才会显示刻度数值）
    const volumeSeries = chart.addSeries(
      HistogramSeries,
      {
        priceFormat: { type: "volume" },
        priceScaleId: "right",
      },
      1
    )
    chart.priceScale("right", 1).applyOptions({ scaleMargins: { top: 0.1, bottom: 0 } })

    // 设置数据
    const list = klineData ?? []
    if (list.length > 0) {
      if (lineSeries) {
        // 分时图：使用 open 字段绘制折线
        lineSeries.setData(
          list.map((item) => ({
            time: toTime(item),
            value: item.open,
          }))
        )
      }
      if (candleSeries) {
        candleSeries.setData(
          list.map((item) => ({
            time: toTime(item),
            open: item.open,
            high: item.high,
            low: item.low,
            close: item.close,
          }))
        )
      }
      volumeSeries.setData(
        list.map((item) => ({
          time: toTime(item),
          value: item.volume ?? 0,
          color: item.close >= item.open ? `${UP_COLOR}70` : `${DOWN_COLOR}70`,
        }))
      )

      // 放大限制：可见条数不少于 30 条（数据不足 30 条时以实际条数为准）
      chart.timeScale().applyOptions(getBarSpacingLimits(container.clientWidth, list.length))

      if (isTrend) {
        // 今日起始价格横线（第一条数据的开盘价）
        lineSeries?.createPriceLine({
          price: Number(list[0]?.open ?? 0),
          color: "grey",
          lineWidth: 1,
          lineStyle: LineStyle.Solid,
          axisLabelVisible: false,
          title: "",
        })

        // 分时图固定显示最近交易日的 09:30 ~ 15:30
        const last = new Date(Number(toTime(list[list.length - 1])) * 1000)
        const day = `${last.getUTCFullYear()}-${pad(last.getUTCMonth() + 1)}-${pad(last.getUTCDate())}`
        chart.timeScale().setVisibleRange({
          from: (Date.parse(`${day}T${TREND_START_TIME}:00Z`) / 1000) as UTCTimestamp,
          to: (Date.parse(`${day}T${TREND_END_TIME}:00Z`) / 1000) as UTCTimestamp,
        })
      } else if (isFiveDay) {
        // 五日：显示全部数据
        chart.timeScale().fitContent()
      } else {
        // 默认显示最新 100 条，其余数据可滑动/缩放查看
        if (list.length > DEFAULT_VISIBLE_BARS) {
          chart.timeScale().setVisibleLogicalRange({
            from: list.length - DEFAULT_VISIBLE_BARS,
            to: list.length - 1,
          })
        } else {
          chart.timeScale().fitContent()
        }

        // 缩放限制：可见条数不超过 200 条
        // （同时启用 fixLeftEdge/fixRightEdge 时库会忽略 minBarSpacing，需手动钳制）
        // 分钟K线（1/5/15/30/60分）不受此限制，可缩放查看全部数据
        if (!isMinuteK) {
          const maxVisible = Math.min(MAX_VISIBLE_BARS, list.length)
          const clampVisibleRange = (range: { from: number; to: number } | null) => {
            if (!range) return
            const span = range.to - range.from
            if (span <= maxVisible) return
            // 以右边界（最新数据）为锚点缩小范围
            chart.timeScale().setVisibleLogicalRange({
              from: range.to - maxVisible,
              to: range.to,
            })
          }
          chart.timeScale().subscribeVisibleLogicalRangeChange(clampVisibleRange)
        }
      }
    }

    // 折线图涨跌幅基准：第一条数据的 open
    const firstOpen = Number(list[0]?.open ?? 0)

    // 悬浮提示：跟随十字光标显示当前数据（折线/K线通用，取原始数据字段）
    chart.subscribeCrosshairMove((param) => {
      if (!param.time || !param.point) {
        setTooltip(null)
        return
      }
      const item = list.find((d) => toTime(d) === param.time)
      if (!item) {
        setTooltip(null)
        return
      }
      const volume = param.seriesData.get(volumeSeries) as { value: number } | undefined
      // param.point 相对所在面板，需换算为整个图表容器的坐标
      const rect = container.getBoundingClientRect()
      const x = param.sourceEvent ? param.sourceEvent.clientX - rect.left : param.point.x
      const y = param.sourceEvent ? param.sourceEvent.clientY - rect.top : param.point.y
      setTooltip({
        x,
        y,
        containerWidth: container.clientWidth,
        containerHeight: container.clientHeight,
        date: formatTime(param.time, item.date ?? item.time, dateOnly),
        open: item.open,
        high: item.high,
        low: item.low,
        close: item.close,
        volume: volume?.value ?? item.volume ?? 0,
        // 折线图（分时/五日）：涨跌幅 = (当前 open - 第一条数据 open) / 第一条数据 open
        changePercent: isLine
          ? firstOpen
            ? ((Number(item.open) - firstOpen) / firstOpen) * 100
            : undefined
          : (item.changePercent ?? item.pctChg),
      })
    })

    // 自适应宽度（保持当前可见范围与缩放限制）
    const handleResize = () => {
      const width = container.clientWidth
      chart.applyOptions({
        width,
        timeScale: getBarSpacingLimits(width, list.length),
      })
    }
    window.addEventListener("resize", handleResize)

    return () => {
      window.removeEventListener("resize", handleResize)
      chart.remove()
    }
  }, [klineData, resolvedTheme, isDark, select, market, code])

  return (
    <div className="flex flex-col gap-3">
      {/* 搜索 + 当前股票行情 */}
      <StockPicker />

      {/* 周期切换 */}
      <Radio.Group value={select} onChange={(e) => setSelect(e.target.value)}>
        {CHART_OPTIONS.map((option) => (
          <Radio.Button key={option.value} value={option.value}>
            {option.label}
          </Radio.Button>
        ))}
      </Radio.Group>

      {/* 分时/K线部分 */}
      <Card styles={{ body: { padding: 0 } }}>
        <Spin spinning={klineLoading}>
          <div className="relative w-full">
            <div ref={chartContainerRef} className="w-full" />
            {tooltip && (
              <div
                ref={tooltipRef}
                className="pointer-events-none absolute z-10"
                style={{
                  // 右半屏显示在光标左侧（右边缘距光标 20px），左半屏显示在光标右侧（左边缘距光标 20px）
                  ...(tooltip.x > tooltip.containerWidth / 2
                    ? { right: tooltip.containerWidth - tooltip.x + 20 }
                    : { left: tooltip.x + 20 }),
                  // 顶部偏移跟随鼠标，但到达底部边界后不再下移
                  top: Math.min(
                    Math.max(0, tooltip.y - 60),
                    Math.max(0, tooltip.containerHeight - tooltipHeight)
                  ),
                }}
              >
                <div
                  className="rounded-md p-2 text-xs shadow-lg"
                  style={{
                    background: isDark ? "#1f1f1f" : "#ffffff",
                    border: `1px solid ${isDark ? "#303030" : "#d9d9d9"}`,
                    color: isDark ? "rgba(255,255,255,0.85)" : "rgba(0,0,0,0.88)",
                  }}
                >
                  <div className="mb-1 font-medium">{tooltip.date}</div>
                  <div className="grid grid-cols-2 gap-x-3 gap-y-0.5">
                    {isLineChart ? (
                      <>
                        {/* 折线图（分时/五日）：仅显示当前值（open）、涨跌幅、成交量 */}
                        <span style={{ color: "#999" }}>当前值</span>
                        <span
                          className="text-right"
                          style={{ color: getColor(tooltip.changePercent) }}
                        >
                          {formatNum(tooltip.open)}
                        </span>
                        <span style={{ color: "#999" }}>涨跌幅</span>
                        <span
                          className="text-right"
                          style={{ color: getColor(tooltip.changePercent) }}
                        >
                          {formatPercent(tooltip.changePercent)}
                        </span>
                        <span style={{ color: "#999" }}>成交量</span>
                        <span className="text-right">{formatAmount(tooltip.volume)}</span>
                      </>
                    ) : (
                      <>
                        <span style={{ color: "#999" }}>开盘</span>
                        <span className="text-right">{formatNum(tooltip.open)}</span>
                        <span style={{ color: "#999" }}>最高</span>
                        <span className="text-right" style={{ color: UP_COLOR }}>
                          {formatNum(tooltip.high)}
                        </span>
                        <span style={{ color: "#999" }}>最低</span>
                        <span className="text-right" style={{ color: DOWN_COLOR }}>
                          {formatNum(tooltip.low)}
                        </span>
                        <span style={{ color: "#999" }}>收盘</span>
                        <span
                          className="text-right"
                          style={{ color: tooltip.close >= tooltip.open ? UP_COLOR : DOWN_COLOR }}
                        >
                          {formatNum(tooltip.close)}
                        </span>
                        {tooltip.changePercent != null && (
                          <>
                            <span style={{ color: "#999" }}>涨跌幅</span>
                            <span
                              className="text-right"
                              style={{ color: getColor(tooltip.changePercent) }}
                            >
                              {formatPercent(tooltip.changePercent)}
                            </span>
                          </>
                        )}
                        <span style={{ color: "#999" }}>成交量</span>
                        <span className="text-right">{formatAmount(tooltip.volume)}</span>
                      </>
                    )}
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
