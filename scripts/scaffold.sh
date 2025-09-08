#!/usr/bin/env bash
# Scaffold a Nuxt 4 + Nuxt Content v3 project (pages, admin, middleware, utils, server, sample content)
# Run from your project root: bash scripts/scaffold_all.sh

set -euo pipefail

echo "→ Creating directories…"
mkdir -p app/{layouts,middleware,pages} \
         app/pages/{artists,exhibitions,viewing-rooms,window,publications,news,admin} \
         components composables utils public/images \
         content/{artists,exhibitions,window,viewing-rooms,publications,news,studio} \
         server/api/{sitemap,links,health}

########################################
# Layout
########################################
cat > app/layouts/default.vue <<'EOF'
<template>
  <div>
    <header class="p-4 border-b flex items-center justify-between">
      <NuxtLink to="/" class="font-semibold">O Gallery</NuxtLink>
      <nav class="flex flex-wrap gap-4 text-sm">
        <NuxtLink to="/artists">Artists</NuxtLink>
        <NuxtLink to="/exhibitions">Exhibitions</NuxtLink>
        <NuxtLink to="/viewing-rooms">Viewing Rooms</NuxtLink>
        <NuxtLink to="/window">The Window</NuxtLink>
        <NuxtLink to="/publications">Publications</NuxtLink>
        <NuxtLink to="/news">News</NuxtLink>
        <NuxtLink to="/studio">Studio</NuxtLink>
        <NuxtLink to="/gallery">Info</NuxtLink>
        <NuxtLink to="/admin" class="opacity-70">Admin</NuxtLink>
      </nav>
    </header>
    <main class="p-6">
      <slot />
    </main>
    <footer class="p-6 border-t text-xs opacity-60">© O Gallery</footer>
  </div>
</template>
EOF

########################################
# Home
########################################
cat > app/pages/index.vue <<'EOF'
<template>
  <section>
    <h1 class="text-3xl font-semibold mb-4">O Gallery</h1>
    <p class="opacity-70">Starter homepage. Wire featured exhibitions & news here.</p>
  </section>
</template>
EOF

########################################
# Nuxt Content v3 Pages (queryCollection)
########################################
# helper to make index pages
make_index() {
  local route="$1"; local title="$2"; local coll="$3"
  cat > "app/pages/${route}/index.vue" <<EOF
<script setup lang="ts">

const { data: items } = await useAsyncData('${route}', () =>
  queryCollection('${coll}')
    .order('startDate', 'DESC')
    .all()
)
</script>

<template>
  <section>
    <h1 class="text-2xl font-semibold mb-4">${title}</h1>
    <ul class="grid gap-3">
      <li v-for="doc in items" :key="doc.slug">
        <NuxtLink :to="\`/${route}/\${doc.slug}\`">
          {{ doc.name || doc.title || doc.slug }}
        </NuxtLink>
        <small class="block opacity-60">
          {{ doc.startDate || doc.date }}
          <span v-if="doc.endDate"> — {{ doc.endDate }}</span>
        </small>
      </li>
    </ul>
  </section>
</template>
EOF
}

# helper to make slug pages
make_slug() {
  local route="$1"; local coll="$2"; local head="$3"; local is_mdx="$4"
  # if markdown (news/publications), render with ContentRenderer
  if [ "$is_mdx" = "md" ]; then
cat > "app/pages/${route}/[slug].vue" <<EOF
<script setup lang="ts">

const route = useRoute()
const { data: page } = await useAsyncData('${route}-item', () =>
  queryCollection('${coll}').where({ slug: route.params.slug as string }).first()
)
useSeoMeta({ title: page.value?.title })
</script>

<template>
  <article v-if="page">
    <h1 class="text-3xl font-semibold mb-2">{{ page.title }}</h1>
    <p class="opacity-70 mb-6">{{ page.date }}</p>
    <ContentRenderer :value="page" />
  </article>
  <p v-else>Not found.</p>
</template>
EOF
  else
cat > "app/pages/${route}/[slug].vue" <<EOF
<script setup lang="ts">

const route = useRoute()
const { data: doc } = await useAsyncData('${route}-item', () =>
  queryCollection('${coll}').where({ slug: route.params.slug as string }).first()
)
useSeoMeta({ title: doc.value?.title || doc.value?.name || '${head}' })
</script>

<template>
  <article v-if="doc">
    <h1 class="text-3xl font-semibold mb-2">{{ doc.title || doc.name }}</h1>
    <p class="opacity-70 mb-6">
      {{ doc.startDate || doc.date }}
      <span v-if="doc.endDate"> — {{ doc.endDate }}</span>
    </p>
    <div v-if="doc.pressRelease || doc.text" class="prose max-w-none">
      <p v-for="p in (doc.pressRelease || doc.text || '').split('\n\n')" :key="p">{{ p }}</p>
    </div>
  </article>
  <p v-else>Not found.</p>
</template>
EOF
  fi
}

