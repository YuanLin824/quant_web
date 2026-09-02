import { QueryClient } from "@tanstack/react-query"

/** TanStack Query 全局客户端 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 10_000,
    },
  },
})
