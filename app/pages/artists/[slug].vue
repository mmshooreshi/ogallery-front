<script setup lang="ts">
import { ref, onMounted } from 'vue'
import emblaCarouselVue from 'embla-carousel-vue'
import Autoplay from 'embla-carousel-autoplay'

const route = useRoute()
const locale = useState<'EN' | 'FA'>('locale')

const key = computed(() => `artist-${locale.value}-${route.params.slug}`)

const { data: artist, pending, error } = await useFetch(
  () => `/api/artists/${route.params.slug}`,
  {
    key,
    query: () => ({ locale: locale.value }),
    watch: [() => route.params.slug, locale],
    default: () => null,
  }
)

const loc = computed(() => artist.value?.locales?.[0] ?? null)

// Embla setup with autoplay
const [emblaRef, emblaApi] = emblaCarouselVue(
  { loop: true },
  [Autoplay({ delay: 4000, stopOnInteraction: false })]
)

const selectedIndex = ref(0)
const totalSlides = ref(0)

onMounted(() => {
  if (emblaApi.value) {
    totalSlides.value = emblaApi.value.slideNodes().length
    emblaApi.value.on('select', () => {
      selectedIndex.value = emblaApi.value?.selectedScrollSnap() || 0
    })
  }
})

useSeoMeta({
  title: () => loc.value?.title ?? 'Artist',
  description: () => (loc.value?.summary || '').slice(0, 160),
})
</script>

<template>
  <section>
    <!-- Fixed Artist Header -->
    <div
      id="artist-header"
      class="fixed top-[60px] left-0 right-0 bg-white border-b border-gray-200 z-50"
    >
      <div
        class="max-w-screen-md mx-auto flex flex-col md:flex-row items-start md:items-center justify-between px-6 py-3"
      >
        <div class="flex justify-between items-center w-full">
          <h1 class="text-xl md:text-2xl uppercase !font-light text-gray-700">
            {{ loc?.title || 'Artist' }}
          </h1>
          <nav class="flex flex-wrap gap-2 text-sm md:text-base uppercase">
            <a
              href="#bio"
              class="tracking-tight text-gray-700 hover:text-yellow-600 transition"
              >Biography</a
            >
            <span class="hidden md:inline">|</span>
            <a
              href="#works"
              class="tracking-tight text-gray-700 hover:text-yellow-600 transition"
              >Selected Works</a
            >
            <span class="hidden md:inline">|</span>
            <a
              href="#installation"
              class="tracking-tight text-gray-700 hover:text-yellow-600 transition"
              >Installation Views</a
            >
          </nav>
        </div>
      </div>
    </div>

    <!-- Push content below fixed header -->
    <div class="pt-20 max-w-screen-md mx-auto px-4">
      <div v-if="pending" class="opacity-70">Loading…</div>
      <div v-else-if="error" class="text-red-600">Error loading artist.</div>

      <article v-else-if="artist">
        <!-- Artist Intro -->
        <header id="bio" class="mb-6 flex items-center gap-4">
          <NuxtImg
            v-if="artist.media?.find(m => m.role === 'HERO')"
            :src="artist.media.find(m => m.role === 'HERO')?.media.url"
            width="120"
            height="120"
            class="rounded-full object-cover"
            :alt="loc?.title || ''"
          />
        </header>

        <!-- BIO + CV -->
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-2xl !font-light uppercase tracking-tight text-gray-700">
            Bio
          </h2>
          <a
            v-if="artist.media?.find(m => m.role === 'CV')"
            :href="artist.media.find(m => m.role === 'CV')?.media.url"
            target="_blank"
            rel="noopener"
            class="text-sm uppercase underline text-gray-600 hover:text-yellow-600 transition"
          >
            Download CV
          </a>
        </div>

        <!-- Bio Content -->
        <div
          v-if="loc?.bodyHtml"
          class="prose prose-sm sm:prose lg:prose-lg max-w-none leading-relaxed"
          v-html="loc.bodyHtml"
        />
        <p v-else class="opacity-70">Biography coming soon.</p>

        <!-- Selected Works -->
        <section
          id="works"
          v-if="artist.media?.some(m => m.role === 'SELECTED_WORK')"
          class="mt-12"
        >
          <h2
            class="text-2xl !font-light text-gray-600 mb-4 uppercase tracking-tight"
          >
            Selected Works
          </h2>
          <div class="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div
              v-for="m in artist.media.filter(m => m.role === 'SELECTED_WORK')"
              :key="m.id"
            >
              <NuxtImg
                :src="m.media.url"
                class="w-full aspect-square object-cover hover:scale-95 hover:opacity-80 transition-transform cursor-pointer "
                :alt="m.media.alt || ''"
              />
            </div>
          </div>
        </section>

<!-- Installation Views -->
<section
  id="installation"
  v-if="artist?.media?.some(m => m.role === 'INSTALLATION')"
  class="mt-12"
>
  <h2 class="text-2xl font-light text-gray-700 mb-4 uppercase tracking-tight">
    Installation Views
  </h2>

  <div class="embla relative" ref="emblaRef">
    <!-- Slides -->
    <div class="embla__container">
      <div
        v-for="m in artist.media.filter(m => m.role === 'INSTALLATION')"
        :key="m.id"
        class="embla__slide flex justify-center"
      >
        <NuxtImg
          :src="m.media.url"
          :alt="m.media.alt || ''"
          class="w-auto h-full object-contain "
        />
      </div>
    </div>

    <!-- Fixed overlay indicators -->
    <div
      class="z-100 bottom-4 sticky left-0 right-0 flex justify-center gap-2 px-4"
    >
      <div
        v-for="(s, i) in totalSlides"
        :key="i"
        class="h-0.5 flex-1 rounded transition-colors"
        :class="i === selectedIndex ? 'bg-yellow-500' : 'bg-gray-300'"
      ></div>
    </div>
  </div>
</section>


</article>

      <p v-else class="opacity-70">Artist not found.</p>

      <footer class="mt-8">
        <NuxtLink
          to="/artists"
          class="text-sm underline hover:text-yellow-600 transition"
          >← All artists</NuxtLink
        >
      </footer>
    </div>
  </section>
</template>

<style scoped>
.embla {
  overflow: hidden;
  width: 100%;
  max-width: 100%;
}
.embla__container {
  display: flex;
}
.embla__slide {
  flex: 0 0 100%; /* one slide per page */
  min-width: 0;
}
</style>
