// server/api/admin/[collection].put.ts
import { ensureColl, pathFor, toFileContents } from '../../utils/adminMap'

export default defineEventHandler(async (event) => {
  const coll = ensureColl(getRouterParams(event).collection!)
  const body = await readBody<any>(event)
  const slug = String(body?.slug || '').trim()
  if (!slug) throw createError({ statusCode: 400, statusMessage: 'Invalid slug' })
  if (coll === 'exhibitions' && typeof body.artists === 'string') {
    body.artists = body.artists.split(',').map((s: string) => s.trim()).filter(Boolean)
  }
  const storage = useStorage('content')
  await storage.setItem(pathFor(coll, slug), toFileContents(coll, body))
  return body
})
