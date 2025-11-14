<!-- app/components/EmblaCarousel.vue -->
<script setup lang="ts">
import emblaCarouselVue from 'embla-carousel-vue'
import Autoplay from 'embla-carousel-autoplay'

const props = defineProps<{
  slides: { id: string; media: { url: string; alt?: string | null } }[]
  height?: string // optional override, default "60vh"
  autoplayDelay?: number // ms
}>()

const autoplayDelay = computed(() => props.autoplayDelay ?? 3000)

const [emblaRef, emblaApi] = emblaCarouselVue(
  { loop: true },
  [Autoplay({ delay: autoplayDelay.value, stopOnInteraction: false })],
)

const selectedIndex = ref(0)
const totalSlides = computed(() => props.slides.length)

const progress = ref(0) // 0 → 1 for current slide
let rafId: number | null = null
let lastTime: number | null = null

function loop(now: number) {
  if (lastTime === null) lastTime = now
  const elapsed = now - lastTime
  progress.value = Math.min(elapsed / autoplayDelay.value, 1)

  if (progress.value >= 1) {
    // reset for next cycle
    lastTime = now
    progress.value = 0
  }

  rafId = requestAnimationFrame(loop)
}

function goToSlide(i: number) {
  emblaApi.value?.scrollTo(i)
}

onMounted(() => {
  const api = emblaApi.value
  if (api) {
    selectedIndex.value = api.selectedScrollSnap()
    api.on('select', () => {
      selectedIndex.value = api.selectedScrollSnap()
      lastTime = performance.now()
      progress.value = 0
    })
  }
  rafId = requestAnimationFrame(loop)
})

onBeforeUnmount(() => {
  if (rafId) cancelAnimationFrame(rafId)
})
</script>

<template>
  <div
    class="embla relative w-full overflow-hidden"
    ref="emblaRef"
    :style="{ height: props.height || '60vh' }"
  >
    <!-- Slides -->
    <div class="embla__container h-full">
      <div
        v-for="m in slides"
        :key="m.id"
        class="embla__slide flex items-center justify-center h-full w-full"
      >
        <img
          :src="m.media.url"
          :alt="m.media.alt || ''"
          class="w-full h-full object-cover"
          loading="lazy"
          decoding="async"
        />
      </div>
    </div>

<!-- Progress Indicators (clickable) -->
<div
  class="absolute left-0 right-0 flex w-max mx-auto justify-around gap-1 sm:gap-2 px-0"
  style="bottom: 0rem"
>
<div   @click="goToSlide(i)" v-for="(_, i) in totalSlides" class="group cursor-pointer relative flex-1 py-2 sm:w-[26px] sm:max-w-[36px]">
  <button
  
    :key="i"
    type="button"
    class="w-full h-1 flex-1 border-0 scale-90 transition-all group-hover:scale-y-200  group-hover:bg-yellow-400 bg-gray-300/70 max-w-[46px]  overflow-visible cursor-pointer"
    
  >
    <div
      class="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-yellow-400 "
      :style="{ width: i === selectedIndex ? `${progress * 100}%` : '0%' }"
    ></div>
  </button>
  </div>
</div>

  </div>
</template>

<style scoped>
.embla__container {
  display: flex;
  height: 100%;
}
.embla__slide {
  flex: 0 0 100%;
  min-width: 0;
}
</style>
