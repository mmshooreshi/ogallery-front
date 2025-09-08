<template>
  <div>
    <NuxtRouteAnnouncer />
    
    <!-- <NuxtLayout> -->
      <!-- <SiteHeader /> -->

      <div class="w-screen h-[65px]">
  <SiteHeader2/>
</div>
<div class="h-max">
      <NuxtPage/>
</div>


    <!-- </NuxtLayout> -->
    <!-- <NuxtWelcome /> -->
  </div>
</template>


<script setup lang="ts">
const i18nHead = useLocaleHead() // from @nuxtjs/i18n
useHead(() => ({
  htmlAttrs: i18nHead.value.htmlAttrs,
  link: i18nHead.value.link,
  meta: i18nHead.value.meta
}))

</script>