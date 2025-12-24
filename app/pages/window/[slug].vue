<script setup lang="ts">
import { computed } from 'vue'
import { useEntryDetail } from '~/composables/useEntry'

const { data: art, pending } = useEntryDetail('window')

// The scraped "Works" are essentially the carousel slides for this artwork
const slides = computed(() => art.value?.media || [])
// The "Title" usually contains "Artist, Title, Medium, Year". 
const fullCaption = computed(() => art.value?.title || '')
</script>

<template>
  <div class="pt-24 pb-20 px-4 h-screen flex flex-col md:flex-row gap-8 items-center justify-center max-w-screen-xl mx-auto">
    
    <div v-if="pending && !art" class="text-center opacity-50">Loading...</div>
    
    <template v-else-if="art">
      <div class="w-full md:w-2/3 h-[60vh] md:h-[80vh] flex items-center justify-center bg-gray-50 relative">
        <img 
          v-if="slides[0]" 
          :src="slides[0].media.url" 
          class="max-w-full max-h-full object-contain shadow-sm" 
        />
      </div>

      <div class="w-full md:w-1/3 flex flex-col items-start space-y-6">
        <h1 class="text-lg md:text-xl font-light leading-relaxed text-gray-800">
          {{ fullCaption }}
        </h1>

        <button class="border border-black px-8 py-3 text-xs uppercase tracking-widest hover:bg-black hover:text-white transition-colors">
          Inquire
        </button>
      </div>
    </template>

  </div>
</template>