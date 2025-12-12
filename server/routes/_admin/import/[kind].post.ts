import { defineEventHandler, readBody, createError, getRouterParam } from 'h3'
import { prisma } from '~~/server/lib/prisma'
import { Status, type Locale } from '@prisma/client'
import type { ScrapedRich } from '~~/server/lib/ogallery/engine'

type ImportPayload = {
  data: ScrapedRich
  status?: Status
  kind?: string
}

const ROUTE_KIND_MAP: Record<string, string> = {
  artists: 'ARTIST',
  artist: 'ARTIST',
  exhibitions: 'EXHIBITION',
  exhibition: 'EXHIBITION',
}

function normalizeKind(input: unknown): string {
  const raw = String(input || '').trim()
  if (!raw) return ''
  const lower = raw.toLowerCase()
  const mapped = ROUTE_KIND_MAP[lower]
  if (mapped) return mapped

  const upper = raw.toUpperCase()
  if (!/^[A-Z0-9_]+$/.test(upper)) return ''
  return upper
}

function normalizeLocale(input: any): Locale | null {
  if (input === 'EN') return 'EN'
  if (input === 'FA') return 'FA'
  return null
}

function safeIso(input: any): string | null {
  const s = typeof input === 'string' ? input : null
  if (!s) return null
  const d = new Date(s)
  return isNaN(d.getTime()) ? null : d.toISOString()
}

function uniq(strings: (string | null | undefined)[]): string[] {
  return [...new Set(strings.filter(Boolean) as string[])]
}

