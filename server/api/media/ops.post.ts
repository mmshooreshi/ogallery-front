// server/api/media/ops.post.ts
import {
  ListObjectsV2Command, CopyObjectCommand, DeleteObjectCommand, DeleteObjectsCommand, PutObjectCommand,
} from '@aws-sdk/client-s3'
import { s3 } from '../../lib/s3'
import { prisma as db } from '../../lib/prisma'
import { requireAdmin } from '../../utils/auth'
import { normalizePath } from '../../utils/paths'

const bucket = () => useRuntimeConfig().b2Bucket || process.env.B2_BUCKET!

export default defineEventHandler(async (event) => {
  requireAdmin(event)
  const body = await readBody<any>(event)
  const act = String(body?.action || '')

  if (!act) throw createError({ statusCode: 400, statusMessage: 'Missing action' })

  switch (act) {
    case 'folder.create': {
      const prefix = normalizePath(body?.prefix)
      if (!prefix) throw createError({ statusCode: 400, statusMessage: 'Missing prefix' })
      await putEmpty(`${prefix}/.keep`)
      return { ok: true }
    }

    case 'folder.rename':
    case 'folder.move': {
      const from = normalizePath(body?.from), to = normalizePath(body?.to)
      if (!from || !to) throw createError({ statusCode: 400, statusMessage: 'Missing from/to' })

      // S3 copy+delete
      await copyPrefix(from, to)
      await deletePrefix(from)

      // DB: relative keys (url startsWith from/) → update url, meta.name, meta.dir
      const relRows = await db.media.findMany({
        where: { url: { startsWith: `${from}/` } },
        select: { id: true, url: true, meta: true },
      })
      const tx1 = relRows.map((m) => {
        const newUrl = m.url.replace(new RegExp(`^${escapeReg(from)}/`), `${to}/`)
        const nextMeta = { ...(m.meta as any || {}), name: pathName(newUrl), dir: pathDir(newUrl) }
        return db.media.update({ where: { id: m.id }, data: { url: newUrl, meta: nextMeta } })
      })

      // DB: external rows filed under folder (meta.dir === from) → just retag to "to"
      const extRows = await db.media.findMany({
        where: { AND: [{ url: { not: { startsWith: `${from}/` } } }, { meta: { path: ['dir'], equals: from } }] },
        select: { id: true, meta: true },
      })
      const tx2 = extRows.map((m) => {
        const nextMeta = { ...(m.meta as any || {}), dir: to }
        return db.media.update({ where: { id: m.id }, data: { meta: nextMeta } })
      })

      if (tx1.length || tx2.length) await db.$transaction([...tx1, ...tx2])
      return { ok: true, moved: tx1.length + tx2.length }
    }

    case 'folder.delete': {
      const prefix = normalizePath(body?.prefix)
      if (!prefix) throw createError({ statusCode: 400, statusMessage: 'Missing prefix' })

      // S3 delete
      await deletePrefix(prefix)

      // DB: delete relative rows physically under this prefix
      const delRel = db.media.deleteMany({ where: { url: { startsWith: `${prefix}/` } } })

      // DB: external rows assigned to this folder → send to "unassigned"
      const ext = await db.media.findMany({
        where: { AND: [{ url: { not: { startsWith: `${prefix}/` } } }, { meta: { path: ['dir'], equals: prefix } }] },
        select: { id: true, meta: true },
      })
      const tx = ext.map((m) => {
        const nextMeta = { ...(m.meta as any || {}), dir: 'unassigned' }
        return db.media.update({ where: { id: m.id }, data: { meta: nextMeta } })
      })

      await db.$transaction([delRel, ...tx])
      return { ok: true }
    }

    case 'file.move': {
      const from = normalizePath(body?.from), to = normalizePath(body?.to)
      if (!from || !to) throw createError({ statusCode: 400, statusMessage: 'Missing from/to' })

      await s3().send(new CopyObjectCommand({ Bucket: bucket(), CopySource: `/${bucket()}/${from}`, Key: to }))
      await s3().send(new DeleteObjectCommand({ Bucket: bucket(), Key: from }))

      // DB: update single row if it exists
      const row = await db.media.findUnique({ where: { url: from }, select: { id: true, meta: true } })
      if (row) {
        const nextMeta = { ...(row.meta as any || {}), name: pathName(to), dir: pathDir(to) }
        await db.media.update({ where: { id: row.id }, data: { url: to, meta: nextMeta } })
      }

      return { ok: true }
    }

    case 'file.delete': {
      const key = normalizePath(body?.key)
      if (!key) throw createError({ statusCode: 400, statusMessage: 'Missing key' })

      await s3().send(new DeleteObjectCommand({ Bucket: bucket(), Key: key }))
      await db.media.deleteMany({ where: { url: key } })
      return { ok: true }
    }

case 'file.togglePublic': {
  const key = String(body?.key || '')
  const isPublic = !!body?.isPublic
  if (!key) throw createError({ statusCode: 400, statusMessage: 'Missing key' })

  if (key.startsWith('external:')) {
    // Special case: update by ID
    const id = parseInt(key.split(':')[1], 10)
    if (isNaN(id)) throw createError({ statusCode: 400, statusMessage: 'Invalid external key' })

    const up = await db.media.update({
      where: { id },
      data: { isPublic },
    })
    return { ok: true, isPublic: up.isPublic }
  }

  // Normal bucket-backed file
  const normKey = normalizePath(key)
  const name = pathName(normKey)
  const dir = pathDir(normKey)
  const up = await db.media.upsert({
    where: { url: normKey },
    update: { isPublic, meta: { name, dir } },
    create: { url: normKey, isPublic, meta: { name, dir } },
  })
  return { ok: true, isPublic: up.isPublic }
}

case 'file.finalize': {
  const key = String(body?.key || '')
  if (key.startsWith('external:')) {
    throw createError({ statusCode: 400, statusMessage: 'External files cannot be finalized' })
  }

  const normKey = normalizePath(key)
  const size = Number(body?.size || 0)
  const mime = String(body?.mime || '')

  const name = pathName(normKey)
  const dir = pathDir(normKey)

  await db.media.upsert({
    where: { url: normKey },
    update: { meta: { name, dir }, size, mime },
    create: { url: normKey, meta: { name, dir }, size, mime, isPublic: false },
  })
  return { ok: true }
}

    default:
      throw createError({ statusCode: 400, statusMessage: 'Unknown action' })
  }
})

