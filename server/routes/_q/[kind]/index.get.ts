import { listEntries } from '~~/server/queries/common'

export default defineEventHandler(async (event) => {
  const kind = getRouterParam(event, 'kind') // "publications"
  const q = getQuery(event)
  return await listEntries(kind!, q.locale as any, Number(q.year))
})