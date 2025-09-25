<script setup lang="ts">
const locale = useState<'EN' | 'FA'>('locale')

const { data, pending, error } = await useFetch('/api/artists', {
  key: computed(() => `artists-${locale.value}`),
  query: () => ({ locale: locale.value }),
  watch: [locale],
  default: () => [],
})

useSeoMeta({ title: 'Artists' })

const route = useRoute()
const q = computed(() => String(route.query.q ?? '').trim().toLowerCase())
const letter = computed(() => String(route.query.letter ?? '').trim().toUpperCase())

const items = computed(() => {
  const list = (data.value ?? []).map((entry: any) => ({
    id: entry.id,
    slug: entry.slug,
    name: entry.name ?? '(Untitled)',
    image: entry.image ?? null,
  }))
  list.sort((a, b) => a.name.localeCompare(b.name))
  const byQ = q.value ? list.filter((it) => it.name.toLowerCase().includes(q.value)) : list
  return letter.value ? byQ.filter((it) => it.name.toUpperCase().startsWith(letter.value)) : byQ
})

const initials = computed(() => {
  const set = new Set((items.value ?? []).map((it) => it.name.charAt(0).toUpperCase()).filter(Boolean))
  return Array.from(set).sort()
})
</script>

<template>
  <section>
    <header class="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <h1 class="text-2xl font-semibold">Artists</h1>

      <form
        class="flex gap-2 items-center"
        @submit.prevent="$router.replace({ query: { ...$route.query, q: ($event.target as HTMLFormElement).q.value || undefined } })"
      >
        <input
          name="q"
          :value="$route.query.q || ''"
          placeholder="Search artists…"
          class="border rounded px-3 py-2 text-sm w-56"
        />
        <button class="border rounded px-3 py-2 text-sm">Search</button>
      </form>
    </header>

    <nav v-if="initials.length" class="flex flex-wrap gap-2 mb-6 text-sm">
      <NuxtLink
        class="px-2 py-1 border rounded"
        :class="{ 'bg-black text-white': !letter }"
        :to="{ query: { ...$route.query, letter: undefined } }"
      >All</NuxtLink>
      <NuxtLink
        v-for="ch in initials"
        :key="ch"
        class="px-2 py-1 border rounded"
        :class="{ 'bg-black text-white': letter === ch }"
        :to="{ query: { ...$route.query, letter: ch } }"
      >{{ ch }}</NuxtLink>
    </nav>

    <div v-if="pending" class="opacity-70">Loading…</div>
    <div v-else-if="error" class="text-red-600">Error loading artists.</div>

    <ul v-else-if="items.length" class="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
      <li v-for="doc in items" :key="doc.slug" class="flex items-center gap-3">
        <NuxtLink :to="`/artists/${doc.slug}`" class="group flex items-center gap-3">
          <NuxtImg
            v-if="doc.image"
            :src="doc.image"
            width="64"
            height="64"
            class="rounded-full object-cover"
            :alt="doc.name"
          />
          <span class="font-medium group-hover:underline">{{ doc.name }}</span>
        </NuxtLink>
      </li>
    </ul>

    <p v-else class="opacity-70">No artists found.</p>
  </section>
</template>
