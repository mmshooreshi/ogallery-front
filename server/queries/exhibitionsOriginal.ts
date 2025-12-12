// server/queries/exhibitionsOriginal.ts

import { prisma } from '~~/server/lib/prisma'
import { Prisma } from '@prisma/client'
import type { Locale } from '@prisma/client'

/**
 * Lightweight list of exhibitions
 */
export async function listExhibitions(locale?: Locale) {
  const rows = await prisma.$queryRaw<
    { id: string; slug: string; title: string | null; subtitle: string | null; url: string | null }[]
  >(Prisma.sql`
    SELECT e.id,
           e.slug,
           COALESCE(l.title, '(Untitled)') AS title,
           l.subtitle,
           m.url
    FROM "Entry" e
    LEFT JOIN "EntryLocale" l
      ON l."entryId" = e.id
      ${locale ? Prisma.sql`AND l.locale = ${locale}::"Locale"` : Prisma.empty}
    LEFT JOIN "Media" m
      ON m.id = e."coverMediaId"
    WHERE e.kind = 'EXHIBITION'
      AND e.status = 'PUBLISHED'
    ORDER BY e."updatedAt" DESC
  `)

  return rows.map(r => ({
    id: r.id,
    slug: r.slug,
    name: r.title,
    subtitle: r.subtitle,
    coverImage: r.url,
  }))
}

/**
 * Fetch full exhibition record with locales, media, and linked artists
 */
export async function getExhibition(slug: string, locale?: Locale) {
  // 1. Fetch base exhibition record
  const exhibition = await prisma.$queryRaw<
    { id: string; slug: string; dates: any; props: any }[]
  >(Prisma.sql`
    SELECT e.id, e.slug, e.dates, e.props
    FROM "Entry" e
    WHERE e.kind = 'EXHIBITION'
      AND e.slug = ${slug}
      AND e.status = 'PUBLISHED'
    LIMIT 1
  `)

  if (exhibition.length === 0) return null
  const exhibitionId = exhibition[0].id

  // 2. Fetch locales (title, subtitle, bodyHtml, etc.)
  const locales = await prisma.$queryRaw<
    { locale: string; title: string | null; subtitle: string | null; bodyHtml: string | null }[]
  >(Prisma.sql`
    SELECT l.locale, l.title, l.subtitle, l."bodyHtml"
    FROM "EntryLocale" l
    WHERE l."entryId" = ${exhibitionId}
      ${locale ? Prisma.sql`AND l.locale = ${locale}::"Locale"` : Prisma.empty}
  `)

  // 3. Fetch media ordered
  const media = await prisma.$queryRaw<
    {
      ord: number
      role: string
      url: string
      kind: string
      alt: string | null
      caption: string | null
    }[]
  >(Prisma.sql`
    SELECT em.ord, em.role, m.url, m.kind, m.alt, m.caption
    FROM "EntryMedia" em
    INNER JOIN "Media" m ON m.id = em."mediaId"
    WHERE em."entryId" = ${exhibitionId}
    ORDER BY em.ord ASC
  `)

  // 4. Fetch linked artists (via Link)
  const artists = await prisma.$queryRaw<
    { id: string; slug: string; title: string | null; url: string | null }[]
  >(Prisma.sql`
    SELECT a.id, a.slug,
           COALESCE(al.title, '(Untitled)') AS title,
           am.url
    FROM "Link" link
    INNER JOIN "Entry" a
      ON a.id = link."toId"
     AND a.kind = 'ARTIST'
     AND a.status = 'PUBLISHED'
    LEFT JOIN "EntryLocale" al
      ON al."entryId" = a.id
      ${locale ? Prisma.sql`AND al.locale = ${locale}::"Locale"` : Prisma.empty}
    LEFT JOIN "Media" am
      ON am.id = a."coverMediaId"
    WHERE link."fromId" = ${exhibitionId}
      AND link.role = 'PARTICIPATES_IN'
    ORDER BY link.ord ASC NULLS LAST
  `)

  // 5. Combine into structured result
  return {
    id: exhibitionId,
    slug: exhibition[0].slug,
    dates: exhibition[0].dates,
    props: exhibition[0].props,
    locales: locales.map(l => ({
      locale: l.locale,
      title: l.title,
      subtitle: l.subtitle,
      bodyHtml: l.bodyHtml,
    })),
    media: media.map(m => ({
      ord: m.ord,
      role: m.role,
      media: {
        url: m.url,
        kind: m.kind,
        alt: m.alt,
        caption: m.caption,
      },
    })),
    artists: artists.map(a => ({
      id: a.id,
      slug: a.slug,
      name: a.title,
      coverImage: a.url,
    })),
  }
}
