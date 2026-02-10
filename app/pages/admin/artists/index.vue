<script setup lang="ts">
import { refDebounced } from '@vueuse/core' // Optional: for smoother search, or just use standard timeout

definePageMeta({
  middleware: 'admin-auth',
  layout: 'admin'
})

const { locale } = useI18n()
const router = useRouter()

// --- State ---
const search = ref('')
const debouncedSearch = refDebounced(search, 500) // Wait 500ms before fetching
const page = ref(1)
const perPage = ref(15)
const sortField = ref('updatedAt')
const sortOrder = ref<'asc' | 'desc'>('desc')

// --- Data Fetching ---
// We pass the parameters to the backend to handle the heavy lifting
const { data, refresh, pending } = await useFetch('/api/admin/entries', {
  query: computed(() => ({
    // We want both kinds
    kinds: JSON.stringify(['ARTIST', 'EXHIBITED-ARTIST']), 
    page: page.value,
    take: perPage.value,
    sortBy: sortField.value,
    sortDir: sortOrder.value,
    search: debouncedSearch.value
  })),
  watch: [page, perPage, sortField, sortOrder, debouncedSearch]
})

// --- Computed Helpers ---
const artists = computed(() => data.value?.data || [])
const meta = computed(() => data.value?.meta || { total: 0, lastPage: 1 })

// --- Actions ---
function toggleSort(field: string) {
  if (sortField.value === field) {
    // If clicking same header, toggle order
    sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
  } else {
    // If clicking new header, set field and default to desc
    sortField.value = field
    sortOrder.value = 'desc'
  }
}

async function deleteArtist(id: number) {
  if (!confirm('Are you sure? This cannot be undone.')) return
  await $fetch(`/api/admin/entries/${id}`, { method: 'DELETE' })
  refresh() // Reload current page
}

// --- Icons Helper ---
const getSortIcon = (field: string) => {
  if (sortField.value !== field) return 'ph:caret-up-down'
  return sortOrder.value === 'asc' ? 'ph:caret-up-fill' : 'ph:caret-down-fill'
}
</script>

