// server/api/media/move.post.ts
import { CopyObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'
import { s3, b2Bucket } from '../../lib/s3'
import { prisma as db } from '../../lib/prisma'
import { requireAdmin } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  requireAdmin(event)
  const body = await readBody<{ from: string; to: string }>(event)
  if (!body?.from || !body?.to) throw createError({ statusCode: 400, statusMessage: 'Missing from/to' })

  await s3().send(new CopyObjectCommand({
    Bucket: b2Bucket(),
    CopySource: `/${b2Bucket()}/${body.from}`,
    Key: body.to,
  }))
  await s3().send(new DeleteObjectCommand({ Bucket: b2Bucket(), Key: body.from }))

  const name = body.to.split('/').pop() || body.to
  const dir = body.to.includes('/') ? body.to.split('/').slice(0, -1).join('/') : ''

  // Update DB: url = key; store name/dir in meta
  await db.media.updateMany({
    where: { url: body.from },
    data: { url: body.to, meta: { name, dir } },
  })

  return { ok: true }
})
