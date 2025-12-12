// server/routes/_q/news/[slug].get.ts
import { defineEventHandler, getQuery, getRouterParam } from 'h3'
import type { Locale } from '@prisma/client'
import { getNewsItem } from '~~/server/queries/news'

function parseLocale(v: unknown): Locale | undefined {
  if (typeof v !== 'string') return undefined
  const up = v.toUpperCase()
  return up === 'EN' || up === 'FA' ? (up as Locale) : undefined
}

function nowMs() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const hr = (process as any)?.hrtime?.bigint?.()
  if (typeof hr === 'bigint') return Number(hr) / 1e6
  if (typeof performance !== 'undefined' && typeof performance.now === 'function') return performance.now()
  return Date.now()
}

export default defineEventHandler(async (event) => {
  const rawSlug = getRouterParam(event, 'slug')
  const slug = decodeURIComponent(rawSlug || '')
  const q = getQuery(event)
  const locale = parseLocale(q.locale)

  const t0 = nowMs()
  try {
    return await getNewsItem(slug, locale)
  } finally {
    const t1 = nowMs()
    console.log(`[API] GET /_q/news/${slug} took ${(t1 - t0).toFixed(2)} ms`)
  }
})
