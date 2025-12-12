// server/routes/_q/news/index.get.ts
import { defineEventHandler, getQuery, setHeader } from 'h3'
import type { Locale } from '@prisma/client'
import { listNews } from '~~/server/queries/news'

function parseLocale(v: unknown): Locale | undefined {
  if (typeof v !== 'string') return undefined
  const up = v.toUpperCase()
  return up === 'EN' || up === 'FA' ? (up as Locale) : undefined
}

function parseIntParam(v: unknown): number | undefined {
  const s = Array.isArray(v) ? v[0] : v
  if (typeof s !== 'string') return undefined
  const n = Number.parseInt(s, 10)
  return Number.isFinite(n) ? n : undefined
}

function parseString(v: unknown): string | undefined {
  if (typeof v === 'string' && v.trim() !== '') return v
  return undefined
}

export default defineEventHandler(async (event) => {
  const q = getQuery(event)

  const locale = parseLocale(q.locale)
  const year = parseIntParam(q.year)
  const month = parseIntParam(q.month)
  const tag = parseString(q.tag)

  /* 🔥 HARD CACHE HEADERS */
  setHeader(event, 'Cache-Control', 'public, max-age=60, s-maxage=300, stale-while-revalidate=600')
  setHeader(event, 'Vary', 'Accept-Encoding')

  return listNews(locale, { tag, year, month })
})
