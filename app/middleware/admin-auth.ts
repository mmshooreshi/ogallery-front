// export default defineNuxtRouteMiddleware((to) => {
//   if (!to.path.startsWith('/admin')) return
//   const { isAuthed } = useAdminAuth()
//   if (!isAuthed.value && to.path !== '/admin/login') {
//     return navigateTo('/admin/login?next=' + encodeURIComponent(to.fullPath))
//   }
// })


// middleware/admin-auth.ts
export default defineNuxtRouteMiddleware(async (to) => {
  if (!to.path.startsWith('/admin') || to.path === '/admin/login') return
  const { error } = await useFetch('/api/admin/session', { credentials: 'include' })
  if (error.value) {
    return navigateTo(`/admin/login?next=${encodeURIComponent(to.fullPath)}`, { replace: true })
  }
})
