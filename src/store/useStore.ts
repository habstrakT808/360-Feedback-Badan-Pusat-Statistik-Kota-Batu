// src/store/useStore.ts
import { create } from 'zustand'

// Minimal client-side types to avoid Supabase dependency
type AppUser = {
  id: string
  email?: string | null
  name?: string | null
}

type AssessmentPeriod = {
  id: string
  month: number
  year: number
  start_date: string | Date
  end_date: string | Date
  is_active?: boolean | null
}

interface AppState {
  user: AppUser | null
  currentPeriod: AssessmentPeriod | null
  setUser: (user: AppUser | null) => void
  setCurrentPeriod: (period: AssessmentPeriod | null) => void
  reset: () => void
}

export const useStore = create<AppState>((set, get) => ({
  user: null,
  currentPeriod: null,
  setUser: (user) => {
    const currentUser = get().user
    // Only update if user actually changed
    if (currentUser?.id !== user?.id) {
      set({ user })
    }
  },
  setCurrentPeriod: (period) => {
    const currentPeriod = get().currentPeriod
    // Only update if period actually changed
    if (currentPeriod?.id !== period?.id) {
      set({ currentPeriod: period })
    }
  },
  reset: () => set({ user: null, currentPeriod: null }),
}))

// Selector hooks for better performance
export const useUser = () => useStore((state) => state.user)
export const useSetUser = () => useStore((state) => state.setUser)
export const useCurrentPeriod = () => useStore((state) => state.currentPeriod)
export const useSetCurrentPeriod = () => useStore((state) => state.setCurrentPeriod)