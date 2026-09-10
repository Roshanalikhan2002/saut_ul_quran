import { describe, expect, it } from 'vitest'
import {
  getDashboardPath,
  getPrimaryRole,
  isStaffRole,
  rolesInclude,
} from '@/lib/auth'

describe('getPrimaryRole', () => {
  it('prefers admin over teacher and student', () => {
    expect(getPrimaryRole(['student', 'admin', 'teacher'])).toBe('admin')
  })

  it('prefers teacher over student', () => {
    expect(getPrimaryRole(['student', 'teacher'])).toBe('teacher')
  })

  it('returns student when that is the only role', () => {
    expect(getPrimaryRole(['student'])).toBe('student')
  })

  it('returns null for empty roles', () => {
    expect(getPrimaryRole([])).toBeNull()
  })
})

describe('getDashboardPath', () => {
  it('routes admin to /admin and teacher to /teacher', () => {
    expect(getDashboardPath('admin')).toBe('/admin')
    expect(getDashboardPath('teacher')).toBe('/teacher')
  })

  it('routes students to /student', () => {
    expect(getDashboardPath('student')).toBe('/student')
  })

  it('falls back to / when role is missing', () => {
    expect(getDashboardPath(null)).toBe('/')
    expect(getDashboardPath(undefined)).toBe('/')
  })
})

describe('rolesInclude', () => {
  it('allows all when allowed list is empty or undefined', () => {
    expect(rolesInclude(['student'], undefined)).toBe(true)
    expect(rolesInclude(['student'], [])).toBe(true)
  })

  it('returns true when user has any allowed role', () => {
    expect(rolesInclude(['student', 'teacher'], ['admin', 'teacher'])).toBe(
      true,
    )
  })

  it('returns false when user has none of the allowed roles', () => {
    expect(rolesInclude(['student'], ['admin', 'teacher'])).toBe(false)
  })
})

describe('isStaffRole', () => {
  it('is true for admin and teacher', () => {
    expect(isStaffRole('admin')).toBe(true)
    expect(isStaffRole('teacher')).toBe(true)
  })

  it('is false for student or missing', () => {
    expect(isStaffRole('student')).toBe(false)
    expect(isStaffRole(null)).toBe(false)
    expect(isStaffRole(undefined)).toBe(false)
  })
})
