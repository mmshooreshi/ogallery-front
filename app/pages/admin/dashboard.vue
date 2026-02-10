<script setup lang="ts">
import { ref, computed } from 'vue'

definePageMeta({
  middleware: 'admin-auth',
  layout: false // We use a custom layout structure inside this page
})

const { locale, t } = useI18n()
const { logout } = useAdminAuth()
const router = useRouter()

// --- State ---
const mobileMenuOpen = ref(false)

// --- Data Fetching ---
const { data: stats, refresh } = await useFetch('/api/admin/stats')

// --- Navigation Config ---
// Updated icon names to Iconify format (ph:...)
const navItems = computed(() => [
  { 
    label: locale.value === 'FA' ? 'هنرمندان' : 'Artists', 
    key: 'ARTIST', 
    to: '/admin/artists', 
    icon: 'ph:paint-brush-broad-duotone' 
  },
  { 
    label: locale.value === 'FA' ? 'نمایش‌ها' : 'Exhibitions', 
    key: 'EXHIBITION', 
    to: '/admin/exhibitions', 
    icon: 'ph:frame-corners-duotone' 
  },
  { 
    label: locale.value === 'FA' ? 'اتاق‌های نمایش' : 'Viewing Rooms', 
    key: 'VIEWING_ROOM', 
    to: '/admin/ogallery-viewing-rooms', 
    icon: 'ph:virtual-reality-duotone' 
  },
  { 
    label: locale.value === 'FA' ? 'پروژه ویترین' : 'The Window', 
    key: 'WINDOW', 
    to: '/admin/ogallery-window', 
    icon: 'ph:storefront-duotone' 
  },
  { 
    label: locale.value === 'FA' ? 'انتشارات' : 'Publications', 
    key: 'PUBLICATION', 
    to: '/admin/ogallery-publications', 
    icon: 'ph:books-duotone' 
  },
  { 
    label: locale.value === 'FA' ? 'اخبار' : 'News', 
    key: 'NEWS', 
    to: '/admin/ogallery-news', 
    icon: 'ph:newspaper-duotone' 
  },
  { 
    label: locale.value === 'FA' ? 'استودیو' : 'Studio', 
    key: 'STUDIO', 
    to: '/admin/ogallery-studio', 
    icon: 'ph:house-line-duotone' 
  },
  { 
    label: locale.value === 'FA' ? 'گنجینه' : 'Vault', 
    key: 'VAULT', 
    to: '/admin/vault', 
    icon: 'ph:safe-duotone' 
  },
])

// --- Helpers ---
const getStat = (kind: string) => {
  return stats.value?.content?.[kind] || { total: 0, draft: 0, published: 0 }
}

const handleLogout = async () => {
  await logout()
  router.push('/admin/login')
}
</script>

