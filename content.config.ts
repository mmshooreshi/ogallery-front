// content.config.ts
// Fully-specified Content Collections for Nuxt Content v3
// - Valid JS identifiers for collection names
// - Tight Zod schemas with reusable fragments
// - ISO date + slug validation
// - Optional SEO fields shared across page-like content
// - Folder globs match your /content/* structure

import { defineContentConfig, defineCollection, z } from '@nuxt/content'

// -------------------------
// Reusable validators
// -------------------------
const slug = z
  .string()
  .min(1, 'slug is required')
  // allow letters, numbers, hyphen, underscore, dot; adjust if you need stricter slugs
  .regex(/^[A-Za-z0-9._-]+$/, 'slug can only include letters, numbers, ".", "_" and "-"')

const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'use YYYY-MM-DD')

const imagePath = z.string().regex(/^\/.*/, 'image paths should start with "/"')

// Shared optional SEO fields you may want to set in frontmatter / data
const seoFields = z.object({
  seoTitle: z.string().optional(),
  seoDescription: z.string().optional(),
  ogImage: imagePath.optional()
})

export default defineContentConfig({
  collections: {
    // ---------------------------------
    // Generic Markdown pages (optional)
    // content/index.md, content/about.md, etc.
    // ---------------------------------
    content: defineCollection({
      type: 'page',
      source: 'content/**/*.md',
      schema: z
        .object({
          title: z.string().optional(),
          // frontmatter-friendly date if you use it on generic pages
          date: isoDate.optional()
        })
        .merge(seoFields)
    }),

    // ---------------------------------
    // Artists (DATA)
    // /content/artists/*.yml
    // ---------------------------------
    artists: defineCollection({
      type: 'data',
      source: 'artists/**/*.{yml,yaml,json}',
      schema: z.object({
        slug,
        name: z.string().min(1, 'name is required'),
        bio: z.string().optional(),
        image: imagePath.optional(),
        website: z.string().url().optional(),
        // optional ordering helpers
        sortIndex: z.number().int().optional(),
        // timestamps (manual)
        createdAt: isoDate.optional(),
        updatedAt: isoDate.optional()
      })
    }),

    // ---------------------------------
    // Exhibitions (DATA)
    // /content/exhibitions/*.yml
    // ---------------------------------
    exhibitions: defineCollection({
      type: 'data',
      source: 'exhibitions/**/*.{yml,yaml,json}',
      schema: z.object({
        slug,
        title: z.string().min(1, 'title is required'),
        artists: z.array(z.string()).optional(), // store artist slugs or names
        startDate: isoDate.optional(),
        endDate: isoDate.optional(),
        status: z.enum(['current', 'upcoming', 'past']).optional(),
        year: z.number().int().optional(),
        pressRelease: z.string().optional(),
        images: z.array(imagePath).optional(),
        works: z
          .array(
            z.object({
              title: z.string(),
              medium: z.string().optional(),
              dims: z.string().optional(),
              availability: z.enum(['available', 'sold']).optional(),
              image: imagePath.optional(),
              price: z.union([z.number(), z.string()]).optional()
            })
          )
          .optional(),
        createdAt: isoDate.optional(),
        updatedAt: isoDate.optional()
      })
    }),

    // ---------------------------------
    // The Window (DATA)
    // /content/window/*.yml
    // ---------------------------------
    window: defineCollection({
      type: 'data',
      source: 'window/**/*.{yml,yaml,json}',
      schema: z.object({
        slug,
        title: z.string(),
        startDate: isoDate.optional(),
        endDate: isoDate.optional(),
        press: z.string().optional(),
        images: z.array(imagePath).optional(),
        createdAt: isoDate.optional(),
        updatedAt: isoDate.optional()
      })
    }),

    // ---------------------------------
    // Viewing Rooms (DATA)
    // /content/viewing-rooms/*.yml
    // NOTE: collection key must be a valid identifier → viewingRooms
    // ---------------------------------
    viewingRooms: defineCollection({
      type: 'data',
      source: 'viewing-rooms/**/*.{yml,yaml,json}',
      schema: z.object({
        slug,
        title: z.string(),
        artist: z.string().optional(), // slug or name
        startDate: isoDate.optional(),
        endDate: isoDate.optional(),
        text: z.string().optional(),
        images: z.array(imagePath).optional(),
        createdAt: isoDate.optional(),
        updatedAt: isoDate.optional()
      })
    }),

    // ---------------------------------
    // Publications (PAGE - Markdown)
    // /content/publications/*.md
    // ---------------------------------
    publications: defineCollection({
      type: 'page',
      source: 'publications/**/*.md',
      schema: z
        .object({
          slug,
          title: z.string(),
          date: isoDate.optional(),
          summary: z.string().optional(),
          coverImage: imagePath.optional()
        })
        .merge(seoFields)
    }),

    // ---------------------------------
    // News (PAGE - Markdown)
    // /content/news/*.md
    // ---------------------------------
    news: defineCollection({
      type: 'page',
      source: 'news/**/*.md',
      schema: z
        .object({
          slug,
          title: z.string(),
          date: isoDate.optional(),
          teaser: z.string().optional(),
          coverImage: imagePath.optional(),
          tags: z.array(z.string()).optional()
        })
        .merge(seoFields)
    }),

    // ---------------------------------
    // Studio (DATA) — available works
    // /content/studio/*.yml
    // ---------------------------------
    studio: defineCollection({
      type: 'data',
      source: 'studio/**/*.{yml,yaml,json}',
      schema: z.object({
        slug,
        artist: z.string(),
        title: z.string(),
        price: z.union([z.string(), z.number()]).optional(),
        availability: z.enum(['available', 'sold']).default('available'),
        image: imagePath.optional(),
        dims: z.string().optional(),
        year: z.number().int().optional(),
        createdAt: isoDate.optional(),
        updatedAt: isoDate.optional()
      })
    })
  }
})
