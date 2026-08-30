<template>
  <ClientOnly>
    <canvas v-if="!reducedMotion" ref="canvasRef" class="aurora-scene" aria-hidden="true" />
  </ClientOnly>
</template>

<script setup>
// Decorative animated enhancement layered OVER the static CSS `--page-bg`
// aurora-mesh gradient (glass-theme.css) — NOT a replacement for it. If
// Three.js fails to init for any reason, the CSS gradient underneath still
// reads as a complete page; this component only adds slow motion on top.
//
// Self-contained by design (no prop API) — later chunks just drop
// `<AuroraScene />` absolutely-positioned behind a hero's content.
import { onMounted, onUnmounted, ref } from 'vue'

const canvasRef = ref(null)
const reducedMotion = ref(false)

let renderer, scene, camera, sharedGeometry, blobs = [], rafId = null, resizeObserver = null

// Brand/purple/gold accents matching the --page-bg aurora-mesh palette.
const PALETTE = [0x3D8B52, 0x7A5ADC, 0xE7AF42, 0x6EB082, 0x3D8B52]

function initScene(canvas) {
  const parent = canvas.parentElement
  const width = parent?.clientWidth || window.innerWidth
  const height = parent?.clientHeight || window.innerHeight

  renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: false })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5)) // capped DPR
  renderer.setSize(width, height, false)

  scene = new THREE.Scene()
  camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 100)
  camera.position.z = 10

  sharedGeometry = new THREE.SphereGeometry(1, 16, 16) // low poly count, shared across all blobs
  blobs = PALETTE.slice(0, 4).map((color, i) => {
    const material = new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.28,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
    const mesh = new THREE.Mesh(sharedGeometry, material)
    const scale = 1.6 + Math.random() * 1.4
    mesh.scale.setScalar(scale)
    mesh.position.set(
      (Math.random() - 0.5) * 10,
      (Math.random() - 0.5) * 6,
      (Math.random() - 0.5) * 4,
    )
    scene.add(mesh)
    return {
      mesh,
      basePos: mesh.position.clone(),
      speed: 0.15 + Math.random() * 0.15,
      offset: Math.random() * Math.PI * 2,
      radius: 0.6 + Math.random() * 0.8,
      i,
    }
  })

  resizeObserver = new ResizeObserver((entries) => {
    const entry = entries[0]
    if (!entry) return
    const w = entry.contentRect.width
    const h = entry.contentRect.height
    if (!w || !h) return
    camera.aspect = w / h
    camera.updateProjectionMatrix()
    renderer.setSize(w, h, false)
  })
  if (parent) resizeObserver.observe(parent)
}

function animate(time) {
  rafId = requestAnimationFrame(animate)
  const t = time * 0.001
  blobs.forEach(({ mesh, basePos, speed, offset, radius }) => {
    mesh.position.x = basePos.x + Math.sin(t * speed + offset) * radius
    mesh.position.y = basePos.y + Math.cos(t * speed * 0.8 + offset) * radius * 0.7
  })
  renderer.render(scene, camera)
}

function stopLoop() {
  if (rafId) { cancelAnimationFrame(rafId); rafId = null }
}

function onVisibilityChange() {
  if (document.hidden) stopLoop()
  else if (!rafId && renderer) rafId = requestAnimationFrame(animate)
}

let THREE
function idleDefer(fn) {
  if ('requestIdleCallback' in window) window.requestIdleCallback(fn, { timeout: 1500 })
  else setTimeout(fn, 200)
}

onMounted(() => {
  reducedMotion.value = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  if (reducedMotion.value) return // component doesn't mount its canvas at all

  // Deferred so this never competes with the hero's own content/image for
  // the LCP paint — runs after the browser is idle (or after a short
  // fallback delay on browsers without requestIdleCallback).
  idleDefer(async () => {
    const mod = await import('three')
    THREE = mod
    const canvas = canvasRef.value
    if (!canvas) return // unmounted while three.js was loading
    initScene(canvas)
    rafId = requestAnimationFrame(animate)
    document.addEventListener('visibilitychange', onVisibilityChange)
  })
})

onUnmounted(() => {
  stopLoop()
  document.removeEventListener('visibilitychange', onVisibilityChange)
  resizeObserver?.disconnect()
  blobs.forEach(({ mesh }) => { mesh.material?.dispose() })
  blobs = []
  sharedGeometry?.dispose()
  sharedGeometry = null
  renderer?.dispose()
  renderer = null
  scene = null
  camera = null
})
</script>

<style scoped>
.aurora-scene {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  /* Soft blurred-blob look without needing custom blur shaders. */
  filter: blur(40px);
  opacity: 0.9;
}
</style>
