// src/store/useStore.ts
import { create } from 'zustand'
import { User } from '@supabase/supabase-js'
import { Database } from '../../lib/database.types'

type AssessmentPeriod = Database['public']['Tables']['assessment_periods']['Row']

interface AppState {
  user: User | null
  currentPeriod: AssessmentPeriod | null
  setUser: (user: User | null) => void
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