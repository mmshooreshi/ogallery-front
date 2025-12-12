<!-- app/pages/news/index.vue -->
<script setup lang="ts">
import { computed } from 'vue'
import { useLocalCache } from '~/composables/useLocalCache'
import {
  getJalaliParts,
  getGregorianParts,
} from '~/utils/date'

type NewsTab = {
  key: string
  label: string
  count: number
}

type NewsFilters = {
  tag: string
  year: number | null
  month: number | null
}

type NewsItem = {
  id: number
  slug: string
  title: string
  summary: string
  artistName: string
  artistSlug: string | null
  dateString: string | null
  startDate: string | null
  endDate: string | null
  thumb: string | null
  year: number | null
}

type NewsListResponse = {
  tabs: NewsTab[]
  filters: NewsFilters
  items: NewsItem[]
}

const { locale } = useI18n()
const route = useRoute()

const selectedTag = computed(() => {
  const t = (route.query.tag ?? 'all') as string
  return t.trim() || 'all'
})

// const key = computed(() => `news:list:${locale.value}:${selectedTag.value}`)
const key = computed(() =>
  `news:list:${locale.value}:tag=${selectedTag.value || 'all'}`
)

const { data: payload, pending, error } = useLocalCache<NewsListResponse>(
  () => key.value,
  () =>
    $fetch<NewsListResponse>('/_q/news', {
      query: {
        locale: locale.value,
        tag: selectedTag.value,
        // year/month intentionally NOT used in UI anymore;
        // keep server defaults by not sending them.
      },
    }),
  {
    ttlMs: 60_000,
    swr: true,
    initial: { tabs: [{ key: 'all', label: 'All', count: 0 }], filters: { tag: 'all', year: null, month: null }, items: [] },
  }
)

const tabs = computed(() => payload.value?.tabs ?? [])
const items = computed(() => payload.value?.items ?? [])
const activeTag = computed(() => selectedTag.value ?? payload.value?.filters?.tag)

function artistHref(artistSlug: string | null) {
  return artistSlug ? `/artists/${artistSlug}` : ''
}

function normalizeThumb(src: string | null) {
  if (!src) return null
  // If backend sometimes returns ".../path", keep it as-is;
  // If you have a known base URL, replace this with a proper join.
  return src
}

useSeoMeta({ title: 'News' })

function formatNewsDate(n: NewsItem): string {
  const raw =
    n.dateString ||
    n.startDate ||
    n.endDate ||
    null

  if (!raw) return ''

  const parts =
    locale.value === 'FA'
      ? getJalaliParts(raw)
      : getGregorianParts(raw, "EN")

  if (!parts?.month || !parts?.day || !parts?.year) return ''

  return `${parts.month} ${parts.day}, ${parts.year}`
}

watch(
  () => tabs.value,
  (tabs) => {
    if (!tabs?.length) return
    for (const t of tabs) {
      useFetch('/_q/news', {
        key: `news:list:${locale.value}:tag=${t.key}`,
        query: { locale: locale.value, tag: t.key },
        immediate: true,
      })
    }
  },
  { once: true }
)


</script>

