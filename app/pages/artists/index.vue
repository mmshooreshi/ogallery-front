<!-- app/pages/artists/index.vue -->
<script setup lang="ts">
import { computed, ref } from 'vue'
import { useLocalCache } from '~/composables/useLocalCache'

type ArtistListItem = {
  id: number
  slug: string
  name: string
  lastName: string
  image: string | null
}

type ArtistListResponse = {
  artists: ArtistListItem[]
  exhibited: ArtistListItem[]
}

const { locale } = useI18n()
const route = useRoute()

const key = computed(() => `artists:${locale.value}`)

const { data: payload, pending, error } = useLocalCache<ArtistListResponse>(
  () => key.value,
  () => $fetch<ArtistListResponse>('/_q/artists', { query: { locale: locale.value } }),
  { ttlMs: 60_000, swr: true, initial: { artists: [], exhibited: [] } }
)

const q = computed(() => String(route.query.q ?? '').toLowerCase())
const letter = computed(() => String(route.query.letter ?? '').toUpperCase())

// MAIN ARTISTS
const items = computed(() => {
  const base = (payload.value?.artists ?? []).slice()

  if (!q.value) {
    const sorted = base.sort((a, b) => a.lastName.localeCompare(b.lastName))

    return letter.value
      ? sorted.filter(it => it.lastName.toUpperCase().startsWith(letter.value))
      : sorted
  }

  const query = q.value

  return base
    .map(it => {
      const name = it.name.toLowerCase()
      const idx = name.indexOf(query)
      if (idx === -1) return null

      let score = 0
      if (name === query) score += 1000
      if (name.startsWith(query)) score += 500
      if (idx >= 0) score += Math.max(0, 200 - idx * 10)
      score += Math.max(0, 50 - Math.abs(name.length - query.length))

      return { ...it, _score: score } as ArtistListItem & { _score: number }
    })
    .filter((it): it is ArtistListItem & { _score: number } => !!it)
    .sort((a, b) => b._score - a._score)
})

// MAIN grouped
const groupedItems = computed(() => {
  if (q.value) return []

  const groups: Record<string, ArtistListItem[]> = {}

  for (const artist of items.value) {
    const ch = (artist.lastName[0] || '').toUpperCase()
    if (!ch) continue
    if (!groups[ch]) groups[ch] = []
    groups[ch].push(artist)
  }

  return Object.keys(groups)
    .sort()
    .map(letter => ({
      letter,
      items: groups[letter]?.sort((a, b) => a.lastName.localeCompare(b.lastName)),
    }))
})

// EXHIBITED base list
const exhibitedItems = computed<ArtistListItem[]>(() => {
  const list = payload.value?.exhibited ?? []
  return list.slice().sort((a, b) => a.lastName.localeCompare(b.lastName))
})

// EXHIBITED grouped (no search)
const groupedExhibitedItems = computed(() => {
  const groups: Record<string, ArtistListItem[]> = {}

  for (const artist of exhibitedItems.value) {
    const ch = (artist.lastName[0] || '').toUpperCase()
    if (!ch) continue
    if (!groups[ch]) groups[ch] = []
    groups[ch].push(artist)
  }

  return Object.keys(groups)
    .sort()
    .map(letter => ({
      letter,
      items: groups[letter]?.sort((a, b) => a.lastName.localeCompare(b.lastName)),
    }))
})

// EXHIBITED search list (flat)
const exhibitedSearchItems = computed(() => {
  if (!q.value) return []

  const base = (payload.value?.exhibited ?? []).slice()
  const query = q.value

  return base
    .map(it => {
      const name = it.name.toLowerCase()
      const idx = name.indexOf(query)
      if (idx === -1) return null

      let score = 0
      if (name === query) score += 1000
      if (name.startsWith(query)) score += 500
      if (idx >= 0) score += Math.max(0, 200 - idx * 10)
      score += Math.max(0, 50 - Math.abs(name.length - query.length))

      return { ...it, _score: score } as ArtistListItem & { _score: number }
    })
    .filter((it): it is ArtistListItem & { _score: number } => !!it)
    .sort((a, b) => b._score - a._score)
})

const showExhibited = ref(false)

// 🔹 NEW: track which artist is hovered (by slug)
const hoveredSlug = ref<string | null>(null)

// 🔹 NEW: pool of all artists (main + exhibited) for preview lookup
const allArtistsForPreview = computed<ArtistListItem[]>(() => {
  const map = new Map<string, ArtistListItem>()
  for (const a of payload.value?.artists ?? []) map.set(a.slug, a)
  for (const a of payload.value?.exhibited ?? []) map.set(a.slug, a)
  return Array.from(map.values())
})

