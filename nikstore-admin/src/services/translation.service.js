const cache = new Map()

export const translationService = {
  async toEnglish(text) {
    if (!text?.trim()) return ''
    if (cache.has(text)) return cache.get(text)

    const url =
      'https://translate.googleapis.com/translate_a/single' +
      `?client=gtx&sl=fa&tl=en&dt=t&q=${encodeURIComponent(text)}`

    const res  = await fetch(url)
    const data = await res.json()
    // response[0] is array of segments: [[translated, original, ...], ...]
    const translated = data[0].map(s => s[0]).join('')
    cache.set(text, translated)
    return translated
  },
}
