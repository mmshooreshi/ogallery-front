// server/api/admin/[collection]/[slug].delete.ts
import { ensureColl, pathFor } from '../../../utils/adminMap'

export default defineEventHandler(async (event) => {
  const { collection, slug } = getRouterParams(event) as any
  const storage = useStorage('content')
  await storage.removeItem(pathFor(ensureColl(collection), String(slug)))
  return { ok: true }
})
