import { Segmented } from "antd"
import { useTheme } from "next-themes"

export default function ThemeSegmented() {
  const { theme, setTheme } = useTheme()
  return (
    <Segmented
      value={theme ?? "system"}
      onChange={(value) => setTheme(value as string)}
      options={[
        { label: "浅色", value: "light" },
        { label: "深色", value: "dark" },
        { label: "系统", value: "system" },
      ]}
    />
  )
}
