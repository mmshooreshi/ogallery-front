<script setup lang="ts">
import { computed, ref } from 'vue'
import { useEntryDetail } from '~/composables/useEntry'
import { getJalaliParts, getGregorianParts } from '~/utils/date'

const { locale } = useI18n()
const { data: book, pending } = useEntryDetail('publications')

// --- Date Logic (Jalali Support) ---
function formatDisplayDate(start: string | null, end: string | null, raw: string | null) {
  // 1. English Locale
  if (locale.value !== 'FA') {
    if (raw) return raw
    if (!start) return ''
    const p = getGregorianParts(start, 'en-US')
    return `${p.month} ${p.day}, ${p.year}`
  }

  // 2. Persian Locale
  if (!start) return raw || ''
  const s = getJalaliParts(start)
  if (!s.day || !s.month || !s.year) return raw

  // Single Date
  if (!end || start === end) {
    return `${s.day} ${s.month} ${s.year}`
  }

  // Range Logic
  const e = getJalaliParts(end)
  if (s.year !== e.year) return `${s.day} ${s.month} ${s.year} - ${e.day} ${e.month} ${e.year}`
  if (s.month !== e.month) return `${s.day} ${s.month} - ${e.day} ${e.month} ${s.year}`
  return `${s.day} - ${e.day} ${s.month} ${s.year}`
}

// --- Helpers ---
const insidePages = computed(() => {
  if (!book.value?.media) return []
  return book.value.media.filter(m => m.role === 'SELECTED_WORK')
})

const specs = computed(() => {
  const p = book.value?.props?.scraped?.props || {}
  return {
    pages: p.pages,
    isbn: p.isbn,
    language: p.language,
    publisher: p.publisher,
    dimensions: p.dimensions
  }
})

// Lightbox
const showLightbox = ref(false)
const lightboxIndex = ref(0)
function openLightbox(i: number) {
  lightboxIndex.value = i
  showLightbox.value = true
}
</script>

<template>
  <div class="pt-20 pb-20 px-6 max-w-screen-xl mx-auto relative min-h-screen">
    
    <div v-if="pending && !book" class="text-center py-32 opacity-50 font-light uppercase tracking-widest">
      Loading...
    </div>
    <div v-else-if="!book" class="text-center py-32 opacity-50 font-light uppercase tracking-widest">
      Publication not found
    </div>

    <div v-else>
      
      <div class="mb-12 md:mb-16">
        <h1 class="text-3xl md:text-5xl font-light text-[#595a5c] mb-3 leading-tight tracking-tight">
          {{ book.title }}
        </h1>
        <div class="text-lg md:text-xl text-[#595a5c]/80 font-light">
          {{ formatDisplayDate(book.dates?.range?.start, book.dates?.range?.end, book.dateString) }}
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-12 gap-y-0 md:gap-x-8 items-start">
        
        <div class="md:col-span-8 order-1 md:order-1 flex flex-col">
          
          <div 
            v-if="book.bodyHtml" 
            class="prose prose-lg max-w-none text-gray-600  leading-relaxed font-light text-justify"
            v-html="book.bodyHtml"
          />

          <div v-if="Object.values(specs).some(v => v)" class="mb-10 grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-8 text-sm text-gray-500 font-light">
             <div v-if="specs.pages"><span class="text-gray-400 mr-2 uppercase tracking-wide">Pages</span> {{ specs.pages }}</div>
             <div v-if="specs.isbn"><span class="text-gray-400 mr-2 uppercase tracking-wide">ISBN</span> {{ specs.isbn }}</div>
             <div v-if="specs.language"><span class="text-gray-400 mr-2 uppercase tracking-wide">Lang</span> {{ specs.language }}</div>
             <div v-if="specs.publisher"><span class="text-gray-400 mr-2 uppercase tracking-wide">Pub</span> {{ specs.publisher }}</div>
             <div v-if="specs.dimensions"><span class="text-gray-400 mr-2 uppercase tracking-wide">Dim</span> {{ specs.dimensions }}</div>
          </div>

        </div>

        <div class="md:col-span-4 order-2 md:order-2">
          <div class="bg-gray-50 relative overflow-hidden">
            <img 
              v-if="book.coverMedia?.url" 
              :src="book.coverMedia.url" 
              class="w-full h-auto object-contain" 
              :alt="book.title || ''"
            />
             <div v-else class="aspect-[3/4] w-full flex items-center justify-center text-gray-300 text-xs bg-gray-100 uppercase tracking-widest">
               No Cover Image
             </div>
          </div>
        </div>

        <div class="md:col-span-8 order-3 md:order-3 pt-4">
          <div v-if="book.pdfUrl">
            <a 
              :href="book.pdfUrl" 
              target="_blank" 
              class="inline-block text-base uppercase tracking-widest text-[#595a5c] hover:text-amber-500 transition-colors no-underline border-b border-transparent hover:border-amber-500 pb-1"
            >
              Download PDF
            </a>
          </div>
        </div>

      </div>

      <section v-if="insidePages.length" class="border-t border-gray-200 pt-20">
        <h3 class="text-center text-sm font-light uppercase tracking-[0.2em] text-gray-400 mb-12">
          Inside the Book
        </h3>
        <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
          <div 
            v-for="(page, i) in insidePages" 
            :key="page.id" 
            class="aspect-[2/3] bg-gray-50 cursor-pointer hover:opacity-90 transition-opacity"
            @click="openLightbox(i)"
          >
            <img 
              :src="page.media.thumb || page.media.url" 
              class="w-full h-full object-cover" 
              loading="lazy" 
              :alt="page.media.caption || ''"
            />
          </div>
        </div>
      </section>

      <GalleryLightBox
        v-if="showLightbox"
        :slides="insidePages"
        :start-index="lightboxIndex"
        @close="showLightbox = false"
      />

    </div>
  </div>
</template>

<style scoped>
/* Typography fine-tuning for the editorial look */
:deep(.prose p) {
  margin-bottom: 1.75em;
  margin-top: 0px;
  font-size: 1.1rem;
  line-height: 1.8;
  color: #595a5c;
}

/* Remove default link styling inside prose to keep it clean */
:deep(.prose a) {
  text-decoration: none;
  font-weight: 400;
  color: inherit;
  border-bottom: 1px solid #ccc;
  transition: border-color 0.2s;
}
:deep(.prose a:hover) {
  color: #f59e0b;
  border-color: #f59e0b;
}

/* Force justified text on mobile to match screenshot */
@media (max-width: 768px) {
  :deep(.prose) {
    text-align: justify;
  }
}
</style>