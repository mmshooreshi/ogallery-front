<script setup lang="ts">
import { ref, computed } from 'vue'

const { locale } = useI18n()
const { logout } = useAdminAuth()
const router = useRouter()
const route = useRoute()

const mobileMenuOpen = ref(false)

// Navigation items
const navItems = computed(() => [
  { label: locale.value === 'FA' ? 'پیشخوان' : 'Dashboard', to: '/admin/dashboard', icon: 'ph:squares-four-duotone', exact: true },
  { label: locale.value === 'FA' ? 'هنرمندان' : 'Artists', to: '/admin/artists', icon: 'ph:paint-brush-broad-duotone' },
  { label: locale.value === 'FA' ? 'نمایش‌ها' : 'Exhibitions', to: '/admin/exhibitions', icon: 'ph:frame-corners-duotone' },
  { label: locale.value === 'FA' ? 'اخبار' : 'News', to: '/admin/ogallery-news', icon: 'ph:newspaper-duotone' },
  // Add others here...
])

const handleLogout = async () => {
  await logout()
  router.push('/admin/login')
}

// Close mobile menu on route change
watch(() => route.path, () => { mobileMenuOpen.value = false })
</script>

<template>
  <div class="min-h-screen bg-[#f8f9fa] text-[#2d2d2d]" :dir="locale === 'FA' ? 'rtl' : 'ltr'">
    
    <header class="md:hidden h-[64px] bg-white border-b border-gray-200 flex items-center justify-between px-4 sticky top-0 z-30">
      <div class="flex items-center gap-3">
        <button @click="mobileMenuOpen = true" class="p-2 -mx-2 text-gray-600">
          <Icon class="text-2xl block" name="ph:list" />
        </button>
        <span class="text-lg tracking-wide uppercase font-bold">Admin</span>
      </div>
      <div class="flex gap-2 text-sm font-bold">
        <button @click="$i18n.setLocale('EN')" :class="{ 'text-[#ffde00]': locale === 'EN' }">EN</button>
        <span class="opacity-30">|</span>
        <button @click="$i18n.setLocale('FA')" :class="{ 'text-[#ffde00]': locale === 'FA' }">FA</button>
      </div>
    </header>

    <div class="flex h-screen overflow-hidden">
      <aside 
        class="fixed inset-y-0 z-40 w-64 bg-white border-e border-gray-200 transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 flex flex-col"
        :class="[mobileMenuOpen ? 'translate-x-0' : (locale === 'FA' ? 'translate-x-full' : '-translate-x-full')]"
      >
        <div class="h-[64px] flex items-center px-6 border-b border-gray-100">
          <img src="/ogallery-logo.svg" alt="Logo" class="h-8 w-auto" />
        </div>

        <nav class="flex-1 overflow-y-auto py-6 px-3 space-y-1">
          <NuxtLink 
            v-for="item in navItems" 
            :key="item.to"
            :to="item.to"
            class="group flex items-center px-3 py-2 text-sm font-medium rounded-md text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors"
            active-class="bg-gray-100 text-gray-900"
          >
            <Icon :name="item.icon" class="text-lg opacity-70 group-hover:opacity-100 me-3 transition-opacity" />
            {{ item.label }}
          </NuxtLink>
        </nav>

        <div class="p-4 border-t border-gray-100">
          <button @click="handleLogout" class="flex items-center w-full px-3 py-2 text-sm font-medium text-red-600 rounded-md hover:bg-red-50">
            <Icon name="ph:sign-out" class="me-3 text-lg" />
            {{ locale === 'FA' ? 'خروج' : 'Log Out' }}
          </button>
        </div>
      </aside>

      <div v-if="mobileMenuOpen" @click="mobileMenuOpen = false" class="fixed inset-0 bg-black/20 backdrop-blur-sm z-30 md:hidden"></div>

      <main class="flex-1 overflow-y-auto relative w-full !pt-0 p-6 md:p-10">
        <slot />
      </main>
    </div>
  </div>
</template>