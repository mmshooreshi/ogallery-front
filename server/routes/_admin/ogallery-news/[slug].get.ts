// server/routes/_admin/ogallery-news/[slug].get.ts
import { defineEventHandler, getRouterParam, createError } from 'h3'
import { scrapeNewsItemRich } from '~~/server/lib/scrapers/ogalleryNews'

export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug')
  if (!slug) {
    throw createError({ statusCode: 400, statusMessage: 'Missing slug' })
  }

  const data = await scrapeNewsItemRich(slug)
  return data
})
