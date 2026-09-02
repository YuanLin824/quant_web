import { DesktopOutlined, MoonOutlined, SunOutlined } from "@ant-design/icons"
import { Dropdown } from "antd"
import { useTheme } from "next-themes"

const themeOptions = [
  { key: "light", icon: <SunOutlined style={{ color: "#fadb14" }} />, label: "浅色" },
  { key: "dark", icon: <MoonOutlined style={{ color: "#91caff" }} />, label: "深色" },
  { key: "system", icon: <DesktopOutlined style={{ color: "#52c41a" }} />, label: "系统" },
]

export default function ThemeSegmented() {
  const { theme, setTheme } = useTheme()

  const currentIcon = themeOptions.find((opt) => opt.key === (theme ?? "system"))?.icon ?? (
    <DesktopOutlined style={{ color: "#52c41a" }} />
  )

  const items = themeOptions.map((opt) => ({
    key: opt.key,
    icon: opt.icon,
    label: opt.label,
    onClick: () => setTheme(opt.key),
  }))

  return (
    <Dropdown menu={{ items, selectedKeys: [theme ?? "system"] }} placement="bottomRight">
      <span className="cursor-pointer">{currentIcon}</span>
    </Dropdown>
  )
}
