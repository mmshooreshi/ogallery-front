// server/api/admin/export.get.ts
import { collMap } from '../../utils/adminMap'

export default defineEventHandler(async (event) => {
  const all: Record<string, any[]> = {}
  for (const key of Object.keys(collMap)) {
    const id = key === 'viewingRooms' ? 'viewingRooms' : (key as any)
    all[key] = await queryCollection(event, id).all()
  }
  setHeader(event, 'Content-Type', 'application/json')
  return JSON.stringify(all, null, 2)
})
