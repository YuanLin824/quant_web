import { DashboardOutlined } from "@ant-design/icons"
import type { BreadcrumbProps, MenuProps } from "antd"

export interface MenuItem {
  key: string
  icon: React.ReactNode
  label: string
}

/** 主导航配置：key 即路由路径，Header/Sider/Breadcrumb 共用 */
export const MENU_ITEMS: MenuItem[] = [{ key: "/", icon: <DashboardOutlined />, label: "仪表盘" }]

/** 转为 antd Menu items */
export const toMenuItems: MenuProps["items"] = MENU_ITEMS.map(({ key, icon, label }) => ({
  key,
  icon,
  label,
}))

/** 根据路径生成面包屑 items */
export function toBreadcrumbItems(pathname: string): BreadcrumbProps["items"] {
  const current = MENU_ITEMS.find((item) => item.key === pathname)
  if (!current) return [{ title: "QUANT" }]
  return [{ title: "QUANT" }, { title: current.label }]
}
