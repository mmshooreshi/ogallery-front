// server/lib/ogallery/engine.ts
import { load, type Cheerio, type Element } from 'cheerio';
import { $fetch } from 'ofetch';
import type { Locale } from '@prisma/client';

// --- Types ---

export interface ScrapeLog {
  level: 'info' | 'warn' | 'error';
  message: string;
  context?: any;
}

// Define a type for the list item (Must match data returned by fetchList)
export type ScrapedListItem = {
  slug: string
  nameEn: string
  sourceUrlEn: string // <-- Renamed to match ScrapedRich and external destination
  sourceUrlFa: string // <-- Renamed to match ScrapedRich and external destination
}

export type ScrapeKind = 'ARTIST' | 'EXHIBITION' | 'NEWS-ITEM' | 'VIEWING-ROOM' | 'WINDOW' | 'STUDIO' | 'PUBLICATION';

export type ScraperConfig = {
  type: ScrapeKind;
  baseUrl: string;
  
  paths: {
    list: string;
    detail: (slug: string, locale: Locale) => string;
  };
  
  selectors: {
    listItems: string;
    listName?: string; 
    title: string;
    customProps?: Record<string, string | { selector: string; regex: RegExp }>; // <--- Allow object    
    // --- NEW OPTIONAL SELECTORS ---
    artistLink?: string;  // e.g., 'h2 a[href]'
    dateString?: string;  // e.g., 'h5'
    // ----------------------------
    publishDate?: string;
    // Bio/Body Section Configuration (Handles the complex find logic)
    body: {
      // 1. Preferred method (e.g., specific ID for Artist, null for Exhibition)
        preferredId: string | null;
        headingTags: string[];
        keywords: { [key in Locale]: string[] };
        contentWrapper: string;
        paragraphSelector: string;
        // NEW
        sectionKey: string;   // e.g. 'BIO', 'PRESS_RELEASE'
    };
    metadata?: {
    container: string;
    fields?: Record<
        string,
        {
        match?: RegExp;
        position?: number;
        }
    >;
    };

    image?: {
      selector?: string,
      attr?: string,
      alt?: string,
    },

    // CV/Link Configuration (Handles finding external PDF links)
    cvLink: {
      rowSelector: string; // e.g., '.col-6'
      keywords: string[]; // e.g., ['cv', 'resume']
    } | null;
    
    // Portfolio Configuration (Handles finding a portfolio PDF link anywhere on the page)
    portfolioLink: {
      keywords: string[]; // e.g., ['portfolio']
    } | null;

    // Works/Media Configuration (Handles merged EN/FA captions)
    works: {
      container: string; // e.g., 'a[rel="works"]'
      captionAttr: string; // e.g., 'data-caption'
    };

    // Installations Configuration
    installations: {
      selector: string; // e.g., '#installation-SlideShow img'
    } | null;
  };
};

export type ScrapedContentBlock = {
  type: 'RICH_TEXT' | 'INFO';
  html: string;
  text: string;
};

export type ScrapedSection = {
  key: string;
  label: string;
  blocks: ScrapedContentBlock[];
};

export type ScrapedLocale = {
  slug: string;
  locale: Locale;
  title: string | null;

  bodyHtml: string | null;
  bodyText?: string | null;

  sections?: ScrapedSection[];

  cvUrl: string | null;
  portfolioUrl: string | null;
};

export type ScrapedWork = {
  full: string;
  thumb: string | null;
  captionEn: string | null;
  captionFa: string | null;
}


export type ScrapedRich = {
  slug: string;
  kind: ScrapeKind;
  sourceUrlEn: string;
  sourceUrlFa: string;
  locales: ScrapedLocale[];
  works: ScrapedWork[];
  installations: { full: string }[];
  
  // --- NEW FIELD ---
  props?: Record<string, any>; 
  // -----------------
}

export interface ScrapeResult {
  data: ScrapedRich;
  logs: ScrapeLog[];
}

