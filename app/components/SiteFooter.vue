<!-- app/components/SiteFooter.vue -->
<template>
    <!-- FOOTER -->
    <footer class="foot flex flex-col sm:flex-row ">
        <div class="link">COPYRIGHT © {{ new Date().getFullYear() }} OGALLERY</div>
        <NuxtLink to="/mailing-list" class="link">JOIN OUR MAILING LIST</NuxtLink>

      <div
  @click="openCookieModal"
  class="link cursor-pointer text-[#595a5c] text-md no-underline"
>
  Manage cookies
</div>

    </footer>

    <!-- Backdrop (fade only) -->
<Transition
  enter-active-class="transition-opacity duration-300 ease-out"
  enter-from-class="opacity-0"
  enter-to-class="opacity-100"
  leave-active-class="transition-opacity duration-300 ease-in"
  leave-from-class="opacity-100"
  leave-to-class="opacity-0"
>
  <div
    v-if="showCookieModal"
    class="fixed inset-0 z-40 bg-black/40"
    @click="closeCookieModal"
  ></div>
</Transition>

<!-- COOKIE PREFERENCES MODAL -->
<Transition
  enter-active-class="transform transition-all duration-500 ease-out"
  enter-from-class="-translate-y-full opacity-0"
  enter-to-class="translate-y-0 opacity-100"
  leave-active-class="transform transition-all duration-500 ease-in"
  leave-from-class="translate-y-0 opacity-100"
  leave-to-class="-translate-y-full opacity-0"
>
  <div
    v-if="showCookieModal"
    class="fixed inset-0 z-50 flex items-start justify-center pt-3 md:pt-10"
    aria-modal="true"
    role="dialog"
  >
    <!-- Modal panel -->
    <div class="relative  z-10 bg-white w-full mx-3 md:w-[460px]  border border-1 border-black/40 border-solid shadow-lg p-5 md:p-6 md:pt-0 ">
      <div class="flex flex-row">
        <!-- Close button -->
      <button
        type="button"
        class="absolute cursor-pointer active:border-black border-1 border-transparent hover:text-[#595a5c] right-3 top-3 text-gray-700/50 bg-white md:w-12 md:h-12 w-8 h-8"
        @click="closeCookieModal"
        aria-label="Close"
      >
        <span class="text-2xl md:text-4xl leading-none">&times;</span>
      </button>
<div class="text-black/65">
      <h6 class="text-xl md:text-2xl mt-0 md:mt-6 font-bold mb-1">Cookie Preferences</h6>
      <p class="text-sm mb-4 mt-1">
        Check the boxes for the cookie categories you allow our site to use
      </p>
      </div>
</div>
      <div class="space-y-4 text-sm">
        <!-- Strictly necessary -->
        <div class="cookie-section">
          <div class="flex items-center gap-2 ">
            <input
              id="Strictly"
              type="checkbox"
              class="accent-[#0d6efd] form-check-input-strict"
              checked
              disabled
            >
            <label for="Strictly" class="font-medium text-lg  text-black/45">
              Strictly necessary
            </label>
          </div>
          <p class="mt-1 text-sm text-gray-600">
            Required for the website to function and cannot be disabled.
          </p>
        </div>

        <!-- Preferences and functionality -->
        <div class="cookie-section">
          <div class="flex items-center gap-2 ">
            <input
      id="functionality"
      type="checkbox"
      class="accent-[#0d6efd] form-check-input"
      v-model="cookiePrefs.functionality"
            >
            <label for="functionality" class="font-medium text-lg cursor-pointer text-black/65">
              Preferences and functionality
            </label>
          </div>
          <p class="mt-1 text-sm text-gray-600">
            Improve your experience on the website by storing choices you make about how it should function.
          </p>
        </div>

        <!-- Statistics -->
        <div class="cookie-section">
          <div class="flex items-center gap-2 ">
            <input
      id="statistics"
      type="checkbox"
      class="accent-[#0d6efd] form-check-input"
      v-model="cookiePrefs.statistics"
            >
            <label for="statistics" class="font-medium text-lg cursor-pointer text-black/65">
              Statistics
            </label>
          </div>
          <p class="mt-1 text-sm text-gray-600">
            Allow us to collect anonymous usage data in order to improve the experience on our website.
          </p>
        </div>

        <!-- Marketing -->
        <div class="cookie-section">
          <div class="flex items-center gap-2 ">
            <input
      id="marketing"
      type="checkbox"
      class="accent-[#0d6efd] form-check-input"
      v-model="cookiePrefs.marketing"
            >
            <label for="marketing" class="font-medium text-lg cursor-pointer text-black/65">
              Marketing
            </label>
          </div>
          <p class="mt-1 text-sm text-gray-600">
            Allow us to identify our visitors so that we can offer personalised, targeted marketing.
          </p>
        </div>
      </div>

      <button
        type="button"
        id="cookie-save"
        class="btn btn-warning btn-sm mt-3 px-3 py-2 bg-[#f6c800]/80 hover:bg-[#f6c800] active:border-black border-transparent text-black text-sm rounded-none border-1 cursor-pointer"
        @click="saveCookiePreferences"
      >
        Save Preferences
      </button>
    </div>
  </div>
