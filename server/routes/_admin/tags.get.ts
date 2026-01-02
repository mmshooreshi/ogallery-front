// server/routes/_admin/tags.get.ts
import { defineEventHandler } from 'h3'
import { prisma } from '~~/server/lib/prisma'

export default defineEventHandler(async () => {
  const tags = await prisma.tag.findMany({
    select: {
      id: true,
      slug: true,
      name: true,
      locale: true,
    },
    orderBy: [{ name: 'asc' }],
  })

  return { tags }
})
