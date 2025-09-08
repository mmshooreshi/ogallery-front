export default defineEventHandler(async (event) => {
  const items = await queryCollection(event,'news').select('slug').all()
  return items.map(i => i.slug)
})
