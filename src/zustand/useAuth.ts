import { create } from "zustand"
import { persist } from "zustand/middleware"

interface AuthState {
  accessToken: string | null
  refreshToken: string | null
  isAuthenticated: boolean
  login: (accessToken: string, refreshToken: string) => void
  logout: () => void
  updateTokens: (accessToken: string, refreshToken: string) => void
}

const useAuth = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      login: (accessToken, refreshToken) =>
        set({
          accessToken,
          refreshToken,
          isAuthenticated: true,
        }),
      logout: () =>
        set({
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
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
