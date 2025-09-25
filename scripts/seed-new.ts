// scripts/seed-new.ts
import { prisma } from '../server/lib/prisma'
import argon2 from 'argon2'

async function main() {
  // --- admin user ---
  const email = process.env.SEED_ADMIN_EMAIL || 'admin@ogallery.net'
  const pw = process.env.SEED_ADMIN_PASSWORD || 'change-me-now'
  const passwordHash = await argon2.hash(pw)

  await prisma.adminUser.upsert({
    where: { email },
    update: {},
    create: {
      email,
      passwordHash,
      role: 'ADMIN',
    },
  })

  // --- sample artist ---
  const artist = await prisma.artist.upsert({
    where: {
      slug_locale: {
        slug: 'artist-x',
        locale: 'EN',
      },
    },
    update: {},
    create: {
      slug: 'artist-x',
      locale: 'EN',
      name: 'Artist X',
      bioHtml: '<p>Sample bio for Artist X.</p>',
    },
  })

  // --- sample exhibition ---
  await prisma.exhibition.upsert({
    where: {
      slug_locale: {
        slug: 'spring-showcase',
        locale: 'EN',
      },
    },
    update: {},
    create: {
      slug: 'spring-showcase',
      locale: 'EN',
      title: 'Spring Showcase',
      startDate: new Date(),
      artists: {
        connect: [{ id: artist.id }],
      },
    },
  })

  console.log(`✅ Seeded admin ${email}, artist ${artist.slug}, and exhibition.`)
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
