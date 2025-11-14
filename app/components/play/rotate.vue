<!-- app/components/play/rotate.vue -->
<script setup lang="ts">
import { motion, AnimatePresence } from 'motion-v'
import { ref } from 'vue'

const show = ref(true)
</script>

<template>
  <div class="flex items-center justify-around w-full h-full">

      <motion.div
  v-if="show"
  key="artpiece"
  class="w-[300px] h-[300px] my-12 border border-gray-600/20 hover:border-gray-600/50 cursor-pointer  border-solid bg-white/70 hover:shadow-sm  overflow-hidden grid place-items-center backdrop-blur-sm"
  :initial="{ opacity: 0, y: 40, scale: 0.95 }"
  :whileInView="{ opacity: 1, y: 0, scale: 1 }"
  :transition="{ duration:0.5, ease: 'easeInOut' }"
>
  <slot />
</motion.div>
  </div>
</template>
