<!-- app/pages/studio/[slug].vue -->
<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted, watch } from 'vue'
import { useEntryDetail } from '~/composables/useEntry'
import { useRouter } from 'vue-router'

const router = useRouter()
const { data: art, pending } = useEntryDetail('studio')

// --- Data ---
const slides = computed(() => art.value?.media || [])
const effectiveSlides = computed(() => {
  if (slides.value.length) return slides.value
  return art.value?.coverMedia ? [{ id: 0, media: art.value.coverMedia }] : []
})

const fullCaption = computed(() => art.value?.title || '')
const currentSlideIndex = ref(0)
const transitionName = ref('slide-left') // Default direction

// --- Navigation & Direction Logic ---
const nextSlide = () => {
  if (effectiveSlides.value.length > 1) {
    transitionName.value = 'slide-left'
    currentSlideIndex.value = (currentSlideIndex.value + 1) % effectiveSlides.value.length
  }
}

const prevSlide = () => {
  if (effectiveSlides.value.length > 1) {
    transitionName.value = 'slide-right'
    currentSlideIndex.value = (currentSlideIndex.value - 1 + effectiveSlides.value.length) % effectiveSlides.value.length
  }
}

const goToSlide = (index: number) => {
  // Determine direction based on index
  if (index > currentSlideIndex.value) {
    transitionName.value = 'slide-left'
  } else {
    transitionName.value = 'slide-right'
  }
  currentSlideIndex.value = index
}

const close = () => {
  router.push('/studio')
}

// --- Swipe Logic ---
const touchStartX = ref(0)
const touchEndX = ref(0)

const handleTouchStart = (e: TouchEvent) => {
  touchStartX.value = e.changedTouches[0].screenX
}

const handleTouchEnd = (e: TouchEvent) => {
  touchEndX.value = e.changedTouches[0].screenX
  handleSwipeGesture()
}

const handleSwipeGesture = () => {
  const threshold = 50 // Minimum distance required for swipe
  if (touchEndX.value < touchStartX.value - threshold) {
    nextSlide() // Swipe Left -> Next
  }
  if (touchEndX.value > touchStartX.value + threshold) {
    prevSlide() // Swipe Right -> Prev
  }
}

// --- Scroll Lock ---
onMounted(() => {
  document.documentElement.style.overflow = 'hidden'
  document.body.style.overflow = 'hidden'
  document.body.style.height = '100%'
})

onUnmounted(() => {
  document.documentElement.style.overflow = ''
  document.body.style.overflow = ''
  document.body.style.height = ''
})

// Preload
watch(effectiveSlides, (newSlides) => {
  if (newSlides.length) {
    newSlides.forEach(slide => {
      const img = new Image()
      img.src = slide.media.url
    })
  }
}, { immediate: true })
</script>

<template>
  <div class="fixed inset-0 z-[9999] bg-white w-full h-[100dvh] flex flex-col md:flex-row overflow-hidden font-sans text-[#333]">
    
    <div v-if="pending && !art" class="absolute inset-0 flex items-center justify-center bg-white z-50">
      <span class="text-xs font-light uppercase tracking-[0.2em] text-gray-400 animate-pulse">Loading...</span>
    </div>

    <template v-else-if="art">
      
      <div 
        class="relative flex-1 bg-[#FAFAFA] h-[60vh] md:h-full flex flex-col justify-center order-2 md:order-1 overflow-hidden select-none group"
        @touchstart="handleTouchStart"
        @touchend="handleTouchEnd"
      >
        
        <div class="w-full h-full relative flex items-center justify-center bg-white overflow-hidden">
          <transition :name="transitionName">
            <img
              :key="currentSlideIndex"
              :src="effectiveSlides[currentSlideIndex]?.media.url"
              class="absolute max-h-[85%] object-contain"
              alt="Artwork"
              draggable="false"
            />
          </transition>
        </div>

        <div class="absolute bottom-0 left-0 w-full flex items-end justify-between pointer-events-none z-20">
          
          <div class="w-16 hidden md:block"></div>

          <div v-if="effectiveSlides.length > 1" class="flex items-center justify-center gap-2 pointer-events-auto pb-3 md:pb-6 px-4">
             <div 
               v-for="(slide, idx) in effectiveSlides" 
               :key="idx"
               @click="goToSlide(idx)"
               class="h-[3px] transition-all duration-300 cursor-pointer"
               :class="[
                 currentSlideIndex === idx 
                   ? 'w-[40px] bg-[#FCD34D]' 
                   : 'w-[40px] bg-gray-300 hover:bg-gray-400'
               ]"
             />
          </div>

          <div v-if="effectiveSlides.length > 1" class="flex items-center gap-4 pointer-events-auto pr-2 pb-2">
            <div 
              @click="prevSlide" 
              class="cursor-pointer text-gray-500 hover:text-black transition-colors duration-200"
            >
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke-linecap="square" stroke-linejoin="round"/>
              </svg>
            </div>

            <div 
              @click="nextSlide" 
              class="cursor-pointer text-gray-500 hover:text-black transition-colors duration-200"
            >
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke-linecap="square" stroke-linejoin="round"/>
              </svg>
            </div>
          </div>
        </div>
      </div>

      <aside class="w-full md:w-[380px] lg:w-[420px] bg-white flex flex-col order-1 md:order-2 z-50 h-auto md:h-full overflow-y-auto border-l border-gray-100">
        
        <div class="flex justify-end p-6 md:p-8">
           <div 
             @click="close" 
             class="cursor-pointer text-gray-400 hover:text-black transition-colors duration-200"
             aria-label="Close"
           >
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
                <path d="M18 6L6 18M6 6L18 18" stroke-linecap="square" stroke-linejoin="round"/>
              </svg>
           </div>
        </div>

        <div class="px-8 md:pb-10 md:px-12 md:pb-12 mt-auto md:mt-48 flex flex-col text-left space-y-0 md:space-y-6">
          
          <div>
             <h1 class="text-xl md:text-2xl font-light leading-relaxed text-[#444]">
               {{ fullCaption }}
             </h1>
          </div>

          <div class="border-t border-gray-200 w-full"></div>

          <div v-if="art.props?.status">
             <span class="text-lg font-light text-[#444]">
               {{ art.props.status }}
             </span>
             <div v-if="art.props?.price" class="text-sm text-gray-500 mt-1">
               {{ art.props.price }}
             </div>
          </div>
           <div v-else>
             <span class="text-lg font-light text-[#444]">Available</span>
          </div>

          <div class="pt-2">
            <div class="border border-solid w-max border-gray-300 px-6 py-2 text-sm font-light text-gray-600 hover:text-[#000] hover:border-[#000] transition-colors duration-300 cursor-pointer">
              Request
            </div>
          </div>

        </div>

        <div class="h-6 md:hidden"></div>

      </aside>

    </template>
  </div>
</template>

<style scoped>
/* Common Transition Properies */
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