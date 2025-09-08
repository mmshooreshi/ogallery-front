<script setup lang="ts">
const { data } = await useAsyncData('publications', () =>
  queryCollection('publications').all()
)
useSeoMeta({ title: 'Publications' })
const items = computed(() => {
  const list = (data.value ?? []).slice()
  list.sort((a:any,b:any) => (b?.date || '').localeCompare(a?.date || ''))
  return list
})
</script>

<template>
  <section>
    <h1 class="text-2xl font-semibold mb-4">Publications</h1>
    <ul class="grid gap-3">
      <li v-for="doc in items" :key="doc.slug">
        <NuxtLink :to="`/publications/${doc.slug}`">
          {{doc.title || doc.slug }}
        </NuxtLink>
        <small class="block opacity-60">
          {{  doc.date }}
        </small>
      </li>
    </ul>
  </section>
</template>
