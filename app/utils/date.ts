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
