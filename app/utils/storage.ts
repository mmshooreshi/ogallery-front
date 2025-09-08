export type Entity = Record<string, any> & { slug: string }
export type Collection = 'artists'|'exhibitions'|'window'|'viewing-rooms'|'publications'|'news'|'studio'
const KEY = 'admin-content-overrides'
function blank(): Record<Collection, Entity[]> {
  return { artists:[], exhibitions:[], window:[], 'viewing-rooms':[], publications:[], news:[], studio:[] }
}

// app/utils/storage.ts
export const list   = (c: string) => $fetch(`/api/admin/${c}`)
export const upsert = (c: string, item: any) =>
  $fetch(`/api/admin/${c}`, { method: 'PUT', body: item })
export const remove = (c: string, slug: string) =>
  $fetch(`/api/admin/${c}/${encodeURIComponent(slug)}`, { method: 'DELETE' })

export const exportJSON = () => $fetch<string>('/api/admin/export')
export const importJSON = (file: File) => file.text().then(text =>
  $fetch('/api/admin/import', { method: 'POST', body: text, headers: { 'Content-Type': 'application/json' } })
)
