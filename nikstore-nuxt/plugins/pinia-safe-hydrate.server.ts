import { shouldHydrate } from 'pinia'

// @pinia/nuxt registers a skipHydrate payload reducer that calls obj.hasOwnProperty.
// Null-prototype objects (from server-side API responses or Mongoose lean queries)
// crash that call. This plugin runs after @pinia/nuxt and overwrites the reducer
// with a version that is safe for null-prototype objects.
export default definePayloadPlugin(() => {
  definePayloadReducer('skipHydrate', (data: unknown) => {
    try {
      return !(shouldHydrate as (d: unknown) => boolean)(data) && 1
    } catch {
      return false
    }
  })
})
