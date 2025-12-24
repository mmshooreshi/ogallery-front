<script setup lang="ts">
import AdminScraperPipeline from '@/components/Admin/ScraperPipeline.vue'
</script>

<template>
  <div>
    Publications
  <AdminScraperPipeline
    kind="PUBLICATION"
    api-path="publications"
    title="Publications"
  />
  </div>
</template>