// --- The Engine ---

export class OGalleryScraper {
  private config: ScraperConfig;
  private logs: ScrapeLog[] = [];

  constructor(config: ScraperConfig) {
    this.config = config;
  }

  public getLogs(): ScrapeLog[] { return this.logs; }

  private log(level: ScrapeLog['level'], message: string, context?: any) {
    this.logs.push({ level, message, context });
    if (level === 'error' || level === 'warn') {
      console.log(`[Scraper][${this.config.type}][${level}] ${message}`, context);
    }
  }

  private abs(url: string | null | undefined): string | null {
    if (!url) return null
    if (url.startsWith('//')) return 'https:' + url
    if (url.startsWith('http')) return url
    return new URL(url, this.config.baseUrl).toString()
  }
  
// Use existing fetchEnArtistLinks logic
// server/lib/ogallery/engine.ts (Revised fetchList method)

// Update the type signature of the return value:
async fetchList(): Promise<ScrapedListItem[]> {
    const url = `${this.config.baseUrl}${this.config.paths.list}`;
    this.log('info', `[LIST] Attempting to fetch HTML from ${url}`);

    try {
      const html = await $fetch<string>(url);
      console.log(url)
      const $ = load(html);
      const seen = new Set<string>();
      
      const items: ScrapedListItem[] = []; // <-- Use the new ScrapedListItem type

      const listElements = $(this.config.selectors.listItems);
      
      this.log('info', `[LIST] Selector "${this.config.selectors.listItems}" found ${listElements.length} elements.`);

listElements.each((_i, el) => {
        const href = ($(el).attr('href') || '').trim();
        // Default text from the link itself
        let text = $(el).text().trim();

        // FIX 1: If config has a specific selector for the list name, use it.
        // (Useful for Studio where the link is an image, and text is in a sibling <p>)
        if (this.config.selectors.listName) {
            // We search relative to the current element (el)
            // If selector starts with '+', we look at siblings
            if (this.config.selectors.listName.startsWith('+')) {
                const selector = this.config.selectors.listName.substring(1).trim();
                text = $(el).nextAll(selector).first().text().trim();
            } else {
                text = $(el).find(this.config.selectors.listName).text().trim();
            }
        }
        text = text.replace(/\s+/g, ' ').trim();
        if (!href || !text) return;

        let path: string;
        try {
          path = new URL(href, this.config.baseUrl).pathname;
        } catch {
          this.log('warn', `[LIST] Invalid URL found: ${href}`);
          return;
        }

        const parts = path.split('/').filter(Boolean);
        const expectedSegment = this.config.paths.list.split('/').filter(Boolean)[1].toLowerCase();

        // Match /en/type/{slug}
        if (parts.length === 3 && parts[0] === 'en' && parts[1].toLowerCase() === expectedSegment) {
          const slug = parts[2];
          if (slug && !seen.has(slug)) {
            seen.add(slug);
            
            // Calculate and include the URLs with consistent names
            const sourceUrlEn = this.abs(this.config.paths.detail(slug, 'EN' as Locale)) || '';
            const sourceUrlFa = this.abs(this.config.paths.detail(slug, 'FA' as Locale)) || '';

            items.push({ 
                slug, 
                nameEn: text, 
                sourceUrlEn, // <-- Correct Key
                sourceUrlFa  // <-- Correct Key
            });
          } else {
             this.log('info', `[LIST] Skipped href/text: ${href} | ${text} (Not a detail page or duplicate)`);
          }
        }
      });
      
      this.log('info', `[LIST] Successfully processed and found ${items.length} final items.`);
      return items;
    } catch (e: any) {
      this.log('error', `[LIST] Failed to fetch list or process HTML.`, e.message);
      return []; 
    }
  }
// server/lib/ogallery/engine.ts

/**
 * Scrapes non-locale-specific metadata (Artist, Dates) from the EN page.
 */
// server/lib/ogallery/engine.ts

private async scrapeMetadata(slug: string): Promise<Record<string, any>> {
  const url = this.abs(this.config.paths.detail(slug, 'EN' as Locale));
  if (!url) return {};

  const props: Record<string, any> = {};

  const dateSelector = this.config.selectors.dateString;
  const publishDateSel = this.config.selectors.publishDate;
  const imgSel = this.config.selectors.image?.selector;
  const imgAttr = this.config.selectors.image?.attr || 'src';
  const imgAltAttr = this.config.selectors.image?.alt || 'alt';

  // NEW: Get the CV/PDF configuration
  const cvConfig = this.config.selectors.cvLink;

  this.log('info', `[META] Fetching metadata from ${url}`);

  try {
    const html = await $fetch<string>(url);
    const $ = load(html);

// 1. Custom Props
    if (this.config.selectors.customProps) {
      for (const [key, selector] of Object.entries(this.config.selectors.customProps)) {
        // Handle Object configuration (Selector + Regex)
        if (typeof selector === 'object' && selector !== null) {
            const sel = (selector as any).selector;
            const regex = (selector as any).regex;
            
            const raw = $(sel).first().text().trim();
            if (raw) {
                if (regex) {
                    const match = raw.match(regex);
                    // If regex matches, use the first capturing group (or whole match)
                    if (match && match[1]) props[key] = match[1].trim();
                    else if (match) props[key] = match[0].trim();
                } else {
                    props[key] = raw;
                }
            }
        } 
        // Handle simple string selector
        else if (typeof selector === 'string') {
            const val = $(selector).first().text().replace(/\s+/g, ' ').trim();
            if (val) props[key] = val;
        }
      }
    }

    // 2. Publish date (e.g. h5)
    if (publishDateSel) {
      // Try multiple matches if the selector has commas
      const publishDate = $(publishDateSel).filter((_i, el) => $(el).text().trim().length > 0).first().text().trim();
      if (publishDate) props.publishDate = publishDate;
    }

    // 3. Featured image
    // 3. Featured image (UPDATED)
    if (imgSel) {
      const img = $(imgSel).first();
      let src = this.abs(img.attr(imgAttr) || img.attr('data-src') || null);
      let alt = (img.attr(imgAltAttr) || '').trim() || null;

      // --- FALLBACK: Try Open Graph Meta Tags if selector failed ---
      if (!src) {
        const ogImage = $('meta[property="og:image"]').attr('content');
        if (ogImage) {
            src = this.abs(ogImage);
            this.log('info', `[META] Found image via og:image: ${src}`);
        }
      }
      // -----------------------------------------------------------

      if (src) props.featuredImage = { url: src, alt };
    }

    // 4. PDF / Download Link (NEW)
    if (cvConfig) {
      // a) Try searching inside the specific container (rowSelector)
      const container = $(cvConfig.rowSelector);
      let pdfLink = container.find('a[href$=".pdf"]').filter((_i, el) => {
        const href = ($(el).attr('href') || '').toLowerCase();
        const text = $(el).text().toLowerCase();
        
        // If keywords are defined, at least one must match either href or text
        if (cvConfig.keywords && cvConfig.keywords.length > 0) {
           return cvConfig.keywords.some(k => href.includes(k) || text.includes(k));
        }
        return true; 
      }).first();

      // b) Fallback: Search the entire page if specific container failed
      if (!pdfLink.length) {
         pdfLink = $('a[href$=".pdf"]').first();
      }

      const pdfUrl = this.abs(pdfLink.attr('href'));
      
      if (pdfUrl) {
        props.pdfUrl = pdfUrl;
        this.log('info', `[META] Found PDF URL: ${pdfUrl}`);
      }
    }

    // 5. Event date range (e.g. h2 or h6)
    if (dateSelector) {
      const raw = $(dateSelector).first().text().replace(/\s+/g, ' ').trim();
      if (raw) {
        props.dateString = raw;
        const parsed = this.parseDateRange(raw);
        if (parsed.startIso && parsed.endIso) {
          props.startDate = parsed.startIso;
          props.endDate = parsed.endIso;
        }
      }
    }

    // 6. Artist links in body (Armory-style)
    const artists = this.extractArtistLinksForNews($);
    if (artists.length) {
      props.artists = artists;
    }

    // 7. Zakiehe-style event lines (div blocks after <p>)
    if (this.config.selectors.metadata?.container) {
      const lines = this.extractEventLinesForNews($, this.config.selectors.metadata.container);
      if (lines.length) props.eventLines = lines;

      // If dateString wasn't found via the main selector, try to find it in these lines
      if (!props.dateString) {
        const dateLine = lines.find((x) => /\d{4}/.test(x) && /-/.test(x)) || null;
        if (dateLine) {
          props.dateString = dateLine;
          const parsed = this.parseDateRange(dateLine);
          if (parsed.startIso && parsed.endIso) {
            props.startDate = parsed.startIso;
            props.endDate = parsed.endIso;
          }
        }
      }
    }

  } catch (e: any) {
    this.log('error', `[META] Failed to scrape metadata`, e.message);
  }

  return props;
}

private parseDateRange(raw: string): { startIso: string | null; endIso: string | null } {
  const s = (raw || '').replace(/\s+/g, ' ').trim()
  if (!s) return { startIso: null, endIso: null }

  // Month D - D YYYY  (September 4 - 7 2025)
  let m = s.match(/^([A-Za-z]+)\s+(\d{1,2})\s*-\s*(\d{1,2})\s+(\d{4})$/)
  if (m) {
    const [, month, d1, d2, y] = m
    const start = new Date(`${month} ${d1}, ${y}`)
    const end = new Date(`${month} ${d2}, ${y}`)
    if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
      const sIso = new Date(Date.UTC(start.getFullYear(), start.getMonth(), start.getDate())).toISOString()
      const eIso = new Date(Date.UTC(end.getFullYear(), end.getMonth(), end.getDate())).toISOString()
      return { startIso: sIso, endIso: eIso }
    }
  }

