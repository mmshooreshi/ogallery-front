// server/utils/paths.ts
export function normalizePath(input: string): string {
  if (!input) return ''

  // 🔒 Skip normalization for external IDs or absolute URLs
  if (input.startsWith('external:')) return input
  if (/^https?:\/\//i.test(input)) return input

  return input
    .replace(/\\/g, '/')
    .replace(/\/+/g, '/')
    .split('/')
    .map((seg) => {
      if (!seg) return ''
      const m = seg.match(/^(.*?)(\.[^.]+)?$/)
      const base = (m?.[1] ?? '').trim()
      const ext  = (m?.[2] ?? '')
      const cleanBase = base
        .replace(/\s+/g, '_')
        .replace(/[^\w\-\.]+/g, '')
        .replace(/_+/g, '_')
        .replace(/^_+|_+$/g, '')
        .toLowerCase()
      return cleanBase + ext.toLowerCase()
    })
    .filter(Boolean)
    .join('/')
}
