export default defineEventHandler(async (event) => {
  const items = await queryCollection(event,'publications').select('slug').all()
  return items.map(i => i.slug)
})
