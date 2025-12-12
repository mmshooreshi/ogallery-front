// server/lib/ogallery/configs.ts

import type { ScraperConfig } from './engine';
import type { Locale } from '@prisma/client';

const BASE = 'https://ogallery.net';

// --------------------------------------------------------------------------
// ARTIST CONFIGURATION (Mirroring the logic from ogalleryArtists.ts)
// --------------------------------------------------------------------------
export const ArtistConfig: ScraperConfig = {
  type: 'ARTIST',
  baseUrl: BASE,
  
  paths: {
    list: '/en/artists',
    detail: (slug, locale) => `${BASE}/${locale.toLowerCase()}/artists/${slug}`,
  },
  
  selectors: {
    // Matches the general link gathering in fetchEnArtistLinks
    listItems: 'a[href]', 
    
    // Matches the title scraping logic
    title: '.header-page h1, h1',
    
    // Bio/Body Section (Complex logic from scrapeArtistPage)
    body: {
    preferredId: '#bio',
    headingTags: ['h2'],
    keywords: {
        EN: ['Bio'],
        FA: ['زندگی‌نامه', 'زندگینامه'],
    },
    contentWrapper: '.col-12',
    paragraphSelector: 'p',
    sectionKey: 'BIO',
    },


    // CV/Link Configuration (Corresponds to the right column logic)
    cvLink: {
      rowSelector: '.col-6', // Selector for the containing column
      keywords: ['cv', 'resume'], // Keywords for PDF href filter
    },
    
    // Portfolio Configuration (Corresponds to the page-wide search logic)
    portfolioLink: {
      keywords: ['portfolio'],
    },

    // Works/Media Configuration 
    works: {
      container: 'a[rel="works"]',
      captionAttr: 'data-caption'
    },

    // Installations Configuration 
    installations: {
      selector: '#installation-SlideShow img' // Correct property name 'selector'
    },
  },
};

// --------------------------------------------------------------------------
// EXHIBITION CONFIGURATION (Using confirmed selectors)
// --------------------------------------------------------------------------
export const ExhibitionConfig: ScraperConfig = {
  type: 'EXHIBITION',
  baseUrl: BASE,
  paths: {
    list: '/en/exhibitions/2021',
    detail: (slug, locale) => `${BASE}/${locale.toLowerCase()}/exhibitions/${slug}`,
  },
  selectors: {
    listItems: '.row a[href]',
    title: 'h1',
    
    // --- NEW SELECTORS FOR EXHIBITION DATA ---
    // Finds the <a> tag inside the <h2> that contains the artist name
    artistLink: 'h2 a[href]', 
    // Finds the <h5> that contains the date range
    dateString: 'h5', 
    // ------------------------------------------

    body: {
    preferredId: null,
    headingTags: ['h4', 'h2'],
    keywords: {
        EN: ['Press Release', 'Statement', 'Text'],
        FA: ['گزاره', 'بیانیه', 'متن'],
    },
    contentWrapper: '.col-12',
    paragraphSelector: 'p',
    sectionKey: 'PRESS_RELEASE',
    },

    
    cvLink: null,
    portfolioLink: null,
    
    works: {
      container: 'a[rel="works"]',
      captionAttr: 'data-caption'
    },
    installations: null,
  }
};

// --------------------------------------------------------------------------
// NEWS ITEM CONFIGURATION (FULL REVISION – HTML ACCURATE)
// --------------------------------------------------------------------------
export const NewsItemConfig: ScraperConfig = {
  type: 'NEWS-ITEM',
  baseUrl: BASE,

  paths: {
    list: '/en/news',
    detail: (slug, locale) => `${BASE}/${locale.toLowerCase()}/news/${slug}`,
  },

  selectors: {
    listItems: '.row a[href]',
    title: 'h1',

    // Metadata
    publishDate: 'h5',
    image: {
      selector: '.col-md-2 img',
      attr: 'src',
      alt: 'alt',
    },

    // ✅ FIXED BODY CONFIG
    body: {
        preferredId: null,

        // MUST NOT be empty
        headingTags: ['h1'],

        // keywords can be empty because we accept any h1
        keywords: {
            EN: ['.'],  // match anything
            FA: ['.'],
        },



      // ✅ THIS is the real article container
      contentWrapper: '.col-md-10 > div',

      // ✅ Paragraph-based extraction
      paragraphSelector: 'p',

      // Logical section name
      sectionKey: 'ARTICLE',
    },

    // NEWS has no CV / Portfolio
    cvLink: null,
    portfolioLink: null,

    works: {
      container: 'a[rel="works"]',
      captionAttr: 'data-caption',
    },

    installations: null,

    // Optional: capture Zakiehe-style event blocks (div lines after <p>)
    metadata: {
      container: '.col-md-10 > div',
      // engine will interpret this (patch below)
      fields: {
        venue:   { match: /.*/i, position: 0 },
        opening: { match: /opening/i, position: 1 },
        dateRangeLine: { match: /\d{4}|\bJan|\bFeb|\bMar|\bApr|\bMay|\bJun|\bJul|\bAug|\bSep|\bOct|\bNov|\bDec/i, position: 2 },
        hours:   { match: /(am|pm|\d+\s*-\s*\d+)/i, position: 3 },
        address: { match: /(st\.|street|iran|tehran|shiraz|new york|nyc)/i, position: 4 },
      },
    },
  },
}

export const Configs = {
    artists: ArtistConfig,
    exhibitions: ExhibitionConfig,
    news: NewsItemConfig
}