<script setup lang="ts">
import { useEntryList } from '~/composables/useEntry'
import { formatEntryDate } from '~/utils/date' // Reuse your util

const { locale } = useI18n()
const { data: shows, pending } = useEntryList('window')
useSeoMeta({ title: 'The Window' })
</script>

<template>
  <main class="og-container pt-32 pb-20 min-h-screen">
    <div v-if="pending && !shows?.length" class="text-center py-20 opacity-50">Loading...</div>

    <div v-else class="flex flex-col gap-y-24 px-4 max-w-screen-lg mx-auto">
      <NuxtLink 
        v-for="show in shows" 
        :key="show.id"
        :to="`/window/${show.slug}`"
        class="group flex flex-col md:flex-row gap-12 items-center no-underline"
      >
        <div class="w-full md:w-1/2 aspect-video bg-gray-50 overflow-hidden relative">
          <img 
            v-if="show.thumb" :src="show.thumb" 
            class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
          />
        </div>

        <div class="w-full md:w-1/2 flex flex-col">
          <h2 class="text-3xl font-light text-gray-800 group-hover:text-amber-500 transition-colors">
            {{ show.title }}
          </h2>
          <div class="text-sm text-gray-400 mt-4 uppercase tracking-widest">
            {{ formatEntryDate(show.startDate, show.endDate, show.dateString, locale) }}
          </div>
          <p v-if="show.snippet" class="mt-6 text-gray-600 font-light leading-relaxed line-clamp-3">
            {{ show.snippet }}
          </p>
        </div>
      </NuxtLink>
    </div>
  </main>
</template>