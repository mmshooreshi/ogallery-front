<template>
  <div>
    <SiteHeader2 />

    <main class="min-h-screen  pt-16">
      <slot />
    </main>


    <SiteFooter/>

  </div>
</template>

<script setup lang="ts">
// If you need global composables, import them here
</script>

<style scoped>
/* keep layout-wide styling here if needed */
</style>
