// server/queries/common.ts
import type { Locale, Prisma } from '@prisma/client'
import { prisma } from '~~/server/lib/prisma'

/* --------------------------------------------------------------------------
   1. CONFIGURATION & TYPES
   -------------------------------------------------------------------------- */

// Maps URL segments to Database Enums
const KIND_MAP: Record<string, string> = {
  exhibitions: 'EXHIBITION',
  publications: 'PUBLICATION',
  artists: 'ARTIST',
  news: 'NEWS',
  'viewing-rooms': 'VIEWING_ROOM',
  window: 'WINDOW',
  studio: 'STUDIO',
}

// Type for the "Index/List" view
export type EntryCard = {
  id: number
  slug: string
  kind: string
  title: string | undefined
  snippet: string | null   // <--- Truncated body text for lists
  artistName: string
  artistSlug: string | null
  dateString: string | null
  startDate: string | null
  endDate: string | null
  thumb: string | null
  price: string | null // <--- Add this
  status: string | null
  pdfUrl: string | null    // <--- For quick download buttons in lists
  year: number | null
}

// Type for the "Detail/Slug" view
export type EntryDetail = {
  id: number
  kind: string
  slug: string
  status: string
  dates: any | null
  props: any | null
  
  // Normalized Top-level fields
  title: string | null
  bodyHtml: string | null
  dateString: string | null
  pdfUrl: string | null 
  
  coverMedia: null | {
    url: string
    thumb: string | null
    caption: string | null
    meta: any | null
  }
  
  locales: Array<{
    locale: Locale
    title: string | null
    bodyHtml: string | null
    data: any | null
  }>

  artist: {
    name: string
    slug: string | null
  }
  
  media: Array<{
    id: number
    role: string
    ord: number | null
    meta: any | null
    media: {
      url: string
      kind: string | null
      alt: string | null
      caption: string | null
      thumb: string | null
      meta: any | null
    }
  }>
}

/* --------------------------------------------------------------------------
   2. HELPERS
   -------------------------------------------------------------------------- */

/**
 * Removes the first <h4> tag if it exists at the start of the HTML.
 * Used to prevent duplicate titles in the body.
 */
function stripLeadingH4(bodyHtml: string | null | undefined): string | null {
  if (!bodyHtml) return bodyHtml ?? null
  return bodyHtml.replace(/^\s*<h4\b[^>]*>[\s\S]*?<\/h4>\s*/i, '')
}

function localeOrder(requested?: Locale): Locale[] {
  if (!requested) return ['EN', 'FA']
  return requested === 'FA' ? ['FA', 'EN'] : ['EN', 'FA']
}

function toDateSafe(v: unknown): Date | null {
  if (!v || typeof v !== 'string') return null
  const d = new Date(v)
  return Number.isNaN(d.getTime()) ? null : d
}

function yearOf(d: Date | null): number | null {
  return d ? d.getUTCFullYear() : null
}

// 1. Add this helper function at the top
function stripHtml(html: string | null | undefined): string {
  if (!html) return ''
  return html.replace(/<[^>]*>?/gm, '') // Simple regex to remove tags
}

function getScrapedProps(entryProps: any): any {
  return entryProps?.scraped?.props ?? {}
}

function getDatesRange(entryDates: any): any {
  return entryDates?.range ?? null
}

function pickLocalizedCaption(args: {
  locale: Locale
  entryMediaMeta: any
  mediaMeta: any
  mediaCaption: string | null
}): string | null {
  const { locale, entryMediaMeta, mediaMeta, mediaCaption } = args
  const emEn = entryMediaMeta?.captionEn ?? null
  const emFa = entryMediaMeta?.captionFa ?? null
  const mEn = mediaMeta?.captionEn ?? null
  const mFa = mediaMeta?.captionFa ?? null
  const base = mediaCaption ?? null

  if (locale === 'FA') return emFa ?? mFa ?? emEn ?? mEn ?? base
  return emEn ?? mEn ?? base ?? emFa ?? mFa
}

function pickThumb(entryMediaMeta: any, mediaMeta: any): string | null {
  return entryMediaMeta?.thumb ?? mediaMeta?.thumb ?? null
}

function pickTitle(locales: Array<{ locale: Locale; title: string | null }>, requested?: Locale, fallback?: string) {
  const order = localeOrder(requested)
  const map = new Map(locales.map((l) => [l.locale, l.title ?? '']))
  return map.get(order[0]) || map.get(order[1]) || fallback
}

/* --------------------------------------------------------------------------
   3. UNIVERSAL LIST QUERY
   -------------------------------------------------------------------------- */

