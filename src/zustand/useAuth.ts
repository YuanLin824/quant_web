import { create } from "zustand"
import { persist } from "zustand/middleware"

interface AuthState {
  accessToken: string | null
  refreshToken: string | null
  isAuthenticated: boolean
  username: string | null
  login: (accessToken: string, refreshToken: string, username: string) => void
  logout: () => void
  updateTokens: (accessToken: string, refreshToken: string) => void
}

const useAuth = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      username: null,
      login: (accessToken, refreshToken, username) =>
        set({
          accessToken,
          refreshToken,
          isAuthenticated: true,
          username,
        }),
      logout: () =>
        set({
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
          username: null,
        }),
      updateTokens: (accessToken, refreshToken) =>
        set({
          accessToken,
          refreshToken,
        }),
    }),
    {
      name: "auth",
    }
  )
)

export default useAuth