  // Month D - Month D YYYY (rare but support)
  m = s.match(/^([A-Za-z]+)\s+(\d{1,2})\s*-\s*([A-Za-z]+)\s+(\d{1,2})\s+(\d{4})$/)
  if (m) {
    const [, m1, d1, m2, d2, y] = m
    const start = new Date(`${m1} ${d1}, ${y}`)
    const end = new Date(`${m2} ${d2}, ${y}`)
    if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
      const sIso = new Date(Date.UTC(start.getFullYear(), start.getMonth(), start.getDate())).toISOString()
      const eIso = new Date(Date.UTC(end.getFullYear(), end.getMonth(), end.getDate())).toISOString()
      return { startIso: sIso, endIso: eIso }
    }
  }

  return { startIso: null, endIso: null }
}

private extractEventLinesForNews($: any, containerSel: string): string[] {
  // Handles Zakiehe-style block: <div>Venue</div><div>Opening...</div>...
  const container = $(containerSel).first()
  if (!container.length) return []

  const lines: string[] = []
  container.children('div').each((_i: number, el: any) => {
    const t = $(el).text().replace(/\s+/g, ' ').trim()
    if (t) lines.push(t)
  })
  return lines
}

private extractArtistLinksForNews($: any): Array<{ slug: string; name: string; href: string }> {
  const out: Array<{ slug: string; name: string; href: string }> = []
  const seen = new Set<string>()

  $('a[href]').each((_i: number, el: any) => {
    const href = ($(el).attr('href') || '').trim()
    if (!href) return

    let u: URL
    try { u = new URL(href, this.config.baseUrl) } catch { return }

    const parts = u.pathname.split('/').filter(Boolean)
    // /en/artists/{slug}
    if (parts.length === 3 && (parts[1] || '').toLowerCase() === 'artists') {
      const slug = parts[2]
      const name = $(el).text().replace(/\s+/g, ' ').trim()
      if (!slug || !name) return
      if (seen.has(slug)) return
      seen.add(slug)
      out.push({ slug, name, href: this.abs(href) || href })
    }
  })

  return out
}

