<!-- app/pages/admin/indexPrev.vue -->
<script setup lang="ts">
definePageMeta({ middleware: 'admin-auth' })

import { exportJSON, importJSON } from '@/utils/storage'

const { logout } = useAdminAuth()

const fileInput = ref<HTMLInputElement | null>(null)

async function downloadExport() {
  const json = await exportJSON() // returns a JSON string from /api/admin/export
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'content-export.json'
  a.click()
  URL.revokeObjectURL(url)
}

async function onImport(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  await importJSON(file) // POST to /api/admin/import
  alert('Imported successfully. Reloading…')
  location.reload()
}

/* ---------- Field definitions per collection ---------- */
const artistFields = [
  { key: 'slug', label: 'Slug' },
  { key: 'name', label: 'Name' },
  { key: 'bio', label: 'Biography', textarea: true },
  { key: 'image', label: 'Image URL' },
  { key: 'website', label: 'Website' }
]

const exhibitionFields = [
  { key: 'slug', label: 'Slug' },
  { key: 'title', label: 'Title' },
  { key: 'artists', label: 'Artists (comma-separated)' },
  { key: 'startDate', label: 'Start Date (YYYY-MM-DD)' },
  { key: 'endDate', label: 'End Date (YYYY-MM-DD)' },
  { key: 'status', label: 'Status (current|upcoming|past)' },
  { key: 'year', label: 'Year' },
  { key: 'pressRelease', label: 'Press Release', textarea: true },
  { key: 'images', label: 'Images (comma-separated)' }
]

const windowFields = [
  { key: 'slug', label: 'Slug' },
  { key: 'title', label: 'Title' },
  { key: 'startDate', label: 'Start Date (YYYY-MM-DD)' },
  { key: 'endDate', label: 'End Date (YYYY-MM-DD)' },
  { key: 'press', label: 'Press Note', textarea: true },
  { key: 'images', label: 'Images (comma-separated)' }
]

const vrFields = [
  { key: 'slug', label: 'Slug' },
  { key: 'title', label: 'Title' },
  { key: 'artist', label: 'Artist' },
  { key: 'startDate', label: 'Start Date (YYYY-MM-DD)' },
  { key: 'endDate', label: 'End Date (YYYY-MM-DD)' },
  { key: 'text', label: 'Curatorial Text', textarea: true },
  { key: 'images', label: 'Images (comma-separated)' }
]

const pubFields = [
  { key: 'slug', label: 'Slug' },
  { key: 'title', label: 'Title' },
  { key: 'date', label: 'Date (YYYY-MM-DD)' },
  { key: 'summary', label: 'Summary', textarea: true },
  { key: 'coverImage', label: 'Cover Image' },
  { key: 'body', label: 'Body (Markdown)', textarea: true }
]

const newsFields = [
  { key: 'slug', label: 'Slug' },
  { key: 'title', label: 'Title' },
  { key: 'date', label: 'Date (YYYY-MM-DD)' },
  { key: 'teaser', label: 'Teaser', textarea: true },
  { key: 'coverImage', label: 'Cover Image' },
  { key: 'tags', label: 'Tags (comma-separated)' },
  { key: 'body', label: 'Body (Markdown)', textarea: true }
]

const studioFields = [
  { key: 'slug', label: 'Slug' },
  { key: 'artist', label: 'Artist' },
  { key: 'title', label: 'Work Title' },
  { key: 'price', label: 'Price' },
  { key: 'availability', label: 'Availability (available|sold)' },
  { key: 'image', label: 'Image URL' },
  { key: 'dims', label: 'Dimensions' },
  { key: 'year', label: 'Year' }
]
</script>

<template>
  <div class="min-h-screen p-6">
    <header class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-semibold">Admin Dashboard</h1>
      <div class="flex gap-2">
        <input
          ref="fileInput"
          type="file"
          class="hidden"
          accept="application/json"
          @change="onImport"
        />
        <button class="border rounded px-3 py-2" @click="downloadExport">Export JSON</button>
        <button class="border rounded px-3 py-2" @click="() => fileInput?.click()">Import JSON</button>
        <button class="border rounded px-3 py-2" @click="logout">Logout</button>
      </div>
    </header>

    <!-- Render editors only on client (avoids SSR/CSR mismatches) -->
    <ClientOnly>
      <section class="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AdminEditor title="Artists" collection="artists" :fields="artistFields" />
        <AdminEditor title="Exhibitions" collection="exhibitions" :fields="exhibitionFields" />
        <AdminEditor title="The Window" collection="window" :fields="windowFields" />
        <!-- IMPORTANT: use collection id 'viewingRooms' (camelCase), not 'viewing-rooms' -->
        <AdminEditor title="Viewing Rooms" collection="viewingRooms" :fields="vrFields" />
        <AdminEditor title="Publications" collection="publications" :fields="pubFields" />
        <AdminEditor title="News" collection="news" :fields="newsFields" />
        <AdminEditor title="Studio" collection="studio" :fields="studioFields" />
      </section>
    </ClientOnly>
  </div>
</template>
