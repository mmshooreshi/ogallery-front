// server/routes/_admin/ogallery-artists/index.get.ts
import { defineEventHandler } from 'h3'
import { fetchEnArtistLinks } from '~~/server/lib/scrapers/ogalleryArtists'

export default defineEventHandler(async () => {
  const items = await fetchEnArtistLinks()
  return { items }
})
