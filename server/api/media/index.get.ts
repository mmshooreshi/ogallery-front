// server/api/media/index.get.ts
import { ListObjectsV2Command } from '@aws-sdk/client-s3'
import { s3 } from '../../lib/s3'
import { prisma as db } from '../../lib/prisma'
import { requireAdmin } from '../../utils/auth'
import { normalizePath } from '../../utils/paths'

type DirItem = { type:'dir'; name:string; prefix:string }
type FileItem = {
  type: 'file'
  key: string; name: string; dir: string
  size?: number; lastModified?: Date
  isPublic: boolean; mime?: string; id: number | null
  source: 'bucket' | 'db' | 'both'
  preview?: string
  sync?: {
    needsSync: boolean
    reasons: Array<'missingInDb' | 'missingInBucket' | 'sizeMismatch' | 'missingMetaDir' | 'dirMismatch' | 'externalNotInBucket'>
    suggestedAction?: 'upsertDbFromBucket'|'deleteDb'|'fixMeta'
  }
  caps?: { move:boolean; delete:boolean; togglePublic:boolean }
  relations?: any
}

export default defineEventHandler(async (event) => {
  requireAdmin(event)
  const q = getQuery(event)
//   const prefix = String(q.prefix || '').replace(/^\/+|\/+$/g, '')

  const prefix = normalizePath(String(q.prefix || ''))

  const token  = q.token ? String(q.token) : undefined
  const limit  = Math.min(Number(q.limit || 60), 1000)
  const withRelations = q.withRelations === '1' || q.full === '1'
  const bucket = useRuntimeConfig().b2Bucket || process.env.B2_BUCKET!

  // 1) S3 listing for real folders
  const objects = await s3().send(new ListObjectsV2Command({
    Bucket: bucket,
    Prefix: prefix && prefix !== 'unassigned' ? prefix + '/' : undefined, // virtual folder doesn't touch S3
    Delimiter: '/',
    ContinuationToken: token,
    MaxKeys: limit,
  }))

const dirs: DirItem[] = (objects.CommonPrefixes || []).map((p) => {
  const raw = (p.Prefix || '').replace(/\/$/, '')
  return {
    type: 'dir',
    name: pathName(raw),
    prefix: normalizePath(raw),
  }
})



  const bucketFiles = (objects.Contents || [])
    .filter(o => (o.Key || '').replace(/\/$/, '') !== (prefix || ''))
    .map((o) => {
      const key = String(o.Key)
      return {
        key,
        name: pathName(key),
        dir: pathDir(key),
        size: Number(o.Size || 0),
        lastModified: o.LastModified as Date | undefined,
      }
    })
  const bucketMap = new Map(bucketFiles.map(b => [b.key, b]))

  // 2) DB rows → determine which belong to this "folder"
  const dbRows = await db.media.findMany({
    select: { id: true, url: true, size: true, mime: true, isPublic: true, meta: true },
  })


const dbDirs = Array.from(new Set(
  dbRows
    .map(r => {
      const md = (r.meta as any) || {}
      if (typeof md.dir === 'string' && md.dir.length > 0 && md.dir !== 'unassigned') {
      // ignore bogus dirs starting with http/https
      if (/^https?:/i.test(md.dir)) return null
    //   return md.dir
      return normalizePath(md.dir)

      }
      return null

    })
    .filter(Boolean)
    .map(d => {
      const parts = (d as string).split('/')
      if (!prefix) return parts[0] // root: only top-level
      if ((d as string).startsWith(prefix + '/')) {
        // return parts[prefix.split('/').length] // next segment
        return parts[normalizePath(prefix).split('/').length] // next segment

      }
      return null
    })
    .filter(Boolean) as string[]
)).map(name => ({
  type: 'dir',
  name,
  prefix: prefix ? `${prefix}/${name}` : name
}))


    for (const d of dbDirs) {
    if (!dirs.find(x => x.prefix === d.prefix)) {
        dirs.push(d)
    }
    }

    // After you push dbDirs into dirs
const seenDirs = new Map<string, DirItem>()

for (const d of dirs) {
  const norm = d.name.toLowerCase().replace(/[_\s]+/g, '') // merge key
  if (!seenDirs.has(norm)) {
    seenDirs.set(norm, d)
  } else {
    // merge: prefer nicer looking name (e.g. DB with spaces)
    const existing = seenDirs.get(norm)!
    if (/[A-Z\s]/.test(d.name) && !/[A-Z\s]/.test(existing.name)) {
      seenDirs.set(norm, d)
    }
  }
}

const mergedDirs = Array.from(seenDirs.values())


  // virtual unassigned logic
  const needUnassignedDir = dbRows.some(r => {
    const md = (r.meta as any) || {}
    return !(typeof md.dir === 'string' && md.dir.length > 0) || md.dir === 'unassigned'
  })
  if (!prefix && needUnassignedDir && !dirs.find(d => d.prefix === 'unassigned')) {
    dirs.unshift({ type:'dir', name:'unassigned', prefix:'unassigned' })
  }

const dbDirect = dbRows.filter((r) => {
  const md = (r.meta as any) || {}
 const dirVal = typeof md.dir === 'string' && md.dir.length > 0
   ? normalizePath(md.dir)
   : 'unassigned'

 if (!prefix) return false // don’t return files at root, only dirs
 return normalizePath(prefix) === dirVal
})


  // include also db rows whose url is a relative child of this prefix (safety)
  const dbDirectPlus = [
    ...dbDirect,
    ...dbRows.filter(r =>
      prefix && isRelativeKey(r.url) && pathDir(r.url) === prefix &&
      !dbDirect.some(x => x.id === r.id)
    )
  ]

  const dbByUrlMap = new Map(dbRows.map(r => [r.url, r]))

  // 3) merge keys visible on this page
    const allKeys = new Set<string>([
    ...bucketFiles.map(b => b.key),
    ...dbDirectPlus.map(r => {
        // only use url if relative, otherwise fake a key = meta.name
        if (!isRelativeKey(r.url)) {
        // push a fake key that doesn’t break dirs
        return `external:${r.id}`
        }

        return isRelativeKey(r.url)
        ? r.url
        : (r.meta as any)?.name || r.url  // fallback: name for display
    }),
    ])


  // (optional) relations not included here for brevity, add if needed

  // Instead of just a Set of strings, build an array of {key, dbRow}
const allItems = [
  ...bucketFiles.map(b => ({ key: b.key, dbRow: null })),
  ...dbDirectPlus.map(r => {
    if (!isRelativeKey(r.url)) {
      return { key: `external:${r.id}`, dbRow: r }
    }
    return { key: r.url, dbRow: r }
  }),
]

// dedupe by key
const seen = new Set<string>()
const merged = allItems.filter(i => {
  if (seen.has(i.key)) return false
  seen.add(i.key)
  return true
})

  // 4) build file items with diff flags
const files: FileItem[] = merged.map(({ key, dbRow }) => {
  const b = bucketMap.get(key) || null
  const d = dbRow || dbByUrlMap.get(key) || null

  const reasons: FileItem['sync']['reasons'] = []

  const isExternal = key.startsWith('external:')

  if (b && !d) reasons.push('missingInDb')
  if (!b && d) {
    if (isExternal) reasons.push('externalNotInBucket')
    else reasons.push('missingInBucket')
  }

  const md = (d?.meta as any) || {}
  const hasDir = typeof md.dir === 'string' && md.dir.length > 0
//   const dirVal = hasDir ? String(md.dir) : 'unassigned'
  const dirVal = hasDir ? normalizePath(String(md.dir)) : 'unassigned'

  if (!hasDir) reasons.push('missingMetaDir')
  if (prefix && prefix !== 'unassigned' && hasDir && dirVal !== prefix) reasons.push('dirMismatch')

  if (b && d && d.size != null && b.size != null && d.size !== b.size) reasons.push('sizeMismatch')

  if (d && isExternal) reasons.push('externalNotInBucket')

  let suggestedAction: FileItem['sync']['suggestedAction'] | undefined
  if (reasons.includes('missingInDb') || reasons.includes('sizeMismatch')) {
    suggestedAction = 'upsertDbFromBucket'
  } else if (reasons.includes('missingInBucket')) {
    suggestedAction = isExternal ? 'importExternal' : 'deleteDb'
  } else if (reasons.includes('externalNotInBucket')) {
    suggestedAction = 'importExternal'
  } else if (reasons.includes('missingMetaDir') || reasons.includes('dirMismatch')) {
    suggestedAction = 'fixMeta'
  }

  const preview = isExternal ? (md.thumb || d?.url) : undefined
  const name = md.name || b?.name || safeDecode(pathName(key))
  const dir  = hasDir ? dirVal : (b?.dir ?? (isExternal ? 'unassigned' : pathDir(key)))

  return {
    type: 'file',
    key,
    name,
    dir,
    size: b?.size ?? d?.size ?? undefined,
    lastModified: b?.lastModified,
    isPublic: d?.isPublic ?? false,
    mime: d?.mime ?? undefined,
    id: d?.id ?? null,
    source: b && d ? 'both' : b ? 'bucket' : 'db',
    preview,
    sync: { needsSync: reasons.length > 0, reasons, suggestedAction },
    caps: { move: !isExternal, delete: !isExternal, togglePublic: !isExternal },
  }
})


  files.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }))

  return {
    prefix,
    nextToken: (prefix && prefix !== 'unassigned') && objects.IsTruncated ? objects.NextContinuationToken : null,
    items: [...mergedDirs, ...files],
  }
})

function pathName(key: string) { return key.split('/').pop() || key }
function safeDecode(s: string) { try { return decodeURIComponent(s) } catch { return s } }
function pathDir(key: string) { return key.includes('/') ? key.split('/').slice(0, -1).join('/') : '' }
function isRelativeKey(u: string) { return !/^https?:\/\//i.test(u) }
