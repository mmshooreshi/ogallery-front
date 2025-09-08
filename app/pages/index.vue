<!-- <template>
  <section>
    <h1 class="text-3xl font-semibold mb-4">O Gallery</h1>
    <p class="opacity-70">Starter homepage. Wire featured exhibitions & news here.</p>
  </section>
</template>

 -->
<!-- app/pages/index.vue -->
<script setup lang="ts">
useSeoMeta({ title: 'Home' })

// Content (fetch all, sort client-side)
const { data: exAll } = await useAsyncData('exhibitions', () => queryCollection('exhibitions').all())
const { data: newsAll } = await useAsyncData('news', () => queryCollection('news').all())

const currentEx = computed(() => {
  const list = (exAll.value ?? []).slice()
  list.sort((a: any, b: any) => String(b?.startDate || '').localeCompare(String(a?.startDate || '')))
  return list.find((x: any) => x?.status === 'current') || list[0]
})
const heroImage = computed(() => currentEx.value?.images?.[0] || '/images/placeholder-hero.jpg')
const heroTitle = computed(() => currentEx.value?.title || '')
const heroArtist = computed(() => (currentEx.value?.artists?.[0] || '').toUpperCase())
const heroDates = computed(() => {
  const s = currentEx.value?.startDate || '', e = currentEx.value?.endDate || ''
  return s && e ? `${prettyDate(s)} – ${prettyDate(e)}` : s || e || ''
})

const news = computed(() => {
  const list = (newsAll.value ?? []).slice()
  list.sort((a: any, b: any) => String(b?.date || '').localeCompare(String(a?.date || '')))
  return list.slice(0, 6)
})

// Cookie banner
const showCookies = ref(false)
onMounted(() => { showCookies.value = !localStorage.getItem('cookie-accepted') })
function acceptCookies () {
  localStorage.setItem('cookie-accepted', '1')
  showCookies.value = false
}

// Helpers
function prettyDate(iso: string) {
  const [y, m, d] = iso.split('-').map(Number)
  const dt = new Date(Date.UTC(y, (m || 1) - 1, d || 1))
  return dt.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }).toUpperCase()
}
</script>

<template>
  <main class="home">
    <!-- HERO -->
    <section class="hero">
      <!-- <NuxtImg :src="heroImage" alt="" class="hero__img" sizes="100vw" placeholder /> -->
      <NuxtImg :src="heroImage || '/images/ph-hero.svg'" class="hero__img" alt="" />

      <div class="hero__overlay"></div>
      <div class="hero__content">
        <p v-if="heroArtist" class="hero__artist">{{ heroArtist }}</p>
        <h1 class="hero__title">
          <span>{{ heroTitle }}</span>
          <!-- <span v-if="currentEx?.subtitle" class="hero__subtitle">{{ currentEx.subtitle }}</span> -->
        </h1>
        <p v-if="heroDates" class="hero__dates">{{ heroDates }}</p>
        <div class="hero__bar"></div>
      </div>
    </section>

    <!-- COOKIE BANNER -->
    <transition name="fade">
      <div v-if="showCookies" class="cookie">
        <h3 class="cookie__title">This website uses cookies</h3>
        <p class="cookie__text">
          This site uses cookies to help make it more useful to you. Please contact us to find out more about our Cookie Policy.
        </p>
        <div class="cookie__actions">
          <NuxtLink to="/cookies" class="link">Manage cookies</NuxtLink>
          <button @click="acceptCookies" class="btn">Accept</button>
        </div>
      </div>
    </transition>

    <!-- NEWS LIST -->
    <section class="news">
      <article v-for="n in news" :key="n.slug" class="news__item">
        <div class="news__text">
          <h2 class="news__title">{{ n.title }}</h2>
          <p class="news__date">
            {{ new Date(n.date || '').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) }}
          </p>
          <p class="news__teaser">
            {{ n.teaser  || '' }}
          </p>
          <NuxtLink :to="`/news/${n.slug}`" class="link">Read More</NuxtLink>
        </div>
        <!-- <NuxtImg
          v-if="n.coverImage"
          :src="n.coverImage"
          alt=""
          class="news__image"
          sizes="(max-width: 760px) 100vw, 280px"
          placeholder
        /> -->
        <NuxtImg :src="n.coverImage || '/images/ph-thumb.svg'" class="news__image" alt="" />

      </article>
    </section>

    <!-- FOOTER -->
    <footer class="foot">
      <div>COPYRIGHT © {{ new Date().getFullYear() }} OGALLERY</div>
      <NuxtLink to="/mailing-list" class="link">JOIN OUR MAILING LIST</NuxtLink>
      <NuxtLink to="/cookies" class="link">MANAGE COOKIES</NuxtLink>
    </footer>
  </main>
