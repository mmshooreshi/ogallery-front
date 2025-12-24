// app/utils/date.ts
export function getJalaliParts(date: string) {
  const parts = new Intl.DateTimeFormat('fa-IR-u-ca-persian', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).formatToParts(new Date(date))

  const get = (type: string) =>
    parts.find(p => p.type === type)?.value

  return {
    day: get('day'),
    month: get('month'),
    year: get('year'),
  }
}

export function getGregorianParts(
  date: string,
  locale: string,
) {
  const parts = new Intl.DateTimeFormat(locale, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).formatToParts(new Date(date))

  const get = (type: string) =>
    parts.find(p => p.type === type)?.value

  return {
    day: get('day'),
    month: get('month'),
    year: get('year'),
  }
}


// server/lib/date/parseRange.ts
export function parseDateRange(raw: string): { start: string; end: string } | null {
  // Example: "August 25 - September 11 2023"
  const m = raw.match(
    /([A-Za-z]+)\s+(\d+)\s*-\s*([A-Za-z]+)?\s*(\d+)\s+(\d{4})/
  )

  if (!m) return null

  const [, m1, d1, m2, d2, y] = m
  const monthStart = m1
  const monthEnd = m2 || m1

  const start = new Date(`${monthStart} ${d1}, ${y}`)
  const end = new Date(`${monthEnd} ${d2}, ${y}`)

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return null

  return {
    start: start.toISOString(),
    end: end.toISOString(),
  }
}






export function formatEntryDate(
  startIso: string | null, 
  endIso: string | null, 
  rawString: string | null, 
  locale: string
): string {
  // 1. English Locale (Non-FA)
  // Usually, we prefer the 'rawString' (e.g. "November 19, 2025") if available.
  // Otherwise, we format the ISO start date.
  if (locale !== 'FA') {
    if (rawString) return rawString
    if (!startIso) return ''
    
    const p = getGregorianParts(startIso, 'en-US')
    // Format: "Month Day, Year"
    return `${p.month} ${p.day}, ${p.year}`
  }

  // 2. Persian Locale (FA)
  // We must calculate the Jalali date from the ISO string.
  if (!startIso) return rawString || ''

  const s = getJalaliParts(startIso)
  
  // Safety check: if parsing failed, fallback to raw
  if (!s.day || !s.month || !s.year) return rawString || ''

  // A) Single Date (Publication, News, or same day event)
  if (!endIso || startIso === endIso) {
    return `${s.day} ${s.month} ${s.year}`
  }

  // B) Date Range (Exhibition)
  const e = getJalaliParts(endIso)
  
  // Safety check for end date
  if (!e.day || !e.month || !e.year) {
    return `${s.day} ${s.month} ${s.year}`
  }

  // Scenario 1: Different Years
  // Example: 10 Esfand 1402 - 5 Farvardin 1403
  if (s.year !== e.year) {
    return `${s.day} ${s.month} ${s.year} - ${e.day} ${e.month} ${e.year}`
  }

  // Scenario 2: Same Year, Different Month
  // Example: 10 Mehr - 20 Aban 1403
  if (s.month !== e.month) {
    return `${s.day} ${s.month} - ${e.day} ${e.month} ${s.year}`
  }

  // Scenario 3: Same Month, Same Year
  // Example: 10 - 20 Aban 1403
  return `${s.day} - ${e.day} ${s.month} ${s.year}`
}