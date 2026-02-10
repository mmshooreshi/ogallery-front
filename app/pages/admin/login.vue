<!-- app/pages/admin/login.vue -->
<template>
  <div class="min-h-[100dvh] grid place-items-center bg-[var(--ui-bg,#fafafa)] px-5">
    <section class="w-full max-w-md rounded-2xl border shadow-sm bg-white p-6">
      <header class="mb-5">
        <h1 class="text-2xl font-semibold tracking-tight">Sign in to Admin</h1>
        <p class="text-sm text-gray-500">Use your administrator credentials.</p>
      </header>

      <form class="grid gap-4" @submit.prevent="onSubmit">
        
        <div class="w-fill">
          <label class="block text-sm font-medium mb-1" for="email">Email</label>
          <input
            id="email" v-model.trim="email" type="email" autocomplete="username" required
            class="w-full box-border  border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black/70"
            placeholder="you@domain.com"
          />
        </div>

        <div>
          <label class="block text-sm font-medium mb-1" for="password">Password</label>
          <div class="flex gap-2">
            <input
              id="password" v-model="password" :type="reveal ? 'text' : 'password'"
              autocomplete="current-password" required
              class="flex-1 border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black/70"
              placeholder="••••••••"
            />
            <button
              type="button" @click="reveal = !reveal" :aria-pressed="reveal"
              class="border rounded-lg px-3 py-2 hover:bg-gray-50"
            >
              {{ reveal ? 'Hide' : 'Show' }}
            </button>
          </div>
        </div>

        <p v-if="err" class="text-sm text-red-600 -mt-1">{{ err }}</p>

        <button
          type="submit" :disabled="busy"
          class="h-10 rounded-lg bg-black text-white hover:opacity-95 disabled:opacity-60"
        >
          <span v-if="!busy">Sign in</span>
          <span v-else class="inline-flex items-center gap-2">
            <svg class="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" stroke-opacity=".25" stroke-width="4"/><path d="M22 12a10 10 0 0 1-10 10" fill="none" stroke="currentColor" stroke-width="4"/></svg>
            Signing in…
          </span>
        </button>
      </form>

      <footer class="mt-6 text-xs text-gray-500">
        Session lasts ~1 hour. You can close this tab safely.
      </footer>
    </section>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: false })

const route = useRoute()
const router = useRouter()
const { login, refresh } = useAdminAuth()

const email = ref('')
const password = ref('')
const reveal = ref(false)
const busy = ref(false)
const err = ref('')

onMounted(async () => {
  const me = await refresh()
  if (me) router.replace((route.query.next as string) || '/admin/dashboard')
})

async function onSubmit() {
  err.value = ''
  busy.value = true
  try {
    await login(email.value, password.value)
    router.replace((route.query.next as string) || '/admin/dashboard')
  } catch (e: any) {
    err.value = e?.data?.message || e?.message || 'Invalid email or password'
  } finally {
    busy.value = false
  }
}
</script>
