// server/queries/artists.ts
import { prisma } from '~~/server/lib/prisma'
import { Prisma } from '@prisma/client'
import type { Locale } from '@prisma/client'

/**
 * Lightweight list of artists
 */
export async function listArtists(locale?: Locale) {
  const rows = await prisma.$queryRaw<
    {
      id: number
      slug: string
      title: string | null
      url: string | null
      kind: string
    }[]
  >(Prisma.sql`
    SELECT e.id,
           e.slug,
           e.kind,
           COALESCE(l.title, '(Untitled)') AS title,
           m.url
    FROM "Entry" e
    LEFT JOIN "EntryLocale" l
      ON l."entryId" = e.id
      ${locale ? Prisma.sql`AND l.locale = ${locale}::"Locale"` : Prisma.empty}
    LEFT JOIN "Media" m
      ON m.id = e."coverMediaId"
    WHERE e.kind IN ('ARTIST', 'EXHIBITED-ARTIST')
      AND e.status = 'PUBLISHED'
    ORDER BY e."updatedAt" DESC
  `)

  const base = rows.map(r => ({
    id: r.id,
    slug: r.slug,
    name: r.title ?? '(Untitled)',
    lastName: r.title?.split(' ')[1] ?? '',
    image: r.url,
    kind: r.kind,
  }))

  const artists = base.filter(r => r.kind === 'ARTIST')
  const exhibited = base.filter(r => r.kind === 'EXHIBITED-ARTIST')

  return {
    artists: artists.map(({ kind, ...rest }) => rest),
    exhibited: exhibited.map(({ kind, ...rest }) => rest),
  }
}


/**
 * Fetch full artist record with locales and media
 */
export async function getArtist(slug: string, locale?: Locale) {
  // 1. Fetch base artist record
  const artist = await prisma.$queryRaw<
    { id: string; slug: string }[]
  >(Prisma.sql`
    SELECT e.id, e.slug
    FROM "Entry" e
    WHERE e.slug = ${slug}
      AND e.status = 'PUBLISHED'
    LIMIT 1
  `)

  if (artist.length === 0) return null
  const artistId = artist[0].id

  // 2. Fetch locales without duplication
  const locales = await prisma.$queryRaw<
    { locale: string; title: string | null; bodyHtml: string | null }[]
  >(Prisma.sql`
    SELECT l.locale, l.title, l."bodyHtml"
    FROM "EntryLocale" l
    WHERE l."entryId" = ${artistId}
      ${locale ? Prisma.sql`AND l.locale = ${locale}::"Locale"` : Prisma.empty}
  `)

  // 3. Fetch media ordered (now includes em.meta)
  const media = await prisma.$queryRaw<
    {
      ord: number
      role: string
      url: string
      kind: string
      alt: string | null
      caption: string | null
      meta: Prisma.JsonValue | null
    }[]
  >(Prisma.sql`
    SELECT em.ord,
           em.role,
           em.meta,
           m.url,
           m.kind,
           m.alt,
           m.caption
    FROM "EntryMedia" em
    INNER JOIN "Media" m ON m.id = em."mediaId"
    WHERE em."entryId" = ${artistId}
    ORDER BY em.ord ASC
  `)

  // 4. Combine final structured result
  return {
    id: artistId,
    slug: artist[0].slug,
    locales: locales.map(l => ({
      locale: l.locale,
      title: l.title,
      bodyHtml: l.bodyHtml,
    })),
    media: media.map(m => ({
      ord: m.ord,
      role: m.role,
      meta: m.meta, // 👈 pass raw meta through so FE can pick captionEn/captionFa
      media: {
        url: m.url,
        kind: m.kind,
        alt: m.alt,
        caption: m.caption, // usually EN / default caption
      },
    })),
  }
}
/**
 * Fetch full artist record with locales and media
 */
export async function getArtistById(id: number, locale?: Locale) {
  // 1. Fetch base artist record
  const artist = await prisma.$queryRaw<
    { id: string; slug: string }[]
  >(Prisma.sql`
    SELECT e.id, e.slug
    FROM "Entry" e
    WHERE e.id = ${id}
      AND e.status = 'PUBLISHED'
    LIMIT 1
  `)

  if (artist.length === 0) return null
  const artistId = artist[0].id

  // 2. Fetch locales without duplication
  const locales = await prisma.$queryRaw<
    { locale: string; title: string | null; bodyHtml: string | null }[]
  >(Prisma.sql`
    SELECT l.locale, l.title, l."bodyHtml"
    FROM "EntryLocale" l
    WHERE l."entryId" = ${artistId}
      ${locale ? Prisma.sql`AND l.locale = ${locale}::"Locale"` : Prisma.empty}
  `)

  // 3. Fetch media ordered (with meta)
  const media = await prisma.$queryRaw<
    {
      ord: number
      role: string
      url: string
      kind: string
      alt: string | null
      caption: string | null
      meta: Prisma.JsonValue | null
    }[]
  >(Prisma.sql`
    SELECT em.ord,
           em.role,
           em.meta,
           m.url,
           m.kind,
           m.alt,
           m.caption
    FROM "EntryMedia" em
    INNER JOIN "Media" m ON m.id = em."mediaId"
    WHERE em."entryId" = ${artistId}
    ORDER BY em.ord ASC
  `)

  // 4. Combine final structured result
  return {
    id: artistId,
    slug: artist[0].slug,
    locales: locales.map(l => ({
      locale: l.locale,
      title: l.title,
      bodyHtml: l.bodyHtml,
    })),
    media: media.map(m => ({
      ord: m.ord,
      role: m.role,
      meta: m.meta,
      media: {
        url: m.url,
        kind: m.kind,
        alt: m.alt,
        caption: m.caption,
      },
    })),
  }
}
