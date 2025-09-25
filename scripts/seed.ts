// scripts/seed.ts
import { prisma } from '../server/lib/prisma'
import argon2 from 'argon2'

async function main() {
  // admin
  const email = process.env.SEED_ADMIN_EMAIL || 'admin@ogallery.net'
  const pw = process.env.SEED_ADMIN_PASSWORD || 'change-me-now'
  const passwordHash = await argon2.hash(pw)

  await prisma.adminUser.upsert({
    where: { email },
    update: {},
    create: { email, passwordHash, role: 'ADMIN' },
  })

  // artist + exhibition
  const a = await prisma.artist.upsert({
    where: { slug: 'artist-x' },
    update: {},
    create: { slug: 'artist-x', name: 'Artist X' },
  })

  await prisma.exhibition.upsert({
    where: { slug: 'spring-showcase' },
    update: {},
    create: {
      slug: 'spring-showcase',
      title: 'Spring Showcase',
      startDate: new Date(),
      artists: { connect: [{ id: a.id }] },
    },
  })

  console.log(`Seeded admin ${email} and sample content.`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
}).finally(async () => {
  await prisma.$disconnect()
})
