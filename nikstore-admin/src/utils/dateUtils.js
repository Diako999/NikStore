import jalaali from 'jalaali-js'

/** UTC ISO string → Jalali display "1403/06/15 14:30" */
export function utcToJalali(utcStr) {
  if (!utcStr) return '—'
  const d = new Date(utcStr)
  const { jy, jm, jd } = jalaali.toJalaali(d.getFullYear(), d.getMonth() + 1, d.getDate())
  const hh = String(d.getHours()).padStart(2, '0')
  const mm = String(d.getMinutes()).padStart(2, '0')
  return `${jy}/${String(jm).padStart(2, '0')}/${String(jd).padStart(2, '0')} ${hh}:${mm}`
}

/** Jalali display "1403/06/15 14:30" → UTC ISO string */
export function jalaliToUTC(jalaliStr) {
  if (!jalaliStr) return null
  const [datePart, timePart = '00:00'] = jalaliStr.split(' ')
  const [jy, jm, jd] = datePart.split('/').map(Number)
  const [hour, minute] = timePart.split(':').map(Number)
  const { gy, gm, gd } = jalaali.toGregorian(jy, jm, jd)
  return new Date(gy, gm - 1, gd, hour, minute).toISOString()
}
