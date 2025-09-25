// server/api/media/fix.post.ts
import { PutObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3'
import { s3 } from '../../lib/s3'
import { prisma as db } from '../../lib/prisma'
import { requireAdmin } from '../../utils/auth'

type Body = {
  action: 'uploadToBucket' | 'updateMeta' | 'updateDb'
  key: string
}

export default defineEventHandler(async (event) => {
  requireAdmin(event)

  const { action, key } = await readBody<Body>(event)
  if (!action || !key) {
    throw createError({ statusCode: 400, statusMessage: 'Missing fields' })
  }

  const bucket = useRuntimeConfig().b2Bucket || process.env.B2_BUCKET!

  /* -------- 1. Upload to bucket -------- */
  if (action === 'uploadToBucket') {
    const rec = await db.media.findUnique({ where: { url: key } })
    if (!rec) {
      throw createError({ statusCode: 404, statusMessage: 'Media not found in DB' })
    }

    const originalUrl = rec.url
    const resp = await fetch(originalUrl)
    if (!resp.ok) {
      throw createError({ statusCode: 502, statusMessage: `Fetch failed: ${resp.status}` })
    }

    const buf = new Uint8Array(await resp.arrayBuffer())
    const ct = resp.headers.get('content-type') || 'application/octet-stream'

    // derive safe name and dir
    const name = pathNameFromUrl(originalUrl)
    const dir = pathDir(originalUrl) || 'unassigned'
    const candidate = await ensureUniqueKey(bucket, dir ? `${dir}/${name}` : name)

    // upload to bucket
    await s3().send(new PutObjectCommand({
      Bucket: bucket,
      Key: candidate,
      Body: buf,
      ContentType: ct,
      ContentLength: buf.byteLength,
    }))

    // update DB record
    const updated = await db.media.update({
      where: { id: rec.id },
      data: {
        url: candidate,
        size: buf.byteLength,
        mime: ct,
        meta: {
          ...(rec.meta as any),
          name,
          dir,
          sourceUrl: originalUrl, // keep original
        },
      },
    })

    return { ok: true, action, id: updated.id, url: updated.url }
  }

  /* -------- 2. Update meta -------- */
  if (action === 'updateMeta') {
    const rec = await db.media.findUnique({ where: { url: key } })
    if (!rec) {
      throw createError({ statusCode: 404, statusMessage: 'Media not found in DB' })
    }

    const name = pathNameFromUrl(rec.url)
    const dir = pathDir(rec.url) || 'unassigned'
    const nextMeta = { ...(rec.meta as any), name, dir }

    const updated = await db.media.update({
      where: { id: rec.id },
      data: { meta: nextMeta },
    })

    return { ok: true, action, id: updated.id, meta: updated.meta }
  }

  /* -------- 3. Update DB -------- */
  if (action === 'updateDb') {
    const head = await s3().send(new HeadObjectCommand({ Bucket: bucket, Key: key }))
    const size = Number(head.ContentLength || 0)
    const mime = head.ContentType || 'application/octet-stream'
    const name = pathNameFromUrl(key)
    const dir = pathDir(key)

    const saved = await db.media.upsert({
      where: { url: key },
      update: { size, mime, meta: { name, dir } },
      create: { url: key, size, mime, isPublic: false, meta: { name, dir } },
    })

    return { ok: true, action, id: saved.id, url: saved.url }
  }

  throw createError({ statusCode: 400, statusMessage: `Unknown action: ${action}` })
})

/* ------------ helpers ------------ */
function pathNameFromUrl(u: string) {
  return u.split('/').pop() || u
}

function pathDir(key: string) {
  return key.includes('/') ? key.split('/').slice(0, -1).join('/') : ''
}

async function ensureUniqueKey(bucket: string, key: string) {
  // TODO: check for collisions; for now, just return as-is
  return key
}
