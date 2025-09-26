// nuxt.config.ts
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  // Used by @nuxtjs/sitemap & @nuxtjs/robots
  site: {
    url: 'https://ogallery.net',
    name: 'OGallery'
  },

  modules: ['@nuxt/content', '@nuxt/eslint', '@nuxt/image', '@nuxt/scripts', // Nuxt 4-compatible
  '@nuxt/ui', '@vueuse/nuxt', '@pinia/nuxt', '@nuxt/fonts', '@nuxtjs/sitemap', '@nuxtjs/robots', '@nuxtjs/seo', '@unocss/nuxt', '@nuxtjs/i18n'],
  css: [
    '@/assets/css/fonts.css',
    '@/assets/css/fix.css'
  ],
    i18n: {
    // Routing: / and /en for English, /fa for Persian
    strategy: 'prefix_and_default',
    defaultLocale: 'EN',
    locales: [
      { code: 'EN', language: 'en-US', name: 'English', isCatchallLocale: true },
      { code: 'FA', language: 'fa-IR', name: 'فارسی', dir: 'rtl' }
    ],
    // Needed for fully-qualified hreflang/canonical
    baseUrl: 'https://YOUR-DOMAIN.com',
    // Optional but recommended: don’t force browser-redirect except on root
    detectBrowserLanguage: {
      useCookie: true,
      cookieKey: 'i18n_redirected',
      redirectOn: 'root',
      alwaysRedirect: false
    }
  },
  
  app: {
    head: {
      titleTemplate: '%s - OGallery',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: 'OGallery official website' }
      ],
      link: [{ rel: 'icon', type: 'image/x-icon', href: '/favicons/favicon.ico' },
              { rel: 'manifest', href: '/favicons/site.webmanifest' },
      ]
    }
  },

  // Nuxt Content v3
  content: {
    
    build: {
      markdown: {
        toc: { depth: 3, searchDepth: 3 },
        highlight: {
          theme: { default: 'github-light', dark: 'github-dark' }
          // langs: ['c', 'cpp', 'java']
        },
        // remarkPlugins: { 'remark-gfm': true },
        // rehypePlugins: { 'rehype-figure': {} }
      }
    },
    renderer: {
      anchorLinks: { h2: true, h3: true, h4: true }
    },
    watch: {
      enabled: true,
      port: 4000,
      showURL: false
    },
    // experimental: { sqliteConnector: 'native' }, // if Node >= 22.5
    experimental: {
      sqliteConnector: 'native',
    },

    
    // database: { type: 'memory' } as any // force memory DB, no sqlite

    // database: { type: 'sqlite', filename: '.data/content.db' }
  },

  image: {
    format: ['avif', 'webp', 'jpeg', 'png'],
    domains: ['localhost:3000', 'localhost:3001', 'ogallery.net']


    // domains: ['ogallery.net']
  },

  // Nuxt Sitemap v5
  sitemap: {
    xsl: false,          // must be a string path or false
    autoLastmod: true,
    sources: [
      '/api/sitemap/artists',
      '/api/sitemap/exhibitions',
      '/api/sitemap/window',
      '/api/sitemap/viewing-rooms',
      '/api/sitemap/publications',
      '/api/sitemap/news'
    ]
  },


  
    runtimeConfig: {
      b2Region: process.env.B2_REGION,
      b2Endpoint: process.env.B2_ENDPOINT,
      b2KeyId: process.env.B2_KEY_ID,
      b2AppKey: process.env.B2_APP_KEY,
      b2Bucket: process.env.B2_BUCKET,
      mediaSignTtl: Number(process.env.MEDIA_SIGN_TTL ?? 900), // seconds
      OPENAI_API_KEY: process.env.OPENAI_API_KEY || '',
      OPENAI_BASE_URL: process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1',

    public: {
      // Optional: set if you deploy on a fixed origin; else we’ll auto-detect
      siteUrl: '', // e.g. 'https://ogallery.net'
      adminScrapeEnabled:
        process.env.NUXT_PUBLIC_ADMIN_SCRAPE_ENABLED === 'true' ||
        process.env.NODE_ENV !== 'production',

    }
  },

  // Nuxt Robots v5
  robots: {
    groups: [{ userAgent: '*', allow: '/' }],
    sitemap: ['/sitemap.xml']
  },

  // Nitro (no process/env usage here)
nitro: {
  preset: 'vercel',
  routeRules: {
          '/artists/dev': { swr: 60 },
      '/artists/dev/**': { swr: 60 },

    '/sitemap.xml': { prerender: !import.meta.env?.VITEST },
    '/(artists|exhibitions|viewing-rooms|window|publications|news)(/**)?': {
      headers: { 'cache-control': 'public, max-age=300, stale-while-revalidate=86400' }
    }
    
  },
  storage: {
    // lets server routes read/write under /content without node:fs
    cache: { driver: 'memory' },
    // content: { driver: 'fs', base: 'content' }
  },
  prerender: {
    crawlLinks: process.env.VERCEL ? false : false,
    routes: import.meta.env?.VITEST ? [] : [
       '/sitemap.xml','/'
      // '/', '/artists', '/exhibitions', '/viewing-rooms', '/window',
      // '/publications', '/news', '/studio', '/gallery', '/sitemap.xml'
    ]
  }
},

  typescript: {
    strict: true,
    tsConfig: {
      compilerOptions: {
        noUncheckedIndexedAccess: true
      }
    }
  }
})