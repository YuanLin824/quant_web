import ThemeSegmented from "@/components/ThemeSegmented"
import { Button, Result } from "antd"
import { Link, useNavigate, useRouteError } from "react-router"

export default function ErrorPage() {
  const navigate = useNavigate()
  const error = useRouteError() as { status?: number; message?: string }

  const status = error?.status || 500
  const title = status === 403 ? "403" : status === 500 ? "500" : "错误"
  const subTitle =
    status === 403
      ? "抱歉，您没有权限访问此页面"
      : status === 500
        ? "抱歉，服务器出现了问题"
        : error?.message || "抱歉，发生了未知错误"

  return (
    <div className="flex h-screen items-center justify-center">
      <div className="absolute right-4 top-4">
        <ThemeSegmented />
      </div>
      <Result
        status={status === 403 ? "403" : "500"}
        title={title}
        subTitle={subTitle}
        extra={
          <div className="flex gap-4">
            <Button onClick={() => navigate(-1)}>返回上一页</Button>
            <Link to="/">
              <Button type="primary">返回首页</Button>
            </Link>
          </div>
        }
      />
    </div>
  )
}
