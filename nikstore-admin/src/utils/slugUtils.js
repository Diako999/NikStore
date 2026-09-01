// Persian character → Latin transliteration map
export const FA_MAP = {
  'ا':'a','أ':'a','إ':'e','آ':'a','ء':'',
  'ب':'b','پ':'p','ت':'t','ث':'s',
  'ج':'j','چ':'ch','ح':'h','خ':'kh',
  'د':'d','ذ':'z','ر':'r','ز':'z',
  'ژ':'zh','س':'s','ش':'sh','ص':'s',
  'ض':'z','ط':'t','ظ':'z','ع':'a',
  'غ':'gh','ف':'f','ق':'q','ک':'k','ك':'k',
  'گ':'g','ل':'l','م':'m','ن':'n',
  'و':'v','ه':'h','ة':'h',
  'ی':'i','ي':'i','ئ':'y','ى':'a',
  '‌':'',  // ZWNJ
  ' ':'-',
}

/** Transliterate Persian text to a URL-safe slug (fallback, no network). */
export function persianToSlug(text) {
  return text
    .split('')
    .map(c => (c in FA_MAP ? FA_MAP[c] : /[a-zA-Z0-9]/.test(c) ? c.toLowerCase() : ''))
    .join('')
    .replace(/-{2,}/g, '-')
    .replace(/^-+|-+$/g, '')
}

/** Normalise an already-English string to a URL-safe slug. */
export function slugFrom(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/** Sanitise a raw slug input value typed by the user. */
export function sanitizeSlugInput(raw) {
  return raw
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-{2,}/g, '-')
    .replace(/^-+|-+$/g, '')
}

export const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
