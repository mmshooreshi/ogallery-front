// server/lib/s3x.ts
import {
  ListObjectsV2Command, CopyObjectCommand, DeleteObjectCommand, DeleteObjectsCommand, _Object,
} from '@aws-sdk/client-s3'
import { s3, b2Bucket } from './s3'

export function normalizePrefix(p: string) {
  const x = (p || '').replace(/^\/+|\/+$/g, '')
  return x
}
export function dirKey(prefix: string) {
  // zero-byte "keep" object so empty folders exist
  const p = normalizePrefix(prefix)
  return p ? `${p}/.keep` : '.keep'
}

export async function listAllKeys(prefix: string) {
  const Prefix = normalizePrefix(prefix)
  const out: _Object[] = []
  let token: string | undefined
  do {
    const res = await s3().send(new ListObjectsV2Command({
      Bucket: b2Bucket(),
      Prefix: Prefix ? `${Prefix}/` : undefined,
      ContinuationToken: token,
    }))
    out.push(...(res.Contents || []))
    token = res.IsTruncated ? res.NextContinuationToken : undefined
  } while (token)
  return out.filter(o => o.Key && !o.Key.endsWith('/')) as Required<_Object>[]
}

export async function putFolderPlaceholder(prefix: string) {
  // we just copy an empty body via fetch Request; nitro handles it
  const { PutObjectCommand } = await import('@aws-sdk/client-s3')
  await s3().send(new PutObjectCommand({
    Bucket: b2Bucket(),
    Key: dirKey(prefix),
    Body: new Uint8Array(),
    ContentType: 'application/x-empty',
  }))
}

export async function copyPrefix(fromPrefix: string, toPrefix: string) {
  const from = normalizePrefix(fromPrefix)
  const to = normalizePrefix(toPrefix)
  if (!from || !to) throw new Error('Missing from/to prefix')
  const keys = await listAllKeys(from)

  for (const o of keys) {
    const oldKey = o.Key!
    const newKey = oldKey.replace(new RegExp(`^${from}/`), to + '/')
    await s3().send(new CopyObjectCommand({
      Bucket: b2Bucket(),
      CopySource: `/${b2Bucket()}/${oldKey}`,
      Key: newKey,
    }))
  }
}

export async function deletePrefix(prefix: string) {
  const dir = normalizePrefix(prefix)
  const keys = await listAllKeys(dir)
  if (keys.length === 0) return

  // delete in chunks of 1000
  const chunks = chunk(keys.map(k => ({ Key: k.Key! })), 1000)
  for (const Objects of chunks) {
    await s3().send(new DeleteObjectsCommand({ Bucket: b2Bucket(), Delete: { Objects } }))
  }
  // remove placeholder if exists
  try {
    await s3().send(new DeleteObjectCommand({ Bucket: b2Bucket(), Key: dirKey(dir) }))
  } catch {}
}

function chunk<T>(arr: T[], n: number) {
  const out: T[][] = []
  for (let i = 0; i < arr.length; i += n) out.push(arr.slice(i, i + n))
  return out
}
