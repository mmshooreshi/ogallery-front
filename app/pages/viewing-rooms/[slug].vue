<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted, watch } from 'vue'
import { useEntryDetail } from '~/composables/useEntry'
import { useMultiLingual } from '~/composables/useMultiLingual'

// --- 1. Setup & Main Data ---
const route = useRoute()
const { locale } = useI18n()
const { t } = useMultiLingual()
const { data: room, pending } = useEntryDetail('viewing-rooms')

// --- 2. Page Computed Properties ---
const loc = computed(() => (room.value as any)?.locales?.find((l: any) => l.locale === locale.value) ?? (room.value as any)?.locales?.[0])
const artist = computed(() => room.value?.artist)
const heroImage = computed(() => room.value?.coverMedia?.url)

// Filter: Show only Main Works in the grid (Exclude "Detail" shots)
const works = computed(() =>
  room.value?.media?.filter(m =>
    (m.role === 'SELECTED_WORK' || m.role === 'WORK') &&
    !m.media.caption?.includes('Detail')
  ) || []
)

// Helper: Image Load
const handleImageLoad = (event: Event) => {
  const img = event.target as HTMLImageElement
  img.classList.remove('opacity-0')
  img.classList.add('opacity-100')
}

// Helper: Status
const getStatus = (item: any) => {
  return item.meta?.status || 'Available'
}

// =========================================================
// --- 3. DETAIL MODAL LOGIC (Integrated from Studio) ---
// =========================================================

const selectedWork = ref<any>(null)
const currentSlideIndex = ref(0)
const transitionName = ref('slide-left')

// Logic: Build slideshow by finding the selected work + following "Detail" shots
const modalSlides = computed(() => {
  if (!selectedWork.value || !room.value?.media) return []

  // 1. Start with the main work
  const slides = [selectedWork.value]

  // 2. Find index in the FULL raw list
  const allMedia = room.value.media
  const currentIndex = allMedia.findIndex((m: any) => m.id === selectedWork.value.id)

  // 3. Look ahead for "Detail" captions
  if (currentIndex !== -1) {
    for (let i = currentIndex + 1; i < allMedia.length; i++) {
      const nextItem = allMedia[i]
      // Stop if we hit another main work (caption doesn't have "Detail")
      if (nextItem.media.caption && !nextItem.media.caption.includes('Detail')) break

      // If it is a detail, add to slides
      if (nextItem.media.caption && nextItem.media.caption.includes('Detail')) {
        slides.push(nextItem)
      }
    }
  }
  return slides
})

const openWork = (work: any) => {
  selectedWork.value = work
  currentSlideIndex.value = 0
  document.documentElement.style.overflow = 'hidden' // Lock scroll
  document.body.style.overflow = 'hidden'
}

const closeWork = () => {
  selectedWork.value = null
  document.documentElement.style.overflow = '' // Unlock scroll
  document.body.style.overflow = ''
}

// --- Navigation ---
const nextSlide = () => {
  if (modalSlides.value.length > 1) {
    transitionName.value = 'slide-left'
    currentSlideIndex.value = (currentSlideIndex.value + 1) % modalSlides.value.length
  }
}

const prevSlide = () => {
  if (modalSlides.value.length > 1) {
    transitionName.value = 'slide-right'
    currentSlideIndex.value = (currentSlideIndex.value - 1 + modalSlides.value.length) % modalSlides.value.length
  }
}

const goToSlide = (index: number) => {
  transitionName.value = index > currentSlideIndex.value ? 'slide-left' : 'slide-right'
  currentSlideIndex.value = index
}

// --- Swipe Gestures ---
const touchStartX = ref(0)
const touchEndX = ref(0)

const handleTouchStart = (e: TouchEvent) => {
  touchStartX.value = e.changedTouches[0].screenX
}

const handleTouchEnd = (e: TouchEvent) => {
  touchEndX.value = e.changedTouches[0].screenX
  const threshold = 50
  if (touchEndX.value < touchStartX.value - threshold) nextSlide()
  if (touchEndX.value > touchStartX.value + threshold) prevSlide()
}

// --- Keyboard Support ---
const handleKeydown = (e: KeyboardEvent) => {
  if (!selectedWork.value) return
  if (e.key === 'Escape') closeWork()
  if (e.key === 'ArrowRight') nextSlide()
  if (e.key === 'ArrowLeft') prevSlide()
}

onMounted(() => window.addEventListener('keydown', handleKeydown))
onUnmounted(() => window.removeEventListener('keydown', handleKeydown))

// Preload logic from Studio
watch(modalSlides, (newSlides) => {
  if (newSlides.length) {
    newSlides.forEach(slide => {
      const img = new Image()
      img.src = slide.media.url
    })
  }
})
</script>

