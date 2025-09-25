import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const result = await prisma.$queryRaw`
select id, url, meta from "Media" where meta->>'dir' is null or meta->>'dir' = '';
`

console.log(result)