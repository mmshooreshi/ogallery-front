import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

export default defineEventHandler(async (event) => {
  const idStr = event.context.params?.id
  if (!idStr || idStr === 'new') return null

  const id = Number(idStr)

  // 1. Fetch Entry with Locales
  const entry = await prisma.entry.findUnique({
    where: { id },
    include: { locales: true }
  })

  if (!entry) throw createError({ statusCode: 404, statusMessage: 'Entry not found' })

  // 2. Transform Locales Array -> Object { EN: {...}, FA: {...} }
  // This makes it much easier to bind in Vue
  const localesMap: Record<string, any> = {}
  
  entry.locales.forEach((l) => {
    localesMap[l.locale] = {
      title: l.title,
      summary: l.summary,
      bodyHtml: l.bodyHtml,
      // Add jsonld/seo here if needed later
    }
  })

  // 3. Return clean structure
  return {
    ...entry,
    locales: localesMap
  }
})