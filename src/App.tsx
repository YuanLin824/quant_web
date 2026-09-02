import BaseLayout from "@/layout/BaseLayout"
import Home from "@/pages/Home"
import { queryClient } from "@/queryClient"
import { QueryClientProvider } from "@tanstack/react-query"
import { theme as antdTheme, ConfigProvider } from "antd"
import zhCN from "antd/locale/zh_CN"
import { useTheme } from "next-themes"
import { useMemo } from "react"
import { Toaster } from "react-hot-toast"
import { BrowserRouter, Route, Routes } from "react-router"

export default function App() {
  const { theme, resolvedTheme } = useTheme()

  const algorithm = useMemo(() => {
    let localTheme = theme || "system"
    if (!["dark", "light"].includes(localTheme)) {
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches
      localTheme = prefersDark ? "dark" : "light"
    }
    return localTheme === "dark" ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm
  }, [theme])

  // Toaster 样式跟随明暗主题
  const toastStyle = useMemo(
    () => ({
      background: resolvedTheme === "dark" ? "#1f1f1f" : "#fff",
      color: resolvedTheme === "dark" ? "rgba(255,255,255,0.85)" : "rgba(0,0,0,0.88)",
    }),
    [resolvedTheme]
  )

  return (
    <ConfigProvider
      locale={zhCN}
      theme={{ algorithm, components: { Layout: { headerHeight: 50 } } }}
    >
      <QueryClientProvider client={queryClient}>
        <Toaster position="top-center" toastOptions={{ style: toastStyle }} />
        <BrowserRouter>
          <Routes>
            <Route element={<BaseLayout />}>
              <Route path="/" element={<Home />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </QueryClientProvider>
    </ConfigProvider>
  )
}
