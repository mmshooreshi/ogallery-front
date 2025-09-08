// server/api/admin/import.post.ts
import { ensureColl, pathFor, toFileContents } from '../../utils/adminMap'

export default defineEventHandler(async (event) => {
  const data = await readBody<any>(event)
  if (!data || typeof data !== 'object') throw createError({ statusCode: 400, statusMessage: 'Invalid JSON' })
  const storage = useStorage('content')
  for (const [collection, items] of Object.entries(data)) {
    const coll = ensureColl(collection)
    for (const item of items as any[]) {
      await storage.setItem(pathFor(coll, String(item.slug)), toFileContents(coll, item))
    }
  }
  return { ok: true }
})
