// server/api/admin/meta.get.ts
import { Prisma } from '@prisma/client'
import { prisma } from '../../lib/prisma'

type Field = { key: string; label: string; type: 'text'|'textarea'|'date'|'number'|'checkbox'|'array' }
type Meta = Record<string, Field[]>

const HIDDEN_COLUMNS = new Set(['id', 'createdAt', 'updatedAt'])
const HIDE_TABLES = new Set(['_prisma_migrations'])
const hide = Array.from(HIDE_TABLES)

const MODEL_OVERRIDE: Record<string, string> = {
  AdminUser: '',           // hide from UI
  ViewingRoom: 'viewingRooms',
  Window: 'window',
  News: 'news',
}

export default defineEventHandler(async () => {
  const HIDE_TABLES = new Set(['_prisma_migrations'])
  const hide = Array.from(HIDE_TABLES)

  const whereNotIn =
    hide.length > 0
      ? Prisma.sql`AND c.table_name::text NOT IN (${Prisma.join(hide)})`
      : Prisma.sql`` // empty noop

  const rows = await prisma.$queryRaw<Array<{
    table: string
    column: string
    data_type: string
    udt_name: string
    is_nullable: boolean
  }>>`
    SELECT
      c.table_name::text  AS table,
      c.column_name::text AS column,
      c.data_type::text,
      c.udt_name::text,
      (c.is_nullable = 'YES') AS is_nullable
    FROM information_schema.columns c
    WHERE c.table_schema = 'public'
      AND c.table_name NOT LIKE '\_%'
      ${whereNotIn}
    ORDER BY c.table_name, c.ordinal_position
  `

  // Group columns by table
  const byTable = new Map<string, Array<typeof rows[number]>>()
  for (const r of rows) {
    if (!byTable.has(r.table)) byTable.set(r.table, [])
    byTable.get(r.table)!.push(r)
  }

  const meta: Meta = {}
  for (const [table, cols] of byTable) {
    const coll = toCollectionId(table)
    if (!coll) continue // hidden tables (e.g., AdminUser)

    const fields: Field[] = []
    for (const c of cols) {
      if (HIDDEN_COLUMNS.has(c.column)) continue
      // keep FK scalars like artistId; we only skip relation tables above

      fields.push({
        key: c.column,
        label: labelize(c.column),
        type: toInputType(c),
      })
    }

    // Make slug first if present
    fields.sort((a, b) => (a.key === 'slug' ? -1 : b.key === 'slug' ? 1 : 0))
    meta[coll] = fields
  }

  return meta
})

/* ---------- helpers ---------- */

function toCollectionId(tableName: string): string | '' {
  // Prisma maps models -> quoted table names with case preserved (e.g., "Artist", "ViewingRoom")
  if (tableName in MODEL_OVERRIDE) return MODEL_OVERRIDE[tableName]
  const camel = tableName[0].toLowerCase() + tableName.slice(1)
  if (camel.endsWith('y')) return camel.slice(0, -1) + 'ies'
  if (camel.endsWith('s')) return camel // e.g., News
  return camel + 's'
}

function labelize(k: string) {
  return k.replace(/([A-Z])/g, ' $1').replace(/^./, c => c.toUpperCase())
}

function toInputType(c: { data_type: string; udt_name: string; column: string }): Field['type'] {
  // Name-based hints (nice UX without extra config)
  if (/(images|tags|artists)$/i.test(c.column)) return 'array'
  if (/(body|text|bio|press|summary|teaser|release)/i.test(c.column)) return 'textarea'
  if (/date$/i.test(c.column)) return 'date'
  if (/^(published|active|visible|featured)$/i.test(c.column)) return 'checkbox'
  if (/^(price|year|order|sort|index)$/i.test(c.column)) return 'number'

  // PG type-based mapping
  const dt = c.data_type.toLowerCase()
  const udt = c.udt_name.toLowerCase()
  if (dt === 'boolean') return 'checkbox'
  if (dt.includes('timestamp') || dt === 'date') return 'date'
  if (dt === 'integer' || dt === 'numeric' || dt === 'double precision' || dt === 'real') return 'number'
  if (dt === 'array' || udt.startsWith('_')) return 'array' // _text, _varchar, etc.

  // default
  return 'text'
}
