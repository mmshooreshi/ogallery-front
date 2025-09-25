<!-- app/pages/ham.vue -->
<script setup>
import { ref } from 'vue'
import HamburgerMenu from '@/components/HamburgerMenu.vue'
import SiteHeader2 from '@/components/SiteHeader2.vue'

const open1 = ref(false)
const open8 = ref(false)
</script>

<template>
  <!-- ham1 -->


  <!-- <HamburgerMenu v-model="open1" variant="ham1" :size="80" color="#000" /> -->

  <!-- ham8 -->
  <!-- <HamburgerMenu v-model="open8" variant="ham1" :size="60" color="#595a5c" :stroke-width="3.5" /> -->
<div class="w-screen h-[65px]">
  <SiteHeader2/>
</div>
<div class="bg-black h-screen">
    body
</div>
 <!-- <div class="bg-red"> salam</div> -->
</template>