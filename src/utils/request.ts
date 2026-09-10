import useAuth from "@/zustand/useAuth"
import axios, {
  type AxiosError,
  type AxiosRequestConfig,
  type InternalAxiosRequestConfig,
} from "axios"
import toast from "react-hot-toast"

/** 接口基础路径（.env 中配置，未配置时回退到本地代理路径） */
const BASE_URL = import.meta.env.VITE_BASE_URL || "/api"

const request = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: { "Content-Type": "application/json" },
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
    if (token) config.headers.Authorization = `Bearer ${token}`
    return config
  },
  (error) => Promise.reject(error)
)

request.interceptors.response.use(
  // 解包统一响应结构 { code, message, data }，直接返回 data
  (response) => response.data.data,
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
        if (!refreshToken) throw new Error("没有refreshToken")

        // 调用刷新token接口
        const response = await axios.post<{
          code: number
          data: { accessToken: string; refreshToken: string }
        }>(
          "/auth/refresh",
          {},
          {
            baseURL: BASE_URL,
            headers: { Authorization: `Bearer ${refreshToken}` },
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

/** 解包后的请求实例类型：响应拦截器已解包 { code, message, data }，直接返回 data */
interface UnwrappedRequest {
  get<T = unknown>(url: string, config?: AxiosRequestConfig): Promise<T>
  post<T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T>
  put<T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T>
  patch<T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T>
  delete<T = unknown>(url: string, config?: AxiosRequestConfig): Promise<T>
}

export default request as unknown as UnwrappedRequest
