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

export type ScrapeKind = 'ARTIST' | 'EXHIBITION';

export type ScraperConfig = {
  type: 'ARTIST' | 'EXHIBITION';
  baseUrl: string;
  
  paths: {
    list: string;
    detail: (slug: string, locale: Locale) => string;
  };
  
  selectors: {
    listItems: string;
    title: string;
    
    // --- NEW OPTIONAL SELECTORS ---
    artistLink?: string;  // e.g., 'h2 a[href]'
    dateString?: string;  // e.g., 'h5'
    // ----------------------------
    
    // Bio/Body Section Configuration (Handles the complex find logic)
    body: {
      // 1. Preferred method (e.g., specific ID for Artist, null for Exhibition)
        preferredId: string | null;
        headingTags: string[];
        keywords: { [key in Locale]: string[] };
        contentWrapper: string;

        // NEW
        sectionKey: string;   // e.g. 'BIO', 'PRESS_RELEASE'
    };

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
        const text = $(el).text().trim();
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
private async scrapeMetadata(slug: string): Promise<Record<string, any>> {
    const url = this.abs(this.config.paths.detail(slug, 'EN' as Locale));
    if (!url) return {};

    const props: Record<string, any> = {};
    
    const artistSelector = this.config.selectors.artistLink;
    const dateSelector = this.config.selectors.dateString;

    if (!artistSelector && !dateSelector) return {};
    
    this.log('info', `[META] Fetching metadata from ${url}`);

    try {
        const html = await $fetch<string>(url);
        const $ = load(html);
        
        // 1. Scrape Artist Link/Slug (Unchanged)
        if (artistSelector) {
            const artistEl = $(artistSelector).first();
            const href = artistEl.attr('href') || '';
            
            if (href) {
                const parts = new URL(href, this.config.baseUrl).pathname.split('/').filter(Boolean);
                const artistSlug = parts.pop();
                const artistName = artistEl.text().trim();

                if (artistSlug && artistName) {
                    props.artistSlug = artistSlug;
                    props.artistName = artistName;
                }
            }
        }
        
        // 2. Scrape Date String AND Extract Range (FIXED LOGIC)
        if (dateSelector) {
            const dateString = $(dateSelector).first().text().trim();
            if (dateString) {
                props.dateString = dateString; // Keep raw string
                
                // Regex to match "Month Day1 - Day2 Year" (e.g., "December 5 - 19 2025")
                const match = dateString.match(/([a-zA-Z]+)\s*(\d+)\s*-\s*(\d+)\s*(\d{4})/);
                
                if (match) {
                    const [, monthName, dayStart, dayEnd, year] = match;
                    
                    // Helper function to reliably get a UTC date object from the string
                    const getUTCDate = (month: string, day: string, yr: string): Date | null => {
                        const date = new Date(`${month} ${day}, ${yr}`);
                        if (isNaN(date.getTime())) return null;
                        // Force a UTC Date at midnight for the given day
                        return new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
                    };

                    const startDate = getUTCDate(monthName, dayStart, year);
                    const endDate = getUTCDate(monthName, dayEnd, year);

                    if (startDate && endDate) {
                        props.startDate = startDate.toISOString();
                        props.endDate = endDate.toISOString();
                    } else {
                        this.log('warn', `[META] Failed to parse date components: ${dateString}`);
                    }
                } else {
                     this.log('warn', `[META] Date string did not match expected range format: ${dateString}`);
                }
            }
        }

    } catch (e: any) {
        this.log('error', `[META] Failed to scrape metadata`, e.message);
    }

    return props;
}

// server/lib/ogallery/engine.ts

  async scrapeDetail(slug: string): Promise<ScrapeResult> {
    this.logs = []; // Reset logs for this run
    this.log('info', `Starting rich scrape for ${this.config.type}/${slug}`);

    // Call scrapeMetadata along with scrapeLocale and scrapeMedia
    const [enLocale, faLocaleRaw, media, metadata] = await Promise.all([
      this.scrapeLocale(slug, 'EN' as Locale),
      this.scrapeLocale(slug, 'FA' as Locale),
      this.scrapeMedia(slug), 
      this.scrapeMetadata(slug), 
    ]);

    // Merge: Apply EN data if FA failed to find it
    const faLocale: ScrapedLocale = {
    ...faLocaleRaw,
    bodyHtml: faLocaleRaw.bodyHtml || enLocale.bodyHtml,
    sections: faLocaleRaw.sections?.length
        ? faLocaleRaw.sections
        : enLocale.sections,
    cvUrl: faLocaleRaw.cvUrl || enLocale.cvUrl,
    portfolioUrl: faLocaleRaw.portfolioUrl || enLocale.portfolioUrl,
    };

    const sourceUrlEn = this.config.paths.detail(slug, 'EN' as Locale);
    const sourceUrlFa = this.config.paths.detail(slug, 'FA' as Locale);

    const result: ScrapedRich = {
      slug,
      kind: this.config.type,
      sourceUrlEn: this.abs(sourceUrlEn) || '',
      sourceUrlFa: this.abs(sourceUrlFa) || '',
      locales: [enLocale, faLocale],
      works: media.works,
      installations: media.installations,
      props: metadata,
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

        if (workSel) {
            $(workSel.container).each((_i, el) => {
                const fullUrl = this.abs($(el).attr('href') || null);
                if (!fullUrl) return;

                const img = $(el).find('img').first();
                const thumbUrl = this.abs(img.attr('src') || img.attr('data-src') || null);
                const caption = $(el).attr(workSel.captionAttr) || null;

                works.push({
                    full: fullUrl,
                    thumb: thumbUrl,
                    caption,
                });
            });
        }
        return { works };
    } catch (e) {
        return { works: [] };
    }
  }
}