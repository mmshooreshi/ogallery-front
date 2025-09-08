<script setup lang="ts">

const route = useRoute()
// Keep slug reactive so client-side navigations work
const slug = computed(() => String(route.params.slug ?? ''))

const { data: doc } = await useAsyncData('viewing-rooms-item', () =>
  queryCollection('viewingRooms').where('slug', '=', slug.value).first()
)
useSeoMeta({ title: doc.value?.title  || 'Viewing Room' })
</script>

<template>
  <article v-if="doc">
    <h1 class="text-3xl font-semibold mb-2">{{ doc.title  }}</h1>
    <p class="opacity-70 mb-6">
      {{ doc.startDate }}
      <span v-if="doc.endDate"> — {{ doc.endDate }}</span>
    </p>
    <div v-if="doc.text" class="prose max-w-none">
      <p v-for="p in (doc.text || '').split('\n\n')" :key="p">{{ p }}</p>
    </div>
  </article>
  <p v-else>Not found.</p>
</template>
