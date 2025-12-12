<!-- app/pages/exhibitions/index.vue -->
<script setup lang="ts">
import { computed } from 'vue'
import { useLocalCache } from '~/composables/useLocalCache'

type ExhibitionCard = {
  id: number
  slug: string
  title: string
  artistName: string
  artistSlug: string | null
  dateString: string | null
  thumb: string | null
  year: number | null
}

type ExhibitionsResponse = {
  current: ExhibitionCard[]
  past: ExhibitionCard[]
  years: number[]
  year: number
}

const { locale } = useI18n()
const route = useRoute()

const selectedYear = computed(() => {
  const y = Number(route.query.year ?? '')
  if (Number.isFinite(y) && y > 1900) return y
  return new Date().getUTCFullYear()
})

const key = computed(() => `exhibitions:${locale.value}:${selectedYear.value}`)

const { data: payload, pending, error } = useLocalCache<ExhibitionsResponse>(
  () => key.value,
  () =>
    $fetch<ExhibitionsResponse>('/_q/exhibitions', {
      query: { locale: locale.value, year: selectedYear.value },
    }),
  { ttlMs: 60_000, swr: true, initial: { current: [], past: [], years: [], year: selectedYear.value } }
)

const current = computed(() => payload.value?.current ?? [])
const past = computed(() => payload.value?.past ?? [])
const years = computed(() => payload.value?.years ?? [2014,2015,2016,2017,2018,2019,2020,2021,2022,2023,2024,2025])
const activeYear = computed(() => payload.value?.year ?? selectedYear.value)

function artistHref(artistSlug: string | null) {
  return artistSlug ? `/artists/${artistSlug}` : ''
}

useSeoMeta({ title: 'Exhibitions' })
</script>

<template>
  <main class="pb-10" style="min-height: 85vh;">
    <!-- Fixed Current/Past -->
    <div class="fixed py-[20px] mb-[20px] left-0 right-0 z-10 bg-white/90 backdrop-blur border-b">
      <div class="flex justify-center text-md gap-0 uppercase py-0">
        <a href="#current" class="mx-[6px] no-underline text-[#595a5c] hover:text-amber-500 transition">Current</a>
        <span class="text-black/30 mx-[6px] ">|</span>
        <a href="#past" class="no-underline mx-[6px]  text-[#595a5c] hover:text-amber-500 transition">Past</a>
      </div>
    </div>

    <!-- Spacer for fixed bar -->

    <!-- CURRENT -->
    <div id="current" class="h-[110px]" />
    <h1 class="text-center text-[24px] uppercase tracking-wide text-[#595a5c]/95" style="margin: 1rem 0 2rem 0;">
      Current
    </h1>

    <section class="w-full mx-0">
      <div class="flex flex-col md:flex-row gap-x-10 gap-y-14 justify-around mx-4 ">
        <div v-for="ex in current" :key="ex.id" class="w-full max-w-[320px] mx-auto">
          <div class="flex flex-col">
            <NuxtLink
              class="block no-underline"
              :to="`/exhibitions/${ex.slug}`"
            >
              <img
                v-if="ex.thumb"
                :src="ex.thumb"
                class="w-full aspect-square object-cover"
                loading="lazy"
                decoding="async"
                :alt="ex.title"
              />
              <div v-else class="w-full aspect-square bg-gray-100" />
            </NuxtLink>

            <NuxtLink
              v-if="artistHref(ex.artistSlug)"
              class="mt-3 no-underline uppercase tracking-wide text-[1.05rem] text-gray-700/90 hover:text-amber-500 transition"
              :to="artistHref(ex.artistSlug)"
            >
              {{ ex.artistName }}
            </NuxtLink>
            <div
              v-else
              class="mt-3 uppercase tracking-wide text-[1.05rem] text-gray-700/70"
            >
              {{ ex.artistName }}
            </div>

            <NuxtLink
              class="no-underline uppercase tracking-wide text-gray-700/80 hover:text-amber-500 transition"
              :to="`/exhibitions/${ex.slug}`"
            >
              {{ ex.title }}
            </NuxtLink>

            <div class="mt-1 text-sm text-gray-600/80">
              {{ ex.dateString || '' }}
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- PAST -->
    <div id="past" class="h-[120px]" />
    <h2 class="text-center text-[24px] uppercase tracking-wide text-[#595a5c]/95" style="margin: 1rem 0 4rem 0;">
      Past
    </h2>

    <!-- YEARS -->
    <div id="years" class="years-anchor flex justify-center flex-wrap gap-x-3 gap-y-2 text-md text-black/70 max-w-screen px-8">
      <template v-for="y in years" :key="y">
        <span class="inline-flex items-center last:[&>.sep]:hidden">
          <NuxtLink
            class="no-underline text-[#595a5c] hover:text-[#ffde00]/80 transition"
            :class="y === selectedYear ? 'font-semibold text-[#ffde00]' : ''"
            :to="{ path: '/exhibitions', query: { year: y }, hash: '#years' }"
          >
            {{ y }}
          </NuxtLink>

          <span class="sep text-black/20 mx-1">|</span>
        </span>
      </template>

    </div>

    <section class="px-4 max-w-screen min-h-[70vh] mx-auto mt-12 md:mt-10">
      <div class="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-x-6 gap-y-6">
        <div v-for="ex in past" :key="ex.id" class="w-min sm:w-full mx-auto">
          <div class="flex flex-col overflow-hidden  w-full justify-center w-full mx-auto">
            <NuxtLink class="block  no-underline w-max" :to="`/exhibitions/${ex.slug}`">
              <img
                v-if="ex.thumb"
                :src="ex.thumb"
                class="w-[340px] h-[320px] sm:w-[260px] sm:h-[240px]  object-cover"
                loading="lazy"
                decoding="async"
                :alt="ex.title"
              />
              <div v-else class="w-full aspect-vertical-square bg-gray-100" />
            </NuxtLink>

            <NuxtLink
              v-if="artistHref(ex.artistSlug)"
              class="mt-2 no-underline uppercase tracking-wide text-sm text-gray-700/90 hover:text-amber-500 transition"
              :to="artistHref(ex.artistSlug)"
            >
              {{ ex.artistName }}
            </NuxtLink>
            <div
              v-else
              class="mt-2 uppercase tracking-wide text-sm text-gray-700/70"
            >
              {{ ex.artistName }}
            </div>

            <NuxtLink
              class="no-underline uppercase tracking-wide text-sm text-gray-700/80 hover:text-amber-500 transition"
              :to="`/exhibitions/${ex.slug}`"
            >
              {{ ex.title }}
            </NuxtLink>

            <div class="mt-1 text-xs text-gray-600/80">
              {{ ex.dateString || '' }}
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- status -->
    <!-- <div
      v-if="pending"
      class="fixed z-20 bottom-6 left-1/2 -translate-x-1/2 py-1 px-3 text-sm text-gray-900 bg-yellow-300/80 rounded shadow"
    >
      Refreshing…
    </div>
    <div
      v-else-if="error"
      class="fixed z-20 bottom-6 left-1/2 -translate-x-1/2 py-1 px-3 text-sm text-red-900 bg-red-300/80 rounded shadow"
    >
      Error loading. Showing cache.
    </div> -->
  </main>