# Artists
make_index "artists" "Artists" "artists"
make_slug  "artists" "artists" "Artist" "data"

# Exhibitions
make_index "exhibitions" "Exhibitions" "exhibitions"
make_slug  "exhibitions" "exhibitions" "Exhibition" "data"

# Viewing Rooms
make_index "viewing-rooms" "Viewing Rooms" "viewing-rooms"
make_slug  "viewing-rooms" "viewing-rooms" "Viewing Room" "data"

# The Window
make_index "window" "The Window" "window"
make_slug  "window" "window" "The Window" "data"

# Publications (Markdown)
make_index "publications" "Publications" "publications"
make_slug  "publications" "publications" "Publication" "md"

# News (Markdown)
make_index "news" "News" "news"
make_slug  "news" "news" "News" "md"

# Studio
cat > app/pages/studio.vue <<'EOF'
<script setup lang="ts">

const { data: items } = await useAsyncData('studio', () =>
  queryCollection('studio').all()
)
</script>

<template>
  <section>
    <h1 class="text-2xl font-semibold mb-4">Studio (Available Works)</h1>
    <ul class="grid gap-2">
      <li v-for="it in items" :key="it.slug">
        {{ it.artist }} — {{ it.title }}
        <b class="ml-2">{{ it.price }}</b>
        <small>({{ it.availability || 'available' }})</small>
      </li>
    </ul>
  </section>
</template>
EOF

# Info
cat > app/pages/gallery.vue <<'EOF'
<template>
  <section>
    <h1 class="text-2xl font-semibold mb-4">Information</h1>
    <p>Add About/Hours/Map/Contact/Subscribe content here.</p>
  </section>
</template>
EOF

# Vault (placeholder)
cat > app/pages/vault.vue <<'EOF'
<template>
  <section>
    <h1 class="text-2xl font-semibold mb-4">Vault (Protected)</h1>
    <p>Wire a passphrase check later (lightweight client guard or server auth).</p>
  </section>
</template>
EOF

########################################
# Admin (password -> token cookie)
########################################
# middleware
cat > app/middleware/admin-auth.ts <<'EOF'
export default defineNuxtRouteMiddleware((to) => {
  if (!to.path.startsWith('/admin')) return
  const { isAuthed } = useAdminAuth()
  if (!isAuthed.value && to.path !== '/admin/login') {
    return navigateTo('/admin/login?next=' + encodeURIComponent(to.fullPath))
  }
})
EOF

# composables
cat > composables/useAdminAuth.ts <<'EOF'
import { useCookie } from '#app'

const ADMIN_PASSWORD = 'change-me-now'
const TOKEN_COOKIE = 'admin_token'
const TOKEN_TTL_MIN = 60

function tokenGen(len = 32) {
  const a = new Uint8Array(len); crypto.getRandomValues(a)
  return Array.from(a, b => b.toString(16).padStart(2, '0')).join('')
}

export function useAdminAuth() {
  const token = useCookie<string | null>(TOKEN_COOKIE, {
    sameSite: 'lax', secure: false, httpOnly: false, maxAge: TOKEN_TTL_MIN * 60
  })
  const isAuthed = computed(() => Boolean(token.value))
  async function login(password: string) {
    if (password !== ADMIN_PASSWORD) throw new Error('Invalid password')
    token.value = tokenGen()
    return true
  }
  function logout() { token.value = null }
  return { isAuthed, login, logout }
}
EOF

# localStorage overrides helper (optional for previewing admin edits)
cat > composables/useContentOverrides.ts <<'EOF'
export function useContentOverrides() {
  function fromLS(collection: string) {
    if (process.server) return []
    try { const raw = localStorage.getItem('admin-content-overrides'); return raw ? (JSON.parse(raw)?.[collection] || []) : [] }
    catch { return [] }
  }
  function merge(base: any[], overrides: any[]) {
    const map = new Map(base.map((b:any) => [b.slug, b]))
    for (const o of overrides) map.set(o.slug, { ...(map.get(o.slug) || {}), ...o })
    return Array.from(map.values())
  }
  return { fromLS, merge }
}
EOF