/* ---------- helpers ---------- */
// function normalizePath(p: string) { return (p || '').replace(/^\/+|\/+$/g, '') }
// function normalizePath(p: string) { return String(p || '').replace(/^\/+/, '') }
function pathName(key: string) { return key.split('/').pop() || key }
function pathDir(key: string) { return key.includes('/') ? key.split('/').slice(0, -1).join('/') : '' }
function escapeReg(s: string) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') }

async function putEmpty(key: string) {
  await s3().send(new PutObjectCommand({ Bucket: bucket(), Key: key, Body: new Uint8Array(), ContentType: 'application/x-empty' }))
}
async function listAll(prefix: string) {
  const Prefix = normalizePath(prefix)
  const out: string[] = []
  let token: string | undefined
  do {
    const res = await s3().send(new ListObjectsV2Command({ Bucket: bucket(), Prefix: Prefix ? `${Prefix}/` : undefined, ContinuationToken: token }))
    for (const o of res.Contents || []) if (o.Key && !o.Key.endsWith('/')) out.push(o.Key)
    token = res.IsTruncated ? res.NextContinuationToken : undefined
  } while (token)
  return out
}
async function copyPrefix(from: string, to: string) {
  const keys = await listAll(from)
  for (const k of keys) {
    const newKey = k.replace(new RegExp(`^${escapeReg(from)}/`), `${to}/`)
    await s3().send(new CopyObjectCommand({ Bucket: bucket(), CopySource: `/${bucket()}/${k}`, Key: newKey }))
  }
  await putEmpty(`${to}/.keep`)
}
async function deletePrefix(prefix: string) {
  const keys = await listAll(prefix)
  for (let i = 0; i < keys.length; i += 1000) {
    const Objects = keys.slice(i, i + 1000).map(Key => ({ Key }))
    await s3().send(new DeleteObjectsCommand({ Bucket: bucket(), Delete: { Objects } }))
  }
  try { await s3().send(new DeleteObjectCommand({ Bucket: bucket(), Key: `${normalizePath(prefix)}/.keep` })) } catch {}
}
