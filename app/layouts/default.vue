<template>
  <div>
    <SiteHeader2 />
  <!-- <HarvestToolbar v-if="$config.public.adminScrapeEnabled" /> -->
    <!-- <HarvestMonitor :runId="runId" /> -->

      <HarvestToolbar v-model:runId="runId"/>
      <ClientOnly>
      <HarvestMonitor :runId="runId"/>
      </ClientOnly>
    <main class="min-h-screen  pt-16 px-8">
      <slot />
    </main>


    <SiteFooter/>

  </div>
</template>

<script setup lang="ts">
const runId = ref<string|null>(null)

// If you need global composables, import them here
</script>

<style>
html {
  scroll-behavior: smooth;
}
/* keep layout-wide styling here if needed */
</style>