</template>

<style scoped>
/* Layout */
.home { display:flex; flex-direction:column; }

/* HERO */
.hero { position:relative; height:78vh; min-height:520px; width:100%; overflow:hidden; }
.hero__img { position:absolute; inset:0; width:100%; height:100%; object-fit:cover; }
.hero__overlay { position:absolute; inset:0; background:linear-gradient(to top, rgba(0,0,0,.55), rgba(0,0,0,.25), rgba(0,0,0,0)); }
.hero__content {
  position:absolute; inset-inline:0; bottom:0;
  padding: 0 16px 40px; max-width: 680px; margin-left:auto; text-align:right; color:#fff;
}
@media (min-width: 640px){ .hero__content{ padding-inline:24px; } }
@media (min-width: 960px){ .hero__content{ padding-inline:40px; } }
.hero__artist { letter-spacing:.08em; font-size:12px; opacity:.95; margin:0 0 6px; }
.hero__title { font-weight:600; line-height:1.15; margin:0; font-size:clamp(28px,5vw,48px); }
.hero__subtitle { display:block; margin-top:8px; font-size:clamp(14px,2vw,18px); opacity:.9; }
.hero__dates { margin:10px 0 0; font-size:11px; letter-spacing:.18em; opacity:.9; }
.hero__bar { margin:18px 0 0 auto; height:3px; width:56px; background:#f6c800; border-radius:2px; }

/* Cookie banner */
.cookie {
  position:fixed; left:50%; transform:translateX(-50%);
  right:auto; bottom:12px; z-index:50;
  background:#fff; border:1px solid rgba(0,0,0,.1); border-radius:12px;
  box-shadow:0 6px 24px rgba(0,0,0,.12);
  padding:16px; width:min(640px, 94vw);
}
.cookie__title { margin:0 0 6px; font-weight:600; }
.cookie__text { margin:0; font-size:14px; opacity:.85; }
.cookie__actions { display:flex; align-items:center; gap:12px; margin-top:10px; }
.btn { border:1px solid #ccc; border-radius:8px; padding:6px 12px; font-size:14px; background:#fff; cursor:pointer; }
.btn:hover{ background:#f6f6f6; }
.link { 
  /* text-decoration:underline;  */
  text-decoration: none;
  color:inherit; }

/* Fade transition */
.fade-enter-active,.fade-leave-active { transition:opacity .2s ease; }
.fade-enter-from,.fade-leave-to { opacity:0; }

/* News */
.news { padding: 24px 16px 32px; }
@media (min-width: 640px){ .news{ padding-inline:24px; } }
@media (min-width: 960px){ .news{ padding-inline:40px; } }
.news__item {
  display:grid; grid-template-columns: 1fr; gap:18px; align-items:flex-start;
  padding:24px 0; border-bottom:1px solid rgba(0,0,0,.06);
}
@media (min-width: 760px){
  .news__item { grid-template-columns: 1fr 280px; }
}
.news__title { margin:0; font-size:20px; font-weight:600; }
.news__date { margin:6px 0 0; font-size:12px; opacity:.7; }
.news__teaser { margin:12px 0 14px; line-height:1.7; opacity:.9; }
.news__image { width:100%; height:190px; object-fit:cover; border-radius:8px; }
@media (min-width: 900px){ .news__image{ height:210px; } }

/* Footer */
.foot {
  /* margin-top: 24px;  */
  /* border-top:1px solid rgba(0,0,0,.08); */
  margin-top: 0px;
  padding: 28px 12px 40px; text-align:center;
  color:#666; font-size:12px; letter-spacing:.18em;
  display: flex; justify-content:space-between; align-items :baseline;
  width: min-content; text-wrap: nowrap; gap: 30px;
  margin: auto; font-family: monospace;
}
.foot .link { display:block; margin-top:10px; }
</style>
