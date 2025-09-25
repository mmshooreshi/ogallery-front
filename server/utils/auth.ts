// server/utils/auth.ts
import { SignJWT, jwtVerify } from 'jose'
import argon2 from 'argon2'

const secret = new TextEncoder().encode(process.env.ADMIN_JWT_SECRET || 'dev-secret')
const COOKIE = process.env.ADMIN_COOKIE_NAME || 'admin_session'
const ISS = 'ogallery'
const AUD = 'ogallery-admin'

export type AdminClaims = { sub: string; email: string; role: string }

export async function hashPassword(pw: string) {
  return argon2.hash(pw)
}
export async function verifyPassword(hash: string, pw: string) {
  return argon2.verify(hash, pw)
}

export async function signAdminJWT(claims: AdminClaims, ttlSeconds = 60 * 60) {
  return await new SignJWT(claims)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuer(ISS)
    .setAudience(AUD)
    .setSubject(claims.sub)
    .setExpirationTime(`${ttlSeconds}s`)
    .setIssuedAt()
    .sign(secret)
}

export async function readClaims(event: any) {
  const token = getCookie(event, COOKIE)
  if (!token) return null
  try {
    const { payload } = await jwtVerify(token, secret, { issuer: ISS, audience: AUD })
    return payload as AdminClaims
  } catch {
    return null
  }
}

export async function requireAdmin(event: any) {
  const c = await readClaims(event)
  if (!c) throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  return c
}

export function setSessionCookie(event: any, token: string) {
  setCookie(event, COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60, // 1h
  })
}

export function clearSessionCookie(event: any) {
  deleteCookie(event, COOKIE, { path: '/' })
}
