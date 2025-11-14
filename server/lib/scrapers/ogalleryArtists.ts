// server/lib/scrapers/ogalleryArtists.ts
import fetch from 'node-fetch'
import { load } from 'cheerio'
import {type Element} from 'cheerio'
import type { Locale } from '@prisma/client'

const BASE = 'https://ogallery.net'

function abs(url: string | null | undefined): string | null {
  if (!url) return null
  if (url.startsWith('//')) return 'https:' + url
  if (url.startsWith('http://') || url.startsWith('https://')) return url
  return new URL(url, BASE).toString()
}

export type ScrapedArtistListItem = {
  slug: string
  nameEn: string
  urlEn: string
  urlFa: string
}

export type ScrapedWork = {
  full: string
  thumb: string | null
  captionEn: string | null
  captionFa: string | null
}



export type ScrapedInstallation = {
  full: string
}

export type ScrapedArtistLocale = {
  slug: string
  locale: Locale
  title: string | null
  bioHtml: string | null
  cvUrl: string | null
  portfolioUrl: string | null
}

export type ScrapedArtistRich = {
  slug: string
  sourceUrlEn: string
  sourceUrlFa: string
  locales: ScrapedArtistLocale[]
  works: ScrapedWork[]
  installations: ScrapedInstallation[]
}

/**
 * Fast: just fetch /en/artists and return list of artists.
 */
export async function fetchEnArtistLinks(): Promise<ScrapedArtistListItem[]> {
  const res = await fetch(`${BASE}/en/artists`)
  if (!res.ok) {
    throw new Error(`Failed to fetch /en/artists: ${res.status} ${res.statusText}`)
  }

  const html = await res.text()
  const $ = load(html)

  const seen = new Set<string>()
  const artists: ScrapedArtistListItem[] = []

  $('a[href]').each((_i, el) => {
    const href = ($(el).attr('href') || '').trim()
    const text = $(el).text().trim()
    if (!href || !text) return

    let url: URL
    try {
      url = new URL(href, BASE)
    } catch {
      return
    }

    const path = url.pathname
    const parts = path.split('/').filter(Boolean)

    // match /en/artists/{slug}
    if (parts.length === 3 && parts[0] === 'en' && parts[1] === 'artists') {
      const slug = parts[2]
      if (!slug) return
      if (seen.has(slug)) return
      seen.add(slug)

      artists.push({
        slug,
        nameEn: text,
        urlEn: `${BASE}/en/artists/${slug}`,
        urlFa: `${BASE}/fa/artists/${slug}`,
      })
    }
  })

  return artists
}

/**
 * Scrape a single artist page for a given locale (structure-based, EN + FA).
 */
async function scrapeArtistPage(slug: string, locale: Locale): Promise<ScrapedArtistLocale> {
  const prefix = locale === 'EN' ? 'en' : 'fa'
  const url = `${BASE}/${prefix}/artists/${slug}`

  const res = await fetch(url)
  if (!res.ok) {
    return {
      slug,
      locale,
      title: null,
      bioHtml: null,
      cvUrl: null,
      portfolioUrl: null,
    }
  }

  const html = await res.text()
  const $ = load(html)

  // 1) Title from header-page h1 (works for both EN + FA)
  const title =
    $('.header-page h1').first().text().trim() ||
    $('h1').first().text().trim() ||
    null

  let bioHtml: string | null = null
  let cvUrl: string | null = null
  let portfolioUrl: string | null = null

  // 2) Find the "bio" row robustly.
  // Preferred: #bio + next .row that actually contains an <h2>
  let bioRow = $('#bio')
    .nextAll('.row')
    .filter((_i: number, el: Element) => $(el).find('h2').length > 0)
    .first()

  // Fallback: any .row whose h2 text is "Bio" or Persian "زندگی‌نامه"
  if (!bioRow.length) {
    bioRow = $('.row')
      .filter((_i: number, el: Element) => {
        const h2 = $(el).find('h2').first()
        if (!h2.length) return false
        const raw = h2.text().replace(/\s+/g, ' ').trim()
        const normalized = raw.replace(/\u200c/g, '') // strip ZWJ for "زندگی‌نامه"
        return /bio/i.test(raw) || normalized.includes('زندگینامه')
      })
      .first()
  }

  if (bioRow.length) {
    // 3) Bio HTML:
    //    Use all <p> elements inside the main col-12. This avoids the
    //    Google-Translate wrapper divs (tw-*) and keeps only actual text.
    const bioCol = bioRow.find('.col-12').last()
    const ps = bioCol.find('p')

    if (ps.length) {
      bioHtml = ps
        .map((_i, el) => $.html(el))
        .get()
        .join('')
        .trim()
    } else {
      const raw = bioCol.html()
      bioHtml = raw ? raw.trim() : null
    }

    // 4) CV link: right .col-6 with text-end class, pick PDF whose href has "cv"
    const rightCol = bioRow
      .find('.col-6')
      .filter((_i: number, el: Element) => {
        const cls = ($(el).attr('class') || '')
        return /text-end/.test(cls) || /text-md-end/.test(cls)
      })
      .first()

    const cvLink = rightCol
      .find('a[href$=".pdf"]')
      .filter((_i: number, el: Element) => {
        const href = ($(el).attr('href') || '').toLowerCase()
        return href.includes('cv') // catches *-CV-En.pdf, *-CV--Fa.pdf, etc
      })
      .first()

    const genericPdf = rightCol.find('a[href$=".pdf"]').first()

    const cvHref =
      (cvLink.length ? cvLink.attr('href') : undefined) ||
      (genericPdf.length ? genericPdf.attr('href') : undefined) ||
      null

    cvUrl = abs(cvHref)
  }

  // 5) Portfolio: any PDF whose href contains "portfolio" anywhere on the page
  const portfolioLink = $('a[href$=".pdf"]')
    .filter((_i: number, el: Element) => {
      const href = ($(el).attr('href') || '').toLowerCase()
      return href.includes('portfolio')
    })
    .first()

  if (portfolioLink.length) {
    portfolioUrl = abs(portfolioLink.attr('href') || null)
  }

  return {
    slug,
    locale,
    title: title || null,
    bioHtml,
    cvUrl,
    portfolioUrl,
  }
}