</Transition>

</template>

<script setup lang="ts">
const COOKIE_ACCEPTED_KEY = 'cookie-accepted'
const COOKIE_PREF_KEY = 'cookie-preferences'

// Banner visibility (if you still use this here)
const showCookies = ref(false)

// Cookie preferences state
const cookiePrefs = ref({
  necessary: true,
  functionality: true,
  statistics: true,
  marketing: true,
})

// On mount: load from localStorage
onMounted(() => {
  // old banner logic
  showCookies.value = !localStorage.getItem(COOKIE_ACCEPTED_KEY)

  const stored = localStorage.getItem(COOKIE_PREF_KEY)
  if (stored) {
    try {
      const parsed = JSON.parse(stored)
      cookiePrefs.value = {
        ...cookiePrefs.value,
        ...parsed,
      }
    } catch (e) {
      // corrupted JSON? ignore and keep defaults
      console.error('Invalid cookie prefs in localStorage', e)
    }
  }
})

function acceptCookies () {
  localStorage.setItem(COOKIE_ACCEPTED_KEY, '1')
  showCookies.value = false
}

// Cookie preferences modal
const showCookieModal = ref(false)

function openCookieModal () {
  showCookieModal.value = true
}

function closeCookieModal () {
  showCookieModal.value = false
}

function saveCookiePreferences () {
  localStorage.setItem(COOKIE_PREF_KEY, JSON.stringify(cookiePrefs.value))
  localStorage.setItem(COOKIE_ACCEPTED_KEY, '1') // counts as consent too
  showCookies.value = false                      // hide banner if used
  closeCookieModal()
}

</script>

<style scoped>

/* Footer */
.foot {
  /* margin-top: 24px;  */
  /* border-top:1px solid rgba(0,0,0,.08); */
  margin-top: 8px;
  /* padding: 28px 12px 40px; text-align:center; */
  padding-bottom: 8px;
  color:#666; 
  
  justify-content:space-between; align-items :center;
  width: min-content; text-wrap: nowrap; gap: 24px;
  margin-inline: auto; 

  /* display: inline-block; */
    /* align-items: center; */
    direction: ltr;
    letter-spacing: 2.5px;
    text-transform: uppercase;
    font-size: .8rem;
    color: var(--bs-dark) !important;
    font-family: dosis;
    font-weight: 400;
    text-decoration: none;
}
.foot .link { display:block; margin-bottom:16px;  color:#666;  text-decoration: none; }
.form-check-input, .form-check-input-strict {
    cursor: pointer;
  --bs-form-check-bg: #fff;
  --bs-border-width: 1px;
  --bs-border-color: #ced4da;
  --bs-form-check-bg-image: none;
  flex-shrink: 0;
  width: 1em;
  height: 1em;
  margin-top: .25em;
  vertical-align: top;
  appearance: none;
  background-color: var(--bs-form-check-bg);
  background-image: var(--bs-form-check-bg-image);
  background-repeat: no-repeat;
  background-position: center;
  background-size: contain;
  border: var(--bs-border-width) solid var(--bs-border-color);
  print-color-adjust: exact;
}

.form-check-input[type=checkbox] {
  border-radius: .25em;
    width: 16px;
  height: 16px;

}

.form-check-input:checked {
  background-color: #0d6efd;
  border-color: #0d6efd;
}

.form-check-input-strict{
    cursor: default;
      background-color: #0d6dfd70;
    border-color: #0000003e;
      width: 16px;
  height: 16px;
    border-radius: .25em;
  --bs-form-check-bg-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20'%3e%3cpath fill='none' stroke='%23fff' stroke-linecap='round' stroke-linejoin='round' stroke-width='3' d='m6 10 3 3 6-6'/%3e%3c/svg%3e");



}
.form-check-input:checked[type=checkbox] {
  --bs-form-check-bg-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20'%3e%3cpath fill='none' stroke='%23fff' stroke-linecap='round' stroke-linejoin='round' stroke-width='3' d='m6 10 3 3 6-6'/%3e%3c/svg%3e");
}

</style>





