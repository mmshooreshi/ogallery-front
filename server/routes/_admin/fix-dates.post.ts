// server/routes/_admin/fix-dates.post.ts
import { prisma } from '~~/server/lib/prisma'
import { parseDateRange } from '~/utils/date'

export default defineEventHandler(async () => {
  const rows = await prisma.entry.findMany({
    where: {
      kind: 'EXHIBITION',
      status: 'PUBLISHED',
      deletedAt: null,
    },
    select: { id: true, props: true },
  })

  let fixed = 0

  for (const e of rows) {
    const raw = (e.props as any)?.scraped?.props?.dateString
    if (!raw) continue

    const parsed = parseDateRange(raw)
    if (!parsed) continue

    await prisma.entry.update({
      where: { id: e.id },
      data: {
        dates: {
          range: {
            start: parsed.start,
            end: parsed.end,
            raw,
            timezone: 'UTC',
            precision: 'day',
          },
        },
      },
    })

    fixed++
  }

  return { fixed }
})
