// server/api/sitemap/*.get.ts

export default defineEventHandler(async (event) => {
  const map = (base: string, rows: any[]) => rows.map(i => `/${base}/${i.slug}`)

  if (getRequestURL(event).pathname.endsWith('/artists')) {
    return map('artists', await queryCollection(event, 'artists').all())
  }
  if (getRequestURL(event).pathname.endsWith('/exhibitions')) {
    return map('exhibitions', await queryCollection(event, 'exhibitions').all())
  }
  if (getRequestURL(event).pathname.endsWith('/window')) {
    return map('window', await queryCollection(event, 'window').all())
  }
  if (getRequestURL(event).pathname.endsWith('/viewing-rooms')) {
    return map('viewing-rooms', await queryCollection(event, 'viewingRooms').all())
  }
  if (getRequestURL(event).pathname.endsWith('/publications')) {
    return map('publications', await queryCollection(event, 'publications').all())
  }
  if (getRequestURL(event).pathname.endsWith('/news')) {
    return map('news', await queryCollection(event, 'news').all())
  }
  return []
})
