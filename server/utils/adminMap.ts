// server/utils/adminMap.ts
export const collMap = {
  artists:       { dir: 'artists',       kind: 'data', ext: '.json' },
  exhibitions:   { dir: 'exhibitions',   kind: 'data', ext: '.json' },
  window:        { dir: 'window',        kind: 'data', ext: '.json' },
  viewingRooms:  { dir: 'viewing-rooms', kind: 'data', ext: '.json' },
  studio:        { dir: 'studio',        kind: 'data', ext: '.json' },
  publications:  { dir: 'publications',  kind: 'page', ext: '.md'   },
  news:          { dir: 'news',          kind: 'page', ext: '.md'   }
} as const

export type CollKey = keyof typeof collMap

export const pathFor = (c: CollKey, slug: string): string =>
  `${collMap[c].dir}/${slug}${collMap[c].ext}`

export const ensureColl = (c: string): CollKey => {
  if (!(c in collMap)) throw createError({ statusCode: 400, statusMessage: 'Unknown collection' })
  return c as CollKey
}

export function toFileContents(c: CollKey, item: Record<string, unknown>): string {
  if (!item?.slug || typeof item.slug !== 'string') {
    throw createError({ statusCode: 400, statusMessage: 'Missing slug' })
  }
  if (collMap[c].kind === 'data') {
    return JSON.stringify(item, null, 2) + '\n'
  }
  // page (markdown): frontmatter + body
  const body = (typeof item.body === 'string' ? item.body : (typeof (item as any).content === 'string' ? (item as any).content : '')) as string
  const fm: Record<string, unknown> = { ...item }
  delete (fm as any).body
  delete (fm as any).content
  const front = Object.entries(fm).map(([k, v]) => `${k}: ${scalar(v)}`).join('\n')
  return `---\n${front}\n---\n\n${body}\n`
}

/** Stringify a frontmatter scalar/array/object to YAML-like value safely */
function scalar(v: unknown): string {
  if (Array.isArray(v)) return `[${v.map(scalar).join(', ')}]`
  if (v === null || v === undefined) return 'null'
  const t = typeof v
  if (t === 'string') return JSON.stringify(v as string)
  if (t === 'number' || t === 'boolean') return String(v)
  // objects: keep as JSON
  return JSON.stringify(v)
}
