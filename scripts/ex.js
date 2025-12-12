// scripts/ex.js
import { PrismaClient } from '@prisma/client'


const prisma = new PrismaClient({
  datasources: { db: { url: process.env.DATABASE_URL_REMOTE } }
})

async function main() {
  const result = await prisma.entry.updateMany({
    where: {
      id: { gt: 27 },
      kind: 'ARTIST',
    },
    data: {
      kind: 'EXHIBITED-ARTIST',
    },
  })

  console.log(`✅ Updated ${result.count} entries to "exhibited artist"`)
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
