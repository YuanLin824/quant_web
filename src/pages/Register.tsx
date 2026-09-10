import { register } from "@/api/auth"
import ThemeSegmented from "@/components/ThemeSegmented"
import useAuth from "@/zustand/useAuth"
import { LockOutlined, UserOutlined } from "@ant-design/icons"
import { useMutation } from "@tanstack/react-query"
import { Button, Card, Form, Input } from "antd"
import toast from "react-hot-toast"
import { Link, useNavigate } from "react-router"

interface RegisterValues {
  username: string
  password: string
  confirmPassword: string
}

export default function Register() {
  const navigate = useNavigate()
  const { login: setAuth } = useAuth()

  const mutation = useMutation({
    mutationFn: register,
    onSuccess: (data) => {
      setAuth(data.accessToken, data.refreshToken, data.username)
      toast.success("注册成功")
      navigate("/")
    },
  })

  const onFinish = (values: RegisterValues) => {
    const { username, password } = values
    mutation.mutate({ username, password })
  }

  return (
    <div className="flex h-screen items-center justify-center">
      <Card
        className="w-100"
        title={
          <div className="flex items-center justify-between">
            <span className="text-xl font-bold">注册</span>
            <ThemeSegmented />
          </div>
        }
      >
        <Form name="register" onFinish={onFinish} autoComplete="off" size="large">
          <Form.Item
            name="username"
            rules={[
              { required: true, message: "请输入用户名" },
              { min: 3, max: 32, message: "用户名长度为 3-32 个字符" },
              { pattern: /^[a-zA-Z0-9_]+$/, message: "用户名只能包含字母、数字和下划线" },
            ]}
          >
            <Input prefix={<UserOutlined />} placeholder="用户名" />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[
              { required: true, message: "请输入密码" },
              { min: 8, max: 64, message: "密码长度为 8-64 个字符" },
              {
                pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z0-9])/,
                message: "密码需包含大写字母、小写字母、数字和特殊字符",
              },
            ]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="密码（8-64 位，含大小写、数字、符号）"
            />
          </Form.Item>

          <Form.Item
            name="confirmPassword"
            dependencies={["password"]}
            rules={[
              { required: true, message: "请确认密码" },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue("password") === value) {
                    return Promise.resolve()
                  }
                  return Promise.reject(new Error("两次密码输入不一致"))
                },
              }),
            ]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="确认密码" />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" block loading={mutation.isPending}>
              注册
            </Button>
          </Form.Item>

          <div className="text-center">
            <span className="text-gray-500">已有账号？</span>
            <Link to="/login">立即登录</Link>
          </div>
        </Form>
      </Card>
    </div>
  )
}
