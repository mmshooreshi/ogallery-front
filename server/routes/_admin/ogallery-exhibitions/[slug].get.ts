// server/routes/_admin/ogallery-exhibitions/[slug].get.ts
import { defineEventHandler, getRouterParam, createError } from 'h3'
import { scrapeExhibitionRich } from '~~/server/lib/scrapers/ogalleryExhibitions'

export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug')
  if (!slug) {
    throw createError({ statusCode: 400, statusMessage: 'Missing slug' })
  }

  const data = await scrapeExhibitionRich(slug)
  return data
})
