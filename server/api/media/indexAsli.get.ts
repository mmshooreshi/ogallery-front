// server/api/media/indexAsli.get.ts
import { ListObjectsV2Command } from '@aws-sdk/client-s3'
import { s3 } from '../../lib/s3'
import { prisma as db } from '../../lib/prisma'
import { requireAdmin } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  requireAdmin(event)
  const q = getQuery(event)
  const prefix = String(q.prefix || '').replace(/^\/+|\/+$/g, '')
  const token = q.token ? String(q.token) : undefined
  const limit = Math.min(Number(q.limit || 60), 1000)
  const bucket = useRuntimeConfig().b2Bucket || process.env.B2_BUCKET!

  const objects = await s3().send(new ListObjectsV2Command({
    Bucket: bucket,
    Prefix: prefix ? prefix + '/' : undefined,
    Delimiter: '/',
    ContinuationToken: token,
    MaxKeys: limit,
  }))

  // build list of file keys to bulk-lookup in DB
  const fileKeys = (objects.Contents || [])
    .map(o => String(o.Key || ''))
    .filter(k => k && k.replace(/\/$/, '') !== (prefix || ''))

  const records = await db.media.findMany({
    where: { url: { in: fileKeys } },
    select: { id: true, url: true, isPublic: true, mime: true },
  })
  const recMap = new Map(records.map(r => [r.url, r]))

  const dirs = (objects.CommonPrefixes || []).map(p => ({
    type: 'dir' as const,
    name: (p.Prefix || '').replace(prefix ? prefix + '/' : '', '').replace(/\/$/, ''),
    prefix: (p.Prefix || '').replace(/\/$/, ''),
  }))

  const files = (objects.Contents || [])
    .filter(o => (o.Key || '').replace(/\/$/, '') !== (prefix || ''))
    .map(o => {
      const key = String(o.Key)
      const name = key.split('/').pop() || key
      const dir = key.includes('/') ? key.split('/').slice(0, -1).join('/') : ''
      const rec = recMap.get(key)
      return {
        type: 'file' as const,
        key, name, dir,
        size: Number(o.Size || 0),
        lastModified: o.LastModified,
        isPublic: rec?.isPublic || false,
        mime: rec?.mime || undefined,
        id: rec?.id || null,
      }
    })

  return {
    prefix,
    nextToken: objects.IsTruncated ? objects.NextContinuationToken : null,
    items: [...dirs, ...files],
  }
})
