import { prisma } from '~~/server/lib/prisma'
import { Prisma } from '@prisma/client'
import type { Locale } from '@prisma/client'

// lightweight list
export async function listArtists(locale?: Locale) {
  const rows = await prisma.$queryRaw<
    { id: string; slug: string; title: string | null; url: string | null }[]
  >(Prisma.sql`
    SELECT e.id,
           e.slug,
           COALESCE(l.title, '(Untitled)') AS title,
           m.url
    FROM "Entry" e
    LEFT JOIN "EntryLocale" l
      ON l."entryId" = e.id
     ${locale ? Prisma.sql`AND l.locale = ${locale}::"Locale"` : Prisma.empty}
    LEFT JOIN "Media" m
      ON m.id = e."coverMediaId"
    WHERE e.kind = 'ARTIST'
      AND e.status = 'PUBLISHED'
    ORDER BY e."updatedAt" DESC
  `)

  return rows.map(r => ({
    id: r.id,
    slug: r.slug,
    name: r.title,
    image: r.url,
  }))
}

export async function getArtist(slug: string, locale?: Locale) {
  const rows = await prisma.$queryRaw<
    {
      entry_id: string
      entry_slug: string
      locale: string | null
      title: string | null
      body: string | null
      media_ord: number | null
      media_role: string | null
      media_url: string | null
      media_kind: string | null
      media_alt: string | null
      media_caption: string | null
    }[]
  >(Prisma.sql`
    SELECT e.id          AS entry_id,
           e.slug        AS entry_slug,
           l.locale      AS locale,
           l.title       AS title,
           l."bodyHtml"  AS body,
           em.ord        AS media_ord,
           em.role       AS media_role,
           m.url         AS media_url,
           m.kind        AS media_kind,
           m.alt         AS media_alt,
           m.caption     AS media_caption
    FROM "Entry" e
    LEFT JOIN "EntryLocale" l
      ON l."entryId" = e.id
     ${locale ? Prisma.sql`AND l.locale = ${locale}::"Locale"` : Prisma.empty}
    LEFT JOIN "EntryMedia" em
      ON em."entryId" = e.id
    LEFT JOIN "Media" m
      ON m.id = em."mediaId"
    WHERE e.kind = 'ARTIST'
      AND e.slug = ${slug}
      AND e.status = 'PUBLISHED'
    ORDER BY em.ord ASC
  `)

  if (rows.length === 0) return null

  const first = rows[0]

  return {
    id: first.entry_id,
    slug: first.entry_slug,
    locales: rows
      .filter(r => r.title !== null || r.body !== null)
      .map(r => ({
        locale: r.locale!,
        title: r.title,
        bodyHtml: r.body,
      })),
    media: rows
      .filter(r => r.media_url !== null)
      .map(r => ({
        ord: r.media_ord!,
        role: r.media_role,
        media: {
          url: r.media_url!,
          kind: r.media_kind,
          alt: r.media_alt,
          caption: r.media_caption, 
        },
      })),
  }
}
