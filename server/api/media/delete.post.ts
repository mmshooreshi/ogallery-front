// server/api/media/delete.post.ts
import { DeleteObjectCommand } from '@aws-sdk/client-s3'
import { s3, b2Bucket } from '../../lib/s3'
import { prisma as db } from '../../lib/prisma'
import { requireAdmin } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  requireAdmin(event)
  const body = await readBody<{ key: string }>(event)
  if (!body?.key) throw createError({ statusCode: 400, statusMessage: 'Missing key' })

  await s3().send(new DeleteObjectCommand({ Bucket: b2Bucket(), Key: body.key }))
  await db.media.deleteMany({ where: { url: body.key } })

  return { ok: true }
})
