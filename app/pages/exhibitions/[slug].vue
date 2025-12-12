<script setup lang="ts">
import { useLocalCache } from '~/composables/useLocalCache'
import { useMultiLingual } from '~/composables/useMultiLingual'
import {
  getJalaliParts,
  getGregorianParts,
} from '~/utils/date'

interface MediaItem {
  id: string
  role: string
  media: { url: string; alt?: string | null; caption?: string | null }
}

interface Exhibition {
  media?: MediaItem[]
}

const LBL = '[exhibitions/[slug]]'
const log = (...a: any[]) => console.log(LBL, ...a)

const route = useRoute()
const { locale } = useI18n()
const { t } = useMultiLingual()

const slug = computed(() => String(route.params.slug))
const key = computed(() => `exhibition:${locale.value}-${slug.value}`)

const { data: exhibition, pending, error } = useLocalCache<Exhibition>(
  () => key.value,
  () =>
    $fetch(`/_q/exhibitions/${encodeURIComponent(slug.value)}`, {
      query: { locale: locale.value },
    }),
  { ttlMs: 60_000, swr: true, initial: {} as Exhibition },
)

const showLightbox = ref(false)
const lightboxIndex = ref(0)

function openLightbox(i: number) {
  lightboxIndex.value = i
  showLightbox.value = true
}

const loc = computed(() => (exhibition.value as any)?.locales?.[0] ?? null)

const installationSlides = computed(
  () => exhibition.value?.media?.filter(m => m.role === 'INSTALLATION') ?? [],
)

const selectedWorks = computed(
  () =>
    exhibition.value?.media?.filter(
      m => m.role === 'WORK' || m.role === 'SELECTED_WORK',
    ) ?? [],
)

const artist = computed(() => {
  return (
    (loc.value as any)?.artist ||
    (exhibition.value as any)?.artist ||
    null
  )
})

const dateRange = computed(() => {
  const start =
    (loc.value as any)?.dates?.range?.start ||
    (exhibition.value as any)?.dates?.range?.start

  const end =
    (loc.value as any)?.dates?.range?.end ||
    (exhibition.value as any)?.dates?.range?.end

  if (!start && !end) return null

  const s = start || end
  const e = end || start

  // Persian (Jalali)
  if (locale.value === 'FA') {
    const sP = getJalaliParts(s)
    const eP = getJalaliParts(e)

    if (!sP || !eP) return null

    // Same month/year assumed (as per requirement)
    return `${sP.day} - ${eP.day} ${eP.month} ${eP.year}`
  }

  // Gregorian
  const sP = getGregorianParts(s, locale.value)
  const eP = getGregorianParts(e, locale.value)

  if (!sP || !eP) return null

  return `${sP.month} ${sP.day} - ${eP.day} ${eP.year}`
})
</script>