<template>
  <main class="bg-white relative pt-[56px] min-h-screen">

    <div v-if="pending && !room" class="h-screen flex items-center justify-center">
      <div class="text-xs uppercase tracking-widest text-gray-400 animate-pulse">Loading Room...</div>
    </div>

    <div v-else-if="room">

      <section id="selected-work" class="w-full mb-12 relative bg-[#f9f9f9]">
        <div class="w-full h-[50vh] md:h-[93vh] overflow-hidden relative">
          <img v-if="heroImage" :src="heroImage"
            class="w-full h-full object-cover object-center opacity-0 transition-opacity duration-1000 ease-out"
            @load="handleImageLoad" alt="Viewing Room Cover" />
        </div>
      </section>

      <div class="containerr mx-auto px-4 mt-16 mb-0 text-center flex flex-col gap-0">
        <h5 class="text-xl text-[#595a5c] tracking-wide font-light mt-0 mb-2">
          {{ locale === 'FA' ? 'فضای بازدید مجازی' : 'Online Viewing Room' }}
        </h5>

        <h2 class="text-[2.7rem] text-[#595a5c] leading-[3.2rem] font-light text-[#212529] mt-0 mb-1">
          {{ loc?.title }}
        </h2>

        <h5 class="text-xl text-[#595a5c] my-0">
          {{ room.dateString }}
        </h5>

        <h3 v-if="artist" class="mt-6 text-2xl md:text-2xl font-light tracking-wide my-0">
          <NuxtLink :to="`/artists/${artist.slug}`"
            class="no-underline text-[#595a5c] hover:text-amber-500 transition-colors">
            {{ artist.name }}
          </NuxtLink>
        </h3>
      </div>

      <div class="containerr px-4  mx-auto">

        <div v-if="loc?.bodyHtml" class="row-layout mb-24">
          <div class="w-full md:w-8/12 mx-auto leading-loose text-gray-700 font-light prose-p:mb-6"
            v-html="loc.bodyHtml"></div>
        </div>

        <div class="flex flex-wrap mb-32">

          <div v-for="(work, index) in works" :key="work.id"
            class="flex flex-col md:flex-col items-center w-full md:w-1/2 my-10"
            :class="{ 'md:flex-row-reverse': index % 2 !== 0 }">

            <div class="w-[80%] group">
              <figure class="w-full p-0 m-0 group-hover:scale-95 group-hover:opacity-80 transition">
                <div @click="openWork(work)" class="bg-[#fafafa] relative overflow-hidden group cursor-pointer">
                  <img :src="work.media.url" loading="lazy" width="800" height="600" @load="handleImageLoad"
                    class="w-full h-auto object-contain opacity-0 transition-all duration-700 ease-out group-hover:opacity-95"
                    :alt="work.media.caption || ''" />

                  <div
                    class="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                    <span class="bg-white/90 backdrop-blur px-4 py-2 text-xs uppercase tracking-widest text-black">
                      View Detail
                    </span>
                  </div>
                </div>
              </figure>
            </div>

            <div
              class="flex w-[80%] max-w-4xl flex-row items-center justify-between gap-4 text-start md:text-left my-2">

              <p class="text-sm font-light leading-relaxed text-gray-600 md:text-base my-0">
                {{ work.media.caption }}
              </p>

              <div @click="openWork(work)"
                class="hover:border-[#ffde00] cursor-pointer flex shrink-0 items-center justify-center border border-solid border-black/50 px-4 py-2 text-lg font-medium transition-colors !text-[#595a5c] my-0"
                :class="getStatus(work) === 'Sold' ? 'text-red-800' : 'text-green-800'">
                {{ getStatus(work) }}
              </div>

            </div>

          </div>

        </div>

      </div>

    </div>

    <Teleport to="body">
      <div v-if="selectedWork"
        class="fixed inset-0 z-[9999] bg-[#f9f9f9] w-full h-[100dvh] flex flex-col-reverse md:flex-row overflow-hidden font-sans text-[#333]">
        <div class="absolute flex top-0 right-0 z-20 p-6 md:p-8">
          <div @click="closeWork" class="cursor-pointer text-gray-400 hover:text-black transition-colors duration-200"
            aria-label="Close">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
              <path d="M18 6L6 18M6 6L18 18" stroke-linecap="square" stroke-linejoin="round" />
            </svg>
          </div>
        </div>

        <div
          class="relative flex-1 bg-[#FAFAFA] h-[60vh] md:h-full flex flex-col justify-center order-2 md:order-1 overflow-hidden select-none group"
          @touchstart="handleTouchStart" @touchend="handleTouchEnd">

          <div class="w-full h-full relative flex items-center justify-center bg-white overflow-hidden">
            <transition :name="transitionName">
              <img :key="currentSlideIndex" :src="modalSlides[currentSlideIndex]?.media?.url"
                class="absolute max-h-[85%] object-contain" alt="Artwork" draggable="false" />
            </transition>
          </div>

          <div class="absolute bottom-0 left-0 w-full flex items-end justify-between pointer-events-none">

            <div class="w-16 hidden md:block"></div>

            <div v-if="modalSlides.length > 1"
              class="flex items-center justify-center gap-2 pointer-events-auto pb-3 md:pb-6 px-4">
              <div v-for="(slide, idx) in modalSlides" :key="idx" @click="goToSlide(idx)"
                class="h-[3px] transition-all duration-300 cursor-pointer" :class="[
                  currentSlideIndex === idx
                    ? 'w-[40px] bg-[#FCD34D]'
                    : 'w-[40px] bg-gray-300 hover:bg-gray-400'
                ]" />
            </div>

            <div v-if="modalSlides.length > 1" class="flex items-center gap-4 pointer-events-auto pr-2 pb-2">
              <div @click="prevSlide"
                class="cursor-pointer text-gray-500 hover:text-black transition-colors duration-200">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                  <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke-linecap="square" stroke-linejoin="round" />
                </svg>
              </div>

              <div @click="nextSlide"
                class="cursor-pointer text-gray-500 hover:text-black transition-colors duration-200">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                  <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke-linecap="square" stroke-linejoin="round" />
                </svg>
              </div>
            </div>
            <div v-else class="w-16"></div>
          </div>
        </div>

        <aside
          class="w-full md:w-[380px] lg:w-[420px] bg-[#f9f9f9] flex flex-col order-1 md:order-2 h-auto md:h-full overflow-y-auto border-l border-gray-100">

          <div class="px-0 md:pb-10 md:pb-12 mt-auto md:mt-48 flex flex-col text-left space-y-0 md:space-y-6">

            <div>
              <h1 class="px-4 md:px-12 text-xl md:text-2xl font-light leading-relaxed text-[#444]">
                {{ selectedWork.media.caption }}
              </h1>
            </div>

            <div class="border-t border-gray-200 w-full h-0 border-0.5 border-solid"></div>

            <div v-if="getStatus(selectedWork)" class="px-4 md:px-12 py-8 md:py-4">
              <span class="text-lg font-light border border-1 border-solid border-black/50 p-2.5 !text-[#595a5c]"
                :class="getStatus(selectedWork) === 'Sold' ? 'text-red-800' : 'text-[#444]'">
                {{ getStatus(selectedWork) }}
              </span>
              <div v-if="selectedWork.meta?.price && getStatus(selectedWork) !== 'Sold'"
                class="text-sm text-gray-500 mt-1 border border-1 border-solid border-black/50 p-2.5 !text-[#595a5c]">
                {{ selectedWork.meta.price }}
              </div>
            </div>

            <div class="pt-2">
              
              <a v-if="getStatus(selectedWork) !== 'Sold'" href="mailto:info@ogallery.net"
                class="block w-max border border-solid border-gray-300 px-6 py-2 text-sm font-light text-gray-600 hover:text-[#000] hover:border-[#000] transition-colors duration-300 cursor-pointer no-underline">
                Request
              </a>
            </div>

          </div>

          <div class="h-6 md:hidden"></div>

        </aside>


      </div>
    </Teleport>

  </main>
</template>

<style scoped>
/* --- Viewing Room Page Styles (Preserved) --- */
.opacity-0 {
  opacity: 0;
}

.opacity-100 {
  opacity: 1;
}

h2,
h3,
h5 {
  font-family: inherit;
}

img {
  max-width: 100%;
  display: block;
}

/* --- Studio Modal Transition Styles (Preserved) --- */
.slide-left-enter-active,
.slide-left-leave-active,
.slide-right-enter-active,
.slide-right-leave-active {
  transition: all 0.5s ease-in-out;
}

/* SLIDE LEFT (Next) */
.slide-left-enter-from {
  transform: translateX(100%);
  opacity: 0;
}

.slide-left-leave-to {
  transform: translateX(-100%);
  opacity: 0;
}

/* SLIDE RIGHT (Prev) */
.slide-right-enter-from {
  transform: translateX(-100%);
  opacity: 0;
}

.slide-right-leave-to {
  transform: translateX(100%);
  opacity: 0;
}

/* Ensure images overlay correctly during transition */
.slide-left-leave-active,
.slide-right-leave-active {
  position: absolute;
}
</style>