// New helper to fetch price/metadata from the list page
  private async scrapeListMetadata(slug: string): Promise<Record<string, string>> {
    // Only for Studio (or configured types)
    if (this.config.type !== 'STUDIO') return {};

    const listUrl = `${this.config.baseUrl}${this.config.paths.list}`;
    try {
      const html = await $fetch<string>(listUrl);
      const $ = load(html);
      const extras: Record<string, string> = {};

      // Find the card linking to our slug
      // We look for: a[href*="/studio/slug"]
      const link = $(`a[href*="/studio/${slug}"]`).first();
      
      if (link.length) {
        // The price is in the sibling <p> tag: <p>Name <br> <span>Price</span></p>
        // Adjust selector based on the HTML structure you provided:
        // <p class="text-center ..."> Name <br> <span>25,000,000 T</span> </p>
        const priceText = link.parent().find('p span').text().trim();
        
        if (priceText) {
            extras.price = priceText;
            this.log('info', `[LIST-META] Found price: ${priceText}`);
        }
      }
      return extras;
    } catch (e) {
      return {};
    }
  }


async scrapeDetail(slug: string): Promise<ScrapeResult> {
  this.logs = []; 
  this.log('info', `Starting rich scrape for ${this.config.type}/${slug}`);

  // 1. Run all scrapers in parallel
  const [enLocale, faLocaleRaw, media, metadata, listExtras] = await Promise.all([
        this.scrapeLocale(slug, 'EN' as Locale),
        this.scrapeLocale(slug, 'FA' as Locale),
        this.scrapeMedia(slug),
        this.scrapeMetadata(slug),
        this.scrapeListMetadata(slug) // (This returns { price: "..." })
      ]);

  // 2. INTELLIGENT MERGE (The Fix)
  
  // A) Backfill PDF: If metadata found a PDF but locale didn't, use metadata's.
  if (metadata.pdfUrl) {
    if (!enLocale.cvUrl) enLocale.cvUrl = metadata.pdfUrl;
    if (!faLocaleRaw.cvUrl) faLocaleRaw.cvUrl = metadata.pdfUrl;
  }

  // B) Backfill Body: If sections exist but bodyHtml is empty, construct it.
  if (!enLocale.bodyHtml && enLocale.sections?.length) {
    enLocale.bodyHtml = enLocale.sections.map(s => 
      s.blocks.map(b => b.html).join('\n')
    ).join('\n');
    enLocale.bodyText = enLocale.sections.map(s => 
      s.blocks.map(b => b.text).join('\n')
    ).join('\n');
  }

  if (!faLocaleRaw.bodyHtml && faLocaleRaw.sections?.length) {
    faLocaleRaw.bodyHtml = faLocaleRaw.sections.map(s => 
      s.blocks.map(b => b.html).join('\n')
    ).join('\n');
    faLocaleRaw.bodyText = faLocaleRaw.sections.map(s => 
      s.blocks.map(b => b.text).join('\n')
    ).join('\n');
  }

  // C) Merge Locales (Apply EN fallback to FA)
  const faLocale: ScrapedLocale = {
    ...faLocaleRaw,
    bodyHtml: faLocaleRaw.bodyHtml || enLocale.bodyHtml,
    bodyText: faLocaleRaw.bodyText || enLocale.bodyText, // Ensure text falls back too
    sections: faLocaleRaw.sections?.length ? faLocaleRaw.sections : enLocale.sections,
    cvUrl: faLocaleRaw.cvUrl || enLocale.cvUrl,
    portfolioUrl: faLocaleRaw.portfolioUrl || enLocale.portfolioUrl,
  };

  const sourceUrlEn = this.config.paths.detail(slug, 'EN' as Locale);
  const sourceUrlFa = this.config.paths.detail(slug, 'FA' as Locale);
  const finalProps = { ...metadata, ...listExtras };
  const result: ScrapedRich = {
    slug,
    kind: this.config.type,
    sourceUrlEn: this.abs(sourceUrlEn) || '',
    sourceUrlFa: this.abs(sourceUrlFa) || '',
    locales: [enLocale, faLocale],
    works: media.works,
    installations: media.installations,
    props: finalProps,
  };

  return { data: result, logs: this.logs };
}
// server/lib/ogallery/engine.ts