// 🔹 NEW: the artist whose image we show on the right
const previewArtist = computed<ArtistListItem | null>(() => {
  const all = allArtistsForPreview.value
  if (!all.length) return null

  if (hoveredSlug.value) {
    return all.find(a => a.slug === hoveredSlug.value) ?? null
  }

  // Fallback when nothing hovered:
  // 1) first main result, 2) first exhibited, 3) null
  return null
  return items.value[0] ?? exhibitedItems.value[0] ?? null
})

useSeoMeta({ title: 'Artists' })
</script>

<template>
  <main role="main" class="relative">
    <!-- Fixed search bar at top -->
    <div class="fixed top-[60px] inset-x-0 z-0 bg-white/90 backdrop-blur border-b">
      <div class=" mx-auto px-0">
        <input
          id="artist-search"
          type="search"
          placeholder="Search..."
          class="border-0 w-full outline-none p-4 pl-[3rem]  text-lg tracking-wide font-dosis"
          :value="$route.query.q || ''"
          @input="
            $router.replace({
              query: {
                ...$route.query,
                q: ($event.target as HTMLInputElement).value || undefined,
              },
            })
          "
        />
      </div>
    </div>

    <!-- Main content area -->
    <div class="px-8 mx-auto px-3 pt-[60px] pb-10 min-h-[450px]">
      <div class="flex flex-col md:flex-row md:items-start md:space-x-8">
        <!-- LEFT COLUMN: artists & accordion -->
        <div class="w-full md:w-2/3">
          <!-- upper “results” list container (kept for structure parity) -->
          <ul id="gallery-result" class="artist-list-result mb-5" />

          <!-- artists list area -->
          <!-- NO SEARCH: grouped by letter (A, B, C...) -->
          <div
            v-if="!q"
            id="gallery-artist"
            class="w-full flex flex-wrap justify-start mx-[10px]"
          >
            <ul
              v-for="group in groupedItems"
              :key="group.letter"
              class="artist-list mb-[2rem] mt-0 flex flex-col"
              :class="'w-1/2'"
            >
              <li class="h-min mb-[10px]">
                <h1 class="artist-head p-0 m-0">
                  {{ group.letter }}
                </h1>
              </li>

              <li
                v-for="doc in group.items"
                :key="doc.slug"
                class="h-8"
              >
                <NuxtLink
                  class="en-letter"
                  :id="doc.slug"
                  :to="`/artists/${doc.slug}`"
                  @mouseenter="hoveredSlug = doc.slug"
                  @mouseleave="hoveredSlug = null"
                >
                  {{ doc.name }}
                </NuxtLink>
              </li>
            </ul>
          </div>

          <!-- SEARCH MODE: flat list of matches, sorted by score -->
          <div
            v-else
            id="gallery-artist"
            class="w-full flex flex-wrap justify-start mx-[10px]"
          >
            <ul class="artist-list mb-[2rem] mt-0 flex flex-col w-full">
              <li
                v-for="doc in items"
                :key="doc.slug"
                class="h-8"
              >
                <NuxtLink
                  class="en-letter"
                  :id="doc.slug"
                  :to="`/artists/${doc.slug}`"
                  @mouseenter="hoveredSlug = doc.slug"
                  @mouseleave="hoveredSlug = null"
                >
                  {{ doc.name }}
                </NuxtLink>
              </li>
            </ul>
          </div>

<!-- Exhibited Artists "accordion" -->
<div class="w-full mt-6 border-t border-gray-200 pt-4">
  <div
    type="button"
    class="flex items-center gap-2 artist-head w-full text-left cursor-pointer"
    @click="showExhibited = !showExhibited"
  >
    <span
      class="inline-block transition-transform duration-200 text-sm"
      :class="showExhibited ? 'rotate-90' : ''"
    >
      ▶
    </span>
    <span>Exhibited Artists</span>
  </div>

  <transition name="accordion">
    <div
      v-if="showExhibited"
      id="collapseOne"
      class="mt-3"
    >
      <!-- SEARCH MODE: flat list of exhibited matches -->
      <div v-if="q">
        <ul class="artist-list mb-[2rem] mt-0 flex flex-col w-full">
          <li
            v-for="doc in exhibitedSearchItems"
            :key="doc.slug"
            class="h-8"
          >
            <NuxtLink
              class="en-letter"
              :id="`ex-${doc.slug}`"
              :to="`/artists/${doc.slug}`"
              @mouseenter="hoveredSlug = doc.slug"
              @mouseleave="hoveredSlug = null"
            >
              {{ doc.name }}
            </NuxtLink>
          </li>
        </ul>

        <p
          v-if="!exhibitedSearchItems.length"
          class="text-sm text-gray-500 italic"
        >
          No exhibited artists match your search.
        </p>
      </div>

      <!-- NO SEARCH: grouped by letter -->
      <div
        v-else-if="groupedExhibitedItems.length"
        id="exhibit-gallery"
        class="w-full flex flex-wrap justify-start mx-[10px]"
      >
        <ul
          v-for="group in groupedExhibitedItems"
          :key="group.letter"
          class="artist-list mb-[2rem] mt-0 flex flex-col"
          :class="'w-1/2'"
        >
          <li class="h-min mb-[10px]">
            <h1 class="artist-head p-0 m-0">
              {{ group.letter }}
            </h1>
          </li>

          <li
            v-for="doc in group.items"
            :key="doc.slug"
            class="h-8"
          >
            <NuxtLink
              class="en-letter"
              :id="`ex-${doc.slug}`"
              :to="`/artists/${doc.slug}`"
              @mouseenter="hoveredSlug = doc.slug"
              @mouseleave="hoveredSlug = null"
            >
              {{ doc.name }}
            </NuxtLink>
          </li>
        </ul>
      </div>

      <!-- NO EXHIBITED AT ALL -->
      <p
        v-else
        class="text-sm text-gray-500 italic"
      >
        No exhibited artists found.
      </p>
    </div>
  </transition>
