<!-- app/pages/admin/ogallery-viewing-rooms.vue -->
<script setup lang="ts">
import AdminScraperPipeline from '@/components/Admin/ScraperPipeline.vue'
</script>

<template>
  <AdminScraperPipeline
    kind="VIEWING-ROOM"
    api-path="viewing-rooms"
    title="Viewing Rooms"
  />
</template>