import type { Locale } from '@prisma/client'
import { listArtists } from '~~/server/queries/artists'

export default defineEventHandler(async (event) => {
  const q = getQuery(event)
  const locale = (q.locale as string | undefined)?.toUpperCase() as Locale | undefined
  return listArtists(locale)
})
