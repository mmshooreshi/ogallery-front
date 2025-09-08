<script setup lang="ts">

const route = useRoute()
// Keep slug reactive so client-side navigations work
const slug = computed(() => String(route.params.slug ?? ''))

const { data: doc } = await useAsyncData('window-item', () =>
  queryCollection('window').where('slug', '=', slug.value).first()
)
useSeoMeta({ title: doc.value?.title || 'The Window' })
</script>

<template>
  <article v-if="doc">
    <h1 class="text-3xl font-semibold mb-2">{{ doc.title  }}</h1>
    <p class="opacity-70 mb-6">
      {{ doc.startDate }}
      <span v-if="doc.endDate"> — {{ doc.endDate }}</span>
    </p>
  </article>
  <p v-else>Not found.</p>
</template>