async function scrapeWorksForLocale(
  slug: string,
  locale: Locale,
): Promise<{ works: { full: string; thumb: string | null; caption: string | null }[] }> {
  const prefix = locale === 'EN' ? 'en' : 'fa'
  const url = `${BASE}/${prefix}/artists/${slug}`

  const res = await fetch(url)
  if (!res.ok) {
    return { works: [] }
  }

  const html = await res.text()
  const $ = load(html)

  const works: { full: string; thumb: string | null; caption: string | null }[] = []

  $('a[rel="works"]').each((_i, el) => {
    const fullUrl = abs($(el).attr('href') || null)
    if (!fullUrl) return

    const img = $(el).find('img').first()
    const thumbUrl = abs(img.attr('src') || img.attr('data-src') || null)
    const caption = $(el).attr('data-caption') || null

    works.push({
      full: fullUrl,
      thumb: thumbUrl,
      caption,
    })
  })

  return { works }
}

/**
 * Scrape works and installations from the EN page (usually shared across locales).
 */
async function scrapeWorksAndInstallations(slug: string): Promise<{
  works: ScrapedWork[]
  installations: ScrapedInstallation[]
}> {
  // 1) scrape works per locale
  const [enRes, faRes] = await Promise.all([
    scrapeWorksForLocale(slug, 'EN'),
    scrapeWorksForLocale(slug, 'FA'),
  ])

  // index FA works by full URL so we can merge with EN
  const faByFull = new Map<string, { full: string; thumb: string | null; caption: string | null }>()
  for (const w of faRes.works) {
    if (w.full) faByFull.set(w.full, w)
  }

  const merged: ScrapedWork[] = []

  for (const en of enRes.works) {
    const fa = faByFull.get(en.full)

    merged.push({
      full: en.full,
      thumb: en.thumb || fa?.thumb || null,
      captionEn: en.caption || null,
      captionFa: fa?.caption || null,
    })
  }

  // If there are FA-only works not present in EN, you can decide to append them too:
  for (const fa of faRes.works) {
    if (!merged.find(w => w.full === fa.full)) {
      merged.push({
        full: fa.full,
        thumb: fa.thumb,
        captionEn: null,
        captionFa: fa.caption || null,
      })
    }
  }

  // 2) installations: still from EN page
  const url = `${BASE}/en/artists/${slug}`
  const res = await fetch(url)
  if (!res.ok) {
    return { works: merged, installations: [] }
  }
  const html = await res.text()
  const $ = load(html)

  const installations: ScrapedInstallation[] = []
  $('#installation-SlideShow img').each((_i, el) => {
    const src = abs($(el).attr('src') || $(el).attr('data-src') || null)
    if (!src) return
    installations.push({ full: src })
  })

  return { works: merged, installations }
}

/**
 * Full rich scrape for ONE artist, with EN+FA + works + installations.
 */
export async function scrapeArtistRich(slug: string): Promise<ScrapedArtistRich> {
  const [enLocale, faLocaleRaw, media] = await Promise.all([
    scrapeArtistPage(slug, 'EN'),
    scrapeArtistPage(slug, 'FA'),
    scrapeWorksAndInstallations(slug),
  ])

  const faLocale: ScrapedArtistLocale = {
    ...faLocaleRaw,
    bioHtml: faLocaleRaw.bioHtml || enLocale.bioHtml,
    cvUrl: faLocaleRaw.cvUrl || enLocale.cvUrl,
    portfolioUrl: faLocaleRaw.portfolioUrl || enLocale.portfolioUrl,
  }

  return {
    slug,
    sourceUrlEn: `${BASE}/en/artists/${slug}`,
    sourceUrlFa: `${BASE}/fa/artists/${slug}`,
    locales: [enLocale, faLocale],
    works: media.works,
    installations: media.installations,
  }
}

