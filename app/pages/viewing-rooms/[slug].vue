<script setup lang="ts">
import { computed } from 'vue'
import { useEntryDetail } from '~/composables/useEntry'
import { formatEntryDate } from '~/utils/date'

const { locale } = useI18n()
const { data: room, pending } = useEntryDetail('viewing-rooms')

const works = computed(() => room.value?.media.filter(m => m.role === 'SELECTED_WORK') || [])
</script>

<template>
  <div class="min-h-screen pb-20">
    
    <div v-if="pending && !room" class="text-center py-32 opacity-50">Loading...</div>
    
    <div v-else>
      <div v-if="room.coverMedia" class="w-full h-[80vh] md:h-[90vh] relative bg-gray-100">
        <img 
          :src="room.coverMedia.url" 
          class="w-full h-full object-cover" 
          :alt="room.title || ''"
        />
      </div>

      <div class="max-w-2xl mx-auto text-center mt-16 px-6">
        <h5 class="text-sm uppercase tracking-widest text-gray-400 mb-2">Online Viewing Room</h5>
        <h1 class="text-4xl md:text-5xl font-light text-gray-800 mb-4">{{ room.title }}</h1>
        <div class="text-sm text-gray-500 uppercase tracking-widest mb-8">
          {{ formatEntryDate(room.dates?.range?.start, room.dates?.range?.end, room.dateString, locale) }}
        </div>
        
        <div v-if="room.bodyHtml" class="prose prose-lg text-gray-600 mx-auto" v-html="room.bodyHtml" />
      </div>

      <div class="mt-24 space-y-32 px-4 max-w-screen-lg mx-auto">
        <div 
          v-for="work in works" 
          :key="work.id" 
          class="flex flex-col items-center"
        >
          <div class="w-full md:w-3/4 shadow-lg bg-white p-2 md:p-4">
            <img 
              :src="work.media.url" 
              class="w-full h-auto" 
              loading="lazy"
            />
          </div>

          <div class="mt-6 text-center max-w-md">
            <p class="text-sm text-gray-600 font-light leading-relaxed">
              {{ work.media.caption }}
            </p>
            <button class="mt-4 border border-black px-6 py-2 text-xs uppercase tracking-widest hover:bg-black hover:text-white transition-colors">
              Inquire
            </button>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>