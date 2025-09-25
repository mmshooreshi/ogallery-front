<!-- app/pages/admin/index.vue -->
<template>
  <div class="min-h-screen flex bg-[var(--ui-bg,#f6f7f9)] text-[var(--ui-fg,#111)]">
    <!-- Sidebar -->
    <aside
      :class="['fixed inset-y-0 left-0 z-40 w-72 border-r bg-white shadow-sm transition-transform',
               sidebarOpen ? 'translate-x-0' : '-translate-x-full',
               'md:static md:translate-x-0']">
      <div class="h-14 flex items-center px-4 border-b">
        <span class="font-semibold">OGallery Admin</span>
        <button class="ml-auto md:hidden border rounded-lg px-2 py-1.5" @click="sidebarOpen=false">✕</button>
      </div>

      <nav class="p-3 space-y-1 text-sm">
        <RouterLink to="/admin" class="navlink" exact-active-class="navlink--active">Dashboard</RouterLink>
        <RouterLink to="/admin/users" class="navlink">Users</RouterLink>
        <RouterLink to="/admin/media" class="navlink">Media</RouterLink>
        <RouterLink to="/admin/settings" class="navlink">Settings</RouterLink>
        <RouterLink to="/admin/analytics" class="navlink">Analytics</RouterLink>
      </nav>

      <div class="px-3 pt-4 pb-6 border-t mt-auto hidden md:block">
        <p class="text-xs text-gray-500">Tip: ⌘/Ctrl+E (Export), ⌘/Ctrl+I (Import), ⌘/Ctrl+N (New)</p>
      </div>
    </aside>

    <!-- Main -->
    <div class="flex-1 min-w-0 flex flex-col">
      <!-- Top bar -->
      <header class="sticky top-0 z-30 bg-white/90 backdrop-blur border-b">
        <div class="h-14 flex items-center gap-3 px-4">
          <button class="md:hidden border rounded-lg px-2 py-1.5" @click="sidebarOpen=true" aria-label="Open menu">☰</button>
          <h1 class="text-base md:text-lg font-semibold tracking-tight">Dashboard</h1>
          <span class="text-xs text-gray-500 hidden sm:inline">Manage content & data</span>
          <div class="flex-1" />

          <!-- Quick search -->
          <div class="relative hidden md:block">
            <input
              v-model="q.search" @input="debouncedLoad()"
              type="search" placeholder="Search…"
              class="w-72 border rounded-xl pl-9 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-black/70"
            />
            <span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔎</span>
          </div>

          <!-- Identity / logout -->
          <div class="flex items-center gap-2">
            <span v-if="me" class="hidden sm:block text-sm text-gray-600 truncate max-w-[180px]">{{ me.email }} · {{ me.role }}</span>
            <button class="border rounded-xl px-3 py-1.5 hover:bg-gray-50" @click="doLogout">Logout</button>
          </div>
        </div>

        <!-- Collections + actions -->
        <div class="px-4 pb-3 flex flex-wrap items-center gap-2">
          <div class="flex items-center gap-2 overflow-auto pr-1">
            <button
              v-for="c in collections" :key="c"
              class="px-3 py-1.5 rounded-xl border whitespace-nowrap"
              :class="q.c===c ? 'bg-black text-white' : 'hover:bg-gray-50'"
              @click="select(c)"
            >{{ c }}</button>
          </div>
          <div class="flex-1" />
          <div class="flex items-center gap-2">
            <button class="border rounded-xl px-3 py-1.5 hover:bg-gray-50" @click="onExport" title="Export (⌘/Ctrl+E)">Export</button>
            <label class="border rounded-xl px-3 py-1.5 hover:bg-gray-50 cursor-pointer" @dragover.prevent @drop.prevent="onDrop">
              <input ref="file" type="file" class="hidden" accept="application/json" @change="onImport" />
              Import
            </label>
            <button class="rounded-xl px-3 py-1.5 bg-black text-white hover:opacity-95" @click="openCreate" title="New (⌘/Ctrl+N)">New</button>
          </div>
        </div>
      </header>

      <!-- Filters (mobile shows search here) -->
      <section class="px-4 pt-4 flex flex-wrap items-center gap-2">
        <div class="relative md:hidden flex-1 min-w-0">
          <input
            v-model="q.search" @input="debouncedLoad()"
            type="search" placeholder="Search…"
            class="w-full border rounded-xl pl-9 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-black/70"
          />
          <span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔎</span>
        </div>

        <select v-model.number="q.take" @change="load()"
                class="border rounded-xl px-2 py-2 focus:outline-none focus:ring-2 focus:ring-black/70">
          <option :value="10">10</option><option :value="25">25</option><option :value="50">50</option>
        </select>

        <div v-if="selected.size" class="ml-auto flex items-center gap-2">
          <span class="text-sm text-gray-600">{{ selected.size }} selected</span>
          <button class="border rounded-xl px-3 py-1.5 hover:bg-gray-50" @click="bulkDelete">Delete</button>
          <button class="border rounded-xl px-3 py-1.5 hover:bg-gray-50" @click="clearSelection">Clear</button>
        </div>
      </section>

      <!-- Table -->
      <main class="p-4 pt-2 space-y-4">
        <div class="overflow-auto rounded-2xl border bg-white">
          <table class="min-w-full text-sm">
            <thead class="bg-gray-50 sticky top-0 z-10">
              <tr>
                <th class="px-3 py-2 w-10 text-left">
                  <input type="checkbox" :checked="allSelected" @change="toggleAll" />
                </th>
                <th v-for="f in fields" :key="f.key" class="text-left px-3 py-2 whitespace-nowrap">
                  {{ f.label }}
                </th>
                <th class="px-3 py-2 w-24"></th>
              </tr>
            </thead>
            <tbody>
              <!-- skeletons -->
              <tr v-if="loading" v-for="n in 6" :key="'s'+n" class="border-t">
                <td class="px-3 py-3"><div class="h-4 w-4 bg-gray-200 animate-pulse rounded"></div></td>
                <td v-for="f in fields" :key="f.key" class="px-3 py-3">
                  <div class="h-4 w-[60%] bg-gray-200 animate-pulse rounded"></div>
                </td>
                <td class="px-3 py-3"></td>
              </tr>

              <!-- rows -->
              <tr v-for="it in rows" :key="rowKey(it)" class="border-t hover:bg-gray-50/60">
                <td class="px-3 py-2">
                  <input type="checkbox" :checked="selected.has(rowKey(it))" @change="toggleRow(it)" />
                </td>
                <td v-for="f in fields" :key="f.key" class="px-3 py-2 align-top">
                  <span v-if="isDate(f, it)">{{ fmtDate(it[f.key]) }}</span>
                  <span v-else-if="isArray(f, it)" class="text-gray-700">{{ (it[f.key]||[]).join(', ') }}</span>
                  <span v-else class="block max-w-[28ch] truncate" :title="toText(it[f.key])">
                    {{ toText(it[f.key]) }}
                  </span>
                </td>
                <td class="px-3 py-2 text-right whitespace-nowrap">
                  <button class="px-2 py-1 border rounded mr-1 hover:bg-gray-50" @click="openEdit(it)">Edit</button>
                  <button class="px-2 py-1 border rounded hover:bg-gray-50" @click="remove(it)">Del</button>
                </td>
              </tr>

              <tr v-if="!loading && !rows.length">
                <td :colspan="fields.length + 2" class="px-3 py-10 text-center text-gray-500">No items found.</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Pager -->
        <div class="flex items-center gap-2">
          <button class="border rounded-xl px-3 py-1.5 hover:bg-gray-50" :disabled="q.skip===0" @click="prev">Prev</button>
          <button class="border rounded-xl px-3 py-1.5 hover:bg-gray-50" :disabled="rows.length<q.take" @click="next">Next</button>
          <span class="text-sm text-gray-500">Offset {{ q.skip }}</span>
        </div>
      </main>
    </div>

    <!-- Drawer (create/edit) -->
    <div v-show="drawer" class="fixed inset-0 z-50">
      <div class="absolute inset-0 bg-black/30" @click="closeDrawer"></div>
      <section class="absolute right-0 top-0 h-full w-full max-w-xl bg-white border-l shadow-xl flex flex-col">
        <header class="px-5 py-4 border-b flex items-center justify-between">
          <h2 class="text-lg font-semibold">{{ editing ? 'Edit' : 'Create' }} {{ q.c }}</h2>
          <button class="border rounded-lg px-2 py-1.5 hover:bg-gray-50" @click="closeDrawer" aria-label="Close">✕</button>
        </header>

        <div class="p-5 space-y-4 overflow-auto">
          <div v-for="f in fields" :key="f.key" class="grid gap-1">
            <label class="text-sm font-medium">{{ f.label }}</label>

            <!-- textarea -->
            <textarea v-if="f.type==='textarea'" v-model="form[f.key]" rows="6"
              class="border rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black/70"></textarea>

            <!-- date -->
            <input v-else-if="f.type==='date'" v-model="form[f.key]" type="date"
              class="border rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black/70" />

            <!-- array (comma separated) -->
            <input v-else-if="isArrayField(f.key)" :value="(form[f.key]||[]).join(', ')"
              @input="e => (form[f.key] = toArray((e.target as HTMLInputElement).value))"
              class="border rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black/70"
              placeholder="a, b, c" />

            <!-- number -->
            <input v-else-if="f.type==='number'" v-model.number="form[f.key]" type="number" step="any"
              class="border rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black/70" />

            <!-- checkbox -->
            <input v-else-if="f.type==='checkbox'" v-model="form[f.key]" type="checkbox"
              class="h-5 w-5 rounded border" />

            <!-- text -->
            <input v-else v-model="form[f.key]"
              class="border rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black/70" />
          </div>
        </div>

        <footer class="px-5 py-4 border-t flex items-center justify-end gap-2">
          <button class="border rounded-xl px-3 py-1.5 hover:bg-gray-50" @click="closeDrawer">Cancel</button>
          <button class="rounded-xl px-3 py-1.5 bg-black text-white hover:opacity-95" @click="save">Save</button>
        </footer>
      </section>
    </div>

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
definePageMeta({ middleware: 'admin-auth' })

