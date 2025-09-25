// server/routes/m/redirect/[...key].get.ts
import { GetObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { s3 } from '~~/server/lib/s3'
import { prisma as db } from '~~/server/lib/prisma'

export default defineEventHandler(async (event) => {
  const params = getRouterParams(event) as any
  const key = Array.isArray(params.key) ? params.key.join('/') : String(params.key || '')
  console.log("salammmmm")
  if (!key) throw createError({ statusCode: 400, statusMessage: 'Missing key' })

  // External media handling
  if (key.startsWith('external:')) {
    const id = parseInt(key.split(':')[1], 10)
    if (isNaN(id)) throw createError({ statusCode: 400, statusMessage: 'Invalid external key' })

    const rec = await db.media.findUnique({ where: { id } })
    if (!rec?.isPublic) throw createError({ statusCode: 401, statusMessage: 'Private' })

    // Redirect straight to the external URL
    return sendRedirect(event, rec.url, 302)
  }

  // Normal S3 case
  const rec = await db.media.findUnique({ where: { url: key } })
  if (!rec?.isPublic) throw createError({ statusCode: 401, statusMessage: 'Private' })

  const cfg = useRuntimeConfig()
  const bucket = cfg.b2Bucket || process.env.B2_BUCKET!
  const url = await getSignedUrl(
    s3(),
    new GetObjectCommand({ Bucket: bucket, Key: key }),
    { expiresIn: Number(cfg.mediaSignTtl || 900) }
  )

  return sendRedirect(event, url, 302)
})