<template>
  <div class="min-h-screen bg-[#f8f9fa] text-[#2d2d2d]" :dir="locale === 'FA' ? 'rtl' : 'ltr'">
    
    <header class="md:hidden h-[64px] bg-white border-b border-gray-200 flex items-center justify-between px-4 sticky top-0 z-30">
      <div class="flex items-center gap-3">
        <button @click="mobileMenuOpen = true" class="p-2 -mx-2 text-gray-600">
          <Icon 
            class="text-2xl block cursor-pointer transition-all hover:scale-110 active:scale-95" 
            name="ph:list" 
          />
        </button>
        <span class="text-lg tracking-wide uppercase">
          {{ locale === 'FA' ? 'مدیریت گالری' : 'O Gallery Admin' }}
        </span>
      </div>
      <div class="flex gap-2 text-sm">
        <div @click="$i18n.setLocale('EN')" class="font-dosis cursor-pointer" :class="{ 'text-[#ffde00]': locale === 'EN' }">EN</div>
        <span class="opacity-30">|</span>
        <div @click="$i18n.setLocale('FA')" class="font-dosis cursor-pointer" :class="{ 'text-[#ffde00]': locale === 'FA' }">FA</div>
      </div>
    </header>

    <div class="flex h-screen overflow-hidden">
      
      <aside 
        class="fixed inset-y-0 z-40 w-64 bg-white border-e border-gray-200 transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 flex flex-col"
        :class="[
          mobileMenuOpen ? 'translate-x-0' : (locale === 'FA' ? 'translate-x-full' : '-translate-x-full')
        ]"
      >
        <div class="h-[64px] flex items-center px-6 border-b border-gray-100">
          <img src="/ogallery-logo.svg" alt="O Gallery" class="h-8 w-auto" />
        </div>

        <nav class="flex-1 overflow-y-auto py-6 px-3 space-y-1">
          <NuxtLink to="/admin/dashboard" class="flex items-center px-3 py-2.5 rounded-lg bg-gray-100 text-gray-900 font-medium mb-6">
            <Icon name="ph:squares-four-duotone" class="text-xl me-3" />
            {{ locale === 'FA' ? 'پیشخوان' : 'Dashboard' }}
          </NuxtLink>

          <div class="px-3 mb-2 text-xs font-bold text-gray-400 uppercase tracking-wider">
             {{ locale === 'FA' ? 'محتوا' : 'Content' }}
          </div>
          
          <NuxtLink 
            v-for="item in navItems" 
            :key="item.key"
            :to="item.to"
            class="group flex items-center justify-between px-3 py-2 text-sm font-medium rounded-md text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors"
          >
            <div class="flex items-center">
              <Icon 
                :name="item.icon" 
                class="text-lg opacity-70 group-hover:opacity-100 me-3 transition-opacity" 
              />
              {{ item.label }}
            </div>
            <span v-if="getStat(item.key).draft > 0" class="bg-amber-100 text-amber-700 py-0.5 px-2 rounded-full text-[10px]">
              {{ getStat(item.key).draft }}
            </span>
          </NuxtLink>

          <div class="mt-8 px-3 mb-2 text-xs font-bold text-gray-400 uppercase tracking-wider">
             {{ locale === 'FA' ? 'سیستم' : 'System' }}
          </div>
          <NuxtLink to="/admin/media" class="flex items-center px-3 py-2 text-sm font-medium rounded-md text-gray-600 hover:bg-gray-50">
            <Icon name="ph:images-duotone" class="text-lg opacity-70 me-3" />
             {{ locale === 'FA' ? 'مدیریت فایل‌ها' : 'Media Library' }}
          </NuxtLink>
        </nav>

        <div class="p-4 border-t border-gray-100">
          <button @click="handleLogout" class="flex items-center w-full px-3 py-2 text-sm font-medium text-red-600 rounded-md hover:bg-red-50 transition-colors">
            <Icon 
              name="ph:sign-out" 
              class="me-3 text-lg transition-all hover:scale-110" 
            />
             {{ locale === 'FA' ? 'خروج' : 'Log Out' }}
          </button>
        </div>
      </aside>

      <div 
        v-if="mobileMenuOpen" 
        @click="mobileMenuOpen = false"
        class="fixed inset-0 bg-black/20 backdrop-blur-sm z-30 md:hidden transition-opacity"
      ></div>

      <main class="flex-1 overflow-y-auto relative w-full">
        <div class="max-w-7xl mx-auto p-6 md:p-10">
          
          <div class="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-4">
            <div>
              <h1 class="text-3xl font-bold text-gray-900">
                {{ locale === 'FA' ? 'پیشخوان' : 'Dashboard' }}
              </h1>
              <p class="mt-1 text-gray-500 text-sm">
                {{ locale === 'FA' ? 'به پنل مدیریت خوش آمدید.' : 'Welcome back to O Gallery management.' }}
              </p>
            </div>
            
            <div class="hidden md:flex bg-white rounded-lg border border-gray-200 p-1 shadow-sm gap-1">
              <div 
                @click="$i18n.setLocale('EN')" 
                class="cursor-pointer px-1 py-1 rounded text-sm font-medium transition-colors"
                :class="locale === 'EN' ? 'bg-gray-100 text-black' : 'text-gray-500 hover:text-gray-900'"
              >EN</div>
              <div 
                @click="$i18n.setLocale('FA')" 
                class="cursor-pointer px-1 py-1 rounded text-sm font-medium font-persian transition-colors"
                :class="locale === 'FA' ? 'bg-gray-100 text-black' : 'text-gray-500 hover:text-gray-900'"
              >FA</div>
            </div>
          </div>

          <div class="flex gap-6 mb-10">
            <div class="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col items-center">
              <div class="p-3 rounded-lg bg-blue-50 text-blue-600 me-4">
                <Icon name="ph:images-duotone" class="text-2xl block" />
              </div>
              <div>
                <p class="text-xs font-bold text-gray-400 uppercase tracking-wider">
                  {{ locale === 'FA' ? 'فایل‌ها' : 'Total Media' }}
                </p>
                <p class="text-2xl font-bold text-gray-900">{{ stats?.media || 0 }}</p>
              </div>
            </div>
          </div>

          <h2 class="text-lg font-bold text-gray-900 mb-5 flex items-center gap-2">
            <Icon name="ph:squares-four" class="text-gray-400" />
            {{ locale === 'FA' ? 'مدیریت بخش‌ها' : 'Manage Content' }}
          </h2>
          
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div 
              v-for="item in navItems" 
              :key="item.key"
              class="group bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md hover:border-gray-300 transition-all duration-200"
            >
              <div class="p-6">
                <div class="flex justify-between items-start mb-4 ">
                  <div class="p-2.5 rounded-lg bg-gray-50 text-gray-600  group-hover:bg-[#ffde00] group-hover:text-black transition-colors duration-300">
                    <Icon :name="item.icon" class="text-2xl block" />
                  </div>
                  <div v-if="getStat(item.key).draft > 0" class="flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 border border-amber-100 text-amber-700 text-xs font-bold rounded-full">
                    <span class="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse"></span>
                    <span>{{ getStat(item.key).draft }} {{ locale === 'FA' ? 'پیش‌نویس' : 'Drafts' }}</span>
                  </div>
                </div>

                <h3 class="text-lg font-bold text-gray-900 mb-1">{{ item.label }}</h3>
                <div class="text-sm text-gray-500 mb-6 flex items-center gap-2">
                  <span class="font-medium text-gray-900">{{ getStat(item.key).published }}</span>
                  <span>{{ locale === 'FA' ? 'منتشر شده' : 'Published' }}</span>
                </div>

                <div class="flex gap-3">
                  <NuxtLink :to="item.to" class="flex-1 text-center px-4 py-2 bg-gray-900 hover:bg-black text-white text-sm font-medium rounded-lg transition-colors">
                     {{ locale === 'FA' ? 'مشاهده' : 'View All' }}
                  </NuxtLink>
                  <NuxtLink :to="`${item.to}/new`" class="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-lg transition-colors" aria-label="Add New">
                    <Icon 
                      class="text-lg block cursor-pointer transition-all hover:scale-110 active:scale-95" 
                      name="ph:plus-bold" 
                    />
                  </NuxtLink>
                </div>
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  </div>
</template>

<style scoped>
.router-link-active.group {
  @apply bg-gray-50 border-gray-300;
}
</style>