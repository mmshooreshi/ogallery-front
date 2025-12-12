// server/routes/_admin/ogallery-news/index.get.ts
import { defineEventHandler } from 'h3'
import { fetchEnNewsItemsLinks } from '~~/server/lib/scrapers/ogalleryNews'

export default defineEventHandler(async () => {
  const items = await fetchEnNewsItemsLinks()
  return { items }
})
