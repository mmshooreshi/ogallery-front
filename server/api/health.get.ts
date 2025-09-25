// server/api/health.get.ts
export default defineEventHandler(() => ({ ok: true, ts: new Date().toISOString() }))