export async function listEntries(kindSegment: string, locale?: Locale, year?: number) {
  const kind = KIND_MAP[kindSegment] || 'UNKNOWN'

  // Fetch from DB
  const rows = await prisma.entry.findMany({
    where: {
      kind: kind,
      status: 'PUBLISHED',
      deletedAt: null,
    },
    select: {
      id: true,
      slug: true,
      kind: true,
      dates: true,
      props: true,
      coverMedia: { select: { url: true, meta: true, caption: true } },
      locales: { select: { locale: true, title: true, bodyHtml: true } },
    },
    orderBy: [{ updatedAt: 'desc' }], 
  })

  // Process Rows into Cards
  let cards: EntryCard[] = rows.map((e) => {
    const scrapedProps = getScrapedProps(e.props as any)
    const range = getDatesRange(e.dates as any)

    // Robust Date Extraction
    const startIso = scrapedProps.startDate ?? scrapedProps.publishDate ?? range?.start ?? null
    const endIso = scrapedProps.endDate ?? scrapedProps.publishDate ?? range?.end ?? null
    const raw = scrapedProps.dateString ?? scrapedProps.publishDate ?? range?.raw ?? null

    const start = toDateSafe(startIso)
    const end = toDateSafe(endIso)
    const y = yearOf(end) ?? yearOf(start)

    const title = pickTitle(e.locales, locale, e.slug)
    const coverMeta = (e.coverMedia?.meta as any) ?? null
    const thumb = coverMeta?.thumb ?? e.coverMedia?.url ?? null

    // PDF extraction (Localized data -> Scraped fallback)
    const preferredLoc = e.locales.find(l => l.locale === (locale || 'EN')) || e.locales[0]
    const rawHtml = preferredLoc?.bodyHtml || e.locales.find(l => l.bodyHtml)?.bodyHtml || ''
    const plainText = stripHtml(rawHtml)
    
    const snippet = plainText.length > 1 ? plainText.slice(0, 200).trim() + '...' : null

    return {
      id: e.id,
      slug: e.slug,
      kind: e.kind,
      title,
      snippet, 
      artistName: scrapedProps.artistName ?? '', 
      artistSlug: scrapedProps.artistSlug ?? (e.props as any)?.unresolvedLinks?.artistSlug ?? null,
      dateString: raw,
      startDate: startIso,
      endDate: endIso,
      price: scrapedProps.price ?? null, // <--- Map it
      thumb,
      year: y,
    }
  })

  // Filter by Year (if provided)
  if (typeof year === 'number' && Number.isFinite(year)) {
    cards = cards.filter(c => c.year === year)
  }

  // Sort by Date (Newest First)
  cards.sort((a, b) => {
    const da = toDateSafe(a.startDate)?.getTime() ?? 0
    const db = toDateSafe(b.startDate)?.getTime() ?? 0
    return db - da
  })

  return cards
}

/* --------------------------------------------------------------------------
   4. UNIVERSAL DETAIL QUERY
   -------------------------------------------------------------------------- */

export async function getEntryDetail(kindSegment: string, slug: string, locale?: Locale) {
  const kind = KIND_MAP[kindSegment] || 'UNKNOWN'

  const entry = await prisma.entry.findFirst({
    where: {
      kind,
      slug,
      status: 'PUBLISHED',
      deletedAt: null,
    },
    include: {
      coverMedia: { select: { url: true, meta: true, caption: true } },
      locales: true, // Fetch all for smart fallback
      media: {
        include: { media: true },
        orderBy: [{ ord: 'asc' }],
      },
    },
  })

  if (!entry) return null

  // --- Locales Processing ---
  const order = localeOrder(locale)
  const localesSorted = (entry.locales ?? []).slice().sort((a, b) => {
    const ai = order.indexOf(a.locale)
    const bi = order.indexOf(b.locale)
    return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi)
  })

  const finalLocales = localesSorted.map((l) => ({
    locale: l.locale,
    title: l.title,
    bodyHtml: stripLeadingH4(l.bodyHtml), 
    data: l.data,
  }))

  const preferredLocale = finalLocales.find(l => l.locale === (locale ?? 'EN')) || finalLocales[0]

  // --- Props / Meta Extraction ---
  const scrapedProps = getScrapedProps(entry.props as any)
  const unresolved = (entry.props as any)?.unresolvedLinks ?? {}
  const artistSlug: string | null = scrapedProps.artistSlug ?? unresolved.artistSlug ?? null
  const artistName: string = scrapedProps.artistName ?? ''
  
  const dates = getDatesRange(entry.dates as any)
  const dateString = scrapedProps.dateString ?? scrapedProps.publishDate ?? dates?.raw ?? null

  // --- PDF / CV Logic ---
  // Priority: 1. Locale Data, 2. Scraped Props, 3. Media Item with role 'CV'/'DOCUMENT'
  let pdfUrl = (preferredLocale?.data as any)?.cvUrl 
    ?? (preferredLocale?.data as any)?.sourceUrl 
    ?? scrapedProps.pdfUrl 
    ?? null
  
  if (!pdfUrl) {
    const pdfMedia = entry.media.find(m => m.role === 'CV' || m.role === 'DOCUMENT')
    if (pdfMedia) pdfUrl = pdfMedia.media.url
  }

  // --- Cover ---
  const coverMeta = (entry.coverMedia?.meta as any) ?? null
  const cover = entry.coverMedia
    ? {
        url: entry.coverMedia.url,
        thumb: coverMeta?.thumb ?? entry.coverMedia.url ?? null,
        caption: entry.coverMedia.caption ?? null,
        meta: coverMeta,
      }
    : null

  // --- Media Processing ---
  const media = (entry.media ?? []).map((em) => {
    const emMeta = (em.meta as any) ?? null
    const mMeta = (em.media?.meta as any) ?? null

    const caption = pickLocalizedCaption({
      locale: (locale ?? 'EN') as Locale,
      entryMediaMeta: emMeta,
      mediaMeta: mMeta,
      mediaCaption: em.media?.caption ?? null,
    })

    const thumb = pickThumb(emMeta, mMeta)

    return {
      id: em.id,
      role: em.role,
      ord: em.ord ?? null,
      meta: emMeta,
      media: {
        url: em.media.url,
        kind: em.media.kind ?? null,
        alt: em.media.alt ?? null,
        caption,
        thumb,
        meta: mMeta,
      },
    }
  })

  // --- Final Return ---
  return {
    id: entry.id,
    kind: entry.kind,
    slug: entry.slug,
    status: entry.status,
    dates: (entry.dates as any) ?? null,
    props: (entry.props as any) ?? null,
    
    // Normalized shortcuts for UI
    title: preferredLocale?.title ?? null,
    bodyHtml: preferredLocale?.bodyHtml ?? null,
    dateString,
    pdfUrl,

    coverMedia: cover,
    locales: finalLocales,
    artist: { name: artistName, slug: artistSlug },
    media,
  }
}