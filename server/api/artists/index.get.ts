// server/api/artists/index.get.ts
import { prisma as db } from '~~/server/lib/prisma'
import { Locale } from '@prisma/client'

export default defineEventHandler(async (event) => {
  const q = getQuery(event)
  const locale = (q.locale as string | undefined)?.toUpperCase() as Locale | undefined

  const entries = await db.entry.findMany({
    where: { kind: 'ARTIST', status: 'PUBLISHED' },
    include: {
      coverMedia: true,
      locales: locale ? { where: { locale } } : true,
      media: { include: { media: true } },
    },
    orderBy: { updatedAt: 'desc' },
  })

  return entries.map((entry) => {
    const loc = entry.locales[0]
    return {
      id: entry.id,
      slug: entry.slug,
      name: loc?.title ?? '(Untitled)',
      image: entry.coverMedia?.url ?? null,
    }
  })
})
