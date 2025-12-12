<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { Status, type Locale } from '@prisma/client'
// Import ScrapedListItem type
import type { ScrapedRich, ScrapeLog, ScrapeKind, ScrapedListItem } from '~~/server/lib/ogallery/engine' 
const fixingDates = ref(false)

async function fixDates() {
  fixingDates.value = true
  try {
    const res = await $fetch<{ fixed: number }>('/_admin/fix-dates', {
      method: 'POST',
    })
    alert(`Fixed dates for ${res.fixed} exhibitions`)
  } finally {
    fixingDates.value = false
  }
}

const listPath = ref('')

// Define props to make the component configurable
const props = defineProps<{
  kind: ScrapeKind // 'ARTIST' or 'EXHIBITION' (Prisma Kind)
  apiPath: 'artists' | 'exhibitions' // URL segment for API and Admin UI
  title: string
}>()
// --- Types ---

// FIX: Use the imported ScrapedListItem type (or define it manually here)
// Using imported type for consistency, assuming engine.ts exports it:
type ListItem = ScrapedListItem // { slug, nameEn, sourceUrlEn, sourceUrlFa }

type Row = ListItem & {
  status: Status
  loadingDetails: boolean
  details?: ScrapedRich
  logs?: ScrapeLog[] // Added for diagnostics
  importing: boolean
  imported: boolean
  error: string | null
}

// --- State ---

const rows = ref<Row[]>([])
const loadingList = ref(false)
const loadError = ref<string | null>(null)

const modalOpen = ref(false)
const modalLogs = ref<ScrapeLog[]>([])
const modalSlug = ref('')

const baseUrl = computed(() => `/_admin/scrape/${props.apiPath}`)
const importUrl = computed(() => `/_admin/import/${props.apiPath}`)

// --- Actions ---

function openInfoModal(row: Row) {
  modalLogs.value = row.logs || []
  modalSlug.value = row.slug
  modalOpen.value = true
}



async function loadList () {
  loadingList.value = true
  loadError.value = null
  rows.value = []

  try {
    const res = await $fetch<{ items: ListItem[] }>(
      `${baseUrl.value}/list`,
      {
        method: 'POST',
        body: {
          override: {
            paths: {
              list: listPath.value,
            },
          },
        },
      }
    )

    rows.value = res.items.map(item => ({
      ...item,
      status: 'PUBLISHED' as Status,
      loadingDetails: false,
      importing: false,
      imported: false,
      error: null,
    }))
  } catch (err: any) {
    loadError.value =
      err?.data?.statusMessage ||
      err?.message ||
      'Failed to load list'
  } finally {
    loadingList.value = false
  }
}


async function loadDetails (row: Row) {
  row.loadingDetails = true
  row.error = null
  row.logs = undefined // Clear old logs
  try {
    const res = await $fetch<{ data: ScrapedRich, logs: ScrapeLog[] }>(
      `${baseUrl.value}/${encodeURIComponent(row.slug)}`,{method: 'POST'}
    )
    row.details = res.data
    row.logs = res.logs // Capture logs for info modal

    // Update name
    const enLoc = res.data.locales.find(l => l.locale === 'EN')
    if (enLoc?.title) {
      row.nameEn = enLoc.title
    }
  } catch (err: any) {
    row.error = err?.data?.statusMessage || err?.message || 'Failed to load details'
    row.logs = err?.data?.logs || [] // Capture logs even on error if available
  } finally {
    row.loadingDetails = false
  }
}

async function loadConfig() {
  const res = await $fetch<{ paths: { list: string } }>(
    `${baseUrl.value}/config`
  )
  listPath.value = res.paths.list
}


async function importRow (row: Row) {
  if (!row.details) {
    row.error = 'Load details first'
    return
  }
  row.importing = true
  row.error = null
  try {
    await $fetch(importUrl.value, {
      method: 'POST',
      body: {
        data: row.details,
        status: row.status,
      },
    })
    row.imported = true
  } catch (err: any) {
    row.error = err?.data?.statusMessage || err?.message || 'Import failed'
  } finally {
    row.importing = false
  }
}

// Load all details one by one
async function loadAllDetails() {
  for (const row of rows.value) {
    if (!row.details && !row.loadingDetails) {
      await loadDetails(row)
    }
  }
}

// Import all loaded rows one by one
async function importAllLoaded() {
  for (const row of rows.value) {
    if (row.details && !row.imported && !row.importing) {
      await importRow(row)
    }
  }
}

onMounted(() => {
  loadConfig()
  loadList()

})
</script>

<template>
  <section class="p-6 space-y-4">
    <header class="flex items-center gap-4">
      <h1 class="text-2xl font-semibold">Import OGallery {{ props.title }}</h1>
      
        <div>
    <label class="block text-xs font-medium mb-1">
      List Path
    </label>
    <input
      v-model="listPath"
      class="border px-2 py-1 text-xs w-72"
      placeholder="/en/exhibitions/2022"
    >
  </div>
  
      <button
        type="button"
        class="px-3 py-2 text-sm border rounded bg-black text-white"
        :disabled="loadingList"
        @click="loadList"
      >
        {{ loadingList ? 'Refreshing…' : 'Reload list' }}
      </button>

      <button
        type="button"
        class="px-3 py-2 text-sm border rounded bg-blue-600 text-white"
        :disabled="rows.length === 0 || loadingList"
        @click="loadAllDetails"
      >
        Load all details ({{ rows.filter(r => r.details).length }}/{{ rows.length }})
      </button>

      <button
        type="button"
        class="px-3 py-2 text-sm border rounded bg-green-600 text-white"
        :disabled="rows.length === 0 || loadingList || rows.filter(r => r.details && !r.imported).length === 0"
        @click="importAllLoaded"
      >
        Import all loaded
      </button>

      <button
  type="button"
  class="px-3 py-2 text-sm border rounded bg-amber-500 text-white"
  :disabled="fixingDates"
  @click="fixDates"
