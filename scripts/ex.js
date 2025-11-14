// scripts/ex.js
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const result = await prisma.entry.updateMany({
    where: {
      kind: 'exhibited artist',
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
