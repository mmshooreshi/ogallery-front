// prisma/seed.ts
import { PrismaClient } from '@prisma/client'
import argon2 from 'argon2'

const prisma = new PrismaClient()

async function main() {
  const email = process.env.SEED_ADMIN_EMAIL || 'admin@ogallery.net'
  const pw = process.env.SEED_ADMIN_PASSWORD || 'change-me-now'
  const passwordHash = await argon2.hash(pw)

  const admin = await prisma.user.upsert({
    where: { email },
    update: { passwordHash, role: 'ADMIN' },
    create: {
      email,
      passwordHash,
      role: 'ADMIN',
    },
  })

  console.log('✅ Super admin ready:', admin.email)
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
