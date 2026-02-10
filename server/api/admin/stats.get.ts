// import { PrismaClient } from '@prisma/client'
// const prisma = new PrismaClient()
import { prisma } from '../../lib/prisma'

export default defineEventHandler(async (event) => {
  // 1. Group entries by Kind and Status
  const stats = await prisma.entry.groupBy({
    by: ['kind', 'status'],
    _count: { _all: true }
  })

  // 2. Count total media files
  const mediaCount = await prisma.media.count()

  // 3. Format data for the frontend
  // Output format: { artist: { total: 10, draft: 1, published: 9 }, ... }
  const formatted: Record<string, { total: number; draft: number; published: number }> = {}

  stats.forEach((item) => {
    const k = item.kind
    if (!formatted[k]) formatted[k] = { total: 0, draft: 0, published: 0 }
    
    const count = item._count._all
    formatted[k].total += count
    if (item.status === 'DRAFT') formatted[k].draft += count
    if (item.status === 'PUBLISHED') formatted[k].published += count
  })

  return {
    content: formatted,
    media: mediaCount
  }
})