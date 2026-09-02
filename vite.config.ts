import babel from "@rolldown/plugin-babel"
import tailwindcss from "@tailwindcss/vite"
import react, { reactCompilerPreset } from "@vitejs/plugin-react"
import { defineConfig } from "vite"

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), babel({ presets: [reactCompilerPreset()] }), tailwindcss()],
  resolve: { tsconfigPaths: true },
  server: {
    port: 3000,
    // 设为 true 时, 端口被占用直接报错, 不会尝试下一个
    strictPort: true,
    proxy: {
      "/api": "http://localhost:3001",
      "/health": "http://localhost:3001",
    },
  },
})
