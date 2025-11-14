import { defineEventHandler, getRouterParam, createError } from 'h3'
import { scrapeArtistRich } from '~~/server/lib/scrapers/ogalleryArtists'

export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug')
  if (!slug) {
    throw createError({ statusCode: 400, statusMessage: 'Missing slug' })
  }

  const data = await scrapeArtistRich(slug)
  return data
})
