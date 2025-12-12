// server/routes/_admin/ogallery-exhibitions/index.post.ts
import { defineEventHandler, readBody, createError } from 'h3'
import { prisma } from '~~/server/lib/prisma'
import type { ScrapedExhibitionRich } from '~~/server/lib/scrapers/ogalleryExhibitions'
import { Status, type Locale } from '@prisma/client'

type ImportPayload = {
  // You can send the full scraped object from the admin UI
  exhibition: ScrapedExhibitionRich
  status?: Status
}

export default defineEventHandler(async (event) => {
  const body = await readBody<ImportPayload>(event)
  if (!body?.exhibition || !body.exhibition.slug) {
    throw createError({ statusCode: 400, statusMessage: 'Missing exhibition payload' })
  }

  const { exhibition } = body
  const status = body.status ?? Status.PUBLISHED

  // 1) Upsert Entry
  const entry = await prisma.entry.upsert({
    where: {
      kind_slug: {
        kind: 'ARTIST',
        slug: exhibition.slug,
      },
    },
    update: {
      status,
      // store some structural references in props
      props: {
        sourceUrlEn: exhibition.sourceUrlEn,
        sourceUrlFa: exhibition.sourceUrlFa,
      },
    },
    create: {
      kind: 'ARTIST',
      slug: exhibition.slug,
      status,
      props: {
        sourceUrlEn: exhibition.sourceUrlEn,
        sourceUrlFa: exhibition.sourceUrlFa,
      },
    },
  })

  // Helper: upsert Media by URL
  async function upsertMedia(url: string, extra: Partial<Parameters<typeof prisma.media.create>[0]['data']> = {}) {
    return prisma.media.upsert({
      where: { url },
      update: {
        ...extra,
      },
      create: {
        url,
        ...extra,
      },
    })
  }

  // 2) Handle CV + installations + works -> Media + EntryMedia
  const entryMediaToCreate: {
    entryId: number
    mediaId: number
    role: string
    ord: number
    meta?: {}
  }[] = []

  let ord = 0

  // CV and portfolio as media (optional)
  const enLocale = exhibition.locales.find(l => l.locale === 'EN' as Locale)
  if (enLocale?.cvUrl) {
    const m = await upsertMedia(enLocale.cvUrl, { kind: 'DOCUMENT' })
    entryMediaToCreate.push({
      entryId: entry.id,
      mediaId: m.id,
      role: 'CV',
      ord: ord++,
    })
  }

  // Works
  for (const w of exhibition.works) {
    const m = await upsertMedia(w.full, {
      kind: 'IMAGE',
      caption: w.captionEn || w.captionFa || null,
    })

    
    entryMediaToCreate.push({
      entryId: entry.id,
      mediaId: m.id,
      role: 'SELECTED_WORK',
      ord: ord++,
      meta: {
        captionEn: w.captionEn,
        captionFa: w.captionFa,
      },

    })
  }

  // Installations
  for (const inst of exhibition.installations) {
    const m = await upsertMedia(inst.full, {
      kind: 'IMAGE',
    })
    entryMediaToCreate.push({
      entryId: entry.id,
      mediaId: m.id,
      role: 'INSTALLATION',
      ord: ord++,
    })
  }

  // 3) Bulk create EntryMedia (wipe existing of these roles first to keep it clean)
  await prisma.entryMedia.deleteMany({
    where: {
      entryId: entry.id,
      role: { in: ['CV', 'SELECTED_WORK', 'INSTALLATION'] },
    },
  })

  if (entryMediaToCreate.length) {
    await prisma.entryMedia.createMany({
      data: entryMediaToCreate,
      skipDuplicates: true,
    })
  }

  // 4) Set coverMediaId to first SELECTED_WORK
  const firstWorkLink = entryMediaToCreate.find(em => em.role === 'SELECTED_WORK')
  if (firstWorkLink) {
    await prisma.entry.update({
      where: { id: entry.id },
      data: { coverMediaId: firstWorkLink.mediaId },
    })
  }

  // 5) Upsert EntryLocale for EN + FA
  for (const loc of exhibition.locales) {
    const locale = loc.locale as Locale

    await prisma.entryLocale.upsert({
      where: {
        entryId_locale: {
          entryId: entry.id,
          locale,
        },
      },
      update: {
        slug: entry.slug,
        title: loc.title ?? undefined,
        bodyHtml: loc.bioHtml ?? undefined,
        data: {
          works: exhibition.works,
          installations: exhibition.installations,
          cvUrl: loc.cvUrl,
          portfolioUrl: loc.portfolioUrl,
          sourceUrl: locale === 'EN' ? exhibition.sourceUrlEn : exhibition.sourceUrlFa,
        },
      },
      create: {
        slug: entry.slug,
        entryId: entry.id,
        locale,
        title: loc.title ?? undefined,
        bodyHtml: loc.bioHtml ?? undefined,
        data: {
          works: exhibition.works,
          installations: exhibition.installations,
          cvUrl: loc.cvUrl,
          portfolioUrl: loc.portfolioUrl,
          sourceUrl: locale === 'EN' ? exhibition.sourceUrlEn : exhibition.sourceUrlFa,
        },
      },
    })
  }

  return {
    ok: true,
    entryId: entry.id,
  }
})

