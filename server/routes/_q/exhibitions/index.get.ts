// server/routes/_q/exhibitions/index.get.ts
import { defineEventHandler, getQuery } from 'h3'
import type { Locale } from '@prisma/client'
import { listExhibitions } from '~~/server/queries/exhibitions'

function parseLocale(v: unknown): Locale | undefined {
  if (typeof v !== 'string') return undefined
  const up = v.toUpperCase()
  return up === 'EN' || up === 'FA' ? (up as Locale) : undefined
}

function parseYear(v: unknown): number | undefined {
  const s = Array.isArray(v) ? v[0] : v
  if (typeof s !== 'string') return undefined
  const n = Number.parseInt(s, 10)
  return Number.isFinite(n) ? n : undefined
}

function nowMs() {
  // monotonic-ish
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const hr = (process as any)?.hrtime?.bigint?.()
  if (typeof hr === 'bigint') return Number(hr) / 1e6
  if (typeof performance !== 'undefined' && typeof performance.now === 'function') return performance.now()
  return Date.now()
}

export default defineEventHandler(async (event) => {
  const q = getQuery(event)
  const locale = parseLocale(q.locale)
  const year = parseYear(q.year)

  const t0 = nowMs()
  try {
    return await listExhibitions(locale, year)
  } finally {
    const t1 = nowMs()
    console.log(`[API] GET /_q/exhibitions took ${(t1 - t0).toFixed(2)} ms`)
  }
})



