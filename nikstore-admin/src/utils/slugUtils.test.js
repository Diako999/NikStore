import { describe, it, expect } from 'vitest'
import { persianToSlug, slugFrom, sanitizeSlugInput, SLUG_RE } from './slugUtils'

describe('persianToSlug', () => {
  it('transliterates common Persian letters', () => {
    // ع→a ی→i ن→n ک→k
    expect(persianToSlug('عینک')).toBe('aink')
  })

  it('maps spaces to hyphens', () => {
    // ع→a ی→i ن→n ک→k space→- ا→a ف→f ت→t ا→a ب→b ی→i
    expect(persianToSlug('عینک آفتابی')).toBe('aink-aftabi')
  })

  it('collapses consecutive hyphens from multiple spaces', () => {
    // two spaces → two hyphens → collapsed to one
    expect(persianToSlug('عینک  آفتابی')).toBe('aink-aftabi')
  })

  it('strips leading and trailing hyphens', () => {
    // leading/trailing spaces become hyphens that get stripped
    expect(persianToSlug(' عینک ')).toBe('aink')
  })

  it('passes through ASCII letters and digits unchanged', () => {
    expect(persianToSlug('model2024')).toBe('model2024')
  })

  it('drops unsupported characters', () => {
    // '!' has no mapping and is not ASCII alphanumeric → dropped
    expect(persianToSlug('عینک!')).toBe('aink')
  })

  it('transliterates ش to sh', () => {
    // ش→sh م→m ع→a
    expect(persianToSlug('شمع')).toBe('shma')
  })

  it('transliterates خ to kh', () => {
    // خ→kh ا→a ن→n ه→h
    expect(persianToSlug('خانه')).toBe('khanh')
  })

  it('transliterates چ to ch', () => {
    // چ→ch ش→sh م→m
    expect(persianToSlug('چشم')).toBe('chshm')
  })

  it('strips ZWNJ (maps to empty string, not hyphen)', () => {
    // ZWNJ maps to '' so م→m ی→i ‌→'' خ→kh و→v ا→a ه→h م→m
    expect(persianToSlug('می‌خواهم')).toBe('mikhvahm')
  })

  it('handles empty string', () => {
    expect(persianToSlug('')).toBe('')
  })
})

describe('slugFrom', () => {
  it('lowercases input', () => {
    expect(slugFrom('Sunglasses')).toBe('sunglasses')
  })

  it('replaces non-alphanumeric runs with single hyphen', () => {
    expect(slugFrom('ray ban glasses')).toBe('ray-ban-glasses')
  })

  it('strips leading/trailing hyphens', () => {
    expect(slugFrom('  hello world  ')).toBe('hello-world')
  })

  it('collapses multiple separators', () => {
    expect(slugFrom('hello---world')).toBe('hello-world')
  })

  it('handles digits', () => {
    expect(slugFrom('model 2024 pro')).toBe('model-2024-pro')
  })

  it('handles already-valid slug unchanged', () => {
    expect(slugFrom('ray-ban-2024')).toBe('ray-ban-2024')
  })

  it('handles empty string', () => {
    expect(slugFrom('')).toBe('')
  })
})

describe('sanitizeSlugInput', () => {
  it('lowercases', () => {
    expect(sanitizeSlugInput('RayBan')).toBe('rayban')
  })

  it('converts spaces to hyphens', () => {
    expect(sanitizeSlugInput('ray ban')).toBe('ray-ban')
  })

  it('removes non-alphanumeric/hyphen chars', () => {
    expect(sanitizeSlugInput('ray_ban!')).toBe('rayban')
  })

  it('collapses multiple hyphens', () => {
    expect(sanitizeSlugInput('ray--ban')).toBe('ray-ban')
  })

  it('strips leading and trailing hyphens', () => {
    expect(sanitizeSlugInput('-ray-ban-')).toBe('ray-ban')
  })

  it('converts multiple spaces to single hyphen', () => {
    expect(sanitizeSlugInput('ray   ban')).toBe('ray-ban')
  })

  it('handles empty string', () => {
    expect(sanitizeSlugInput('')).toBe('')
  })
})

describe('SLUG_RE', () => {
  it('accepts valid slugs', () => {
    expect(SLUG_RE.test('ray-ban')).toBe(true)
    expect(SLUG_RE.test('sunglasses2024')).toBe(true)
    expect(SLUG_RE.test('a')).toBe(true)
    expect(SLUG_RE.test('ray-ban-aviator-pro')).toBe(true)
  })

  it('rejects slugs with uppercase letters', () => {
    expect(SLUG_RE.test('RayBan')).toBe(false)
  })

  it('rejects slugs with leading hyphen', () => {
    expect(SLUG_RE.test('-ray-ban')).toBe(false)
  })

  it('rejects slugs with trailing hyphen', () => {
    expect(SLUG_RE.test('ray-ban-')).toBe(false)
  })

  it('rejects slugs with consecutive hyphens', () => {
    expect(SLUG_RE.test('ray--ban')).toBe(false)
  })

  it('rejects slugs with Persian characters', () => {
    expect(SLUG_RE.test('عینک')).toBe(false)
  })

  it('rejects slugs with underscores', () => {
    expect(SLUG_RE.test('ray_ban')).toBe(false)
  })

  it('rejects empty string', () => {
    expect(SLUG_RE.test('')).toBe(false)
  })
})
