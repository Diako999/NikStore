import { describe, it, expect } from 'vitest'
import { SORT_OPTIONS } from './constants'

describe('SORT_OPTIONS', () => {
  it('contains all expected sort values', () => {
    const values = SORT_OPTIONS.map((o) => o.value)
    expect(values).toContain('newest')
    expect(values).toContain('price_asc')
    expect(values).toContain('price_desc')
    expect(values).toContain('bestseller')
    expect(values).toContain('mostViewed')
    expect(values).toContain('discount')
  })

  it('has Persian label for mostViewed', () => {
    const opt = SORT_OPTIONS.find((o) => o.value === 'mostViewed')
    expect(opt).toBeDefined()
    expect(opt.label).toBe('پربازدیدترین')
  })

  it('mostViewed appears before discount', () => {
    const values = SORT_OPTIONS.map((o) => o.value)
    expect(values.indexOf('mostViewed')).toBeLessThan(values.indexOf('discount'))
  })

  it('every option has label and value', () => {
    for (const opt of SORT_OPTIONS) {
      expect(opt.label).toBeTruthy()
      expect(opt.value).toBeTruthy()
    }
  })
})
