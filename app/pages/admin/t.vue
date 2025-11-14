<!-- app/pages/admin/t.vue -->
<script setup lang="ts">
import { motion } from 'motion-v'
import { useScroll } from '@vueuse/core'

const target = ref<HTMLElement | null>(null)

// VueUse gives you reactive scroll refs
const whole = useScroll(target)
const newWhole = useWindowScroll()

const { y, arrivedState } = whole
// fake range for demo

// Calculate the percentage of scroll
const scrollPercent = computed<number>(() => {
  const element: HTMLElement | null = target.value;
  if (element) {
    const maxScroll = element.scrollHeight - element.clientHeight;
    return y.value / maxScroll; // Return as a decimal percentage
  }
  return 0;
});


const rrr = computed<number>(() => { 
    return Math.trunc((scrollPercent.value % 100)*10)*10
});
const range = [...Array(100).keys()].map(i => i + 1)
</script>

<template>
  <div ref="target" :class="[arrivedState.bottom ? '' : '', `bg-yellow/30`]" class="h-[500px]  overflow-auto">
    <div  class="fixed bottom-0 bg-blue w-84 h-56 border border-2 p-2 text-white">
      scrollY: {{ y }}  
      <br />at top? {{ arrivedState.top }}  
      <br />at bottom? {{ arrivedState.bottom }}

      <!-- {{ whole }} -->
      <hr/>
      {{ rrr }}
      {{ `bg-yellow/${rrr}` }}
    </div>

    <div v-for="i in range" :key="i">{{ i }}</div>

    <!-- Animate with motion-v -->
  </div>
      <motion.div :style="{ scaleX: scrollPercent }" class="h-4 bg-green " />
    <!-- <motion.div :initial="{ opacity: 0, y: 20, scale: 0.5 }" :while-in-view="{ opacity: 1, y: 0, scale: 1}" :in-view-options="{ once: true }"/> -->

</template>
