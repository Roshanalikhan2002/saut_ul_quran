import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { getDashboardPath } from '@/lib/auth'
import { LoadingState } from '@/components/ui/loading-state'

/** Redirects authenticated users to their role dashboard. */
export function GuestRoute() {
  const { user, loading, primaryRole } = useAuth()

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <LoadingState />
      </div>
    )
  }

  if (user) {
    return <Navigate to={getDashboardPath(primaryRole)} replace />
  }

  return <Outlet />
}
