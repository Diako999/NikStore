import { describe, it, expect } from 'vitest'
import { mount }               from '@vue/test-utils'
import { createRouter, createMemoryHistory } from 'vue-router'
import QuickActions            from './QuickActions.vue'

function buildRouter() {
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/',                   component: { template: '<div/>' } },
      { path: '/products/create',    name: 'product-create',      component: { template: '<div/>' } },
      { path: '/orders',             name: 'orders',              component: { template: '<div/>' } },
      { path: '/reviews',            name: 'reviews',             component: { template: '<div/>' } },
      { path: '/categories',         name: 'categories',          component: { template: '<div/>' } },
    ],
  })
}

function mountComp(props = {}) {
  return mount(QuickActions, {
    props,
    global: { plugins: [buildRouter()] },
  })
}

describe('QuickActions', () => {
  it('renders 4 quick-action cards', async () => {
    const wrapper = mountComp()
    await wrapper.vm.$router.isReady()
    const links = wrapper.findAll('a')
    expect(links.length).toBe(4)
  })

  it('shows no badge when pendingOrders/pendingReviews are 0', async () => {
    const wrapper = mountComp()
    await wrapper.vm.$router.isReady()
    const badges = wrapper.findAll('[class*="bg-error"]')
    expect(badges.length).toBe(0)
  })

  it('shows error badge for pending orders', async () => {
    const wrapper = mountComp({ pendingOrders: 3 })
    await wrapper.vm.$router.isReady()
    const badges = wrapper.findAll('[class*="bg-error"]')
    expect(badges.length).toBeGreaterThan(0)
    expect(badges[0].text()).toBe('3')
  })

  it('shows error badge for pending reviews', async () => {
    const wrapper = mountComp({ pendingReviews: 7 })
    await wrapper.vm.$router.isReady()
    const badges = wrapper.findAll('[class*="bg-error"]')
    expect(badges.length).toBeGreaterThan(0)
  })

  it('caps badge display at 99+', async () => {
    const wrapper = mountComp({ pendingOrders: 150 })
    await wrapper.vm.$router.isReady()
    const badge = wrapper.find('[class*="bg-error"]')
    expect(badge.text()).toBe('99+')
  })
})
