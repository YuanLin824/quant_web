import useAuth from "@/zustand/useAuth"
import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios"
import toast from "react-hot-toast"

const request = axios.create({
  baseURL: "/api",
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
})

/** 是否正在刷新token */
let isRefreshing = false
/** 等待token刷新的请求队型 */
let refreshSubscribers: ((token: string) => void)[] = []

/** 将请求加入等待队列 */
function addRefreshSubscriber(callback: (token: string) => void) {
  refreshSubscribers.push(callback)
}

/** 执行队列中的请求 */
function onRefreshed(token: string) {
  refreshSubscribers.forEach((callback) => callback(token))
  refreshSubscribers = []
}

request.interceptors.request.use(
  (config) => {
    const token = useAuth.getState().accessToken
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

request.interceptors.response.use(
  (response) => {
    return response.data
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean }

    // 如果是401错误且不是刷新token的请求，且未重试过
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url?.includes("/auth/refresh")
    ) {
      // 如果正在刷新token，将请求加入队列
      if (isRefreshing) {
        return new Promise((resolve) => {
          addRefreshSubscriber((token: string) => {
            originalRequest.headers.Authorization = `Bearer ${token}`
            resolve(request(originalRequest))
          })
        })
      }

      originalRequest._retry = true
      isRefreshing = true

      try {
        const { refreshToken } = useAuth.getState()
        if (!refreshToken) {
          throw new Error("没有refreshToken")
        }

        // 调用刷新token接口
        const response = await axios.post<{
          code: number
          data: { accessToken: string; refreshToken: string }
        }>(
          "/api/auth/refresh",
          {},
          {
            headers: {
              Authorization: `Bearer ${refreshToken}`,
            },
          }
        )

        const { accessToken: newAccessToken, refreshToken: newRefreshToken } = response.data.data

        // 更新Zustand store
        useAuth.getState().updateTokens(newAccessToken, newRefreshToken)

        // 执行队列中的请求
        onRefreshed(newAccessToken)

        // 重试原始请求
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`
        return request(originalRequest)
      } catch (refreshError) {
        // 刷新token失败，清除登录状态
        useAuth.getState().logout()
        toast.error("登录已过期，请重新登录")
        window.location.href = "/login"
        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    }

    const message = (error.response?.data as Record<string, string>)?.message || "请求失败"
    toast.error(message)
    return Promise.reject(error)
  }
)

export default request
