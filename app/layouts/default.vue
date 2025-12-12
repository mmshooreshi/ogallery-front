<!-- app/layouts/default.vue -->
<template>
  <div class="fixMobileSelect bg-[#fbfbfb]">
    <SiteHeader2 />

    <main class="min-h-[100dvh]  pt-16 px-0">
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