private async scrapeLocale(
  slug: string,
  locale: Locale
): Promise<ScrapedLocale> {

  const prefix = locale === 'EN' ? 'EN' : 'FA';
  const url = this.abs(this.config.paths.detail(slug, prefix));

  if (!url) {
    return {
      slug,
      locale,
      title: null,
      bodyHtml: null,
      bodyText: null,
      sections: undefined,
      cvUrl: null,
      portfolioUrl: null,
    };
  }

  this.log('info', `[${locale}] Fetching detail from ${url}`);

  try {
    const html = await $fetch<string>(url);
    const $ = load(html);

    /* ----------------------------------
     * 1) TITLE
     * ---------------------------------- */
    const title =
      $(this.config.selectors.title).first().text().trim() || null;

    if (!title) {
      this.log('warn', `[${locale}] Could not find title.`);
    }

    let bodyHtml: string | null = null;
    let bodyText: string | null = null;
    let sections: ScrapedSection[] = [];
    let cvUrl: string | null = null;
    let portfolioUrl: string | null = null;

    const bodySel = this.config.selectors.body;
    const keywords = bodySel.keywords[locale];

    /* ----------------------------------
     * 2) FIND BODY ROW
     * ---------------------------------- */
    let bodyRow: Cheerio<Element> | null = null;

    // Strategy A — preferred ID
    if (bodySel.preferredId && $(bodySel.preferredId).length) {
      bodyRow = $(bodySel.preferredId)
        .nextAll('.row')
        .filter((_i, el) =>
          $(el).find(bodySel.headingTags.join(',')).length > 0
        )
        .first();

      if (bodyRow.length) {
        this.log(
          'info',
          `[${locale}] Found body row via preferred ID`
        );
      }
    }

    // Strategy B — header keyword match
    if (!bodyRow || !bodyRow.length) {
      bodyRow = $('.row')
        .filter((_i, el) => {
          const headers = $(el).find(
            bodySel.headingTags.join(',')
          );

          return headers.get().some(h => {
            const raw = $(h)
              .text()
              .replace(/\s+/g, ' ')
              .trim();

            const normalized = raw.replace(/\u200c/g, '');

            const match = keywords.some(k =>
              new RegExp(k, 'i').test(raw) ||
              new RegExp(k, 'i').test(normalized)
            );

            if (match) {
              this.log(
                'info',
                `[${locale}] Found section header: "${raw}"`
              );
            }

            return match;
          });
        })
        .first();
    }

    if (!bodyRow || !bodyRow.length) {
      this.log(
        'warn',
        `[${locale}] No body row found`,
        { keywords }
      );

      return {
        slug,
        locale,
        title,
        bodyHtml: null,
        bodyText: null,
        sections: undefined,
        cvUrl: null,
        portfolioUrl: null,
      };
    }

    /* ----------------------------------
     * 3) FULL BODY (DOCUMENT LEVEL)
     * ---------------------------------- */
    const contentCol = bodyRow.find(bodySel.contentWrapper).last();

    bodyHtml = contentCol.html()?.trim() || null;
    bodyText = contentCol
      .text()
      .replace(/\s+/g, ' ')
      .trim() || null;

    /* ----------------------------------
     * 4) SECTION SLICING (SEMANTIC)
     * ---------------------------------- */
    const headers = bodyRow
      .find(bodySel.headingTags.join(','))
      .filter((_i, el) => {
        const text = $(el).text().trim();
        return keywords.some(k =>
          new RegExp(k, 'i').test(text)
        );
      });

    headers.each((_i, headerEl) => {
      const label = $(headerEl).text().trim();
      const key = bodySel.sectionKey;

      const fragments: string[] = [];
      let current = $(headerEl).next();

      while (current.length) {
        if (current.is(bodySel.headingTags.join(','))) break;
        fragments.push($.html(current));
        current = current.next();
      }

      const sectionHtml = fragments.join('').trim();

      const blocks: ScrapedContentBlock[] = [];

      const $section = load(`<div>${sectionHtml}</div>`);  
      $section('p').each((_i, p) => {
      const text = $section(p).text().trim();  
      const isInfo =
          /MONDAY|TUESDAY|FRIDAY|SATURDAY|PM|AM|TELL|TEL|PHONE|خیابان|دوشنبه|جمعه/i.test(text);  
      blocks.push({
          type: isInfo ? 'INFO' : 'RICH_TEXT',
          html: $section.html(p) || '',
          text,
      });

      if (isInfo) {
        const phone = text.match(/(\+?\d[\d\s-]{7,})/)?.[1] || null;
        }

      });

      if (sectionHtml) {
        sections.push({
          key,
          label,
          blocks,
        });
      }
    });

    /* ----------------------------------
     * 5) CV LINK
     * ---------------------------------- */
    const cvSel = this.config.selectors.cvLink;
    if (cvSel) {
      const linkContainer = bodyRow
        .find(cvSel.rowSelector)
        .first();

      let cvLink = linkContainer
        .find('a[href$=".pdf"]')
        .filter((_i, el) => {
          const href = ($(el).attr('href') || '').toLowerCase();
          return cvSel.keywords.some(k => href.includes(k));
        })
        .first();

      if (!cvLink.length) {
        cvLink = linkContainer.find('a[href$=".pdf"]').first();
      }

      cvUrl = this.abs(cvLink.attr('href'));
    }

    /* ----------------------------------
     * 6) PORTFOLIO LINK
     * ---------------------------------- */
    const portfolioSel = this.config.selectors.portfolioLink;
    if (portfolioSel) {
      const portfolioLink = $('a[href$=".pdf"]')
        .filter((_i, el) => {
          const href = ($(el).attr('href') || '').toLowerCase();
          return portfolioSel.keywords.some(k =>
            href.includes(k)
          );
        })
        .first();

      portfolioUrl = this.abs(portfolioLink.attr('href'));
    }

    /* ----------------------------------
     * 7) FINAL RETURN
     * ---------------------------------- */
    return {
      slug,
      locale,
      title,
      bodyHtml,
      bodyText,
      sections: sections.length ? sections : undefined,
      cvUrl,
      portfolioUrl,
    };

  } catch (error: any) {
    this.log('error', `Failed to scrape ${locale}`, error.message);

    return {
      slug,
      locale,
      title: null,
      bodyHtml: null,
      bodyText: null,
      sections: undefined,
      cvUrl: null,
      portfolioUrl: null,
    };
  }
}

