// server/api/media/sync.post.ts
import { HeadObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3'
import { s3 } from '../../lib/s3'
import { prisma as db } from '../../lib/prisma'
import { requireAdmin } from '../../utils/auth'

type Body = {
  key: string
  mode?: 'upsertDbFromBucket' | 'deleteDb' | 'fixMeta' | 'importExternal'
  targetPrefix?: string // optional: preferred destination folder when importing external URL
}

export default defineEventHandler(async (event) => {
  requireAdmin(event)
  const { key, mode, targetPrefix } = await readBody<Body>(event)
  if (!key) throw createError({ statusCode: 400, statusMessage: 'Missing key' })


  // If mode is "upsertDbFromBucket" but key is external, just import it.
if (mode === 'upsertDbFromBucket' && !isRelativeKey(key)) {
  // rewrite it to importExternal so we don't silently no-op
  (event as any).__forceImport = true
}

  const bucket = useRuntimeConfig().b2Bucket || process.env.B2_BUCKET!
  const m = mode || 'upsertDbFromBucket'

  if (m === 'deleteDb') {
    await db.media.deleteMany({ where: { url: key } })
    return { ok: true, action: 'deleteDb' }
  }

  if (m === 'fixMeta') {
    const rec = await requireMedia(key)
    const prev = (rec.meta as any) || {}
    const hasDir = typeof prev.dir === 'string' && prev.dir.length > 0
    const name = pathNameFromUrl(key)
    const dir  = hasDir ? String(prev.dir) : 'unassigned'
    const nextMeta = { ...prev, name, dir }
    await db.media.update({ where: { id: rec.id }, data: { meta: nextMeta } })
    return { ok: true, action: 'fixMeta', id: rec.id, meta: nextMeta }
  }

//   if (m === 'importExternal') {
if (m === 'importExternal' || (event as any).__forceImport) {
  // Figure out the real original URL we should fetch
  let originalUrl: string
  let rec: { id: number; meta: any }

  if (!isRelativeKey(key)) {
    // Case A: absolute http(s) URL stored as the key
    originalUrl = key
    rec = await requireMedia(originalUrl)
  } else {
    // Case B: relative key, but missing in bucket → need meta.sourceUrl
    rec = await requireMedia(key)
    const prevMeta = (rec.meta as any) || {}
    if (!prevMeta.sourceUrl) {
      throw createError({ statusCode: 400, statusMessage: 'No sourceUrl available to re-import' })
    }
    originalUrl = prevMeta.sourceUrl
  }

  const prevMeta = (rec.meta as any) || {}

  // 1) Download bytes from the original URL
  const resp = await fetch(originalUrl, { redirect: 'follow' })
  if (!resp.ok) {
    throw createError({ statusCode: 502, statusMessage: `Fetch failed: ${resp.status}` })
  }
  const buf = new Uint8Array(await resp.arrayBuffer())
  const headerCT = resp.headers.get('content-type') || undefined

  // 2) Decide destination dir + file name
  const dir = normDir(
    targetPrefix ??
    (typeof prevMeta.dir === 'string' && prevMeta.dir.length > 0 ? String(prevMeta.dir) : 'unassigned')
  )

  // derive safe filename
  const srcNameRaw = pathNameFromUrl(originalUrl)
  const srcNameNorm = normalizeFilename(srcNameRaw)

  // ext: prefer from content-type; else from src name; else fallback
  const extFromCT = mimeToExt(headerCT)
  let ext = lowerExtFromName(srcNameNorm)
  if (!ext && extFromCT) ext = extFromCT
  if (!ext) ext = 'bin'

  const baseWithoutExt = stripExt(srcNameNorm)
  const finalName = `${baseWithoutExt || 'file'}.${ext}`

  // mime: prefer header; else from ext; else octet-stream
  const mime = headerCT || extToMime(ext) || 'application/octet-stream'

  // 3) ensure unique key: dir/finalName
  let candidate = dir ? `${dir}/${finalName}` : finalName
  candidate = await ensureUniqueKey(bucket, candidate)

  // 4) Upload to bucket
  await s3().send(new PutObjectCommand({
    Bucket: bucket,
    Key: candidate,
    Body: buf,
    ContentType: mime,
    ContentLength: buf.byteLength,
  }))

  // 5) Update the same DB row
  const nextMeta = {
    ...prevMeta,
    name: pathNameFromUrl(candidate),
    dir,
    sourceUrl: originalUrl, // keep original source for reference
  }

  const updated = await db.media.update({
    where: { id: rec.id },
    data: {
      url: candidate,
      size: buf.byteLength,
      mime,
      meta: nextMeta,
    },
    select: { id: true, url: true, size: true, mime: true, meta: true },
  })

  return {
    ok: true,
    action: 'importExternal',
    id: updated.id,
    url: updated.url,
    size: updated.size,
    mime: updated.mime,
    meta: updated.meta,
  }
}


  // For external URLs when not using importExternal, just fix meta into unassigned
  if (!isRelativeKey(key)) {
    const rec = await requireMedia(key)
    const prev = (rec.meta as any) || {}
    const hasDir = typeof prev.dir === 'string' && prev.dir.length > 0
    const name = pathNameFromUrl(key)
    const nextMeta = { ...prev, name, dir: hasDir ? String(prev.dir) : 'unassigned', sourceUrl: key }
    await db.media.update({ where: { id: rec.id }, data: { meta: nextMeta } })
    return { ok: true, action: 'fixMeta', id: rec.id, meta: nextMeta }
  }

  // Normal relative case: HEAD and upsert
  const head = await s3().send(new HeadObjectCommand({ Bucket: bucket, Key: key }))
  const size = Number(head.ContentLength || 0)
  const mime = head.ContentType || null
  const name = pathNameFromUrl(key)
  const dir  = pathDir(key)

  const saved = await db.media.upsert({
    where: { url: key },
    update: { size, mime, meta: { name, dir } },
    create: { url: key, size, mime, isPublic: false, meta: { name, dir } },
  })

  return { ok: true, action: 'upsertDbFromBucket', id: saved.id, size: saved.size, mime: saved.mime }
})

/* ---------- helpers ---------- */
async function requireMedia(url: string) {
  const rec = await db.media.findUnique({ where: { url }, select: { id: true, meta: true } })
  if (!rec) throw createError({ statusCode: 404, statusMessage: 'Media not found' })
  return rec
}
function isRelativeKey(u: string) { return !/^https?:\/\//i.test(u) }
function pathDir(key: string) { return key.includes('/') ? key.split('/').slice(0, -1).join('/') : '' }
function pathNameFromUrl(u: string) { const raw = u.split('/').pop() || u; try { return decodeURIComponent(raw) } catch { return raw } }
function normDir(d: string) { return String(d || '').replace(/^\/+|\/+$/g, '') }
function stripExt(name: string) { return name.replace(/\.[^.]+$/, '') }
function normalizeFilename(name: string) {
  const m = name.match(/^(.*?)(\.[^.]+)?$/)
  const base = (m?.[1] ?? '').trim()
  const ext  = (m?.[2] ?? '').toLowerCase()
  const clean = base
    .replace(/\s+/g, '_')
    .replace(/[^\w\-\.]+/g, '')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '')
    .toLowerCase()
  return (clean || 'file') + ext
}
function lowerExtFromName(name: string) { return (name.match(/\.([^.]+)$/)?.[1] || '').toLowerCase() }
function extToMime(ext: string) {
  return ({
    jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp',
    gif: 'image/gif', svg: 'image/svg+xml', avif: 'image/avif',
    heic: 'image/heic', heif: 'image/heif',
    mp4: 'video/mp4', mov: 'video/quicktime', mp3: 'audio/mpeg',
    pdf: 'application/pdf',
    bin: 'application/octet-stream',
  } as Record<string, string | undefined>)[ext]
}
function mimeToExt(mime?: string) {
  const m = (mime || '').toLowerCase().trim()
  const map: Record<string,string> = {
    'image/jpeg': 'jpg', 'image/jpg':'jpg', 'image/png':'png', 'image/webp':'webp', 'image/gif':'gif',
    'image/svg+xml':'svg', 'image/avif':'avif', 'application/pdf':'pdf',
    'video/mp4':'mp4', 'video/quicktime':'mov', 'audio/mpeg':'mp3',
    'image/heic':'heic', 'image/heif':'heif',
  }
  return map[m]
}
async function ensureUniqueKey(bucket: string, key: string) {
  // try HEAD; if exists, append -1, -2, ...
  let attempt = 0
  const base = key.replace(/(\.[^.]+)?$/, '')
  const ext  = key.match(/(\.[^.]+)$/)?.[1] || ''
  while (true) {
    const candidate = attempt === 0 ? key : `${base}-${attempt}${ext}`
    try {
      await s3().send(new HeadObjectCommand({ Bucket: bucket, Key: candidate }))
      attempt += 1 // exists → try next
    } catch (e: any) {
      const status = Number(e?.$metadata?.httpStatusCode || 0)
      if (status === 404) return candidate // available
      throw e // other errors
    }
  }
}
