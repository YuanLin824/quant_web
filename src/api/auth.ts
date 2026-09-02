import request from "@/utils/request"

interface LoginParams {
  username: string
  password: string
}

interface LoginResult {
  accessToken: string
  refreshToken: string
  username: string
}

export function login(params: LoginParams) {
  return request.post<LoginResult>("/auth/login", params)
}

export function register(params: LoginParams) {
  return request.post<LoginResult>("/auth/register", params)
}

export function refresh(refreshToken: string) {
  return request.post<LoginResult>("/auth/refresh", null, {
    headers: {
      Authorization: `Bearer ${refreshToken}`,
    },
  })
}

export function logout(refreshToken: string) {
  return request.post("/auth/logout", { refreshToken })
}

export function getProfile() {
  return request.get("/auth/profile")
}