private async scrapeMedia(slug: string): Promise<{ works: ScrapedWork[], installations: { full: string }[] }> {
    const [enWorksRes, faWorksRes] = await Promise.all([
      this.scrapeWorksForLocale(slug, 'EN' as Locale),
      this.scrapeWorksForLocale(slug, 'FA' as Locale),
    ]);

    const faByFull = new Map<string, { full: string; caption: string | null }>();
    for (const w of faWorksRes.works) {
        if (w.full) faByFull.set(w.full, w)
    }

    const mergedWorks: ScrapedWork[] = enWorksRes.works.map(en => {
        const fa = faByFull.get(en.full);
        return {
            full: en.full,
            thumb: en.thumb,
            captionEn: en.caption || null,
            captionFa: fa?.caption || null,
        };
    });

    // Add FA-only works
    for (const fa of faWorksRes.works) {
        if (!mergedWorks.find(w => w.full === fa.full)) {
            mergedWorks.push({
                full: fa.full,
                thumb: fa.thumb,
                captionEn: null,
                captionFa: fa.caption || null,
            });
        }
    }
    
    this.log('info', `Merged ${mergedWorks.length} works.`);

    // 2) Installations (Scraped from EN page, always)
    const url = this.abs(this.config.paths.detail(slug, 'EN'));
    const installations: { full: string }[] = [];
    const installationSel = this.config.selectors.installations;

    // Check if installations configuration exists and URL is valid
    if (installationSel?.selector && url) {
        this.log('info', `[EN] Attempting to scrape installations using selector: ${installationSel.selector}`);
        try {
            const html = await $fetch<string>(url);
            const $ = load(html);
            
            // Use the correct property: 'selector'
            $(installationSel.selector).each((_i, el) => { 
                const src = this.abs($(el).attr('src') || $(el).attr('data-src') || null);
                if (src) installations.push({ full: src });
            });
            this.log('info', `Found ${installations.length} installations.`);
        } catch (e: any) {
             this.log('error', `Failed to scrape installations`, e.message);
        }
    } else {
         this.log('info', `Installation scraping skipped (no configuration or invalid URL).`);
    }
    
    return { works: mergedWorks, installations };
}


