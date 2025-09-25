import { prisma as db } from '~~/server/lib/prisma'
import { Locale } from '@prisma/client'

export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug')!
  const q = getQuery(event)
  const locale = (q.locale as string | undefined)?.toUpperCase() as Locale | undefined

  const entry = await db.entry.findFirst({
    where: { kind: 'ARTIST', slug, status: 'PUBLISHED' },
    include: {
      locales: locale ? { where: { locale } } : true,
      media: { include: { media: true }, orderBy: { ord: 'asc' } },
    },
  })

  return entry
})
