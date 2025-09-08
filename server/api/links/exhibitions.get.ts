export default defineEventHandler(async (event) => {
  const items = await queryCollection(event,'exhibitions').select('slug').all()
  return items.map(i => i.slug)
})
