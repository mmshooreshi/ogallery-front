<!-- app/pages/admin/ogallery-news.vue -->
<script setup lang="ts">
import AdminScraperPipeline from '@/components/Admin/ScraperPipeline.vue'
</script>

<template>
  <AdminScraperPipeline
    kind="NEWS-ITEM"
    api-path="news"
    title="News"
  />
</template>