<template>
<main class="pb-10" style="min-height: 85vh;">
  <!-- Fixed Tabs (Tags) -->
  <div class="fixed py-[20px] left-0 right-0 z-1 bg-white/90 backdrop-blur border-b top-[56px]">
    <div class="flex justify-center flex-wrap text-md uppercase py-0">
      <template v-for="(t, i) in tabs" :key="t.key">
        <NuxtLink
          class="mx-[6px] no-underline tracking-wide transition"
          :class="t.key === activeTag
            ? 'text-[#ffde00] font-semibold'
            : 'text-[#595a5c] hover:text-[#ffde00]'"
          :to="{ path: '/news', query: { tag: t.key } }"
        >
          {{ t.label }}
          <!-- <span class="text-black/30 ml-1">({{ t.count }})</span> -->
        </NuxtLink>

        <span
          v-if="i < tabs.length - 1"
          class="text-black/30 mx-[6px]"
        >
          |
        </span>
      </template>
    </div>
  </div>

  <!-- Spacer for fixed bar -->
  <!-- <div class="h-[110px]" /> -->

  <!-- Title -->
  <!-- <h1
    class="text-center text-[24px] uppercase tracking-wide text-[#595a5c]/95"
    style="margin: 1rem 0 3rem 0;"
  >
    News
  </h1> -->

  <!-- States -->
  <div v-if="pending" class="text-center text-sm text-black/50 py-20">
    Loading…
  </div>

  <div v-else-if="error" class="text-center text-sm text-red-600 py-20">
    Could not load news.
  </div>

  <div v-else>
    <div
      v-if="items.length === 0"
      class="text-center text-sm text-black/50 py-20"
    >
      No items found.
    </div>
  <!-- <KeepAlive> -->
    <section class="cont px-4 max-w-screen-xl mx-auto">
      <article
        v-for="n in items"
        :key="n.id"
        class="flex flex-col lg:flex-row gap-6 border-b border-black/10 pt[1.75rem] mt-12"
      >
        <!-- Image -->
        <NuxtLink
          class="block no-underline shrink-0  w-[200px]"
          :to="`/news/${n.slug}`"
        >
          <!-- <img
            v-if="normalizeThumb(n.thumb)"
            :src="normalizeThumb(n.thumb) ?? ''"
            class="w-[200px] h-[200px] object-cover"
            loading="lazy"
            decoding="async"
            :alt="n.title"
          /> -->

          <img
            v-if="normalizeThumb(n.thumb)"
            :src="normalizeThumb(n.thumb) || ''"
            width="200"
            height="200"
            class="w-[200px] h-[200px] object-cover"
            :alt="n.title"
            loading="eager"
            decoding="async"
            fetchpriority="high"
            preload
          />

          <div
            v-else
            class="w-full h-[260px] bg-gray-100"
          />
        </NuxtLink>

        <!-- Body -->
        <div class="flex flex-col justify-center">
          <h3 class="text-[22px]  tracking-wide text-gray-800 mt-0 pt-0">
            <NuxtLink
              class="no-underline text-black/70 hover:text-[#ffde00] transition"
              :to="`/news/${n.slug}`"
            >
              {{ n.title }}
              <br/>
          <div class="mt-0 text-sm text-gray-600/80">{{ n.dateString || formatNewsDate(n) }}</div>

            </NuxtLink>
          </h3>



          <div v-if="n.artistName" class="mt-3">
            <NuxtLink
              v-if="artistHref(n.artistSlug)"
              class="no-underline uppercase tracking-wide text-sm text-gray-700/90 hover:text-[#ffde00] transition"
              :to="artistHref(n.artistSlug)"
            >
              {{ n.artistName }}
            </NuxtLink>
            <div
              v-else
              class="uppercase tracking-wide text-sm text-gray-700/70"
            >
              {{ n.artistName }}
            </div>
          </div>
         <div class="news-summary">
  {{ n.summary }}
</div>

          <div class="mt-6">
            <NuxtLink
              class="inline-block no-underline font-light tracking-wide text-sm text-[#595a5c]/60 hover:text-[#595a5c] transition"
              :to="`/news/${n.slug}`"
            >
              Read More
            </NuxtLink>
          </div>
        </div>
      </article>
    </section>
    <!-- </KeepAlive> -->
  </div>
</main>

</template>

<style scoped>
.col-lg-9 {
  flex: 0 0 auto;
  width: 75%;
}

.col-lg-3 {
  flex: 0 0 auto;
  width: 25%;
}

.publication {
  padding-top: 1.75rem;
  padding-bottom: 3.5rem;
  min-height: 250px;
}

.cont{
  padding: 60px;
    margin-top: 4rem;
}
.news-summary {
  font-size: 1.125rem; /* text-lg */
  color: rgba(0, 0, 0, 0.6);
  letter-spacing: -0.01em;
  line-height: 26px;

  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 5;

  overflow: hidden;
  text-overflow: ellipsis;
}

</style>