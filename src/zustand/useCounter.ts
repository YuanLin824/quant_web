import { create } from "zustand"
import { persist } from "zustand/middleware"

interface ICounter {
  counter: number
  increase: () => void
  decrease: () => void
}

const useCounter = create<ICounter>()(
  persist(
    (set) => ({
      counter: 0,
      increase: () => set((state) => ({ counter: state.counter + 1 })),
      decrease: () => set((state) => ({ counter: state.counter - 1 })),
    }),
    { name: "counter" }
  )
)

export default useCounter
