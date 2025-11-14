// server/routes/_q/artists/by/[id].get.ts
import type { Locale } from '@prisma/client'
import { getArtistById } from '~~/server/queries/artists'

export default defineEventHandler(async (event) => {
  const rawID = getRouterParam(event, 'id')!
  const q = getQuery(event)
  const locale = (q.locale as string | undefined)?.toUpperCase() as Locale | undefined
  const id = parseInt(decodeURIComponent(rawID))
  console.log("!!!!!!!innnja: ", id)

  // High-res monotonic clock with safe fallbacks
  const now = () => {
    if (typeof performance !== 'undefined' && typeof performance.now === 'function') {
      return performance.now()
    }
    if (typeof process !== 'undefined' && typeof (process as any).hrtime?.bigint === 'function') {
      return Number((process as any).hrtime.bigint()) / 1e6 // ms
    }
    return Date.now()
  }

  const start = now()
  try {
    const result = await getArtistById(id, locale)
    return {result, meta:id}
  } finally {
    const elapsedMs = now() - start
    console.log(`[API] getArtist took ${elapsedMs.toFixed(2)} ms`)
  }
})
