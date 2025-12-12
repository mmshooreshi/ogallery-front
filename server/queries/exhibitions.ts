// server/queries/exhibitions.ts
import type { Locale } from '@prisma/client'
import { prisma } from '~~/server/lib/prisma'

/* -----------------------------
 * Types returned to the client
 * ----------------------------- */

export type ExhibitionCard = {
  id: number
  slug: string
  title: string | undefined
  artistName: string
  artistSlug: string | null
  dateString: string | null
  startDate: string | null
  endDate: string | null
  thumb: string | null
  year: number | null
}

export type ExhibitionDetail = {
  id: number
  kind: 'EXHIBITION'
  slug: string
  status: string
  dates: any | null
  props: any | null
  coverMedia: null | {
    url: string
    thumb: string | null
    caption: string | null
    meta: any | null
  }
  locales: Array<{
    locale: Locale
    slug: string | null
    title: string | null
    subtitle: string | null
    summary: string | null
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

/* -----------------------------
 * Helpers
 * ----------------------------- */

function stripLeadingH4(bodyHtml: string | null | undefined): string | null {
  if (!bodyHtml) return bodyHtml ?? null

  // Remove only the FIRST <h4 ...>...</h4> if it appears at the start (ignoring whitespace)
  // Keeps everything after it intact.
  const cleaned = bodyHtml.replace(
    /^\s*<h4\b[^>]*>[\s\S]*?<\/h4>\s*/i,
    ''
  )

  return cleaned
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

  // Prefer per-link localized caption (EntryMedia.meta)
  const emEn = entryMediaMeta?.captionEn ?? null
  const emFa = entryMediaMeta?.captionFa ?? null

  // Then per-media localized caption (Media.meta)
  const mEn = mediaMeta?.captionEn ?? null
  const mFa = mediaMeta?.captionFa ?? null

  // Fallback: Media.caption (often EN)
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

/* -----------------------------
 * LIST (index page)
 * Supports ?year=YYYY
 * Returns { current, past, years, year }
 * ----------------------------- */

export async function listExhibitions(locale?: Locale, year?: number) {
  const now = new Date()

  const rows = await prisma.entry.findMany({
    where: {
      kind: 'EXHIBITION',
      status: 'PUBLISHED',
      deletedAt: null,
    },
    select: {
      id: true,
      slug: true,
      dates: true,
      props: true,
      coverMedia: { select: { url: true, meta: true, caption: true } },
      locales: { select: { locale: true, title: true } },
    },
    orderBy: [{ updatedAt: 'desc' }],
  })

  const cards: ExhibitionCard[] = rows.map((e) => {
    const scrapedProps = getScrapedProps(e.props as any)
    const range = getDatesRange(e.dates as any)

    const startIso = scrapedProps.startDate ?? range?.start ?? null
    const endIso = scrapedProps.endDate ?? range?.end ?? null
    const raw = scrapedProps.dateString ?? range?.raw ?? null

    const start = toDateSafe(startIso)
    const end = toDateSafe(endIso)

    const title = pickTitle(e.locales, locale, e.slug)

    const coverMeta = (e.coverMedia?.meta as any) ?? null
    const thumb = coverMeta?.thumb ?? e.coverMedia?.url ?? null

    const y = yearOf(end) ?? yearOf(start)

    return {
      id: e.id,
      slug: e.slug,
      title,
      artistName: scrapedProps.artistName ?? 'Group Exhibition',
      artistSlug: scrapedProps.artistSlug ?? (e.props as any)?.unresolvedLinks?.artistSlug ?? null,
      dateString: raw,
      startDate: startIso,
      endDate: endIso,
      thumb,
      year: y,
    }
  })

  const current = cards
    .filter((c) => {
      const s = toDateSafe(c.startDate)
      const e = toDateSafe(c.endDate)
      if (!s || !e) return false
      return s.getTime() <= now.getTime() && now.getTime() <= e.getTime()
    })
    .sort((a, b) => (toDateSafe(a.startDate)?.getTime() ?? 0) - (toDateSafe(b.startDate)?.getTime() ?? 0))

  const pastAll = cards
    .filter((c) => {
      const e = toDateSafe(c.endDate)
      if (!e) return true
      return e.getTime() < now.getTime()
    })
    .sort((a, b) => (toDateSafe(b.endDate)?.getTime() ?? 0) - (toDateSafe(a.endDate)?.getTime() ?? 0))

  const years = Array.from(
    new Set(
      pastAll
        .map((c) => c.year)
        .filter((y): y is number => typeof y === 'number' && Number.isFinite(y))
    )
  ).sort((a, b) => a - b)

  const effectiveYear =
    typeof year === 'number' && Number.isFinite(year)
      ? year
      : years.includes(now.getUTCFullYear())
        ? now.getUTCFullYear()
        : (years[years.length - 1] ?? now.getUTCFullYear())

  const past = pastAll.filter((c) => c.year === effectiveYear)

  return { current, past, years, year: effectiveYear }
}

/* -----------------------------
 * DETAIL (slug page)
 * Returns locales + media + localized captions + dates + scraped props
 * ----------------------------- */

export async function getExhibition(slug: string, locale?: Locale) {
  const entry = await prisma.entry.findFirst({
    where: {
      kind: 'EXHIBITION',
      slug,
      status: 'PUBLISHED',
      deletedAt: null,
    },
    select: {
      id: true,
      kind: true,
      slug: true,
      status: true,
      dates: true,
      props: true,
      coverMedia: { select: { url: true, meta: true, caption: true } },
      locales: {
        select: {
          locale: true,
          slug: true,
          title: true,
          subtitle: true,
          summary: true,
          bodyHtml: true,
          data: true,
        },
      },
      media: {
        select: {
          id: true,
          role: true,
          ord: true,
          meta: true,
          media: {
            select: {
              url: true,
              kind: true,
              alt: true,
              caption: true,
              meta: true,
            },
          },
        },
        orderBy: [{ ord: 'asc' }],
      },
    },
  })

  if (!entry) return null

  const order = localeOrder(locale)
  const localesSorted = (entry.locales ?? []).slice().sort((a, b) => {
    const ai = order.indexOf(a.locale)
    const bi = order.indexOf(b.locale)
    return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi)
  })

  // If locale provided, only return that locale; otherwise return all
  const finalLocalesRaw = locale
    ? localesSorted.filter((l) => l.locale === locale)
    : localesSorted

  // ✅ Strip the initial <h4>...</h4> from bodyHtml before returning
  const finalLocales = finalLocalesRaw.map((l) => ({
    ...l,
    bodyHtml: stripLeadingH4(l.bodyHtml),
  }))

  // Artist info comes from scraped props (and unresolved fallback)
  const scrapedProps = getScrapedProps(entry.props as any)
  const unresolved = (entry.props as any)?.unresolvedLinks ?? {}
  const artistSlug: string | null = scrapedProps.artistSlug ?? unresolved.artistSlug ?? null
  const artistName: string = scrapedProps.artistName ?? 'Group Exhibition'

  // Cover
  const coverMeta = (entry.coverMedia?.meta as any) ?? null
  const cover = entry.coverMedia
    ? {
        url: entry.coverMedia.url,
        thumb: coverMeta?.thumb ?? entry.coverMedia.url ?? null,
        caption: entry.coverMedia.caption ?? null,
        meta: coverMeta,
      }
    : null

  // Media with localized captions + thumb
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

  return {
    id: entry.id,
    kind: 'EXHIBITION' as const,
    slug: entry.slug,
    status: entry.status,
    dates: (entry.dates as any) ?? null,
    props: (entry.props as any) ?? null,
    coverMedia: cover,
    locales: finalLocales,
    artist: { name: artistName, slug: artistSlug },
    media,
  }
}
