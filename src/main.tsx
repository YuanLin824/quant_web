import App from "@/App.tsx"
import { ThemeProvider as NextThemesProvider } from "next-themes"
import { StrictMode } from "react"
import { createRoot } from "react-dom/client"

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <NextThemesProvider
      attribute="data-theme"
      defaultTheme="system" // 默认跟随系统偏好
      enableSystem={true} // 启用系统主题跟随
    >
      <App />
    </NextThemesProvider>
  </StrictMode>
)