>
  {{ fixingDates ? 'Fixing…' : 'Fix dates' }}
</button>

      <p v-if="loadError" class="text-sm text-red-600">{{ loadError }}</p>
    </header>

    <p class="text-sm text-black/70">
      1) Load list (fast) • 2) For each row: "Load details" • 3) Check data • 4) "Import".
    </p>

    <table v-if="rows.length" class="w-full text-sm border-collapse">
      <thead>
        <tr class="border-b">
          <th class="text-left py-2 pr-2">Slug</th>
          <th class="text-left py-2 pr-2">Name (EN)</th>
          <th class="text-left py-2 pr-2">Status</th>
          <th class="text-left py-2 pr-2">Data</th>
          <th class="text-left py-2 pr-2">Actions</th>
        </tr>
      </thead>
      <tbody>
       <tr
          v-for="row in rows"
          :key="row.slug"
          class="border-b align-top"
          :class="row.imported ? 'bg-green-50' : row.error ? 'bg-red-50' : ''"
        >
          <td class="py-2 pr-2 align-top">
            <input v-model="row.slug" class="border px-2 py-1 text-xs w-40" readonly>
          </td>

          <td class="py-2 pr-2 align-top">
            <input v-model="row.nameEn" class="border px-2 py-1 text-xs w-full" readonly>
            <div class="text-[10px] text-black/60 mt-1">
              <a :href="row.sourceUrlEn" target="_blank" class="underline">EN page</a> 
              <span class="mx-1">·</span>
              <a :href="row.sourceUrlFa" target="_blank" class="underline">FA page</a>
            </div>
          </td>

          <td class="py-2 pr-2 align-top">
            <select v-model="row.status" class="border px-2 py-1 text-xs">
              <option value="PUBLISHED">PUBLISHED</option>
              <option value="DRAFT">DRAFT</option>
              <option value="ARCHIVED">ARCHIVED</option>
            </select>
          </td>

          <td class="py-2 pr-2 align-top text-xs space-y-1">
            <div v-if="row.loadingDetails" class="text-black/50">Loading details…</div>
            <div v-else-if="row.details">
              <div>
                <strong>Works:</strong> {{ row.details.works.length }}
                <span v-if="row.details.installations.length"> | <strong>Installs:</strong> {{ row.details.installations.length }}</span>
              </div>
              <div>
                <strong :class="row.details.locales.some(l => l.bodyHtml) ? 'text-green-700' : 'text-red-700'">
                  Bio/Press:
                </strong> 
                {{ row.details.locales.some(l => l.bodyHtml) ? 'Found' : 'Missing' }}
              </div>
              <div v-if="row.details.locales.find(l => l.locale === 'EN')?.cvUrl">
                <strong>CV:</strong> <a :href="row.details.locales.find(l => l.locale === 'EN')?.cvUrl || '#'" target="_blank" class="underline">Open</a>
              </div>
              <button
                type="button"
                class="mt-1 px-2 py-0.5 border rounded text-[10px] bg-gray-100"
                @click="openInfoModal(row)"
              >
                Show Scrape Logs
              </button>
            </div>
            <div v-else class="text-black/50">No details loaded.</div>
          </td>

          <td class="py-2 pr-2 align-top text-xs space-y-1">
            <button
              type="button"
              class="px-3 py-1 border rounded text-xs"
              :disabled="row.loadingDetails"
              @click="loadDetails(row)"
            >
              {{ row.loadingDetails ? 'Loading…' : 'Load details' }}
            </button>
            <br>
            <button
              type="button"
              class="px-3 py-1 border rounded text-xs"
              :class="{ 'bg-green-500 text-white': row.details && !row.imported && !row.importing }"
              :disabled="row.importing || !row.details"
              @click="importRow(row)"
            >
              <span v-if="row.importing">Importing…</span>
              <span v-else-if="row.imported">Imported</span>
              <span v-else>Import</span>
            </button>
            <p v-if="row.error" class="text-xs text-red-600 mt-1 max-w-[150px] break-words">
              {{ row.error }}
            </p>
          </td>
        </tr>
      </tbody>
    </table>

    <p v-else-if="!loadingList" class="text-sm text-black/70">
      No {{ props.title.toLowerCase() }} found.
    </p>
  </section>

  <div
    v-if="modalOpen"
    class="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
    @click.self="modalOpen = false"
  >
    <div class="bg-white p-6 rounded-lg shadow-xl w-11/12 max-w-2xl max-h-[80vh] overflow-y-auto">
      <h3 class="text-lg font-bold mb-4">Scraping Diagnostics: {{ modalSlug }} ({{ props.kind }})</h3>
      <div v-if="modalLogs.length">
        <div 
          v-for="(log, index) in modalLogs" 
          :key="index" 
          :class="[
            'p-1 text-xs border-l-4 my-1',
            log.level === 'info' ? 'border-blue-500 bg-blue-50' :
            log.level === 'warn' ? 'border-yellow-500 bg-yellow-50' :
            'border-red-500 bg-red-50'
          ]"
        >
          <span class="font-mono uppercase mr-2">{{ log.level }}</span>
          {{ log.message }}
        </div>
      </div>
      <div v-else class="text-gray-500">
        No logs captured for this scrape run.
      </div>
      <button 
        class="mt-4 px-4 py-2 bg-gray-200 rounded text-sm" 
        @click="modalOpen = false"
      >
        Close
      </button>
    </div>
  </div>
</template>