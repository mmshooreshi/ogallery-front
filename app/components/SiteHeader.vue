<!-- app/components/SiteHeader.vue -->
<script setup lang="ts">
import HamburgerMenu from '@/components/HamburgerMenu.vue'

const open = ref(false)
function toggle () { open.value = !open.value }
function close () { open.value = false }

const links = [
  { to: '/artists',        label: 'Artists' },
  { to: '/exhibitions',    label: 'Exhibitions' },
  { to: '/viewing-rooms',  label: 'Viewing Rooms' },
  { to: '/window',         label: 'The Window' },
  { to: '/publications',   label: 'Publications' },
  { to: '/news',           label: 'News' },
  { to: '/studio',         label: 'Studio' },
  { to: '/gallery',        label: 'Gallery' }
]
</script>

<template>
  <header class="hdr">
    <!-- <button class="icon-btn" aria-label="Open menu" @click="toggle"> -->
        <HamburgerMenu v-model="open" variant="ham1" :size="60" color="#595a5c" :stroke-width="3.5" />
      <!-- Hamburger -->
      <!-- <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path d="M3 6h18M3 12h18M3 18h18" stroke-width="1" stroke-linecap="round"/>
      </svg> -->
    <!-- </button> -->

    <NuxtLink to="/" class="logo" aria-label="OGallery">
      <img src="/ogallery-logo.svg" alt="" width="120" height="50" />
      <!-- <span class="brand">GALLERY</span> -->
    </NuxtLink>
    <div class="filler"></div>
    <div class="right">
      <NuxtLink to="/" class="lang">EN</NuxtLink>
      <span class="sep">|</span>
      <NuxtLink to="/" class="lang">فا</NuxtLink>
    </div>

    <!-- Off-canvas -->
    <div class="drawer" :class="{ open }" @click.self="close">
      <nav class="panel" role="dialog" aria-modal="true" aria-label="Main Menu">
        <div class="panel__head">
          <NuxtLink to="/" class="panel__logo" @click="close">
            <img src="/ogallery-logo.svg" alt="" width="28" height="28" />
            <span>GALLERY</span>
          </NuxtLink>
          <button class="icon-btn" aria-label="Close menu" @click="close">
            <svg width="24" height="24" viewBox="0 0 24 24" stroke="currentColor" fill="none">
              <path d="M6 6l12 12M18 6l-12 12" stroke-width="2" stroke-linecap="round"/>
            </svg>
          </button>
        </div>

        <ul class="menu">
          <li v-for="l in links" :key="l.to">
            <NuxtLink :to="l.to" @click="close">{{ l.label }}</NuxtLink>
          </li>
        </ul>
      </nav>
    </div>
  </header>
</template>

<style scoped>
.hdr{
  position:sticky; top:0; z-index:40;
  display:flex; align-items:center; justify-content:flex-start;
  padding:10px 14px; border-bottom:1px solid rgba(0,0,0,.08); background:#fff;
}
.filler{
    flex-grow: 100;
}
.icon-btn{ appearance:none; border:0; background:transparent; padding:6px; cursor:pointer; color:#2d2d2d; }
.logo{ display:inline-flex; align-items:center; gap:10px; color:#2d2d2d; text-decoration:none; font-weight:600; letter-spacing:.06em; }
.brand{ font-size:16px; }
.right{ display:flex; align-items:center; gap:8px; color:#2d2d2d; }
.lang{ text-decoration:none; color:inherit; font-size:14px; opacity:.9; }
.sep{ opacity:.4; }

.drawer{
  position:fixed; inset:0; background:rgba(0,0,0,.3);
  opacity:0; pointer-events:none; transition:.2s ease;
}
.drawer.open{ opacity:1; pointer-events:auto; }
.panel{
  position:absolute; inset:0 auto 0 0; width:min(82vw, 300px); background:#fff;
  transform:translateY(-100%); transition:transform .22s ease;
  display:flex; flex-direction:column; height:100%;
  box-shadow: 0 8px 28px rgba(0,0,0,.18);
}
.drawer.open .panel{ transform:translateX(0); }
.panel__head{
  display:flex; align-items:center; justify-content:space-between;
  padding:12px 12px; border-bottom:1px solid rgba(0,0,0,.08);
}
.panel__logo{ display:flex; align-items:center; gap:10px; text-decoration:none; color:#2d2d2d; font-weight:600; }
.menu{ list-style:none; margin:0; padding:6px 10px; }
.menu li a{
  display:block; padding:12px 8px; text-decoration:none; color:#1e1e1e; border-radius:8px;
}
.menu li a:hover{ background:#f6f6f6; }
</style>
