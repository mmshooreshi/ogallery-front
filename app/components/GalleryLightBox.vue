<script setup lang="ts">
const props = defineProps<{
  slides: { id: string; media: { url: string; alt?: string | null; caption?: string } }[]
  startIndex?: number
}>()

const emit = defineEmits(['close'])

const currentIndex = ref(props.startIndex ?? 0)

function next() {
  currentIndex.value = (currentIndex.value + 1) % props.slides.length
}
function prev() {
  currentIndex.value =
    (currentIndex.value - 1 + props.slides.length) % props.slides.length
}
function goTo(i: number) {
  currentIndex.value = i
}
</script>

<template>
  <div
    class="fixed inset-0 z-[9999] bg-black/90 flex flex-col items-center justify-center"
  >
    <!-- Close button -->


        <button
        @click="$emit('close')"
      class="absolute bg-black/20 backdrop-blur border-0 hover:bg-black/50 group cursor-pointer transition-all  right-4 top-4 text-white/50 hover:text-white text-4xl"
    >
        <div class="group-hover:scale-120  transition-all">
      ×
    </div>

      
    </button>


    <!-- Big Image -->
    <div class="flex-1 flex flex-col gap-2 items-center justify-center w-full px-4">
      <NuxtImg
        :src="slides[currentIndex]?.media.url"
        :alt="slides[currentIndex]?.media.alt || ''"
        class="max-h-[80vh] max-w-full object-contain"
      />
      <div class="max-w-md mx-auto text-white " style="overflow-wrap: anywhere;"> 
        <!-- {{slides[currentIndex]}} -->
         {{slides[currentIndex]?.media?.caption}}
    
    </div>
    </div>

    <!-- Prev/Next arrows -->
    <button
      @click="prev"
      class="overflow-hidden absolute bg-black/20 backdrop-blur border-0 hover:bg-black/50 group cursor-pointer transition-all pt-0 pb-2  hover:pr-5 px-4 hover:left-0 left-1 top-1/2 -translate-y-1/2 text-white/50 hover:text-white text-4xl"
    >
    <div class="group-hover:scale-120 group-hover:-translate-x-1 transition-all">
      ‹
    </div>
    </button>
    <button
      @click="next"
      class="overflow-hidden  absolute bg-black/20 backdrop-blur border-0 hover:bg-black/50 group cursor-pointer transition-all pt-0 pb-2  hover:pl-5 px-4 hover:right-0 right-1 top-1/2 -translate-y-1/2 text-white/50 hover:text-white text-4xl"
    >
        <div class="group-hover:scale-120 group-hover:translate-x-1 transition-all">
      ›
    </div>

      
    </button>

    <!-- Thumbnail strip -->
    <div class="flex gap-2 overflow-x-auto px-2 py-2 bg-black/70">
      <div
        v-for="(s, i) in slides"
        :key="s.id"
        class="cursor-pointer h-16 border-solid border-2 text-white"
        :class="i === currentIndex ? 'border-yellow-500' : 'border-transparent'"
        @click="goTo(i)"
      >
      
        <NuxtImg
          :src="s.media.url"
          :alt="s.media.alt || ''"
          class="h-16 w-16 object-cover"
        />
      </div>
    </div>
  </div>
</template>
