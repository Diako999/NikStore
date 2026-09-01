import { describe, it, expect } from 'vitest'
import { formatPrice, formatNumber, formatDate, formatDateTime, calcDiscount, truncate } from './formatters'

describe('formatPrice', () => {
  it('formats number as Persian Toman', () => {
    const result = formatPrice(1_200_000)
    expect(result).toContain('تومان')
    expect(result).toMatch(/[۰-۹]/)
  })

  it('returns — for null', () => {
    expect(formatPrice(null)).toBe('—')
  })

  it('returns — for undefined', () => {
    expect(formatPrice(undefined)).toBe('—')
  })

  it('handles zero', () => {
    const result = formatPrice(0)
    expect(result).toContain('تومان')
  })
})

describe('formatNumber', () => {
  it('formats number in Persian locale', () => {
    const result = formatNumber(5000)
    expect(result).toMatch(/[۰-۹]/)
  })

  it('returns — for null', () => {
    expect(formatNumber(null)).toBe('—')
  })

  it('returns — for undefined', () => {
    expect(formatNumber(undefined)).toBe('—')
  })
})

describe('formatDate', () => {
  it('returns — for falsy input', () => {
    expect(formatDate(null)).toBe('—')
    expect(formatDate('')).toBe('—')
    expect(formatDate(undefined)).toBe('—')
  })

  it('formats ISO string as Persian date', () => {
    const result = formatDate('2024-03-20T00:00:00Z')
    expect(result).toMatch(/[۰-۹]/)
  })
})

describe('formatDateTime', () => {
  it('returns — for falsy input', () => {
    expect(formatDateTime(null)).toBe('—')
    expect(formatDateTime('')).toBe('—')
  })

  it('formats ISO string as Persian date-time including hour/minute', () => {
    const result = formatDateTime('2024-06-15T14:30:00Z')
    expect(result).toMatch(/[۰-۹]/)
    // should have time component — contains ':' separator in Persian locale
    expect(result.length).toBeGreaterThan(formatDate('2024-06-15T14:30:00Z').length)
  })
})

describe('calcDiscount', () => {
  it('calculates correct discount percentage', () => {
    expect(calcDiscount(1_000_000, 800_000)).toBe(20)
    expect(calcDiscount(200_000, 150_000)).toBe(25)
  })

  it('returns 0 when original is falsy', () => {
    expect(calcDiscount(0, 100)).toBe(0)
    expect(calcDiscount(null, 100)).toBe(0)
  })

  it('returns 0 when price is falsy', () => {
    expect(calcDiscount(100_000, 0)).toBe(0)
    expect(calcDiscount(100_000, null)).toBe(0)
  })

  it('rounds to nearest integer', () => {
    const result = calcDiscount(300, 200)
    expect(Number.isInteger(result)).toBe(true)
    expect(result).toBe(33)
  })
})

describe('truncate', () => {
  it('returns text unchanged when shorter than limit', () => {
    expect(truncate('کوتاه', 50)).toBe('کوتاه')
  })

  it('truncates and appends ... when over limit', () => {
    const long = 'x'.repeat(60)
    const result = truncate(long, 50)
    expect(result).toBe('x'.repeat(50) + '...')
  })

  it('uses default length of 50', () => {
    const long = 'x'.repeat(60)
    expect(truncate(long)).toBe('x'.repeat(50) + '...')
  })

  it('returns empty string for falsy input', () => {
    expect(truncate(null)).toBe('')
    expect(truncate('')).toBe('')
  })
})
