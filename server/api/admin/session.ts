// server/api/admin/session.ts
import { prisma } from '../../lib/prisma'
import { readClaims, requireAdmin, setSessionCookie, clearSessionCookie, signAdminJWT, verifyPassword } from '../../utils/auth'
import { z } from 'zod'

const LoginBody = z.object({ email: z.string().email(), password: z.string().min(6) })

export default defineEventHandler(async (event) => {
  const method = getMethod(event)

  // GET /api/admin/session -> current user (email, role)
  if (method === 'GET') {
    const claims = await readClaims(event)
    if (!claims) throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })

    // ensure still exists / get latest role
    const user = await prisma.user.findUnique({
      where: { id: Number(claims.sub) },
      select: { email: true, role: true },
    })
    if (!user) throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
    return user
  }

  // POST /api/admin/session -> login
  if (method === 'POST') {
    const { email, password } = LoginBody.parse(await readBody(event))
    let user
    try {
      user = await prisma.user.findUniqueOrThrow({ where: { email } })
    } catch {
      throw createError({ statusCode: 401, statusMessage: 'Invalid credentials' })
    }

    const ok = await verifyPassword(user.passwordHash, password)
    if (!ok) throw createError({ statusCode: 401, statusMessage: 'Invalid credentials' })

    const token = await signAdminJWT({ sub: String(user.id), email: user.email, role: user.role })
    setSessionCookie(event, token)
    return { ok: true }
  }

  // DELETE /api/admin/session -> logout
  if (method === 'DELETE') {
    await requireAdmin(event)
    clearSessionCookie(event)
    return { ok: true }
  }

  throw createError({ statusCode: 405, statusMessage: 'Method Not Allowed' })
})
