import { describe, it, expect } from 'vitest'
import { formatPrice, formatNumber, calcDiscount, truncate, formatDate } from './formatters'

describe('formatPrice', () => {
  it('formats number as Persian Toman', () => {
    const result = formatPrice(1_200_000)
    expect(result).toContain('تومان')
    expect(result).toMatch(/[۰-۹]/)
  })

  it('returns — for null/undefined', () => {
    expect(formatPrice(null)).toBe('—')
    expect(formatPrice(undefined)).toBe('—')
  })

  it('handles zero correctly', () => {
    const result = formatPrice(0)
    expect(result).toContain('تومان')
  })
})

describe('formatNumber', () => {
  it('formats number in Persian locale', () => {
    const result = formatNumber(1000)
    expect(result).toMatch(/[۰-۹]/)
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

  it('returns 0 when discounted is falsy', () => {
    expect(calcDiscount(100_000, 0)).toBe(0)
    expect(calcDiscount(100_000, null)).toBe(0)
  })

  it('rounds to nearest integer', () => {
    // 1/3 = 33.33...% → should round to 33
    const result = calcDiscount(300, 200)
    expect(Number.isInteger(result)).toBe(true)
    expect(result).toBe(33)
  })
})

describe('truncate', () => {
  it('returns text unchanged when shorter than limit', () => {
    expect(truncate('کوتاه', 60)).toBe('کوتاه')
  })

  it('truncates text longer than limit and appends ...', () => {
    const long = 'الف'.repeat(30) // 90 chars
    const result = truncate(long, 60)
    expect(result.endsWith('...')).toBe(true)
    expect(result.length).toBeLessThan(long.length)
  })

  it('uses default length of 60', () => {
    const long = 'x'.repeat(70)
    const result = truncate(long)
    expect(result).toBe('x'.repeat(60) + '...')
  })

  it('returns empty string for falsy input', () => {
    expect(truncate(null)).toBe('')
    expect(truncate('')).toBe('')
  })
})

describe('formatDate', () => {
  it('returns — for null/undefined', () => {
    expect(formatDate(null)).toBe('—')
    expect(formatDate(undefined)).toBe('—')
  })

  it('formats ISO string as Persian date', () => {
    const result = formatDate('2024-03-20T00:00:00Z')
    // Persian locale year should contain ۱۴ (1403)
    expect(result).toMatch(/[۰-۹]/)
  })
})
