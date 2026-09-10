import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { getDashboardPath, rolesInclude } from '@/lib/auth'
import { LoadingState } from '@/components/ui/loading-state'
import type { AppRole } from '@/types/database'

interface ProtectedRouteProps {
  roles?: AppRole[]
}

export function ProtectedRoute({ roles }: ProtectedRouteProps) {
  const { user, loading, roles: userRoles, primaryRole } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <LoadingState />
      </div>
    )
  }

  if (!user) {
    return (
      <Navigate
        to="/auth/sign-in"
        replace
        state={{ from: location.pathname }}
      />
    )
  }

  if (!rolesInclude(userRoles, roles)) {
    return <Navigate to={getDashboardPath(primaryRole)} replace />
  }

  return <Outlet />
}
