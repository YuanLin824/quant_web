/**
 * 交易时间判断工具
 * 用于判断各市场是否在交易时间内
 */

/** 市场类型 */
export type Market = "cn" | "hk" | "us"

/**
 * 将市场标识或股票代码归一化为市场类型
 * @param value 市场标识（如 `hk`/`us`）或带前缀的代码（如 `sh600519`/`hk00700`）
 * @returns 无法识别时回退为 A 股（`cn`）
 */
export function toMarket(value: string): Market {
  if (value.startsWith("hk")) return "hk"
  if (value.startsWith("us")) return "us"
  return "cn"
}

/**
 * 判断是否在交易时间内
 * @param market 市场类型
 * @param date 当前时间（可选，默认为当前时间）
 * @returns 是否在交易时间内
 */
export function isTradingTime(market: Market, date: Date = new Date()): boolean {
  // 先判断是否为工作日（周一至周五）
  const day = date.getDay()
  if (day === 0 || day === 6) return false

  switch (market) {
    case "cn":
      return isAShareTradingTime(date)
    case "hk":
      return isHKTradingTime(date)
    case "us":
      return isUSTradingTime(date)
    default:
      return false
  }
}

/**
 * A股交易时间（UTC+8）
 * 周一至周五 9:30-11:30, 13:00-15:00
 */
function isAShareTradingTime(date: Date): boolean {
  const hours = date.getHours()
  const minutes = date.getMinutes()
  const time = hours * 60 + minutes

  // 9:30 - 11:30
  const morningStart = 9 * 60 + 30
  const morningEnd = 11 * 60 + 30

  // 13:00 - 15:00
  const afternoonStart = 13 * 60
  const afternoonEnd = 15 * 60

  return (
    (time >= morningStart && time <= morningEnd) || (time >= afternoonStart && time <= afternoonEnd)
  )
}

/**
 * 港股交易时间（UTC+8）
 * 周一至周五 9:30-12:00, 13:00-16:00
 */
function isHKTradingTime(date: Date): boolean {
  const hours = date.getHours()
  const minutes = date.getMinutes()
  const time = hours * 60 + minutes

  // 9:30 - 12:00
  const morningStart = 9 * 60 + 30
  const morningEnd = 12 * 60

  // 13:00 - 16:00
  const afternoonStart = 13 * 60
  const afternoonEnd = 16 * 60

  return (
    (time >= morningStart && time <= morningEnd) || (time >= afternoonStart && time <= afternoonEnd)
  )
}

/**
 * 美股交易时间（UTC-4，夏令时）
 * 周一至周五 9:30-16:00
 * 注意：冬令时（11月-3月）为 UTC-5，需要额外减1小时
 */
function isUSTradingTime(date: Date): boolean {
  // 将本地时间转换为美东时间（UTC-4 夏令时，UTC-5 冬令时）
  // 这里简化处理，使用当前时间的小时数进行估算
  // 更精确的做法需要考虑时区偏移

  // 获取美东时间（简化为 UTC-4 夏令时）
  const utcHours = date.getUTCHours()
  const utcMinutes = date.getUTCMinutes()
  const etHours = (utcHours - 4 + 24) % 24
  const etTime = etHours * 60 + utcMinutes

  // 9:30 - 16:00
  const start = 9 * 60 + 30
  const end = 16 * 60

  return etTime >= start && etTime <= end
}

/**
 * 获取市场下次开盘时间
 * @param market 市场类型
 * @returns 下次开盘时间描述
 */
export function getNextTradingTime(market: Market): string {
  const now = new Date()
  const day = now.getDay()
  const hours = now.getHours()
  const minutes = now.getMinutes()
  const time = hours * 60 + minutes

  switch (market) {
    case "cn":
      if (day === 0 || day === 6) return "下周一 9:30"
      if (time < 9 * 60 + 30) return "今日 9:30"
      if (time > 15 * 60) return "明日 9:30"
      if (time >= 11 * 60 + 30 && time < 13 * 60) return "今日 13:00"
      return "今日 9:30"
    case "hk":
      if (day === 0 || day === 6) return "下周一 9:30"
      if (time < 9 * 60 + 30) return "今日 9:30"
      if (time > 16 * 60) return "明日 9:30"
      if (time >= 12 * 60 && time < 13 * 60) return "今日 13:00"
      return "今日 9:30"
    case "us":
      if (day === 0 || day === 6) return "下周一 21:30"
      // 美股开盘时间约为北京时间21:30（夏令时）或22:30（冬令时）
      return "今日 21:30"
    default:
      return ""
  }
}
