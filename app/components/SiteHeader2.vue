<!-- app/components/SiteHeader2.vue -->
<script setup lang="ts">
import { ref, computed } from 'vue'
import HamburgerMenu from '@/components/HamburgerMenu.vue'
// import Magnifier from '@/assets/icons/magnifier.svg'

const lp = useLocalePath()               // localized internal links
const switchLocalePath = useSwitchLocalePath()
const { locale } = useI18n()             // current locale code ('EN' | 'FA')

const open = ref(false)           // drawer open/close
const searchOpen = ref(false)     // search box open/close
function toggle() { open.value = !open.value }
function close() { open.value = false }
function toggleSearch() { searchOpen.value = !searchOpen.value }
function closeSearch() { searchOpen.value = false }

const links = [
  { to: '/artists', label: 'Artists' },
  { to: '/exhibitions', label: 'Exhibitions' },
  { to: '/viewing-rooms', label: 'Viewing Rooms' },
  { to: '/window', label: 'The Window' },
  { to: '/publications', label: 'Publications' },
  { to: '/news', label: 'News' },
  { to: '/studio', label: 'Studio' },
  { to: '/gallery', label: 'Gallery' }
]


// add below your existing refs
const searchWrapRef = ref<HTMLElement | null>(null)
const searchInputRef = ref<HTMLInputElement | null>(null)

// focus + select when opening
watch(searchOpen, async (isOpen) => {
  if (isOpen) {
    await nextTick()
    searchInputRef.value?.focus({ preventScroll: true })
    searchInputRef.value?.select()
  }
})

// close when clicking outside
function handleClickOutside(e: MouseEvent) {
  if (!searchOpen.value) return
  const el = searchWrapRef.value
  if (el && !el.contains(e.target as Node)) closeSearch()
}

function delayedClose(delay: number) {
  setTimeout(() => {
    close()
  }, delay) // wait 500ms before closing
}

const hover = ref(false)
const onTouchTapStyleToggle = () => { hover.value = !hover.value; };

onMounted(() => document.addEventListener('click', handleClickOutside, true))
onBeforeUnmount(() => document.removeEventListener('click', handleClickOutside, true))

const route = useRoute()
const computedTarget = ref(route.fullPath)


watch(
  () => route.fullPath,
  () => {

    computedTarget.value = route.fullPath;

    delayedClose(0)
  }
)



</script>

