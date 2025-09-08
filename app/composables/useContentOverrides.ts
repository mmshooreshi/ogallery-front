export function useContentOverrides() {
  function fromLS(collection: string) {
    if (import.meta.server) return []
    try { const raw = localStorage.getItem('admin-content-overrides'); return raw ? (JSON.parse(raw)?.[collection] || []) : [] }
    catch { return [] }
  }
  function merge(base: any[], overrides: any[]) {
    const map = new Map(base.map((b:any) => [b.slug, b]))
    for (const o of overrides) map.set(o.slug, { ...(map.get(o.slug) || {}), ...o })
    return Array.from(map.values())
  }
  return { fromLS, merge }
}
