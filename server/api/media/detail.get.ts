import { HeadObjectCommand } from '@aws-sdk/client-s3'
import { s3 } from '../../lib/s3'
import { prisma as db } from '../../lib/prisma'
import { requireAdmin } from '../../utils/auth'
import { normalizePath } from '~~/server/utils/paths'

function toBucketKey(key:string){
  if(/^https?:\/\//i.test(key)){
    const u = new URL(key)
    return u.pathname.replace(/^\/+/, '').replace(/^files\//, '')
  }
  return key
}

export default defineEventHandler(async (event) => {
  requireAdmin(event)
  const q = getQuery(event)
//   const key = String(q.key || '')
  const key = normalizePath(String(q.key || ''))

  let row = null
  let bucket:any = null

if (key.startsWith('external:')) {
  const id = parseInt(key.split(':')[1], 10)
  if (!isNaN(id)) {
    row = await db.media.findUnique({ where: { id } })
  }
  return { db: row, bucket: { note: 'External URL (not stored in bucket)',  url: row?.url || null } } // ⬅ stop here
  
}
 else {
    // Normal case (same as before)
    const base = 'https://ogallery.net/files/'
    // const fullUrl = key.startsWith('http') ? key : base + key
    row = await db.media.findFirst({
    where: {
        OR: [
        { url: key },                              // relative key
        { url: base + key }, // absolute URL
        ]
    }
    })


    const bucketKey = toBucketKey(key)
    try {
      const res = await s3().send(new HeadObjectCommand({
        Bucket: useRuntimeConfig().b2Bucket!,
        Key: bucketKey,
      }))
      bucket = {
        key: bucketKey,
        size: res.ContentLength,
        mime: res.ContentType,
        lastModified: res.LastModified,
        metadata: res.Metadata,
      }
    } catch (e:any) {
      bucket = { error: e.message, key: bucketKey }
    }
  }

  return { db: row, bucket }
})
