import { describe, expect, it } from 'vitest'
import { calcAttendancePercentage } from '@/services/attendance'

describe('calcAttendancePercentage', () => {
  it('returns 0 when total is 0 or negative', () => {
    expect(calcAttendancePercentage(5, 0)).toBe(0)
    expect(calcAttendancePercentage(5, -2)).toBe(0)
  })

  it('rounds to nearest integer percent', () => {
    expect(calcAttendancePercentage(1, 3)).toBe(33)
    expect(calcAttendancePercentage(2, 3)).toBe(67)
    expect(calcAttendancePercentage(3, 3)).toBe(100)
  })

  it('treats present as the attended count (present+late at call site)', () => {
    // 8 present + 2 late = 10 attended of 12 → 83%
    expect(calcAttendancePercentage(10, 12)).toBe(83)
  })
})
