// server/routes/_q/[kind]/[slug].get.ts
import { getEntryDetail } from '~~/server/queries/common'

export default defineEventHandler(async (event) => {
  const kind = getRouterParam(event, 'kind') // "publications"
  const slug = getRouterParam(event, 'slug')
  const q = getQuery(event)
  return await getEntryDetail(kind!, slug!, q.locale as any)
})