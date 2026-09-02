import { login } from "@/api/auth"
import ThemeSegmented from "@/components/ThemeSegmented"
import useAuth from "@/zustand/useAuth"
import { LockOutlined, UserOutlined } from "@ant-design/icons"
import { useMutation } from "@tanstack/react-query"
import { Button, Card, Form, Input } from "antd"
import toast from "react-hot-toast"
import { Link, useNavigate } from "react-router"

interface LoginValues {
  username: string
  password: string
}

export default function Login() {
  const navigate = useNavigate()
  const { login: setAuth } = useAuth()

  const mutation = useMutation({
    mutationFn: login,
    onSuccess: (data) => {
      setAuth(data.data.accessToken, data.data.refreshToken, data.data.username)
      toast.success("登录成功")
      navigate("/")
    },
  })

  const onFinish = (values: LoginValues) => {
    mutation.mutate(values)
  }

  return (
    <div className="flex h-screen items-center justify-center">
      <Card
        className="w-100"
        title={
          <div className="flex items-center justify-between">
            <span className="text-xl font-bold">登录</span>
            <ThemeSegmented />
          </div>
        }
      >
        <Form
          name="login"
          initialValues={{ username: "QuantAdmin", password: "Quant.Admin" }}
          onFinish={onFinish}
          autoComplete="off"
          size="large"
        >
          <Form.Item name="username" rules={[{ required: true, message: "请输入用户名" }]}>
            <Input prefix={<UserOutlined />} placeholder="用户名" />
          </Form.Item>

          <Form.Item name="password" rules={[{ required: true, message: "请输入密码" }]}>
            <Input.Password prefix={<LockOutlined />} placeholder="密码" />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" block loading={mutation.isPending}>
              登录
            </Button>
          </Form.Item>

          <div className="text-center">
            <span className="text-gray-500">还没有账号？</span>
            <Link to="/register">立即注册</Link>
          </div>
        </Form>
      </Card>
    </div>
  )
}
