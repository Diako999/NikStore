// Socket management (connect / disconnect / event registration) is handled
// globally in App.vue via watch(isLoggedIn, ...). This composable only
// provides the playPing audio effect so AdminLayout can import it without
// pulling in socket logic that would create duplicate event handlers.

let audioCtx = null

export function playPing() {
  try {
    audioCtx = audioCtx ?? new (window.AudioContext || window.webkitAudioContext)()
    const osc  = audioCtx.createOscillator()
    const gain = audioCtx.createGain()
    osc.connect(gain)
    gain.connect(audioCtx.destination)
    osc.type = 'sine'
    osc.frequency.setValueAtTime(880, audioCtx.currentTime)
    gain.gain.setValueAtTime(0.12, audioCtx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.4)
    osc.start()
    osc.stop(audioCtx.currentTime + 0.4)
  } catch { /* non-critical — AudioContext may be blocked or unavailable */ }
}

// No-op composable kept for backwards compatibility with AdminLayout import.
// Event handlers for new_order / new_review live in App.vue (single source of truth).
export function useRealtimeNotifications() {}