/* identity */
const { me, refresh, logout } = useAdminAuth()
onMounted(() => { refresh() })
async function doLogout() {
  try { await $fetch('/api/admin/session', { method: 'DELETE', credentials: 'include' }) }
  finally { await logout(); await navigateTo('/admin/login', { replace: true }) }
}

/* sidebar */
const sidebarOpen = ref(false)

/* dynamic meta (from server; no hardcoding) */
type Field = { key: string; label: string; type: 'text'|'textarea'|'date'|'number'|'checkbox'|'array' }
type Meta = Record<string, Field[]>

const meta = ref<Meta>({})
const q = reactive({ c: '' as string, take: 25, skip: 0, search: '' })
const rows = ref<any[]>([])
const loading = ref(false)
const selected = ref<Set<string>>(new Set())

/* file input ref */
const file = ref<HTMLInputElement|null>(null)

/* drawer state */
const drawer = ref(false)
const editing = ref(false)
const form = reactive<Record<string, any>>({})

/* routing: keep collection in URL */
const route = useRoute(), router = useRouter()
watch(() => route.query.c, v => { if (typeof v==='string' && v!==q.c) { q.c=v; q.skip=0; selected.value.clear(); load() } })
function select(c: string) { router.replace({ query: { ...route.query, c } }) }

