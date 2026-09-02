import ThemeSegmented from "@/components/ThemeSegmented"
import useAuth from "@/zustand/useAuth"
import { LogoutOutlined, UserOutlined } from "@ant-design/icons"
import { Breadcrumb, Card, Dropdown, Layout, Menu } from "antd"
import toast from "react-hot-toast"
import { Outlet, useLocation, useNavigate } from "react-router"

import { toBreadcrumbItems, toMenuItems } from "./menus"

export default function BaseLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const { username, logout } = useAuth()

  const handleLogout = () => {
    logout()
    toast.success("退出登录成功")
    navigate("/login")
  }

  const dropdownItems = [
    {
      key: "logout",
      icon: <LogoutOutlined />,
      label: "退出登录",
      onClick: handleLogout,
    },
  ]

  return (
    <Layout className="h-full">
      <Layout.Header className="flex items-center px-0!">
        <div className="w-50 h-full flex items-center px-4">
          <span className="h-8 w-8 bg-blue-100 mr-2"></span>
          <span className="font-bold text-2xl text-[#FFFFFFD9]">QUANT</span>
        </div>
        <div className="flex-1" />
        <div className="h-full flex items-center gap-4 px-4">
          <ThemeSegmented />
          <Dropdown menu={{ items: dropdownItems }} placement="bottomRight">
            <div className="flex cursor-pointer items-center gap-2 text-[#FFFFFFD9]">
              <UserOutlined />
              <span>{username}</span>
            </div>
          </Dropdown>
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
