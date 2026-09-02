import ThemeSegmented from "@/components/ThemeSegmented"
import { Button, Result } from "antd"
import { Link } from "react-router"

export default function NotFound() {
  return (
    <div className="flex h-screen items-center justify-center">
      <div className="absolute right-4 top-4">
        <ThemeSegmented />
      </div>
      <Result
        status="404"
        title="404"
        subTitle="抱歉，您访问的页面不存在"
        extra={
          <Link to="/">
            <Button type="primary">返回首页</Button>
          </Link>
        }
      />
    </div>
  )
}
