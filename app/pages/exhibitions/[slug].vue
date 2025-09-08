<script setup lang="ts">

const route = useRoute()
const { data: doc } = await useAsyncData('exhibitions-item', () =>
  queryCollection('exhibitions').where({ slug: route.params.slug as string }).first()
)
useSeoMeta({ title: doc.value?.title || doc.value?.name || 'Exhibition' })
</script>

<template>
  <article v-if="doc">
    <h1 class="text-3xl font-semibold mb-2">{{ doc.title || doc.name }}</h1>
    <p class="opacity-70 mb-6">
      {{ doc.startDate || doc.date }}
      <span v-if="doc.endDate"> — {{ doc.endDate }}</span>
    </p>
    <div v-if="doc.pressRelease || doc.text" class="prose max-w-none">
      <p v-for="p in (doc.pressRelease || doc.text || '').split('\n\n')" :key="p">{{ p }}</p>
    </div>
  </article>
  <p v-else>Not found.</p>
</template>