# storage utils for admin
cat > utils/storage.ts <<'EOF'
export type Entity = Record<string, any> & { slug: string }
export type Collection = 'artists'|'exhibitions'|'window'|'viewing-rooms'|'publications'|'news'|'studio'
const KEY = 'admin-content-overrides'
function blank(): Record<Collection, Entity[]> {
  return { artists:[], exhibitions:[], window:[], 'viewing-rooms':[], publications:[], news:[], studio:[] }
}
function readAll() {
  try { const raw = localStorage.getItem(KEY); return raw ? JSON.parse(raw) : blank() } catch { return blank() }
}
function writeAll(data: Record<Collection, Entity[]>) { localStorage.setItem(KEY, JSON.stringify(data)) }
export function list(name: Collection) { return (readAll()[name] || []) }
export function upsert(name: Collection, entity: Entity) {
  const all = readAll(); const arr = all[name] || []; const i = arr.findIndex(e => e.slug === entity.slug)
  if (i === -1) arr.push(entity); else arr[i] = entity
  all[name] = arr; writeAll(all)
}
export function remove(name: Collection, slug: string) {
  const all = readAll(); all[name] = (all[name] || []).filter(e => e.slug !== slug); writeAll(all)
}
export function exportJSON() { return JSON.stringify(readAll(), null, 2) }
export async function importJSON(file: File) { const text = await file.text(); writeAll(JSON.parse(text)) }
EOF

# admin editor component
cat > components/AdminEditor.vue <<'EOF'
<template>
  <div class="border rounded-2xl p-4 shadow">
    <header class="flex items-center justify-between mb-3">
      <h2 class="font-semibold">{{ title }}</h2>
      <div class="flex gap-2">
        <input v-model="query" placeholder="Search by slug/title" class="border rounded px-2 py-1" />
        <button @click="addNew" class="border rounded px-2 py-1">+ New</button>
      </div>
    </header>
    <details v-for="item in filtered" :key="item.slug" class="mb-2 rounded border">
      <summary class="cursor-pointer px-3 py-2 flex items-center justify-between">
        <span class="font-medium">{{ item.title || item.name || item.slug }}</span>
        <small class="opacity-60">/{{ collection }}/{{ item.slug }}</small>
      </summary>
      <div class="p-3 grid gap-2">
        <div v-for="f in fields" :key="f.key" class="grid gap-1">
          <label class="text-xs opacity-70">{{ f.label }}</label>
          <textarea v-if="f.textarea" v-model="drafts[item.slug][f.key]" rows="4" class="border rounded px-2 py-1"></textarea>
          <input v-else v-model="drafts[item.slug][f.key]" class="border rounded px-2 py-1" />
        </div>
        <div class="flex gap-2 mt-2">
          <button @click="save(item.slug)" class="border rounded px-3 py-1">Save</button>
          <button @click="del(item.slug)" class="border rounded px-3 py-1">Delete</button>
        </div>
      </div>
    </details>
    <p v-if="!filtered.length" class="text-sm opacity-70">No items yet.</p>
  </div>
</template>

<script setup lang="ts">
import { list, upsert, remove } from '@/utils/storage'
const props = defineProps<{ title: string; collection: string; fields: { key: string; label: string; textarea?: boolean }[] }>()
const items = ref<any[]>(list(props.collection as any))
const drafts = ref<Record<string, any>>({})
const query = ref('')
watchEffect(() => { for (const it of items.value) if (!drafts.value[it.slug]) drafts.value[it.slug] = { ...it } })
const filtered = computed(() => {
  const q = query.value.toLowerCase().trim()
  if (!q) return items.value
  return items.value.filter((it) => (it.slug || '').toLowerCase().includes(q) || (it.title || it.name || '').toLowerCase().includes(q))
})
function addNew() {
  const slug = prompt('New item slug (unique, URL-safe):')?.trim()
  if (!slug) return
  const newItem: any = { slug }; for (const f of props.fields) if (!(f.key in newItem)) newItem[f.key] = ''
  items.value = [...items.value, newItem]; drafts.value[slug] = { ...newItem }
}
function save(slug: string) { const e = drafts.value[slug]; if (!e?.slug) return alert('Missing slug'); upsert(props.collection as any, e); items.value = list(props.collection as any) }
function del(slug: string) { if (!confirm('Delete item?')) return; remove(props.collection as any, slug); items.value = list(props.collection as any); delete drafts.value[slug] }
</script>
EOF

