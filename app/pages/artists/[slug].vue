<script setup lang="ts">
import { useLocalCache } from '~/composables/useLocalCache'
import GalleryLightbox from '~/components/GalleryLightBox.vue'


const LBL = '[artists/[slug]]'
const log  = (...a:any[]) => console.log(LBL, ...a)

const route = useRoute()
const { locale } = useI18n()
const slug = computed(() => String(route.params.slug))
const key  = computed(() => `artist-${locale.value}-${slug.value}`)

const { data: artist, pending, error } = useLocalCache(
  () => key.value,
  () => $fetch(`/_q/artists/${encodeURIComponent(slug.value)}`, {
    query: { locale: locale.value },
  }),
  { ttlMs: 60_000, swr: true },
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

const selectedWorks = computed(() =>
  artist.value?.media?.filter((m: any) => m.role === 'SELECTED_WORK') ?? []
)

</script>

<template>
  <section class="px-8">
    <!-- Fixed Artist Header -->
    <div
      id="artist-header"
      class="fixed top-[60px] left-0 right-0 bg-white border-b border-gray-200 z-50"
    >
      <div
        class="max-w-screen-md mx-auto flex flex-col md:flex-row items-start md:items-center justify-between px-6 py-3"
      >
        <div class="flex justify-between items-center w-full">
          <h1 class="text-xl md:text-2xl uppercase !font-light text-gray-700/80">
            {{ loc?.title || 'Artist' }}
          </h1>
          <nav class="flex flex-wrap gap-2 text-sm md:text-base uppercase">
            <a href="#bio" class="no-underline tracking-tight text-gray-700 hover:text-yellow-500 transition">Biography</a>
            <span class="hidden md:inline">|</span>
            <a href="#works" class="no-underline tracking-tight text-gray-700 hover:text-yellow-500 transition">Selected Works</a>
            <span class="hidden md:inline">|</span>
            <a href="#installation" class="no-underline tracking-tight text-gray-700 hover:text-yellow-500 transition">Installation Views</a>
          </nav>
        </div>
      </div>
    </div>

    <!-- Push content below fixed header -->
    <div class="pt-20  max-w-screen-md mx-auto px-8">

      <div v-if="pending" class="w-max py-0 mt-4 text-white bg-gray-500/30 px-2 ">Loading…</div>
      <div v-else-if="error" class="text-red-600">Error loading artist.</div>

      <article v-else-if="artist">
        <!-- BIO + CV -->
        <div id="bio" class="flex items-center justify-between mb-4">
          <div class="text-[23px] !font-thin uppercase tracking-tight text-gray-800/80">Bio</div>
          <a
            v-if="artist.media?.find(m => m.role === 'CV')"
            :href="artist.media.find(m => m.role === 'CV')?.media.url"
            target="_blank"
            rel="noopener"
            class="no-underline text-md uppercase underline text-gray-600 hover:text-yellow-500 transition"
          >
            Download CV
          </a>
        </div>

        <!-- Bio Content -->
        <div
          v-if="loc?.bodyHtml"
          class="prose prose-sm sm:prose my-12 lg:prose-lg max-w-none text-md text-gray-700/85 leading-relaxed"
          v-html="loc.bodyHtml"
        />
        <p v-else class="opacity-70">Biography coming soon.</p>

    <!-- Selected Works -->
    <section id="works" v-if="selectedWorks" class="mt-12 scroll-mt-20">
        <h2 class="text-2xl !font-light text-gray-700/90 mb-4 uppercase tracking-tight">Selected Works</h2>
        <div class="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <div
            v-for="(m, i) in selectedWorks"
            :key="m.media.url"
            @click="openLightbox(i)"
            class="cursor-pointer"
        >
            <NuxtImg
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
          <h2 class="text-2xl font-light text-gray-700/90 mb-4 uppercase tracking-tight">Installation Views</h2>

          <EmblaCarousel :slides="installationSlides" />
        </section>
      </article>

      <p v-else class="opacity-70">Artist not found.</p>

      <footer class="mt-8">
        <NuxtLink to="/artists" class="text-sm underline hover:text-yellow-500 transition">← All artists</NuxtLink>
      </footer>
    </div>
  </section>
</template>

<style scoped>
#bio, #works, #installation {
  scroll-margin-top: 160px; /* your header height + a bit of padding */
}
</style>