<template>
  <div class="min-h-screen bg-[var(--ui-bg,#f6f7f9)] text-[var(--ui-fg,#111)]">
    <!-- Header -->
    <header class="sticky top-0 z-20 bg-white/90 backdrop-blur border-b">
      <div class="h-14 flex items-center gap-3 px-4">
        <h1 class="text-base md:text-lg font-semibold">All Media</h1>
        <div class="flex-1"></div>
        <div class="relative">
          <input v-model="q" type="search" placeholder="Search (url, alt, caption)…"
                 class="w-[22rem] border rounded-xl pl-9 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-black/70" />
          <span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔎</span>
        </div>
        <label class="ml-2 inline-flex items-center gap-2 text-sm cursor-pointer">
          <input type="checkbox" v-model="onlyImages" class="rounded border-gray-300" />
          Images only
        </label>
        <label class="ml-2 inline-flex items-center gap-2 text-sm cursor-pointer">
          <input type="checkbox" v-model="onlyPublic" class="rounded border-gray-300" />
          Public only
        </label>
      </div>
    </header>

    <!-- Grid -->
    <main class="p-4">
      <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
        <div v-for="f in filtered" :key="f.uid"
             class="group rounded-xl bg-white p-3 hover:shadow-sm border border-transparent transition-all">
          <!-- Preview -->
          <div class="relative h-36 grid place-items-center overflow-hidden rounded-lg bg-gray-50">
            <img v-if="isImage(f)" :src="thumb(f)" class="object-cover w-full h-full" alt="" />
            <div v-else class="text-3xl">📄</div>

            <button class="absolute top-2 right-2 text-xs border rounded px-2 py-1 bg-white/90 hover:bg-white"
                    @click.stop="togglePublic(f)">
              {{ f.isPublic ? 'Public' : 'Private' }}
            </button>
          </div>

          <!-- Title -->
          <div class="mt-2 font-medium truncate" :title="f.name">
            {{ displayName(f.name || f.url.split('/').pop()) }}
          </div>
          <div class="text-xs text-gray-500 truncate">{{ bytes(f.size) }} · {{ f.mime || 'unknown' }}</div>

          <!-- Actions -->
          <div class="mt-3 flex items-center justify-between">
            <button class="text-xs border rounded px-2 py-1 hover:bg-gray-50" @click="copyLink(f)">Copy link</button>
            <div class="flex items-center gap-2">
              <button class="text-xs border rounded px-2 py-1 hover:bg-gray-50" @click="openEditor(f)">Edit</button>
              <button class="text-xs border rounded px-2 py-1 hover:bg-red-50 text-red-700" @click="confirmDelete(f)">Delete</button>
            </div>
          </div>
        </div>
      </div>

      <div v-if="loading && !items.length" class="text-center text-gray-500 mt-8">Loading…</div>
      <div v-if="!loading && !filtered.length" class="text-center text-gray-500 mt-8">No media found.</div>

      <div class="flex items-center justify-center mt-6" v-if="nextToken">
        <button class="border rounded-xl px-3 py-1.5 hover:bg-gray-50" @click="loadMore">Load more</button>
      </div>
    </main>

    <!-- Edit Modal -->
    <transition name="fade">
      <div v-if="editor.show" class="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm grid place-items-center p-4">
        <div class="w-[min(980px,96vw)] max-h-[90vh] overflow-auto bg-white rounded-2xl shadow-lg border">
          <div class="sticky top-0 bg-white z-10 border-b px-4 py-3 flex items-center">
            <div class="font-semibold">Edit Media</div>
            <div class="ml-auto flex items-center gap-2">
              <button class="text-xs border rounded px-2 py-1" @click="saveEditor" :disabled="editor.saving">
                {{ editor.saving ? 'Saving…' : 'Save' }}
              </button>
              <button class="text-xs border rounded px-2 py-1" @click="closeEditor">Close</button>
            </div>
          </div>

          <div class="grid md:grid-cols-2 gap-6 p-4">
            <!-- Left: Preview and quick info -->
            <div>
              <div class="aspect-square bg-gray-50 rounded-xl overflow-hidden grid place-items-center">
                <img v-if="isImage(editor.data)" :src="thumb(editor.data)" class="object-contain w-full h-full" />
                <div v-else class="text-5xl">📄</div>
              </div>
              <div class="mt-3 text-sm grid gap-1">
                <div><b>ID:</b> {{ editor.data.id }}</div>
                <div class="truncate"><b>URL (key):</b> <code class="bg-black/5 px-1.5 py-0.5 rounded">{{ editor.data.url }}</code></div>
                <div><b>Public:</b> {{ editor.data.isPublic ? 'Yes' : 'No' }}</div>
                <div><b>MIME:</b> {{ editor.data.mime || '—' }}</div>
                <div><b>Size:</b> {{ bytes(editor.data.size) || '—' }}</div>
                <div><b>Dimensions:</b> {{ dims(editor.data) }}</div>
                <div><b>Duration:</b> {{ duration(editor.data.durationMs) }}</div>
                <div><b>Created:</b> {{ dt(editor.data.createdAt) }}</div>
                <div><b>Updated:</b> {{ dt(editor.data.updatedAt) }}</div>
                <div v-if="editor.data.createdBy"><b>Created by:</b> {{ editor.data.createdBy.email || editor.data.createdBy.id }}</div>
              </div>
            </div>

            <!-- Right: Editable fields -->
            <div class="grid gap-3">
              <div class="grid gap-1">
                <label class="text-sm font-medium">Kind</label>
                <input v-model="editor.form.kind" class="border rounded px-2 py-1.5" placeholder="image|video|document…" />
              </div>

              <div class="grid gap-1">
                <label class="text-sm font-medium">Alt</label>
                <input v-model="editor.form.alt" class="border rounded px-2 py-1.5" placeholder="Accessible alt text" />
              </div>

              <div class="grid gap-1">
                <label class="text-sm font-medium">Caption</label>
                <textarea v-model="editor.form.caption" rows="2" class="border rounded px-2 py-1.5"></textarea>
              </div>

              <div class="grid gap-1">
                <label class="text-sm font-medium">Credit</label>
                <input v-model="editor.form.credit" class="border rounded px-2 py-1.5" placeholder="Photographer / source" />
              </div>

              <div class="grid gap-1">
                <label class="text-sm font-medium">Copyright</label>
                <input v-model="editor.form.copyright" class="border rounded px-2 py-1.5" placeholder="© 2025 Example" />
              </div>

              <div class="grid grid-cols-2 gap-3">
                <div class="grid gap-1">
                  <label class="text-sm font-medium">Width (px)</label>
                  <input v-model.number="editor.form.width" type="number" class="border rounded px-2 py-1.5" />
                </div>
                <div class="grid gap-1">
                  <label class="text-sm font-medium">Height (px)</label>
                  <input v-model.number="editor.form.height" type="number" class="border rounded px-2 py-1.5" />
                </div>
              </div>

              <div class="grid gap-1">
                <label class="text-sm font-medium">Duration (ms)</label>
                <input v-model.number="editor.form.durationMs" type="number" class="border rounded px-2 py-1.5" />
              </div>

              <div class="grid gap-1">
                <label class="text-sm font-medium">Public</label>
                <select v-model="editor.form.isPublic" class="border rounded px-2 py-1.5">
                  <option :value="true">Public</option>
                  <option :value="false">Private</option>
                </select>
              </div>

              <div class="grid gap-1">
                <label class="text-sm font-medium">Variants (JSON)</label>
                <textarea v-model="editor.form.variantsText" rows="4" class="font-mono text-xs border rounded px-2 py-1.5"></textarea>
                <p v-if="editor.errors.variants" class="text-xs text-red-600">{{ editor.errors.variants }}</p>
              </div>

              <div class="grid gap-1">
                <label class="text-sm font-medium">Meta (JSON)</label>
                <textarea v-model="editor.form.metaText" rows="4" class="font-mono text-xs border rounded px-2 py-1.5"></textarea>
                <p v-if="editor.errors.meta" class="text-xs text-red-600">{{ editor.errors.meta }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </transition>

    <!-- Delete confirm -->
    <transition name="fade">
      <div v-if="confirm.show" class="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm grid place-items-center p-4">
        <div class="w-[min(520px,92vw)] bg-white rounded-2xl shadow-lg border p-5">
          <div class="font-semibold mb-2">Delete media</div>
          <p class="text-sm text-gray-600">Delete <b>{{ confirm.item?.url }}</b> permanently?</p>
          <div class="mt-4 flex items-center justify-end gap-2">
            <button class="text-xs border rounded px-2 py-1" @click="confirm.show=false">Cancel</button>
            <button class="text-xs border rounded px-2 py-1 text-red-700 hover:bg-red-50" @click="doDelete">Delete</button>
          </div>
        </div>
      </div>
    </transition>

    <!-- Toasts -->
    <div class="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 space-y-2">
      <div v-for="t in toasts" :key="t.id" class="rounded-xl px-3 py-2 shadow text-white"
           :class="t.color==='red' ? 'bg-red-600' : t.color==='green' ? 'bg-green-600' : 'bg-gray-900'">
        {{ t.msg }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// @ts-ignore
definePageMeta({ middleware: 'admin-auth' })

type Media = {
  id: number
  url: string
  kind?: string | null
  mime?: string | null
  size?: number | null
  width?: number | null
  height?: number | null
  durationMs?: number | null
  alt?: string | null
  caption?: string | null
  credit?: string | null
  copyright?: string | null
  variants?: any | null
  meta?: any | null
  isPublic: boolean
  createdAt: string | Date
  updatedAt: string | Date
  createdBy?: { id: number; email?: string | null } | null
  // extras from index.get.ts:
  name?: string
  dir?: string
  key?: string // same as url for index.get.ts
}

const q = ref('')
const onlyImages = ref(false)
const onlyPublic = ref(false)

const items = ref<Media[]>([])
const nextToken = ref<string|null>(null)
const loading = ref(false)

onMounted(load)

// Load using the existing /api/media (S3 + DB) endpoint
async function load() {
  loading.value = true
  try {
    const res = await $fetch<any>('/api/media', { params: { prefix: '', limit: 100 }, credentials: 'include' })
    // Convert to Media-like; files only
    const files = (res.items || []).filter((i: any) => i.type === 'file')
    items.value = files.map((f: any) => ({
      id: f.id ?? 0,
      url: f.key,         // server still returns "key" in index.get.ts
      key: f.key,
      name: f.name,
      dir: f.dir,
      mime: f.mime,
      size: f.size,
      isPublic: !!f.isPublic,
      createdAt: f.lastModified || new Date().toISOString(),
      updatedAt: f.lastModified || new Date().toISOString(),
    }))
    nextToken.value = res.nextToken || null
  } finally {
    loading.value = false
  }
}
async function loadMore() {
  if (!nextToken.value) return
  const res = await $fetch<any>('/api/media', { params: { prefix: '', limit: 100, token: nextToken.value }, credentials: 'include' })
  const files = (res.items || []).filter((i: any) => i.type === 'file')
  items.value = items.value.concat(files.map((f: any) => ({
    id: f.id ?? 0,
    url: f.key,
    key: f.key,
    name: f.name,
    dir: f.dir,
    mime: f.mime,
    size: f.size,
    isPublic: !!f.isPublic,
    createdAt: f.lastModified || new Date().toISOString(),
    updatedAt: f.lastModified || new Date().toISOString(),
  })))
  nextToken.value = res.nextToken || null
}

/* ======= Filters ======= */
const filtered = computed(() => {
  const term = q.value.trim().toLowerCase()
  return items.value.filter(m => {
    if (onlyImages.value && !isImage(m)) return false
    if (onlyPublic.value && !m.isPublic) return false
    if (!term) return true
    const hay = [
      m.url, m.name, m.mime,
      (m as any).alt, (m as any).caption, (m as any).credit
    ].filter(Boolean).join(' ').toLowerCase()
    return hay.includes(term)
  }).map(m => ({ ...m, uid: m.url }))
})

/* ======= Helpers ======= */
function isImage(m: Partial<Media>) {
  const mime = m.mime || ''
  if (mime.startsWith('image/')) return true
  return /\.(png|jpe?g|gif|webp|avif|svg)$/i.test(m.url || '')
}
function thumb(m: Media | any) {
  const key = m.url || m.key
  return m.isPublic ? `/m/${encodeURIComponent(key)}` : `/api/media/sign?key=${encodeURIComponent(key)}`
}
function bytes(n?: number | null) {
  if (!n) return ''
  const k = 1024, u = ['B','KB','MB','GB','TB']
  const i = Math.floor(Math.log(n) / Math.log(k))
  return `${(n/Math.pow(k,i)).toFixed(1)} ${u[i]}`
}
function dims(m: Partial<Media>) {
  if (m.width && m.height) return `${m.width} × ${m.height}`
  return '—'
}
function duration(ms?: number | null) {
  if (!ms) return '—'
  const s = Math.round(ms / 1000)
  const mm = Math.floor(s / 60).toString().padStart(2,'0')
  const ss = (s % 60).toString().padStart(2,'0')
  return `${mm}:${ss}`
}
function dt(x: string | Date) {
  const d = new Date(x)
  return d.toLocaleString()
}
function displayName(name?: string) {
  if (!name) return ''
  return name.replace(/[_-]+/g, ' ').replace(/\s+/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

/* ======= Actions ======= */
async function togglePublic(f: Media) {
  const next = !f.isPublic
  await $fetch('/api/media/ops', {
    method: 'POST',
    body: { action: 'file.togglePublic', key: f.url, isPublic: next },
    credentials: 'include'
  })
  f.isPublic = next
  toast(next ? 'Made public' : 'Made private', 'green')
}
async function copyLink(f: Media) {
  const url = f.isPublic
    ? `${location.origin}/m/${f.url}`
    : (await $fetch<{url:string}>('/api/media/sign',{ params:{ key:f.url }, credentials:'include' })).url
  await navigator.clipboard.writeText(url)
  toast('Copied link','green')
}
const confirm = reactive<{show:boolean; item: Media | null}>({ show:false, item:null })
function confirmDelete(f: Media){ confirm.show = true; confirm.item = f }
async function doDelete(){
  if (!confirm.item) return
  const key = confirm.item.url
  await $fetch('/api/media/ops',{ method:'POST', body:{ action:'file.delete', key }, credentials:'include' })
  items.value = items.value.filter(i => i.url !== key)
  confirm.show = false
  toast('Deleted','green')
}

/* ======= Editor Modal (loads full Prisma Media) ======= */
const editor = reactive({
  show: false,
  saving: false,
  data: {} as Media,
  form: {
    kind: '' as string | null,
    alt: '' as string | null,
    caption: '' as string | null,
    credit: '' as string | null,
    copyright: '' as string | null,
    width: null as number | null,
    height: null as number | null,
    durationMs: null as number | null,
    isPublic: false as boolean,
    variantsText: '' as string,
    metaText: '' as string,
  },
  errors: { variants: '', meta: '' }
})

async function openEditor(f: Media) {
  // Load full record from DB by id if present, otherwise by key/url
  const params = f.id ? { id: f.id } : { key: f.url }
  const rec = await $fetch<Media>('/api/media/record', { params, credentials: 'include' })
  editor.data = rec
  editor.form.kind = rec.kind || ''
  editor.form.alt = rec.alt || ''
  editor.form.caption = rec.caption || ''
  editor.form.credit = rec.credit || ''
  editor.form.copyright = rec.copyright || ''
  editor.form.width = rec.width ?? null
  editor.form.height = rec.height ?? null
  editor.form.durationMs = rec.durationMs ?? null
  editor.form.isPublic = !!rec.isPublic
  editor.form.variantsText = safeStringify(rec.variants)
  editor.form.metaText = safeStringify(rec.meta)
  editor.errors.variants = ''
  editor.errors.meta = ''
  editor.show = true
}

function closeEditor(){ editor.show = false }

function parseJSON(s: string) {
  if (!s.trim()) return null
  return JSON.parse(s)
}
function safeStringify(v: any) {
  if (v == null) return ''
  try { return JSON.stringify(v, null, 2) } catch { return '' }
}

async function saveEditor() {
  // Validate JSON
  editor.errors.variants = ''
  editor.errors.meta = ''
  let variants: any = null, meta: any = null
  try { variants = parseJSON(editor.form.variantsText) } catch (e:any) { editor.errors.variants = e.message || 'Invalid JSON' }
  try { meta = parseJSON(editor.form.metaText) } catch (e:any) { editor.errors.meta = e.message || 'Invalid JSON' }
  if (editor.errors.variants || editor.errors.meta) return

  editor.saving = true
  try {
    const data = {
      kind: emptyToNull(editor.form.kind),
      alt: emptyToNull(editor.form.alt),
      caption: emptyToNull(editor.form.caption),
      credit: emptyToNull(editor.form.credit),
      copyright: emptyToNull(editor.form.copyright),
      width: editor.form.width ?? null,
      height: editor.form.height ?? null,
      durationMs: editor.form.durationMs ?? null,
      isPublic: editor.form.isPublic,
      variants, meta,
    }
    await $fetch('/api/media/record.save', {
      method: 'POST',
      body: { id: editor.data.id, data },
      credentials: 'include'
    })
    // Reflect changes locally
    const idx = items.value.findIndex(i => i.url === editor.data.url)
    if (idx >= 0) {
      items.value[idx].isPublic = data.isPublic
      items.value[idx].mime = items.value[idx].mime || editor.data.mime || undefined
    }
    toast('Saved','green')
    editor.show = false
  } finally {
    editor.saving = false
  }
}

function emptyToNull(s: string | null) {
  if (s == null) return null
  const t = s.trim()
  return t ? t : null
}

/* ======= Toasts ======= */
const toasts = ref<{id:number; msg:string; color:'gray'|'green'|'red'}[]>([])
function toast(msg:string, color:'gray'|'green'|'red'='gray'){ const id=Date.now()+Math.random(); toasts.value.push({id,msg,color}); setTimeout(()=>toasts.value = toasts.value.filter(t=>t.id!==id), 2200) }

/* ======= Transitions ======= */
</script>

<style scoped>
:root { --ui-bg:#f6f7f9; --ui-fg:#111 }
.fade-enter-active,.fade-leave-active{ transition: opacity .12s }
.fade-enter-from,.fade-leave-to{ opacity:0 }
</style>
