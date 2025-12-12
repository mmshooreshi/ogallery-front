import type { Locale } from '@prisma/client'
import { prisma } from '~~/server/lib/prisma'

/* =============================
 * Types
 * ============================= */

export type NewsItemCard = {
  id: number
  slug: string
  title: string | undefined
  summary: string | null
  artistName: string
  artistSlug: string | null
  dateString: string | null
  startDate: string | null
  endDate: string | null
  thumb: string | null
  year: number | null
}

type NewsRow = {
  id: number
  slug: string
  dates: any | null
  props: any | null
  coverMedia: { url: string; meta: any | null } | null
  locales: { locale: Locale; title: string | null }[]
  tags: { tag: { slug: string; name: string } }[]
}

/* =============================
 * Helpers
 * ============================= */

function toDateSafe(v: unknown): Date | null {
  if (!v || typeof v !== 'string') return null
  const d = new Date(v)
  return Number.isNaN(d.getTime()) ? null : d
}

function getScrapedProps(props: any) {
  return props?.scraped?.props ?? {}
}

function getDatesRange(dates: any) {
  return dates?.range ?? null
}

function entryDate(e: NewsRow): Date | null {
  const s = getScrapedProps(e.props)
  const r = getDatesRange(e.dates)
  return (
    toDateSafe(s.publishDate) ||
    toDateSafe(s.startDate) ||
    toDateSafe(r?.start) ||
    null
  )
}

function yearOf(d: Date | null): number | null {
  return d ? d.getUTCFullYear() : null
}

function pickTitle(
  locales: { locale: Locale; title: string | null }[],
  requested?: Locale,
  fallback?: string
) {
  const order: Locale[] =
    requested === 'FA' ? ['FA', 'EN'] : ['EN', 'FA']

  const map = new Map<Locale, string>(
    locales.map(l => [l.locale, l.title ?? ''])
  )

  return map.get(order[0]) || map.get(order[1]) || fallback
}

/* =============================
 * Tabs (UI-ready)
 * ============================= */

function buildTabs(
  rows: NewsRow[],
  opts?: { year?: number; month?: number }
) {


  console.log(
  rows.length,
  rows.map(r => entryDate(r))
)

let filtered =
  opts?.year || opts?.month
    ? rows.filter(e => {
        const d = entryDate(e)
        if (!d) return false
        if (opts?.year && d.getUTCFullYear() !== opts.year) return false
        if (opts?.month && d.getUTCMonth() + 1 !== opts.month) return false
        return true
      })
    : rows

  const map = new Map<string, { key: string; label: string; count: number }>()

  for (const e of filtered) {
    for (const t of e.tags) {
      if (!map.has(t.tag.slug)) {
        map.set(t.tag.slug, {
          key: t.tag.slug,
          label: t.tag.name,
          count: 0,
        })
      }
      map.get(t.tag.slug)!.count++
    }
  }

  return [
    { key: 'all', label: 'All', count: filtered.length },
    ...Array.from(map.values()).sort((a, b) =>
      a.label.localeCompare(b.label)
    ),
  ]
}

/* =============================
 * LIST
 * ============================= */

export async function listNews(
  locale?: Locale,
  opts?: { tag?: string; year?: number; month?: number }
) {
  const rows: NewsRow[] = await prisma.entry.findMany({
    where: {
      kind: 'NEWS',
      status: 'PUBLISHED',
      deletedAt: null,
    },
    select: {
      id: true,
      slug: true,
      dates: true,
      props: true,
      coverMedia: { select: { url: true, meta: true } },
      locales: { select: { locale: true, title: true, data: true } },
      
      tags: {
        select: {
          tag: { select: { slug: true, name: true } },
        },
      },
    },
    orderBy: { updatedAt: 'desc' },
  })

  const tabs = buildTabs(rows, opts)

  let filtered = rows.filter(e => {
    const d = entryDate(e)
    if (!d) return false
    if (opts?.year && d.getUTCFullYear() !== opts.year) return false
    if (opts?.month && d.getUTCMonth() + 1 !== opts.month) return false
    return true
  })

  if (opts?.tag && opts.tag !== 'all') {
    filtered = filtered.filter(e =>
      e.tags.some(t => t.tag.slug === opts.tag)
    )
  }
  filtered.sort((a, b) => {
    const da = entryDate(a)?.getTime() ?? 0
    const db = entryDate(b)?.getTime() ?? 0
    return db - da // newest first
  })

  const items: NewsItemCard[] = filtered.map(e => {
  const s = getScrapedProps(e.props)
  const r = getDatesRange(e.dates)
  const d = entryDate(e)

  const localeOrder: Locale[] =
    locale === 'FA' ? ['FA', 'EN'] : ['EN', 'FA']

  const localeData =
    e.locales.find(l => l.locale === localeOrder[0]) ??
    e.locales.find(l => l.locale === localeOrder[1])

  const summary =
    localeData?.data?.sections
      ?.find((sec: any) => sec.key === 'ARTICLE')
      ?.blocks?.find((b: any) => b.type === 'INFO')
      ?.text ?? null

  return {
    id: e.id,
    slug: e.slug,
    title: pickTitle(e.locales, locale, e.slug),
    artistName: s.artistName ?? '',
    artistSlug: s.artistSlug ?? null,
    dateString: s.publishDate ?? s.dateString ?? null,
    startDate: s.startDate ?? r?.start ?? null,
    endDate: s.endDate ?? r?.end ?? null,
    thumb: e.coverMedia?.meta?.thumb ?? e.coverMedia?.url ?? null,
    year: yearOf(d),
    summary,
  }
})


  return {
    tabs,
    filters: {
      tag: opts?.tag ?? 'all',
      year: opts?.year ?? null,
      month: opts?.month ?? null,
    },
    items,
  }
}


