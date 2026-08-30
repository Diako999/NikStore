// Fade + rise-in scroll reveal for a container's direct children, built on
// GSAP + ScrollTrigger. SSR-safe (all GSAP/DOM access is deferred behind
// import.meta.client / onMounted) and reduced-motion aware.
import { onMounted, onUnmounted } from 'vue'

// Module-level guard — ScrollTrigger.registerPlugin() is idempotent in GSAP
// itself, but this avoids re-importing/re-registering on every composable
// call across every component instance that uses it.
let scrollTriggerRegistered = false
let gsapModulePromise = null

async function loadGsap() {
  if (!gsapModulePromise) {
    gsapModulePromise = Promise.all([
      import('gsap'),
      import('gsap/ScrollTrigger'),
    ]).then(([{ gsap }, { ScrollTrigger }]) => {
      if (!scrollTriggerRegistered) {
        gsap.registerPlugin(ScrollTrigger)
        scrollTriggerRegistered = true
      }
      return { gsap, ScrollTrigger }
    })
  }
  return gsapModulePromise
}

/**
 * @param {import('vue').Ref<HTMLElement|null>} targetRef - ref to the
 *   container element; its direct children are animated individually.
 * @param {object} [options]
 * @param {number} [options.y=24] - starting vertical offset in px.
 * @param {number} [options.duration=0.6] - tween duration in seconds.
 * @param {number} [options.stagger=0.08] - delay between each child in seconds.
 * @param {string} [options.ease='power2.out']
 * @param {string} [options.start='top 85%'] - ScrollTrigger `start` value.
 * @param {string} [options.selector] - optional selector (relative to the
 *   container) to pick specific children instead of using every direct child.
 */
export function useGsapReveal(targetRef, options = {}) {
  const {
    y = 24,
    duration = 0.6,
    stagger = 0.08,
    ease = 'power2.out',
    start = 'top 85%',
    selector = null,
  } = options

  let scrollTriggerInstance = null

  onMounted(async () => {
    if (!import.meta.client) return

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const el = targetRef.value
    if (!el) return

    const children = selector
      ? Array.from(el.querySelectorAll(selector))
      : Array.from(el.children)
    if (!children.length) return

    if (prefersReducedMotion) {
      // Render in final state immediately — no motion at all.
      children.forEach((child) => { child.style.opacity = '1'; child.style.transform = 'none' })
      return
    }

    const { gsap } = await loadGsap()
    // Guard again in case the component unmounted while gsap was loading.
    if (!targetRef.value) return

    const tween = gsap.fromTo(
      children,
      { opacity: 0, y },
      {
        opacity: 1,
        y: 0,
        duration,
        stagger,
        ease,
        scrollTrigger: {
          trigger: el,
          start,
          once: true,
        },
      },
    )
    scrollTriggerInstance = tween.scrollTrigger
  })

  onUnmounted(() => {
    scrollTriggerInstance?.kill()
    scrollTriggerInstance = null
  })
}
