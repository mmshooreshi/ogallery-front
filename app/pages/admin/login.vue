<template>
  <div class="min-h-screen grid place-items-center p-6">
    <form @submit.prevent="onSubmit" class="w-full max-w-sm border rounded-2xl p-6 shadow">
      <h1 class="text-2xl font-semibold mb-4">Admin Login</h1>
      <label class="block text-sm mb-2">Password</label>
      <input v-model="password" type="password" class="w-full border rounded px-3 py-2 mb-4" />
      <button class="w-full rounded px-3 py-2 bg-black text-white">Sign in</button>
      <p v-if="error" class="text-red-600 text-sm mt-3">{{ error }}</p>
    </form>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: 'admin-auth' })
const route = useRoute(); const router = useRouter(); const { login } = useAdminAuth()
const password = ref(''); const error = ref('')
async function onSubmit() {
  error.value = ''
  try { await login(password.value); router.replace((route.query.next as string) || '/admin') }
  catch (e: any) { error.value = e.message || 'Login failed' }
}
</script>
