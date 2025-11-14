<!-- app/pages/admin/op.vue -->
<script setup lang="ts">
import { motion } from 'motion-v'
// import { useScroll } from '@vueuse/core'

const range = [...Array(100).keys()].map(i => i + 1)
</script>

<template>
  <div class="" v-for="item in range" :key="item">
    <motion.div 
      :initial="{ opacity: 0, y: 20, scale: 0.5 }" 
      :while-in-view="{ opacity: 1, y: 0, scale: 1 }" 
      :in-view-options="{ once: true }"
      class="animated-item w-56 h-56 bg-blue"
    >
      Item {{ item }}
    </motion.div>
    {{item}}
  </div>
    <!-- <motion.div :initial="{ opacity: 0, y: 20, scale: 0.5 }" :while-in-view="{ opacity: 1, y: 0, scale: 1}" :in-view-options="{ once: true }"/> -->

</template>


<style scoped>
.animated-item {
  /* Add any desired styling here */
  margin: 10px;
  padding: 20px;
  border-radius: 8px;
}
</style>