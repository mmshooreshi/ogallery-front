import { prisma } from "~~/server/lib/prisma";
import { readBody, createError } from 'h3'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  const {
    language,
    query,
    take = 100,
  } = body || {}

  if (!query || !language) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid payload' })
  }

  // HARD SAFETY LIMITS
  const LIMIT = Math.min(Number(take) || 100, 500)

  if (language === 'sql') {
    const q = query.toLowerCase()

    if (!q.startsWith('select')) {
      throw createError({
        statusCode: 403,
        statusMessage: 'Only SELECT queries are allowed',
      })
    }

    // Force LIMIT
    const safeQuery =
      q.includes('limit') ? query : `${query} LIMIT ${LIMIT}`

    const result = await prisma.$queryRawUnsafe<any[]>(safeQuery)
    return { rows: result }
  }

  if (language === 'prisma') {
    /**
     * Extremely controlled Prisma runner
     * Expects code that returns a Prisma promise
     */
    const fn = new Function(
      'prisma',
      'LIMIT',
      `"use strict"; return (${query});`
    )

    const result = await fn(prisma, LIMIT)
    return { rows: result }
  }

  throw createError({ statusCode: 400, statusMessage: 'Unknown query language' })
})
