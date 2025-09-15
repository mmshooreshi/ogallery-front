<template>
  <div>
    <header class="p-4 border-b flex items-center justify-between">
      <NuxtLink to="/" class="font-semibold">O Gallery</NuxtLink>
      <nav class="flex flex-wrap gap-4 text-sm">
        <NuxtLink to="/artists">Artists</NuxtLink>
        <NuxtLink to="/exhibitions">Exhibitions</NuxtLink>
        <NuxtLink to="/viewing-rooms">Viewing Rooms</NuxtLink>
        <NuxtLink to="/window">The Window</NuxtLink>
        <NuxtLink to="/publications">Publications</NuxtLink>
        <NuxtLink to="/news">News</NuxtLink>
        <NuxtLink to="/studio">Studio</NuxtLink>
        <NuxtLink to="/gallery">Info</NuxtLink>
        <NuxtLink to="/admin" class="opacity-70">Admin</NuxtLink>
      </nav>
    </header>
    <main class="p-6">
      <slot />
    </main>
    <footer class="p-6 border-t text-xs opacity-60">© O Gallery</footer>
  </div>
</template>
