import { describe, expect, it } from 'vitest'
import { cn, formatPercent } from '@/lib/utils'

describe('cn', () => {
  it('merges class names and resolves Tailwind conflicts', () => {
    expect(cn('px-2', 'px-4')).toBe('px-4')
    expect(cn('text-sm', undefined, 'font-medium')).toBe(
      'text-sm font-medium',
    )
  })
})

describe('formatPercent', () => {
  it('rounds and formats numeric percents', () => {
    expect(formatPercent(12.4)).toBe('12%')
    expect(formatPercent(12.6)).toBe('13%')
    expect(formatPercent(100)).toBe('100%')
  })

  it('returns 0% for NaN', () => {
    expect(formatPercent(Number.NaN)).toBe('0%')
  })
})
