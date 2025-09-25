// server/lib/s3.ts
import { S3Client } from '@aws-sdk/client-s3'
let _s3: S3Client | null = null

export function s3() {
  if (_s3) return _s3
  const cfg = useRuntimeConfig()
  _s3 = new S3Client({
    region: cfg.b2Region || process.env.B2_REGION,
    endpoint: cfg.b2Endpoint || process.env.B2_ENDPOINT,
    forcePathStyle: true, // B2 prefers path-style
    credentials: {
      accessKeyId: cfg.b2KeyId || process.env.B2_KEY_ID!,
      secretAccessKey: cfg.b2AppKey || process.env.B2_APP_KEY!,
    },
  })
  return _s3
}

export function b2Bucket() {
  const cfg = useRuntimeConfig()
  return cfg.b2Bucket || process.env.B2_BUCKET!
}