<template>
  <div class="relative z-10">
    <header
      class="!select-none fixed top-0 inset-x-0 z-20 w-full h-[60px]  bg-white border-b border-black/8 flex items-center">
      <!-- Left: Hamburger (60x60) -->
      <!-- <button
      class="w-[60px] h-[60px] flex items-center justify-center appearance-none border-none bg-transparent cursor-pointer text-[#595a5c]"
      aria-label="Open menu"
      @click="toggle"
    >
    </button> -->
      <HamburgerMenu v-model="open" variant="ham1" :size="60" color="#595a5c" :stroke-width="3.5" />

      <!-- Logo (hidden when search is open) -->
      <NuxtLink to="/" aria-label="OGallery"
        class="flex items-center gap-2 text-[#2d2d2d] no-underline font-600 tracking-[0.06em] transition-opacity duration-200"
        :class="searchOpen ? 'opacity-0 md:opacity-100 w-0 pointer-events-none' : 'opacity-100'">
        <img src="/ogallery-logo.svg" alt="" class="h-[40px] w-auto" />
      </NuxtLink>

      <!-- Filler -->
      <div class="flex-1" />

      <!-- Right cluster -->
      <div class="flex items-center gap-0 md:gap-0">
        <!-- Language switch (hidden when search is open) -->
        <div class="flex items-center text-[#2d2d2d] text-[1rem] transition-opacity duration-200"
          :class="searchOpen ? 'opacity-0 pointer-events-none  md:pointer-events-auto' : 'opacity-90'">
          <NuxtLink :to="switchLocalePath('EN')" class="no-underline font-english" @touchstart="onTouchTapStyleToggle"
            @touchend="onTouchTapStyleToggle"
            :class="[locale === 'EN' ? 'text-[#ffde00]]' : 'text-inherit', { active: hover }]"
            aria-label="Switch to English">EN</NuxtLink>
          <span class="px-2 opacity-40">|</span>
          <NuxtLink :to="switchLocalePath('FA')" class="no-underline font-persian" @touchstart="onTouchTapStyleToggle"
            @touchend="onTouchTapStyleToggle"
            :class="[locale === 'FA' ? 'text-[#ffde00]' : 'text-inherit', { active: hover }]"
            aria-label="Switch to Persian">فا</NuxtLink>
        </div>

        <!-- Search toggle / field -->
        <!-- Search toggle / field -->
        <!-- Search (simple + smooth) -->
        <!-- <div class="relative flex items-center"> -->
        <div class="relative flex items-center" ref="searchWrapRef">


          <!-- Expanding input (smooth width + opacity) -->
          <div class="mx-2 h-[36px] overflow-hidden  transition-all duration-300 ease-out"
            :class="[searchOpen ? 'w-[200px]' : 'w-0 opacity-0', locale === 'EN' ? '-mr-10 ml-10' : '-ml-10 mr-10']"
            :aria-hidden="searchOpen ? 'false' : 'true'">
            <input type="text" ref="searchInputRef" placeholder="Search…"
              class="h-full w-full px-3  outline-none border-t border-x-0 border-b-0 border-black/20 transition-opacity duration-1000"
              :class="searchOpen ? 'opacity-100' : 'opacity-0 pointer-events-none select-none'"
              @keydown.esc.prevent="closeSearch" />
            <!-- fix: i removed this attrib from above input element, not to auto open keybaord and get focus on webpage opening: autofocus -->
          </div>

          <!-- Magnifier (persistent) -->
          <button
            class="p-0 w-[60px] h-[60px] flex items-center justify-center appearance-none border-none bg-transparent cursor-pointer text-[#2d2d2d] transition-all duration-300"
            :aria-pressed="searchOpen ? 'true' : 'false'" :class="searchOpen ? 'scale-50 mt-1' : 'scale-100'"
            aria-label="Toggle search" @click="toggleSearch">
            <svg width="28" height="29" viewBox="0 0 28 29" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M27.658 26.3837L20.458 19.1837C22.2763 16.9485 23.1676 14.1008 22.9482 11.2278C22.7288 8.35483 21.4154 5.67552 19.2788 3.74233C17.1421 1.80914 14.3452 0.769453 11.4647 0.837625C8.58409 0.905798 5.83949 2.07664 3.79672 4.10874C1.76462 6.1515 0.593786 8.8961 0.525613 11.7767C0.457441 14.6572 1.49713 17.4542 3.43032 19.5908C5.36351 21.7274 8.04282 23.0408 10.9158 23.2602C13.7888 23.4796 16.6365 22.5883 18.8717 20.77L26.0717 27.97C26.2869 28.1543 26.5638 28.2506 26.8469 28.2397C27.13 28.2287 27.3986 28.1113 27.599 27.911C27.7993 27.7106 27.9167 27.4421 27.9276 27.1589C27.9386 26.8758 27.8423 26.5989 27.658 26.3837ZM5.38297 18.43C4.12371 17.1715 3.26596 15.5679 2.91821 13.8219C2.57047 12.0759 2.74835 10.266 3.42937 8.62115C4.11038 6.97627 5.26393 5.57032 6.7441 4.58112C8.22427 3.59193 9.96457 3.06394 11.7448 3.06394C13.5251 3.06394 15.2654 3.59193 16.7456 4.58112C18.2258 5.57032 19.3793 6.97627 20.0603 8.62115C20.7413 10.266 20.9192 12.0759 20.5715 13.8219C20.2237 15.5679 19.366 17.1715 18.1067 18.43C17.2749 19.2718 16.2842 19.9402 15.1922 20.3964C14.1001 20.8526 12.9284 21.0875 11.7448 21.0875C10.5613 21.0875 9.3896 20.8526 8.29754 20.3964C7.20548 19.9402 6.21482 19.2718 5.38297 18.43Z"
                fill="#7F7F7F" />
            </svg>
          </button>
        </div>

      </div>

      <!-- Off-canvas overlay -->


      <!-- Panel -->
      <!-- w-[82vw] max-w-[300px] -->
      <!-- </div> -->
    </header>
<!-- NAV (paste this whole block) -->
<nav
  class="site-drawer fixed inset-0 w-screen h-[100dvh] z-10"
  :data-open="open"
  role="dialog"
  aria-modal="true"
  aria-label="Main Menu"
