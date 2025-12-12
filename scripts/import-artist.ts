// scripts/import-artist.ts
import { PrismaClient, Locale, Status } from '@prisma/client'
import fetch from 'node-fetch'
import { load } from 'cheerio'

const prisma = new PrismaClient()

type ArtistLink = {
  slug: string
  nameEn: string
}

/**
 * Fetch /en/artists and extract all artist links.
 * We grab all anchors whose href looks like /en/artists/{slug}.
 */
async function fetchEnArtistLinks(): Promise<ArtistLink[]> {
  const res = await fetch('https://ogallery.net/en/artists')
  if (!res.ok) {
    throw new Error(`Failed to fetch /en/artists: ${res.status} ${res.statusText}`)
  }

  const html = await res.text()
  const $ = load(html)

  const seen = new Set<string>()
  const artists: ArtistLink[] = []

  $('a[href]').each((_, el) => {
    const href = ($(el).attr('href') || '').trim()
    const text = $(el).text().trim()
    if (!href || !text) return

    // normalize to absolute URL to be safe
    let url: URL
    try {
      url = new URL(href, 'https://ogallery.net')
    } catch {
      return
    }

    const path = url.pathname // e.g. /en/artists/donya-h-aalipour
    const parts = path.split('/').filter(Boolean)

    // match: /en/artists/{slug}
    if (parts.length === 3 && parts[0] === 'en' && parts[1] === 'artists') {
      const slug = parts[2]
      if (!slug) return

      if (seen.has(slug)) return
      seen.add(slug)

      artists.push({ slug, nameEn: text })
    }
  })

  console.log(`Found ${artists.length} EN artists`)
  return artists
}

/**
 * Get localized title (H1) for a given slug and locale.
 * For EN:  /en/artists/slug
 * For FA:  /fa/artists/slug
 */
async function fetchArtistTitle(locale: Locale, slug: string): Promise<string | null> {
  const prefix = locale === 'EN' ? 'en' : 'fa'
  const url = `https://ogallery.net/${prefix}/artists/${slug}`

  const res = await fetch(url)
  if (!res.ok) {
    console.warn(`Failed to fetch ${url}: ${res.status} ${res.statusText}`)
    return null
  }

  const html = await res.text()
  const $ = load(html)

  // The page structure is basically:
  //   # Donya Aalipour   (or Persian name)
  // so grab the first h1/h2 in main content
  const heading =
    $('h1').first().text().trim() ||
    $('h2').first().text().trim() ||
    $('h3').first().text().trim()

  return heading || null
}

async function upsertArtistEntry(slug: string, nameEn: string) {
  // Try to get EN + FA titles (fallback FA → null)
  const [titleEn, titleFa] = await Promise.all([
    fetchArtistTitle('EN', slug),
    fetchArtistTitle('FA', slug),
  ])

  const finalTitleEn = titleEn || nameEn
  const finalTitleFa = titleFa || null

  // 1) Upsert Entry (kind, slug) is unique
  const entry = await prisma.entry.upsert({
    where: {
      kind_slug: {
        kind: 'ARTIST',
        slug,
      },
    },
    update: {
      status: Status.PUBLISHED,
      // you can also set props/jsonld/seo/etc here if you want
    },
    create: {
      kind: 'ARTIST',
      slug,
      status: Status.PUBLISHED,
    },
  })

  // 2) Upsert EN locale
  await prisma.entryLocale.upsert({
    where: {
      entryId_locale: {
        entryId: entry.id,
        locale: 'EN',
      },
    },
    update: {
      title: finalTitleEn,
    },
    create: {
      entryId: entry.id,
      locale: 'EN',
      title: finalTitleEn,
    },
  })

  // 3) Upsert FA locale (optional if we actually got a title)
  if (finalTitleFa) {
    await prisma.entryLocale.upsert({
      where: {
        entryId_locale: {
          entryId: entry.id,
          locale: 'FA',
        },
      },
      update: {
        title: finalTitleFa,
      },
      create: {
        entryId: entry.id,
        locale: 'FA',
        title: finalTitleFa,
      },
    })
  }

  console.log(`Imported ARTIST ${slug}: EN="${finalTitleEn}" FA="${finalTitleFa || '–'}"`)
}

async function main() {
  const artists = await fetchEnArtistLinks()

  for (const artist of artists) {
    await upsertArtistEntry(artist.slug, artist.nameEn)
  }

  console.log('Done importing artists.')
}

main()
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
