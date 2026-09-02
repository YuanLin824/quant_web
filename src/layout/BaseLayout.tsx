import { Breadcrumb, Card, Layout, Menu, Segmented } from "antd"
import { useTheme } from "next-themes"
import { Outlet, useLocation, useNavigate } from "react-router"

import { toBreadcrumbItems, toMenuItems } from "./menus"

/** 主题切换（next-themes 驱动，置于 Header 右侧） */
function ThemeSegmented() {
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

export default function BaseLayout() {
  const navigate = useNavigate()
  const location = useLocation()

  return (
    <Layout className="h-full">
      <Layout.Header className="flex items-center px-0!">
        <div className="w-50 h-full flex items-center px-4">
          <span className="h-8 w-8 bg-blue-100 mr-2"></span>
          <span className="font-bold text-2xl text-[#FFFFFFD9]">QUANT</span>
        </div>
        <div className="flex-1" />
        <div className="h-full flex items-center px-4">
          <ThemeSegmented />
        </div>
      </Layout.Header>

      <Layout>
        <Layout.Sider width={200}>
          <Menu
            items={toMenuItems}
            mode="inline"
            selectedKeys={[location.pathname]}
            onClick={({ key }) => navigate(key)}
            className="py-4! h-full"
          />
        </Layout.Sider>

        <Layout className="pt-0 px-4">
          <Breadcrumb className="pt-4!" items={toBreadcrumbItems(location.pathname)} />
          <Layout.Content className="my-4!">
            <Card className="h-full overflow-auto" styles={{ body: { padding: 16 } }}>
              <Outlet />
            </Card>
          </Layout.Content>
        </Layout>
      </Layout>
    </Layout>
  )
}
