<template>
  <header ref="headerRef" class="hp-header">
    <button
      class="ham"
      :class="{ active: isOpen }"
      @click="toggle"
      aria-label="Toggle navigation"
      :aria-expanded="isOpen.toString()"
      :aria-controls="menuId"
    >
      <svg class="hamSvg" viewBox="0 0 100 100" width="60">
        <path class="line top"
          d="m 30,33 h 40 c 0,0 9.044436,-0.654587 9.044436,-8.508902 0,-7.854315 -8.024349,-11.958003 -14.89975,-10.85914 -6.875401,1.098863 -13.637059,4.171617 -13.637059,16.368042 v 40"/>
        <path class="line middle" d="m 30,50 h 40"/>
        <path class="line bottom"
          d="m 30,67 h 40 c 12.796276,0 15.357889,-11.717785 15.357889,-26.851538 0,-15.133752 -4.786586,-27.274118 -16.667516,-27.274118 -11.88093,0 -18.499247,6.994427 -18.435284,17.125656 l 0.252538,40"/>
      </svg>
    </button>

    <nav
      :id="menuId"
      class="hp-nav"
      :class="{ active: isOpen }"
      @click.self="close"
    >
      <a
        v-for="(item, i) in items"
        :key="i"
        class="hp-nav-link"
        :href="item.href"
        @click.prevent="onLinkClick(item.href)"
      >
        {{ item.label }}
      </a>
    </nav>
  </header>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, nextTick } from 'vue'

/**
 * Props:
 * - items: [{label: 'Видео', href: '#preview'}, ...]
 * - extraOffset: number (optional) to fine-tune scroll position
 * - menuId: string (optional) id for the nav element
 */
const props = defineProps({
  items: {
    type: Array,
    default: () => ([
      { label: 'Видео', href: '#preview' },
      { label: 'Faceplate в цифрах', href: '#statistic' },
      { label: 'Проблемы на производстве', href: '#know-more' },
      { label: 'Решение Faceplate', href: '#decision' },
      { label: 'Преимущества Faceplate', href: '#benefits' },
      { label: 'Для кого', href: '#usability' },
      { label: 'Как это работает', href: '#howItWorks' },
      { label: 'Контакты', href: '#feedback-main' },
    ])
  },
  extraOffset: { type: Number, default: 30 },
  menuId: { type: String, default: 'main-nav' },
})

const isOpen = ref(false)
const headerRef = ref(null)
const headerHeight = ref(0)

const toggle = () => { isOpen.value = !isOpen.value }
const close = () => { isOpen.value = false }

const updateHeaderHeight = () => {
  headerHeight.value = headerRef.value?.offsetHeight || 0
}

const smoothScrollTo = (hash) => {
  if (!hash || !hash.startsWith('#')) return
  const el = document.querySelector(hash)
  if (!el) {
    // fallback: change location (will jump if the element exists on another page)
    window.location.href = `/${hash}`
    return
  }
  const y = el.getBoundingClientRect().top + window.pageYOffset
  const yOffset = -headerHeight.value + props.extraOffset
  window.scrollTo({ top: y + yOffset, behavior: 'smooth' })
}

const onLinkClick = async (href) => {
  close()
  await nextTick()
  smoothScrollTo(href)
}

const onHashLoad = () => {
  if (window.location.hash) {
    // Delay to ensure layout is ready
    requestAnimationFrame(() => smoothScrollTo(window.location.hash))
  }
}

const onKeydown = (e) => {
  if (e.key === 'Escape') close()
}

onMounted(() => {
  updateHeaderHeight()
  window.addEventListener('resize', updateHeaderHeight)
  window.addEventListener('hashchange', onHashLoad)
  window.addEventListener('keydown', onKeydown)
  onHashLoad()
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', updateHeaderHeight)
  window.removeEventListener('hashchange', onHashLoad)
  window.removeEventListener('keydown', onKeydown)
})
</script>

<style scoped>
/* Layout shell (keep minimal; tailor to your design) */
.hp-header {
  position: sticky;
  top: 0;
  z-index: 50;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 16px;
  background: #0b0b0b;
}

/* Hamburger button + SVG lines */
.ham {
  border: 0;
  background: transparent;
  padding: 0;
  cursor: pointer;
}
.hamSvg .line {
  fill: none;
  stroke: #fff;
  stroke-width: 5.5;
  stroke-linecap: round;
  transition: stroke-dasharray 400ms, stroke-dashoffset 400ms, transform 400ms;
}

/* Simple animation borrowed from "hamRotate ham1" style */
.ham.active .top {
  stroke-dasharray: 40 160;
  stroke-dashoffset: -64px;
}
.ham.active .middle {
  stroke-dasharray: 40 142;
  stroke-dashoffset: -64px;
  transform-origin: 50% 50%;
  transform: rotate(90deg);
}
.ham.active .bottom {
  stroke-dasharray: 40 85;
  stroke-dashoffset: -64px;
}

/* Nav menu (mobile-first) */
.hp-nav {
  position: fixed;
  inset: 64px 0 0 0; /* under header */
  background: rgba(0,0,0,0.95);
  display: grid;
  gap: 16px;
  padding: 24px;
  transform: translateY(-100%);
  transition: transform 200ms ease;
}
.hp-nav.active {
  transform: translateY(0);
}

.hp-nav-link {
  color: #fff;
  text-decoration: none;
  font-size: 18px;
}

/* Desktop: show links inline if you want (optional) */
@media (min-width: 992px) {
  .hp-nav {
    position: static;
    transform: none !important;
    background: transparent;
    display: flex;
    gap: 24px;
    padding: 0;
    inset: auto;
  }
}
</style>
