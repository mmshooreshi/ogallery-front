// server/routes/_admin/ogallery-exhibitions/index.get.ts
import { defineEventHandler } from 'h3'
import { fetchEnExhibitionLinks } from '~~/server/lib/scrapers/ogalleryExhibitions'

export default defineEventHandler(async () => {
  const items = await fetchEnExhibitionLinks()
  return { items }
})
