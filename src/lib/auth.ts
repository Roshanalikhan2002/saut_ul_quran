import type { AppRole } from '@/types/database'

const ROLE_PRIORITY: AppRole[] = ['admin', 'teacher', 'student']

export function getPrimaryRole(roles: AppRole[]): AppRole | null {
  for (const role of ROLE_PRIORITY) {
    if (roles.includes(role)) return role
  }
  return null
}

export function isStaffRole(role: AppRole | null | undefined): boolean {
  return role === 'admin' || role === 'teacher'
}

export function getDashboardPath(role: AppRole | null | undefined): string {
  if (role === 'admin') return '/admin'
  if (role === 'teacher') return '/teacher'
  if (role === 'student') return '/student'
  return '/'
}

export function rolesInclude(
  userRoles: AppRole[],
  allowed: AppRole[] | undefined,
): boolean {
  if (!allowed || allowed.length === 0) return true
  return allowed.some((role) => userRoles.includes(role))
}
