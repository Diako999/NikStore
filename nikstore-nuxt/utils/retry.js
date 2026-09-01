/**
 * Retries an async function up to `times` attempts with `delayMs` between each.
 * Silently ignores errors on non-final attempts.
 */
export async function withRetry(fn, times = 3, delayMs = 2000) {
  for (let attempt = 1; attempt <= times; attempt++) {
    try {
      return await fn()
    } catch (err) {
      if (attempt === times) throw err
      await new Promise(r => setTimeout(r, delayMs * attempt))
    }
  }
}
