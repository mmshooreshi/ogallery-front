<script setup lang="ts">
import { useEntryList } from '~/composables/useEntry'
import { getJalaliParts, getGregorianParts } from '~/utils/date'

const { locale } = useI18n()
const { data: publications, pending } = useEntryList('publications')

useSeoMeta({ title: 'Publications' })

// Helper to format date using your existing utils
function formatDisplayDate(start: string | null, end: string | null, raw: string | null) {
  // 1. English Locale: Use raw string (usually best) or fallback to Gregorian parts
  if (locale.value !== 'FA') {
    if (raw) return raw
    if (!start) return ''
    const p = getGregorianParts(start, 'en-US')
    return `${p.month} ${p.day}, ${p.year}`
  }

  // 2. Persian Locale: Use getJalaliParts
  if (!start) return raw || ''
  
  const s = getJalaliParts(start)
  
  // Safety check if date parsing failed
  if (!s.day || !s.month || !s.year) return raw

  // Single Date (Publication usually)
  if (!end || start === end) {
    return `${s.day} ${s.month} ${s.year}`
  }

  // Range Logic (for Exhibitions/Events)
  const e = getJalaliParts(end)
  
  // Different Years: 10 Esfand 1402 - 5 Farvardin 1403
  if (s.year !== e.year) {
    return `${s.day} ${s.month} ${s.year} - ${e.day} ${e.month} ${e.year}`
  }

  // Same Year, Different Month: 10 - 20 Aban 1403
  if (s.month !== e.month) {
    return `${s.day} ${s.month} - ${e.day} ${e.month} ${s.year}`
  }

  // Same Month: 10 - 15 Aban 1403
  return `${s.day} - ${e.day} ${s.month} ${s.year}`
}
</script>

<template>
  <main class="pt-32 pb-20 min-h-screen">
    
    <div v-if="pending && !publications?.length" class="text-center opacity-50 py-20">
      Loading library...
    </div>

    <div v-else class="flex flex-col gap-y-16 px-4 max-w-screen-lg mx-auto">
      <NuxtLink 
        v-for="book in publications" 
        :key="book.id"
        :to="`/publications/${book.slug}`"
        class="group flex flex-col md:flex-row md:gap-8 items-start no-underline"
      >
        <div class="max-w-[70%] mx-auto  w-full md:w-64 flex-shrink-0">
          <div class="aspect-square bg-gray-50 overflow-hidden relative   transition-all duration-300">
            <img 
              v-if="book.thumb"
              :src="book.thumb" 
              class="object-contain w-full h-full object-cover group-hover:scale-95 transition-transform duration-200"
              loading="lazy"
              :alt="book.title || ''"
            />
            <div v-else class="w-full h-full flex items-center justify-center bg-gray-100 text-gray-300">
              <span class="text-xs uppercase">No Cover</span>
            </div>
          </div>
        </div>

        <div class="max-w-[72%]  mx-auto flex-1 flex flex-col pt-1">
          
          <h2 class="!my-0 text-xl md:text-3xl font-light text-[#595a5c] group-hover:text-amber-500 transition-colors leading-tight">
            {{ book.title || 'Untitled' }}
          </h2>

          <div class="text-md text-gray-500 mt-3 mb-8">
            {{ formatDisplayDate(book.startDate, book.endDate, book.dateString) }}
          </div>

          <p 
            v-if="book.snippet" 
            class="text-base text-gray-600 font-light leading-relaxed max-w-2xl"
          >
            {{ book.snippet }}
          </p>

        </div>
      </NuxtLink>
    </div>
  </main>
</template>

<style scoped>

</style>