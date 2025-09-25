// server/utils/admin.ts
export function requireAdmin(event: any) {
  const name = process.env.ADMIN_COOKIE_NAME || 'admin_session'
  const t = parseCookies(event)[name]
  if (!t) throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  // If you want stronger validation (JWT, DB lookups), do it here.
}
