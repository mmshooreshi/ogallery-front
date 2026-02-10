import { PrismaClient, Locale } from '@prisma/client'
const prisma = new PrismaClient()

export default defineEventHandler(async (event) => {
  const id = Number(event.context.params?.id)
  const body = await readBody(event)

  // Transaction ensures data integrity
  const result = await prisma.$transaction(async (tx) => {
    
    // 1. Update Main Entry fields
    const entry = await tx.entry.update({
      where: { id },
      data: {
        kind: body.kind,
        slug: body.slug,
        status: body.status,
        updatedAt: new Date()
      }
    })

    // 2. Update Locales (Upsert: Update if exists, Create if not)
    // English
    if (body.locales?.EN) {
      await tx.entryLocale.upsert({
        where: { entryId_locale: { entryId: id, locale: Locale.EN } },
        update: {
          title: body.locales.EN.title,
          summary: body.locales.EN.summary,
          bodyHtml: body.locales.EN.bodyHtml
        },
        create: {
          entryId: id,
          locale: Locale.EN,
          title: body.locales.EN.title,
          summary: body.locales.EN.summary,
          bodyHtml: body.locales.EN.bodyHtml
        }
      })
    }

    // Persian
    if (body.locales?.FA) {
      await tx.entryLocale.upsert({
        where: { entryId_locale: { entryId: id, locale: Locale.FA } },
        update: {
          title: body.locales.FA.title,
          summary: body.locales.FA.summary,
          bodyHtml: body.locales.FA.bodyHtml
        },
        create: {
          entryId: id,
          locale: Locale.FA,
          title: body.locales.FA.title,
          summary: body.locales.FA.summary,
          bodyHtml: body.locales.FA.bodyHtml
        }
      })
    }

    return entry
  })

  return result
})