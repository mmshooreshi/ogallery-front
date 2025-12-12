<!-- app/pages/news/[slug].vue -->
<script setup lang="ts">
import { useLocalCache } from '~/composables/useLocalCache'
import { useMultiLingual } from '~/composables/useMultiLingual'
import { getJalaliParts, getGregorianParts } from '~/utils/date'

interface MediaItem {
  id: string
  role: string
  media: {
    url: string
    alt?: string | null
    caption?: string | null
    meta?: any
  }
}

interface NewsItem {
  media?: MediaItem[]
  locales?: any[]
  dates?: any
  artist?: { name: string; slug: string | null }
}

const route = useRoute()
const { locale } = useI18n()
const { t } = useMultiLingual()

const slug = computed(() => String(route.params.slug))
const key = computed(() => `news:item:${locale.value}:${slug.value}`)

const { data: newsItem, pending, error } = useLocalCache<NewsItem>(
  () => key.value,
  () =>
    $fetch(`/_q/news/${encodeURIComponent(slug.value)}`, {
      query: { locale: locale.value },
    }),
  { ttlMs: 60_000, swr: true, initial: {} as NewsItem }
)

/* -----------------------------
 * Lightbox
 * ----------------------------- */
const showLightbox = ref(false)
const lightboxIndex = ref(0)

function openLightbox(i: number) {
  lightboxIndex.value = i
  showLightbox.value = true
}

/* -----------------------------
 * Localized content
 * ----------------------------- */
const loc = computed(() => newsItem.value?.locales?.[0] ?? null)

const installationSlides = computed(
  () => newsItem.value?.media?.filter(m => m.role === 'INSTALLATION') ?? []
)

const selectedWorks = computed(
  () =>
    newsItem.value?.media?.filter(
      m => m.role === 'WORK' || m.role === 'SELECTED_WORK'
    ) ?? []
)

const artist = computed(
  () => loc.value?.artist || newsItem.value?.artist || null
)

/* -----------------------------
 * Date range
 * ----------------------------- */
const dateRange = computed(() => {
  const start =
    loc.value?.dates?.range?.start ??
    newsItem.value?.dates?.range?.start

  const end =
    loc.value?.dates?.range?.end ??
    newsItem.value?.dates?.range?.end

  if (!start && !end) return null

  const s = start || end
  const e = end || start

  if (locale.value === 'FA') {
    const sp = getJalaliParts(s)
    const ep = getJalaliParts(e)
    if (!sp || !ep) return null
    return `${sp.day} - ${ep.day} ${ep.month} ${ep.year}`
  }

  const sp = getGregorianParts(s, locale.value)
  const ep = getGregorianParts(e, locale.value)
  if (!sp || !ep) return null
  return `${sp.month} ${sp.day} - ${ep.day} ${ep.year}`
})
</script>

<template>
  <div class="relative mt-[56px]">
    <div class="max-w-screen-lg mx-auto px-4 pt-8">

      <!-- HEADER -->
      <header class="mb-10">
        <h1 class="text-2xl md:text-3xl font-light text-[#595a5c]">
          {{ loc?.title || 'News' }}
        </h1>

        <NuxtLink
          v-if="artist"
          :to="`/artists/${artist.slug}`"
          class="block mt-2 text-xl text-black/60 hover:text-yellow-500 transition no-underline"
        >
          {{ artist.name }}
        </NuxtLink>

        <div v-if="dateRange" class="mt-2 text-lg text-black/60">
          {{ dateRange }}
        </div>
      </header>

      <!-- BODY -->
      <article v-if="newsItem">
        <!-- TEXT -->
        <section id="bio">
          <div
            v-if="loc?.bodyHtml"
            class="prose prose-lg max-w-none text-gray-700/85"
            v-html="loc.bodyHtml"
          />
        </section>

        <!-- SELECTED WORKS -->
        <section v-if="selectedWorks.length" id="works" class="mt-14">
          <h2 class="text-2xl font-light uppercase mb-4">
            {{ t('news.detail.tabs.selectedWorks') }}
          </h2>

          <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div
              v-for="(m, i) in selectedWorks"
              :key="m.media.url"
              class="cursor-pointer"
              @click="openLightbox(i)"
            >
              <NuxtImg
                :src="m.media.url"
                width="400"
                height="400"
                class="w-full aspect-square object-cover transition hover:opacity-80"
                :alt="m.media.alt || ''"
                loading="eager"
                decoding="async"
                fetchpriority="high"
                preload
              />
            </div>
          </div>

          <GalleryLightBox
            v-if="showLightbox"
            :slides="selectedWorks"
            :start-index="lightboxIndex"
            @close="showLightbox = false"
          />
        </section>

        <!-- INSTALLATION -->
        <section
          v-if="installationSlides.length"
          id="installation"
          class="mt-14"
        >
          <h2 class="text-2xl font-light uppercase mb-4">
            {{ t('news.detail.tabs.installationViews') }}
          </h2>

          <EmblaCarousel :slides="installationSlides" />
        </section>
      </article>

      <div v-else class="opacity-60">
        {{ t('news.detail.notFound') }}
      </div>
    </div>
  </div>
</template>

<style scoped>
#bio,
#works,
#installation {
  scroll-margin-top: 160px;
}
</style>
