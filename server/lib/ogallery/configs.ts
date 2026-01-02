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


// --------------------------------------------------------------------------
// VIEWING ROOMS CONFIG (Fixed for Image-Link structure)
// --------------------------------------------------------------------------
// [CHANGED] Updated configuration for Deep Scraping and correct text selectors
export const ViewingRoomsConfig: ScraperConfig = {
  type: 'VIEWING-ROOM',
  baseUrl: BASE,
  paths: {
    list: '/en/viewing-rooms',
    detail: (slug, locale) => `${BASE}/${locale.toLowerCase()}/viewing-rooms/${slug}`,
  },
  selectors: {
    listItems: '.exhibition-card a.exhibition-card-thumb',
    listName: '+ .exhibition-card-title', // Sibling text

    title: '.container h2', 
    dateString: '.container h5:nth-of-type(2)',
    customProps: {
      artistName: '.container h3 a',
    },

    body: {
      preferredId: null,
      headingTags: [],
      keywords: { EN: ['.'], FA: ['.'] },
      contentWrapper: '.col-lg-6', // Text column
      paragraphSelector: 'p',
      sectionKey: 'STATEMENT',
    },

    image: {
      selector: '#selected-work img',
      attr: 'src',
      alt: 'title'
    },

    cvLink: null,
    portfolioLink: null,

    works: {
      container: 'figure.artwork-viewingroom > a', // Link to child page
      captionAttr: 'data-caption',
      
      // [CHANGED] Deep scrape config
      deepScrape: {
        enabled: true,
        images: { 
          selector: '#art-sliderShow .carousel-item img', 
          attr: 'data-src' 
        },
        caption: '#art-title h5:first-of-type',
        status: '#art-title h5:nth-of-type(2)'
      }
    },

    installations: null,
  },
};


// --- 2. WINDOW CONFIG ---
export const WindowConfig: ScraperConfig = {
  type: 'WINDOW', // New Distinct Type
  baseUrl: 'https://ogallery.net',
  paths: {
    list: '/en/window',
    detail: (slug, locale) => `/${locale.toLowerCase()}/window/${slug}`,
  },
  selectors: {
    listItems: 'a[href*="/window/"]',
    title: 'h1',
    // Captures "December 26 2025 - January 6 2026"
    dateString: '.date, h5, h6', 
    body: {
      preferredId: null,
      headingTags: ['h3', 'strong'],
      keywords: {
        EN: ['Statement', 'About'],
        FA: ['بیانیه', 'درباره'],
      },
      contentWrapper: '.col-12', 
      paragraphSelector: 'p',
      sectionKey: 'ABOUT',
    },
    image: { selector: '.featured img' },
    cvLink: null,
    portfolioLink: null,
    works: { container: '.gallery a', captionAttr: 'title' },
    installations: { selector: '.install-shots img' },
  },
};

// --- 3. STUDIO CONFIG ---
// server/lib/ogallery/configs.ts
// server/lib/ogallery/configs.ts

export const StudioConfig: ScraperConfig = {
  type: 'STUDIO',
  baseUrl: 'https://ogallery.net',
  paths: {
    list: '/en/studio',
    detail: (slug, locale) => `/${locale.toLowerCase()}/studio/${slug}`,
  },
  selectors: {
    // Target the link wrapper
    listItems: '.exhibition-card a.exhibition-card-thumb',
    
    // NEW: Tell fetchList to grab text from the sibling <p> tag
    // The HTML is: <a>...</a> <p>Name <br> Price</p>
    listName: '+ p', 

    // Detail Page Title
    title: '#art-title h5:first-of-type',
    
    customProps: {
      status: '#art-title h5:nth-of-type(2)', // "Available"
      
      // NEW: Extract Artist Name from the Title string
      // String format: "Rasoul Akbarlou, \"The End Of Summer...\""
      // Regex: Grab everything before the first comma
      artistName: {
        selector: '#art-title h5:first-of-type',
        regex: /^([^,]+)/ 
      }
    },

    // Works / Carousel
    works: {
      container: '.carousel-item img', 
      captionAttr: 'alt',
    },

    image: {
      selector: '.carousel-item.active img',
      attr: 'src'
    },

    body: {
      preferredId: null,
      headingTags: ['h1'], 
      keywords: { EN: ['___'], FA: ['___'] }, 
      contentWrapper: '.art-info', 
      paragraphSelector: 'p.non-existent', 
      sectionKey: 'DESCRIPTION',
    },
    
    cvLink: null,
    portfolioLink: null,
    installations: null, 
  },
};


export const PublicationsConfig: ScraperConfig = {
  type: 'PUBLICATION',
  baseUrl: 'https://ogallery.net',
  paths: {
    list: '/en/publications',
    detail: (slug, locale) => `/${locale.toLowerCase()}/publications/${slug}`,
  },
  selectors: {
    listItems: '.row a[href]',
    title: '.book-title, h1, h2.title, h2',
    publishDate: '.date, .meta-date, h5, h6', 
    
    // NEW: Capture extra details into "props"
    // This attempts to find list items or paragraphs with these specific labels
    customProps: {
      pages: 'li:contains("Pages"), p:contains("Pages")',
      isbn: 'li:contains("ISBN"), p:contains("ISBN")',
      publisher: 'li:contains("Publisher"), p:contains("Publisher")',
      dimensions: 'li:contains("Dimensions"), p:contains("Dimensions"), li:contains("Size")',
      language: 'li:contains("Language"), p:contains("Language")'
    },

    image: { 
      selector: '.col-md-2 img, .col-md-3 img, .col-md-4 img, .book-cover img, .main-image img', 
      attr: 'src',
      alt: 'alt'
    },

    body: {
      preferredId: null,
      headingTags: ['h1', 'h2', '.book-title'], 
      keywords: { EN: ['.'], FA: ['.'] },
      // Broad wrapper to ensure we catch the content column
      contentWrapper: '.col-md-8, .col-md-9, .col-12',
      paragraphSelector: 'p',
      sectionKey: 'DESCRIPTION',
    },

    // Ensure we look everywhere for the PDF
    cvLink: { 
      rowSelector: 'div', 
      keywords: ['.pdf', 'download'] 
    }, 
    
    portfolioLink: null,
    works: { container: 'a[rel="works"]', captionAttr: 'data-caption' },
    installations: null,
  },
};

export const Configs = {
    'artists': ArtistConfig,
    'exhibitions': ExhibitionConfig,
    'news': NewsItemConfig,
    'viewing-rooms': ViewingRoomsConfig,
    'window': WindowConfig,
    'studio': StudioConfig,
    'publications': PublicationsConfig

}

