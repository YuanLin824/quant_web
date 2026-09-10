import { getStockSignals, type StockSignal } from "@/api/stock"
import StockPicker from "@/components/StockPicker"
import { DOWN_COLOR, formatNum, UP_COLOR } from "@/utils/format"
import useStock from "@/zustand/useStock"
import { useQuery } from "@tanstack/react-query"
import { Card, Empty, Radio, Spin, Table, Tag, Typography } from "antd"
import type { ColumnsType } from "antd/es/table"
import { useState } from "react"

const { Text } = Typography

/** K线周期选项 */
const PERIOD_OPTIONS = [
  { label: "日线", value: "daily" },
  { label: "周线", value: "weekly" },
  { label: "月线", value: "monthly" },
]

/** 信号类型配置：中文名称、颜色（红看多/橙看空/蓝中性）、购买建议、说明 */
const SIGNAL_CONF: Record<
  string,
  { label: string; color: string; advice: string; adviceColor: string; desc: string }
> = {
  ma_golden_cross: {
    label: "MA金叉",
    color: "red",
    advice: "建议买入",
    adviceColor: UP_COLOR,
    desc: "短期均线上穿长期均线，趋势转强",
  },
  ma_death_cross: {
    label: "MA死叉",
    color: "volcano",
    advice: "建议卖出",
    adviceColor: DOWN_COLOR,
    desc: "短期均线下穿长期均线，趋势转弱",
  },
  macd_golden_cross: {
    label: "MACD金叉",
    color: "red",
    advice: "建议买入",
    adviceColor: UP_COLOR,
    desc: "DIF 线上穿 DEA 线，多头动能增强",
  },
  macd_death_cross: {
    label: "MACD死叉",
    color: "volcano",
    advice: "建议卖出",
    adviceColor: DOWN_COLOR,
    desc: "DIF 线下穿 DEA 线，空头动能增强",
  },
  kdj_golden_cross: {
    label: "KDJ金叉",
    color: "red",
    advice: "建议买入",
    adviceColor: UP_COLOR,
    desc: "K 线上穿 D 线，短线看多",
  },
  kdj_death_cross: {
    label: "KDJ死叉",
    color: "volcano",
    advice: "建议卖出",
    adviceColor: DOWN_COLOR,
    desc: "K 线下穿 D 线，短线看空",
  },
  kdj_overbought: {
    label: "KDJ超买",
    color: "orange",
    advice: "谨慎持有",
    adviceColor: "#fa8c16",
    desc: "K 值处于高位，短期有回调风险",
  },
  kdj_oversold: {
    label: "KDJ超卖",
    color: "cyan",
    advice: "关注反弹",
    adviceColor: "#13c2c2",
    desc: "K 值处于低位，短期有反弹机会",
  },
  rsi_overbought: {
    label: "RSI超买",
    color: "orange",
    advice: "谨慎持有",
    adviceColor: "#fa8c16",
    desc: "RSI 高于 70，进入超买区间",
  },
  rsi_oversold: {
    label: "RSI超卖",
    color: "cyan",
    advice: "关注反弹",
    adviceColor: "#13c2c2",
    desc: "RSI 低于 30，进入超卖区间",
  },
  boll_break_upper: {
    label: "突破布林上轨",
    color: "red",
    advice: "看多持有",
    adviceColor: UP_COLOR,
    desc: "价格突破布林带上轨，走势强势",
  },
  boll_break_lower: {
    label: "跌破布林下轨",
    color: "volcano",
    advice: "建议卖出",
    adviceColor: DOWN_COLOR,
    desc: "价格跌破布林带下轨，走势弱势",
  },
  sar_reversal_up: {
    label: "SAR反转向上",
    color: "red",
    advice: "建议买入",
    adviceColor: UP_COLOR,
    desc: "SAR 由空转多，趋势反转向上",
  },
  sar_reversal_down: {
    label: "SAR反转向下",
    color: "volcano",
    advice: "建议卖出",
    adviceColor: DOWN_COLOR,
    desc: "SAR 由多转空，趋势反转向下",
  },
}

/** 信号详情格式化：{ rsi: 81.67 } -> "rsi 81.67" */
function formatDetail(detail?: Record<string, number>) {
  if (!detail) return "-"
  return Object.entries(detail)
    .map(([key, val]) => `${key} ${formatNum(val)}`)
    .join("，")
}

const columns: ColumnsType<StockSignal> = [
  {
    title: "日期",
    dataIndex: "date",
    key: "date",
    width: 120,
  },
  {
    title: "信号",
    dataIndex: "type",
    key: "type",
    width: 160,
    render: (type: string) => {
      const conf = SIGNAL_CONF[type]
      return <Tag color={conf?.color ?? "default"}>{conf?.label ?? type}</Tag>
    },
  },
  {
    title: "购买建议",
    dataIndex: "type",
    key: "advice",
    width: 120,
    render: (type: string) => {
      const conf = SIGNAL_CONF[type]
      if (!conf) return "-"
      return <span style={{ color: conf.adviceColor, fontWeight: 500 }}>{conf.advice}</span>
    },
  },
  {
    title: "说明",
    dataIndex: "type",
    key: "desc",
    width: 260,
    render: (type: string) => <Text type="secondary">{SIGNAL_CONF[type]?.desc ?? "-"}</Text>,
  },
  {
    title: "收盘价",
    dataIndex: "close",
    key: "close",
    align: "right",
    width: 120,
    render: (val: number) => formatNum(val),
  },
  {
    title: "详情",
    dataIndex: "detail",
    key: "detail",
    render: (detail?: Record<string, number>) => (
      <Text type="secondary">{formatDetail(detail)}</Text>
    ),
  },
]

export default function StockSignals() {
  // 当前股票由 zustand 管理（本地持久化），与详情页共享
  const market = useStock((s) => s.market)
  const code = useStock((s) => s.code)
  const [period, setPeriod] = useState("daily")

  const { data, isLoading } = useQuery({
    queryKey: ["stockSignals", market, code, period],
    queryFn: () => getStockSignals(market, code, period),
  })
  // 最新的信号在前
  const signals = [...(data ?? [])].reverse()

  return (
    <div className="flex flex-col gap-3">
      {/* 搜索 + 当前股票行情 */}
      <StockPicker />

      {/* 指标信号详情 */}
      <Card
        title="指标信号"
        extra={
          <Radio.Group
            options={PERIOD_OPTIONS}
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            optionType="button"
            buttonStyle="solid"
          />
        }
      >
        <Spin spinning={isLoading}>
          <Table
            columns={columns}
            dataSource={signals}
            rowKey={(record) => `${record.type}-${record.timestamp}`}
            size="small"
            pagination={{
              pageSize: 20,
              showSizeChanger: false,
              showTotal: (total) => `共 ${total} 条信号`,
            }}
            locale={{ emptyText: <Empty description="暂无信号数据" /> }}
          />
        </Spin>
      </Card>
    </div>
  )
}
