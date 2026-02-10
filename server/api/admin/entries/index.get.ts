import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  
  // 1. Parse Parameters
  const page = Number(query.page) || 1
  const take = Number(query.take) || 15
  const skip = (page - 1) * take
  const sortBy = (query.sortBy as string) || 'updatedAt'
  const sortDir = (query.sortDir as string) || 'desc'
  const search = (query.search as string) || ''
  
  // Handle "kinds" array from query (sent as JSON string or single value)
  let kindsInput = query.kinds
  if (typeof kindsInput === 'string' && kindsInput.startsWith('[')) {
     kindsInput = JSON.parse(kindsInput)
  }
  // Ensure it's an array
  const kinds = Array.isArray(kindsInput) ? kindsInput : [query.kind || 'ARTIST']

  // 2. Build Filter
  const where: any = {
    kind: { in: kinds }, // This allows fetching BOTH types
    deletedAt: null,
  }

  // Add search logic (search in Slug OR Title in any locale)
  if (search) {
    where.OR = [
      { slug: { contains: search, mode: 'insensitive' } },
      { 
        locales: { 
          some: { 
            title: { contains: search, mode: 'insensitive' } 
          } 
        } 
      }
    ]
  }

  // 3. Execute Queries (Count + Data)
  const [total, data] = await prisma.$transaction([
    prisma.entry.count({ where }),
    prisma.entry.findMany({
      where,
      take,
      skip,
      orderBy: {
        [sortBy]: sortDir // Dynamic sorting
      },
      include: {
        locales: {
          select: { locale: true, title: true } // Optimize: don't fetch bodyHtml for list
        } 
      }
    })
  ])

  // 4. Return formatted response
  return {
    data,
    meta: {
      total,
      page,
      lastPage: Math.ceil(total / take)
    }
  }
})