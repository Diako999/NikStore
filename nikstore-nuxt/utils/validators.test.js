import { describe, it, expect } from 'vitest'
import { validators } from './validators'

describe('validators.required', () => {
  it('returns true for non-empty string', () => {
    expect(validators.required('hello')).toBe(true)
  })

  it('returns error message for empty string', () => {
    expect(typeof validators.required('')).toBe('string')
  })

  it('returns error message for whitespace-only string', () => {
    expect(typeof validators.required('   ')).toBe('string')
  })

  it('returns error message for null/undefined', () => {
    expect(typeof validators.required(null)).toBe('string')
    expect(typeof validators.required(undefined)).toBe('string')
  })
})

describe('validators.phone', () => {
  it('accepts valid Iranian mobile numbers', () => {
    expect(validators.phone('09123456789')).toBe(true)
    expect(validators.phone('09901234567')).toBe(true)
  })

  it('rejects numbers not starting with 09', () => {
    expect(typeof validators.phone('08123456789')).toBe('string')
    expect(typeof validators.phone('9123456789')).toBe('string')
  })

  it('rejects numbers with wrong length', () => {
    expect(typeof validators.phone('0912345678')).toBe('string')  // 10 digits
    expect(typeof validators.phone('091234567890')).toBe('string') // 12 digits
  })

  it('rejects non-numeric characters', () => {
    expect(typeof validators.phone('0912-345-6789')).toBe('string')
  })
})

describe('validators.otp', () => {
  it('accepts 4-digit codes', () => {
    expect(validators.otp('1234')).toBe(true)
  })

  it('accepts 6-digit codes', () => {
    expect(validators.otp('123456')).toBe(true)
  })

  it('rejects codes with wrong length', () => {
    expect(typeof validators.otp('123')).toBe('string')
    expect(typeof validators.otp('1234567')).toBe('string')
  })

  it('rejects non-numeric OTPs', () => {
    expect(typeof validators.otp('12ab')).toBe('string')
  })
})

describe('validators.minLength', () => {
  it('returns true when value meets minimum', () => {
    expect(validators.minLength(3)('abc')).toBe(true)
    expect(validators.minLength(3)('abcde')).toBe(true)
  })

  it('returns error message when below minimum', () => {
    expect(typeof validators.minLength(5)('ab')).toBe('string')
  })

  it('error message includes the required minimum', () => {
    const msg = validators.minLength(8)('abc')
    expect(msg).toContain('8')
  })
})
