<script setup lang="ts">
import type {
  ScrapedArtistListItem,
  ScrapedArtistRich,
} from '~~/server/lib/scrapers/ogalleryArtists'
import type { Status } from '@prisma/client'

type Row = ScrapedArtistListItem & {
  status: Status
  loadingDetails: boolean
  details?: ScrapedArtistRich
  importing: boolean
  imported: boolean
  error: string | null
}

const rows = ref<Row[]>([])
const loadingList = ref(false)
const loadError = ref<string | null>(null)

async function loadList () {
  loadingList.value = true
  loadError.value = null
  try {
    const res = await $fetch<{ items: ScrapedArtistListItem[] }>('/_admin/ogallery-artists')
    rows.value = res.items.map(item => ({
      ...item,
      status: 'PUBLISHED',
      loadingDetails: false,
      details: undefined,
      importing: false,
      imported: false,
      error: null,
    }))
  } catch (err: any) {
    loadError.value = err?.message || 'Failed to load artist list'
  } finally {
    loadingList.value = false
  }
}

async function loadDetails (row: Row) {
  row.loadingDetails = true
  row.error = null
  try {
    const details = await $fetch<ScrapedArtistRich>(
      `/_admin/ogallery-artists/${encodeURIComponent(row.slug)}`
    )
    row.details = details

    // if scraper found titles, update row name (purely for your convenience)
    const enLoc = details.locales.find(l => l.locale === 'EN')
    if (enLoc?.title) {
      row.nameEn = enLoc.title
    }
  } catch (err: any) {
    row.error = err?.message || 'Failed to load details'
  } finally {
    row.loadingDetails = false
  }
}

async function importRow (row: Row) {
  if (!row.details) {
    row.error = 'Load details first'
    return
  }
  row.importing = true
  row.error = null
  try {
    await $fetch('/_admin/ogallery-artists', {
      method: 'POST',
      body: {
        artist: row.details,
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

onMounted(() => {
  loadList()
})


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

</script>

<template>
  <section class="p-6 space-y-4">
   <header class="flex items-center gap-4">
  <h1 class="text-2xl font-semibold">Import OGallery artists</h1>
  
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
    Load all details
  </button>

  <button
    type="button"
    class="px-3 py-2 text-sm border rounded bg-green-600 text-white"
    :disabled="rows.length === 0 || loadingList"
    @click="importAllLoaded"
  >
    Import all loaded
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
          <th class="text-left py-2 pr-2">Details</th>
          <th class="text-left py-2 pr-2">Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="row in rows"
          :key="row.slug"
          class="border-b align-top"
          :class="row.imported ? 'bg-green-50' : ''"
        >
          <td class="py-2 pr-2 align-top">
            <input
              v-model="row.slug"
              class="border px-2 py-1 text-xs w-40"
            >
          </td>

          <td class="py-2 pr-2 align-top">
            <input
              v-model="row.nameEn"
              class="border px-2 py-1 text-xs w-full"
            >
            <div class="text-[10px] text-black/60 mt-1">
              <a :href="row.urlEn" target="_blank" class="underline">EN page</a>
              <span class="mx-1">·</span>
              <a :href="row.urlFa" target="_blank" class="underline">FA page</a>
            </div>
          </td>

          <td class="py-2 pr-2 align-top">
            <select
              v-model="row.status"
              class="border px-2 py-1 text-xs"
            >
              <option value="PUBLISHED">PUBLISHED</option>
              <option value="DRAFT">DRAFT</option>
              <option value="ARCHIVED">ARCHIVED</option>
            </select>
          </td>

          <td class="py-2 pr-2 align-top text-xs">
            <div v-if="row.loadingDetails" class="text-black/50">
              Loading details…
            </div>
            <div v-else-if="row.details">
              <div>
                <strong>Locales:</strong>
                {{ row.details.locales.map(l => l.locale).join(', ') }}
              </div>
              <div>
                <strong>Works:</strong> {{ row.details.works.length }}
              </div>
              <div>
                <strong>Installations:</strong> {{ row.details.installations.length }}
              </div>
              <div v-if="row.details.locales.find(l => l.locale === 'EN')?.cvUrl">
                <strong>CV:</strong>
                <a
                  :href="row.details.locales.find(l => l.locale === 'EN')?.cvUrl || '#'"
                  target="_blank"
                  class="underline"
                >Open</a>
              </div>
            </div>
            <div v-else class="text-black/50">
              No details loaded.
            </div>
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
              :disabled="row.importing || !row.details"
              @click="importRow(row)"
            >
              <span v-if="row.importing">Importing…</span>
              <span v-else-if="row.imported">Imported</span>
              <span v-else>Import</span>
            </button>
            <p v-if="row.error" class="text-xs text-red-600 mt-1">
              {{ row.error }}
            </p>
          </td>
        </tr>
      </tbody>
    </table>

    <p v-else-if="!loadingList" class="text-sm text-black/70">
      No artists found.
    </p>
  </section>
</template>