>
  <!-- Moving background panel -->
  <div class="drawer-panel absolute inset-0 bg-white" aria-hidden="true"></div>

  <!-- Static content (does not move with panel) -->
  <div class="drawer-content relative z-10 w-full h-full" :class="open ? 'pointer-events-auto' : 'pointer-events-none'">
    <div class="h-[56px]"></div> <!-- header spacer -->

    <ul class="list-none px-[5px] m-0 p-0" :class="open ? 'menu-open' : 'menu-close'">
      <li
        v-for="(l, i) in links"
        :key="l.to"
        class="menu-item"
        :style="{ '--i': i, '--inv-i': links.length - i - 1 }"
      >
        <NuxtLink
          :to="lp(l.to)"
          @click="computedTarget = l.to"
          :class="[computedTarget == l.to ? 'text-[#ffde00]' : '']"
          class="uppercase block py-[1px] px-[5px] w-max pr-8 no-underline font-light text-[1.4rem] text-[#1e1e1e]/70 rounded-lg hover:text-[#ffde00] transition-colors duration-200"
        >
          {{ l.label }}
        </NuxtLink>
      </li>
    </ul>
  </div>
</nav>

  </div>
</template>

<style>
.transs {
  /* Use hardware-accelerated transform for smooth sliding */
  will-change: transform, opacity;
  transition:
    transform 0.5s ease-in-out,
    /* max-height 1s cubic-bezier(.29,.54,0,1.16), */
    opacity 0.3s ease;

  /* needed for max-height animation */
  /* overflow: hidden; */
}


.nav-open {
  transform: translateY(0);
  transition-delay: 1000ms;
  /* visible */
}

.nav-close {
  transform: translateY(-100%);
  /* hidden above screen */
}


/* Base state: items are out of view and invisible (prevents initial flash) */
.menu-close .menu-item {
  opacity: 0;
  transform: translateX(-100px);
  letter-spacing: -5px;
  transition:
    letter-spacing 600ms cubic-bezier(0.22, 1, 0.36, 1) calc(var(--inv-i, 0) * 60ms),
    transform 1000ms cubic-bezier(0.22, 1, 0.36, 1) calc(var(--inv-i, 0) * 50ms),
    opacity 700ms cubic-bezier(0.22, 1, 0.36, 1) calc(var(--inv-i, 0) * 20ms);
  /* transition-delay: calc(80ms - var(--i, 0) * 15ms); */
  /* transition-delay: calc(var(--inv-i, 0) * 60ms ); */

}



.menu-open .menu-item {
  letter-spacing: 0px;
  opacity: 1;
  transform: translateX(0);
  transition:
    letter-spacing 600ms cubic-bezier(0.22, 1, 0.36, 1),
    transform 500ms cubic-bezier(0.22, 1, 0.36, 1),
    opacity 500ms cubic-bezier(0.22, 1, 0.36, 1);
  /* smoother, shorter stagger; start a touch after panel begins */
  transition-delay: calc(var(--i, 0) * 60ms);
  will-change: transform, opacity;
}

/* Respect reduced motion */
@media (prefers-reduced-motion: reduce) {
  .menu-item {
    transition: none;
    transform: none;
    opacity: 1;
  }
}


.fade-enter-active,
.fade-leave-active {
  transition: opacity .15s
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0
}





/* --- Drawer panel moves; content stays put --- */
.site-drawer {
  /* when closed, don’t block the page */
}
.site-drawer[data-open="false"] {
  pointer-events: none;
}

/* Moving background layer */
.drawer-panel {
  transform: translateY(-100%);
  transition: transform 1000ms cubic-bezier(0.22, 1, 0.36, 1) 120ms;
  will-change: transform;
}
.site-drawer[data-open="true"] .drawer-panel {
  transform: translateY(0);
  transition: transform 1000ms cubic-bezier(0.22, 1, 0.36, 1);
}

/* Static content layer (z-index above the moving panel) */
.drawer-content {
  /* no transform here so items never move vertically with the panel */
}

/* (Optional) reduce motion */
@media (prefers-reduced-motion: reduce) {
  .drawer-panel {
    transition: none;
    transform: none;
  }
}

</style>