/* init meta */
onMounted(async () => {
  meta.value = await $fetch('/api/admin/meta', { credentials: 'include' })
  if (!q.c) select(Object.keys(meta.value)[0] || '')
})

const collections = computed(() => Object.keys(meta.value))
const fields = computed<Field[]>(() => meta.value[q.c] || [])

/* table ops */
async function load() {
  if (!q.c) return
  loading.value = true
  try {
    rows.value = await $fetch<any[]>(`/api/admin/${q.c}`, {
      params: { take: q.take, skip: q.skip, q: q.search },
      credentials: 'include'
    })
  } catch (e:any) {
    toast(e?.data?.message || 'Failed to load', 'red'); rows.value = []
  } finally { loading.value = false }
}
const debouncedLoad = useDebounceFn(load, 300)
function next(){ q.skip += q.take; load() }
function prev(){ q.skip = Math.max(0, q.skip - q.take); load() }
function rowKey(it:any){ return String(it.slug ?? it.id ?? JSON.stringify(it)) }
const allSelected = computed(() => rows.value.length && rows.value.every(r => selected.value.has(rowKey(r))))
function toggleRow(it:any){ const k=rowKey(it); selected.value.has(k) ? selected.value.delete(k) : selected.value.add(k) }
function toggleAll(){ if (allSelected.value) selected.value.clear(); else rows.value.forEach(r=>selected.value.add(rowKey(r))) }
function clearSelection(){ selected.value.clear() }

