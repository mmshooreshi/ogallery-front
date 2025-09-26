<!-- app/pages/admin/media.vue -->
<template>
  <div class="min-h-[100dvh] flex bg-[var(--ui-bg,#f6f7f9)] text-[var(--ui-fg,#111)]" @keydown.esc="closeAllOverlays">
    <!-- Sidebar -->
    <aside :class="['fixed inset-y-0 left-0 z-30 w-72 border-r bg-white shadow-sm transition-transform',
                   open ? 'translate-x-0' : '-translate-x-full', 'md:static md:translate-x-0']">
      <div class="h-14 flex items-center px-4 border-b">
        <span class="font-semibold">Media</span>
        <button class="ml-auto md:hidden border rounded-lg px-2 py-1.5" @click="open=false">✕</button>
      </div>

      <div class="p-3 space-y-2 text-sm">
        <button class="w-full text-left px-3 py-1.5 rounded-lg hover:bg-gray-50 border" @click="go('')">Root</button>
        <div class="space-y-1">
          <div class="px-3 text-xs uppercase opacity-60">Folders</div>
          <button v-for="d in dirs" :key="d.uid"
                  class="w-full text-left px-3 py-1.5 rounded-lg hover:bg-gray-50"
                  @click="go(d.prefix)">
            {{ displayName(d.name) || '(root)' }}
          </button>
        </div>
      </div>

      <div class="mt-auto px-3 pb-4 hidden md:block text-xs text-gray-500">
        Drag & drop anywhere to upload. Use prefixes as folders.
      </div>
    </aside>

    <!-- Main -->
    <div class="flex-1 min-w-0 flex flex-col">
      <header class="sticky top-0 z-20 bg-white/90 backdrop-blur border-b">
        <div class="h-14 flex items-center gap-3 px-4">
          <button class="md:hidden border rounded-lg px-2 py-1.5" @click="open=true">☰</button>
          <h1 class="text-base md:text-lg font-semibold">Files</h1>
          <div class="flex-1"></div>
          <div class="relative hidden md:block">
            <input v-model="q" type="search" placeholder="Search…"
                   class="w-72 border rounded-xl pl-9 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-black/70" />
            <span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔎</span>
          </div>
          <label class="border rounded-xl px-3 py-1.5 hover:bg-gray-50 cursor-pointer ml-2">
            <input ref="pick" type="file" class="hidden" multiple @change="onPick" />
            Upload
          </label>

          <div class="mt-2 w-max flex gap-1">
            <Icon class="text-xl cursor-pointer transition-all hover:scale-110 active:scale-95" name="mdi:create-new-folder" @click="openNewFolderModal"/>
            <Icon class="text-xl cursor-pointer transition-all hover:scale-110 active:scale-95" name="bx:rename" @click="beginRenameFolder(prefix)"/>
            <Icon class="text-xl cursor-pointer transition-all hover:scale-110 active:scale-95" name="fluent:folder-move-16-regular"  @click="openMoveFolderModal(prefix)"/>
            <Icon class="text-xl cursor-pointer transition-all hover:scale-110 active:scale-95" name="fluent:delete-12-regular" @click="openDeleteFolderModal(prefix)"/>
          </div>
        </div>

        <div class="px-4 pb-3 text-sm">
          <span class="opacity-60">/</span>
          <template v-for="(seg, i) in breadcrumb" :key="i">
            <button class="underline decoration-dotted mx-1" @click="go(crumbPrefix(i))">{{ displayName(seg) || 'root' }}</button>
            <span class="opacity-60">/</span>
          </template>
        </div>
      </header>

      <main class="p-4 pt-2 flex-1 relative"
            @dragenter="onDocDragEnter" @dragover.prevent="onDocDragOver" @dragleave="onDocDragLeave" @drop.prevent="onDocDrop">

        <!-- Upload queue (same card persists from uploading to done) -->
        <!-- <div v-if="queue.length" class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 mb-6">
          <div v-for="u in queue" :key="u.uid" class="border rounded-xl bg-white p-3">
            <div class="relative h-28 grid place-items-center overflow-hidden rounded-lg" :class="u.done ? 'bg-green-50' : 'bg-gray-50'">
              <img v-if="u.preview" :src="u.preview" class="object-cover w-full h-full" />
              <div v-else class="text-3xl">⏫</div>
              <button v-if="!u.done && !u.error" class="absolute top-2 right-2 text-xs border rounded px-2 py-1 bg-white/90 hover:bg-white" @click="cancel(u)">Cancel</button>
            </div>
            <div class="mt-2 font-medium truncate" :title="u.file.name">{{ u.file.name }}</div>
            <div class="text-xs text-gray-500 truncate">{{ bytes(u.file.size) }}</div>
            <div class="h-2 bg-gray-100 rounded mt-2 overflow-hidden">
              <div class="h-full transition-[width]" :class="u.error ? 'bg-red-500' : 'bg-black'" :style="{ width: (u.done ? 100 : u.progress) + '%' }"></div>
            </div>
            <div class="text-xs mt-1" :class="u.error ? 'text-red-600':'text-gray-600'">
              {{ u.error || (u.done ? 'Done' : (u.progress.toFixed(0)+'%')) }}
            </div>
          </div>
        </div>
 -->
        <!-- Grid -->
        <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5  gap-1">
          <!-- Folders (droppable) -->
          <button v-for="d in filteredDirs" :key="d.uid"
                  class="scale-95  hover:scale-100 hover:border-teal cursor-pointer group rounded-xl bg-white p-3 text-left hover:shadow-sm border transition-all"
                  :class="droppingOn === d.prefix ? 'border-teal-400 ring-2 ring-teal-200' : 'border-transparent'"
                  @click="go(d.prefix)"
                  @dragover.prevent="onFolderDragOver(d)"
                  @dragleave="onFolderDragLeave(d)"
                  @drop.prevent="onFolderDrop(d)">
            <div class="h-28 grid place-items-center text-4xl">📁</div>
            <div class="mt-2 font-medium truncate" :title="d.name" @dblclick.stop="beginInlineRename('dir', d)">
              <template v-if="isEditing('dir', d)">
                <input v-model="editText" class="border rounded px-2 py-1 w-full" @keyup.enter="commitInlineRename('dir', d)" @blur="commitInlineRename('dir', d)" ref="inlineInputRef"/>
              </template>
              <template v-else>
                {{ displayName(d.name) || '(root)' }}
              </template>
            </div>
            <div class="text-xs text-gray-500 truncate">{{ d.prefix }}</div>
            <div class="mt-4 w-full flex justify-between">
              <Icon class="text-xl cursor-pointer transition-all hover:scale-110" name="bx:rename" @click.stop="beginInlineRename('dir', d)"/>
              <Icon class="text-xl cursor-pointer transition-all hover:scale-110" name="fluent:folder-move-16-regular"  @click.stop="openMoveFolderModal(d.prefix)"/>
              <Icon class="text-xl cursor-pointer transition-all hover:scale-110" name="fluent:delete-12-regular" @click.stop="openDeleteFolderModal(d.prefix)"/>
            </div>
          </button>

          <!-- Files (draggable) -->
          <button v-for="f in filteredFiles" :key="f.uid" class="scale-95  hover:scale-100 hover:border-blue cursor-pointer  rounded-xl bg-white p-3 hover:shadow-sm border border-transparent transition-all"
               draggable="true"  @click.stop="openInspect(f)" @dragstart="onFileDragStart(f)" @dragend="onFileDragEnd">
            <!-- <div class="relative h-28 grid place-items-center overflow-hidden rounded-lg bg-gray-50">
              <img v-if="isImage(f)" :src="thumb(f)" class="object-cover w-full h-full" alt="" />
              <div v-else class="text-3xl">📄</div>
              <button class="absolute top-2 right-2 text-xs border rounded px-2 py-1 bg-white/90 hover:bg-white" @click.stop="togglePublic(f)">{{ f.isPublic ? 'Public' : 'Private' }}</button>
            </div> -->
            <!-- inside file card -->