</div>


          <!-- empty / status messages -->
          <p
            v-if="!pending && !items.length"
            class="mt-4 text-gray-500"
          >
            No artists found.
          </p>

          <div
            v-if="pending"
            class="fixed bottom-6 left-1/2 -translate-x-1/2 py-1 px-3 text-sm text-gray-900 bg-yellow-300/80 rounded shadow"
          >
            Refreshing…
          </div>
          <div
            v-else-if="error"
            class="fixed bottom-6 left-1/2 -translate-x-1/2 py-1 px-3 text-sm text-red-900 bg-red-300/80 rounded shadow"
          >
            Error loading. Showing cache.
          </div>
        </div>

<!-- RIGHT COLUMN: single preview on hover (desktop only) -->
<div class="hidden md:block w-full fixed right-16  md:w-1/4 mt-8 md:mt-0">
  <Transition name="preview-fade" mode="out-in">
    <!-- Image state -->
    <div
      v-if="previewArtist && previewArtist.image"
      :key="previewArtist.slug"
      id="preview-wrapper"
      class="artist-thumbnail flex items-center justify-center"
    >
      <img
        :src="previewArtist.image"
        :alt="previewArtist.name"
        class="w-full h-full object-cover"
      />
    </div>

    <!-- No-image fallback state -->
    <div
      v-else
      key="no-preview"
      id="preview-wrapper"
      class="artist-thumbnail flex items-center justify-center"
    >
      <div class="text-xs text-gray-400">
        <!-- No image -->
      </div>
    </div>
  </Transition>
</div>


      </div>
    </div>

  </main>
</template>

<style scoped>
/* base layout helpers that mimic the original structure, using Tailwind via --at-apply: */

.artist-list {
  --at-apply: list-none p-0;
}

.artist-list-result {
  --at-apply: list-none p-0 w-full sm:w-1/2;
}

.artist-head {
  --at-apply: tracking-wide text-[#595a5c]/90;
  font-weight: 100;
  font-size: 1.4rem;
  text-transform: uppercase;
}

.en-letter {
  --at-apply: tracking-wide no-underline uppercase text-[#595a5c]/90 hover:text-amber-500 transition-colors;
  font-weight: 100;
  font-size: 1rem;
  text-transform: uppercase;

}

/* thumbnail wrapper */
.artist-thumbnail {
  /* --at-apply: overflow-hidden rounded-lg shadow-sm bg-gray-50 aspect-square; */
}

.artist-thumbnail img {
  --at-apply: block w-full h-full object-cover;
}

/* simple accordion transition */
.accordion-enter-active,
.accordion-leave-active {
  --at-apply: transition-all duration-200;
}

.accordion-enter-from,
.accordion-leave-to {
  --at-apply: max-h-0 opacity-0;
}

.accordion-enter-to,
.accordion-leave-from {
  --at-apply: max-h-[800px] opacity-100;
}






#artist-search::placeholder { /* Chrome, Firefox, Opera, Safari 10.1+ */
  font-family: 'dosis';
  opacity: 1; /* Firefox */
  font-size: 1.2rem;
}

#artist-search:-ms-input-placeholder { /* Internet Explorer 10-11 */
  font-family: 'dosis';
  font-size: 1.2rem;
}

#artist-search::-ms-input-placeholder { /* Microsoft Edge */
  font-family: 'dosis';
  font-size: 1.2rem;
}

.font-dosis{
      font-family: 'Dosis', sans-serif !important;
}


.preview-fade-enter-active,
.preview-fade-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.preview-fade-enter-from,
.preview-fade-leave-to {
  opacity: 0;
  transform: scale(0.98);
}

.preview-fade-enter-to,
.preview-fade-leave-from {
  opacity: 1;
  transform: scale(1);
}

</style>