// server/lib/ogallery/engine.ts

// ... inside OGalleryScraper class ...

  private async scrapeWorksForLocale(
    slug: string,
    locale: Locale,
  ): Promise<{ works: { full: string; thumb: string | null; caption: string | null }[] }> {
    const prefix = locale === 'EN' ? 'EN' : 'FA'
    const url = this.abs(this.config.paths.detail(slug, prefix));
    
    if(!url) return { works: [] };

try {
        const html = await $fetch<string>(url);
        const $ = load(html);
        const works: { full: string; thumb: string | null; caption: string | null }[] = [];
        const workSel = this.config.selectors.works;

        const globalTitle = $(this.config.selectors.title).first().text().trim() || null;

        if (workSel) {
            $(workSel.container).each((_i, el) => {
                // FIX: Cast 'el' to 'Element' so TypeScript knows it has a tagName
                const element = el as Element; 

                let fullUrl: string | null = null;
                let thumbUrl: string | null = null;
                let caption: string | null = $(element).attr(workSel.captionAttr) || null;

                // Case A: Standard Gallery (<a> wrapper)
                if (element.tagName === 'a') {
                    fullUrl = this.abs($(element).attr('href') || null);
                    const img = $(element).find('img').first();
                    thumbUrl = this.abs(img.attr('src') || img.attr('data-src') || null);
                    if (!caption) caption = img.attr('alt') || null;
                }
                
                // Case B: Studio Carousel (Direct <img> tag)
                else if (element.tagName === 'img') {
                    fullUrl = this.abs($(element).attr('src') || $(element).attr('data-src') || null);
                    thumbUrl = fullUrl; 
                    if (!caption) caption = $(element).attr('alt') || null;
                }

                // Case C: Studio Carousel Wrapper (<div> containing <img>)
                else {
                    const img = $(element).find('img').first();
                    if (img.length) {
                        fullUrl = this.abs(img.attr('src') || img.attr('data-src') || null);
                        thumbUrl = fullUrl;
                        if (!caption) caption = img.attr('alt') || null;
                    }
                }

                // Viewing Room Caption Logic (if needed)
                if (!caption) {
                    caption = $(element).find('.caption').text().trim() || null;
                }

                // Fallback to Global Title
                if (!caption && globalTitle) {
                    caption = globalTitle; 
                }

                if (fullUrl) {
                    works.push({
                        full: fullUrl,
                        thumb: thumbUrl,
                        caption,
                    });
                }
            });
        }
        return { works };
    } catch (e) {
        return { works: [] };
    }
  }
}

