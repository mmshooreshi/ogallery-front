<script setup lang="ts">

const { data: items } = await useAsyncData('studio', () =>
  queryCollection('studio').all()
)
</script>

<template>
  <section>
    <h1 class="text-2xl font-semibold mb-4">Studio (Available Works)</h1>
    <ul class="grid gap-2">
      <li v-for="it in items" :key="it.slug">
        {{ it.artist }} — {{ it.title }}
        <b class="ml-2">{{ it.price }}</b>
        <small>({{ it.availability || 'available' }})</small>
      </li>
    </ul>
  </section>
</template>
