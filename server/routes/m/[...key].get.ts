// server/routes/m/[...key].get.ts
import { GetObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { s3 } from '../../lib/s3'
import { prisma as db } from '../../lib/prisma'

export default defineEventHandler(async (event) => {
  const params = getRouterParams(event) as any
  const key = Array.isArray(params.key) ? params.key.join('/') : String(params.key || '')
  if (!key) throw createError({ statusCode: 400, statusMessage: 'Missing key' })

  // 🔹 External media proxy
  if (key.startsWith('external:')) {
    const id = parseInt(key.split(':')[1], 10)
    if (isNaN(id)) throw createError({ statusCode: 400, statusMessage: 'Invalid external key' })

    const rec = await db.media.findUnique({ where: { id } })
    if (!rec?.isPublic) throw createError({ statusCode: 401, statusMessage: 'Private' })
    if (!rec.url) throw createError({ statusCode: 404, statusMessage: 'Missing external URL' })

    // Fetch the remote file server-side
    const res = await fetch(rec.url)
    if (!res.ok) throw createError({ statusCode: res.status, statusMessage: `Fetch failed: ${res.statusText}` })

    // Stream response to client
    const contentType = res.headers.get('content-type') || 'application/octet-stream'
    setHeader(event, 'Content-Type', contentType)

    // Optionally forward cache headers
    const cacheControl = res.headers.get('cache-control')
    if (cacheControl) setHeader(event, 'Cache-Control', cacheControl)

    return sendStream(event, res.body!)
  }

  // 🔹 Normal S3 case
  const rec = await db.media.findUnique({ where: { url: key } })
  if (!rec?.isPublic) throw createError({ statusCode: 401, statusMessage: 'Private' })

  const cfg = useRuntimeConfig()
  const bucket = cfg.b2Bucket || process.env.B2_BUCKET!

  // Stream directly from S3
  const command = new GetObjectCommand({ Bucket: bucket, Key: key })
  const data = await s3().send(command)

  setHeader(event, 'Content-Type', data.ContentType || 'application/octet-stream')
  return sendStream(event, data.Body as any)
})
