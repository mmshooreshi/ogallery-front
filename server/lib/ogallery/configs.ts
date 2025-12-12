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

export const Configs = {
    artists: ArtistConfig,
    exhibitions: ExhibitionConfig
}