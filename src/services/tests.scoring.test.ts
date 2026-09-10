import { describe, expect, it } from 'vitest'
import { computeScorePercent, isAttemptExpired } from '@/services/tests'

describe('computeScorePercent', () => {
  it('returns 0 when total is 0 or negative', () => {
    expect(computeScorePercent(5, 0)).toBe(0)
    expect(computeScorePercent(5, -1)).toBe(0)
  })

  it('rounds to one decimal place', () => {
    expect(computeScorePercent(1, 3)).toBe(33.3)
    expect(computeScorePercent(2, 3)).toBe(66.7)
    expect(computeScorePercent(3, 3)).toBe(100)
  })

  it('handles perfect and zero scores', () => {
    expect(computeScorePercent(0, 10)).toBe(0)
    expect(computeScorePercent(10, 10)).toBe(100)
  })
})

describe('isAttemptExpired', () => {
  const started = '2026-01-01T12:00:00.000Z'

  it('uses expires_at when present', () => {
    const attempt = {
      started_at: started,
      expires_at: '2026-01-01T12:30:00.000Z',
    }
    expect(
      isAttemptExpired(attempt, 60, Date.parse('2026-01-01T12:29:00.000Z')),
    ).toBe(false)
    expect(
      isAttemptExpired(attempt, 60, Date.parse('2026-01-01T12:31:00.000Z')),
    ).toBe(true)
  })

  it('falls back to durationMinutes from started_at', () => {
    const attempt = { started_at: started, expires_at: null }
    expect(
      isAttemptExpired(attempt, 30, Date.parse('2026-01-01T12:29:00.000Z')),
    ).toBe(false)
    expect(
      isAttemptExpired(attempt, 30, Date.parse('2026-01-01T12:31:00.000Z')),
    ).toBe(true)
  })

  it('is never expired when no expires_at and no positive duration', () => {
    const attempt = { started_at: started, expires_at: null }
    expect(isAttemptExpired(attempt, null, Date.parse('2099-01-01'))).toBe(
      false,
    )
    expect(isAttemptExpired(attempt, 0, Date.parse('2099-01-01'))).toBe(false)
  })
})
