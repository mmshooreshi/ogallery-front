<!-- app/pages/play/yard-[id].vue -->
<template>
  artistID:{{artistID}}
{{ installationSlides }}
<!-- {{nextPath}} -->
<NuxtLink :to='nextPath'>Next</NuxtLink>
<PlayRotate v-for="i in range">
    {{ i }}
    </PlayRotate>
</template>

<script setup lang="ts">
import { useLocalCache } from '~/composables/useLocalCache'
const range = [...Array(10).keys()].map(i => i + 1)



interface MediaItem {
    id: string;
    role: string;
    media: { url: string, alt?: string, caption?: string };
}

interface Artist {
    media?: MediaItem[];
}

const LBL = '[artists/[id]]'
const log  = (...a:any[]) => console.log(LBL, ...a)

const route = useRoute()
const { locale } = useI18n()
// const slug = computed(() => String(route.params.slug))
const artistID = computed(() => String(route.params.id))
const nextPath = computed(() =>{
  return `http://localhost:3000/play/yard-${parseInt(artistID.value)+1}`
} )

const key  = computed(() => `artist:${locale.value}-${artistID.value}`)

const { data: artist, pending, error } = useLocalCache<Artist>(
  () => key.value,
  () => $fetch<any>(`/_q/artists/by/${encodeURIComponent(artistID.value)}`, {
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

const selectedWorks = computed(() =>
  artist.value?.media?.filter((m: any) => m.role === 'SELECTED_WORK') ?? []
)

</script>

