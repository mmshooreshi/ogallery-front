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
          <h3 class="text-lg font-light text-gray-800 group-hover:text-amber-500 transition-colors">
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
</template>