// server/api/media/upload-sign.post.ts
// Returns per-file POST targets for Backblaze B2 *native* uploads
// Reads all secrets/config from useRuntimeConfig(), not process.env

import { requireAdmin } from '../../utils/auth'

type UploadReq = { files: Array<{ key: string; mime: string }> }

const b64 = (s: string) => Buffer.from(s).toString('base64')

async function b2AuthorizeAccount(keyId: string, appKey: string) {
  return await $fetch<any>('https://api.backblazeb2.com/b2api/v2/b2_authorize_account', {
    method: 'GET',
    headers: { Authorization: `Basic ${b64(`${keyId}:${appKey}`)}` },
  })
}

// normalize path segments (incl. filename)
function normalizePath(input: string): string {
  return input
    .replace(/\\/g, '/')
    .replace(/\/+/g, '/')
    .split('/')
    .map((seg) => {
      if (!seg) return ''
      const m = seg.match(/^(.*?)(\.[^.]+)?$/)
      const base = (m?.[1] ?? '').trim()
      const ext  = (m?.[2] ?? '')
      const cleanBase = base
        .replace(/\s+/g, '_')
        .replace(/[^\w\-\.]+/g, '')
        .replace(/_+/g, '_')
        .replace(/^_+|_+$/g, '')
        .toLowerCase()
      return cleanBase + ext.toLowerCase()
    })
    .filter(Boolean)
    .join('/')
}

async function b2GetBucketId(apiUrl: string, authToken: string, accountId: string, bucketName: string) {
  const res = await $fetch<any>(`${apiUrl}/b2api/v2/b2_list_buckets`, {
    method: 'POST',
    headers: { Authorization: authToken },
    body: { accountId, bucketName },
  })
  const bucket = res?.buckets?.[0]
  if (!bucket?.bucketId) throw createError({ statusCode: 500, statusMessage: `Bucket not found: ${bucketName}` })
  return bucket.bucketId as string
}

async function b2GetUploadUrl(apiUrl: string, authToken: string, bucketId: string) {
  return await $fetch<any>(`${apiUrl}/b2api/v2/b2_get_upload_url`, {
    method: 'POST',
    headers: { Authorization: authToken },
    body: { bucketId },
  })
}

export default defineEventHandler(async (event) => {
  requireAdmin(event)

  const { files } = await readBody<UploadReq>(event)
  if (!Array.isArray(files) || files.length === 0) {
    throw createError({ statusCode: 400, statusMessage: 'No files' })
  }

  const cfg = useRuntimeConfig()
  const keyId = cfg.b2KeyId as string | undefined
  const appKey = cfg.b2AppKey as string | undefined
  const bucketName = cfg.b2Bucket as string | undefined
  const ttl = Math.min(Number(cfg.mediaSignTtl ?? 900), 3600)

  if (!keyId || !appKey || !bucketName) {
    throw createError({ statusCode: 500, statusMessage: 'Missing runtime config: b2KeyId, b2AppKey, b2Bucket' })
  }

  // 1) Account auth (Native API)
  const account = await b2AuthorizeAccount(keyId, appKey)
  const apiUrl = account.apiUrl as string
  const accountToken = account.authorizationToken as string
  const accountId = account.accountId as string

  // 2) Resolve bucketId from name (once per call)
  const bucketId = await b2GetBucketId(apiUrl, accountToken, accountId, bucketName)

  // 3) Get a fresh upload URL/token for that bucket
  const { uploadUrl, authorizationToken } = await b2GetUploadUrl(apiUrl, accountToken, bucketId)

  // 4) Build per-file descriptors for the client XHR (POST) upload
  const uploads = files.map((f) => {
    const key = normalizePath(f.key)
    const mime = f.mime || 'b2/x-auto'
    return {
      key,
      url: uploadUrl,
      headers: {
        Authorization: authorizationToken,
        'X-Bz-File-Name': encodeURIComponent(key),
        'Content-Type': mime,
        'X-Bz-Content-Sha1': 'do_not_verify',
      },
      expiresIn: ttl,
    }
  })
  return { uploads }
})