export default defineEventHandler(async (event) => {
  const paramKind = getRouterParam(event, 'kind')
  const body = await readBody<ImportPayload>(event)

  if (!body?.data?.slug) {
    throw createError({ statusCode: 400, statusMessage: 'Missing payload data.slug' })
  }

  const scraped = body.data
  const finalKind =
    normalizeKind(paramKind) ||
    normalizeKind(body.kind) ||
    normalizeKind(scraped.kind)

  if (!finalKind) {
    throw createError({
      statusCode: 400,
      statusMessage: `Invalid kind: "${paramKind || body.kind || scraped.kind}"`,
    })
  }

  const status = body.status ?? Status.PUBLISHED
  const locales = Array.isArray(scraped.locales) ? scraped.locales : []
  const enLoc = locales.find((l: any) => l.locale === 'EN') ?? locales[0]

  // ----------------------------
  // 0) Prepare Media (NO TX)
  // ----------------------------
  const cvUrl = enLoc?.cvUrl ?? null
  const portfolioUrl = enLoc?.portfolioUrl ?? null

  const workUrls = (scraped.works ?? []).map((w) => w?.full)
  const installationUrls = (scraped.installations ?? []).map((i) => i?.full)

  const allMediaUrls = uniq([cvUrl, portfolioUrl, ...workUrls, ...installationUrls])

  // Existing
  const existingMedia = allMediaUrls.length
    ? await prisma.media.findMany({
        where: { url: { in: allMediaUrls } },
        select: { id: true, url: true },
      })
    : []
  const existingByUrl = new Map(existingMedia.map((m) => [m.url, m.id]))

  // Create missing in bulk
  const missingUrls = allMediaUrls.filter((u) => !existingByUrl.has(u))
  if (missingUrls.length) {
    await prisma.media.createMany({
      data: missingUrls.map((url) => ({
        url,
        kind: url === cvUrl || url === portfolioUrl ? 'DOCUMENT' : 'IMAGE',
        meta: {
          source: 'ogallery',
          role:
            url === cvUrl ? 'CV'
            : url === portfolioUrl ? 'PORTFOLIO'
            : installationUrls.includes(url) ? 'INSTALLATION'
            : workUrls.includes(url) ? 'SELECTED_WORK'
            : 'UNKNOWN',
        },
      })),
      skipDuplicates: true,
    })
  }

  // Re-read IDs (complete mapping)
  const mediaRows = allMediaUrls.length
    ? await prisma.media.findMany({
        where: { url: { in: allMediaUrls } },
        select: { id: true, url: true },
      })
    : []
  const mediaIdByUrl = new Map(mediaRows.map((m) => [m.url, m.id]))

  // IMPORTANT: do NOT do N Media.update calls here if you have many works.
  // Put captions/thumbs into EntryMedia.meta; keep Media.caption optional.

  // ----------------------------
  // 1) Upsert Entry (NO TX)
  // ----------------------------
  const entry = await prisma.entry.upsert({
    where: { kind_slug: { kind: finalKind, slug: scraped.slug } },
    update: { status },
    create: { kind: finalKind, slug: scraped.slug, status },
  })

  // Read current props/dates once (NO TX) to merge safely
  const current = await prisma.entry.findUnique({
    where: { id: entry.id },
    select: { props: true, dates: true },
  })

  const startDate = safeIso((scraped as any)?.props?.startDate)
  const endDate = safeIso((scraped as any)?.props?.endDate)

  const mergedProps = {
    ...(current?.props as any ?? {}),
    // keep stable top-level props
    sourceUrlEn: scraped.sourceUrlEn,
    sourceUrlFa: scraped.sourceUrlFa,
    // keep everything scraped in a namespaced object to avoid collisions
    scraped: {
      kind: scraped.kind,
      props: scraped.props ?? {},
      importedAt: new Date().toISOString(),
    },
  }

  const mergedDates =
    startDate || endDate || (scraped as any)?.props?.dateString
      ? {
          ...(current?.dates as any ?? {}),
          range: {
            start: startDate,
            end: endDate,
            raw: (scraped as any)?.props?.dateString ?? null,
            precision: 'day',
            timezone: 'UTC',
          },
        }
      : (current?.dates as any ?? null)

  // ----------------------------
  // 2) Build all dependent writes, then batch $transaction([...])
  //    (NOT interactive, Accelerate-safe)
  // ----------------------------
  const ops: any[] = []

  // Entry update (props/dates)
  ops.push(
    prisma.entry.update({
      where: { id: entry.id },
      data: { props: mergedProps, dates: mergedDates },
    }),
  )

  // EntryMedia rebuild
  const managedRoles = ['CV', 'PORTFOLIO', 'SELECTED_WORK', 'INSTALLATION']

  const entryMediaToCreate: {
    entryId: number
    mediaId: number
    role: string
    ord: number
    meta?: any
  }[] = []

  let ord = 0

  if (cvUrl) {
    const id = mediaIdByUrl.get(cvUrl)
    if (id) entryMediaToCreate.push({ entryId: entry.id, mediaId: id, role: 'CV', ord: ord++ })
  }

  if (portfolioUrl) {
    const id = mediaIdByUrl.get(portfolioUrl)
    if (id) entryMediaToCreate.push({ entryId: entry.id, mediaId: id, role: 'PORTFOLIO', ord: ord++ })
  }

  for (const w of scraped.works ?? []) {
    if (!w?.full) continue
    const id = mediaIdByUrl.get(w.full)
    if (!id) continue
    entryMediaToCreate.push({
      entryId: entry.id,
      mediaId: id,
      role: 'SELECTED_WORK',
      ord: ord++,
      meta: {
        thumb: w.thumb ?? null,
        captionEn: w.captionEn ?? null,
        captionFa: w.captionFa ?? null,
      },
    })
  }

  for (const inst of scraped.installations ?? []) {
    if (!inst?.full) continue
    const id = mediaIdByUrl.get(inst.full)
    if (!id) continue
    entryMediaToCreate.push({
      entryId: entry.id,
      mediaId: id,
      role: 'INSTALLATION',
      ord: ord++,
    })
  }

  ops.push(
    prisma.entryMedia.deleteMany({
      where: { entryId: entry.id, role: { in: managedRoles } },
    }),
  )

  if (entryMediaToCreate.length) {
    ops.push(
      prisma.entryMedia.createMany({
        data: entryMediaToCreate.map((r) => ({
          entryId: r.entryId,
          mediaId: r.mediaId,
          role: r.role,
          ord: r.ord,
          meta: r.meta ?? undefined,
        })),
        skipDuplicates: true,
      }),
    )
  }

  // coverMediaId (choose first work else first installation)
  const cover =
    entryMediaToCreate.find((em) => em.role === 'SELECTED_WORK') ??
    entryMediaToCreate.find((em) => em.role === 'INSTALLATION')

  if (cover) {
    ops.push(
      prisma.entry.update({
        where: { id: entry.id },
        data: { coverMediaId: cover.mediaId },
      }),
    )
  }

  // Locales: store ALL locale fields
  for (const loc of locales) {
    const locale = normalizeLocale(loc?.locale)
    if (!locale) continue

    const localeData = {
      sourceUrl: locale === 'EN' ? scraped.sourceUrlEn : scraped.sourceUrlFa,
      cvUrl: loc.cvUrl ?? null,
      portfolioUrl: loc.portfolioUrl ?? null,
      bodyText: (loc as any).bodyText ?? null,
      sections: (loc as any).sections ?? null,
    }

    ops.push(
      prisma.entryLocale.upsert({
        where: { entryId_locale: { entryId: entry.id, locale } },
        update: {
          slug: entry.slug,
          title: loc.title ?? null,
          bodyHtml: loc.bodyHtml ?? null,
          data: localeData,
        },
        create: {
          entryId: entry.id,
          locale,
          slug: entry.slug,
          title: loc.title ?? null,
          bodyHtml: loc.bodyHtml ?? null,
          data: localeData,
        },
      }),
    )
  }

  // Optional: Link EXHIBITION -> ARTIST if artist exists
  if (finalKind === 'EXHIBITION' && scraped.props?.artistSlug) {
    ops.push(prisma.link.deleteMany({ where: { fromId: entry.id, role: 'ARTIST' } }))

    // This findUnique cannot be inside the array transaction, because we need its result.
    // Do it before pushing a create op.
    const artist = await prisma.entry.findUnique({
      where: { kind_slug: { kind: 'ARTIST', slug: scraped.props.artistSlug } },
      select: { id: true },
    })

    if (artist) {
      ops.push(
        prisma.link.create({
          data: { fromId: entry.id, toId: artist.id, role: 'ARTIST', ord: 0 },
        }),
      )
    } else {
      // keep breadcrumb (optional)
      ops.push(
        prisma.entry.update({
          where: { id: entry.id },
          data: {
            props: {
              ...(mergedProps as any),
              unresolvedLinks: {
                ...((mergedProps as any).unresolvedLinks ?? {}),
                artistSlug: scraped.props.artistSlug,
              },
            },
          },
        }),
      )
    }
  }

  // Execute atomically (batch transaction, NOT interactive)
  await prisma.$transaction(ops)

  return { ok: true, entryId: entry.id, kind: finalKind }
})
