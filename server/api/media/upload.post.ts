// server/api/media/upload.post.ts
import { PutObjectCommand } from '@aws-sdk/client-s3'
import { s3, b2Bucket } from '../../lib/s3'
import { prisma as db } from '../../lib/prisma'
import { requireAdmin } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  requireAdmin(event)
  const form = await readMultipartFormData(event)
  if (!form) throw createError({ statusCode: 400, statusMessage: 'No form' })

  const dir = (form.find(f => f.name === 'dir')?.data?.toString() || '').replace(/^\/+|\/+$/g, '')
  const isPublic = (form.find(f => f.name === 'isPublic')?.data?.toString() || '') === 'true'
  const file = form.find(f => f.name === 'file' && f.filename)
  if (!file?.filename || !file.type || !file.data) throw createError({ statusCode: 400, statusMessage: 'Invalid file' })

  const key = dir ? `${dir}/${file.filename}` : file.filename

  await s3().send(new PutObjectCommand({
    Bucket: b2Bucket(),
    Key: key,
    Body: file.data,
    ContentType: file.type,
  }))

  // Upsert DB record: url = key; store name/dir in meta
  await db.media.upsert({
    where: { url: key },
    update: { mime: file.type, size: file.data.length, isPublic, meta: { name: file.filename, dir } },
    create: { url: key, mime: file.type, size: file.data.length, isPublic, meta: { name: file.filename, dir } },
  })

  return { ok: true, key }
})