/* -----------------------------
 * DETAIL (slug page)
 * Returns locales + media + localized captions + dates + scraped props
 * ----------------------------- */
export async function getNewsItem(slug: string, locale?: Locale) {
  const entry = await prisma.entry.findFirst({
    where: {
      kind: 'NEWS-ITEM',
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
      coverMedia: {
        select: {
          url: true,
          caption: true,
          meta: true,
        },
      },
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
        orderBy: { ord: 'asc' },
      },
      tags: {
        select: {
          tag: {
            select: {
              slug: true,
              name: true,
              locale: true,
            },
          },
        },
      },
    },
  })

  if (!entry) return null

  /* -----------------------------
   * Locale ordering
   * ----------------------------- */

  const localeOrder: Locale[] =
    locale === 'FA' ? ['FA', 'EN'] : ['EN', 'FA']

  const localesSorted = [...entry.locales].sort(
    (a, b) =>
      localeOrder.indexOf(a.locale) -
      localeOrder.indexOf(b.locale)
  )

  const finalLocales = locale
    ? localesSorted.filter(l => l.locale === locale)
    : localesSorted

  /* -----------------------------
   * Scraped props
   * ----------------------------- */

  const scraped =
    typeof entry.props === 'object' &&
    entry.props !== null &&
    'scraped' in entry.props
      ? (entry.props as { scraped?: { props?: Record<string, any> } }).scraped
          ?.props ?? {}
      : {}
  const unresolved =
    typeof entry.props === 'object' &&
    entry.props !== null &&
    'unresolvedLinks' in entry.props
      ? (entry.props as { unresolvedLinks?: Record<string, any> }).unresolvedLinks ?? {}
      : {}

  const artistSlug: string | null =
    scraped.artistSlug ?? unresolved.artistSlug ?? null

  const artistName: string =
    scraped.artistName ?? ''

  /* -----------------------------
   * Cover
   * ----------------------------- */

  const coverMeta = (entry.coverMedia?.meta as any) ?? null

  const cover = entry.coverMedia
    ? {
        url: entry.coverMedia.url,
        thumb: coverMeta?.thumb ?? entry.coverMedia.url,
        caption: entry.coverMedia.caption ?? null,
        meta: coverMeta,
      }
    : null

  /* -----------------------------
   * Media (localized captions)
   * ----------------------------- */

  const media = entry.media.map(em => {
    const emMeta = em.meta as any
    const mMeta = em.media.meta as any

    const caption =
      locale === 'FA'
        ? emMeta?.captionFa ?? mMeta?.captionFa ?? em.media.caption
        : emMeta?.captionEn ?? mMeta?.captionEn ?? em.media.caption

    return {
      id: em.id,
      role: em.role,
      ord: em.ord ?? null,
      meta: emMeta ?? null,
      media: {
        url: em.media.url,
        kind: em.media.kind,
        alt: em.media.alt,
        caption,
        thumb: emMeta?.thumb ?? mMeta?.thumb ?? null,
        meta: mMeta ?? null,
      },
    }
  })

  /* -----------------------------
   * Tags (locale-aware)
   * ----------------------------- */

  const tags = entry.tags
    .map(t => t.tag)
    .filter(t => !t.locale || t.locale === locale)

  return {
    id: entry.id,
    kind: 'NEWS-ITEM' as const,
    slug: entry.slug,
    status: entry.status,
    dates: entry.dates ?? null,
    props: entry.props ?? null,
    coverMedia: cover,
    locales: finalLocales,
    artist: {
      name: artistName,
      slug: artistSlug,
    },
    media,
    tags,
  }
}
