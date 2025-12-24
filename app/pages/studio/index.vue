<script setup lang="ts">
import { useEntryList } from '~/composables/useEntry'

const { data: items, pending } = useEntryList('studio')
useSeoMeta({ title: 'Studio' })
</script>

<template>
  <main class="pt-32 pb-20 min-h-screen">
    
    <div v-if="pending && !items?.length" class="text-center py-32 opacity-50 font-light uppercase tracking-widest">
      Loading Studio...
    </div>

    <div v-else-if="!items?.length" class="text-center py-32 opacity-50 font-light uppercase tracking-widest">
      No Works Available
    </div>

    <div v-else class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-x-6 gap-y-12 px-4">
      <NuxtLink 
        v-for="art in items" 
        :key="art.id"
        :to="`/studio/${art.slug}`"
        class="group flex flex-col no-underline"
      >
        <div class="aspect-square bg-gray-50 overflow-hidden relative shadow-sm transition-all duration-500 group-hover:shadow-md">
          <img 
            v-if="art.thumb" 
            :src="art.thumb" 
            class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
            loading="lazy" 
            :alt="art.title || ''"
          />
          <div v-else class="w-full h-full flex items-center justify-center text-gray-300 text-xs bg-gray-100 uppercase">
            No Image
          </div>

          <div class="absolute bottom-2 left-2">
             <span class="bg-white/90 backdrop-blur px-2 py-1 text-[10px] font-medium uppercase tracking-wider text-gray-800">
               Available
             </span>
          </div>
        </div>
        
        <div class="mt-3 text-center">
          <h3 class="text-xs font-medium uppercase tracking-wider text-gray-800 group-hover:text-amber-500 transition-colors">
            {{ art.artistName || art.title }}
          </h3>
          
          <p class="text-[10px] text-gray-500 mt-1 uppercase truncate px-2">
            {{ art.title }}
          </p>

          <p v-if="art.price" class="text-[10px] font-bold text-gray-800 mt-1">
            {{ art.price }}
          </p>
        </div>
      </NuxtLink>
    </div>
  </main>
</template>

<style scoped>
.og-container {
  max-width: 1400px; /* Wider for Studio grid */
  margin: 0 auto;
}
</style>