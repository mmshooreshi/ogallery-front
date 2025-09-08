<!-- app/pages/artists/[slug].vue -->
<script setup lang="ts">
const route = useRoute()

// Keep slug reactive so client-side navigations work
const slug = computed(() => String(route.params.slug ?? ''))


const { data, pending, error } = await useAsyncData(
  () => `artist-${slug.value}`,
  () => queryCollection('artists')
        .where('slug', '=', slug.value)   // field, operator, value
        .first(),
  { watch: [slug] }
)


const artist = computed(() => (data.value ?? null) as any)

useSeoMeta({
  title: () => artist.value?.name ?? 'Artist',
  ogTitle: () => artist.value?.name ?? 'Artist',
  description: () =>
    (artist.value?.bio || '').slice(0, 160)
})

</script>

<template>
  <section>
    <div v-if="pending" class="opacity-70">Loading…</div>
    <div v-else-if="error" class="text-red-600">Failed to load artist.</div>

    <article v-else-if="artist">
      <header class="mb-6 flex items-center gap-4">

        <NuxtImg
          v-if="artist.image"
          :src="artist.image"
          width="120"
          height="120"
          class="rounded-full object-cover"
          :alt="artist.name"
        />
        <div>
          <h1 class="text-3xl font-semibold mb-2">{{ artist.name }}</h1>
          <a
            v-if="artist.website"
            :href="artist.website"
            target="_blank"
            rel="noopener"
            class="text-sm underline opacity-80 hover:opacity-100"
          >
            {{ artist.website }}
          </a>
        </div>
      </header>

      <div v-if="artist.bio" class="prose max-w-none">
        <p v-for="(p, i) in artist.bio.split('\n\n')" :key="i">{{ p }}</p>
      </div>
      <p v-else class="opacity-70">Biography coming soon.</p>
    </article>

    <p v-else class="opacity-70">Artist not found.</p>

    <footer class="mt-8">
      <NuxtLink to="/artists" class="text-sm underline">← All artists</NuxtLink>
    </footer>
  </section>
</template>
