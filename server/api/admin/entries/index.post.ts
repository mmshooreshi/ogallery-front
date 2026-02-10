import { PrismaClient, Locale } from '@prisma/client'
const prisma = new PrismaClient()

export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  // Validate
  if (!body.slug) throw createError({ statusCode: 400, message: 'Slug is required' })

  // Prepare Locale Data for Prisma
  // Prisma needs an array for 'create', not an object
  const localesToCreate = []
  
  if (body.locales?.EN) {
    localesToCreate.push({
      locale: Locale.EN,
      title: body.locales.EN.title,
      summary: body.locales.EN.summary,
      bodyHtml: body.locales.EN.bodyHtml
    })
  }

  if (body.locales?.FA) {
    localesToCreate.push({
      locale: Locale.FA,
      title: body.locales.FA.title,
      summary: body.locales.FA.summary,
      bodyHtml: body.locales.FA.bodyHtml
    })
  }

  // Create Entry
  const entry = await prisma.entry.create({
    data: {
      kind: body.kind || 'ARTIST',
      slug: body.slug,
      status: body.status || 'DRAFT',
      locales: {
        create: localesToCreate
      }
    }
  })

  return entry
})