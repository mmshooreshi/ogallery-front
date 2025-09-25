<!-- app/pages/exhibitions/index.vue -->
<script setup lang="ts">
const { data } = await useAsyncData('exhibitions', () =>
  queryCollection('exhibitions').all()
)
useSeoMeta({ title: 'Exhibitions' })
const items = computed(() => {
  const list = (data.value ?? []).slice()
  list.sort((a:any,b:any) => (b?.startDate || '').localeCompare(a?.startDate || ''))
  return list
})
</script>

<template>
  <section>
    <h1 class="text-2xl font-semibold mb-4">Exhibitions</h1>
    <ul class="grid gap-3">
      <li v-for="doc in items" :key="doc.slug">
        <NuxtLink :to="`/exhibitions/${doc.slug}`">
          {{ doc.title || doc.slug }}
        </NuxtLink>
        <small class="block opacity-60">
          {{ doc.startDate }}
          <span v-if="doc.endDate"> — {{ doc.endDate }}</span>
        </small>
      </li>
    </ul>
  </section>
</template>