<template>
  <div>
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">
          {{ locale === 'FA' ? 'مدیریت هنرمندان' : 'Artists & Exhibited' }}
        </h1>
        <p class="text-gray-500 text-sm mt-1">
          {{ meta.total }} {{ locale === 'FA' ? 'مورد یافت شد' : 'Total Entries' }}
        </p>
      </div>
      <NuxtLink to="/admin/artists/new" class="bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-black transition-colors flex items-center gap-2">
        <Icon name="ph:plus-bold" />
        {{ locale === 'FA' ? 'افزودن' : 'Add New' }}
      </NuxtLink>
    </div>

    <div class="bg-white p-4 rounded-xl border border-gray-200 shadow-sm mb-6 flex justify-between items-center">
      <div class="relative max-w-md w-full">
        <Icon name="ph:magnifying-glass" class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg" :class="{ 'right-3 left-auto': locale === 'FA' }" />
        <input 
          v-model="search" 
          @input="page = 1" 
          type="text" 
          :placeholder="locale === 'FA' ? 'جستجو در نام یا اسلاگ...' : 'Search name or slug...'"
          class="w-full ps-10 pe-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-gray-400 transition-colors"
        />
      </div>
    </div>

    <div class="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden relative min-h-[400px]">
      
      <div v-if="pending" class="absolute inset-0 bg-white/80 z-10 flex items-center justify-center">
        <Icon name="ph:spinner" class="animate-spin text-3xl text-gray-400" />
      </div>

      <table class="w-full text-left text-sm" :class="{ 'text-right': locale === 'FA' }">
        <thead class="bg-gray-50 text-gray-500 font-medium border-b border-gray-200 select-none">
          <tr>
            <th @click="toggleSort('id')" class="px-6 py-3 w-20 cursor-pointer hover:bg-gray-100 transition-colors group">
              <div class="flex items-center gap-1">
                #
                <Icon :name="getSortIcon('id')" class="text-xs text-gray-300 group-hover:text-gray-500" :class="{'text-black': sortField === 'id'}" />
              </div>
            </th>

            <th class="px-6 py-3">{{ locale === 'FA' ? 'نام' : 'Name' }}</th>

            <th @click="toggleSort('slug')" class="px-6 py-3 cursor-pointer hover:bg-gray-100 transition-colors group">
              <div class="flex items-center gap-1">
                {{ locale === 'FA' ? 'اسلاگ' : 'Slug' }}
                <Icon :name="getSortIcon('slug')" class="text-xs text-gray-300 group-hover:text-gray-500" :class="{'text-black': sortField === 'slug'}" />
              </div>
            </th>

            <th @click="toggleSort('kind')" class="px-6 py-3 cursor-pointer hover:bg-gray-100 transition-colors group">
              <div class="flex items-center gap-1">
                {{ locale === 'FA' ? 'نوع' : 'Type' }}
                <Icon :name="getSortIcon('kind')" class="text-xs text-gray-300 group-hover:text-gray-500" :class="{'text-black': sortField === 'kind'}" />
              </div>
            </th>

            <th @click="toggleSort('status')" class="px-6 py-3 cursor-pointer hover:bg-gray-100 transition-colors group">
              <div class="flex items-center gap-1">
                {{ locale === 'FA' ? 'وضعیت' : 'Status' }}
                <Icon :name="getSortIcon('status')" class="text-xs text-gray-300 group-hover:text-gray-500" :class="{'text-black': sortField === 'status'}" />
              </div>
            </th>

            <th @click="toggleSort('updatedAt')" class="px-6 py-3 cursor-pointer hover:bg-gray-100 transition-colors group">
              <div class="flex items-center gap-1">
                {{ locale === 'FA' ? 'تاریخ' : 'Date' }}
                <Icon :name="getSortIcon('updatedAt')" class="text-xs text-gray-300 group-hover:text-gray-500" :class="{'text-black': sortField === 'updatedAt'}" />
              </div>
            </th>

            <th class="px-6 py-3 text-end">{{ locale === 'FA' ? 'عملیات' : 'Actions' }}</th>
          </tr>
        </thead>
        
        <tbody class="divide-y divide-gray-100">
          <tr v-for="artist in artists" :key="artist.id" class="group hover:bg-gray-50 transition-colors">
            <td class="px-6 py-4 text-gray-400">{{ artist.id }}</td>
            <td class="px-6 py-4">
              <div class="font-medium text-gray-900">
                {{ artist.locales.find((l:any) => l.locale === 'EN')?.title || 'No Title' }}
              </div>
              <div class="text-xs text-gray-500 font-persian mt-0.5">
                {{ artist.locales.find((l:any) => l.locale === 'FA')?.title }}
              </div>
            </td>
            <td class="px-6 py-4 text-gray-500 font-mono text-xs">{{ artist.slug }}</td>
            
            <td class="px-6 py-4">
              <span class="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border"
                :class="artist.kind === 'ARTIST' ? 'bg-purple-50 text-purple-700 border-purple-100' : 'bg-blue-50 text-blue-700 border-blue-100'">
                {{ artist.kind }}
              </span>
            </td>

            <td class="px-6 py-4">
              <span 
                class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize"
                :class="artist.status === 'PUBLISHED' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'"
              >
                {{ artist.status.toLowerCase() }}
              </span>
            </td>

            <td class="px-6 py-4 text-xs text-gray-400">
               {{ new Date(artist.updatedAt).toLocaleDateString() }}
            </td>

            <td class="px-6 py-4 text-end space-x-2 rtl:space-x-reverse">
              <NuxtLink :to="`/admin/artists/${artist.id}`" class="inline-block p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-all">
                <Icon name="ph:pencil-simple" class="text-lg" />
              </NuxtLink>
              <button @click="deleteArtist(artist.id)" class="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-all">
                <Icon name="ph:trash" class="text-lg" />
              </button>
            </td>
          </tr>
        </tbody>
      </table>
      
      <div v-if="artists.length === 0 && !pending" class="p-12 text-center text-gray-500">
        <Icon name="ph:folder-open-duotone" class="text-4xl mb-2 opacity-30" />
        <p>{{ locale === 'FA' ? 'موردی یافت نشد.' : 'No artists found.' }}</p>
      </div>
    </div>

    <div class="flex items-center justify-between mt-6" v-if="meta.total > 0">
      <div class="text-sm text-gray-500">
        Page {{ page }} of {{ meta.lastPage }}
      </div>
      
      <div class="flex gap-2">
        <button 
          @click="page--" 
          :disabled="page <= 1"
          class="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {{ locale === 'FA' ? 'قبلی' : 'Previous' }}
        </button>
        <button 
          @click="page++" 
          :disabled="page >= meta.lastPage"
          class="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {{ locale === 'FA' ? 'بعدی' : 'Next' }}
        </button>
      </div>
    </div>

  </div>
</template>