// app/composables/useAdminAuth.ts

// const ADMIN_PASSWORD = 'change-me-now'
// const TOKEN_COOKIE = 'admin_token'
// const TOKEN_TTL_MIN = 60

// function tokenGen(len = 32) {
//   const a = new Uint8Array(len); crypto.getRandomValues(a)
//   return Array.from(a, b => b.toString(16).padStart(2, '0')).join('')
// }

// export function useAdminAuth() {
//   const token = useCookie<string | null>(TOKEN_COOKIE, {
//     sameSite: 'lax', secure: false, httpOnly: false, maxAge: TOKEN_TTL_MIN * 60
//   })
//   const isAuthed = computed(() => Boolean(token.value))
//   async function login(password: string) {
//     if (password !== ADMIN_PASSWORD) throw new Error('Invalid password')
//     token.value = tokenGen()
//     return true
//   }
//   function logout() { token.value = null }
//   return { isAuthed, login, logout }
// }




// composables/useAdminAuth.ts
export function useAdminAuth() {
  const me = useState<{ email: string; role: string } | null>('admin/me', () => null)

  async function refresh() {
    const { data, error } = await useFetch('/api/admin/session', { credentials: 'include' })
    me.value = error.value ? null : (data.value as any)
    return me.value
  }

  async function login(email: string, password: string) {
    await $fetch('/api/admin/session', {
      method: 'POST',
      body: { email, password },
      credentials: 'include',
    })
    return refresh()
  }

  async function logout() {
    await $fetch('/api/admin/session', { method: 'DELETE', credentials: 'include' })
    me.value = null
  }

  return { me, refresh, login, logout }
}
