import type { Locale } from '@prisma/client'
import { listArtists } from '~~/server/queries/artists'

export default defineEventHandler(async (event) => {
  const q = getQuery(event)
  const locale = (q.locale as string | undefined)?.toUpperCase() as Locale | undefined


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
    const result = await listArtists(locale)
    return result
  } finally {
    const elapsedMs = now() - start
    console.log(`[API] listArtists took ${elapsedMs.toFixed(2)} ms`)
  }

   
})
