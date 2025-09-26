<script setup lang="ts">
import { useLocalCache } from '~/composables/useLocalCache'

type ArtistListItem = { id: number; slug: string; name: string; image: string | null }

const { locale } = useI18n()
const route = useRoute()
const key  = computed(() => `artists:${locale.value}`)

const { data: artists, pending, error } = useLocalCache<ArtistListItem[]>(
  () => key.value,
  () => $fetch<any>('/_q/artists', { query: { locale: locale.value } }),
  { ttlMs: 60_000, swr: true, initial: [] }
)

const q = computed(() => String(route.query.q ?? '').toLowerCase())
const letter = computed(() => String(route.query.letter ?? '').toUpperCase())

const items = computed(() => {
  const base = (artists.value ?? []).slice().sort((a, b) => a.name.localeCompare(b.name))
  const byQ = q.value ? base.filter(it => it.name.toLowerCase().includes(q.value)) : base
  return letter.value ? byQ.filter(it => it.name.startsWith(letter.value)) : byQ
})

const initials = computed(() =>
  Array.from(new Set((artists.value ?? []).map(it => it.name[0]?.toUpperCase()).filter(Boolean))).sort()
)

useSeoMeta({ title: 'Artists' })
</script>

<template>
  <section class="px-8">
    <header class="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <!-- <h1 class="text-2xl font-semibold">Artists</h1> -->
      <form class="flex gap-2 items-center"
        @submit.prevent="$router.replace({ query: { ...$route.query, q: ($event.target as HTMLFormElement).q.value || undefined } })">
        <input name="q" :value="$route.query.q || ''" placeholder="Search…"
          class="border-0 outline-0 rounded px-3 py-2 mt-1 ml-1 text-xl w-56 font-dosis"/>
          <!-- <input class="focus:border-indigo-600 focus:outline-hidden border-0 outline-0" type="text" /> -->


        <!-- <button class="border rounded px-3 py-2 text-sm">Search</button> -->
      </form>
    </header>

    <ClientOnly>
      <nav v-if="initials.length" class="flex flex-wrap gap-2 mb-6 ml-8 text-sm ">
        <NuxtLink v-for="ch in initials" :key="ch" class="no-underline px-2 py-1 border rounded text-black/60 transition-all"
          :class="{ 'bg-black text-white': letter === ch }"
          :to="{ query: { ...$route.query, letter: ch } }">{{ ch }}</NuxtLink>
      </nav>

      <ul v-if="items.length" class="grid gap-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 list-none">
        <li v-for="doc in items" :key="doc.slug">
          <NuxtLink :to="`/artists/${doc.slug}`" class="no-underline group flex items-center gap-2">
            <span class="uppercase text-black/60 font-thin tracking-widest group-hover:text-yellow-400 transition-all">{{ doc.name }}</span>
          </NuxtLink>
        </li>
      </ul>

      
      <p v-else class="opacity-70">No artists found.</p>

      <div v-if="pending" class="absolute bottom-6 py-0 text-black/70 bg-yellow-500/60 px-2 ">Refreshing…</div>
      <div v-else-if="error" class="absolute bottom-6 py-0 text-red-800/80 bg-red-500/60 px-2">Error loading. Showing cache.</div>

    </ClientOnly>
  </section>
</template>