async function bulkDelete() {
  if (!selected.value.size) return
  if (!confirm(`Delete ${selected.value.size} item(s)?`)) return
  for (const it of rows.value) {
    if (selected.value.has(rowKey(it))) {
      await $fetch(`/api/admin/${q.c}/${encodeURIComponent(it.slug)}`, { method: 'DELETE', credentials: 'include' }).catch(()=>{})
    }
  }
  toast('Deleted', 'green'); selected.value.clear(); load()
}

/* value helpers */
function isDate(f: Field, it:any){ return f.type==='date' && it?.[f.key] }
function isArray(f: Field, it:any){ return Array.isArray(it?.[f.key]) }
function toText(v:any){ if (v==null) return ''; if (Array.isArray(v)) return v.join(', '); if (typeof v==='object') return JSON.stringify(v); return String(v) }
function fmtDate(v:any){ return String(v).slice(0,10) }
function isArrayField(key: string){ return /(images|tags|artists)$/i.test(key) }
function toArray(s: string){ return s.split(',').map(v=>v.trim()).filter(Boolean) }

/* drawer (create/edit) */
function openCreate(){ editing.value=false; buildForm(); drawer.value=true }
function openEdit(it:any){ editing.value=true; buildForm(it); drawer.value=true }
function closeDrawer(){ drawer.value=false }
function buildForm(src?: any) {
  const base: Record<string, any> = {}
  for (const f of fields.value) {
    const v = src?.[f.key]
    base[f.key] = v ?? (f.type==='date' ? '' : f.type==='checkbox' ? false : isArrayField(f.key) ? [] : f.type==='number' ? 0 : '')
  }
  Object.assign(form, base)
}
async function save() {
  try {
    await $fetch(`/api/admin/${q.c}`, { method:'PUT', body: form, credentials:'include' })
    toast('Saved', 'green'); drawer.value=false; load()
  } catch (e:any) { toast(e?.data?.message || 'Save failed', 'red') }
}
async function remove(it:any){
  if (!confirm('Delete this item?')) return
  try { await $fetch(`/api/admin/${q.c}/${encodeURIComponent(it.slug)}`, { method:'DELETE', credentials:'include' }); toast('Deleted', 'green'); load() }
  catch (e:any) { toast(e?.data?.message || 'Delete failed', 'red') }
}

/* import / export */
async function onExport(){
  try {
    const json = await $fetch<string>('/api/admin/export', { credentials:'include' })
    const url = URL.createObjectURL(new Blob([json], { type:'application/json' }))
    const a = document.createElement('a'); a.href=url; a.download = `export-${new Date().toISOString().slice(0,19)}.json`; a.click(); URL.revokeObjectURL(url)
    toast('Exported', 'green')
  } catch { toast('Export failed', 'red') }
}
async function onImport(e: Event){ const f=(e.target as HTMLInputElement).files?.[0]; if (f) await importFile(f) }
async function onDrop(e: DragEvent){ const f=e.dataTransfer?.files?.[0]; if (f?.type==='application/json') await importFile(f) }
async function importFile(f: File){
  try { const data=JSON.parse(await f.text()); await $fetch('/api/admin/import',{ method:'POST', body:data, credentials:'include' }); toast('Imported', 'green'); load() }
  catch { toast('Import failed (check JSON)', 'red') }
  finally { if (file.value) file.value.value='' }
}

/* shortcuts */
onMounted(()=> {
  const onKey=(e:KeyboardEvent)=>{ const m=e.metaKey||e.ctrlKey; if(!m) return
    const k=e.key.toLowerCase()
    if(k==='e'){ e.preventDefault(); onExport() }
    if(k==='i'){ e.preventDefault(); file.value?.click() }
    if(k==='n'){ e.preventDefault(); openCreate() }
  }
  window.addEventListener('keydown', onKey)
  
})
onUnmounted(()=> window.removeEventListener('keydown', onKey))

/* toasts (inline) */
type Toast = { id:number; msg:string; color:'gray'|'green'|'red' }
const toasts = ref<Toast[]>([])
function toast(msg:string, color:Toast['color']='gray'){ const id=Date.now()+Math.random(); toasts.value.push({id,msg,color}); setTimeout(()=>toasts.value = toasts.value.filter(t=>t.id!==id), 2400) }
</script>

<style scoped>
.navlink { display:block; padding:.55rem .75rem; border-radius:.75rem; border:1px solid transparent; }
.navlink:hover { background:#f6f7f9; }
.navlink--active { background:#111; color:#fff; }
:root { --ui-bg:#f6f7f9; --ui-fg:#111; }
</style>
