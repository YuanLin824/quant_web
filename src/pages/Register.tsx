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
      setAuth(data.data.accessToken, data.data.refreshToken, data.data.username)
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
        className="w-[400px]"
        title={
          <div className="flex items-center justify-between">
            <span className="text-xl font-bold">注册</span>
            <ThemeSegmented />
          </div>
        }
      >
        <Form
          name="register"
          onFinish={onFinish}
          autoComplete="off"
          size="large"
        >
          <Form.Item
            name="username"
            rules={[
              { required: true, message: "请输入用户名" },
              { min: 3, message: "用户名至少 3 个字符" },
              { max: 32, message: "用户名最多 32 个字符" },
            ]}
          >
            <Input prefix={<UserOutlined />} placeholder="用户名" />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[
              { required: true, message: "请输入密码" },
              { min: 6, message: "密码至少 6 个字符" },
            ]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="密码" />
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
            <Button
              type="primary"
              htmlType="submit"
              block
              loading={mutation.isPending}
            >
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
