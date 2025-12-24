// server/routes/_admin/import/[kind].post.ts
import { defineEventHandler, readBody, createError, getRouterParam } from "h3";
import { prisma } from "~~/server/lib/prisma";
import { Status, type Locale } from "@prisma/client";
import type { ScrapedRich } from "~~/server/lib/ogallery/engine";

type ImportPayload = {
  data: ScrapedRich;
  status?: Status;
  kind?: string;
  tagIds?: number[];
};

const ROUTE_KIND_MAP: Record<string, string> = {
  // Artists
  "artists": "ARTIST",
  "artist": "ARTIST",
  // Exhibitions
  "exhibitions": "EXHIBITION",
  "exhibition": "EXHIBITION",
  // News
  "news": "NEWS",
  "newsitem": "NEWS",
  // Viewing Rooms
  "viewing-rooms": "VIEWING_ROOM",
  "viewing-room": "VIEWING_ROOM",
  // Window
  "window": "WINDOW",
  // Studio
  "studio": "STUDIO",
  // Publications
  "publications": "PUBLICATION",
  "publication": "PUBLICATION"
};

function normalizeKind(input: unknown): string {
  const raw = String(input || "").trim();
  if (!raw) return "";
  const lower = raw.toLowerCase();
  const mapped = ROUTE_KIND_MAP[lower];
  if (mapped) return mapped;
  // Fallback to uppercased raw string if it looks like a valid key
  const upper = raw.toUpperCase();
  if (!/^[A-Z0-9_]+$/.test(upper)) return "";
  return upper;
}

function normalizeLocale(input: any): Locale | null {
  if (input === "EN") return "EN";
  if (input === "FA") return "FA";
  return null;
}

function safeIso(input: any): string | null {
  const s = typeof input === "string" ? input : null;
  if (!s) return null;
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d.toISOString();
}

function uniq(strings: (string | null | undefined)[]): string[] {
  return [...new Set(strings.filter(Boolean) as string[])];
}

export default defineEventHandler(async (event) => {
  const paramKind = getRouterParam(event, "kind");
  const body = await readBody<ImportPayload>(event);
  
  if (!body?.data?.slug) {
    throw createError({ statusCode: 400, statusMessage: "Missing payload data.slug" });
  }

  const scraped = body.data;

  // 1. Determine Kind
  const finalKind =
    normalizeKind(paramKind) ||
    normalizeKind(body.kind) ||
    normalizeKind(scraped.kind);

  if (!finalKind) {
    throw createError({ statusCode: 400, statusMessage: `Invalid kind: "${paramKind || body.kind || scraped.kind}"` });
  }

  // 2. Prepare Data
  const status = body.status ?? Status.PUBLISHED;
  const locales = Array.isArray(scraped.locales) ? scraped.locales : [];
  const enLoc = locales.find((l: any) => l.locale === "EN") ?? locales[0];

  // 3. Extract URLs (Media Preparation)
  // Fallback: If cvUrl is missing in locale, check props (common in Publications)
  const cvUrl = enLoc?.cvUrl ?? (scraped.props as any)?.pdfUrl ?? null;
  const portfolioUrl = enLoc?.portfolioUrl ?? null;
  const featuredImageUrl = (scraped.props as any)?.featuredImage?.url ?? null;

  const workUrls = (scraped.works ?? []).map((w) => w?.full);
  const installationUrls = (scraped.installations ?? []).map((i) => i?.full);

  const allMediaUrls = uniq([
    featuredImageUrl,
    cvUrl,
    portfolioUrl,
    ...workUrls,
    ...installationUrls,
  ]);

  // 4. Create Missing Media (Bulk)
  const existingMedia = allMediaUrls.length
    ? await prisma.media.findMany({
        where: { url: { in: allMediaUrls } },
        select: { id: true, url: true },
      })
    : [];
  const existingByUrl = new Map(existingMedia.map((m) => [m.url, m.id]));

  const missingUrls = allMediaUrls.filter((u) => !existingByUrl.has(u));
  if (missingUrls.length) {
    await prisma.media.createMany({
      data: missingUrls.map((url) => ({
        url,
        kind: url === featuredImageUrl ? "IMAGE" : 
              (url === cvUrl || url === portfolioUrl) ? "DOCUMENT" : "IMAGE",
        meta: {
          source: "ogallery",
          role: url === cvUrl ? "CV" : 
                url === portfolioUrl ? "PORTFOLIO" : 
                installationUrls.includes(url) ? "INSTALLATION" : 
                workUrls.includes(url) ? "SELECTED_WORK" : 
                (url === featuredImageUrl ? "FEATURED" : "UNKNOWN"),
        },
      })),
      skipDuplicates: true,
    });
  }

  // Reload IDs to get the newly created ones
  const mediaRows = allMediaUrls.length
    ? await prisma.media.findMany({
        where: { url: { in: allMediaUrls } },
        select: { id: true, url: true },
      })
    : [];
  const mediaIdByUrl = new Map(mediaRows.map((m) => [m.url, m.id]));

  // 5. Upsert Entry (No Transaction yet to get ID)
  const entry = await prisma.entry.upsert({
    where: { kind_slug: { kind: finalKind, slug: scraped.slug } },
    update: { status },
    create: { kind: finalKind, slug: scraped.slug, status },
  });

  // 6. Handle Tags
  if (body.tagIds?.length) {
    await prisma.entryTag.createMany({
      data: body.tagIds.map((tagId) => ({
        entryId: entry.id,
        tagId,
      })),
      skipDuplicates: true,
    });
  }

  // 7. Prepare Props & Dates
  const current = await prisma.entry.findUnique({
    where: { id: entry.id },
    select: { props: true, dates: true },
  });

  const startDate = safeIso((scraped as any)?.props?.startDate);
  const endDate = safeIso((scraped as any)?.props?.endDate);
  // For publications/news, often just a single date
  const publishDateIso = safeIso(scraped.props?.publishDate);

  const mergedProps = {
    ...((current?.props as any) ?? {}),
    sourceUrlEn: scraped.sourceUrlEn,
    sourceUrlFa: scraped.sourceUrlFa,
    status: scraped.props?.status,
    // Store raw scraped data for reference
    scraped: {
      kind: scraped.kind,
      props: scraped.props ?? {},
      importedAt: new Date().toISOString(),
    },
  };

  
  // Determine Date Range
  // If startDate exists, use it. If not, use publishDate as both start and end (Point in time).
  const finalStart = startDate ?? publishDateIso ?? null;
  const finalEnd = endDate ?? publishDateIso ?? null;

  const mergedDates =
    finalStart || finalEnd
      ? {
          ...(current?.dates as any ?? {}),
          range: {
            start: finalStart,
            end: finalEnd,
            raw: scraped.props?.publishDate ?? scraped.props?.dateString ?? null,
            precision: 'day',
            timezone: 'UTC',
          },
        }
      : (current?.dates as any ?? null);


  // 8. Build Transaction Operations
  const ops: any[] = [];

  // A) Update Entry Props/Dates
  ops.push(
    prisma.entry.update({
      where: { id: entry.id },
      data: { props: mergedProps, dates: mergedDates },
    })
  );

  // B) Rebuild EntryMedia
  const managedRoles = ["CV", "PORTFOLIO", "SELECTED_WORK", "INSTALLATION"];
  const entryMediaToCreate: {
    entryId: number;
    mediaId: number;
    role: string;
    ord: number;
    meta?: any;
  }[] = [];

  let ord = 0;

  // CV / PDF
  if (cvUrl) {
    const id = mediaIdByUrl.get(cvUrl);
    if (id) entryMediaToCreate.push({ entryId: entry.id, mediaId: id, role: "CV", ord: ord++ });
  }

  // Portfolio
  if (portfolioUrl) {
    const id = mediaIdByUrl.get(portfolioUrl);
    if (id) entryMediaToCreate.push({ entryId: entry.id, mediaId: id, role: "PORTFOLIO", ord: ord++ });
  }

  // Works
  for (const w of scraped.works ?? []) {
    if (!w?.full) continue;
    const id = mediaIdByUrl.get(w.full);
    if (!id) continue;
    entryMediaToCreate.push({
      entryId: entry.id,
      mediaId: id,
      role: "SELECTED_WORK",
      ord: ord++,
      meta: {
        thumb: w.thumb ?? null,
        captionEn: w.captionEn ?? null,
        captionFa: w.captionFa ?? null,
      },
    });
  }

  // Installations
  for (const inst of scraped.installations ?? []) {
    if (!inst?.full) continue;
    const id = mediaIdByUrl.get(inst.full);
    if (!id) continue;
    entryMediaToCreate.push({
      entryId: entry.id,
      mediaId: id,
      role: "INSTALLATION",
      ord: ord++,
    });
  }

  // Delete old managed media & insert new
  ops.push(prisma.entryMedia.deleteMany({ where: { entryId: entry.id, role: { in: managedRoles } } }));
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
      })
    );
  }

