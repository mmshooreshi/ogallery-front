// prisma/seed.ts
import { PrismaClient } from '@prisma/client'
import argon2 from 'argon2'

const prisma = new PrismaClient()

async function main() {
  // --- Admin user ---
  const email = process.env.SEED_ADMIN_EMAIL || 'admin@ogallery.net'
  const pw = process.env.SEED_ADMIN_PASSWORD || 'change-me-now'
  const passwordHash = await argon2.hash(pw)

  const admin = await prisma.user.upsert({
    where: { email },
    update: { passwordHash, role: 'ADMIN' },
    create: { email, passwordHash, role: 'ADMIN' },
  })

  console.log(`✅ Admin: ${admin.email}`)

  // --- Media (logo + a couple featured images) ---
  const logo = await prisma.media.upsert({
    where: { url: '/logo.svg' },
    update: {},
    create: {
      url: '/logo.svg',
      kind: 'IMAGE',
      alt: 'O Gallery logo',
      isPublic: true,
      createdById: admin.id,
    },
  })

  const latentBodiesHero = await prisma.media.create({
    data: {
      url: 'https://ogallery.net/files/Statics/uploads/2025/۱۱/DonyaAalipour/slidefeaturedimage.jpg',
      kind: 'IMAGE',
      alt: 'Latent Bodies exhibition hero',
      isPublic: true,
      createdById: admin.id,
    },
  })

  // --- Artist: Donya Aalipour ---
  const artist = await prisma.entry.create({
    data: {
      kind: 'ARTIST',
      slug: 'donya-h-aalipour',
      status: 'PUBLISHED',
      coverMediaId: null,
      locales: {
        create: [
          {
            locale: 'EN',
            slug: 'donya-h-aalipour',
            title: 'Donya Aalipour',
            summary: 'Iranian artist (b. 1995 Tehran) working with oil on canvas, exploring identity, memory, and collective life.',
          },
        ],
      },
      media: {
        create: [
          { mediaId: logo.id, role: 'PROFILE' },
        ],
      },
    },
  })

  // --- Exhibition: Latent Bodies ---
    const exhibition = await prisma.entry.create({
    data: {
        kind: "EXHIBITION",
        slug: "latent-bodies",
        status: "PUBLISHED",
        dates: {
        start: "2025-09-19",
        end: "2025-09-30",
        },
        coverMediaId: 2, // make sure this ID exists or use `connect`
        locales: {
        create: [
            {
            locale: "EN",
            slug: "latent-bodies",
            title: "Latent Bodies",
            summary:
                "Solo exhibition of Donya Aalipour at O Gallery, September 19 – 30, 2025.",
            },
        ],
        },
    },
    })


  // Link Artist ↔ Exhibition
  await prisma.link.create({
    data: {
      fromId: artist.id,
      toId: exhibition.id,
      role: 'PARTICIPATES_IN',
    },
  })

  // --- Window Project: Man-Made ---
  await prisma.entry.create({
    data: {
      kind: 'WINDOW',
      slug: 'man-made',
      status: 'PUBLISHED',
      locales: {
        create: [
          {
            locale: 'EN',
            slug: 'man-made',
            title: 'Man-Made',
            summary: 'Window project at O Gallery, September 19 – 30, 2025.',
          },
        ],
      },
    },
  })

  // --- News: The Armory Show 2025 ---
  await prisma.entry.create({
    data: {
      kind: 'NEWS',
      slug: 'the-armory-show-2025',
      status: 'PUBLISHED',
      locales: {
        create: [
          {
            locale: 'EN',
            slug: 'the-armory-show-2025',
            title: 'The Armory Show 2025',
            summary: 'O Gallery presents six artists at the Armory Show, reflecting on perception and space.',
          },
        ],
      },
    },
  })

  // --- News: Miyan ---
  await prisma.entry.create({
    data: {
      kind: 'NEWS',
      slug: 'miyan-the-studio',
      status: 'PUBLISHED',
      locales: {
        create: [
          {
            locale: 'EN',
            slug: 'miyan-the-studio',
            title: 'Miyan',
            summary: 'An exploration of body and mind through practice and presence.',
          },
        ],
      },
    },
  })

  console.log('✅ Seed data inserted')
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
