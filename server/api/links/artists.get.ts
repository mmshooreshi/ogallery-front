export default defineEventHandler(async (event) => {
  const items = await queryCollection(event, 'artists').select('slug').all();
  return items.map(i => i.slug);
});