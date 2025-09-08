<script setup lang="ts">

const route = useRoute()
// Keep slug reactive so client-side navigations work
const slug = computed(() => String(route.params.slug ?? ''))

const { data: page } = await useAsyncData('publications-item', () =>
  queryCollection('publications').where('slug', '=', slug.value).first()
)
useSeoMeta({ title: page.value?.title })
</script>

<template>
  <article v-if="page">
    <h1 class="text-3xl font-semibold mb-2">{{ page.title }}</h1>
    <p class="opacity-70 mb-6">{{ page.date }}</p>
    <ContentRenderer :value="page" />
  </article>
  <p v-else>Not found.</p>
</template>
