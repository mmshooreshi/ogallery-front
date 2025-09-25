<template>
  <div class="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm grid place-items-center " @click.self="$emit('cancel')">
    <div class="bg-white rounded-2xl shadow-xl w-[min(520px,92vw)] ">
      <div class="px-5 py-4 border-b font-semibold">{{ title }}</div>
      <div class="p-5 text-sm "><slot/></div>
      <div class="px-5 pb-5 pt-2 flex gap-2 justify-end">
        <button class="px-3 py-1.5 rounded-xl border hover:bg-gray-50" @click="$emit('cancel')">{{ cancel || 'Cancel' }}</button>
        <button class="px-3 py-1.5 rounded-xl bg-black text-white hover:opacity-90" @click="$emit('confirm')">{{ confirm || 'OK' }}</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{ title?:string; confirm?:string; cancel?:string }>()
defineEmits<{ (e:'confirm'):void; (e:'cancel'):void }>()
</script>
