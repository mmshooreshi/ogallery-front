// server/api/admin/[collection].get.ts
import { ensureColl } from '../../utils/adminMap'

export default defineEventHandler(event => {
  const coll = ensureColl(getRouterParams(event).collection!)
  const id = coll === 'viewingRooms' ? 'viewingRooms' : coll
  return queryCollection(event, id).all()
})
