<script setup lang="ts">
import { list, upsert, remove } from '@/utils/storage'

const props = defineProps<{
  title: string
  collection: string // e.g. 'artists', 'exhibitions', 'viewingRooms', ...
  fields: { key: string; label: string; textarea?: boolean }[]
}>()

const items = ref<any[]>([])
const drafts = ref<Record<string, any>>({})
const query = ref('')
const loading = ref(false)
const err = ref<string | null>(null)

async function load() {
  loading.value = true
  err.value = null
  try {
    const rows = await list(props.collection)
    items.value = Array.isArray(rows) ? rows : []
  } catch (e: any) {
    err.value = e?.message || 'Failed to load'
    items.value = []
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  load()
  // reflect external changes (optional)
  window.addEventListener('storage', (e) => {
    if (!e.key || e.key.includes(props.collection)) load()
  })
})

// build drafts when items change (guard non-array)
watch(
  items,
  (arr) => {
    if (!Array.isArray(arr)) return
    for (const it of arr) {
      if (it?.slug && !drafts.value[it.slug]) drafts.value[it.slug] = { ...it }
    }
  },
  { immediate: true, deep: false }
)

const filtered = computed(() => {
  const q = query.value.toLowerCase().trim()
  const src = Array.isArray(items.value) ? items.value : []
  if (!q) return src
  return src.filter((it) =>
    String(it?.slug || '').toLowerCase().includes(q) ||
    String(it?.title || it?.name || '').toLowerCase().includes(q)
  )
})

function addNew() {
  const slug = prompt('New item slug (unique, URL-safe):')?.trim()
  if (!slug) return
  const obj: any = { slug }
  for (const f of props.fields) if (!(f.key in obj)) obj[f.key] = ''
  items.value = [...items.value, obj]
  drafts.value[slug] = { ...obj }
}

async function save(slug: string) {
  const e = drafts.value[slug]
  if (!e?.slug) return alert('Missing slug')
  await upsert(props.collection, e)
  await load()
}

async function del(slug: string) {
  if (!confirm('Delete item?')) return
  await remove(props.collection, slug)
  await load()
  delete drafts.value[slug]
}
</script>

<template>
  <div class="border rounded-2xl p-4 shadow">
    <header class="flex items-center justify-between mb-3">
      <h2 class="font-semibold">{{ title }}</h2>
      <div class="flex gap-2">
        <input v-model="query" placeholder="Search by slug/title" class="border rounded px-2 py-1" />
        <button @click="addNew" class="border rounded px-2 py-1">+ New</button>
      </div>
    </header>

    <p v-if="loading" class="text-sm opacity-70">Loading…</p>
    <p v-else-if="err" class="text-sm text-red-600">{{ err }}</p>

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

    <p v-if="!loading && !err && !filtered.length" class="text-sm opacity-70">No items yet.</p>
  </div>
</template>
