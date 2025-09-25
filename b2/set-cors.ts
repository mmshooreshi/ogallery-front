// b2/set-cors.ts
import { S3Client, PutBucketCorsCommand } from '@aws-sdk/client-s3'

const bucket = 'ogallery'
const region = 'us-east-005'
const endpoint = 'https://s3.us-east-005.backblazeb2.com'
const accessKeyId =  '005a8a1ebd7645d0000000001'
const secretAccessKey = 'K0050CrIlJttcPF9CBJuhM4kYw5afVI';
console.log(accessKeyId,secretAccessKey)

const s3 = new S3Client({
  region,
  endpoint,
  forcePathStyle: true,
  credentials: { accessKeyId, secretAccessKey }
})

const input = {
  Bucket: bucket,
  CORSConfiguration: {
    CORSRules: [
      {
        AllowedOrigins: ['http://localhost:3000', 'https://ogallery.net',  'https://ogallery-front.vercel.app'],
        AllowedMethods: ['GET', 'PUT', 'HEAD', 'OPTIONS'],
        AllowedHeaders: ['*'],
        ExposeHeaders: ['ETag'],
        MaxAgeSeconds: 86400
      }
    ]
  }
}

await s3.send(new PutBucketCorsCommand(input))
console.log('CORS set')
