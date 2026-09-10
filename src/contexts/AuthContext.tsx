import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { toast } from 'sonner'
import { getPrimaryRole, isStaffRole } from '@/lib/auth'
import {
  buildDemoProfile,
  buildDemoSession,
  buildDemoUser,
  clearDemoAuth,
  demoDefaultsForRole,
  readDemoAuth,
  writeDemoAuth,
  type DemoAuthState,
} from '@/lib/demoAuth'
import { isDemoMode } from '@/lib/dataMode'
import { supabase } from '@/lib/supabase'
import type { AppRole, Tables } from '@/types/database'
import { toError } from '@/lib/errors'

export type Profile = Tables<'profiles'>

interface AuthContextValue {
  user: User | null
  session: Session | null
  profile: Profile | null
  roles: AppRole[]
  primaryRole: AppRole | null
  isStaff: boolean
  loading: boolean
  /** True when Supabase is not configured and local demo auth is used. */
  isDemoMode: boolean
  signIn: (email: string, password: string) => Promise<void>
  /**
   * Staff account creation only. Signup trigger assigns default `student` role;
   * an admin must promote the user to teacher/admin via panel or SQL.
   */
  signUp: (email: string, password: string, fullName: string) => Promise<void>
  /** Instant local login as admin/teacher/student when demo mode is on. */
  signInDemo: (role: AppRole) => Promise<void>
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

async function fetchProfileAndRoles(userId: string): Promise<{
  profile: Profile | null
  roles: AppRole[]
}> {
  const [profileRes, rolesRes] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', userId).maybeSingle(),
    supabase.from('user_roles').select('role').eq('user_id', userId),
  ])

  if (profileRes.error) throw profileRes.error
  if (rolesRes.error) throw rolesRes.error

  const roles = (rolesRes.data ?? []).map((row) => row.role as AppRole)
  return { profile: profileRes.data, roles }
}

function applyDemoState(
  state: DemoAuthState,
  setters: {
    setUser: (u: User | null) => void
    setSession: (s: Session | null) => void
    setProfile: (p: Profile | null) => void
    setRoles: (r: AppRole[]) => void
  },
) {
  const user = buildDemoUser(state)
  setters.setUser(user)
  setters.setSession(buildDemoSession(user))
  setters.setProfile(buildDemoProfile(user, state))
  setters.setRoles([state.role])
}

export function AuthProvider({ children }: { children: ReactNode }) {
  // Driven by dataMode.isDemoMode() (VITE_DEMO_MODE / auto). Never expose service role.
  const demoMode = isDemoMode()
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [roles, setRoles] = useState<AppRole[]>([])
  const [loading, setLoading] = useState(true)

  const applyUser = useCallback(async (nextSession: Session | null) => {
    setSession(nextSession)
    const nextUser = nextSession?.user ?? null
    setUser(nextUser)

    if (!nextUser) {
      setProfile(null)
      setRoles([])
      return
    }

    try {
      const { profile: nextProfile, roles: nextRoles } =
        await fetchProfileAndRoles(nextUser.id)
      setProfile(nextProfile)
      setRoles(nextRoles)
    } catch (err) {
      toast.error(toError(err).message || 'Failed to load profile')
      setProfile(null)
      setRoles([])
    }
  }, [])

  useEffect(() => {
    let mounted = true

    if (demoMode) {
      const saved = readDemoAuth()
      if (saved) {
        applyDemoState(saved, { setUser, setSession, setProfile, setRoles })
      }
      if (mounted) setLoading(false)
      return () => {
        mounted = false
      }
    }

    void supabase.auth.getSession().then(({ data, error }) => {
      if (!mounted) return
      if (error) {
        toast.error(error.message)
        setLoading(false)
        return
      }
      void applyUser(data.session).finally(() => {
        if (mounted) setLoading(false)
      })
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      void applyUser(nextSession).finally(() => {
        if (mounted) setLoading(false)
      })
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [applyUser, demoMode])

  const refreshProfile = useCallback(async () => {
    if (demoMode) {
      const saved = readDemoAuth()
      if (saved) {
        applyDemoState(saved, { setUser, setSession, setProfile, setRoles })
      }
      return
    }
    if (!user) {
      setProfile(null)
      setRoles([])
      return
    }
    try {
      const { profile: nextProfile, roles: nextRoles } =
        await fetchProfileAndRoles(user.id)
      setProfile(nextProfile)
      setRoles(nextRoles)
    } catch (err) {
      toast.error(toError(err).message || 'Failed to refresh profile')
      throw err
    }
  }, [user, demoMode])

  const signInDemo = useCallback(async (role: AppRole) => {
    const state = demoDefaultsForRole(role)
    writeDemoAuth(state)
    applyDemoState(state, { setUser, setSession, setProfile, setRoles })
  }, [])

  const signIn = useCallback(
    async (email: string, password: string) => {
      if (demoMode) {
        // Any non-empty credentials work in demo mode; role from email hint or admin.
        const lower = email.toLowerCase()
        let role: AppRole = 'admin'
        if (lower.includes('teacher')) role = 'teacher'
        else if (lower.includes('student')) role = 'student'
        const state: DemoAuthState = {
          role,
          email: email.trim(),
          fullName: email.split('@')[0] || 'Demo User',
        }
        void password
        writeDemoAuth(state)
        applyDemoState(state, { setUser, setSession, setProfile, setRoles })
        return
      }

      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (error) {
        toast.error(error.message)
        throw error
      }
    },
    [demoMode],
  )

  const signUp = useCallback(
    async (email: string, password: string, fullName: string) => {
      if (demoMode) {
        const state: DemoAuthState = {
          role: 'admin',
          email: email.trim(),
          fullName: fullName.trim() || email.split('@')[0] || 'Demo Admin',
        }
        void password
        writeDemoAuth(state)
        applyDemoState(state, { setUser, setSession, setProfile, setRoles })
        return
      }

      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName },
        },
      })
      if (error) {
        toast.error(error.message)
        throw error
      }
    },
    [demoMode],
  )

  const signOut = useCallback(async () => {
    if (demoMode) {
      clearDemoAuth()
      setUser(null)
      setSession(null)
      setProfile(null)
      setRoles([])
      return
    }

    const { error } = await supabase.auth.signOut()
    if (error) {
      toast.error(error.message)
      throw error
    }
    setUser(null)
    setSession(null)
    setProfile(null)
    setRoles([])
  }, [demoMode])

  const primaryRole = useMemo(() => getPrimaryRole(roles), [roles])
  const isStaff = isStaffRole(primaryRole)

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      session,
      profile,
      roles,
      primaryRole,
      isStaff,
      loading,
      isDemoMode: demoMode,
      signIn,
      signUp,
      signInDemo,
      signOut,
      refreshProfile,
    }),
    [
      user,
      session,
      profile,
      roles,
      primaryRole,
      isStaff,
      loading,
      demoMode,
      signIn,
      signUp,
      signInDemo,
      signOut,
      refreshProfile,
    ],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return ctx
}
