import { describe, it, expect } from 'vitest'
import { PANEL_PERMISSIONS } from './constants'

describe('PANEL_PERMISSIONS', () => {

  // ── Structure ──────────────────────────────────────────────────────────────

  it('every entry has key, label, icon and group', () => {
    for (const p of PANEL_PERMISSIONS) {
      expect(p.key,   `missing key in ${JSON.stringify(p)}`).toBeTruthy()
      expect(p.label, `missing label for key "${p.key}"`).toBeTruthy()
      expect(p.icon,  `missing icon for key "${p.key}"`).toBeTruthy()
      expect(p.group, `missing group for key "${p.key}"`).toBeTruthy()
    }
  })

  it('top-level keys are unique', () => {
    const keys = PANEL_PERMISSIONS.map(p => p.key)
    expect(new Set(keys).size).toBe(keys.length)
  })

  // ── Core permissions present ───────────────────────────────────────────────

  const requiredKeys = [
    'dashboard',
    'products', 'categories', 'brands', 'colors', 'banners', 'orders', 'discounts',
    'users', 'reviews',
    'blog', 'blog-comments', 'pages',
  ]

  it.each(requiredKeys)('includes "%s" permission', (key) => {
    expect(PANEL_PERMISSIONS.some(p => p.key === key)).toBe(true)
  })

  // ── Sub-actions ────────────────────────────────────────────────────────────

  describe('products sub-actions', () => {
    const products = PANEL_PERMISSIONS.find(p => p.key === 'products')

    it('products has actions array', () => {
      expect(Array.isArray(products?.actions)).toBe(true)
      expect(products.actions.length).toBeGreaterThan(0)
    })

    const requiredProductActions = ['view', 'create', 'edit', 'delete', 'view_buy_price', 'view_sell_price']

    it.each(requiredProductActions)('products has "%s" action', (actionKey) => {
      expect(products.actions.some(a => a.key === actionKey)).toBe(true)
    })

    it('every product action has key and label', () => {
      for (const a of products.actions) {
        expect(a.key).toBeTruthy()
        expect(a.label).toBeTruthy()
      }
    })

    it('product action keys are unique within the section', () => {
      const keys = products.actions.map(a => a.key)
      expect(new Set(keys).size).toBe(keys.length)
    })
  })

  describe('orders sub-actions', () => {
    const orders = PANEL_PERMISSIONS.find(p => p.key === 'orders')

    it('orders has actions array', () => {
      expect(Array.isArray(orders?.actions)).toBe(true)
    })

    it.each(['view', 'edit', 'delete'])('orders has "%s" action', (actionKey) => {
      expect(orders.actions.some(a => a.key === actionKey)).toBe(true)
    })
  })

  // ── Groups ─────────────────────────────────────────────────────────────────

  const expectedGroups = ['عمومی', 'فروشگاه', 'مدیریت', 'محتوا']

  it('contains all expected groups', () => {
    const groups = [...new Set(PANEL_PERMISSIONS.map(p => p.group))]
    for (const g of expectedGroups) expect(groups).toContain(g)
  })

  it('pages permission is in "محتوا" group', () => {
    const pages = PANEL_PERMISSIONS.find(p => p.key === 'pages')
    expect(pages?.group).toBe('محتوا')
  })

  it('blog-comments is separate from blog', () => {
    const blog         = PANEL_PERMISSIONS.find(p => p.key === 'blog')
    const blogComments = PANEL_PERMISSIONS.find(p => p.key === 'blog-comments')
    expect(blog).toBeDefined()
    expect(blogComments).toBeDefined()
    expect(blog.key).not.toBe(blogComments.key)
  })

  // ── Router alignment ───────────────────────────────────────────────────────

  it('router-referenced permissions all exist in PANEL_PERMISSIONS', () => {
    const routerPermissions = [
      'dashboard', 'products', 'categories', 'brands', 'colors',
      'orders', 'users', 'reviews', 'discounts', 'banners',
      'blog', 'blog-comments', 'pages',
    ]
    const defined = new Set(PANEL_PERMISSIONS.map(p => p.key))
    for (const perm of routerPermissions) {
      expect(defined.has(perm), `router uses "${perm}" but it's not in PANEL_PERMISSIONS`).toBe(true)
    }
  })
})