<div class="relative h-28 grid place-items-center overflow-hidden rounded-lg bg-gray-50">
  
    <img v-if="isImage(f)" :src="f.preview || thumb(f)" class="object-cover w-full h-full" />
  
  <div v-else class="text-3xl">📄 </div>

  <!-- Progress overlay -->
  <div v-if="f.uploading" class="absolute inset-0 bg-white/80 flex flex-col items-center justify-center">
    <div class="w-10/12 h-2 bg-gray-200 rounded overflow-hidden">
      <div class="h-full bg-black" :style="{ width: f.progress + '%' }"></div>
    </div>
    <div class="text-xs mt-1 text-gray-700">{{ f.progress }}%</div>
    <button class="mt-1 text-xs border rounded px-2 py-0.5 bg-white hover:bg-gray-50"
            @click.stop="cancelUpload(f)">Cancel</button>
  </div>

  <!-- Normal buttons only when not uploading -->
  <!-- <button v-else class="absolute top-2 right-2 text-xs border rounded px-2 py-1 bg-white/90 hover:bg-white"
          @click.stop="togglePublic(f)"> -->
          <div v-else class="group h-max bg-red" @click.stop="togglePublic(f)" > 
          <div  v-if="!f.isPublic"  class="w-full h-3 bg-red/10 group-hover:bg-red/50 top-0 left-0 absolute flex items-center justify-center">
          <Icon class="h-full text-red-800"name="material-symbols-light:cloud-lock"/>
          </div>
          <div  v-else class="w-full h-3 bg-teal/10 group-hover:bg-teal/50 top-0 left-0 absolute flex items-center justify-center">
        <Icon class="h-full text-teal-400"  name="tabler:lock-open-2"/>
          </div>
          </div>
    <!-- {{ f.isPublic ? 'Public' : 'Private' }} -->
  <!-- </button> -->