</template>


<style scoped>
/* keep OGallery classnames; if you already have global CSS, this will just complement it */

.exhibition-cur-past {
  gap: 0.75rem;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(6px);
  padding: 0.6rem 0.75rem;
  border-bottom: 1px solid rgba(0, 0, 0, 0.12);
  z-index: 5;
}

.exhibition-cur-past a {
  color: rgba(0, 0, 0, 0.65);
  text-transform: uppercase;
  letter-spacing: 0.02em;
}

.exhibition-cur-past a:hover {
  color: #f59e0b; /* amber-500 */
}

.exhibition-cur-past a.active {
  color: rgba(0, 0, 0, 0.85);
  text-decoration: underline !important;
}

.exhibition-card {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.exhibition-card-thumb img {
  width: 100%;
  aspect-ratio: 1 / 1;
  object-fit: cover;
  transition: transform 0.18s ease, opacity 0.18s ease;
}

.exhibition-card-thumb:hover img {
  transform: scale(0.98);
  opacity: 0.88;
}

.exhibition-card-title,
.exhibition-card-artist {
  text-transform: uppercase;
  letter-spacing: 0.02em;
  text-decoration: none;
}

.exhibition-card-title {
  font-weight: 300;
  color: rgba(0, 0, 0, 0.75);
}

.exhibition-card-artist {
  font-weight: 300;
  color: rgba(0, 0, 0, 0.6);
}

.exhibition-card-title:hover,
.exhibition-card-artist:hover {
  color: #f59e0b;
}

.exhibition-card-duration {
  margin: 0;
  font-weight: 300;
  color: rgba(0, 0, 0, 0.55);
  text-transform: uppercase;
  letter-spacing: 0.02em;
}


.aspect-vertical-square{
    cursor: pointer;
    transition: all .3s cubic-bezier(.23, 1, .32, 1);
    width: 260px;
    height: 260px;
    -o-object-fit: cover;
    object-fit: cover;
    object-position: center;

}

.rowrow{

    margin-right: 8px;
    margin-left: 8px;
    margin-top: 3rem;
}
/* scoped or global */
.years-anchor {
  scroll-margin-top: 140px; /* adjust to your fixed header height */
}

</style>
