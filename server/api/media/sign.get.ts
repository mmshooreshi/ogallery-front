// server/api/media/sign.get.ts
import { GetObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { s3 } from '../../lib/s3'
import { prisma as db } from '../../lib/prisma'
import { requireAdmin } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  const key = String(getQuery(event).key || '')
  const mode = String(getQuery(event).mode || '') // "json" to get JSON instead of redirect
  if (!key) throw createError({ statusCode: 400, statusMessage: 'Missing key' })

  const rec = await db.media.findUnique({ where: { url: key } })
  // if not public, require admin cookie
  if (!rec?.isPublic) requireAdmin(event)

  const cfg = useRuntimeConfig()
  const bucket = cfg.b2Bucket || process.env.B2_BUCKET!
  const expiresIn = Number(cfg.mediaSignTtl || 900)
  const url = await getSignedUrl(s3(), new GetObjectCommand({ Bucket: bucket, Key: key }), { expiresIn })

  // Small, private cache since these are short-lived
  setHeader(event, 'Cache-Control', 'private, max-age=30')

  if (mode === 'json') {
    return { url, expiresIn }
  }

  return sendRedirect(event, url, 302)
})