</div>

            <div class="mt-2 px-2  font-medium truncate" :title="f.name" @dblclick.stop="beginInlineRename('file', f)">
              <template v-if="isEditing('file', f)">
                <input v-model="editText" class="border rounded px-1 -ml-1 py-1 w-full" @keyup.enter="commitInlineRename('file', f)" @blur="commitInlineRename('file', f)" ref="inlineInputRef"/>
              </template>
              <template v-else>
                {{ displayName(f.name) }}
              </template>
            </div>
            <div class="text-xs text-gray-500 truncate">{{ bytes(f.size) }}</div>



            <!-- Actions row -->
            <div class="mt-2 w-full flex justify-between">



                                    <Icon
                        class="text-sm cursor-pointer hover:scale-140 active:scale-50 active:text-black transition-all text-blue-600/40 hover:text-blue-600"
                        name="mdi:cloud-upload"
                        @click.stop="actionUploadToBucket(f)" />

                    <!-- Update meta -->
                    <Icon
                        class="text-sm cursor-pointer hover:scale-140 active:scale-50 active:text-black transition-all text-amber-600/40  hover:text-amber-600"
                        name="mdi:database-edit"
                        @click.stop="actionUpdateMeta(f)" />

                    <!-- Update DB -->
                    <Icon
                        class="text-sm cursor-pointer hover:scale-140 active:scale-50 active:text-black transition-all text-green-600/40 hover:text-green-600"
                        name="mdi:database-plus"
                        @click.stop="actionUpdateDb(f)" />


            <Icon v-if="f.isPublic" class="text-md cursor-pointer transition-all hover:scale-140 active:scale-50 active:text-black   text-black/60 hover:text-teal-400/90"
                    name="ep:copy-document" @click.stop="copyLink(f)"/>

                <Icon class="text-md cursor-pointer transition-all hover:scale-140 active:scale-50 active:text-black text-black/60 hover:text-teal-400/90"
                    name="bx:rename" @click="beginInlineRename('file', f)"/>
                <Icon class="text-md cursor-pointer transition-all hover:scale-140 active:scale-50 active:text-black text-black/60 hover:text-teal-400/90"
                    name="fluent:folder-move-16-regular"  @click="openMoveFileModal(f)"/>
                <Icon class="text-md cursor-pointer transition-all hover:scale-140 active:scale-50 active:text-black text-black/60 hover:text-teal-400/90"
                    name="fluent:delete-12-regular" @click="openDeleteFileModal(f)"/>
            </div>

          
        </button>
        </div>

        <div v-if="!loading && !items.length" class="text-center text-gray-500 mt-10">This folder is empty.</div>

        <div class="flex items-center justify-center mt-6" v-if="nextToken">
          <button class="border rounded-xl px-3 py-1.5 hover:bg-gray-50" @click="loadMore">Load more</button>
        </div>

        <!-- Full-page Drag Overlay -->
        <transition name="fade">
          <div v-if="overlay.show" class="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm" @dragover.prevent @drop.prevent>
            <div class="absolute inset-0 grid place-items-center pointer-events-none">
              <div class="pointer-events-auto w-[min(700px,92vw)] rounded-2xl border-2" :class="overlay.hasFiles ? 'border-teal-500 bg-white' : 'border-black/50 bg-white/70'">
                <div class="p-6">
                  <div class="text-center text-3xl mb-3" :class="overlay.hasFiles ? 'text-teal-700' : 'text-gray-800'">
                    {{ overlay.hasFiles ? 'Drop to upload' : 'Drag files here to upload' }}
                  </div>
                  <div v-if="overlay.files.length" class="max-h-60 overflow-auto rounded-lg border">
                    <table class="w-full text-sm">
                      <thead class="bg-gray-50 sticky top-0">
                        <tr><th class="text-left px-3 py-2">Name</th><th class="text-left px-3 py-2">Type</th><th class="text-right px-3 py-2">Size</th></tr>
                      </thead>
                      <tbody>
                        <tr v-for="(f,i) in overlay.files" :key="i" class="odd:bg-white even:bg-gray-50">
                          <td class="px-3 py-2 truncate">{{ f.name }}</td>
                          <td class="px-3 py-2">{{ f.ext || 'unknown' }}</td>
                          <td class="px-3 py-2 text-right">{{ f.size ? bytes(f.size) : '' }}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  <div class="text-center mt-3 text-xs text-gray-500">Destination: <code class="bg-black/5 px-2 py-0.5 rounded">{{ prefix || '(root)' }}</code></div>
                </div>
              </div>
            </div>
          </div>
        </transition>

        <!-- Modals -->
        <Modal v-if="modal.show" :title="modal.title" :confirm="modal.confirmText" :cancel="modal.cancelText" @confirm="modalConfirm" @cancel="modalCancel">
          <div v-if="modal.kind==='delete-file'">
            Are you sure you want to delete <b>{{ modal.payload?.name }}</b>?
          </div>
          <div v-else-if="modal.kind==='delete-folder'">
            Delete folder <b>{{ modal.payload?.prefix }}</b> and <b>ALL</b> contents?
          </div>
          <div v-else-if="modal.kind==='move-file'" class="space-y-2">
            <label class="block text-sm">Move to (prefix/newname.ext):</label>
            <input v-model="modal.input" class="w-full border rounded px-2 py-1"/>
          </div>
          <div v-else-if="modal.kind==='move-folder'" class="space-y-2">
            <label class="block text-sm">Move folder to (new prefix):</label>
            <input v-model="modal.input" class="w-full border rounded px-2 py-1"/>
          </div>
          <div v-else-if="modal.kind==='new-folder'" class="space-y-2">
            <label class="block text-sm">New folder name (relative):</label>
            <input v-model="modal.input" class="w-full border rounded px-2 py-1"/>
          </div>
        </Modal>


        <Modal v-if="inspect.show" title="Media Inspector" confirm="Close" @confirm="inspect.show=false" @cancel="inspect.show=false">
  <div v-if="!inspect.data" class="text-gray-500 text-sm">Loading...</div>
  <template v-else>
    <!-- Tabs -->
    <div class="flex mb-3 border-b text-sm">
      <button
        :class="['px-3 py-1.5', inspect.tab==='db'?'border-b-2 border-black font-semibold':'opacity-60']"
        @click="inspect.tab='db'">DB</button>
      <button
        :class="['px-3 py-1.5', inspect.tab==='bucket'?'border-b-2 border-black font-semibold':'opacity-60']"
        @click="inspect.tab='bucket'">Bucket</button>
    </div>

    <!-- DB view -->
    <div v-if="inspect.tab==='db'" class="max-h-[50vh] overflow-auto">
      <table class="text-sm w-full">
        <tbody>
          <tr v-for="(v,k) in inspect.data.db" :key="k">
            <td class="px-2 py-1 font-medium">{{ k }}</td>
            <td class="px-2 py-1 break-all">{{ v }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Bucket view -->
    <div v-if="inspect.tab==='bucket'">
      <table class="text-sm w-full">
        <tbody>
          <tr v-for="(v,k) in inspect.data.bucket" :key="k">
            <td class="px-2 py-1 font-medium">{{ k }}</td>
            <td class="px-2 py-1 break-all">{{ v }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </template>
</Modal>

      </main>

      <!-- Toasts -->
      <div class="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 space-y-2">
        <div v-for="t in toasts" :key="t.id" class="rounded-xl px-3 py-2 shadow text-white"
          :class="t.color==='red' ? 'bg-red-600' : t.color==='green' ? 'bg-green-600' : 'bg-gray-900'">
          {{ t.msg }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import Modal from '~/components/Modal.vue'
import { normalizePath } from '~~/server/utils/paths'

// Nuxt page meta
// @ts-ignore
definePageMeta({ middleware: 'admin-auth' })

/* ======= Reactive State ======= */
const open = ref(false)
const pick = ref<HTMLInputElement|null>(null)
const q = ref('')
// state for inspect modal
const inspect = reactive<{ show:boolean; file:any|null; tab:'db'|'bucket'; data:any|null }>({
  show:false,
  file:null,
  tab:'db',
  data:null,
})



// Drag overlay state
const overlay = reactive({ show:false, hasFiles:false, files: [] as Array<{name:string; ext:string; size?:number}> })
let overlayDepth = 0

// Inline rename state
const editing = reactive<{kind: 'file'|'dir'|null; id: string|null}>({ kind:null, id:null })
const editText = ref('')
const inlineInputRef = ref<HTMLInputElement|null>(null)

// Data store with cache (to avoid flicker/lag)
const prefix = ref('')
const items = ref<any[]>([])
const nextToken = ref<string|null>(null)
const loading = ref(false)
const cache = reactive(new Map<string, { items:any[]; nextToken:string|null; ts:number }>)

// Derived
const dirs = computed(() => items.value.filter(i => i.type === 'dir'))
const files = computed(() => items.value.filter(i => i.type === 'file'))
const filteredDirs = computed(() => dirs.value.filter(d => displayName(d.name).toLowerCase().includes(q.value.toLowerCase())))
// const filteredFiles = computed(() => files.value.filter(f => displayName(f.name).toLowerCase().includes(q.value.toLowerCase())))

const filteredFiles = computed(() =>
  files.value.filter(f => {
    const term = q.value.toLowerCase()
    if (!term) return true
    const hay = [
      f.name, f.key, f.mime,
      ...(f.sync?.reasons || [])
    ].filter(Boolean).join(' ').toLowerCase()
    return hay.includes(term)
  })
)
const breadcrumb = computed(() => prefix.value.split('/').filter(() => true))
function crumbPrefix(i:number){ return breadcrumb.value.slice(0, i+1).join('/') }

onMounted(() => {
  load()
})


async function openInspect(f:any){
  inspect.show = true
  inspect.file = f
  inspect.tab = 'db'
  inspect.data = null
  try {
    const res = await $fetch('/api/media/detail', {
      params:{ key:f.key },
      credentials:'include'
    })
    inspect.data = res
  } catch(e:any) {
    toast('Failed to load details','red')
  }
}

/* ======= Util helpers ======= */
function displayName(name:string){
  if(!name) return ''
  // Turn snake_case/kebab into nicer label
  return name
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase())
}
function bytes(n?:number){ if(!n) return ''; const k=1024, u=['B','KB','MB','GB','TB']; const i=Math.floor(Math.log(n)/Math.log(k)); return `${(n/Math.pow(k,i)).toFixed(1)} ${u[i]}` }
// function isImage(f:any){ return (f.mime||'').startsWith('image/') || /\.(png|jpe?g|gif|webp|avif|svg)$/i.test(f.name) }
function isImage(f: any) {
  const mime = (f.mime || "").toLowerCase()
  if (mime.startsWith("image/")) return true

  const name = (f.name || f.url || "").split("?")[0] // strip query params
  return /\.(png|jpe?g|gif|webp|avif|svg)$/i.test(name)
}

function thumb(f:any){ return f.isPublic ? `/m/${f.key}` : `/api/media/sign?key=${encodeURIComponent(f.key)}` }



/* ======= Data loading with cache ======= */
async function load(){
  const cached = cache.get(prefix.value)
  if (cached) {
    items.value = cloneWithUids(cached.items)
    nextToken.value = cached.nextToken
    loading.value = false
    // Refresh in background without nuking UI
    refresh()
  } else {
    await refresh(true)
  }
}

async function refresh(blocking=false){
  try {
    if (blocking) loading.value = true
    const res = await $fetch('/api/media', { params: { prefix: prefix.value, limit: 60 }, credentials: 'include' })
    cache.set(prefix.value, { items: res.items, nextToken: res.nextToken, ts: Date.now() })
    items.value = cloneWithUids(res.items) // minimal replace
    nextToken.value = res.nextToken
  } finally {
    if (blocking) loading.value = false
  }
}

async function loadMore(){
  if (!nextToken.value) return
  const res = await $fetch('/api/media', { params: { prefix: prefix.value, limit: 60, token: nextToken.value }, credentials: 'include' })
  const merged = [...(cache.get(prefix.value)?.items || []), ...res.items]
  cache.set(prefix.value, { items: merged, nextToken: res.nextToken, ts: Date.now() })
  items.value = cloneWithUids(merged)
  nextToken.value = res.nextToken
}

function go(p:string){
  prefix.value=p.replace(/^\/+/, '')
  items.value=[]
  nextToken.value=null
  load()
}

function cloneWithUids(list:any[]){
  return list.map(it => ({ ...it, uid: `${it.type}:${it.key || it.prefix}` }))
}

// function cancelUpload(f:any) {
//   if (f.xhr && !f.uploading) return
//   f.xhr?.abort()
//   f.error = 'Cancelled'
// }
function cancelUpload(f:any) {
  if (f.xhr && f.uploading) {
    f.xhr.abort()
  }
}

/* ======= File privacy ======= */
async function togglePublic(f:any){
  const isPublic = !f.isPublic
  await $fetch('/api/media/ops', { method:'POST', body:{ action:'file.togglePublic', key:f.key, isPublic }, credentials:'include' })
  f.isPublic = isPublic; toast(isPublic?'Made public':'Made private','green')
}

async function copyLink(f:any){
  const url = f.isPublic ? `${location.origin}/m/${f.key}`
    : (await $fetch<{url:string}>('/api/media/sign',{ params:{ key:f.key }, credentials:'include' })).url
  await navigator.clipboard.writeText(url); toast('Copied link','green')
}

/* ======= Inline rename (file & folder) ======= */
function isEditing(kind:'file'|'dir', obj:any){ return editing.kind===kind && editing.id === (kind==='file'?obj.key:obj.prefix) }
function beginInlineRename(kind:'file'|'dir', obj:any){
  editing.kind = kind
  editing.id = kind==='file' ? obj.key : obj.prefix
  editText.value = obj.name
  nextTick(() => inlineInputRef.value?.focus())
}
async function commitInlineRename(kind:'file'|'dir', obj:any){
  const newName = editText.value?.trim()
  if(!newName || newName === obj.name){ endInlineRename(); return }
  if (kind==='file') {
    const to = normalizePath(obj.dir ? `${obj.dir}/${newName}` : newName)
    await $fetch('/api/media/ops',{ method:'POST', body:{ action:'file.move', from:obj.key, to }, credentials:'include' })
    toast('Renamed','green')
  } else {
    const basePrefix = (obj.prefix as string)
    const parent = basePrefix.split('/').slice(0,-1).join('/')
    const to = normalizePath([parent, newName].filter(Boolean).join('/'))
    await $fetch('/api/media/ops',{ method:'POST', body:{ action:'folder.rename', from:obj.prefix, to }, credentials:'include' })
    toast('Folder renamed','green')
    if (obj.prefix === prefix.value) {
      go(to)
      endInlineRename()
      return
    }
  }
  await refresh()
  endInlineRename()
}
function endInlineRename(){ editing.kind=null; editing.id=null; editText.value='' }

/* ======= Modals (nice UI instead of alerts/prompts) ======= */
const modal = reactive<{show:boolean; title:string; confirmText:string; cancelText:string; kind:string|null; payload:any; input:string}>({ show:false, title:'', confirmText:'OK', cancelText:'Cancel', kind:null, payload:null, input:'' })
function openDeleteFileModal(f:any){ modal.show=true; modal.title='Delete file'; modal.kind='delete-file'; modal.payload=f; modal.confirmText='Delete'; modal.cancelText='Cancel' }
function openDeleteFolderModal(p:string){ if(!p) return; modal.show=true; modal.title='Delete folder'; modal.kind='delete-folder'; modal.payload={ prefix:p }; modal.confirmText='Delete'; modal.cancelText='Cancel' }
function openMoveFileModal(f:any){ modal.show=true; modal.title='Move file'; modal.kind='move-file'; modal.payload=f; modal.input=`${prefix.value}/${f.name}`.replace(/^\/+/, ''); modal.confirmText='Move'; modal.cancelText='Cancel' }
function openMoveFolderModal(p:string){ if(!p) return; modal.show=true; modal.title='Move folder'; modal.kind='move-folder'; modal.payload={ prefix:p }; modal.input=p; modal.confirmText='Move'; modal.cancelText='Cancel' }
function openNewFolderModal(){ modal.show=true; modal.title='New folder'; modal.kind='new-folder'; modal.payload=null; modal.input=''; modal.confirmText='Create'; modal.cancelText='Cancel' }

async function modalConfirm(){
  const kind = modal.kind
  try {
    if(kind==='delete-file'){
      const f = modal.payload
      await $fetch('/api/media/ops',{ method:'POST', body:{ action:'file.delete', key:f.key }, credentials:'include' })
      toast('Deleted','green')
      items.value = items.value.filter(i => i.key!==f.key)
    } else if(kind==='delete-folder'){
      const p = modal.payload.prefix
      await $fetch('/api/media/ops',{ method:'POST', body:{ action:'folder.delete', prefix:p }, credentials:'include' })
      toast('Folder deleted','green')
      if (p === prefix.value) go(prefix.value.split('/').slice(0,-1).join('/'))
      else refresh()
    } else if(kind==='move-file'){
      const f = modal.payload
      const to = normalizePath(modal.input)
      await $fetch('/api/media/ops',{ method:'POST', body:{ action:'file.move', from:f.key, to }, credentials:'include' })
      toast('Moved','green'); await refresh()
    } else if(kind==='move-folder'){
      const from = modal.payload.prefix
      const to = normalizePath(modal.input)
      await $fetch('/api/media/ops',{ method:'POST', body:{ action:'folder.move', from, to }, credentials:'include' })
      toast('Folder moved','green'); if(from===prefix.value) go(to.replace(/\/+$/,'')); else refresh()
    } else if(kind==='new-folder'){
      const name = modal.input
      if(!name) return
      const p = normalizePath([prefix.value, name].filter(Boolean).join('/'))
      await $fetch('/api/media/ops',{ method:'POST', body:{ action:'folder.create', prefix:p }, credentials:'include' })
      toast('Folder created','green'); go(p)
    }
  } finally { modalCancel() }
}
function modalCancel(){ modal.show=false; modal.kind=null; modal.payload=null; modal.input='' }

/* ======= Drag-to-move files into folders ======= */
function onFileDragStart(f:any){
  const dt = (event as DragEvent).dataTransfer!
  dt.setData('text/x-media-key', f.key)
  dt.effectAllowed = 'move'
  droppingOn.value = ''
}
function onFileDragEnd(){ droppingOn.value = '' }
const droppingOn = ref('')
function onFolderDragOver(d:any){
  const dt = (event as DragEvent).dataTransfer!
  if (dt.types.includes('text/x-media-key')) { droppingOn.value = d.prefix; dt.dropEffect = 'move' }
}
function onFolderDragLeave(d:any){ if (droppingOn.value === d.prefix) droppingOn.value = '' }
async function onFolderDrop(d:any){
  const dt = (event as DragEvent).dataTransfer!
  const key = dt.getData('text/x-media-key')
  if(!key) return
  const f = items.value.find(x => x.key === key)
  if(!f) return
  const newPath = normalizePath([d.prefix, f.name].filter(Boolean).join('/'))
  await $fetch('/api/media/ops',{ method:'POST', body:{ action:'file.move', from:key, to:newPath }, credentials:'include' })
  toast(`Moved to ${d.prefix || '(root)'}`,'green')
  await refresh()
  droppingOn.value = ''
}

/* ======= Global drag & drop upload (full-page overlay) ======= */
function readOverlayFiles(e: DragEvent){
  const list: Array<{name:string; ext:string; size?:number}> = []
  const items = Array.from(e.dataTransfer?.items || [])
  for (const it of items){
    if (it.kind === 'file'){
      const f = it.getAsFile()
      if (f) {
        const ext = (f.name.match(/\.([^.]+)$/)?.[1] || '').toLowerCase()
        list.push({ name:f.name, ext, size:f.size })
      }
    }
  }
  overlay.files = list
  overlay.hasFiles = list.length > 0
}
function onDocDragEnter(e: DragEvent){ overlayDepth++; overlay.show = true; readOverlayFiles(e) }
function onDocDragOver(e: DragEvent){ if(e.dataTransfer) e.dataTransfer.dropEffect = 'copy'; readOverlayFiles(e) }
function onDocDragLeave(){ overlayDepth = Math.max(0, overlayDepth - 1); if(overlayDepth===0){ overlay.show=false; overlay.files=[]; overlay.hasFiles=false } }
function onDocDrop(e: DragEvent){ overlayDepth = 0; overlay.show = false; readOverlayFiles(e); const fs = Array.from(e.dataTransfer?.files || []); if (fs.length) enqueue(fs) }
function closeAllOverlays(){ overlayDepth=0; overlay.show=false; overlay.files=[]; overlay.hasFiles=false }

/* ======= Upload queue with persistent cards ======= */

type QItem = {
  uid: string; file: File; key: string; preview: string | null; xhr: XMLHttpRequest | null; progress: number; done: boolean; error: string | null;
}
const queue = ref<QItem[]>([])

function enqueue(files: File[]) {
  for (const f of files) {
    const rawKey = [prefix.value, f.name].filter(Boolean).join('/')
    const key = normalizePath(rawKey)
    const preview = isImage({ name:f.name, mime:f.type }) ? URL.createObjectURL(f) : null

    const placeholder = reactive({
      uid: `up:${Date.now()}-${Math.random()}`,
      type: 'file',
      key,
      name: f.name,
      size: f.size,
      mime: f.type,
      isPublic: false,
      uploading: true,
      progress: 0,
      error: null as string | null,
      preview,
      file: f,
      xhr: null as XMLHttpRequest | null,
    })

    items.value.unshift(placeholder)
    startUpload(placeholder)
  }
}
async function startUpload(item:any) {
  const { uploads } = await $fetch('/api/media/upload-sign', {
    method: 'POST',
    body: { files:[{ key:item.key, mime:item.file.type || 'b2/x-auto' }] },
    credentials: 'include'
  })

  const sig = uploads[0]
  const xhr = new XMLHttpRequest()
  item.xhr = xhr

  xhr.upload.onprogress = (e) => {
    if (e.lengthComputable) {
      item.progress = Math.round((e.loaded / e.total) * 100)
    }
  }
  xhr.onerror = () => { item.error = 'Upload error'; item.uploading = false }
  xhr.onabort = () => { item.error = 'Cancelled'; item.uploading = false }
  xhr.onload = async () => {
    if (xhr.status >= 200 && xhr.status < 300) {
      await $fetch('/api/media/ops', {
        method:'POST',
        body:{ action:'file.finalize', key:item.key, size:item.size, mime:item.mime },
        credentials:'include',
      })
      item.progress = 100
      item.uploading = false
      if (item.preview) URL.revokeObjectURL(item.preview)
    } else {
      item.error = `HTTP ${xhr.status}`
      item.uploading = false
    }
  }

  xhr.open('POST', sig.url, true)
  Object.entries(sig.headers).forEach(([k,v]) => xhr.setRequestHeader(k, v))
  xhr.send(item.file)
}


async function startUploads() {
  const batch = queue.value.filter(i => !i.done && !i.error && !i.xhr)
  if (!batch.length) return

  // Ask server for B2 Native upload targets (per-file headers)
  const { uploads } = await $fetch<{ uploads: Array<{key:string;url:string;headers:Record<string,string>}> }>(
    '/api/media/upload-sign', { method:'POST', body:{ files: batch.map(b => ({ key:b.key, mime:b.file.type || 'b2/x-auto' })) }, credentials:'include' }
  )

  // Kick off each upload concurrently
  for (const item of batch) {
    const sig = uploads.find(u => u.key === item.key)
    if (!sig) { item.status = 'error';item.error = 'Sign failed'; continue }

    const xhr = new XMLHttpRequest()
    item.xhr = xhr

    xhr.upload.onprogress = (e) => { if (e.lengthComputable) item.progress = (e.loaded / e.total) * 100 }
    xhr.onerror = () => { item.status = 'error'; item.error = 'Upload error' }
    xhr.onabort = () => { item.status = 'error'; item.error = 'Cancelled' }
    xhr.onload = async () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        item.progress = 100
        try {
          await $fetch('/api/media/ops', {
            method:'POST',
            body:{ action:'file.finalize', key:item.key, size:item.file.size, mime:item.file.type },
            credentials:'include',
          })
          // Optimistically add/refresh cache entry for this file without flicker
          await refresh()
        //   item.done = true
          item.status = 'done'
          item.progress = 100

        } catch(err:any){
          item.status = 'error'; item.error = 'Finalize error'
        } finally {
          if (item.preview) URL.revokeObjectURL(item.preview)
        }
      } else {
        item.status = 'error'; item.error = `HTTP ${xhr.status}`
      }
    }

    xhr.open('POST', sig.url, true)
    Object.entries(sig.headers || {}).forEach(([k, v]) => xhr.setRequestHeader(k, v))
    xhr.send(item.file)
  }
}