<template>
  <div class="px-0 relative z-0 mt-[56px]">
    <div class="pt-5 mt-4 og-container ">
    <!-- Fixed Exhibition Header -->
    
    <!-- border-b border-b-0.5 border-black/20 z-10 border-b-solid -->
    <div
      id="exhibition-header"
      class=" top-[60px] left-0 right-0 bg-white"
    >
      <div
        class="max-w-screen-lg mx-auto flex flex-col md:flex-row items-start md:items-center justify-between px-4 sm:px-4 pb-1"
      >
        <div
          class="flex flex-col sm:flex-row justify-between items-start sm:items-center w-full"
        >
      <div class="flex flex-col gap-0">
        <div
          class="mt-0 mb-[0.5rem] font-light text-2xl md:text-3xl   text-[#595a5c] text-nowrap"
        >
          {{ loc?.title || 'Exhibition' }}
        </div>

        <NuxtLink
          v-if="artist"
          :to="`/artists/${artist.slug}`"
          class="mt-0 mb-4 text-xl md:text-2xl no-underline text-black/60 hover:text-yellow-500 transition"
        >
          {{ artist.name }}
        </NuxtLink>

        <div
          v-if="dateRange"
          class="text-md md:text-lg text-black/60 tracking-tight"
        >
          {{ dateRange }}
        </div>
      </div>

          <!-- <nav
            class="border-t border-t-0 border-black/20 border-t-solid flex flex-wrap flex-row sm:w-max self-end -mt-2 pt-2 gap-2 text-sm md:text-md md:text-base uppercase"
          >
            <a
              href="#bio"
              class="no-underline tracking-tight text-black/60 hover:text-yellow-500 transition"
            >
              {{ t('exhibitions.detail.tabs.bio') }}
            </a>
            <span class="text-black/20 inline">|</span>
            <a
              href="#works"
              class="no-underline tracking-tight text-black/60 hover:text-yellow-500 transition"
            >
              {{ t('exhibitions.detail.tabs.selectedWorks') }}
            </a>
            <span class="text-black/20 inline">|</span>
            <a
              href="#installation"
              class="no-underline tracking-tight text-black/60 hover:text-yellow-500 transition"
            >
              {{ t('exhibitions.detail.tabs.installationViews') }}
            </a>
          </nav> -->
        </div>
      </div>
    </div>

    <!-- Push content below fixed header -->
    <div class=" max-w-screen-lg mx-auto px-4 z-0">
      <article v-if="exhibition">
        <!-- TEXT + PDF -->
        <div id="bio" class="flex items-center justify-between">
          <div
            class="text-[23px] !font-thin uppercase tracking-tight text-gray-800/70  text-uppercase mt-10 mb-7"
          >
            {{ t('exhibitions.detail.bioHeading') }}
          </div>

          <a
            v-if="exhibition.media?.find(m => m.role === 'CV')"
            :href="exhibition.media.find(m => m.role === 'CV')?.media.url"
            target="_blank"
            rel="noopener"
            class="no-underline text-md uppercase underline text-gray-600 hover:text-yellow-500 transition mr-0"
          >
            {{ t('exhibitions.detail.cvLink') }}
          </a>
        </div>

        <!-- Text Content -->
        <div
          v-if="loc?.bodyHtml"
          class="prose prose-sm sm:prose mt-0 mb-4 lg:prose-lg prose-p:mt-4 prose-p:mb-0 prose-p:second:mt-0 max-w-none text-base text-gray-700/85 leading-relaxed"
          v-html="loc.bodyHtml"
        />
        <p v-else class="opacity-70">
          {{ t('exhibitions.detail.bioFallback') }}
        </p>

        <!-- Selected Works -->
        <section
          id="works"
          v-if="selectedWorks.length"
          class="mt-12 scroll-mt-20"
        >
          <h2
            class="text-2xl !font-light text-gray-700/90 mb-4 uppercase tracking-tight"
          >
            {{ t('exhibitions.detail.tabs.selectedWorks') }}
          </h2>

          <div
            class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
          >
            <div
              v-for="(m, i) in selectedWorks"
              :key="m.media.url"
              @click="openLightbox(i)"
              class="cursor-pointer"
            >
              <img
                :src="m.media.url"
                class="w-full aspect-square object-cover hover:scale-95 hover:opacity-80 transition-transform"
                :alt="m.media.alt || ''"
                loading="lazy"
                decoding="async"
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

        <!-- Installation Views -->
        <section
          id="installation"
          v-if="installationSlides.length"
          class="mt-12"
        >
          <h2
            class="text-2xl font-light text-gray-700/90 mb-4 uppercase tracking-tight"
          >
            {{ t('exhibitions.detail.tabs.installationViews') }}
          </h2>

          <EmblaCarousel :slides="installationSlides" />
        </section>
      </article>

      <p v-else class="opacity-70">
        {{ t('exhibitions.detail.notFound') }}
      </p>

      <footer class="mt-8">
        
<!--         
        <NuxtLink
          to="/exhibitions"
          class="text-sm underline hover:text-yellow-500 transition no-underline"
        >
         {{ t('exhibitions.detail.backToList') }}
        </NuxtLink> -->
        
      </footer>
    </div>

    <!-- <div
      v-if="pending"
      class="fixed z-20 bottom-6 py-0 text-black/70 bg-yellow-500/60 px-2"
    >
      {{ t('exhibitions.detail.loading') }}
    </div>

    <div
      v-else-if="error"
      class="fixed z-20 bottom-6 py-0 text-red-800/80 bg-red-500/60 px-2"
    >
      {{ t('exhibitions.detail.error') }}
    </div> -->
    </div>
  </div>
</template>

<style scoped>
#bio,
#works,
#installation {
  scroll-margin-top: 160px;
}

@media (max-width: 767px) {
  #bio,
  #works,
  #installation {
    scroll-margin-top: 160px;
  }
}
:deep(.prose p:nth-of-type(2)) {
  margin-inline: -5px;
}

</style>
