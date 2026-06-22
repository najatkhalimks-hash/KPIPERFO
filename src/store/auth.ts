import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User, Session } from '@supabase/supabase-js'
import type { Profile, UserRole } from '@/types/database'

interface AuthState {
  user: User | null
  session: Session | null
  profile: Profile | null
  role: UserRole | null
  isLoading: boolean
  setUser: (user: User | null) => void
  setSession: (session: Session | null) => void
  setProfile: (profile: Profile | null) => void
  setLoading: (loading: boolean) => void
  reset: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      session: null,
      profile: null,
      role: null,
      isLoading: true,
      setUser: (user) => set({ user }),
      setSession: (session) => set({ session }),
      setProfile: (profile) => set({ profile, role: profile?.role ?? null }),
      setLoading: (isLoading) => set({ isLoading }),
      reset: () => set({ user: null, session: null, profile: null, role: null, isLoading: false }),
    }),
    {
      name: 'gsmi-auth',
      partialize: (state) => ({ role: state.role }),
    }
  )
)

// App-level store for UI state
interface AppState {
  selectedAcademicYear: string | null
  sidebarCollapsed: boolean
  setSelectedAcademicYear: (year: string | null) => void
  toggleSidebar: () => void
}

export const useAppStore = create<AppState>()((set) => ({
  selectedAcademicYear: null,
  sidebarCollapsed: false,
  setSelectedAcademicYear: (year) => set({ selectedAcademicYear: year }),
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
}))
