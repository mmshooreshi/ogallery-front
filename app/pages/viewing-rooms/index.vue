<script setup lang="ts">
import { computed, ref } from 'vue'
import { useEntryList } from '~/composables/useEntry'

// 1. Data Fetching
const route = useRoute()
const yearQuery = computed(() => Number(route.query.year) || undefined)
const { data: items, pending } = useEntryList('viewing-rooms')

useSeoMeta({ title: 'Viewing Rooms' })

// 2. Years Logic (Extract unique years from items)
const years = computed(() => {
  if (!items.value) return [2022, 2021, 2020] // Fallback
  const yrs = new Set(items.value.map(i => i.year).filter(Boolean))
  return Array.from(yrs).sort((a, b) => (b as number) - (a as number))
})

// 3. Filter Items (If year is selected)
const filteredItems = computed(() => {
  if (!items.value) return []
  if (!yearQuery.value) return items.value
  return items.value.filter(i => i.year === yearQuery.value)
})

// 4. Smart Image Loading Handler
const handleImageLoad = (event: Event) => {
  const img = event.target as HTMLImageElement
  img.classList.remove('opacity-0')
  img.classList.add('opacity-100')
}
</script>

<template>
  <main class="relative min-h-screen bg-white pb-20">
    
    <div class="fixed top-[60px] left-0 right-0 z-20 bg-white/95 backdrop-blur-sm border-b border-black/5 py-5">
      <div class="flex justify-center items-center gap-3 text-base uppercase  text-[#595a5c]">
        <a href="#past" class="hover:text-[#ffde00] text-[#595a5c] transition-colors font-bold no-underline">Past</a>
      </div>
    </div>

    <div class="h-[120px]"></div>

    <h2 class="text-center text-2xl font-light uppercase tracking-wide text-[#595a5c] mb-20 mt-4">
      Past
    </h2>

    <div id="years" class="flex justify-center flex-row-reverse gap-1 mb-12 text-md font-light text-[#595a5c]">
      <template v-for="(y, index) in years" :key="y">
        <NuxtLink 
          :to="{ query: { year: y } }"
          class="no-underline hover:text-[#ffde00] transition-colors text-[#595a5c]"
          :class="{ 'font-medium border-b border-black': yearQuery === y }"
        >
          {{ y }}
        </NuxtLink>
        <span v-if="index < years.length - 1" class="text-[#595a5c] mx-2">|</span>
      </template>
    </div>

    <div class="container-fluid px-3 md:px-4">
      
      <div v-if="pending && !items?.length" class="py-20 text-center opacity-50 uppercase tracking-widest text-xs">
        Loading...
      </div>

      <div v-else class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-x-6 gap-y-0">
        
        <div v-for="room in filteredItems" :key="room.id" class="w-full overflow-hidden mx-auto flex flex-col gap-3 group">
          
          <NuxtLink :to="`/viewing-rooms/${room.slug}`" class="block w-full no-underline">
            <div class="relative w-full mx-auto aspect-square  overflow-hidden flex items-center justify-center">
              <img
                v-if="room.thumb"
                :src="room.thumb"
                alt=""
                width="500"
                height="500"
                loading="lazy"
                decoding="async"
                @load="handleImageLoad"
                class="w-full h-full object-cover transition-all  hover:scale-95 hover:opacity-80 max-h-[240px] max-w-[240px] mx-auto"
              />
            </div>
          </NuxtLink>

          <div class="flex flex-col items-center gap-1">
            <NuxtLink 
              v-if="room.artistSlug" 
              :to="`/artists/${room.artistSlug}`"
              class="text-xl font-light text-[#595a5c]  no-underline hover:text-[#ffde00] transition-colors"
            >
              {{ room.artistName }}
            </NuxtLink>
            <span v-else class="text-xl font-light text-[#595a5c] ">
              {{ room.artistName }}
            </span>

            <NuxtLink 
              :to="`/viewing-rooms/${room.slug}`"
              class="text-base font-light text-black/60  tracking-wide no-underline hover:text-[#ffde00] transition-colors mt-2"
            >
              {{ room.title }}
            </NuxtLink>

            <h6 class="text-base text-[#595a5c] mt-1 font-light">
              {{ room.dateString }}
            </h6>
          </div>

        </div>
      </div>
    </div>
  </main>
</template>

<style scoped>
/* Mimic Bootstrap container-fluid behavior if needed, or stick to Tailwind defaults */
.container-fluid {
  /* width: 100%; */
  margin-right: auto;
  margin-left: auto;
}
</style>

<!-- app/pages/viewing-rooms/index.vue
<script setup lang="ts">
import { useEntryList } from '~/composables/useEntry'
import { formatEntryDate } from '~/utils/date'

const { locale } = useI18n()
const { data: rooms, pending } = useEntryList('viewing-rooms')
useSeoMeta({ title: 'Viewing Rooms' })
</script>

<template>
  <main class="og-container pt-32 pb-20 min-h-screen">
    <div v-if="pending && !rooms?.length" class="text-center py-20 opacity-50">Loading...</div>

    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-16 px-4">
      <NuxtLink 
        v-for="room in rooms" 
        :key="room.id"
        :to="`/viewing-rooms/${room.slug}`"
        class="group flex flex-col no-underline"
      >
        <div class="aspect-video bg-gray-50 overflow-hidden relative shadow-sm">
          <img 
            v-if="room.thumb" :src="room.thumb" 
            class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        </div>
        
        <div class="mt-4 text-center">
          <h3 class="text-lg font-light text-gray-800 group-hover:text-[#ffde00] transition-colors">
            {{ room.title }}
          </h3>
          <div v-if="room.artistName && room.artistName !== room.title" class="text-sm text-gray-500 mt-1 uppercase tracking-wider">
            {{ room.artistName }}
          </div>
          <div class="text-xs text-gray-400 mt-2 uppercase tracking-widest">
            {{ formatEntryDate(room.startDate, room.endDate, room.dateString, locale) }}
          </div>
        </div>
      </NuxtLink>
    </div>
  </main>
</template> -->