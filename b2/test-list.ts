// b2/test-list.ts
import { S3Client, ListBucketsCommand } from '@aws-sdk/client-s3'
const bucket = 'ogallery'
const region = 'us-east-005'
const endpoint = 'https://s3.us-east-005.backblazeb2.com'
const accessKeyId =  '005a8a1ebd7645d0000000001'
const secretAccessKey = 'K0050CrIlJttcPF9CBJuhM4kYw5afVI';

const s3 = new S3Client({
  region: region,
  endpoint: endpoint,
  forcePathStyle: true,
  credentials: { accessKeyId: accessKeyId!, secretAccessKey: secretAccessKey! },
})
const res = await s3.send(new ListBucketsCommand({}))
console.log(res.Buckets?.map(b => b.Name))