# admin login
cat > app/pages/admin/login.vue <<'EOF'
<template>
  <div class="min-h-screen grid place-items-center p-6">
    <form @submit.prevent="onSubmit" class="w-full max-w-sm border rounded-2xl p-6 shadow">
      <h1 class="text-2xl font-semibold mb-4">Admin Login</h1>
      <label class="block text-sm mb-2">Password</label>
      <input v-model="password" type="password" class="w-full border rounded px-3 py-2 mb-4" />
      <button class="w-full rounded px-3 py-2 bg-black text-white">Sign in</button>
      <p v-if="error" class="text-red-600 text-sm mt-3">{{ error }}</p>
    </form>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: 'admin-auth' })
const route = useRoute(); const router = useRouter(); const { login } = useAdminAuth()
const password = ref(''); const error = ref('')
async function onSubmit() {
  error.value = ''
  try { await login(password.value); router.replace((route.query.next as string) || '/admin') }
  catch (e: any) { error.value = e.message || 'Login failed' }
}
</script>
EOF

# admin dashboard
cat > app/pages/admin/index.vue <<'EOF'
<template>
  <div class="min-h-screen p-6">
    <header class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-semibold">Admin Dashboard</h1>
      <div class="flex gap-2">
        <input type="file" accept="application/json" @change="onImport" class="hidden" ref="fileInput" />
        <button @click="downloadExport" class="border rounded px-3 py-2">Export JSON</button>
        <button @click="() => fileInput?.click()" class="border rounded px-3 py-2">Import JSON</button>
        <button @click="logout" class="border rounded px-3 py-2">Logout</button>
      </div>
    </header>

    <section class="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
      <AdminEditor title="Artists" collection="artists" :fields="artistFields" />
      <AdminEditor title="Exhibitions" collection="exhibitions" :fields="exhibitionFields" />
      <AdminEditor title="The Window" collection="window" :fields="windowFields" />
      <AdminEditor title="Viewing Rooms" collection="viewing-rooms" :fields="vrFields" />
      <AdminEditor title="Publications" collection="publications" :fields="pubFields" />
      <AdminEditor title="News" collection="news" :fields="newsFields" />
      <AdminEditor title="Studio" collection="studio" :fields="studioFields" />
    </section>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: 'admin-auth' })
import { exportJSON, importJSON } from '@/utils/storage'
const { logout } = useAdminAuth()
const fileInput = ref<HTMLInputElement | null>(null)

function downloadExport() {
  const blob = new Blob([exportJSON()], { type: 'application/json' })
  const url = URL.createObjectURL(blob); const a = document.createElement('a')
  a.href = url; a.download = 'content-export.json'; a.click(); URL.revokeObjectURL(url)
}
async function onImport(e: Event) {
  const input = e.target as HTMLInputElement; const file = input.files?.[0]; if (!file) return
  await importJSON(file); alert('Imported! Refreshing…'); location.reload()
}

const artistFields = [{ key:'slug',label:'Slug' },{ key:'name',label:'Name' },{ key:'bio',label:'Biography',textarea:true }]
const exhibitionFields = [
  { key:'slug',label:'Slug' },{ key:'title',label:'Title' },{ key:'artists',label:'Artists (comma-separated)' },
  { key:'startDate',label:'Start Date' },{ key:'endDate',label:'End Date' },
  { key:'status',label:'Status (current|upcoming|past)' },{ key:'year',label:'Year' },
  { key:'pressRelease',label:'Press Release',textarea:true }
]
const windowFields = [{ key:'slug',label:'Slug' },{ key:'title',label:'Title' },{ key:'startDate',label:'Start Date' },{ key:'endDate',label:'End Date' },{ key:'press',label:'Press Note',textarea:true }]
const vrFields = [{ key:'slug',label:'Slug' },{ key:'title',label:'Title' },{ key:'artist',label:'Artist' },{ key:'startDate',label:'Start Date' },{ key:'endDate',label:'End Date' },{ key:'text',label:'Curatorial Text',textarea:true }]
const pubFields = [{ key:'slug',label:'Slug' },{ key:'title',label:'Title' },{ key:'date',label:'Date' },{ key:'summary',label:'Summary',textarea:true }]
const newsFields = [{ key:'slug',label:'Slug' },{ key:'title',label:'Title' },{ key:'date',label:'Date' },{ key:'teaser',label:'Teaser',textarea:true }]
const studioFields = [{ key:'slug',label:'Slug' },{ key:'artist',label:'Artist' },{ key:'title',label:'Work Title' },{ key:'price',label:'Price' },{ key:'availability',label:'Availability (available|sold)' }]
</script>
EOF