function cancel(u: QItem) {
  if (u.xhr && !u.done) u.xhr.abort()
}

/* ======= File picker ======= */
function onPick(e: Event) {
  const fs = Array.from((e.target as HTMLInputElement).files || [])
  if (fs.length) enqueue(fs)
  ;(e.target as HTMLInputElement).value = ''
}

/* ======= Folder toolbar actions (using modals) ======= */
function beginRenameFolder(currentPrefix:string){ if(!currentPrefix) return; const base = currentPrefix.split('/').pop() || currentPrefix; editing.kind='dir'; editing.id=currentPrefix; editText.value=base; nextTick(() => inlineInputRef.value?.focus()) }

/* ======= Toasts ======= */
const toasts = ref<{id:number; msg:string; color:'gray'|'green'|'red'}[]>([])
function toast(msg:string, color:'gray'|'green'|'red'='gray'){ const id=Date.now()+Math.random(); toasts.value.push({id,msg,color}); setTimeout(()=>toasts.value = toasts.value.filter(t=>t.id!==id), 2200) }

async function actionUploadToBucket(f:any) {
  await $fetch('/api/media/fix', {
    method:'POST',
    body:{ action:'uploadToBucket', key:f.key },
    credentials:'include'
  })
  toast('Uploaded to bucket','green')
  await refresh()
}

async function actionUpdateMeta(f:any) {
  await $fetch('/api/media/fix', {
    method:'POST',
    body:{ action:'updateMeta', key:f.key },
    credentials:'include'
  })
  toast('Meta updated','green')
  await refresh()
}

async function actionUpdateDb(f:any) {
  await $fetch('/api/media/fix', {
    method:'POST',
    body:{ action:'updateDb', key:f.key },
    credentials:'include'
  })
  toast('DB updated','green')
  await refresh()
}

</script>



<style scoped>
:root { --ui-bg:#f6f7f9; --ui-fg:#111 }
.fade-enter-active,.fade-leave-active{ transition: opacity .12s }
.fade-enter-from,.fade-leave-to{ opacity:0 }
</style>
