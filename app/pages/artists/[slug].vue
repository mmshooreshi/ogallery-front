<!-- app/pages/artists/[slug].vue -->
<script setup lang="ts">
import { useLocalCache } from '~/composables/useLocalCache'
import {useMultiLingual} from '~/composables/useMultiLingual'

interface MediaItem {
  id: string;
  role: string;
  media: { url: string; alt?: string | null; caption?: string | null };
  meta?: {
    captionEn?: string | null;
    captionFa?: string | null;
  };
}

interface Artist {
    media?: MediaItem[];
}

const LBL = '[artists/[slug]]'
const log  = (...a:any[]) => console.log(LBL, ...a)

const route = useRoute()
const { locale } = useI18n()
const {t} = useMultiLingual()

const slug = computed(() => String(route.params.slug))
const key  = computed(() => `artist:${locale.value}-${slug.value}`)

const { data: artist, pending, error } = useLocalCache<Artist>(
  () => key.value,
  () => $fetch<any>(`/_q/artists/${encodeURIComponent(slug.value)}`, {
    query: { locale: locale.value },
  }),
  { ttlMs: 60_000, swr: true, initial: {} as Artist },
)

const showLightbox = ref(false)
const lightboxIndex = ref(0)

function openLightbox(i: number) {
  lightboxIndex.value = i
  showLightbox.value = true
}

const loc = computed(() => (artist.value as any)?.locales?.[0] ?? null)
const installationSlides = computed(
  () => artist.value?.media?.filter((m: any) => m.role === 'INSTALLATION') ?? [],
)

const selectedWorks = computed(() => {
  const isFa = locale.value === 'FA'

  return (
    artist.value?.media
      ?.filter((m: any) => m.role === 'SELECTED_WORK')
      .map((m: any) => {
        const meta = m.meta || {}

        const captionEn =
          meta.captionEn ??
          m.media.caption ??
          null

        const captionFa =
          meta.captionFa ??
          captionEn

        const caption = isFa ? captionFa : captionEn

        return {
          ...m,
          media: {
            ...m.media,
            caption,
          },
        }
      }) ?? []
  )
})

</script>

<template>
  <section class="px-0 relative z-0">
    <!-- Fixed Artist Header -->
    <div
      id="artist-header"
      class="fixed top-[60px] left-0 right-0 bg-white border-b border-b-0.5 border-black/20 z-10 border-b-solid "
    >
      <div
        class="max-w-screen-lg mx-auto flex flex-col md:flex-row items-start md:items-center justify-between px-4 sm:px-4 pb-1"
      >
        <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center w-full">
          <h1 class="text-xl md:text-2xl uppercase !font-light text-gray-700/80 text-nowrap">
            {{ loc?.title || 'Artist' }}
          </h1>
          <nav class="border-t border-t-0 border-black/20 border-t-solid flex flex-wrap flex-row  sm:w-max self-end -mt-2  pt-2  gap-2 text-sm md:text-md md:text-base uppercase">
            <a href="#bio" class="no-underline tracking-tight text-black/60 hover:text-yellow-500 transition">{{ t('artists.detail.tabs.bio') }}</a>
            <span class=" text-black/20 inline">|</span>
            <a href="#works" class="no-underline tracking-tight text-black/60 hover:text-yellow-500 transition">{{ t('artists.detail.tabs.selectedWorks') }}</a>
            <span class=" text-black/20 inline">|</span>
            <a href="#installation" class="no-underline tracking-tight text-black/60 hover:text-yellow-500 transition">{{ t('artists.detail.tabs.installationViews') }}</a>
          </nav>
        </div>
      </div>
    
    </div>

    <!-- Push content below fixed header -->
    <div class="pt-24 md:pt-20  max-w-screen-lg mx-auto px-4 z-0">


      <article v-if="artist">
        <!-- BIO + CV -->
        <div id="bio" class="flex items-center justify-between">
          <div class="text-[23px] !font-thin uppercase tracking-tight text-gray-800/80">{{ t('artists.detail.bioHeading') }}</div>
          <a
            v-if="artist.media?.find(m => m.role === 'CV')"
            :href="artist.media.find(m => m.role === 'CV')?.media.url"
            target="_blank"
            rel="noopener"
            class="no-underline text-md uppercase underline text-gray-600 hover:text-yellow-500 transition mr-0"
          >
            {{ t('artists.detail.cvLink') }}
          </a>
        </div>

        <!-- Bio Content -->
        <div
          v-if="loc?.bodyHtml"
          class="prose prose-sm sm:prose my-4 lg:prose-lg max-w-none text-base text-gray-700/85 leading-relaxed"
          v-html="loc.bodyHtml"
        />
        <p v-else class="opacity-70"> {{ t('artists.detail.bioFallback') }}</p>

    <!-- Selected Works -->
    <section id="works" v-if="selectedWorks" class="mt-12 scroll-mt-20 ">
        <h2 class="text-2xl !font-light text-gray-700/90 mb-4 uppercase tracking-tight">{{ t('artists.detail.tabs.selectedWorks') }}</h2>
        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
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
        <section id="installation" v-if="installationSlides.length" class="mt-12">
          <h2 class="text-2xl font-light text-gray-700/90 mb-4 uppercase tracking-tight">{{ t('artists.detail.tabs.installationViews') }}</h2>

          <EmblaCarousel :slides="installationSlides" />
        </section>
      </article>

      <p v-else class="opacity-70">{{ t('artists.detail.tabs.notFound') }}</p>

      <footer class="mt-8">
        <!-- <NuxtLink to="/artists" class="text-sm underline hover:text-yellow-500 transition no-underline">← {{ t('artists.detail.backToList') }}</NuxtLink> -->
      </footer>
    </div>
          <!-- <div v-if="pending" class="fixed z-20 bottom-6 py-0 text-black/70 bg-yellow-500/60 px-2 ">{{ t('artists.detail.loading') }}</div>
      <div v-else-if="error" class="fixed z-20 bottom-6 py-0 text-red-800/80 bg-red-500/60 px-2 ">{{ t('artists.detail.error') }}</div> -->

  </section>
</template>

<style scoped>
/* Default style for larger screens */
#bio, #works, #installation {
  scroll-margin-top: 160px; /* your header height + a bit of padding */
}

/* Style for mobile devices */
@media (max-width: 767px) {
  #bio, #works, #installation {
    scroll-margin-top: 160px;
  }
}

</style>