########################################
# Server endpoints (Sitemap & Links & Health)
########################################
mk_sitemap() {
  local name="$1"; local coll="$2"; local base="$3"
  cat > "server/api/sitemap/${name}.get.ts" <<EOF
export default defineEventHandler(async () => {
  const items = await queryCollection('${coll}').select(['slug']).all()
  return items.map(i => \`/${base}/\${i.slug}\`)
})
EOF
}

mk_links() {
  local name="$1"; local coll="$2"
  cat > "server/api/links/${name}.get.ts" <<EOF
export default defineEventHandler(async () => {
  const items = await queryCollection('${coll}').select(['slug']).all()
  return items.map(i => i.slug)
})
EOF
}

# Add the required imports to runtime (Nuxt auto-available in Nitro)
# Exhibitions etc.
mk_sitemap "artists" "artists" "artists"
mk_sitemap "exhibitions" "exhibitions" "exhibitions"
mk_sitemap "window" "window" "window"
mk_sitemap "viewing-rooms" "viewing-rooms" "viewing-rooms"
mk_sitemap "publications" "publications" "publications"
mk_sitemap "news" "news" "news"

mk_links "artists" "artists"
mk_links "exhibitions" "exhibitions"
mk_links "window" "window"
mk_links "viewing-rooms" "viewing-rooms"
mk_links "publications" "publications"
mk_links "news" "news"

# Health check
cat > server/api/health.get.ts <<'EOF'
export default defineEventHandler(() => ({ ok: true, ts: new Date().toISOString() }))
EOF

########################################
# Sample Content (matches schemas)
########################################
cat > content/artists/example-artist.yml <<'EOF'
slug: donya-h-aalipour
name: Donya Aalipour
bio: >
  Short biography paragraph.
image: /images/artists/donya.jpg
EOF

cat > content/exhibitions/example-exhibition.yml <<'EOF'
slug: Suspension-Time-Exterior-View
title: Suspension Time — Exterior View
artists: ["Shirin Heidarinezhad"]
startDate: 2025-09-05
endDate: 2025-09-10
status: current
year: 2025
pressRelease: |
  Short press note here.
images:
  - /images/exhibitions/suspension-time/1.jpg
works:
  - title: Untitled (I)
    medium: Oil on canvas
    dims: 100 × 80 cm
    availability: available
EOF

cat > content/window/example-window.yml <<'EOF'
slug: The-Tremor-in-the-Brightest-Day
title: The Tremor in the Brightest Day
startDate: 2025-09-05
endDate: 2025-09-17
press: |
  Curatorial blurb.
images:
  - /images/window/tremor/1.jpg
EOF

cat > content/viewing-rooms/example-vr.yml <<'EOF'
slug: a-remembrance-of-fallen-leaves
title: A Remembrance of Fallen Leaves
artist: Boyeh Sadatnia
startDate: 2022-07-01
endDate: 2022-07-18
text: |
  Online viewing room text.
images:
  - /images/vr/fallen-leaves/1.jpg
EOF

cat > content/publications/example-publication.md <<'EOF'
---
slug: Annual-Report-2023-2024
title: Annual Report 2023–2024
date: 2024-11-27
summary: Annual highlights and statistics.
coverImage: /images/publications/annual-2324.jpg
---
Body (markdown) for publication.
EOF

cat > content/news/example-news.md <<'EOF'
---
slug: O-Gallery-at-Paper-Positions-Berlin_1
title: O Gallery at Paper Positions Berlin
date: 2025-05-01
teaser: Fair announcement and attending artists.
coverImage: /images/news/pp-berlin.jpg
---
News body (markdown).
EOF

cat > content/studio/example-work.yml <<'EOF'
slug: sample-work-001
artist: Sample Artist
title: Untitled
price: T 50,000,000
availability: available
image: /images/studio/sample-001.jpg
EOF

########################################
# Quality-of-life: .gitignore & env shim (optional)
########################################
if [ ! -f .gitignore ]; then
cat > .gitignore <<'EOF'
node_modules
.nitro
.output
.nuxt
.DS_Store
.env*
.data/
EOF
fi

# optional env types (not using process.* in config, but handy for server code)
if [ ! -f env.d.ts ]; then
  echo '/// <reference types="node" />' > env.d.ts
fi

echo "✅ Scaffold complete.
Next:
  npm install
  npm run dev

Admin:
  - Visit /admin/login (password: change-me-now)
  - Edit collections, Export/Import JSON
Routes:
  - /artists, /exhibitions, /viewing-rooms, /window, /publications, /news, /studio, /gallery
Sitemap/Robots:
  - /sitemap.xml (prerendered), /robots.txt
"