// C) Update Cover Media (SMART FALLBACKS)
  
  // 1. Try Featured Image from Props (Best)
  const featuredMediaId = featuredImageUrl ? mediaIdByUrl.get(featuredImageUrl) : null;
  
  // 2. Try First Work (Fallback)
  const firstWorkId = entryMediaToCreate.find(em => em.role === 'SELECTED_WORK')?.mediaId;
  
  // 3. Try First Installation (Last Resort)
  const firstInstallId = entryMediaToCreate.find(em => em.role === 'INSTALLATION')?.mediaId;

  // Pick the winner
  const coverId = featuredMediaId ?? firstWorkId ?? firstInstallId;

  if (coverId) {
    ops.push(
      prisma.entry.update({
        where: { id: entry.id },
        data: { coverMediaId: coverId },
      })
    );
  }

  // D) Update Locales
  for (const loc of locales) {
    const locale = normalizeLocale(loc?.locale);
    if (!locale) continue;

    // Build the data object for the locale
    const localeData = {
      sourceUrl: locale === "EN" ? scraped.sourceUrlEn : scraped.sourceUrlFa,
      cvUrl: loc.cvUrl ?? (locale === "EN" ? cvUrl : null), // Fallback to main CV if missing in EN locale
      portfolioUrl: loc.portfolioUrl ?? null,
      bodyText: (loc as any).bodyText ?? null,
      sections: (loc as any).sections ?? null,
    };

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
      })
    );
  }

  // E) Optional: Link Linking (e.g. Exhibition -> Artist)
  if (finalKind === "EXHIBITION" && scraped.props?.artistSlug) {
    ops.push(prisma.link.deleteMany({ where: { fromId: entry.id, role: "ARTIST" } }));
    
    // Find artist ID (must be done outside transaction to use result)
    const artist = await prisma.entry.findUnique({
      where: { kind_slug: { kind: "ARTIST", slug: scraped.props.artistSlug } },
      select: { id: true },
    });

    if (artist) {
      ops.push(
        prisma.link.create({
          data: { fromId: entry.id, toId: artist.id, role: "ARTIST", ord: 0 },
        })
      );
    }
  }

  // 9. Execute Transaction
  await prisma.$transaction(ops);

  return { ok: true, entryId: entry.id, kind: finalKind };
});