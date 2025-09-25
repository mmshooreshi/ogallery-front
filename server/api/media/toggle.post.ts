// server/api/media/toggle.post.ts
import { prisma as db } from '../../lib/prisma'
import { requireAdmin } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  requireAdmin(event)
  const body = await readBody<{ key: string; isPublic: boolean }>(event)
  if (!body?.key) throw createError({ statusCode: 400, statusMessage: 'Missing key' })

  const rec = await db.media.upsert({
    where: { url: body.key },
    update: { isPublic: !!body.isPublic },
    create: {
      url: body.key,
      isPublic: !!body.isPublic,
      meta: {
        name: body.key.split('/').pop() || body.key,
        dir: body.key.split('/').slice(0, -1).join('/'),
      },
    },
  })
  return { ok: true, isPublic: rec.isPublic }
})
